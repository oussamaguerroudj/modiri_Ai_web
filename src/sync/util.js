export const uuid = () =>
  globalThis.crypto?.randomUUID
    ? crypto.randomUUID()
    : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0;
        return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
      });

export const TMP_PREFIX = 'tmp_';
export const isTempId = (v) => typeof v === 'string' && v.startsWith(TMP_PREFIX);
export const newTempId = () => TMP_PREFIX + uuid();

// "id-looking" path segment: uuid, integer, or one of our temp ids.
export const isIdSegment = (s) =>
  /^(tmp_[0-9a-f-]+|\d+|[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$/i.test(s);

export const toSnake = (k) => k.replace(/[A-Z]/g, (c) => '_' + c.toLowerCase());
export const snakeKeys = (obj) =>
  Object.fromEntries(Object.entries(obj || {}).map(([k, v]) => [toSnake(k), v]));

export const pathOf = (url = '') => url.split('?')[0].replace(/\/+$/, '') || '/';
