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
  ['metric', 'До следующего обновления команда может следить только за двумя показателями. Один должен показывать пользу, другой — возможный вред.'],
  ['priority', 'Команда просит сохранить текущую выручку, даже если рост замедлится.'],
];
const traps = ['partial', 'confounder', 'tracking'];
const names = ['Марина Орлова', 'Саша Волкова', 'Алексей Соколов'];
const pp = value => value.toLocaleString('ru-RU', { maximumFractionDigits: 2 });
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
  const experiments = skeleton.id === 'experiments';
  const market = skeleton.id === 'market';
  const groups = market ? ['Частные клиенты', 'Малый бизнес', 'Крупные компании'] : experiments ? ['Новые', 'Вернувшиеся', 'Постоянные'] : discovery ? ['Разовые', 'Периодические', 'Регулярные'] : ['Группа A', 'Группа B', 'Группа C'];
  const shares = [40 + industryIndex % 5, 34 - industryIndex % 5, 26];
  const focus = truthIndex % groups.length;
  const marketRates = [12, 6, 3].map(rate => rate + industryIndex % 3);
  const topDown = [2, 1.8, 2.4][trapIndex];
  const base = market ? marketRates.map(rate => rate * topDown) : experiments ? [3.2, 6.1, 9.4].map(rate => rate + industryIndex / 20) : discovery ? [6, 22, 32].map(rate => rate + industryIndex % 3) : [4, 4.5, 4.15].map(rate => rate + industryIndex / 10);
  const effect = [1.6, 2.1, 1.2][trapIndex];
  const rates = market ? marketRates : experiments ? base.map((rate, i) => i === focus ? rate + effect : rate) : discovery ? base : base.map((rate, i) => i === focus ? rate - 1.5 : rate);
  const before = mean(shares, base);
  const current = mean(shares, rates);
  const recovery = [87, 80, 92][trapIndex];
  const pilot = current + (before - current) * recovery / 100;
  const goal = Math.round(before) + 6;
  const lift = [2, 3, 1][trapIndex];
  const guardrail = [8, 12, 6][trapIndex];
  const margin = [4, 6, 2][trapIndex];
  const audience = 5 + industryIndex;
  const yearly = [600, 900, 1500][trapIndex];
  const billions = value => (audience * value / 100 * yearly / 1000).toLocaleString('ru-RU', { maximumFractionDigits: 1 });
  const trapNote = market ? [
    'Оценка сверху складывает группы, которые частично пересекаются.',
    'В расчёт вошли регионы, где услуга пока недоступна.',
    'Опрос охватил только тех, кто уже пользуется услугой.',
  ][trapIndex] : experiments ? [
    'Часть пользователей могла видеть оба варианта после смены устройства.',
    'Тест шёл в неделю распродажи, когда спрос выше обычного.',
    'Журнал назначения групп и аналитика показывают разное число людей.',
  ][trapIndex] : [
    'В выборке нет пользователей без согласия на аналитику. Проверь, можно ли ожидать такой же результат у остальных.',
    'В тот же период изменилась доля рекламного трафика. Сравни результат внутри каналов.',
    'Журнал операций и аналитика показывают разные числа. Проверь, что считает каждый источник.',
  ][trapIndex];
  const scenes = {
    segments: table('Показатели по группам', market ? ['Группа', 'Доля аудитории', 'Готовы платить'] : experiments ? ['Группа', 'Доля пользователей', 'Контроль', 'Вариант'] : discovery ? ['Группа', 'Доля покупателей', 'Купили снова'] : ['Группа', 'Доля пользователей', 'Конверсия до', 'Конверсия после'],
      groups.map((group, i) => market ? [group, percent(shares[i]), percent(rates[i])] : [group, percent(shares[i]), percent(base[i]), ...(!discovery ? [percent(rates[i])] : [])])),
    voice,
    experiment: `По сравнению с группой без изменений доля повторных заказов выросла на ${lift} п.п., а отписок стало на ${guardrail}% больше. Заработок с одного заказа снизился на ${margin}%. ${trapNote}`,
    pilot: table('Конверсия до и после исправления', ['До падения', 'На минимуме', 'После пробного исправления'], [[percent(before, 4), percent(current, 4), percent(pilot, 4)]]),
    channels: trapNote,
    result: market ? `Оценка сверху: ${billions(before)} млрд ₽ в год. Оценка снизу по данным: ${billions(current)} млрд ₽ в год. ${trapNote}` : `Вариант: ${percent(current)} против ${percent(before)} в контроле, разница ${pp(current - before)} п.п. Заработок с одного заказа в варианте ниже на ${margin}%. ${trapNote}`,
  };
  const sizeA = truthId === 'srm' ? 54 : 50;
  const days = truthId === 'novelty' ? [2.4, 0.9, 0.1] : [current - before, current - before, current - before];
  const clues = market ? [
    evidence('funnel', 'воронк|доля|шаг|сколько|аудитор|доступн', table('Воронка до платящих клиентов', ['Шаг', 'Доля аудитории'], [
      ['Вся аудитория', '100%'], [truthId === 'sam' ? 'Доступно в регионе' : 'Знают о продукте', truthId === 'sam' ? '35%' : '70%'], ['Готовы платить', percent(current)],
    ]), true),
    evidence('prices', 'цена|платят|чек|стоимост|платёж|платеж', table('Сколько платят на деле', ['Показатель', 'В расчёте', 'На деле'], [
      ['Платёж в год, ₽', String(yearly), String(Math.round(yearly * (truthId === 'price' ? .6 : .95)))],
    ]), true),
    evidence('free', 'заменител|бесплатн|конкурент|аналог', table('Чем пользуются вместо продукта', ['Вариант', 'Доля аудитории'], [
      ['Бесплатное приложение', truthId === 'substitute' ? '35%' : '8%'],
    ])),
  ] : experiments ? [
    evidence('split', 'дол|размер|групп|поровну|соотношен|назнач|числ', table('Размер групп в тесте', ['Группа', 'Попало в тест', 'По плану'], [
      ['Контроль', `${sizeA}%`, '50%'], ['Вариант', `${100 - sizeA}%`, '50%'],
    ]), true),
    evidence('daily', 'динамик|по дням|день|дни|недел|ход теста', table('Разница вариант минус контроль по дням', ['День', 'Разница, п.п.'], [
      ['День 1', pp(days[0])], ['День 7', pp(days[1])], ['День 14', pp(days[2])],
    ]), true),
    evidence('aov', 'чек|заработ|выруч|стоимост', table('Заработок с одного заказа', ['Показатель', 'Контроль', 'Вариант'], [
      ['Заработок с заказа', '100%', `${100 - margin}%`],
    ])),
  ] : discovery ? [
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
    truth: discovery || experiments || market ? truth : voice,
    example: discovery || experiments || market ? diagnosticSignal : '',
    focusGroup: groups[focus], twist, trapNote, recovery,
    profile: names[(industryIndex + truthIndex) % names.length],
    intro: market
      ? `Команда продукта из отрасли «${label}» хочет выйти с новым платным сервисом. Сверху рынок оценили в ${billions(before)} млрд ₽ в год. Нужно решить, стоит ли входить.`
      : experiments
      ? `Команда продукта из отрасли «${label}» провела A/B-тест нового шага «${transaction}»: ${percent(current)} в варианте против ${percent(before)} в контроле. Решаем, раскатывать ли.`
      : discovery
      ? `${percent(before)} новых клиентов возвращаются за второй покупкой. Команда продукта из отрасли «${label}» хочет, чтобы больше клиентов возвращались, при этом важно сохранить заработок с заказа.`
      : `Сервис из отрасли «${label}» заметил падение конверсии для действия «${transaction}» с ${percent(before)} до ${percent(current)}. Помоги команде выяснить причину.`,
    replies: {
      repeat: `Считаем второй оплаченный заказ в течение 30 дней. Цель на квартал — ${goal}%.`,
      discount: 'Со скидкой 10% доля повторных покупок выросла на 1 процентный пункт, а с заказа стали зарабатывать меньше.',
      competitors: 'У двух конкурентов легко найти прошлую покупку из истории. У нашего продукта история спрятана глубже.',
      test: 'Главная метрика — доля оформивших заказ среди всех зашедших. Тест шёл две недели, пользователей делили между контролем и вариантом по плану поровну.',
      scope: market ? 'Считаем годовую выручку в одной стране от частных клиентов и малого бизнеса.' : `Сравниваем две соседние недели. Берём всех, кто начал, и считаем, какая их доля успешно завершила действие «${transaction}».`,
    },
    scenes, clues, numbers: { shares, rates, base, before, current, pilot },
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

const requestAliases = {
  channel: /откуда|реклам|органик/i,
  categories: /перв.{0,18}(покуп|заказ)|что.{0,14}купили/i,
  segments: /устройств|телефон|браузер/i,
  independent: /запис|подтвержд|журнал/i,
  channels: /откуда|источник.{0,14}посещ/i,
};

export function matchingClues(run, move, request) {
  if (!/дол|повтор|конверс|потер|сравн|период|заказ|измен|ошиб|подтвержд|метрик|покупк|покупа|купил|вернул|успешн|сколько|заверш|оплат|групп|динамик|чек|заработ|размер/i.test(request)) return [];
  return run.seed.clues.filter(clue => move.evidence?.includes(clue.id)
    && (new RegExp(clue.pattern, 'i').test(request) || requestAliases[clue.id]?.test(request)));
}
