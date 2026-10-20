/** Shared (client + server) form state. Server-action files may only export async functions, so this lives here. */
export interface FormState {
  status: 'idle' | 'error' | 'success';
  message?: string;
  errors?: Record<string, string>;
  /** Present once, on successful listing submission. Never persisted client-side by the app. */
  reconfirmToken?: string;
  /** Slug-less, non-sensitive reference for confirmation screens. */
  reference?: string;
}

export const initialFormState: FormState = { status: 'idle' };
