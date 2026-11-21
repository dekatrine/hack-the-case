import { describe, expect, it } from 'vitest';
import { chooseChallenge, dueReviews, nextReviewAt, recordAttempt, simulateRevenue } from './learningEngine.js';

describe('learning engine', () => {
  const now = new Date('2026-11-21T12:00:00Z');
  it('schedules recall and repeats mistakes immediately', () => {
    const a = recordAttempt({}, 'conversion', true, now);
    expect(a.conversion.dueAt).toBe('2026-11-22T12:00:00.000Z');
    expect(dueReviews(a, ['conversion'], now)).toEqual([]);
    expect(dueReviews(a, ['conversion'], new Date('2026-11-23T12:00:00Z'))).toEqual(['conversion']);
    const b = recordAttempt(a, 'conversion', false, now);
    expect(dueReviews(b, ['conversion'], now)).toEqual(['conversion']);
  });
  it('increases interval after successful recall', () => {
    expect(nextReviewAt(now, 2)).toBe('2026-11-24T12:00:00.000Z');
    expect(nextReviewAt(now, 3)).toBe('2026-11-28T12:00:00.000Z');
  });
  it('classifies practice consistently', () => {
    const a = [{correct:true},{correct:true},{correct:true}];
    const state = recordAttempt({conversion:{attempts:a,successfulRecalls:3}}, 'conversion', true, now);
    expect(chooseChallenge(state.conversion.mastery)).toBe('hard');
  });
  it('calculates live revenue from traffic, conversion and order value', () => {
    expect(simulateRevenue({visits:10000,conversionPct:5,avgOrderRub:1200})).toEqual({orders:500,revenue:600000,afterFixedCosts:600000});
    expect(simulateRevenue({visits:10000,conversionPct:6,avgOrderRub:1200}).revenue).toBe(720000);
  });
});
