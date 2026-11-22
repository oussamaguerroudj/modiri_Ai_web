# Modiri — offline & multi-device sync

## What was wrong
The web app called the REST API directly (no local copy, no queue), so offline = broken, and any
offline edit on mobile never reached the web (or the other way round). Nothing guaranteed the same data everywhere.

## What this delivery adds (web, `src/sync/`)
| File | Role |
|---|---|
| `adapter.js` | axios adapter: GET = network first, local copy if unreachable. Writes = sent live, or queued + shown instantly when offline. **No page needed rewriting.** |
| `cache.js` | IndexedDB copy of every GET + optimistic edits (create/update/delete, stock decrement on sale) |
| `engine.js` | Outbox replayed in order, `Idempotency-Key` on every write, `tmp_…` ids → real ids, retry/backoff, then re-pull of cached data. Pull runs on reconnect, on tab focus, every 30 s |
| `network.js` | Real connectivity (probes the API, not just `navigator.onLine`) |
| `SyncStatusBar.jsx` | Offline / pending / failed banner with Retry + Discard |
| `public/sw.js` | Lets the app shell open with no network (production build) |
| `tests/sync.test.js` | Offline create + sale + edit → reconnect → server and cache converge (passes) |

Rules: while local changes are pending the screen shows the local view; once drained it re-pulls and shows server truth.
Logout wipes cached reads but **keeps unsynced writes** for that user.

## Backend changes needed for guaranteed consistency (not in this zip)
1. **Idempotency**: table `idempotency_keys(user_id, key, status, body)`, unique `(user_id,key)`. On POST/PUT/PATCH/DELETE with
   `Idempotency-Key`: if seen, return the stored response; else run in a transaction and store it. Without this a retry after a
   timeout can create duplicates (e.g. a sale counted twice).
2. **Client-generated UUID ids** accepted on create (`id` in body). This removes the `tmp_` remapping entirely and is the
   cleanest option for Flutter too.
3. **Every table**: `updated_at` (trigger), `deleted_at` (soft delete, never hard delete), `version int`.
4. **`GET /sync/pull?cursor=N`**: returns all rows changed since a monotonic `change_seq` (incl. tombstones) + new cursor.
   Replaces the web's "re-fetch cached endpoints" and gives mobile a cheap delta sync.
5. **Stock = movements, not overwrites**: clients send `{delta:-3}` / sales; the server applies it. Never `PUT quantity: 17`
   from an offline device — two devices selling the same item offline would otherwise overwrite each other.
6. **Conflicts**: sales/orders/payments are append-only (no conflict). Other edits: last-write-wins per field, or `If-Match: version`
   → `409` (the web shows it in the failed list with Retry/Discard).
7. Optional real-time: SSE `/events` that just says "changed, pull now".

## Flutter app (same protocol, so both sides agree)
- Drift is the **only** thing screens read; a `SyncService` is the only thing that talks to the API.
- Writes: insert into Drift + a `sync_queue` row (`id` = the Idempotency-Key, method, path, body, createdAt, attempts).
- On `connectivity_plus` change / app resume / every ~30 s: drain the queue in order, then `GET /sync/pull?cursor=` and upsert into Drift (skip rows with a pending queue entry).
- Use the same UUID ids and the same endpoints as above.

## Known limits of the web layer
- First login and first load of each screen need a connection (nothing cached yet).
- Server-computed screens (dashboard KPIs, reports) show the last synced values offline.
- AI assistant/scanner, image upload and auth need the server.
- Two tabs open: both may replay; idempotency keys (backend item 1) make that safe.
