'use client';

import { signIn } from '@/app/actions/auth';
import { FormSummary, TextInput } from '@/components/forms/fields';
import { useServerForm } from '@/components/forms/useServerForm';

export function SignInForm() {
  const { state, pending, onSubmit, formRef } = useServerForm(signIn);
  return (
    <form ref={formRef} onSubmit={onSubmit} className="stack card card--pad" noValidate>
      <FormSummary state={state} />
      <TextInput id="email" label="Email" type="email" autoComplete="username" required />
      <TextInput id="password" label="Password" type="password" autoComplete="current-password" required />
      <div className="btn-row"><button className="btn btn--primary" disabled={pending}>{pending ? 'Signing in…' : 'Sign in'}</button></div>
    </form>
  );
}
