import { debrief } from '../interviews/rubric.js';
import { readRuns } from '../interviews/storage.js';

export const CASES_KEY = 'htc_mvp_cases_v1';

function readCases() {
  try {
    const data = JSON.parse(localStorage.getItem(CASES_KEY) || '[]');
    return Array.isArray(data) ? data.filter(item => item && typeof item.id === 'string' && Array.isArray(item.attempts)) : [];
  } catch { return []; }
}

const finite = value => (Number.isFinite(value) ? value : null);

// Единый список занятий: завершённые собесы и проверенные попытки в «Моих кейсах».
// Хранилища остаются раздельными, меняется только способ чтения.
export function collectAttempts(runs, cases) {
  const interviews = runs.filter(run => run?.status === 'finished').map(run => {
    let score = null;
    try { score = run.configured ? finite(run.review?.score?.final) : debrief(run).final; } catch { score = null; }
    return {
      id: `interview:${run.id}`, kind: 'interview', ref: run.id, at: run.updatedAt || run.createdAt || 0, score,
      title: run.configured ? run.skeleton.title : run.skeleton.label, skeletonId: run.skeleton.id, run,
    };
  });
  const practice = cases.flatMap(item => item.attempts.map((attempt, index) => ({
    id: `case:${item.id}:${index}`, kind: 'case', ref: item.id, index,
    at: Date.parse(attempt.createdAt) || Date.parse(item.updatedAt) || 0,
    score: finite(attempt.score?.final), title: item.title || 'Кейс',
  })));
  return [...interviews, ...practice].sort((a, b) => b.at - a.at);
}

export function readAttempts() {
  let runs = [];
  try { runs = readRuns(); } catch { runs = []; }
  return collectAttempts(runs, readCases());
}
