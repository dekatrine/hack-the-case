import { skeletons } from '../interviews/engine.js';

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
// Первый собес до появления истории: время и опыт из онбординга важнее роли.
export function preferredSkeleton(profile) {
  if (profile?.minutes === '15') return [...skeletons].sort((a, b) => a.minutes - b.minutes)[0].id;
  if (profile?.experience === 'many') return profile.role === 'analyst' ? 'experiments' : 'strategy';
  return ROLES.find(([id]) => id === profile?.role)?.[2] || 'discovery';
}

export const needsSplit = profile => profile?.minutes === '15';
