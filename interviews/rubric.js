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

const stem = name => {
  const lower = name.toLowerCase();
  return lower.length > 6 ? lower.slice(0, -2) : lower;
};

// Сверяет проценты рядом с названием группы с числами сида (долей и показателей).
export function numberCheck(answer, seed) {
  const { shares, rates, base = [], before, current } = seed.numbers;
  const overall = [before, current, before + 6];
  for (let i = 0; i < seed.groups.length; i += 1) {
    const allowed = [shares[i], rates[i], base[i], ...overall].filter(Number.isFinite);
    const pattern = new RegExp(`${stem(seed.groups[i]).replace(/\s+/g, '\\s*')}[^.\n]{0,40}?(-?\\d+(?:[.,]\\d+)?)\\s*(?:%|процент)`, 'gi');
    for (const match of answer.matchAll(pattern)) {
      const value = Number(match[1].replace(',', '.'));
      if (!allowed.some(item => Math.abs(item - value) <= 2)) {
        return { error: `Для группы «${seed.groups[i]}» указано ${value}%. В таблице: доля ${shares[i]}%, показатель ${Number(rates[i].toFixed(1))}%.` };
      }
    }
  }
  return {};
}

export function assessTurn(run, move, answer, choice, opened) {
  const text = answer.trim();
  const matches = (move.checks || []).filter(pattern => new RegExp(pattern, 'i').test(text)).length;
  const words = text.match(/[\p{L}\p{N}]+/gu) || [];
  let grade = 0;
  const unique = new Set(words.map(word => word.toLowerCase())).size;
  if (unique >= 5) {
    grade = matches >= 3 ? 3 : matches === 2 ? 2 : matches === 1 ? 1 : 0;
    if (grade === 3 && unique < 9) grade = 2;
  }
  // Метрика без чисел — это перечисление слов, а не критерий успеха.
  if (move.dimension === 'metrics' && move.kind !== 'CLARIFY') {
    const numbers = (text.match(/\d+(?:[.,]\d+)?/g) || []).length;
    if (numbers === 0) grade = Math.min(grade, 1);
    else if (numbers === 1) grade = Math.min(grade, 2);
  }
  if (move.options && !move.justify) grade = choice === move.options[0] ? Math.max(2, grade) : Math.min(1, grade);
  if (move.evidence && opened.length > 0) grade = Math.max(grade, 2);
  if (move.kind === 'CHALLENGE' && !/если|потому|по данным|показа|сравн|провер/i.test(text)) grade = Math.min(1, grade);
  if (move.kind === 'DEMAND' && /^(Раскатить|Запустить полностью)$/.test(choice)) grade = Math.min(1, grade);
  const fact = move.fact === 'recovery' ? recoveryCheck(text, run.seed.recovery) : numberCheck(text, run.seed);
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
    const byGrade = [...entries].sort((a, b) => a.assessment.grade - b.assessment.grade);
    // Слабая оценка показывает самый слабый ход, сильная — лучший.
    const evidence = mean >= 2.5 ? byGrade.at(-1) : byGrade[0];
    return {
      id, label, advice, practice: skills[skill].label, turnLabel: evidence?.label,
      grade: errors.length && ['data', 'communication'].includes(id) ? Math.min(mean, 1) : mean,
      quote: evidence?.assessment.quote, turnId: evidence?.id,
    };
  });
  const raw = Math.round(results.reduce((sum, result) => sum + result.grade, 0) / (results.length * 3) * 100);
  const quality = Math.min(raw, errors.length || !defended ? 95 : 100);
  const penalty = Object.keys(run.hints).length;
  const weakest = results.reduce((a, b) => a.grade <= b.grade ? a : b);
  return { quality, penalty, final: Math.max(0, quality - penalty), errors, results, recommendation: weakest.turnLabel ? `${weakest.advice} Слабее всего ход «${weakest.turnLabel.replace(/^Уточнение · /, '')}».` : weakest.advice };
}
