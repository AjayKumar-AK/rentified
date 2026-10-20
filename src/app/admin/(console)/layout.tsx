import Link from 'next/link';
import { requireAdminPage } from '@/lib/auth/admin';
import { signOut } from '@/app/actions/auth';

export const dynamic = 'force-dynamic';

/** Every page under /admin (except /admin/login) is gated here, server-side, on every request. */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireAdminPage();
  return (
    <div className="container" style={{ paddingBottom: 80 }}>
      <div className="row" style={{ justifyContent: 'space-between', padding: '20px 0 8px' }}>
        <nav className="tabs" aria-label="Moderation" style={{ margin: 0 }}>
          <Link href="/admin">Overview</Link>
          <Link href="/admin/listings">Listings</Link>
          <Link href="/admin/reports">Reports</Link>
          <Link href="/admin/roommates">Roommates</Link>
          <Link href="/admin/requests">Requests</Link>
          <Link href="/admin/requirements">Requirements</Link>
        </nav>
        <form action={signOut} className="row"><span className="small muted">{admin.email}</span><button className="btn btn--ghost btn--sm">Sign out</button></form>
      </div>
      {children}
    </div>
  );
}
