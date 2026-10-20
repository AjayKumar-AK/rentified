import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { LISTING_STATUSES } from '@/lib/constants';
import {
  ACTION_TARGET,
  ALLOWED_TRANSITIONS,
  REASON_REQUIRED,
  availableActions,
  canTransition,
} from '@/lib/moderation/transitions';

describe('status transitions', () => {
  it('covers every status', () => {
    expect(Object.keys(ALLOWED_TRANSITIONS).sort()).toEqual([...LISTING_STATUSES].sort());
  });
  it('never lets pending, rejected, expired or removed listings jump straight to a wrong state', () => {
    expect(canTransition('pending_review', 'expired')).toBe(false);
    expect(canTransition('pending_review', 'unavailable')).toBe(false);
    expect(canTransition('rejected', 'approved')).toBe(false);
    expect(canTransition('removed', 'approved')).toBe(false);
    expect(ALLOWED_TRANSITIONS.removed).toHaveLength(0);
  });
  it('allows the normal moderation path', () => {
    expect(canTransition('pending_review', 'approved')).toBe(true);
    expect(canTransition('pending_review', 'changes_requested')).toBe(true);
    expect(canTransition('changes_requested', 'pending_review')).toBe(true);
    expect(canTransition('approved', 'unavailable')).toBe(true);
    expect(canTransition('expired', 'approved')).toBe(true);
  });
  it('requires a reason for reject, request_changes and unpublish', () => {
    expect([...REASON_REQUIRED].sort()).toEqual(['reject', 'request_changes', 'unpublish']);
  });
  it('offers sensible actions per status', () => {
    expect(availableActions('pending_review').sort()).toEqual(['approve', 'reject', 'request_changes', 'unpublish']);
    expect(availableActions('approved').sort()).toEqual(['expire', 'mark_unavailable', 'request_changes', 'unpublish']);
    expect(availableActions('unavailable').sort()).toEqual(['reinstate', 'unpublish']);
    expect(availableActions('removed')).toEqual([]);
  });
  it('every action target is a legal transition from at least one status', () => {
    for (const action of Object.keys(ACTION_TARGET) as (keyof typeof ACTION_TARGET)[]) {
      const ok = LISTING_STATUSES.some((s) => canTransition(s, ACTION_TARGET[action]) && availableActions(s).includes(action));
      expect(ok).toBe(true);
    }
  });
  it('matches public.listing_transition_allowed() in the SQL migration exactly', () => {
    const sql = readFileSync(join(process.cwd(), 'supabase/migrations/0001_schema.sql'), 'utf8');
    const fn = sql.slice(sql.indexOf('function public.listing_transition_allowed'));
    const body = fn.slice(0, fn.indexOf('$$;'));
    const parsed: Record<string, string[]> = {};
    for (const m of body.matchAll(/when '(\w+)'\s+then p_to in \(([^)]*)\)/g)) {
      parsed[m[1]] = [...m[2].matchAll(/'(\w+)'/g)].map((x) => x[1]).sort();
    }
    for (const status of LISTING_STATUSES) {
      const fromSql = parsed[status] ?? []; // 'removed' falls through to `else false`
      expect(fromSql).toEqual([...ALLOWED_TRANSITIONS[status]].sort());
    }
  });
});
