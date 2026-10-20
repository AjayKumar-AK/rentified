import { en, type Messages } from '@/messages/en';

/**
 * Locale hook. v0.1 ships English only. To add a language: create src/messages/<code>.ts exporting an
 * object of type Messages, register it here, and add a selector. Browser/location hints may SUGGEST a
 * language but must never force one.
 */
const catalogues: Record<string, Messages> = { en };

export function getMessages(locale: string = 'en'): Messages {
  return catalogues[locale] ?? en;
}

export const t = getMessages();
