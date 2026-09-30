export function formatMoney(value, currency = 'DZD') {
  const num = Number(value) || 0;
  const locale = typeof document !== 'undefined' ? document.documentElement.lang || 'en' : 'en';
  return `${num.toLocaleString(locale, { maximumFractionDigits: 2 })} ${currency}`;
}
