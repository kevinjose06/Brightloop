const inr = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** paise (integer) -> "₹1,25,000.00" */
export function formatPaise(paise: number | null | undefined): string {
  if (paise == null || Number.isNaN(paise)) return '—';
  return inr.format(paise / 100);
}

/** user-typed rupees -> integer paise, rounding safely */
export function rupeesToPaise(rupees: string | number): number {
  const n = typeof rupees === 'string' ? Number(rupees.replace(/,/g, '')) : rupees;
  return Math.round(n * 100);
}

