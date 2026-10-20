import type { ReactNode } from 'react';

/** Browser-style frame for the landing-page product previews. Always labelled as demo content. */
export function DemoFrame({ url, label, children }: { url: string; label: string; children: ReactNode }) {
  return (
    <figure className="frame" style={{ margin: 0 }} aria-label={label}>
      <div className="frame__bar" aria-hidden="true"><i /><i /><i /><b>{url}</b></div>
      <div className="frame__body">{children}</div>
      <figcaption className="demo-ribbon">Demo content — fictional examples to show the interface</figcaption>
    </figure>
  );
}
