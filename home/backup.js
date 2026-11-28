// Резервная копия прогресса в файл: данные лежат в браузере, и без копии пропадут
// при очистке сайта или смене устройства.
const KEYS = [
  'htc_mvp_cases_v1', 'htc_interview_runs_v1', 'htc_interview_seen_v1', 'htc_onboarding_v1',
  'htc_learning_path_v1', 'htc_skill_review_v1', 'htc_saved_theory_v1',
];
export const BACKUP_KEYS = KEYS;
const FORMAT = 'hack-the-case-backup';

export function buildBackup(storage = localStorage, now = new Date()) {
  const data = {};
  for (const key of KEYS) {
    const value = storage.getItem(key);
    if (value !== null) data[key] = value;
  }
  return { format: FORMAT, version: 1, exportedAt: now.toISOString(), data };
}

// Возвращает { ok, restored } или { ok: false, error }. Ничего не пишет, если файл не прошёл проверку.
export function restoreBackup(text, storage = localStorage) {
  let parsed;
  try { parsed = JSON.parse(text); } catch { return { ok: false, error: 'Файл не похож на копию прогресса.' }; }
  if (parsed?.format !== FORMAT || typeof parsed.data !== 'object' || parsed.data === null) {
    return { ok: false, error: 'Это не копия Hack the Case.' };
  }
  const entries = Object.entries(parsed.data).filter(([key]) => KEYS.includes(key));
  for (const [, value] of entries) {
    if (typeof value !== 'string') return { ok: false, error: 'Копия повреждена.' };
    try { JSON.parse(value); } catch { return { ok: false, error: 'Копия повреждена.' }; }
  }
  if (!entries.length) return { ok: false, error: 'В файле нет данных прогресса.' };
  for (const [key, value] of entries) storage.setItem(key, value);
  return { ok: true, restored: entries.length };
}

export function downloadBackup() {
  const blob = new Blob([JSON.stringify(buildBackup(), null, 1)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `hack-the-case-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
