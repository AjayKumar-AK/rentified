export interface WarningInput {
  title: string;
  description: string;
  rent_inr: number;
  deposit_inr: number | null;
  brokerage_status: 'none' | 'applies' | 'not_specified';
  contributor_type: 'owner' | 'tenant' | 'broker' | 'other';
  private_address: string | null;
  photoCount: number;
  /** Other non-removed listings sharing the same contact value. */
  duplicateContactCount: number;
}

export interface ValidationWarning {
  level: 'warn' | 'info';
  message: string;
}

const PHONE_RE = /(?:\+?91[\s-]?)?[6-9]\d{4}[\s-]?\d{5}/;
const EMAIL_RE = /[^\s@]+@[^\s@]+\.[^\s@]{2,}/;
const URL_RE = /(https?:\/\/|www\.)\S+/i;

/** Heuristic prompts for the moderator. They are NOT proof of anything. */
export function getListingWarnings(i: WarningInput): ValidationWarning[] {
  const out: ValidationWarning[] = [];
  const haystack = `${i.title}\n${i.description}`;

  if (PHONE_RE.test(haystack) || EMAIL_RE.test(haystack) || URL_RE.test(haystack)) {
    out.push({ level: 'warn', message: 'Title or description appears to contain contact details or a link.' });
  }
  if (i.rent_inr < 1500 || i.rent_inr > 300000) {
    out.push({ level: 'warn', message: 'Monthly rent looks unusual — check for a typo.' });
  }
  if (i.deposit_inr !== null && i.deposit_inr > i.rent_inr * 12) {
    out.push({ level: 'warn', message: "Deposit is more than 12 months' rent." });
  }
  const letters = i.title.replace(/[^A-Za-z]/g, '');
  if (letters.length >= 8 && letters === letters.toUpperCase()) {
    out.push({ level: 'info', message: 'Title is written entirely in capitals.' });
  }
  if (i.photoCount < 3) {
    out.push({ level: 'info', message: `Only ${i.photoCount} photo${i.photoCount === 1 ? '' : 's'} provided.` });
  }
  if (i.brokerage_status === 'not_specified') {
    out.push({ level: 'info', message: 'Brokerage was not specified.' });
  }
  if (i.contributor_type === 'owner' && !i.private_address) {
    out.push({ level: 'info', message: 'Owner listing without a private address on file.' });
  }
  if (i.duplicateContactCount > 0) {
    out.push({
      level: 'warn',
      message: `${i.duplicateContactCount} other listing${i.duplicateContactCount === 1 ? '' : 's'} use the same contact — possible duplicate or broker.`,
    });
  }
  return out;
}
