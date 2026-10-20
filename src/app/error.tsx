'use client';

export default function GlobalError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="narrow page-head" style={{ paddingBottom: 96 }} role="alert">
      <h1>Something went wrong</h1>
      <p className="lede">We hit an unexpected problem. Nothing you submitted has been lost if you saw a confirmation message.</p>
      <button className="btn btn--primary" onClick={reset}>Try again</button>
    </div>
  );
}
