import type { ListingStatus, ModerationActionName } from '@/lib/types';

/**
 * Allowed publication-status transitions.
 * MUST stay in sync with public.listing_transition_allowed() in supabase/migrations/0001_schema.sql
 * (transitions.test.ts parses the SQL and fails if they drift).
 */
export const ALLOWED_TRANSITIONS: Record<ListingStatus, readonly ListingStatus[]> = {
  pending_review: ['approved', 'rejected', 'changes_requested', 'removed'],
  changes_requested: ['pending_review', 'approved', 'rejected', 'removed'],
  approved: ['unavailable', 'expired', 'removed', 'changes_requested'],
  rejected: ['pending_review', 'removed'],
  unavailable: ['approved', 'removed'],
  expired: ['approved', 'removed'],
  removed: [],
};

export function canTransition(from: ListingStatus, to: ListingStatus): boolean {
  return ALLOWED_TRANSITIONS[from].includes(to);
}

/** The status each moderator action moves a listing to. */
export const ACTION_TARGET: Record<ModerationActionName, ListingStatus> = {
  approve: 'approved',
  reject: 'rejected',
  request_changes: 'changes_requested',
  mark_unavailable: 'unavailable',
  expire: 'expired',
  unpublish: 'removed',
  reinstate: 'approved',
};

/** Actions that must carry a written reason (kept in the history; shown to contributors for changes). */
export const REASON_REQUIRED: ReadonlySet<ModerationActionName> = new Set([
  'reject',
  'request_changes',
  'unpublish',
]);

/** Re-publishing a previously live listing needs a fresh availability confirmation by the moderator. */
export const REQUIRES_AVAILABILITY_CONFIRMATION: ReadonlySet<ModerationActionName> = new Set(['reinstate']);

export function isPubliclyVisibleStatus(status: ListingStatus): boolean {
  return status === 'approved';
}

/** Actions a moderator may take from the given status. */
export function availableActions(from: ListingStatus): ModerationActionName[] {
  return (Object.keys(ACTION_TARGET) as ModerationActionName[]).filter((action) => {
    const target = ACTION_TARGET[action];
    if (!canTransition(from, target)) return false;
    // "reinstate" is only meaningful for listings that were live before.
    if (action === 'reinstate') return from === 'unavailable' || from === 'expired';
    if (action === 'approve') return from === 'pending_review' || from === 'changes_requested';
    return true;
  });
}
