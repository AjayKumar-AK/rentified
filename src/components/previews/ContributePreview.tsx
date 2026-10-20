import { DemoFrame } from '@/components/previews/DemoFrame';

/** Preview 2 — the contribution flow, built from the same field/chip/badge styles as the real form. */
export function ContributePreview() {
  return (
    <DemoFrame url="rentified / share / room" label="Preview of the contribution form">
      <div aria-hidden="true" className="stack" style={{ gap: 14 }}>
        <div className="row" style={{ justifyContent: 'space-between' }}>
          <strong style={{ fontFamily: 'var(--serif)', fontSize: '1.2rem' }}>Offer a room</strong>
          <span className="badge badge--warn">Pending review after submit</span>
        </div>
        <div className="field">
          <span className="label">Your role</span>
          <div className="checks">
            <span className="chip"><span style={{ background: 'var(--forest)', color: '#fff', borderColor: 'var(--forest)' }}>✓ Current tenant</span></span>
            <span className="chip"><span>Owner</span></span>
            <span className="chip"><span>Broker</span></span>
          </div>
        </div>
        <div className="fields" style={{ gridTemplateColumns: '1fr 1fr' }}>
          <div className="field"><span className="label">Monthly rent</span><div className="input" style={{ display: 'flex', alignItems: 'center' }}>₹ 9,500</div></div>
          <div className="field"><span className="label">Deposit <span className="opt">(optional)</span></span><div className="input" style={{ display: 'flex', alignItems: 'center', color: 'var(--ink-soft)' }}>Not specified</div></div>
        </div>
        <div className="field">
          <span className="label">Photos</span>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
            {[0, 1, 2].map((i) => <div key={i} className="mini-photo" style={{ aspectRatio: '1' }}>photo</div>)}
            <div className="mini-photo" style={{ aspectRatio: '1', background: '#fff', border: '2px dashed var(--line-strong)' }}>+ add</div>
          </div>
        </div>
        <div className="consent" style={{ fontSize: '0.85rem' }}>
          <input type="checkbox" disabled tabIndex={-1} />
          <span>Optional: show my contact details publicly. <span className="muted">(never pre-ticked)</span></span>
        </div>
        <div className="row"><span className="badge">1 · Submit</span><span className="badge badge--outline">2 · Moderator review</span><span className="badge badge--outline">3 · Public</span></div>
      </div>
    </DemoFrame>
  );
}
