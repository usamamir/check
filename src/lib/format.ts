export function formatCurrency(amount: number, opts?: { signed?: boolean; compact?: boolean }) {
  const abs = Math.abs(amount);
  const formatted = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    notation: opts?.compact && abs >= 10000 ? 'compact' : 'standard',
    maximumFractionDigits: opts?.compact ? 1 : 2,
  }).format(abs);

  if (opts?.signed) {
    if (amount > 0) return `+${formatted}`;
    if (amount < 0) return `-${formatted}`;
  }
  if (amount < 0) return `-${formatted}`;
  return formatted;
}

export function formatPercent(value: number, digits = 0) {
  return `${value.toFixed(digits)}%`;
}

export function shortDate(iso: string) {
  return new Date(iso + (iso.length === 10 ? 'T12:00:00' : '')).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

export function monthLabel(iso: string) {
  return new Date(iso + 'T12:00:00').toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });
}
