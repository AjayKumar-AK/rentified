'use client';

import { moderateRoommateProfile, updateReport, updateRequest } from '@/app/actions/moderation';
import { useServerForm } from '@/components/forms/useServerForm';

function Result({ state }: { state: { status: string; message?: string } }) {
  if (state.status === 'idle') return null;
  return <div className={`alert ${state.status === 'success' ? 'alert--ok' : 'alert--error'} small`} role="status">{state.message}</div>;
}

export function ReportActions({ id, status, notes }: { id: string; status: string; notes: string | null }) {
  const { state, pending, onSubmit, formRef } = useServerForm(updateReport);
  const closed = status === 'actioned' || status === 'dismissed';
  return (
    <form ref={formRef} onSubmit={onSubmit} className="stack" style={{ gap: 8 }}>
      <input type="hidden" name="report_id" value={id} />
      <label className="sr-only" htmlFor={`n-${id}`}>Internal notes</label>
      <textarea id={`n-${id}`} name="internal_notes" className="textarea" style={{ minHeight: 60 }} placeholder="Internal notes (private)" defaultValue={notes ?? ''} />
      <div className="row">
        <button name="status" value="reviewing" className="btn btn--ghost btn--sm" disabled={pending || closed} type="submit">Mark reviewing</button>
        <button name="status" value="actioned" className="btn btn--primary btn--sm" disabled={pending} type="submit">Actioned</button>
        <button name="status" value="dismissed" className="btn btn--ghost btn--sm" disabled={pending} type="submit">Dismiss</button>
      </div>
      <Result state={state} />
    </form>
  );
}

export function RoommateActions({ id }: { id: string }) {
  const { state, pending, onSubmit, formRef } = useServerForm(moderateRoommateProfile);
  return (
    <form ref={formRef} onSubmit={onSubmit} className="stack" style={{ gap: 8 }}>
      <input type="hidden" name="profile_id" value={id} />
      <label className="sr-only" htmlFor={`r-${id}`}>Reason</label>
      <input id={`r-${id}`} name="reason" className="input" placeholder="Reason (required to reject/remove)" />
      <div className="row">
        <button name="action" value="approve" className="btn btn--primary btn--sm" disabled={pending}>Approve</button>
        <button name="action" value="reject" className="btn btn--ghost btn--sm" disabled={pending}>Reject</button>
        <button name="action" value="unpublish" className="btn btn--danger btn--sm" disabled={pending}>Remove</button>
      </div>
      <Result state={state} />
    </form>
  );
}

export function RequestActions({ id }: { id: string }) {
  const { state, pending, onSubmit, formRef } = useServerForm(updateRequest);
  return (
    <form ref={formRef} onSubmit={onSubmit} className="stack" style={{ gap: 8 }}>
      <input type="hidden" name="request_id" value={id} />
      <div className="row">
        <button name="status" value="done" className="btn btn--primary btn--sm" disabled={pending}>Mark done</button>
        <button name="status" value="declined" className="btn btn--ghost btn--sm" disabled={pending}>Decline</button>
      </div>
      <Result state={state} />
    </form>
  );
}
