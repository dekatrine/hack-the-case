const KEY = 'htc_onboarding_v1';
export const ROLES = [
  ['pm', 'Продуктовый менеджер', 'discovery'],
  ['analyst', 'Продуктовый аналитик', 'diagnosis'],
  ['consulting', 'Консалтинг', 'discovery'],
  ['explore', 'Пока присматриваюсь', 'discovery'],
];
export const EXPERIENCE = [['none', 'Ещё не ходил на собеседования'], ['some', 'Были 1–3 собеседования'], ['many', 'Много, хочу отточить']];
export const MINUTES = [['15', 'До 15 минут'], ['25', 'Около 25 минут'], ['any', 'Как получится']];

export function readOnboarding() {
  try { return JSON.parse(localStorage.getItem(KEY) || 'null'); } catch { return null; }
}
export function saveOnboarding(value) {
  try { localStorage.setItem(KEY, JSON.stringify(value)); } catch { /* ignore */ }
}
export function preferredSkeleton(profile) {
  return ROLES.find(([id]) => id === profile?.role)?.[2] || 'discovery';
}
