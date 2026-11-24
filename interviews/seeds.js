const industries = [
  ['delivery', 'Быстрая доставка', 'заказ продуктов'],
  ['retail', 'Интернет-магазин', 'покупка товаров для дома'],
  ['fintech', 'Финтех', 'оплата счёта'],
  ['marketplace', 'Маркетплейс', 'заказ у продавца'],
  ['edtech', 'EdTech', 'покупка занятия'],
  ['mobility', 'Городская мобильность', 'бронирование поездки'],
  ['streaming', 'Стриминг', 'аренда фильма'],
  ['saas', 'B2B SaaS', 'покупка пакета обработок'],
  ['travel', 'Путешествия', 'бронирование жилья'],
  ['fitness', 'Фитнес', 'запись на тренировку'],
];
const twists = [
  ['capacity', 'Команда может выделить двух разработчиков на три недели.'],
  ['access', 'Команда временно не может менять серверную часть.'],
  ['metric', 'До следующего релиза команда может наблюдать только основную метрику и один защитный показатель.'],
  ['priority', 'Интервьюер просит защитить текущую выручку, даже если это замедлит рост.'],
];
const traps = ['partial', 'confounder', 'tracking'];
const names = ['Марина Орлова', 'Саша Волкова', 'Алексей Соколов'];
const percent = (value, digits = 2) => value.toLocaleString('ru-RU', { maximumFractionDigits: digits }) + '%';
const mean = (shares, rates) => rates.reduce((sum, rate, i) => sum + rate * shares[i] / 100, 0);
const table = (title, headers, rows) => ({ title, headers, rows });
const evidence = (id, pattern, details, supportsTruth = false) => ({ id, pattern, ...details, supportsTruth });

function makeSeed(skeleton, axes) {
  const { industryIndex, truthIndex, twistIndex, trapIndex } = axes;
  const [industry, label, transaction] = industries[industryIndex];
  const [truthId, truth, voice, diagnosticSignal] = skeleton.truths[truthIndex];
  const [twistId, twist] = twists[twistIndex];
  const discovery = skeleton.id === 'discovery';
  const groups = discovery ? ['Разовые', 'Периодические', 'Регулярные'] : ['Группа A', 'Группа B', 'Группа C'];
  const shares = [40 + industryIndex % 5, 34 - industryIndex % 5, 26];
  const focus = truthIndex % groups.length;
  const base = discovery ? [6, 22, 32].map(rate => rate + industryIndex % 3) : [4, 4.5, 4.15].map(rate => rate + industryIndex / 10);
  const rates = discovery ? base : base.map((rate, i) => i === focus ? rate - 1.5 : rate);
  const before = mean(shares, base);
  const current = mean(shares, rates);
  const recovery = [87, 80, 92][trapIndex];
  const pilot = current + (before - current) * recovery / 100;
  const goal = Math.round(before) + 6;
  const lift = [2, 3, 1][trapIndex];
  const guardrail = [8, 12, 6][trapIndex];
  const trapNote = [
    'В выборке нет пользователей без согласия на аналитику. Экстраполяция на всех требует проверки.',
    'В тот же период изменилась доля рекламного трафика. Сравни результат внутри каналов.',
    'В журнале есть расхождение со счётчиком аналитики. Проверь определение событий.',
  ][trapIndex];
  const scenes = {
    segments: table('Сегменты', discovery ? ['Сегмент', 'Доля', 'Повтор'] : ['Сегмент', 'Доля', 'До', 'После'],
      groups.map((group, i) => [group, percent(shares[i]), percent(base[i]), ...(!discovery ? [percent(rates[i])] : [])])),
    voice,
    experiment: `Тест показал рост доли повторных заказов на ${lift} п.п. и рост отписок на ${guardrail}% относительно контроля. ${trapNote}`,
    pilot: table('Пилот исправления', ['До просадки', 'На минимуме', 'После пилота'], [[percent(before, 4), percent(current, 4), percent(pilot, 4)]]),
    channels: trapNote,
  };
  const clues = discovery ? [
    evidence('channel', 'канал|источник', table('Повтор по каналу привлечения', ['Канал', 'Повтор', 'Где теряется покупатель'], [
      ['Органика', percent(before + 2), truth], ['Платное привлечение', percent(before - 2), truth],
    ]), true),
    evidence('categories', 'категори|разов|периодическ|регуляр|сегмент', table('Повтор по первой категории', ['Первая покупка', 'Наблюдение'], [
      [transaction, `${groups[focus]} чаще сталкиваются с препятствием: ${truth.toLowerCase()}.`],
      ['Другие категории', 'Сильного разрыва внутри категории нет.'],
    ]), true),
  ] : [
    evidence('segments', 'сегмент|платформ|групп|верси', table('Детализация основной группы', ['Группа', 'Аналитика до', 'Аналитика после', 'Что изменилось'], [
      [groups[focus], percent(base[focus]), percent(rates[focus]), diagnosticSignal],
    ]), true),
    evidence('independent', 'лог|сервер|событи|контрол', table('Независимая проверка', ['Источник', 'Проблемная группа', 'Остальные'], [
      ['Журнал операций', truthId === 'tracking' ? 'Подтверждения стабильны, события теряются до отправки' : voice, 'Сопоставимого сдвига нет'],
    ]), true),
    evidence('channels', 'канал|реклам|органик|источник', table('Проверка состава трафика', ['Канал', 'Проблемная группа', 'Остальные'], [
      ['Платный', 'Есть расхождение после начала просадки', 'Без просадки'],
      ['Органический', 'Есть расхождение после начала просадки', 'Без просадки'],
    ])),
  ];
  return {
    ...axes, id: `${industry}:${truthId}:${twistId}:${traps[trapIndex]}`,
    pair: `${industry}:${truthId}`, industry: label, transaction, groups,
    truth: discovery ? truth : voice,
    example: discovery ? diagnosticSignal : '',
    focusGroup: groups[focus], twist, trapNote, recovery,
    profile: names[(industryIndex + truthIndex) % names.length],
    intro: discovery
      ? `${percent(before)} новых клиентов возвращаются за второй покупкой. Продукту «${label}» нужно поднять повтор, сохранив маржу.`
      : `В продукте «${label}» конверсия в действие «${transaction}» снизилась с ${percent(before)} до ${percent(current)}. Что изменилось?`,
    replies: {
      repeat: `Считаем второй оплаченный заказ в течение 30 дней. Цель на квартал — ${goal}%.`,
      discount: 'Скидка 10% на вторую покупку подняла повтор на 1 п.п. и снизила маржу.',
      competitors: 'У двух конкурентов легко найти прошлую покупку из истории. У нашего продукта история спрятана глубже.',
      scope: `Сравниваем две соседние недели. Метрика — доля начавших сценарий, завершивших действие «${transaction}».`,
    },
    scenes, clues, numbers: { shares, rates, before, current, pilot },
  };
}

export function validateSeed(skeleton, seed) {
  const { shares, rates, current, before, pilot } = seed.numbers;
  if (shares.reduce((sum, share) => sum + share, 0) !== 100
    || rates.length !== shares.length || rates.some(rate => rate < 0 || rate > 100)
    || Math.abs(mean(shares, rates) - current) > 0.0001) throw new Error('Несогласованные сегменты');
  if (skeleton.id === 'diagnosis' && Math.abs((pilot - current) / (before - current) * 100 - seed.recovery) > 0.01) {
    throw new Error('Несогласованный результат пилота');
  }
  const requestable = skeleton.phases.flatMap(phase => phase.turns.flatMap(turn => turn.evidence || []));
  if (seed.clues.filter(clue => clue.supportsTruth && requestable.includes(clue.id)).length < 2) {
    throw new Error('Не хватает двух независимых запросов к данным');
  }
  if (seed.intro.length > 220) throw new Error('Слишком длинный брифинг');
  return seed;
}

export function chooseSeed(skeleton, runs, random = Math.random) {
  const recent = runs.filter(run => run.skeleton.id === skeleton.id).slice(0, 5).map(run => run.seed);
  const pairs = industries.flatMap((_, industryIndex) => skeleton.truths.map((__, truthIndex) => ({ industryIndex, truthIndex })));
  const allowed = pairs.filter(pair => !recent.some(seed => seed.industryIndex === pair.industryIndex && seed.truthIndex === pair.truthIndex));
  const varied = allowed.filter(pair => !recent.slice(0, 2).some(seed => seed.industryIndex === pair.industryIndex || seed.truthIndex === pair.truthIndex));
  const pool = varied.length ? varied : allowed;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const axes = pool[Math.floor(random() * pool.length)];
    try {
      return validateSeed(skeleton, makeSeed(skeleton, { ...axes, twistIndex: Math.floor(random() * twists.length), trapIndex: Math.floor(random() * traps.length) }));
    } catch (error) {
      console.warn('Интервью: сид отклонён', skeleton.id, error.message);
    }
  }
  return validateSeed(skeleton, makeSeed(skeleton, { ...allowed[0], twistIndex: 0, trapIndex: 0 }));
}

export function matchingClues(run, move, request) {
  if (!/дол|повтор|конверс|потер|сравн|период|заказ|измен|ошиб|подтвержд|метрик/i.test(request)) return [];
  return run.seed.clues.filter(clue => move.evidence?.includes(clue.id) && new RegExp(clue.pattern, 'i').test(request));
}
