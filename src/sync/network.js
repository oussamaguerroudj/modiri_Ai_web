// Real connectivity state. navigator.onLine only says "has a network interface",
// so while "offline" we also probe the API to detect when the server is reachable again.
let probeUrl = '';
let online = typeof navigator === 'undefined' ? true : navigator.onLine;
const listeners = new Set();
let probeTimer = null;

function set(next) {
  if (next === online) return;
  online = next;
  listeners.forEach((fn) => fn(online));
  if (online) stopProbe();
  else startProbe();
}

async function probe() {
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 5000);
    // no-cors: any reachable server gives an opaque response, unreachable rejects.
    await fetch(probeUrl, { method: 'GET', mode: 'no-cors', cache: 'no-store', signal: ctrl.signal });
    clearTimeout(t);
    set(true);
  } catch {
    /* still offline */
  }
}
function startProbe() {
  if (!probeTimer) probeTimer = setInterval(probe, 8000);
}
function stopProbe() {
  clearInterval(probeTimer);
  probeTimer = null;
}

if (typeof window !== 'undefined') {
  window.addEventListener('online', () => probe());
  window.addEventListener('offline', () => set(false));
  if (!online) startProbe();
}

export const network = {
  configure: (url) => {
    probeUrl = url;
  },
  isOnline: () => online,
  // Called by the adapter when a request failed with no HTTP response.
  reportFailure: () => set(false),
  reportSuccess: () => set(true),
  subscribe(fn) {
    listeners.add(fn);
    return () => listeners.delete(fn);
  },
};
