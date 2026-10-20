'use client';

import { useCallback, useRef, useState, useTransition, type FormEvent } from 'react';
import { initialFormState, type FormState } from '@/lib/forms';

type Action = (prev: FormState, formData: FormData) => Promise<FormState>;

/**
 * Submits a form to a server action WITHOUT resetting the inputs on error (React's `action=` prop
 * clears uncontrolled fields), so people never lose what they typed after a recoverable error.
 */
export function useServerForm(action: Action, extra?: (fd: FormData) => void) {
  const [state, setState] = useState<FormState>(initialFormState);
  const [pending, startTransition] = useTransition();
  const startedAt = useRef<number>(Date.now());
  const formRef = useRef<HTMLFormElement>(null);

  const onSubmit = useCallback(
    (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const submitter = (e.nativeEvent as SubmitEvent).submitter as HTMLElement | null;
      const fd = new FormData(e.currentTarget, submitter);
      fd.set('form_started_at', String(startedAt.current));
      extra?.(fd);
      startTransition(async () => {
        const next = await action(initialFormState, fd);
        setState(next);
        if (next.status === 'error') {
          // Move focus to the first invalid field, or the summary.
          requestAnimationFrame(() => {
            const first = formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]');
            (first ?? formRef.current?.querySelector<HTMLElement>('[data-form-summary]'))?.focus();
          });
        } else if (next.status === 'success') {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      });
    },
    [action, extra],
  );

  return { state, pending, onSubmit, formRef };
}
