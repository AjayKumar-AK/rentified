import { describe, expect, it } from 'vitest';
import { describeBrokerage, describeDeposit, formatRupees, safeSearchTerm, slugify } from '@/lib/format';

describe('format', () => {
  it('formats rupees with Indian digit grouping', () => {
    expect(formatRupees(25000)).toBe('₹25,000');
    expect(formatRupees(1250000)).toBe('₹12,50,000');
  });
  it('distinguishes "not specified" from zero', () => {
    expect(describeDeposit(null)).toBe('Deposit not specified');
    expect(describeDeposit(0)).toBe('No deposit (as stated)');
    expect(describeDeposit(50000)).toBe('Deposit ₹50,000');
    expect(describeBrokerage('not_specified', null)).toBe('Brokerage not specified');
    expect(describeBrokerage('none', null)).toBe('No brokerage (as stated)');
    expect(describeBrokerage('applies', 15000)).toBe('Brokerage ₹15,000');
    expect(describeBrokerage('applies', null)).toBe('Brokerage applies (amount not stated)');
  });
  it('slugifies and falls back for non-latin titles', () => {
    expect(slugify('Sunny 2BHK near Metro!')).toBe('sunny-2bhk-near-metro');
    expect(slugify('சென்னை வீடு')).toBe('listing');
  });
  it('strips filter-breaking characters from search terms but keeps Unicode letters', () => {
    expect(safeSearchTerm('foo,bar)%_*')).toBe('foo bar');
    expect(safeSearchTerm('இந்திரா நகர்')).toBe('இந்திரா நகர்');
  });
});
