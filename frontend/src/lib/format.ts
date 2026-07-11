// Locale-independent number formatting. Using `Number.toLocaleString()` in SSR-ed
// components risks hydration mismatches when the server and client locales differ,
// so we format with a fixed grouping separator that is identical everywhere.

export function formatNumber(n: number): string {
  return Math.round(n)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}
