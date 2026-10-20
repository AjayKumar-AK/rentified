import { describe, expect, it } from 'vitest';
import { contactHref, normalizeContact, normalizeIndianPhone } from '@/lib/validation/contact';

describe('normalizeIndianPhone', () => {
  it('accepts common formats', () => {
    for (const v of ['9876543210', '98765 43210', '+91 98765 43210', '+919876543210', '09876543210', '919876543210', '0091-98765-43210']) {
      expect(normalizeIndianPhone(v)).toBe('+919876543210');
    }
  });
  it('accepts a 10-digit number that begins with 91', () => {
    expect(normalizeIndianPhone('9123456789')).toBe('+919123456789');
  });
  it('rejects invalid numbers', () => {
    for (const v of ['', '12345', '5876543210', '98765432', '98765432101', 'abcdefghij', '+1 415 555 0100']) {
      expect(normalizeIndianPhone(v)).toBeNull();
    }
  });
});

describe('normalizeContact / contactHref', () => {
  it('lowercases valid emails and rejects invalid ones', () => {
    expect(normalizeContact('email', ' Foo@Example.COM ')).toBe('foo@example.com');
    expect(normalizeContact('email', 'nope')).toBeNull();
    expect(normalizeContact('email', 'a@b')).toBeNull();
  });
  it('uses the phone rules for phone and whatsapp', () => {
    expect(normalizeContact('phone', '98765 43210')).toBe('+919876543210');
    expect(normalizeContact('whatsapp', '12345')).toBeNull();
  });
  it('builds safe links', () => {
    expect(contactHref('phone', '+919876543210')).toBe('tel:+919876543210');
    expect(contactHref('whatsapp', '+919876543210')).toBe('https://wa.me/919876543210');
    expect(contactHref('email', 'foo@example.com')).toBe('mailto:foo@example.com');
    expect(contactHref('email', 'javascript:alert(1)')).toBeNull();
    expect(contactHref('phone', 'garbage')).toBeNull();
  });
});
