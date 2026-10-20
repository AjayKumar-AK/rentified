'use server';

import { redirect } from 'next/navigation';
import { createAuthClient } from '@/lib/supabase/server';
import { allowRequest, RATE_LIMIT_MESSAGE } from '@/lib/security/ratelimit';
import type { FormState } from '@/lib/forms';

export async function signIn(_prev: FormState, formData: FormData): Promise<FormState> {
  const email = String(formData.get('email') ?? '').trim();
  const password = String(formData.get('password') ?? '');
  if (!email || !password) return { status: 'error', message: 'Enter your email and password.' };
  if (!(await allowRequest('admin_login', 10, 900))) return { status: 'error', message: RATE_LIMIT_MESSAGE };
  try {
    const supabase = await createAuthClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { status: 'error', message: 'Those details did not work.' };
  } catch {
    return { status: 'error', message: 'Sign-in is not available right now.' };
  }
  redirect('/admin');
}

export async function signOut() {
  try {
    const supabase = await createAuthClient();
    await supabase.auth.signOut();
  } catch {
    // nothing to sign out of
  }
  redirect('/admin/login');
}
