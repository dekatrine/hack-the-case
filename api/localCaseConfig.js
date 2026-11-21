// Matches the selectable industries and difficulty labels in backend/app/data.py.
// Offline fallback for rendering the setup form, NOT a substitute for AI generation.
export const LOCAL_CASE_CONFIG = {
  industries: [
    'Agriculture / Сельское хозяйство', 'Airlines / Авиалинии',
    'Asset Management / Управление активами', 'Automobile / Автомобили',
    'Banking / Банки', 'Cement / Цемент', 'Defense / Оборона',
    'E-commerce / Маркетплейсы', 'EdTech / Образование',
    'EV / Электромобили', 'FMCG / Ритейл', 'Food Delivery / Доставка еды',
    'Food Processing / Пищевая промышленность', 'Healthcare / Медицина',
    'Hospitality / Гостеприимство', 'Insurance / Страхование',
    'Iron & Steel / Металлургия', 'IT & ITeS / IT-услуги',
    'Logistics / Логистика', 'Media & Entertainment / Медиа',
    'NBFC / Небанковские финансы', 'Oil & Gas / Нефть и газ',
    'Payments / Платежи', 'Pharma / Фарма', 'Real Estate / Недвижимость',
    'Renewable Energy / Возобновляемая энергетика', 'Retail / Ритейл',
    'Telecom / Телеком', 'Tourism / Туризм', 'HoReCa / Рестораны',
    'IT / SaaS', 'Промышленность / Производство',
  ],
  difficultyLevels: {
    'Начальный': 'Простой кейс для новичков: понятная проблема, один продукт, локальный рынок.',
    'Средний': 'Кейс среднего уровня: несколько бизнес-направлений, нужен market sizing, конкурентный анализ.',
    'Продвинутый': 'Сложный кейс как на Changellenge/McKinsey: неоднозначная проблема, нужна финмодель и стратегия.',
  },
};
