import { useEffect, useRef, useSyncExternalStore } from 'react';
import { engine } from './engine';

export function useSyncStatus() {
  return useSyncExternalStore(engine.subscribe, engine.getSnapshot, engine.getSnapshot);
}

// Re-run a page's loader whenever fresh data from another device (or from a
// finished sync) changed what this device has cached.
export function useSyncRefresh(loader) {
  const ref = useRef(loader);
  ref.current = loader;
  useEffect(() => engine.onRefresh(() => ref.current && ref.current()), []);
}
