import type { Metadata } from 'next';
import Link from 'next/link';
import { t } from '@/messages';
import * as C from '@/lib/constants';
import { getFreshnessPolicy } from '@/lib/config';
import { searchListings } from '@/lib/data/public';
import type { DirectoryFilters } from '@/lib/types';
import { ListingCard } from '@/components/ListingCard';
import { EmptyState } from '@/components/EmptyState';

export const metadata: Metadata = { title: 'Browse rentals' };
export const dynamic = 'force-dynamic';

type SP = Record<string, string | string[] | undefined>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? '';
const num = (v: string) => (v !== '' && Number.isFinite(Number(v)) && Number(v) >= 0 ? Math.floor(Number(v)) : undefined);
const inList = <T extends string>(list: readonly T[], v: string): T | undefined => (list as readonly string[]).includes(v) ? (v as T) : undefined;

function parseFilters(sp: SP): DirectoryFilters {
  return {
    q: one(sp.q).trim() || undefined,
    city: one(sp.city).trim() || undefined,
    minRent: num(one(sp.minRent)),
    maxRent: num(one(sp.maxRent)),
    accommodation: inList(C.ACCOMMODATION_TYPES, one(sp.type)),
    contributor: inList(C.CONTRIBUTOR_TYPES, one(sp.source)),
    brokerage: one(sp.brokerage) === 'none' ? 'none' : undefined,
    category: inList(C.LISTING_TYPES, one(sp.category)),
    availability: one(sp.availability) === 'now' ? 'now' : one(sp.availability) === '30d' ? '30d' : undefined,
    page: num(one(sp.page)) || 1,
  };
}

export default async function RentalsPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const f = parseFilters(sp);
  const result = await searchListings(f);
  const policy = getFreshnessPolicy();
  const hasFilters = Boolean(f.q || f.city || f.minRent !== undefined || f.maxRent !== undefined || f.accommodation || f.contributor || f.brokerage || f.category || f.availability);

  const pageHref = (p: number) => {
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries(sp)) {
      const val = one(v);
      if (val && k !== 'page') params.set(k, val);
    }
    params.set('page', String(p));
    return `/rentals?${params.toString()}`;
  };

  return (
    <div className="container">
      <div className="page-head">
        <p className="eyebrow">Browse</p>
        <h1>Rentals</h1>
        <p className="lede">Approved listings only. Each shows who shared it and when availability was last confirmed. Coverage is limited and depends on what people have contributed.</p>
      </div>

      <form method="get" action="/rentals" className="card filters" role="search" aria-label="Filter rentals">
        <div className="field"><label htmlFor="q">Search</label><input id="q" name="q" className="input" defaultValue={f.q} placeholder="Title or locality" /></div>
        <div className="field"><label htmlFor="city">City</label><input id="city" name="city" className="input" defaultValue={f.city} /></div>
        <div className="field"><label htmlFor="minRent">Min rent (₹)</label><input id="minRent" name="minRent" inputMode="numeric" className="input" defaultValue={f.minRent} /></div>
        <div className="field"><label htmlFor="maxRent">Max rent (₹)</label><input id="maxRent" name="maxRent" inputMode="numeric" className="input" defaultValue={f.maxRent} /></div>
        <div className="field"><label htmlFor="category">Category</label>
          <select id="category" name="category" className="select" defaultValue={f.category ?? ''}>
            <option value="">Homes and rooms</option>
            {C.LISTING_TYPES.map((v) => <option key={v} value={v}>{t.labels.listingType[v]}</option>)}
          </select></div>
        <div className="field"><label htmlFor="type">Accommodation</label>
          <select id="type" name="type" className="select" defaultValue={f.accommodation ?? ''}>
            <option value="">Any type</option>
            {C.ACCOMMODATION_TYPES.map((v) => <option key={v} value={v}>{t.labels.accommodation[v]}</option>)}
          </select></div>
        <div className="field"><label htmlFor="source">Shared by</label>
          <select id="source" name="source" className="select" defaultValue={f.contributor ?? ''}>
            <option value="">Anyone</option>
            {C.CONTRIBUTOR_TYPES.map((v) => <option key={v} value={v}>{t.labels.contributor[v]}</option>)}
          </select></div>
        <div className="field"><label htmlFor="availability">Availability</label>
          <select id="availability" name="availability" className="select" defaultValue={f.availability ?? ''}>
            <option value="">Any date</option>
            <option value="now">Available now</option>
            <option value="30d">Within 30 days</option>
          </select></div>
        <div className="field"><label htmlFor="brokerage">Brokerage</label>
          <select id="brokerage" name="brokerage" className="select" defaultValue={f.brokerage ?? ''}>
            <option value="">Any</option>
            <option value="none">No brokerage (as stated)</option>
          </select></div>
        <div className="row"><button type="submit" className="btn btn--primary">Search</button>{hasFilters && <Link href="/rentals" className="btn btn--ghost">Clear</Link>}</div>
      </form>

      {result.status === 'unconfigured' && (
        <div className="alert alert--info" role="status">This site is not connected to a database yet, so there is nothing to browse. If you are the site owner, follow the setup steps in the README.</div>
      )}
      {result.status === 'error' && (
        <div className="alert alert--error" role="alert">We could not load listings just now. Please try again in a moment.</div>
      )}
      {result.status === 'ok' && result.listings.length === 0 && (
        hasFilters ? (
          <EmptyState title={t.empty.directoryTitle} actions={<><Link href="/rentals" className="btn btn--ghost">Clear filters</Link><Link href="/looking" className="btn btn--primary">Register what you need</Link><Link href="/share" className="btn btn--ghost">Share a rental</Link></>}>
            {t.empty.directoryBody}
          </EmptyState>
        ) : (
          <EmptyState title={t.empty.directoryNone} actions={<><Link href="/share" className="btn btn--primary">Share a rental</Link><Link href="/looking" className="btn btn--ghost">Register what you need</Link></>}>
            {t.empty.directoryNoneBody}
          </EmptyState>
        )
      )}
      {result.status === 'ok' && result.listings.length > 0 && (
        <>
          <p className="muted" role="status">{result.total} approved listing{result.total === 1 ? '' : 's'}{hasFilters ? ' match your filters' : ''}</p>
          <div className="grid" style={{ marginTop: 12 }}>
            {result.listings.map((l) => <ListingCard key={l.id} listing={l} policy={policy} />)}
          </div>
          {result.pageCount > 1 && (
            <nav className="pagination" aria-label="Pagination">
              {result.page > 1 && <Link className="btn btn--ghost btn--sm" href={pageHref(result.page - 1)}>← Previous</Link>}
              <span className="muted small">Page {result.page} of {result.pageCount}</span>
              {result.page < result.pageCount && <Link className="btn btn--ghost btn--sm" href={pageHref(result.page + 1)}>Next →</Link>}
            </nav>
          )}
        </>
      )}
      <div style={{ height: 72 }} />
    </div>
  );
}
