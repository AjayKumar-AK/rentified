import type { ReactNode } from 'react';

export function EmptyState({ title, children, actions }: { title: string; children?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="card card--pad" style={{ textAlign: 'center', padding: '48px 24px' }} role="status">
      <h2 style={{ fontSize: '1.6rem' }}>{title}</h2>
      {children && <p className="muted" style={{ maxWidth: '52ch', marginInline: 'auto' }}>{children}</p>}
      {actions && <div className="btn-row" style={{ justifyContent: 'center', marginTop: 16 }}>{actions}</div>}
    </div>
  );
}
