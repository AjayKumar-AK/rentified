import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getAdminContext } from '@/lib/auth/admin';
import { SignInForm } from '@/components/admin/SignInForm';
import { signOut } from '@/app/actions/auth';

export const metadata: Metadata = { title: 'Moderator sign-in', robots: { index: false, follow: false } };
export const dynamic = 'force-dynamic';

export default async function LoginPage() {
  const ctx = await getAdminContext();
  if (ctx.status === 'ok') redirect('/admin');

  return (
    <div className="narrow" style={{ padding: '48px 0 96px' }}>
      <h1 style={{ fontSize: '2.2rem' }}>Moderator sign-in</h1>
      {ctx.status === 'unconfigured' && (
        <div className="alert alert--info" role="status">
          <strong>Administrator access is not set up.</strong>
          <p style={{ margin: '8px 0 0' }}>
            Set <code>NEXT_PUBLIC_SUPABASE_URL</code>, <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code> and <code>SUPABASE_SERVICE_ROLE_KEY</code>, run the migrations, create a user in Supabase Auth, and add them to <code>admin_users</code>. The README has the exact steps. Until then, nobody can sign in.
          </p>
        </div>
      )}
      {ctx.status === 'forbidden' && (
        <div className="alert alert--error" role="alert">
          <strong>Signed in as {ctx.email ?? 'this account'}, but it is not a moderator.</strong>
          <p style={{ margin: '8px 0 0' }}>Ask the project owner to add you to the <code>admin_users</code> table.</p>
          <form action={signOut} style={{ marginTop: 12 }}><button className="btn btn--ghost btn--sm">Sign out</button></form>
        </div>
      )}
      {(ctx.status === 'signed_out' || ctx.status === 'forbidden') && <div style={{ marginTop: 24 }}><SignInForm /></div>}
    </div>
  );
}
