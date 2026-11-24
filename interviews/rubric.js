import skills from '../backend/app/practice_skills.json';

export const RUBRIC_VERSION = 1;
const dimensions = {
  structure: ['Структура', 'segments', 'Разложи ответ на части и обозначь, что проверишь первой.'],
  data: ['Данные', 'evidence', 'Возьми один открытый срез и объясни, как сравнение меняет вывод.'],
  hypotheses: ['Гипотезы', 'validation', 'Назови результат проверки, при котором откажешься от гипотезы.'],
  choice: ['Выбор и приоритет', 'tradeoffs', 'Сравни два варианта по одному критерию и назови цену выбора.'],
  metrics: ['Метрики', 'metrics', 'Укажи период, порог успеха и сигнал остановки.'],
  risks: ['Риски', 'assumptions', 'Назови конкретный риск и действие, если он проявится.'],
  communication: ['Коммуникация', 'affected_users', 'Начни с решения и объясни, кого затронет следующий шаг.'],
};

const fractions = [
  [/две трет[иь]|2\s*\/\s*3/i, 200 / 3],
  [/три четверт|3\s*\/\s*4/i, 75],
  [/половин|1\s*\/\s*2/i, 50],
  [/девять десятых|9\s*\/\s*10/i, 90],
];

function recoveryCheck(answer, expected) {
  const values = [...answer.matchAll(/(-?\d+(?:[.,]\d+)?)\s*(?:%|процент(?:ов|а)?)/gi)]
    .map(match => Number(match[1].replace(',', '.')));
  const claimed = fractions.find(([pattern]) => pattern.test(answer))?.[1] ?? values.at(-1);
  if (claimed === undefined) return { missing: true };
  if (Math.abs(claimed - expected) <= 2) return {};
  return { error: `Указано ${Number(claimed.toFixed(1))}%, по таблице восстановлено ≈${expected}% просадки.` };
}

export function assessTurn(run, move, answer, choice, opened) {
  const text = answer.trim();
  const matches = (move.checks || []).filter(pattern => new RegExp(pattern, 'i').test(text)).length;
  const words = text.match(/[\p{L}\p{N}]+/gu) || [];
  let grade = 0;
  if (new Set(words.map(word => word.toLowerCase())).size >= 5) {
    grade = matches >= 3 ? 3 : matches === 2 ? 2 : matches === 1 ? 1 : 0;
  }
  if (move.options && !move.justify) grade = choice === move.options[0] ? Math.max(2, grade) : Math.min(1, grade);
  if (move.evidence && opened.length > 0) grade = Math.max(grade, 2);
  if (move.kind === 'CHALLENGE' && !/если|потому|по данным|показа|сравн|провер/i.test(text)) grade = Math.min(1, grade);
  if (move.kind === 'DEMAND' && /^(Раскатить|Запустить полностью)$/.test(choice)) grade = Math.min(1, grade);
  const fact = move.fact === 'recovery' ? recoveryCheck(text, run.seed.recovery) : {};
  if (fact.error) grade = Math.min(1, grade);
  if (fact.missing) grade = Math.min(1, grade);
  return { grade, error: fact.error, quote: text || choice, dimension: move.dimension };
}

export function debrief(run) {
  const errors = run.history.filter(entry => entry.assessment.error);
  const defended = run.history.some(entry => entry.kind === 'CHALLENGE' && entry.assessment.grade >= 2);
  const results = Object.entries(dimensions).map(([id, [label, skill, advice]]) => {
    const entries = run.history.filter(entry => entry.assessment.dimension === id);
    const mean = entries.reduce((sum, entry) => sum + entry.assessment.grade, 0) / Math.max(1, entries.length);
    const evidence = [...entries].sort((a, b) => a.assessment.grade - b.assessment.grade)[0];
    return {
      id, label, advice, practice: skills[skill].label,
      grade: errors.length && ['data', 'communication'].includes(id) ? Math.min(mean, 1) : mean,
      quote: evidence?.assessment.quote, turnId: evidence?.id,
    };
  });
  const raw = Math.round(results.reduce((sum, result) => sum + result.grade, 0) / (results.length * 3) * 100);
  const quality = Math.min(raw, errors.length || !defended ? 95 : 100);
  const penalty = Object.keys(run.hints).length;
  const weakest = results.reduce((a, b) => a.grade <= b.grade ? a : b);
  return { quality, penalty, final: Math.max(0, quality - penalty), errors, results, recommendation: weakest.advice };
}
