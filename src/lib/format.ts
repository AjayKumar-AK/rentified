import type { BrokerageStatus } from '@/lib/types';

const inr = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 });

export function formatRupees(n: number): string {
  return `₹${inr.format(n)}`;
}

export function formatDate(iso: string | Date | null | undefined): string {
  if (!iso) return '—';
  const d = iso instanceof Date ? iso : new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata' });
}

export function formatDateTime(iso: string | Date | null | undefined): string {
  if (!iso) return '—';
  const d = iso instanceof Date ? iso : new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZone: 'Asia/Kolkata',
  });
}

/** Distinguishes "not specified" from "none/zero". */
export function describeDeposit(deposit: number | null): string {
  if (deposit === null) return 'Deposit not specified';
  if (deposit === 0) return 'No deposit (as stated)';
  return `Deposit ${formatRupees(deposit)}`;
}

export function describeBrokerage(status: BrokerageStatus, amount: number | null): string {
  switch (status) {
    case 'none':
      return 'No brokerage (as stated)';
    case 'applies':
      return amount === null ? 'Brokerage applies (amount not stated)' : `Brokerage ${formatRupees(amount)}`;
    default:
      return 'Brokerage not specified';
  }
}

export function slugify(input: string): string {
  const base = input
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
    .replace(/-+$/g, '');
  return base || 'listing';
}

export function daysAgoLabel(daysSince: number | null): string {
  if (daysSince === null) return 'never';
  if (daysSince === 0) return 'today';
  if (daysSince === 1) return 'yesterday';
  return `${daysSince} days ago`;
}

/** Strip characters that could alter a PostgREST filter expression or act as LIKE wildcards. */
export function safeSearchTerm(input: string): string {
  return input.replace(/[^\p{L}\p{M}\p{N}\s-]/gu, ' ').replace(/\s+/g, ' ').trim().slice(0, 60);
}
