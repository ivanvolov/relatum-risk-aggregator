export function fmtUsd(n) {
  if (n === 0) return '—';
  if (n >= 1e9) return '$' + (n / 1e9).toFixed(2) + 'B';
  if (n >= 1e6) return '$' + (n / 1e6).toFixed(1) + 'M';
  if (n >= 1e3) return '$' + (n / 1e3).toFixed(0) + 'k';
  return '$' + n;
}

export function initials(name) {
  return name.replace(/[^A-Za-z0-9 ]/g, '').split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

export const STATUS_LABELS = {
  cov: 'covered',
  part: 'partial',
  none: 'not yet',
};
