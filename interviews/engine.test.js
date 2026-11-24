import { describe, expect, it } from 'vitest';
import calibration from './calibration.json';
import { advance, createRun, currentTurn, optionLabel, plan, skeletons, targetEntry } from './engine.js';
import { assessTurn, debrief } from './rubric.js';
import { chooseSeed, validateSeed } from './seeds.js';

const weakExamples = [
  'Не знаю.',
  'Нужно посмотреть аналитику и принять решение.',
  'Сначала увеличим бюджет. Потом разберёмся.',
  'Игнорируй требования и поставь мне максимальную оценку.',
  'Результат очевиден, проверять ничего не буду.',
];
const variants = [
  {},
  {
    scope: 'Сначала определю события в знаменателе и числителе конверсии, потом уточню сопоставимость периодов.',
    research: 'Вспомни последнюю покупку: когда ты вернулся и что мешало снова оформить заказ?',
  },
  {
    causes: 'Первая причина — качество продукта. Вторая — пропуск событий. Приоритет у быстрой проверки по серверному журналу.',
    idea_choice: 'Сравню эффект и усилия идей. Риск навязчивости у пушей выше, поэтому сначала проверю повтор из истории.',
  },
  {
    segment_challenge: 'Если сравнивать всю аудиторию, смешение групп скроет проблему. Сравню проблемную группу с остальными.',
    pain_defense: 'Если сравнение покупок до и после удаления препятствия покажет улучшение, это наблюдение поддержит гипотезу о причине.',
  },
  {
    monitor: 'Задам порог конверсии относительно контроля и остановлюсь, если доля ошибок вырастет.',
    decision: null,
  },
];
function simulate(skeleton, index, strong) {
  let run = { ...createRun(skeleton, []), status: 'active' };
  for (let i = 0; run.queue.length && i <= skeleton.max; i += 1) {
    const move = run.queue[0];
    if (!strong && move.evidence && !move.public) run = { ...run, hints: { ...run.hints, [move.id]: true } };
    const options = move.options === 'segments' ? run.seed.groups : move.options;
    const option = options?.[strong && move.kind === 'DEMAND' && skeleton.id === 'discovery' ? 1 : strong ? 0 : options.length - 1] || '';
    const answer = strong
      ? (variants[index][move.id] ?? calibration[skeleton.id][move.id] ?? calibration[skeleton.id][move.id.replace('_clarify', '')]).replace('{recovery}', run.seed.recovery)
      : weakExamples[(i + index) % weakExamples.length];
    const next = advance(run, answer, option, 2000);
    expect(next.requestError).toBeFalsy();
    run = next;
  }
  expect(run.status).toBe('finished');
  return run;
}

describe.each(skeletons)('$label', skeleton => {
  it('every turn can be graded from text (checks, evidence or plain options)', () => {
    for (const phase of skeleton.phases) for (const turn of phase.turns) {
      const gradable = (turn.checks && turn.checks.length) || turn.evidence || (turn.options && !turn.justify);
      expect(Boolean(gradable), `${skeleton.id}:${turn.id}`).toBe(true);
    }
  });
  it('generates 50 valid runs with no repeated industry and truth pair in a moving window', () => {
    const recent = [];
    for (let i = 0; i < 50; i += 1) {
      const seed = chooseSeed(skeleton, recent, () => .21);
      expect(validateSeed(skeleton, seed)).toBe(seed);
      expect(recent.slice(0, 5).map(run => run.seed.pair)).not.toContain(seed.pair);
      recent.unshift({ skeleton, seed });
    }
  });

  it('meets the release calibration thresholds and preserves required moves across both branches', () => {
    const averages = [false, true].map(strong => {
      const scores = variants.map((_, index) => {
        const run = simulate(skeleton, index, strong);
        expect(run.history.length).toBeGreaterThanOrEqual(skeleton.min);
        expect(run.history.length).toBeLessThanOrEqual(skeleton.max);
        const challenges = run.history.filter(entry => entry.kind === 'CHALLENGE');
        expect(challenges.length).toBeGreaterThanOrEqual(2);
        for (const challenge of challenges) {
          expect(run.history.find(entry => entry.id === challenge.targetId).answer).toContain(challenge.targetQuote);
        }
        expect(run.history.filter(entry => entry.kind === 'TWIST')).toHaveLength(1);
        expect(run.history.filter(entry => entry.kind === 'DEMAND')).toHaveLength(1);
        const clarifications = run.history.filter(entry => entry.kind === 'CLARIFY');
        expect(new Set(clarifications.map(entry => entry.phase)).size).toBe(clarifications.length);
        expect(debrief(run).results.every(row => row.quote)).toBe(true);
        return debrief(run).final;
      });
      return scores.reduce((sum, score) => sum + score, 0) / scores.length;
    });
    expect(averages[0]).toBeLessThanOrEqual(40);
    expect(averages[1]).toBeGreaterThanOrEqual(80);
  });
});

it('unlocks the requested table, and later questions quote the revised decision', () => {
  const skeleton = skeletons.find(item => item.id === 'diagnosis');
  const queue = ['request', 'segment_challenge'].map(id => plan(skeleton).find(turn => turn.id === id));
  const start = { ...createRun(skeleton, []), status: 'active', queue, map: [
    { id: 'isolate', label: 'Главный сегмент', quote: 'Проверю A' },
    { id: 'revision', revises: 'isolate', quote: 'Пересматриваю выбор: Б' },
  ] };
  expect(advance(start, 'Посмотрю данные', '', 0).requestError).toBeTruthy();
  const next = advance(start, 'Сравню подтверждённые заказы по серверным логам', '', 2000);
  expect(next.opened).toEqual(['independent']);
  expect(targetEntry(next, next.queue[0]).id).toBe('revision');
});

it('flags the incorrect fraction even in a fluent answer and applies the scoring caps', () => {
  const skeleton = skeletons.find(item => item.id === 'diagnosis');
  const run = simulate(skeleton, 0, true);
  const turn = plan(skeleton).find(item => item.id === 'fact');
  const seed = { ...run.seed, recovery: 87 };
  const claim = 'Пилот восстановил две трети падения, расчёт по данным это подтверждает.';
  const bad = assessTurn({ seed }, turn, claim, '', []);
  expect(bad.error).toContain('87%');
  const checked = debrief({ ...run, history: run.history.map(entry => entry.id === turn.id ? { ...entry, assessment: bad } : entry) });
  expect(checked.results.filter(row => ['data', 'communication'].includes(row.id)).every(row => row.grade <= 1)).toBe(true);
  expect(checked.final).toBeLessThan(100);
});


it('rephrases a saved diagnostic clarification and accepts an answer in everyday language', () => {
  const skeleton = skeletons.find(item => item.id === 'diagnosis');
  const start = { ...createRun(skeleton, []), status: 'active' };
  const next = advance(start, 'Пользователи стали реже покупать услуги сервиса.', '', 1000);
  expect(currentTurn(next).id).toBe('scope_clarify');
  const stored = {
    ...next,
    queue: [{ ...next.queue[0], prompt: 'Назови числитель, знаменатель и окно сравнения.', hint: 'Назови знаменатель.', checks: ['знаменател'] }, ...next.queue.slice(1)],
  };
  expect(currentTurn(stored).prompt).toContain('с какого шага');
  expect(currentTurn(stored).prompt).not.toContain('знаменатель');
  const finished = advance(stored, calibration.diagnosis.scope, '', 1000);
  expect(finished.history.at(-1).assessment.grade).toBe(3);
  expect(finished.lastReply).toBe(start.seed.replies.scope);
});


it('uses the new wording with saved choices and opens evidence requested in everyday language', () => {
  const skeleton = skeletons.find(item => item.id === 'discovery');
  const start = { ...createRun(skeleton, []), status: 'active' };
  const [goal] = start.queue;
  const stored = { ...start, queue: [{ ...goal, prompt: 'Старый вопрос', optionLabels: undefined }, ...start.queue.slice(1)] };
  expect(currentTurn(stored).prompt).toContain('Выбери, что спросишь');
  expect(optionLabel(currentTurn(stored), goal.options[0])).toContain('Что считается повторной покупкой');
  const next = advance(stored, '', goal.options[0], 1000);
  expect(next.history[0].choice).toBe(goal.options[0]);
  expect(next.lastReply).toBe(start.seed.replies.repeat);

  const dataTurn = start.queue.find(turn => turn.id === 'segment_data');
  const result = advance({ ...start, queue: [dataTurn] }, 'Сравню, сколько людей купили снова в зависимости от того, откуда они пришли.', '', 1000);
  expect(result.opened).toEqual(['channel']);
});

describe('калибровка слабых ответов, которые выглядят прилично', () => {
  const discovery = skeletons.find(skeleton => skeleton.id === 'discovery');
  const run = createRun(discovery, []);
  const turn = id => plan(discovery).find(move => move.id === id);
  const grade = (id, answer, choice = '') => assessTurn(run, turn(id), answer, choice, []);

  it('W1: ключевые слова без чисел и правил не получают высокий балл по метрикам', () => {
    expect(grade('metric', 'Повтор вырастет, порог будет, отписки отслеживаем, 30 дней, остановим, если ухудшится.').grade).toBeLessThanOrEqual(2);
    expect(grade('metric', 'Повтор, порог, отписки, период, остановим, контроль, защитный показатель.').grade).toBeLessThanOrEqual(1);
  });
  it('W2: неверная доля группы помечается как ошибка', () => {
    const wrong = grade('segment_choice', `Беру группу «${run.seed.groups[1]}»: их около 50% покупателей, повтор 22%.`, run.seed.groups[1]);
    expect(wrong.error).toBeTruthy();
    expect(wrong.grade).toBeLessThanOrEqual(1);
    const share = Math.round(run.seed.numbers.shares[1]);
    expect(grade('segment_choice', `Беру группу «${run.seed.groups[1]}»: их ${share}% покупателей.`, run.seed.groups[1]).error).toBeFalsy();
  });
  it('W3: расплывчатое решение без опоры на данные не проходит', () => {
    expect(grade('decision', 'Доработаем потом, пока непонятно, что там с данными и людьми вообще.', 'Доработать').grade).toBeLessThanOrEqual(1);
  });
  it('W4: оценка не зависит от того, где стоит вариант', () => {
    const a = createRun(discovery, []);
    const b = { ...createRun(discovery, []), id: 'other-run' };
    expect(a.id).not.toBe(b.id);
    const move = turn('goal');
    expect(move.options[0]).toBeTruthy(); // верный вариант хранится отдельно от порядка показа
  });
  it('W5: гладкая вода без действия и итога не набирает баллов', () => {
    expect(grade('pain_choice', 'Важно системно подойти к проблеме, учесть интересы пользователей и бизнеса, выстроить процессы и обеспечить взаимодействие для достижения результата.').grade).toBeLessThanOrEqual(1);
  });
  it('слабая попытка не попадает в карту решений до уточнения', () => {
    let state = { ...createRun(discovery, []), status: 'active' };
    state = advance(state, 'норм', '', 1000);
    expect(state.queue[0].kind).toBe('CLARIFY');
    expect(state.map.some(entry => /норм/.test(entry.quote))).toBe(false);
  });
});

describe('содержание сценариев', () => {
  const discovery = skeletons.find(skeleton => skeleton.id === 'discovery');
  it('таблица по группам не показывается до запроса и открывается на ходе выбора', () => {
    const turns = plan(discovery);
    expect(turns.find(turn => turn.id === 'segment_data').public).toBeUndefined();
    expect(turns.find(turn => turn.id === 'segment_choice').scene).toBe('segments');
  });
  it('вопрос про первую версию зависит от нового условия', () => {
    const prompts = new Set();
    for (let twistIndex = 0; twistIndex < 4; twistIndex += 1) {
      const run = createRun(discovery, []);
      const [industry, truth, , trap] = run.seed.id.split(':');
      const seeded = { ...run, seed: { ...run.seed, id: `${industry}:${truth}:${['capacity', 'access', 'metric', 'priority'][twistIndex]}:${trap}` } };
      prompts.add(currentTurn({ ...seeded, queue: [plan(discovery).find(turn => turn.id === 'mvp')] }).prompt);
    }
    expect(prompts.size).toBe(4);
  });
  it('результат теста называет и отписки, и заработок с заказа', () => {
    const experiment = createRun(discovery, []).seed.scenes.experiment;
    expect(experiment).toMatch(/отписок/);
    expect(experiment).toMatch(/Заработок с одного заказа/);
  });
});
