'use client';

import { markNoLongerAvailable, reconfirmAvailability, submitCorrection } from '@/app/actions/contributor';
import { FormSummary, TextArea, TextInput } from '@/components/forms/fields';
import { useServerForm } from '@/components/forms/useServerForm';
import type { ContributorListing } from '@/lib/data/contributor';

export function ManagePanel({ token, listing }: { token: string; listing: ContributorListing }) {
  const confirm = useServerForm((p, f) => reconfirmAvailability(token, p, f));
  const taken = useServerForm((p, f) => markNoLongerAvailable(token, p, f));
  const fix = useServerForm((p, f) => submitCorrection(token, p, f));
  const e = fix.state.errors ?? {};
  const live = listing.status === 'approved' || listing.status === 'expired';

  return (
    <div className="stack stack--lg">
      {listing.status === 'pending_review' && <div className="alert alert--info">Your listing is waiting for review. Nothing is needed from you yet.</div>}
      {['rejected', 'removed', 'unavailable'].includes(listing.status) && <div className="alert alert--info">This listing is not public. If you think this is a mistake, use the <a href="/contact?kind=correction">contact form</a>.</div>}

      {listing.status === 'changes_requested' && (
        <form ref={fix.formRef} onSubmit={fix.onSubmit} className="card card--pad stack" noValidate>
          <h2 style={{ fontSize: '1.5rem' }}>A moderator asked for changes</h2>
          {listing.changeRequest && <blockquote className="alert alert--info" style={{ margin: 0 }}>{listing.changeRequest}</blockquote>}
          <FormSummary state={fix.state} />
          {fix.state.status === 'success' ? <div className="alert alert--ok" role="status">{fix.state.message}</div> : (
            <>
              <TextInput id="title" label="Title" defaultValue={listing.title} required error={e.title} />
              <TextArea id="description" label="Description" defaultValue={listing.description} required rows={6} error={e.description} />
              <TextInput id="rent_inr" label="Monthly rent (₹)" inputMode="numeric" defaultValue={String(listing.rent_inr)} required error={e.rent_inr} />
              <TextInput id="deposit_inr" label="Deposit (₹)" inputMode="numeric" optional defaultValue={listing.deposit_inr === null ? '' : String(listing.deposit_inr)} error={e.deposit_inr} />
              <TextInput id="available_from" label="Available from" type="date" defaultValue={listing.available_from} required error={e.available_from} />
              <div className="btn-row"><button className="btn btn--primary" disabled={fix.pending}>{fix.pending ? 'Sending…' : 'Send back for review'}</button></div>
            </>
          )}
        </form>
      )}

      {live && (
        <>
          <form ref={confirm.formRef} onSubmit={confirm.onSubmit} className="card card--pad stack">
            <h2 style={{ fontSize: '1.5rem' }}>Still available?</h2>
            <p className="muted">Confirming records today’s date as “last confirmed available” and keeps the listing visible. It does not let you edit the listing.</p>
            {confirm.state.status !== 'idle' && <div className={`alert ${confirm.state.status === 'success' ? 'alert--ok' : 'alert--error'}`} role="status">{confirm.state.message}</div>}
            <div className="btn-row"><button className="btn btn--primary" disabled={confirm.pending}>{confirm.pending ? 'Saving…' : 'Yes, still available'}</button></div>
          </form>
          <form ref={taken.formRef} onSubmit={(ev) => { if (!window.confirm('Take this listing down? It will no longer be public.')) { ev.preventDefault(); return; } taken.onSubmit(ev); }} className="card card--pad stack">
            <h2 style={{ fontSize: '1.5rem' }}>No longer available</h2>
            <p className="muted">Rented it out or changed your mind? Take the listing down so nobody wastes time.</p>
            {taken.state.status !== 'idle' && <div className={`alert ${taken.state.status === 'success' ? 'alert--ok' : 'alert--error'}`} role="status">{taken.state.message}</div>}
            <div className="btn-row"><button className="btn btn--danger" disabled={taken.pending}>{taken.pending ? 'Updating…' : 'Mark as no longer available'}</button></div>
          </form>
        </>
      )}
    </div>
  );
}
