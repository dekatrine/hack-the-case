import { expect, it } from 'vitest';
import { collectAttempts } from './attempts.js';
import { summarize, weeklyRhythm } from './progress.js';

const run = (id, updatedAt, final) => ({ id, status: 'finished', updatedAt, configured: {}, skeleton: { id: 'x', title: `Собес ${id}`, label: id }, review: { score: { final } } });
const kase = { id: 'c1', title: 'Кейс про конверсию', updatedAt: '2026-01-03T00:00:00Z', attempts: [
  { createdAt: '2026-01-02T00:00:00Z', score: { final: 55 } }, { createdAt: '2026-01-03T00:00:00Z' }] };

it('merges interviews and case attempts into one list, newest first', () => {
  const list = collectAttempts([run('a', Date.parse('2026-01-01T00:00:00Z'), 70)], [kase]);
  expect(list.map(item => item.kind)).toEqual(['case', 'case', 'interview']);
  expect(list[1].score).toBe(55);
  expect(list[0].score).toBeNull();
});

it('counts case attempts in totals, score line and weekly rhythm', () => {
  const list = collectAttempts([run('a', 1000, 70)], [kase]);
  const summary = summarize([run('a', 1000, 70)], list.filter(item => item.kind === 'case'));
  expect(summary.total).toBe(3);
  expect(summary.scores).toEqual([70, 55]);
  expect(summary.weakest).toBeNull();
  const day = 24 * 3600 * 1000;
  expect(weeklyRhythm(list.map(item => ({ status: 'finished', updatedAt: item.at })), Date.parse('2026-01-04T00:00:00Z') + day)).toBeGreaterThanOrEqual(1);
});
