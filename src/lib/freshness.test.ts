import { describe, expect, it } from 'vitest';
import { computeExpiry, getFreshness } from '@/lib/freshness';

const policy = { staleAfterDays: 7, expireAfterDays: 14 };
const now = new Date('2026-10-20T12:00:00Z');
const daysAgo = (n: number) => new Date(now.getTime() - n * 86_400_000).toISOString();

describe('getFreshness', () => {
  it('reports unconfirmed when there is no confirmation', () => {
    expect(getFreshness(null, policy, now)).toEqual({ level: 'unconfirmed', daysSince: null });
    expect(getFreshness('not a date', policy, now).level).toBe('unconfirmed');
  });
  it('is confirmed_recently below the stale threshold', () => {
    expect(getFreshness(daysAgo(0), policy, now)).toEqual({ level: 'confirmed_recently', daysSince: 0 });
    expect(getFreshness(daysAgo(6), policy, now).level).toBe('confirmed_recently');
  });
  it('needs reconfirmation from the stale threshold until the expiry threshold', () => {
    expect(getFreshness(daysAgo(7), policy, now).level).toBe('needs_reconfirmation');
    expect(getFreshness(daysAgo(13), policy, now).level).toBe('needs_reconfirmation');
  });
  it('is overdue at and beyond the expiry threshold', () => {
    expect(getFreshness(daysAgo(14), policy, now).level).toBe('overdue');
    expect(getFreshness(daysAgo(60), policy, now).level).toBe('overdue');
  });
  it('treats future timestamps as zero days', () => {
    expect(getFreshness(daysAgo(-3), policy, now).daysSince).toBe(0);
  });
  it('honours a custom policy', () => {
    expect(getFreshness(daysAgo(3), { staleAfterDays: 2, expireAfterDays: 5 }, now).level).toBe('needs_reconfirmation');
  });
});

describe('computeExpiry', () => {
  it('adds the configured number of days', () => {
    expect(computeExpiry(now, 14).toISOString()).toBe('2026-11-03T12:00:00.000Z');
  });
});
