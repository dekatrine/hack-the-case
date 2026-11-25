// A skill re-check: after a debrief with a weak skill the app schedules it 3 days ahead.
export const REVIEW_KEY = 'htc_skill_review_v1';
export const REVIEW_DAYS = 3;
const DAY = 24 * 3600 * 1000;

export function readReview() {
  try {
    const value = JSON.parse(localStorage.getItem(REVIEW_KEY));
    return value && value.skillId && Number.isFinite(value.due) ? value : null;
  } catch { return null; }
}
// One entry at a time: the latest weak skill wins. The same run never reschedules itself.
export function scheduleReview({ runId, skillId, label }, now = Date.now()) {
  const current = readReview();
  if (current?.runId === runId) return current;
  const entry = { runId, skillId, label, due: now + REVIEW_DAYS * DAY };
  try { localStorage.setItem(REVIEW_KEY, JSON.stringify(entry)); } catch { /* storage is optional */ }
  return entry;
}
export function clearReview() {
  try { localStorage.removeItem(REVIEW_KEY); } catch { /* storage is optional */ }
}
export function dueReview(now = Date.now()) {
  const entry = readReview();
  return entry && entry.due <= now ? entry : null;
}
export function daysLeft(entry, now = Date.now()) {
  return Math.max(0, Math.ceil((entry.due - now) / DAY));
}
