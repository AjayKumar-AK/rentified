'use client';

import { useState } from 'react';
import { confirmAvailabilityAsModerator, moderateListing, recordVerificationCheck } from '@/app/actions/moderation';
import { FormSummary, Select, TextArea, TextInput } from '@/components/forms/fields';
import { useServerForm } from '@/components/forms/useServerForm';
import { REASON_REQUIRED } from '@/lib/moderation/transitions';
import type { ModerationActionName } from '@/lib/types';

const LABEL: Record<ModerationActionName, string> = {
  approve: 'Approve & publish',
  reject: 'Reject',
  request_changes: 'Request changes',
  mark_unavailable: 'Mark unavailable',
  expire: 'Expire now',
  unpublish: 'Remove / unpublish',
  reinstate: 'Reinstate (publish again)',
};

export function ModerationForm({ listingId, actions }: { listingId: string; actions: ModerationActionName[] }) {
  const [action, setAction] = useState<ModerationActionName | ''>(actions[0] ?? '');
  const { state, pending, onSubmit, formRef } = useServerForm(moderateListing);
  const e = state.errors ?? {};
  if (actions.length === 0) return <p className="muted">No actions are available for this status.</p>;
  const needsReason = action !== '' && REASON_REQUIRED.has(action);
  const goesLive = action === 'approve' || action === 'reinstate';

  return (
    <form ref={formRef} onSubmit={(ev) => { if (action === 'unpublish' && !window.confirm('Remove this listing permanently from public view?')) { ev.preventDefault(); return; } onSubmit(ev); }} className="stack" noValidate>
      <input type="hidden" name="listing_id" value={listingId} />
      <FormSummary state={state} />
      {state.status === 'success' && <div className="alert alert--ok" role="status">{state.message} Reload to see the new status.</div>}
      <div className="field">
        <label htmlFor="action">Action</label>
        <select id="action" name="action" className="select" value={action} onChange={(ev) => setAction(ev.target.value as ModerationActionName)}>
          {actions.map((a) => <option key={a} value={a}>{LABEL[a]}</option>)}
        </select>
      </div>
      <TextArea id="reason" name="reason" label={needsReason ? 'Reason (required — shown to the contributor for “request changes”)' : 'Note'} optional={!needsReason} rows={3} maxLength={1000} error={e.reason} />
      {goesLive && (
        <label className="consent consent--public">
          <input type="checkbox" name="confirmed_available" aria-invalid={e.confirmed_available ? true : undefined} />
          <span><strong>I have checked that this listing is still marked available.</strong><span className="small muted">Publishing sets “last confirmed available” to today and starts the expiry clock. It does not mean ownership or identity were verified.</span></span>
        </label>
      )}
      <div className="btn-row"><button className={`btn ${action === 'reject' || action === 'unpublish' ? 'btn--danger' : 'btn--primary'}`} disabled={pending}>{pending ? 'Working…' : LABEL[action || 'approve']}</button></div>
    </form>
  );
}

export function ReconfirmForm({ listingId }: { listingId: string }) {
  const { state, pending, onSubmit, formRef } = useServerForm(confirmAvailabilityAsModerator);
  return (
    <form ref={formRef} onSubmit={onSubmit} className="stack" noValidate>
      <input type="hidden" name="listing_id" value={listingId} />
      {state.status !== 'idle' && <div className={`alert ${state.status === 'success' ? 'alert--ok' : 'alert--error'}`} role="status">{state.message}</div>}
      <TextInput id="reconfirm_note" name="note" label="How did you confirm?" optional hint="e.g. “spoke to the contributor on the phone”" />
      <div className="btn-row"><button className="btn btn--ghost btn--sm" disabled={pending}>{pending ? 'Saving…' : 'Record availability confirmation'}</button></div>
    </form>
  );
}

export function VerificationForm({ listingId }: { listingId: string }) {
  const { state, pending, onSubmit, formRef } = useServerForm(recordVerificationCheck);
  const e = state.errors ?? {};
  return (
    <form ref={formRef} onSubmit={onSubmit} className="stack" noValidate>
      <input type="hidden" name="listing_id" value={listingId} />
      <p className="small muted" style={{ margin: 0 }}>Record a check only if you actually completed it. Anything recorded as “passed” is shown publicly as a dated claim.</p>
      {state.status !== 'idle' && <div className={`alert ${state.status === 'success' ? 'alert--ok' : 'alert--error'}`} role="status">{state.message}</div>}
      <div className="fields">
        <Select id="check_type" name="check_type" label="Check" required options={[{ value: 'identity', label: 'Identity checked' }, { value: 'property', label: 'Property checked' }]} error={e.check_type} />
        <Select id="check_status" name="status" label="Result" required options={[{ value: 'passed', label: 'Passed' }, { value: 'failed', label: 'Failed' }, { value: 'not_applicable', label: 'Not applicable' }]} error={e.status} />
        <TextInput id="check_method" name="method" label="Method used" required hint="What was actually done, e.g. “video call and ID shown”" error={e.method} wide />
        <TextArea id="check_notes" name="notes" label="Internal notes" optional rows={2} maxLength={1000} error={e.notes} />
      </div>
      <div className="btn-row"><button className="btn btn--ghost btn--sm" disabled={pending}>{pending ? 'Saving…' : 'Record check'}</button></div>
    </form>
  );
}
