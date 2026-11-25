import { beforeEach, expect, it } from 'vitest';
import { clearReview, dueReview, readReview, scheduleReview } from './review.js';

const day = 24 * 3600 * 1000;
beforeEach(() => localStorage.clear());

it('schedules a re-check three days after the debrief and becomes due then', () => {
  const entry = scheduleReview({ runId: 'a', skillId: 'hypotheses', label: 'Гипотезы' }, 1000);
  expect(entry.due).toBe(1000 + 3 * day);
  expect(dueReview(1000 + 2 * day)).toBeNull();
  expect(dueReview(1000 + 3 * day).label).toBe('Гипотезы');
});
it('does not reschedule the same run and lets a newer run replace the entry', () => {
  scheduleReview({ runId: 'a', skillId: 'hypotheses', label: 'Гипотезы' }, 1000);
  expect(scheduleReview({ runId: 'a', skillId: 'hypotheses', label: 'Гипотезы' }, 5 * day).due).toBe(1000 + 3 * day);
  expect(scheduleReview({ runId: 'b', skillId: 'data', label: 'Данные' }, 5 * day).skillId).toBe('data');
});
it('clears and tolerates broken storage', () => {
  scheduleReview({ runId: 'a', skillId: 'data', label: 'Данные' }, 1000);
  clearReview();
  expect(readReview()).toBeNull();
  localStorage.setItem('htc_skill_review_v1', '{broken');
  expect(readReview()).toBeNull();
});
