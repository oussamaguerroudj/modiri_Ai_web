// Local read-cache of every GET the app has made, plus optimistic edits
// applied to it so the UI shows offline writes immediately.
import { idb } from './db';
import { pathOf, snakeKeys } from './util';

export function scope() {
  try {
    const u = JSON.parse(localStorage.getItem('modiri.user') || 'null');
    return String(u?.id ?? 'anon');
  } catch {
    return 'anon';
  }
}

const stable = (p) =>
  JSON.stringify(Object.entries(p || {}).filter(([, v]) => v !== undefined && v !== '').sort(([a], [b]) => a.localeCompare(b)));
const keyFor = (url, params) => `${scope()}|${pathOf(url)}|${stable(params)}`;

export const cache = {
  get: (url, params) => idb.get('cache', keyFor(url, params)).catch(() => null),
  async put(url, params, data) {
    await idb.put('cache', { key: keyFor(url, params), scope: scope(), path: pathOf(url), params, data, savedAt: Date.now() });
  },
  async entries() {
    const s = scope();
    return (await idb.all('cache').catch(() => [])).filter((e) => e.scope === s);
  },
  async clearScope() {
    const s = scope();
    for (const e of await idb.all('cache').catch(() => [])) if (e.scope === s) await idb.del('cache', e.key);
  },
};

const isList = (e) => Array.isArray(e.data?.data);
const same = (a, b) => String(a) === String(b);

async function mutate(fn) {
  for (const e of await cache.entries()) {
    const next = fn(e);
    if (next === undefined) continue;
    if (next === null) await idb.del('cache', e.key);
    else {
      if (next.key !== e.key) await idb.del('cache', e.key);
      await idb.put('cache', next);
    }
  }
}

export const optimistic = {
  async create(collection, item) {
    await mutate((e) => (e.path === collection && isList(e) ? { ...e, data: { ...e.data, data: [item, ...e.data.data] } } : undefined));
  },

  // returns the merged item (from a detail or list entry) when found
  async update(collection, id, patch) {
    let merged = null;
    await mutate((e) => {
      if (e.path === collection && isList(e) && e.data.data.some((it) => same(it.id, id))) {
        const list = e.data.data.map((it) => (same(it.id, id) ? (merged = { ...it, ...patch, __pending: true }) : it));
        return { ...e, data: { ...e.data, data: list } };
      }
      if (e.path === `${collection}/${id}` && e.data?.data && !isList(e)) {
        merged = { ...e.data.data, ...patch, __pending: true };
        return { ...e, data: { ...e.data, data: merged } };
      }
      return undefined;
    });
    return merged || { id, ...patch };
  },

  async remove(collection, id) {
    await mutate((e) => {
      if (e.path === collection && isList(e)) return { ...e, data: { ...e.data, data: e.data.data.filter((it) => !same(it.id, id)) } };
      if (e.path === `${collection}/${id}`) return null;
      return undefined;
    });
  },

  // A sale consumes stock: reflect it in cached product lists/details straight away.
  async adjustStock(items = [], sign = -1) {
    const delta = new Map(items.map((i) => [String(i.productId), Number(i.quantity) || 0]));
    const bump = (p) => (delta.has(String(p.id)) ? { ...p, quantity: Number(p.quantity) + sign * delta.get(String(p.id)) } : p);
    await mutate((e) => {
      if (e.path === '/products' && isList(e)) return { ...e, data: { ...e.data, data: e.data.data.map(bump) } };
      if (/^\/products\/[^/]+$/.test(e.path) && e.data?.data?.id != null) return { ...e, data: { ...e.data, data: bump(e.data.data) } };
      return undefined;
    });
  },

  // After the server created the record: swap placeholder for the real row,
  // and rewrite every other reference to the temp id inside the cache.
  async replaceId(tempId, serverItem) {
    const realId = String(serverItem.id);
    await mutate((e) => {
      let data = e.data;
      if (isList(e)) data = { ...data, data: data.data.map((it) => (it.id === tempId ? serverItem : it)) };
      let json = JSON.stringify(data);
      const path = e.path.replace(tempId, realId);
      if (json.includes(tempId) || path !== e.path) {
        json = json.split(tempId).join(realId);
        return { ...e, key: e.key.replace(tempId, realId), path, data: JSON.parse(json) };
      }
      return data !== e.data ? { ...e, data } : undefined;
    });
  },
};

export { snakeKeys };
