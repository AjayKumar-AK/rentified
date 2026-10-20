import type { ContactMethod } from '@/lib/types';

/** Normalizes an Indian mobile number to +91XXXXXXXXXX, or returns null if it is not valid. */
export function normalizeIndianPhone(input: string): string | null {
  let d = input.trim().replace(/[\s\-().]/g, '');
  if (d.startsWith('+91')) d = d.slice(3);
  else if (d.startsWith('0091')) d = d.slice(4);
  else if (d.startsWith('91') && d.length === 12) d = d.slice(2);
  else if (d.startsWith('0') && d.length === 11) d = d.slice(1);
  return /^[6-9]\d{9}$/.test(d) ? `+91${d}` : null;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** Returns the normalized contact value for the method, or null when invalid. */
export function normalizeContact(method: ContactMethod, value: string): string | null {
  const v = value.trim();
  if (method === 'email') {
    return v.length <= 120 && EMAIL_RE.test(v) ? v.toLowerCase() : null;
  }
  return normalizeIndianPhone(v);
}

export function contactErrorMessage(method: ContactMethod): string {
  return method === 'email'
    ? 'Enter a valid email address'
    : 'Enter a valid 10-digit Indian mobile number (e.g. 98765 43210)';
}

/** A safe link for a (already-normalized, consented) public contact value. */
export function contactHref(method: ContactMethod, value: string): string | null {
  if (method === 'email') return EMAIL_RE.test(value) ? `mailto:${encodeURIComponent(value).replace('%40', '@')}` : null;
  const phone = normalizeIndianPhone(value);
  if (!phone) return null;
  return method === 'whatsapp' ? `https://wa.me/${phone.slice(1)}` : `tel:${phone}`;
}
