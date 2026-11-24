import { expect, it } from 'vitest';
import { needsSplit, preferredSkeleton } from './onboarding.js';

it('uses role by default', () => {
  expect(preferredSkeleton({ role: 'analyst', experience: 'none', minutes: 'any' })).toBe('diagnosis');
  expect(preferredSkeleton({ role: 'pm', experience: 'some', minutes: '25' })).toBe('discovery');
  expect(preferredSkeleton(null)).toBe('discovery');
});

it('offers the shortest scenario when time is limited', () => {
  expect(preferredSkeleton({ role: 'pm', experience: 'none', minutes: '15' })).toBe('diagnosis');
  expect(needsSplit({ minutes: '15' })).toBe(true);
  expect(needsSplit({ minutes: '25' })).toBe(false);
});

it('starts experienced people with harder scenarios', () => {
  expect(preferredSkeleton({ role: 'pm', experience: 'many', minutes: '25' })).toBe('strategy');
  expect(preferredSkeleton({ role: 'analyst', experience: 'many', minutes: 'any' })).toBe('experiments');
});
