// End-to-end check of the offline layer against a tiny fake backend.
import 'fake-indexeddb/auto';
import http from 'node:http';
import { describe, it, expect, beforeAll } from 'vitest';

const store = new Map();
globalThis.localStorage = { getItem: (k) => store.get(k) ?? null, setItem: (k, v) => store.set(k, String(v)), removeItem: (k) => store.delete(k) };
globalThis.window = { addEventListener() {}, location: { href: 'http://localhost/', assign() {} } };
globalThis.document = { visibilityState: 'visible', addEventListener() {} };
Object.defineProperty(globalThis, 'navigator', { value: { onLine: true }, configurable: true });
localStorage.setItem('modiri.user', JSON.stringify({ id: 'u1' }));
localStorage.setItem('modiri.accessToken', 'x');

// ---- fake backend with idempotency -------------------------------------------------
const db = { products: [{ id: 1, name: 'Milk', quantity: 10, selling_price: 100 }], sales: [] };
const seen = new Map();
let nextId = 100;
const hits = [];
function handler(req, res) {
  let raw = '';
  req.on('data', (c) => (raw += c));
  req.on('end', () => {
    const body = raw ? JSON.parse(raw) : {};
    const key = req.headers['idempotency-key'];
    const send = (code, data) => { res.writeHead(code, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(data)); };
    if (req.method !== 'GET') hits.push(`${req.method} ${req.url}`);
    if (key && seen.has(key)) return send(200, seen.get(key));
    let out;
    if (req.method === 'GET' && req.url === '/api/products') return send(200, { data: db.products });
    if (req.method === 'GET' && req.url === '/api/sales') return send(200, { data: db.sales });
    if (req.method === 'POST' && req.url === '/api/products') {
      const p = { id: nextId++, name: body.name, quantity: body.quantity, selling_price: body.sellingPrice };
      db.products.push(p); out = { data: p };
    } else if (req.method === 'POST' && req.url === '/api/sales') {
      for (const i of body.items) {
        const p = db.products.find((x) => String(x.id) === String(i.productId));
        if (!p) return send(404, { error: true, message: 'Product not found' });
        p.quantity -= i.quantity;
      }
      const s = { id: nextId++, items: body.items }; db.sales.push(s); out = { data: s };
    } else if (req.method === 'PUT' && req.url.startsWith('/api/products/')) {
      const p = db.products.find((x) => String(x.id) === req.url.split('/').pop());
      Object.assign(p, { name: body.name ?? p.name }); out = { data: p };
    } else return send(404, { error: true, message: 'nope' });
    if (key) seen.set(key, out);
    send(200, out);
  });
}
let server;
const up = () => new Promise((r) => { server = http.createServer(handler).listen(4999, r); });
const down = () => new Promise((r) => { server.closeAllConnections?.(); server.close(r); });

let api, engine, network;
beforeAll(async () => {
  await up();
  import.meta.env.VITE_API_BASE_URL = 'http://localhost:4999/api';
  ({ apiClient: api } = await import('../src/api/client.js'));
  ({ engine } = await import('../src/sync/engine.js'));
  ({ network } = await import('../src/sync/network.js'));
});

const waitFor = async (fn, ms = 8000) => { const t = Date.now(); while (Date.now() - t < ms) { if (await fn()) return; await new Promise((r) => setTimeout(r, 50)); } throw new Error('timeout'); };

describe('offline sync', () => {
  it('works offline and converges after reconnect', async () => {
    // 1. online read primes the cache
    expect((await api.get('/products')).data.data).toHaveLength(1);

    // 2. server goes away
    await down();
    const list = await api.get('/products');                 // served from cache
    expect(list.headers['x-served-from']).toBe('local');

    // 3. create a product + sell it + rename it, all offline
    const created = (await api.post('/products', { name: 'Bread', quantity: 20, sellingPrice: 40 })).data;
    expect(created.queued).toBe(true);
    const tmp = created.data.id;
    expect(tmp.startsWith('tmp_')).toBe(true);
    await api.post('/sales', { items: [{ productId: tmp, quantity: 3, unitPrice: 40 }, { productId: 1, quantity: 2, unitPrice: 100 }] });
    await api.put(`/products/${tmp}`, { name: 'Baguette' });

    // local view already reflects everything
    const local = (await api.get('/products')).data.data;
    expect(local.find((p) => p.id === tmp).name).toBe('Baguette');
    expect(local.find((p) => p.id === tmp).quantity).toBe(17);
    expect(local.find((p) => p.id === 1).quantity).toBe(8);
    expect(engine.pendingCount()).toBe(3);

    // 4. server returns -> outbox replays in order with remapped ids
    await up();
    network.reportSuccess();
    engine.syncNow();
    await waitFor(() => engine.pendingCount() === 0 && !engine.getSnapshot().syncing);

    expect(hits).toEqual(['POST /api/products', 'POST /api/sales', 'PUT /api/products/100']);
    expect(db.products.find((p) => p.id === 100)).toMatchObject({ name: 'Baguette', quantity: 17 - 0 });
    expect(db.products.find((p) => p.id === 1).quantity).toBe(8);
    expect(db.sales[0].items[0].productId).toBe('100');

    // 5. cache now holds server rows (no temp ids left)
    const after = (await api.get('/products')).data.data;
    expect(JSON.stringify(after)).not.toContain('tmp_');
    expect(after.map((p) => p.id).sort()).toEqual([1, 100]);
  }, 20000);
});
