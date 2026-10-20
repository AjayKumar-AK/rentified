import { describe, expect, it } from 'vitest';
import { getListingWarnings, type WarningInput } from '@/lib/moderation/warnings';

const base: WarningInput = {
  title: 'Bright 2BHK flat',
  description: 'A bright, airy flat close to the main road with good light.',
  rent_inr: 20000,
  deposit_inr: 60000,
  brokerage_status: 'none',
  contributor_type: 'owner',
  private_address: 'Somewhere',
  photoCount: 4,
  duplicateContactCount: 0,
};
const msgs = (o: Partial<WarningInput>) => getListingWarnings({ ...base, ...o }).map((w) => w.message);

describe('getListingWarnings', () => {
  it('is quiet for a clean listing', () => {
    expect(msgs({})).toEqual([]);
  });
  it('flags contact details and links in the description', () => {
    expect(msgs({ description: 'Call me on 98765 43210 for details about this flat' }).join()).toMatch(/contact details/);
    expect(msgs({ description: 'mail owner@example.com for details about this flat' }).join()).toMatch(/contact details/);
    expect(msgs({ description: 'see www.example.com for details about this flat' }).join()).toMatch(/contact details/);
  });
  it('flags unusual rent and deposit', () => {
    expect(msgs({ rent_inr: 900 }).join()).toMatch(/unusual/);
    expect(msgs({ rent_inr: 500000 }).join()).toMatch(/unusual/);
    expect(msgs({ deposit_inr: 20000 * 13 }).join()).toMatch(/12 months/);
  });
  it('flags duplicates and thin photo sets', () => {
    expect(msgs({ duplicateContactCount: 2 }).join()).toMatch(/2 other listings/);
    expect(msgs({ photoCount: 1 }).join()).toMatch(/Only 1 photo provided/);
  });
});
