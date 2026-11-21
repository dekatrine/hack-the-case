export const DAY_MS = 24 * 60 * 60 * 1000;
export const REVIEW_INTERVALS = [1, 3, 7, 14, 30];
export function masteryFor(attempts = []) {
  if (!attempts.length) return 'new';
  const recent = attempts.slice(-3);
  const ratio = recent.filter(a => a.correct).length / recent.length;
  if (recent.length >= 3 && ratio === 1) return 'advanced';
  if (ratio >= 0.5) return 'developing';
  return 'needs-practice';
}
export function nextReviewAt(now, successfulRecall = 1) {
  const interval = REVIEW_INTERVALS[Math.min(Math.max(successfulRecall - 1, 0), REVIEW_INTERVALS.length - 1)];
  return new Date(new Date(now).getTime() + interval * DAY_MS).toISOString();
}
export function recordAttempt(existing, lessonId, correct, now = new Date()) {
  const previous = existing[lessonId] || { attempts: [], successfulRecalls: 0, dueAt: null };
  const attempts = [...previous.attempts, { correct, at: new Date(now).toISOString() }].slice(-30);
  const successfulRecalls = correct ? previous.successfulRecalls + 1 : 0;
  const dueAt = correct ? nextReviewAt(now, successfulRecalls) : new Date(now).toISOString();
  return { ...existing, [lessonId]: { attempts, successfulRecalls, dueAt, mastery: masteryFor(attempts) } };
}
export function dueReviews(reviews, completed, now = new Date()) {
  const timestamp = new Date(now).getTime();
  return completed.filter(id => {
    const entry = reviews[id];
    return entry && entry.dueAt && new Date(entry.dueAt).getTime() <= timestamp;
  });
}
export function chooseChallenge(mastery) {
  return mastery === 'advanced' ? 'hard' : mastery === 'developing' ? 'medium' : 'basic';
}
export function simulateRevenue({ visits, conversionPct, avgOrderRub, monthlyFixedCostRub = 0 }) {
  const orders = visits * conversionPct / 100;
  const revenue = orders * avgOrderRub;
  return { orders, revenue, afterFixedCosts: revenue - monthlyFixedCostRub };
}
