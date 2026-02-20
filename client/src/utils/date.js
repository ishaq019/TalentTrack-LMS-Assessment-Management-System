// client/src/utils/date.js
export function toMs(dateLike) {
  if (!dateLike) return null;
  const d = dateLike instanceof Date ? dateLike : new Date(dateLike);
  const ms = d.getTime();
  return Number.isFinite(ms) ? ms : null;
}

export function isExpired(expiresAt) {
  const ms = toMs(expiresAt);
  if (!ms) return false;
  return ms <= Date.now();
}

export function fmtDateTime(dateLike) {
  const ms = toMs(dateLike);
  if (!ms) return "—";
  return new Date(ms).toLocaleString();
}

export function fmtDate(dateLike) {
  const ms = toMs(dateLike);
  if (!ms) return "—";
  return new Date(ms).toLocaleDateString();
}
