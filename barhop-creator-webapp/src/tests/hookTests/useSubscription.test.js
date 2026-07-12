import { renderHook } from '@testing-library/react';
import {
  useSubscription,
  hasTierAccess,
  FEATURE_MIN_TIER,
  TIER_ORDER,
} from '../../hooks/useSubscription';

const STARTER_FLAGS = ['canPublish', 'basicAnalytics', 'digitalGuestlist'];
const PRO_FLAGS = [
  'customBorders',
  'videoUploads',
  'vipReservations',
  'whatsappAutomation',
];
const ENTERPRISE_FLAGS = ['staffPayouts', 'advancedAnalytics', 'posSync'];
const ALL_FLAGS = [...STARTER_FLAGS, ...PRO_FLAGS, ...ENTERPRISE_FLAGS];

const getFlags = (tier) =>
  renderHook(() => useSubscription(tier)).result.current;

describe('useSubscription - cumulative tier hierarchy', () => {
  it('covers every feature flag in this suite', () => {
    expect(Object.keys(FEATURE_MIN_TIER).sort()).toEqual([...ALL_FLAGS].sort());
  });

  it.each([['trial'], [null], [undefined], ['unknown-tier']])(
    'unlocks nothing for %s',
    (tier) => {
      const flags = getFlags(tier);
      ALL_FLAGS.forEach((flag) => expect(flags[flag]).toBe(false));
    }
  );

  it('starter unlocks exactly the starter flags', () => {
    const flags = getFlags('starter');
    STARTER_FLAGS.forEach((flag) => expect(flags[flag]).toBe(true));
    [...PRO_FLAGS, ...ENTERPRISE_FLAGS].forEach((flag) =>
      expect(flags[flag]).toBe(false)
    );
  });

  it('pro inherits starter and unlocks pro flags', () => {
    const flags = getFlags('pro');
    [...STARTER_FLAGS, ...PRO_FLAGS].forEach((flag) =>
      expect(flags[flag]).toBe(true)
    );
    ENTERPRISE_FLAGS.forEach((flag) => expect(flags[flag]).toBe(false));
  });

  it('enterprise unlocks every flag without manual redundancy', () => {
    const flags = getFlags('enterprise');
    ALL_FLAGS.forEach((flag) => expect(flags[flag]).toBe(true));
  });

  it('normalizes tier casing', () => {
    expect(getFlags('PRO').vipReservations).toBe(true);
  });
});

describe('hasTierAccess', () => {
  it('is case-insensitive on both sides', () => {
    expect(hasTierAccess('pro', 'Pro')).toBe(true);
    expect(hasTierAccess('Enterprise', 'pro')).toBe(true);
  });

  it('locks lower tiers out of higher requirements', () => {
    expect(hasTierAccess('starter', 'pro')).toBe(false);
    expect(hasTierAccess('pro', 'enterprise')).toBe(false);
  });

  it('locks trial/undefined/unknown tiers', () => {
    expect(hasTierAccess('trial', 'starter')).toBe(false);
    expect(hasTierAccess(undefined, 'starter')).toBe(false);
    expect(hasTierAccess('vip', 'starter')).toBe(false);
  });

  it('locks everything behind an unknown required tier', () => {
    expect(hasTierAccess('enterprise', 'platinum')).toBe(false);
  });

  it('keeps the tier order stable', () => {
    expect(TIER_ORDER).toEqual(['starter', 'pro', 'enterprise']);
  });
});
