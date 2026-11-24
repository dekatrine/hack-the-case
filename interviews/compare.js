import { debrief } from './rubric.js';

// Сравнение собеса с предыдущим завершённым собесом по готовым сценариям.
// Навыки сквозные, поэтому прошлый собес берём из любого сценария.
export function compareWithPrevious(run, runs) {
  if (run.configured) return null;
  const previous = runs
    .filter(item => item.id !== run.id && item.status === 'finished' && !item.configured && item.updatedAt < run.updatedAt)
    .sort((a, b) => b.updatedAt - a.updatedAt)[0];
  if (!previous) return null;
  let now; let before;
  try { now = debrief(run); before = debrief(previous); } catch { return null; }
  const skills = now.results.map(row => {
    const old = before.results.find(item => item.id === row.id);
    return old ? { id: row.id, label: row.label, from: old.grade, to: row.grade, delta: row.grade - old.grade } : null;
  }).filter(Boolean);
  return {
    previous: { id: previous.id, label: previous.skeleton.label, final: before.final },
    delta: now.final - before.final,
    changes: skills.filter(skill => Math.abs(skill.delta) >= 0.5).sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta)),
    unchanged: skills.length - skills.filter(skill => Math.abs(skill.delta) >= 0.5).length,
  };
}
