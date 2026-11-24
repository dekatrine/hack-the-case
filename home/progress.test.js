import { expect, it } from 'vitest';
import { recommendedSkeleton, summarize, weeklyRhythm } from './progress.js';

const configured = (updatedAt, final) => ({ status: 'finished', configured: {}, updatedAt, review: { score: { final } } });

it('includes reviewed configured interviews in the score line but not in skills', () => {
  const summary = summarize([configured(2, 80), configured(1, 60), { status: 'finished', configured: {}, updatedAt: 3 }]);
  expect(summary.scores).toEqual([60, 80]);
  expect(summary.average).toBe(70);
  expect(summary.total).toBe(3);
  expect(summary.weakest).toBeNull();
  expect(recommendedSkeleton(summary)).toBe('discovery');
});

it('counts weeks with at least one finished interview', () => {
  const day = 24 * 3600 * 1000;
  const runs = [{ status: 'finished', updatedAt: 100 * day - 1 * day }, { status: 'finished', updatedAt: 100 * day - 15 * day }];
  expect(weeklyRhythm(runs, 100 * day)).toBe(2);
});

it('recommends the scenario that trains the weakest skill', () => {
  const weakest = id => ({ weakest: { id } });
  expect(recommendedSkeleton(weakest('metrics'))).toBe('diagnosis');
  expect(recommendedSkeleton(weakest('hypotheses'))).toBe('experiments');
  expect(recommendedSkeleton(weakest('structure'))).toBe('market');
  expect(recommendedSkeleton(weakest('choice'))).toBe('discovery');
});
