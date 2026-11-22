// Outbox + sync engine.
//  - writes made offline (or while others are pending) are stored in IndexedDB and replayed in order
//  - every replay carries an Idempotency-Key so a retry can never create a duplicate
//  - temp ids (tmp_...) are swapped for the server ids as soon as the server answers
//  - afterwards the cached GETs are re-pulled so this device converges to server state
import { idb } from './db';
import { network } from './network';
import { cache, optimistic, scope } from './cache';
import { isTempId } from './util';

let send = null; // injected by api/client.js (goes through auth + token refresh)
let ops = []; // in-memory mirror of the outbox store
let idMap = {};
let running = false;
let refreshing = false;
let lastSyncedAt = null;
let seqCounter = 0;
let backoffTimer = null;
let snapshot = null;
const listeners = new Set();
const refreshListeners = new Set();

const mine = () => ops.filter((o) => o.scope === scope());
const pendingOps = () => mine().filter((o) => o.status === 'pending');
const failedOps = () => mine().filter((o) => o.status === 'failed');

function emit() {
  snapshot = null;
  listeners.forEach((fn) => fn());
}

async function persist(op) {
  await idb.put('outbox', op).catch(() => {});
}

async function load() {
  ops = (await idb.all('outbox').catch(() => [])) || [];
  ops.sort((a, b) => a.seq - b.seq);
  const meta = await idb.get('meta', 'idmap').catch(() => null);
  idMap = meta?.map || {};
  emit();
}

function remap(op) {
  let json = JSON.stringify({ url: op.url, body: op.body });
  for (const [tmp, real] of Object.entries(idMap)) json = json.split(tmp).join(real);
  const out = JSON.parse(json);
  const stillTemp = json.match(/tmp_[0-9a-f-]{36}/);
  return { ...out, unresolved: stillTemp ? stillTemp[0] : null };
}

async function processOutbox() {
  if (running || !send) return;
  running = true;
  emit();
  try {
    for (const op of pendingOps()) {
      const prepared = remap(op);
      if (prepared.unresolved) {
        // depends on a record that never reached the server
        op.status = 'failed';
        op.error = 'Depends on a change that could not be synced';
        await persist(op);
        continue;
      }
      try {
        const res = await send({
          method: op.method,
          url: prepared.url,
          params: op.params,
          data: prepared.body,
          headers: { 'Idempotency-Key': op.id, 'X-Client-Created-At': op.createdAt },
        });
        network.reportSuccess();
        const item = res?.data?.data;
        if (op.tempId && item?.id != null) {
          idMap[op.tempId] = String(item.id);
          await idb.put('meta', { key: 'idmap', map: idMap });
          await optimistic.replaceId(op.tempId, item);
        }
        ops = ops.filter((o) => o.id !== op.id);
        await idb.del('outbox', op.id).catch(() => {});
        emit();
      } catch (err) {
        if (!err.status) {
          network.reportFailure();
          break;
        }
        if (err.status === 401) break; // session problem: keep the data, client.js sends the user to login
        if (err.status >= 500 || err.status === 408 || err.status === 429) {
          op.attempts = (op.attempts || 0) + 1;
          await persist(op);
          scheduleRetry(op.attempts);
          break;
        }
        // 4xx: the server rejected it for good (validation, conflict, record deleted elsewhere…)
        op.status = 'failed';
        op.error = err.message;
        op.httpStatus = err.status;
        await persist(op);
        emit();
      }
    }
  } finally {
    running = false;
    emit();
  }
  if (pendingOps().length === 0) await refreshCache(true);
}

function scheduleRetry(attempts) {
  clearTimeout(backoffTimer);
  backoffTimer = setTimeout(kick, Math.min(60000, 2 ** attempts * 1000));
}

// Re-pull what the user has looked at, so changes made on other devices show up here.
async function refreshCache(force = false) {
  if (refreshing || !send || !network.isOnline() || pendingOps().length > 0) return;
  if (!force && lastSyncedAt && Date.now() - lastSyncedAt < 10000) return;
  refreshing = true;
  let changed = false;
  try {
    const entries = (await cache.entries())
      .filter((e) => !e.path.includes('tmp_') && !/^\/(auth|ai|images)/.test(e.path))
      .sort((a, b) => b.savedAt - a.savedAt)
      .slice(0, 40);
    for (let i = 0; i < entries.length; i += 4) {
      await Promise.all(
        entries.slice(i, i + 4).map(async (e) => {
          try {
            const res = await send({ method: 'get', url: e.path, params: e.params });
            if (JSON.stringify(res.data) !== JSON.stringify(e.data)) {
              changed = true;
              await cache.put(e.path, e.params, res.data);
            }
          } catch (err) {
            if (!err.status) throw err;
          }
        }),
      );
    }
    lastSyncedAt = Date.now();
    network.reportSuccess();
  } catch {
    network.reportFailure();
  } finally {
    refreshing = false;
    emit();
  }
  if (changed) refreshListeners.forEach((fn) => fn());
}

export function kick() {
  if (network.isOnline()) processOutbox();
}

export const engine = {
  configure(opts) {
    send = opts.send;
  },
  pendingCount: () => pendingOps().length,
  async enqueue(op) {
    op.seq = Date.now() * 1000 + (seqCounter++ % 1000);
    op.scope = scope();
    ops.push(op);
    await persist(op);
    emit();
    kick();
  },
  async retry(id) {
    const op = ops.find((o) => o.id === id);
    if (op) {
      op.status = 'pending';
      op.error = null;
      await persist(op);
      emit();
      kick();
    }
  },
  async discard(id) {
    ops = ops.filter((o) => o.id !== id);
    await idb.del('outbox', id).catch(() => {});
    emit();
    refreshCache(true); // pull server truth over the discarded optimistic change
  },
  syncNow: () => (pendingOps().length ? processOutbox() : refreshCache(true)),
  reload: load,
  subscribe(fn) {
    listeners.add(fn);
    return () => listeners.delete(fn);
  },
  onRefresh(fn) {
    refreshListeners.add(fn);
    return () => refreshListeners.delete(fn);
  },
  // stable object between emits (required by useSyncExternalStore)
  getSnapshot() {
    if (!snapshot) {
      snapshot = {
        online: network.isOnline(),
        syncing: running || refreshing,
        pending: pendingOps().length,
        failed: failedOps(),
        lastSyncedAt,
      };
    }
    return snapshot;
  },
  start() {
    load().then(kick);
    network.subscribe((on) => {
      emit();
      if (on) kick();
    });
    if (typeof window === 'undefined') return;
    const onFocus = () => document.visibilityState === 'visible' && (pendingOps().length ? kick() : refreshCache());
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onFocus);
    setInterval(() => document.visibilityState === 'visible' && (pendingOps().length ? kick() : refreshCache(true)), 30000);
  },
};

export { isTempId };
