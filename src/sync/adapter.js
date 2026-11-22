// axios adapter that makes the whole REST client offline-capable without touching the pages:
//  GET   network first -> cached copy when the server is unreachable
//  write online -> sent immediately; offline / unreachable -> queued + applied optimistically
import axios from 'axios';
import { network } from './network';
import { cache, optimistic, scope } from './cache';
import { engine } from './engine';
import { uuid, newTempId, isIdSegment, pathOf, snakeKeys } from './util';

const baseAdapter = axios.getAdapter(axios.defaults.adapter);
// Needs the live server by nature (auth, LLM calls, file uploads).
const LIVE_ONLY = [/^\/auth\//, /^\/ai\//, /^\/images/];

function parseBody(d) {
  if (typeof d !== 'string') return d;
  try {
    return JSON.parse(d);
  } catch {
    return d;
  }
}

const synth = (config, data, headers = {}) => ({ data, status: 200, statusText: 'OK', headers, config, request: {} });

function offlineError(config) {
  const err = new Error('You are offline and this data has not been loaded on this device yet.');
  err.config = config;
  err.code = 'ERR_OFFLINE';
  return err; // no .response -> treated as a network error by callers
}

export async function offlineAdapter(config) {
  const method = (config.method || 'get').toLowerCase();
  const path = pathOf(config.url);
  const isForm = typeof FormData !== 'undefined' && config.data instanceof FormData;
  if (config.__bypassOffline || isForm || LIVE_ONLY.some((r) => r.test(path))) return baseAdapter(config);
  return method === 'get' ? handleGet(config) : handleWrite(config, method, path);
}

async function handleGet(config) {
  const hasLocalChanges = engine.pendingCount() > 0;
  const hit = await cache.get(config.url, config.params);

  // While local changes are waiting to sync, the cache IS the truth (it has them applied).
  if (hit && (hasLocalChanges || !network.isOnline())) {
    return synth(config, hit.data, { 'x-served-from': 'local' });
  }
  try {
    const res = await baseAdapter(config);
    network.reportSuccess();
    // Adapters hand back the raw body (a JSON string); axios parses it later. Cache the parsed form.
    cache.put(config.url, config.params, parseBody(res.data)).catch(() => {});
    return res;
  } catch (err) {
    if (err.response) throw err; // real HTTP error (401, 404, 500…)
    network.reportFailure();
    if (hit) return synth(config, hit.data, { 'x-served-from': 'local' });
    throw offlineError(config);
  }
}

async function handleWrite(config, method, path) {
  const key = uuid();
  config.headers.set('Idempotency-Key', key);
  const body = typeof config.data === 'string' && config.data ? JSON.parse(config.data) : config.data || {};

  // Keep ordering: if anything is already queued, new writes queue behind it.
  if (network.isOnline() && engine.pendingCount() === 0) {
    try {
      const res = await baseAdapter(config);
      network.reportSuccess();
      return res;
    } catch (err) {
      if (err.response) throw err;
      network.reportFailure();
    }
  }
  return queueWrite(config, method, path, body, key);
}

async function queueWrite(config, method, path, body, key) {
  const segs = path.split('/').filter(Boolean);
  const idAt = segs.findIndex(isIdSegment);
  const lastIsId = idAt === segs.length - 1;
  const op = { id: key, method, url: config.url, params: config.params, body, createdAt: new Date().toISOString(), attempts: 0, status: 'pending' };
  let item = null;

  if (method === 'post' && idAt === -1) {
    op.tempId = newTempId();
    item = { id: op.tempId, ...snakeKeys(body), created_at: op.createdAt, __pending: true };
    await optimistic.create(path, item);
    if (path === '/sales') await optimistic.adjustStock(body.items, -1);
  } else if ((method === 'put' || method === 'patch') && idAt !== -1) {
    // /products/:id  or an action like /restaurant/orders/:id/status
    item = await optimistic.update('/' + segs.slice(0, idAt).join('/'), segs[idAt], snakeKeys(body));
  } else if (method === 'delete' && lastIsId) {
    await optimistic.remove('/' + segs.slice(0, idAt).join('/'), segs[idAt]);
    item = { id: segs[idAt] };
  }

  await engine.enqueue(op);
  return synth(config, { data: item, queued: true }, { 'x-queued': '1' });
}

export { scope };
