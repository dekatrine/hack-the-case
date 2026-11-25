import { debrief } from '../interviews/rubric.js';

export const SKILL_LABELS = {
  structure: 'Структура', data: 'Данные', hypotheses: 'Гипотезы', choice: 'Выбор и приоритет',
  metrics: 'Метрики', risks: 'Риски', communication: 'Коммуникация',
};
const DIAGNOSIS_SKILLS = ['metrics', 'data', 'risks'];

// Сводка по завершённым интервью по скелету (у настраиваемых нет локальной оценки).
export function summarize(runs, practice = []) {
  // practice: попытки в «Моих кейсах» ({ at, score }); навыки по ним не считаются.
  const practiceScores = practice.filter(item => Number.isFinite(item.score)).map(item => ({ updatedAt: item.at, final: item.score }));
  const scored = runs.filter(run => run.status === 'finished' && !run.configured)
    .map(run => ({ run, result: debrief(run) }))
    .sort((a, b) => a.run.updatedAt - b.run.updatedAt);
  // Настроенные интервью оцениваются LLM: в график идёт только итоговый балл, навыков у них нет.
  const reviewed = runs.filter(run => run.status === 'finished' && run.configured && Number.isFinite(run.review?.score?.final))
    .map(run => ({ updatedAt: run.updatedAt, final: run.review.score.final }));
  const timeline = [...scored.map(({ run, result }) => ({ updatedAt: run.updatedAt, final: result.final })), ...reviewed, ...practiceScores]
    .sort((a, b) => a.updatedAt - b.updatedAt);
  const skills = Object.keys(SKILL_LABELS).map(id => {
    const grades = scored.map(({ result }) => result.results.find(row => row.id === id)?.grade).filter(Number.isFinite);
    const recent = grades.slice(-3);
    return { id, label: SKILL_LABELS[id], percent: recent.length ? Math.round(recent.reduce((s, g) => s + g, 0) / recent.length / 3 * 100) : null };
  });
  const known = skills.filter(skill => skill.percent !== null).sort((a, b) => a.percent - b.percent);
  // A skill counts as weak only when it is actually below the bar; at 97/100 there is nothing to fix.
  const weakest = known[0] && known[0].percent < 83 ? known[0] : null;
  return {
    total: runs.filter(run => run.status === 'finished').length + practice.length,
    scores: timeline.map(item => item.final),
    average: timeline.length ? Math.round(timeline.reduce((sum, item) => sum + item.final, 0) / timeline.length) : null,
    skillRuns: scored.length,
    skills, weakest, strongest: known.at(-1) || null,
  };
}

export function recommendedSkeleton(summary) {
  if (!summary.weakest) return 'discovery';
  if (DIAGNOSIS_SKILLS.includes(summary.weakest.id)) return 'diagnosis';
  if (summary.weakest.id === 'hypotheses') return 'experiments';
  if (summary.weakest.id === 'structure') return 'market';
  return summary.weakest.id === 'choice' ? 'strategy' : 'discovery';
}

// Недельный ритм: сколько недель из последних четырёх есть хотя бы один собес.
export function weeklyRhythm(runs, now = Date.now()) {
  const week = 7 * 24 * 3600 * 1000;
  const done = runs.filter(run => run.status === 'finished');
  let active = 0;
  for (let i = 0; i < 4; i += 1) {
    if (done.some(run => now - run.updatedAt >= i * week && now - run.updatedAt < (i + 1) * week)) active += 1;
  }
  return active;
}
