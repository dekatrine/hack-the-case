import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { createRoot } from 'react-dom/client';
import { api } from './api/client.js';
import { QUIZ_CATEGORIES, QUIZ_QUESTIONS } from './quizData.js';
import { PM_CHAPTERS, FLASHCARDS, PRACTICE_QUESTIONS, KEY_DEFINITIONS, LEARN_TOGETHER_CONTENT } from './courseData.js';
import './styles.css';

/* ───────────────────────────── Topbar ─────────────────────────────── */
const Topbar = ({ onHome, screen }) => (
  <header className="topbar">
    <div className="brand" onClick={onHome} style={{ cursor: 'pointer' }}>
      <span className="brand-mark">case <em>dojo</em></span>
      <span className="brand-tag">ai case club</span>
    </div>
    <div className="topbar-meta">
      <span><span className="dot" />ai mentor online</span>
      <span>{screen}</span>
    </div>
  </header>
);

/* ──────────────────────────── Landing ─────────────────────────────── */
const getLearningStats = () => ({
  chapters: PM_CHAPTERS.length,
  cards: Object.values(FLASHCARDS).reduce((sum, cards) => sum + cards.length, 0),
  questions: PRACTICE_QUESTIONS.length,
  definitions: KEY_DEFINITIONS.length,
});

const CasePrepMenu = ({ stats, onOpenTab, onOpenReview, onOpenExam }) => {
  const menuItems = [
    {
      group: 'Практика',
      items: [
        {
          title: 'Банк вопросов',
          subtitle: 'Практика с вариантами ответа и AI-разбором',
          meta: `${stats.questions} вопросов`,
          tone: 'blue',
          icon: '?',
          onClick: () => onOpenTab('Questionbank'),
        },
        {
          title: 'Конструктор кейса',
          subtitle: 'Собери пробный кейс под интервью',
          meta: 'AI-сценарий',
          tone: 'gray',
          icon: '↗',
          onClick: onOpenExam,
        },
      ],
    },
    {
      group: 'Учёба',
      items: [
        {
          title: 'Конспекты',
          subtitle: 'Теория, фреймворки и примеры ответов',
          meta: `${stats.chapters} модулей`,
          tone: 'yellow',
          icon: '≡',
          onClick: () => onOpenTab('Notes'),
        },
        {
          title: 'AI-наставник',
          subtitle: 'Объясни тему своими словами и получи проверку',
          meta: 'review-сессия',
          tone: 'purple',
          icon: 'AI',
          badge: 'New',
          onClick: onOpenReview,
        },
        {
          title: 'Карточки',
          subtitle: 'Активное вспоминание и интервальное повторение',
          meta: `${stats.cards} карточек`,
          tone: 'cyan',
          icon: '▰',
          onClick: () => onOpenTab('Flashcards'),
        },
        {
          title: 'Ключевые термины',
          subtitle: 'Короткие определения для быстрого повторения',
          meta: `${stats.definitions} терминов`,
          tone: 'pink',
          icon: '“',
          onClick: () => onOpenTab('Key Definitions'),
        },
      ],
    },
  ];

  return (
    <section className="casePrepMenu">
      {menuItems.map((group) => (
        <div key={group.group} className="casePrepMenuGroup">
          <h2>{group.group}</h2>
          <div className="casePrepMenuGrid">
            {group.items.map((item) => (
              <button key={item.title} className="casePrepMenuItem" onClick={item.onClick}>
                <span className={`casePrepMenuIcon ${item.tone}`}>
                  <span>{item.icon}</span>
                  {item.badge && <em>{item.badge}</em>}
                </span>
                <span className="casePrepMenuText">
                  <strong>{item.title}</strong>
                  <span>{item.subtitle}</span>
                  <small>{item.meta}</small>
                </span>
              </button>
            ))}
          </div>
        </div>
      ))}
    </section>
  );
};

const CourseContentPreview = ({ onSelectChapter, onOpenTab }) => (
  <section className="caseCourseContent">
    <div className="caseCourseContentHead">
      <span>Содержание курса</span>
      <h2>Содержание курса</h2>
      <p>Выбери модуль, чтобы открыть конспект по теме. Оттуда можно перейти к вопросам, карточкам и терминам.</p>
    </div>
    <div className="caseCourseRows">
      {PM_CHAPTERS.map((chapter) => (
        <button key={chapter.id} className="caseCourseRow" onClick={() => { onSelectChapter(chapter); onOpenTab('Notes'); }} style={{ '--col': chapter.color }}>
          <span>{chapter.number}</span>
          <div>
            <strong>{chapter.title}</strong>
            <small>{chapter.description}</small>
          </div>
          <em>{chapter.subtopics.length} тем</em>
        </button>
      ))}
    </div>
  </section>
);

const Landing = ({ tracks, onPickTrack, onOpenQuiz, onOpenInterview, onOpenLearn }) => {
  const stats = getLearningStats();
  const businessTrack = tracks.find((item) => item.id === 'business') || tracks[0];

  return (
    <div className="home-dashboard fade-in">
      <aside className="home-sidebar">
        <div className="workspace-pill">
          <span className="user-dot">PM</span>
          <div>
            <strong>Product Academy</strong>
            <span>free track</span>
          </div>
        </div>
        <nav className="home-menu" aria-label="Учебная навигация">
          <button className="active">Home</button>
          <button onClick={() => onOpenLearn('Notes')}>Lessons</button>
          <button onClick={() => onOpenLearn('Questionbank')}>Question Bank</button>
          <button onClick={() => onOpenLearn('Flashcards')}>Flashcards</button>
          <button onClick={() => onOpenLearn('Key Definitions')}>Glossary</button>
        </nav>
        <div className="home-menu-group">
          <span>Tools</span>
          <button onClick={onOpenInterview}>Mock interview</button>
          <button onClick={onOpenQuiz}>Sprint quiz</button>
          <button onClick={() => onOpenLearn('All Resources')}>All resources</button>
        </div>
        <div className="profile-row">
          <span className="avatar-mini">E</span>
          <strong>Ekaterina</strong>
        </div>
      </aside>

      <section className="home-main">
        <div className="home-toolbar">
          <label className="home-search">
            <span>⌕</span>
            <input placeholder="Найти урок, термин или кейс..." />
          </label>
          <div className="home-xp">
            <span>3 cases</span>
            <span>22 XP</span>
            <span>{stats.cards} cards</span>
          </div>
        </div>

        <section className="home-hero-panel">
          <div>
            <p className="eyebrow"><span className="num">home /</span> case prep resources</p>
            <h1>Добрый вечер,<br/><em>Ekaterina</em></h1>
            <p>Учись как в LMS: уроки, банк вопросов, карточки, термины, mock interview и полноценный кейс собраны в одном рабочем столе.</p>
          </div>
          <div className="hero-progress">
            <strong>{stats.chapters}</strong>
            <span>модулей академии</span>
          </div>
        </section>

        <section className="home-sale">
          <strong>PM Interview Sprint</strong>
          <span>Маршрут: конспект, question bank и карточки для закрепления.</span>
          <button onClick={() => onOpenLearn('All Resources')}>Открыть LMS <span className="arrow">→</span></button>
        </section>

        <div className="home-section-head">
          <h2>Мои треки</h2>
          <button onClick={() => onOpenLearn('Notes')}>Учебный курс <span className="arrow">→</span></button>
        </div>
        <div className="home-subjects">
          {tracks.map((track, idx) => (
            <button
              key={track.id}
              className={`subject-card ${track.id}`}
              onClick={() => onPickTrack(track)}
            >
              <span>{idx + 1 < 10 ? `0${idx + 1}` : idx + 1}</span>
              <h3>{track.name}</h3>
              <p>{track.tagline}</p>
              <em>Open →</em>
            </button>
          ))}
        </div>

        <section className="home-info-card">
          <div>
            <h2>Добро пожаловать в Hack the Case</h2>
            <p>Для старта подходит раздел Lessons. Для практики доступны треки с генерацией кейсов.</p>
          </div>
          <button className="btn btn-primary" onClick={() => onOpenLearn('Notes')}>Начать обучение</button>
        </section>

        <section className="home-study-plan">
          <div>
            <span>Study plan</span>
            <h2>Собери недельный маршрут и не теряй прогресс</h2>
            <p>{stats.questions} вопросов, {stats.cards} карточек, {stats.definitions} терминов и mock interview связаны в один путь.</p>
          </div>
          <button className="btn btn-ghost" onClick={() => businessTrack && onPickTrack(businessTrack)}>Собрать кейс</button>
        </section>
      </section>
    </div>
  );
};

const TrackCard = ({ track, idx, onPick }) => {
  const onMove = (e) => {
    const r = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty('--mx', `${e.clientX - r.left}px`);
    e.currentTarget.style.setProperty('--my', `${e.clientY - r.top}px`);
  };
  return (
    <button className="track-card" onClick={onPick} onMouseMove={onMove}>
      <span className="num">0{idx}</span>
      <span className="tag">{track.id === 'product' ? 'Product · Interview' : 'Strategy · Consulting'}</span>
      <h3>{track.name}</h3>
      <p className="tagline">{track.tagline}</p>
      <p className="desc">{track.description}</p>
      <div className="meta">
        <span>{track.duration}</span>
        <span>{track.chapters.length} chapters</span>
      </div>
    </button>
  );
};

/* ──────────────────────────── Track detail ─────────────────────────── */
const TrackDetail = ({ track, industries, difficulties, onStart, onBack }) => {
  const [industry, setIndustry] = useState(industries?.[0] || '');
  const [difficulty, setDifficulty] = useState(Object.keys(difficulties || {})[0] || '');
  const [extra, setExtra] = useState('');

  return (
    <div className="fade-in">
      <button className="btn btn-ghost" onClick={onBack} style={{ marginBottom: 32 }}>
        ← Все направления
      </button>
      <div className="eyebrow"><span className="num">02 /</span> {track.tagline}</div>
      <h1 className="hero" style={{ fontSize: 'clamp(40px, 6vw, 72px)' }}>{track.name}</h1>
      <p className="hero-sub">{track.description}</p>

      <h2 style={{ marginTop: 48 }}>Программа</h2>
      <div className="chapters">
        {track.chapters.map((c) => <ChapterCard key={c.id} chapter={c} />)}
      </div>

      <h2 style={{ marginTop: 64 }}>Сгенерировать кейс</h2>
      <div className="form-grid">
        <div className="field">
          <label>Отрасль</label>
          <select value={industry} onChange={(e) => setIndustry(e.target.value)}>
            {industries.map((i) => <option key={i}>{i}</option>)}
          </select>
        </div>
        <div className="field">
          <label>Сложность</label>
          <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
            {Object.entries(difficulties).map(([k, v]) => (
              <option key={k} value={k}>{k} — {v}</option>
            ))}
          </select>
        </div>
        <div className="field full-width">
          <label>Дополнительный контекст (опц.)</label>
          <textarea
            value={extra}
            onChange={(e) => setExtra(e.target.value)}
            placeholder="Например: B2B SaaS на американском рынке, упор на retention"
          />
        </div>
        <div className="full-width">
          <button
            className="btn btn-primary"
            onClick={() => onStart({ industry, difficulty, extraContext: extra, trackId: track.id })}
          >
            Начать симуляцию <span className="arrow">→</span>
          </button>
        </div>
      </div>
    </div>
  );
};

const ChapterCard = ({ chapter }) => (
  <div className="chapter">
    <div className="circle">{chapter.circle}</div>
    <h4>{chapter.title}</h4>
    <p>{chapter.summary}</p>
    {chapter.definition && <p className="definition">{chapter.definition}</p>}
    <div className="skills">
      {(chapter.skills || []).map((s) => <span key={s} className="skill">{s}</span>)}
    </div>
    {chapter.methodMaterials?.length > 0 && (
      <ul className="chapter-methods">
        {chapter.methodMaterials.slice(0, 3).map((item) => <li key={item}>{item}</li>)}
      </ul>
    )}
    <div className="outcome">{chapter.outcome}</div>
  </div>
);

const getTrackSteps = (track, steps) => {
  const ids = track?.chapters?.flatMap((chapter) => chapter.stepIds || []) || [];
  if (ids.length === 0) return steps;

  const stepById = new Map(steps.map((step) => [step.id, step]));
  const seen = new Set();

  return ids
    .filter((id) => {
      if (seen.has(id)) return false;
      seen.add(id);
      return true;
    })
    .map((id) => stepById.get(id))
    .filter(Boolean);
};

const getActiveChapter = (track, step) =>
  track?.chapters?.find((chapter) => chapter.stepIds?.includes(step?.id));

const formatTerm = (term) => {
  if (typeof term === 'string') return { name: term, meaning: '' };
  return term;
};

const cleanMarkdown = (value = '') =>
  value
    .replace(/\*\*/g, '')
    .replace(/^[-•]\s*/, '')
    .trim();

const extractHeading = (line) => {
  const trimmed = line.trim();
  if (!trimmed || /^[-•]/.test(trimmed)) return null;

  const boldWithColon = trimmed.match(/^\*\*([^*:]+?)\s*:\*\*\s*(.*)$/);
  if (boldWithColon) {
    return { label: cleanMarkdown(boldWithColon[1]), value: cleanMarkdown(boldWithColon[2]) };
  }

  const bold = trimmed.match(/^\*\*([^*]+?)\*\*\s*:?\s*(.*)$/);
  if (bold) {
    return { label: cleanMarkdown(bold[1].replace(/:$/, '')), value: cleanMarkdown(bold[2]) };
  }

  const plain = trimmed.match(/^([А-ЯA-ZЁ][^:]{2,42}):\s*(.*)$/);
  if (plain) {
    return { label: cleanMarkdown(plain[1]), value: cleanMarkdown(plain[2]) };
  }

  return null;
};

const classifyCaseSection = (label = '') => {
  const lower = label.toLowerCase();
  if (lower.includes('компан') || lower.includes('клиент')) return 'company';
  if (lower.includes('отрасл')) return 'industry';
  if (lower.includes('масштаб')) return 'scale';
  if (lower.includes('бизнес-модель') || lower.includes('модель')) return 'businessModel';
  if (lower.includes('продукт')) return 'product';
  if (lower.includes('аудитор') || lower.includes('пользовател') || lower.includes('сегмент')) return 'audience';
  if (lower.includes('контекст') || lower.includes('рынок')) return 'context';
  if (lower.includes('проблем') || lower.includes('задач')) return 'problem';
  if (lower.includes('данн') || lower.includes('цифр')) return 'data';
  if (lower.includes('вопрос')) return 'question';
  if (lower.includes('огранич') || lower.includes('вводн') || lower.includes('срок') || lower.includes('бюджет')) return 'constraints';
  return 'other';
};

const CASE_SECTION_META = {
  company: { label: 'Компания', badge: 'кто решает' },
  industry: { label: 'Отрасль', badge: 'где играем' },
  scale: { label: 'Масштаб', badge: 'размер' },
  businessModel: { label: 'Бизнес-модель', badge: 'как зарабатывает' },
  product: { label: 'Продукт', badge: 'что меняем' },
  audience: { label: 'Аудитория', badge: 'для кого' },
  context: { label: 'Контекст', badge: 'фон' },
  problem: { label: 'Проблема', badge: 'что болит' },
  data: { label: 'Данные', badge: 'цифры' },
  question: { label: 'Вопрос для решения', badge: 'что ответить' },
  constraints: { label: 'Ограничения', badge: 'рамки' },
  other: { label: 'Вводная', badge: 'факт' },
};

const parseCaseCondition = (caseText = '') => {
  const sections = [];
  let current = null;

  caseText.split(/\r?\n/).forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed) return;

    const heading = extractHeading(trimmed);
    if (heading) {
      current = {
        key: classifyCaseSection(heading.label),
        label: heading.label,
        lines: heading.value ? [heading.value] : [],
      };
      sections.push(current);
      return;
    }

    if (!current) {
      current = { key: 'other', label: 'Вводная', lines: [] };
      sections.push(current);
    }
    current.lines.push(trimmed);
  });

  return sections
    .map((section) => ({ ...section, text: section.lines.map(cleanMarkdown).filter(Boolean).join('\n') }))
    .filter((section) => section.text);
};

const splitTemplate = (template = '') =>
  template
    .split(/\s*->\s*/)
    .map((item) => cleanMarkdown(item))
    .filter(Boolean)
    .slice(0, 7);

const getVisualSteps = (chapter, step) => {
  if (chapter?.visualSteps?.length) return chapter.visualSteps;
  const fromTemplate = splitTemplate(step?.theory?.answerTemplate || '');
  if (fromTemplate.length > 1) return fromTemplate;
  return [
    'Прочитай вводную',
    'Выдели факты',
    'Сформулируй гипотезу',
    'Проверь данными',
    'Запиши вывод',
  ];
};

const INTERVIEW_DIRECTIONS = [
  {
    id: 'product',
    title: 'Product interview',
    name: 'Продуктовое собеседование',
    tag: 'PM · BigTech · Яндекс · Авито',
    summary: 'От ambiguity к продуктовой гипотезе: пользователь, метрика, решение, эксперимент и trade-offs.',
    accent: '#b8ff5c',
    blocks: [
      {
        id: 'product_sense',
        title: 'Product Sense / Design',
        short: 'Design',
        prompt: 'Улучши продукт или спроектируй новый сценарий для конкретного пользователя.',
        pattern: ['Цель', 'Пользователь', 'JTBD', 'Боли', 'MVP', 'Метрики'],
      },
      {
        id: 'product_execution',
        title: 'Execution / Analytics',
        short: 'RCA',
        prompt: 'Разбери падение метрики, найди root cause и предложи действия.',
        pattern: ['Метрика', 'Дерево', 'Сегменты', 'Причина', 'Actions', 'Guardrails'],
      },
      {
        id: 'product_strategy',
        title: 'Strategy / Monetization',
        short: 'Strategy',
        prompt: 'Выбери стратегию роста, монетизации или приоритет продукта.',
        pattern: ['Сегменты', 'Value', 'Economics', 'Trade-offs', 'Roadmap'],
      },
    ],
  },
  {
    id: 'consulting',
    title: 'Consulting case',
    name: 'Консалтинговое интервью',
    tag: 'MBB · Big4 · case championships',
    summary: 'От вопроса клиента к MECE-структуре, расчётам, инсайтам и top-down рекомендации.',
    accent: '#ffb86b',
    blocks: [
      {
        id: 'consulting_opening',
        title: 'Opening & Structure',
        short: 'Structure',
        prompt: 'Пойми клиента, цель, ограничения и построй маршрут решения.',
        pattern: ['Client', 'Objective', 'Clarify', 'MECE', 'Hypotheses'],
      },
      {
        id: 'consulting_math',
        title: 'Exhibit & Case Math',
        short: 'Math',
        prompt: 'Прочитай exhibit, посчитай экономику и вытащи so what.',
        pattern: ['Exhibit', 'Formula', 'Assumptions', 'Math', 'Insight'],
      },
      {
        id: 'consulting_recommendation',
        title: 'Recommendation',
        short: 'Land',
        prompt: 'Собери рекомендацию, риски, условия и первый шаг внедрения.',
        pattern: ['Answer', 'Evidence', 'Risks', 'Next step'],
      },
    ],
  },
];

const INTERVIEW_DIFFICULTIES = [
  { id: 'junior', label: 'Junior', text: 'меньше неоднозначности, больше явных данных' },
  { id: 'middle', label: 'Middle', text: 'реалистичный баланс данных, допущений и pushback' },
  { id: 'senior', label: 'Senior', text: 'больше ambiguity, trade-offs и executive judgment' },
];

const INTERVIEW_FOLLOW_UP_BANK = {
  product_sense: [
    'Кого ты выберешь primary user и почему не другой сегмент?',
    'Какой pain point самый частотный, а какой самый болезненный?',
    'Что будет MVP без лишнего scope?',
    'Какая primary metric покажет, что пользователь получил ценность?',
    'Какие guardrails защитят core experience?',
    'Что ты выкинешь из решения, если engineering capacity ограничена?',
    'Как изменится решение для новых и power users?',
    'Какой быстрый qualitative signal проверит проблему?',
    'Что может пойти не так после релиза?',
    'Как объяснишь trade-off между engagement и trust?',
  ],
  product_execution: [
    'Где именно упала метрика: платформа, гео, когорта, канал или версия?',
    'Какая метрика является input, а какая output?',
    'Что проверишь в change log за 7 дней до падения?',
    'Как отделишь сезонность от продуктовой причины?',
    'Когда нужно rollback, а когда достаточно mitigation?',
    'Какие guardrails нельзя ухудшить ради восстановления метрики?',
    'Какой dashboard нужен в первые 24 часа?',
    'Что сделаешь, если данные противоречат user research?',
    'Какой эксперимент докажет root cause?',
    'Как приоритизируешь 3 гипотезы при нехватке аналитиков?',
  ],
  product_strategy: [
    'Почему этот рынок или сегмент важен именно сейчас?',
    'Что будет главным источником defensibility?',
    'Какой bet ты сделаешь первым и почему?',
    'Как монетизация может ухудшить retention или trust?',
    'Какие capabilities уже есть у компании?',
    'Что сделает конкурент, если мы успешно запустимся?',
    'Как оценишь opportunity size без точных данных?',
    'Какая стратегия будет неверной для enterprise и SMB одновременно?',
    'Какой north-star outcome важнее revenue в первые месяцы?',
    'Что должно случиться, чтобы ты отменил стратегию?',
  ],
  consulting_opening: [
    'Какой exact decision question должен быть в конце рекомендации?',
    'Какие ограничения могут полностью изменить маршрут решения?',
    'Какие 3 ветки issue tree первого уровня будут MECE?',
    'Как объяснишь, почему эта структура является action plan?',
    'Какие данные попросишь первыми и зачем?',
    'Что является фактом, а что допущением?',
    'Как не потерять основную цель клиента в середине кейса?',
    'Какая гипотеза будет первой рабочей гипотезой?',
    'Что исключишь из scope?',
    'Какой критерий успеха сделает ответ управленческим?',
  ],
  consulting_math: [
    'Какая формула связывает данные exhibit с вопросом клиента?',
    'Что является самой чувствительной переменной?',
    'Как проверишь порядок величины результата?',
    'Что значит этот расчёт для go/no-go решения?',
    'Где риск перепутать проценты и процентные пункты?',
    'Какие данные из таблицы нерелевантны для вывода?',
    'Какой quick calculation можно сделать вслух за 30 секунд?',
    'Что делать, если расчёт даёт неожиданный результат?',
    'Какая unit economics метрика важнее средней выручки?',
    'Как объяснишь insight, не пересказывая таблицу?',
  ],
  consulting_recommendation: [
    'Как звучит ответ в первом предложении?',
    'Какие 2-3 доказательства сильнее всего поддерживают рекомендацию?',
    'Какой риск может перевернуть рекомендацию?',
    'Что клиент должен сделать в первые 2 недели?',
    'Какие условия должны быть выполнены перед масштабированием?',
    'Как отделишь рекомендацию от списка инициатив?',
    'Какой downside нужно честно назвать партнёру?',
    'Что бы ты проверил, если появится ещё один день анализа?',
    'Как показать финансовый эффект без лишней точности?',
    'Какой executive trade-off должен принять клиент?',
  ],
};

const getInterviewFollowups = (blockId, roundId, directionId) => {
  const base = INTERVIEW_FOLLOW_UP_BANK[blockId] || [];
  const offsetByRound = {
    opening_move: 0,
    clarifying_questions: 2,
    solution_route: 4,
    data_move: 6,
    pushback_synthesis: 8,
  };
  const fallback = directionId === 'product'
    ? INTERVIEW_FOLLOW_UP_BANK.product_sense
    : INTERVIEW_FOLLOW_UP_BANK.consulting_opening;
  const source = base.length ? base : fallback;
  const start = offsetByRound[roundId] || 0;
  return [...source.slice(start, start + 3), ...source.slice(0, Math.max(0, start + 3 - source.length))].slice(0, 3);
};

const parseInterviewTask = (taskText = '') => {
  const sections = [];
  let current = null;

  taskText.split(/\r?\n/).forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed) return;
    const heading = extractHeading(trimmed);
    if (heading) {
      current = { label: heading.label, lines: heading.value ? [heading.value] : [] };
      sections.push(current);
      return;
    }
    if (!current) {
      current = { label: 'Задача', lines: [] };
      sections.push(current);
    }
    current.lines.push(trimmed);
  });

  return sections
    .map((section) => ({ ...section, text: section.lines.map(cleanMarkdown).filter(Boolean).join('\n') }))
    .filter((section) => section.text);
};

const getInterviewSection = (sections, ...names) => {
  const lowerNames = names.map((name) => name.toLowerCase());
  return sections.find((section) =>
    lowerNames.some((name) => section.label.toLowerCase().includes(name))
  );
};

const getInterviewLines = (section) =>
  (section?.text || '')
    .split('\n')
    .map(cleanMarkdown)
    .filter(Boolean)
    .filter((line) => !/^[-|:\s]+$/.test(line))
    .map((line) => line.replace(/^\d+[.)]\s*/, ''));

const buildInterviewRounds = (sections, direction, block) => {
  const prompt = getInterviewSection(sections, 'интервьюер говорит', 'задача');
  const clarify = getInterviewSection(sections, 'что должен уточнить', 'уточнить');
  const data = getInterviewSection(sections, 'данные');
  const expected = getInterviewSection(sections, 'ожидаемые блоки', 'маршрут', 'ответ');
  const pushback = getInterviewSection(sections, 'pushback');
  const criteria = getInterviewSection(sections, 'критерии');
  const isProduct = direction.id === 'product';
  const clarifySignals = getInterviewLines(clarify).slice(0, 5);
  const expectedSignals = getInterviewLines(expected).slice(0, 7);
  const criteriaSignals = getInterviewLines(criteria).slice(0, 6);
  const pushbackLines = getInterviewLines(pushback);

  const rounds = [
    {
      id: 'opening_move',
      title: 'Первый ход',
      eyebrow: 'Раунд 1 · выбор',
      mode: 'choice',
      prompt: 'Интервьюер дал вводную. Что ты делаешь первым?',
      context: prompt?.text || block.prompt,
      options: isProduct
        ? [
            { id: 'feature', label: 'Сразу предлагаю 3 фичи и выбираю самую яркую', note: 'Слишком рано: нет цели, сегмента и метрики.' },
            { id: 'clarify', label: 'Уточняю цель, primary user, сценарий и метрику успеха', note: 'Сильный PM-старт: сначала framing.' },
            { id: 'research', label: 'Прошу UX-исследование и откладываю решение', note: 'Исследование может помочь, но на интервью нужен ход сейчас.' },
          ]
        : [
            { id: 'ideas', label: 'Сразу даю список инициатив для клиента', note: 'Рано: сначала цель и структура.' },
            { id: 'clarify', label: 'Переформулирую objective, ограничения и строю MECE-структуру', note: 'Сильный case-start.' },
            { id: 'benchmark', label: 'Начинаю с бенчмарков конкурентов', note: 'Может быть веткой анализа, но не первым ходом.' },
          ],
      expectedSignals: [
        'Нужно начать с уточнения цели, контекста, ограничений и критерия успеха.',
        'Нельзя сразу прыгать к решению без структуры.',
        isProduct ? 'Для product нужно назвать пользователя и метрику.' : 'Для consulting нужно зафиксировать client objective и issue tree.',
      ],
    },
    {
      id: 'clarifying_questions',
      title: 'Уточняющие вопросы',
      eyebrow: 'Раунд 2 · написать',
      mode: 'text',
      prompt: 'Напиши 4-6 уточняющих вопросов, которые реально помогут решить этот кейс.',
      context: 'Хорошие вопросы сужают ambiguity и не звучат как анкета ради анкеты.',
      expectedSignals: clarifySignals.length ? clarifySignals : [
        'Цель и горизонт решения',
        'Сегмент или клиент',
        'Ограничения по срокам, бюджету, ресурсам',
        'Метрика успеха',
        'Какие данные уже есть и чему доверяем',
      ],
      minLength: 60,
    },
    {
      id: 'solution_route',
      title: 'Маршрут решения',
      eyebrow: 'Раунд 3 · выбор',
      mode: 'choice',
      prompt: 'Какая структура ответа лучше всего подходит для этого блока?',
      context: expected?.text || direction.summary,
      options: isProduct
        ? [
            { id: 'feature_list', label: 'Список фич → любимая фича → релиз всем', note: 'Не хватает пользователя, проблемы, метрик и проверки.' },
            { id: 'product_loop', label: 'Goal → user/JTBD → pain → options → MVP → metrics/experiment', note: 'Правильный продуктовый маршрут.' },
            { id: 'finance_only', label: 'P&L → затраты → ROI → сокращение бюджета', note: 'Полезно для бизнеса, но не покрывает product sense.' },
          ]
        : [
            { id: 'mece_route', label: 'Objective → issue tree → data/math → options → recommendation', note: 'Правильный case route.' },
            { id: 'brainstorm', label: 'Brainstorm идей → голосование → финальный слайд', note: 'Слишком рыхло для case interview.' },
            { id: 'ux_route', label: 'Persona → CJM → wireframes → usability', note: 'Может быть частью digital case, но не базовая консалтинговая структура.' },
          ],
      expectedSignals: expectedSignals.length ? expectedSignals : [
        'Есть логичная top-down структура.',
        'Структура покрывает цель кейса и не смешивает причины с решениями.',
        'Есть место для данных, расчётов и финального синтеза.',
      ],
    },
    {
      id: 'data_move',
      title: 'Работа с данными',
      eyebrow: 'Раунд 4 · написать',
      mode: 'text',
      prompt: 'Посмотри на данные. Какой первый инсайт или расчёт ты озвучишь интервьюеру?',
      context: data?.text || 'Данных мало: явно назови, каких чисел не хватает, и предложи proxy-допущение.',
      expectedSignals: [
        'Прочитать данные перед выводом: период, сегменты, единицы измерения.',
        'Назвать один конкретный insight, а не пересказать таблицу.',
        'Связать insight с гипотезой или следующим вопросом.',
        isProduct ? 'Для product: метрика, сегмент, root cause или guardrail.' : 'Для consulting: формула, экономика, порядок величины или so what.',
      ],
      minLength: 70,
      data: data?.text || '',
    },
    {
      id: 'pushback_synthesis',
      title: 'Pushback и синтез',
      eyebrow: 'Раунд 5 · написать',
      mode: 'text',
      prompt: pushbackLines[0] || 'Интервьюер просит финальный ответ. Что рекомендуешь и почему?',
      context: pushbackLines.slice(1).join('\n') || 'Ответ должен звучать top-down: рекомендация, 2-3 доказательства, риски и next step.',
      expectedSignals: criteriaSignals.length ? criteriaSignals : [
        'Начать с рекомендации, а не с истории анализа.',
        'Дать 2-3 доказательства из структуры или данных.',
        'Назвать риск/trade-off и способ проверки.',
        'Завершить next step.',
      ],
      minLength: 90,
    },
  ];
  return rounds.map((round) => ({
    ...round,
    followups: getInterviewFollowups(block.id, round.id, direction.id),
  }));
};

const parseInterviewReview = (value = '') => {
  try {
    const cleaned = value.replace(/```json|```/g, '').trim();
    return JSON.parse(cleaned);
  } catch {
    return {
      score: null,
      passed: false,
      verdict: 'Ответ получен',
      feedback: value,
      nextPrompt: 'Попробуй усилить ответ и проверить ещё раз.',
    };
  }
};

/* ──────────────────────────── Mobile step strip ─────────────────────── */
const MobileStepStrip = ({ steps, activeIdx, answers, onPick }) => {
  const doneCount = steps.filter((s) => (answers[s.id] || '').trim().length > 30).length;
  const progress = steps.length ? Math.round((doneCount / steps.length) * 100) : 0;

  return (
    <nav className="stepStrip">
      <div className="stepStripTrack">
        {steps.map((s, i) => {
          const done = (answers[s.id] || '').trim().length > 30;
          const active = i === activeIdx;
          return (
            <button
              key={s.id}
              className={`stepChip${active ? ' active' : ''}${done && !active ? ' done' : ''}`}
              onClick={() => onPick(i)}
            >
              <div className="chipBadge">{done && !active ? '✓' : i + 1}</div>
              <div className="chipLabel">{s.title}</div>
            </button>
          );
        })}
      </div>
      <div className="stripBar"><div style={{ width: `${progress}%` }} /></div>
    </nav>
  );
};

/* ──────────────────────────── Workspace ─────────────────────────────── */
const Workspace = ({ caseText, steps, track, onEvaluate, evaluation, onBack }) => {
  const [activeIdx, setActiveIdx] = useState(0);
  const [answers, setAnswers] = useState({});
  const [coachOpen, setCoachOpen] = useState(false);
  const trackSteps = useMemo(() => getTrackSteps(track, steps), [track, steps]);
  const step = trackSteps[Math.min(activeIdx, trackSteps.length - 1)];
  const activeChapter = getActiveChapter(track, step);

  useEffect(() => {
    if (activeIdx >= trackSteps.length) setActiveIdx(0);
  }, [activeIdx, trackSteps.length]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [activeIdx]);

  useEffect(() => {
    document.body.style.overflow = coachOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [coachOpen]);

  const setAnswer = useCallback((id, val) => {
    setAnswers((prev) => ({ ...prev, [id]: val }));
  }, []);

  return (
    <div className="fade-in">
      <button className="btn btn-ghost" onClick={onBack} style={{ marginBottom: 24 }}>
        ← Изменить параметры
      </button>

      <MobileStepStrip steps={trackSteps} activeIdx={activeIdx} answers={answers} onPick={setActiveIdx} />

      <div className="workspace">
        <StepsRail steps={trackSteps} activeIdx={activeIdx} answers={answers} onPick={setActiveIdx} />
        <div>
          <CaseCondition caseText={caseText} track={track} />
          <ChapterMethodCard chapter={activeChapter} step={step} idx={activeIdx} />
          <StepBlock
            step={step}
            chapter={activeChapter}
            idx={activeIdx}
            total={trackSteps.length}
            answer={answers[step.id] || ''}
            onAnswer={(v) => setAnswer(step.id, v)}
            onNext={() => setActiveIdx((i) => Math.min(i + 1, trackSteps.length - 1))}
            onPrev={() => setActiveIdx((i) => Math.max(i - 1, 0))}
            isLast={activeIdx === trackSteps.length - 1}
            onEvaluate={() => onEvaluate(answers)}
          />
          <div className="desktopCoach">
            <CoachPanel
              step={step}
              caseText={caseText}
              answer={answers[step.id] || ''}
              previousAnswers={answers}
              trackId={track?.id}
            />
          </div>
          {evaluation && <EvaluationCard evaluation={evaluation} />}
        </div>
      </div>

      {/* Mobile: floating coach button */}
      <button className="coachFloat" onClick={() => setCoachOpen(true)}>
        💬 Coach
      </button>

      {/* Mobile: coach bottom sheet */}
      {coachOpen && (
        <div className="coachOverlay" onClick={(e) => e.target === e.currentTarget && setCoachOpen(false)}>
          <div className="coachSheet">
            <div className="sheetHandle" />
            <div className="sheetHead">
              <span>Case Coach</span>
              <button className="sheetClose" onClick={() => setCoachOpen(false)}>✕</button>
            </div>
            <CoachPanel
              step={step}
              caseText={caseText}
              answer={answers[step.id] || ''}
              previousAnswers={answers}
              trackId={track?.id}
            />
          </div>
        </div>
      )}
    </div>
  );
};

const CaseCondition = ({ caseText, track }) => {
  const sections = useMemo(() => parseCaseCondition(caseText), [caseText]);
  const factKeys = ['company', 'industry', 'scale', 'businessModel', 'product', 'audience'];
  const facts = sections.filter((section) => factKeys.includes(section.key)).slice(0, 6);
  const detailSections = sections.filter((section) => !factKeys.includes(section.key));
  const visibleSections = detailSections.length ? detailSections : sections;

  return (
    <section className="case-card case-card-structured">
      <div className="case-label">
        <span>Условие кейса</span>
        {track?.name && <span>{track.name}</span>}
      </div>
      <h3>Условие кейса</h3>
      <p className="case-note">
        Это не ответ и не подсказка. Это вводная: факты, цифры, ограничения и вопрос клиента, с которыми дальше нужно работать по главам.
      </p>

      {facts.length > 0 && (
        <div className="case-facts">
          {facts.map((section) => (
            <article key={`${section.key}-${section.label}`} className="case-fact">
              <span>{CASE_SECTION_META[section.key]?.label || section.label}</span>
              <strong>{section.text}</strong>
            </article>
          ))}
        </div>
      )}

      <div className="case-section-grid">
        {visibleSections.map((section, index) => (
          <CaseSection key={`${section.key}-${section.label}-${index}`} section={section} />
        ))}
      </div>
    </section>
  );
};

const CaseSection = ({ section }) => {
  const meta = CASE_SECTION_META[section.key] || CASE_SECTION_META.other;
  const lines = section.text.split('\n').map(cleanMarkdown).filter(Boolean);
  const isData = section.key === 'data';
  const isQuestion = section.key === 'question';
  const isProblem = section.key === 'problem';

  return (
    <article className={`case-section case-section-${section.key}`}>
      <div className="case-section-head">
        <span>{meta.label}</span>
        <em>{meta.badge}</em>
      </div>
      {isData ? (
        <div className="case-data-grid">
          {lines.map((line) => {
            const [label, ...rest] = line.split(/:\s+/);
            const value = rest.join(': ');
            return (
              <div key={line} className="case-data-point">
                {value ? (
                  <>
                    <span>{label}</span>
                    <strong>{value}</strong>
                  </>
                ) : (
                  <strong>{line}</strong>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className={isQuestion || isProblem ? 'case-emphasis' : 'case-copy'}>
          {lines.map((line) => <p key={line}>{line}</p>)}
        </div>
      )}
    </article>
  );
};

const StepsRail = ({ steps, activeIdx, answers, onPick }) => (
  <aside className="steps-rail">
    <h4>Этапы решения</h4>
    {steps.map((s, i) => {
      const done = (answers[s.id] || '').trim().length > 30;
      const cls = ['step-item', i === activeIdx && 'active', done && 'done'].filter(Boolean).join(' ');
      return (
        <div key={s.id} className={cls} onClick={() => onPick(i)}>
          <div className="step-num">{done ? '✓' : i + 1}</div>
          <div className="step-name">{s.title}</div>
        </div>
      );
    })}
  </aside>
);

const ChapterMethodCard = ({ chapter, step, idx }) => {
  const theory = step?.theory || {};
  const terms = [
    ...(chapter?.terms || []),
    ...(theory.terms || []),
  ].map(formatTerm);
  const visualSteps = getVisualSteps(chapter, step);
  const materials = [
    ...(chapter?.methodMaterials || []),
    theory.example && `Пример: ${theory.example}`,
    theory.answerTemplate && `Шаблон ответа: ${theory.answerTemplate}`,
    theory.commonMistake && `Частая ошибка: ${theory.commonMistake}`,
  ].filter(Boolean);

  return (
    <section className="method-panel">
      <div className="method-kicker">
        <span>{chapter?.circle || `Глава ${idx + 1}`}</span>
        <span>{step?.id}</span>
      </div>
      <h3>{chapter?.title || step.title}</h3>
      <LearningFlow steps={visualSteps} />
      <p className="method-definition">
        <strong>Определение главы:</strong> {chapter?.definition || step.description}
      </p>
      {theory.goal && (
        <p className="method-goal">
          <strong>Учебная цель:</strong> {theory.goal}
        </p>
      )}
      {terms.length > 0 && (
        <div className="term-list">
          <h4>Термины</h4>
          {terms.slice(0, 6).map((term) => (
            <div key={`${term.name}-${term.meaning}`} className="term-row">
              <span>{term.name}</span>
              {term.meaning && <p>{term.meaning}</p>}
            </div>
          ))}
        </div>
      )}
      {materials.length > 0 && (
        <div className="method-materials">
          <h4>Методические материалы</h4>
          <div className="method-card-grid">
            {materials.slice(0, 6).map((item, itemIdx) => (
              <article key={item} className="method-card">
                <span>{itemIdx + 1}</span>
                <p>{item}</p>
              </article>
            ))}
          </div>
        </div>
      )}
    </section>
  );
};

const LearningFlow = ({ steps }) => (
  <div className="learning-flow">
    <div className="learning-flow-title">Как думать на этой главе</div>
    <div className="learning-flow-map">
      {steps.map((item, index) => (
        <div key={`${item}-${index}`} className="flow-node">
          <span>{index + 1}</span>
          <p>{item}</p>
        </div>
      ))}
    </div>
  </div>
);

const StepBlock = ({ step, chapter, idx, total, answer, onAnswer, onNext, onPrev, isLast, onEvaluate }) => (
  <div className="step-block" key={step.id}>
    <div className="step-meta">
      <span className="idx">{chapter?.circle || `глава ${idx + 1}`} </span>
      <span className="step-seq">step {idx + 1} / {total}</span>
    </div>
    <h2>{step.title}</h2>
    <p className="desc">{step.description}</p>
    {step.frameworks?.length > 0 && (
      <div className="frameworks">
        {step.frameworks.map((f) => <span key={f} className="fw">{f}</span>)}
      </div>
    )}
    {step.caseHint && <div className="hint">{step.caseHint}</div>}
    <textarea
      className="answer-input"
      style={{
        width: '100%', minHeight: 180, padding: 16,
        background: 'var(--ink-soft)', color: 'var(--paper)',
        border: '1px solid var(--hair)', borderRadius: 6,
        fontFamily: 'var(--sans)', fontSize: 14, lineHeight: 1.6, resize: 'vertical',
      }}
      placeholder="Запиши ответ — структурно, с опорой на данные кейса…"
      value={answer}
      onChange={(e) => onAnswer(e.target.value)}
    />
    <div className="actions">
      <button className="btn btn-ghost" onClick={onPrev} disabled={idx === 0}>← Назад</button>
      {!isLast && <button className="btn btn-primary" onClick={onNext}>Дальше <span className="arrow">→</span></button>}
      {isLast && <button className="btn btn-primary" onClick={onEvaluate}>Оценить решение <span className="arrow">→</span></button>}
    </div>
  </div>
);

/* ──────────────────────────── Coach ─────────────────────────────── */
const CoachPanel = ({ step, caseText, answer, previousAnswers, trackId }) => {
  const [log, setLog] = useState([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);

  // reset log when step changes
  useEffect(() => { setLog([]); setErr(null); }, [step.id]);

  const send = async () => {
    const text = input.trim();
    if (!text || busy) return;
    setInput('');
    setErr(null);
    const next = [...log, { role: 'student', text }];
    setLog(next);
    setBusy(true);
    try {
      const res = await api.coach({
        stepId: step.id,
        stepTitle: step.title,
        stepDescription: step.description || '',
        frameworks: step.frameworks || [],
        caseHint: step.caseHint || '',
        theory: step.theory || {},
        caseText,
        answerText: answer,
        userMessage: text,
        chatHistory: next,
        previousAnswers,
        trackId,
      });
      setLog([...next, { role: 'coach', text: res.message }]);
    } catch (e) {
      setErr(e.message);
      setLog(next);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="coach">
      <div className="coach-head">
        <div className="avatar">C</div>
        <div>
          <div className="name">Case Coach</div>
          <div className="role">McKinsey-style mentor · {step.title}</div>
        </div>
      </div>
      <div className="coach-log">
        {log.length === 0 && (
          <div style={{ color: 'var(--paper-faint)', fontSize: 13, textAlign: 'center', padding: '20px 0' }}>
            Спроси про термин, фреймворк или попроси дать наводящий вопрос по этапу.
          </div>
        )}
        {log.map((m, i) => (
          <div key={i} className={`msg ${m.role}`}>
            <div className="bubble">{m.text}</div>
          </div>
        ))}
        {busy && <div className="msg coach"><div className="bubble"><span className="spinner" /> думаю…</div></div>}
      </div>
      {err && <div className="error" style={{ margin: '0 16px 12px' }}>{err}</div>}
      <div className="coach-input">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && send()}
          placeholder="Спроси у Case Coach…"
        />
        <button className="btn btn-primary" onClick={send} disabled={busy || !input.trim()}>
          {busy ? <span className="spinner" /> : 'Отправить'}
        </button>
      </div>
    </div>
  );
};

/* ──────────────────────────── Evaluation ─────────────────────────────── */
const EvaluationCard = ({ evaluation }) => {
  const parsed = useMemo(() => {
    try {
      const cleaned = evaluation.replace(/```json|```/g, '').trim();
      return JSON.parse(cleaned);
    } catch {
      return null;
    }
  }, [evaluation]);

  if (!parsed) return <div className="eval"><pre>{evaluation}</pre></div>;

  return (
    <div className="eval">
      <div className="eyebrow"><span className="num">∑</span> Оценка решения</div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 16, marginBottom: 24 }}>
        <span className="score">{parsed.totalScore}</span>
        <span className="score-meta">/ 100 баллов</span>
      </div>
      {parsed.summary && <p style={{ color: 'var(--paper-dim)', marginBottom: 24 }}>{parsed.summary}</p>}
      {parsed.strengths?.length > 0 && (
        <Section title="Сильные стороны" items={parsed.strengths} accent="var(--mint)" />
      )}
      {parsed.improvements?.length > 0 && (
        <Section title="Что улучшить" items={parsed.improvements} accent="var(--amber)" />
      )}
      {parsed.topTips?.length > 0 && (
        <Section title="Top-3 совета" items={parsed.topTips} accent="var(--rust)" />
      )}
    </div>
  );
};

const Section = ({ title, items, accent }) => (
  <div style={{ marginBottom: 20 }}>
    <h4 style={{ fontFamily: 'var(--mono)', fontSize: 11, letterSpacing: '0.16em', textTransform: 'uppercase', color: accent, margin: '0 0 12px' }}>{title}</h4>
    <ul style={{ margin: 0, paddingLeft: 18, color: 'var(--paper-dim)', fontSize: 14, lineHeight: 1.6 }}>
      {items.map((it, i) => <li key={i} style={{ marginBottom: 6 }}>{it}</li>)}
    </ul>
  </div>
);

/* ──────────────────────────── Interview Together ─────────────────────────────── */
const InterviewTogether = ({ onBack }) => {
  const [directionId, setDirectionId] = useState('product');
  const [blockId, setBlockId] = useState(INTERVIEW_DIRECTIONS[0].blocks[0].id);
  const [difficulty, setDifficulty] = useState('middle');
  const [companyContext, setCompanyContext] = useState('');
  const [taskText, setTaskText] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);

  const direction = INTERVIEW_DIRECTIONS.find((item) => item.id === directionId) || INTERVIEW_DIRECTIONS[0];
  const block = direction.blocks.find((item) => item.id === blockId) || direction.blocks[0];

  useEffect(() => {
    if (!direction.blocks.some((item) => item.id === blockId)) {
      setBlockId(direction.blocks[0].id);
    }
  }, [direction, blockId]);

  const generateTask = async () => {
    setBusy(true);
    setErr(null);
    try {
      const res = await api.generateInterview({ directionId, blockId, difficulty, companyContext });
      setTaskText(res.taskText);
    } catch (e) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fade-in interviewPage">
      <button className="btn btn-ghost" onClick={onBack} style={{ marginBottom: 28 }}>← На главную</button>

      <section className="interviewHero">
        <div className="interviewHeroCopy">
          <div className="eyebrow"><span className="num">03 /</span> Mock interview lab</div>
          <h1 className="hero" style={{ fontSize: 'clamp(38px, 6vw, 74px)' }}>
            Решаем<br/><em>собеседование</em><br/>вместе
          </h1>
          <p className="hero-sub">
            Паттерн из mock interviews: интервьюер даёт вводную, кандидат уточняет цель,
            строит структуру, работает с данными, выдерживает pushback и приземляет рекомендацию.
          </p>
          <div className="directionSwitch" role="tablist" aria-label="Interview direction">
            {INTERVIEW_DIRECTIONS.map((item) => (
              <button
                key={item.id}
                className={item.id === directionId ? 'active' : ''}
                onClick={() => setDirectionId(item.id)}
              >
                <span>{item.title}</span>
                <em>{item.tag}</em>
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="interviewPattern">
        <div className="interviewSectionHead">
          <span>Блоки направления</span>
          <p>{direction.summary}</p>
        </div>
        <div className="interviewBlockGrid">
          {direction.blocks.map((item) => (
            <button
              key={item.id}
              className={`interviewBlock${item.id === block.id ? ' active' : ''}`}
              onClick={() => setBlockId(item.id)}
            >
              <span>{item.short}</span>
              <h3>{item.title}</h3>
              <p>{item.prompt}</p>
              <div>
                {item.pattern.map((step) => <em key={step}>{step}</em>)}
              </div>
            </button>
          ))}
        </div>
      </section>

      <section className="interviewAgent">
        <div>
          <div className="interviewAgentBadge">AI агент</div>
          <h2>Генератор интервью-задач</h2>
          <p>
            Промпт агента заставляет его выдавать задачу по реальному интервью-паттерну:
            opening, уточнения, exhibit/data, ожидаемый маршрут, pushback и критерии сильного ответа.
          </p>
        </div>
        <div className="interviewAgentForm">
          <label>
            Блок интервью
            <select value={blockId} onChange={(e) => setBlockId(e.target.value)}>
              {direction.blocks.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}
            </select>
          </label>
          <label>
            Сложность
            <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
              {INTERVIEW_DIFFICULTIES.map((item) => <option key={item.id} value={item.id}>{item.label} — {item.text}</option>)}
            </select>
          </label>
          <label className="full">
            Контекст компании или продукта
            <textarea
              value={companyContext}
              onChange={(e) => setCompanyContext(e.target.value)}
              placeholder="Например: маркетплейс услуг, падает конверсия из поиска в заказ; или ритейлер думает о выходе в новый регион"
            />
          </label>
          {err && <div className="error full">{err}</div>}
          <button className="btn btn-primary full" onClick={generateTask} disabled={busy}>
            {busy ? <><span className="spinner" /> Генерирую…</> : <>Сгенерировать задачу <span className="arrow">→</span></>}
          </button>
        </div>
      </section>

      <InterviewTask taskText={taskText} direction={direction} block={block} />
    </div>
  );
};

const InterviewTask = ({ taskText, direction, block }) => {
  const sections = useMemo(() => parseInterviewTask(taskText), [taskText]);
  const rounds = useMemo(() => buildInterviewRounds(sections, direction, block), [sections, direction, block]);
  const [activeIdx, setActiveIdx] = useState(0);
  const [answers, setAnswers] = useState({});
  const [selected, setSelected] = useState({});
  const [reviews, setReviews] = useState({});
  const [checking, setChecking] = useState(false);
  const [err, setErr] = useState(null);

  useEffect(() => {
    setActiveIdx(0);
    setAnswers({});
    setSelected({});
    setReviews({});
    setErr(null);
  }, [taskText]);

  if (!taskText) {
    return (
      <section className="interviewEmpty">
        <span>Готово к генерации</span>
        <p>Выбран блок: {direction.name} · {block.title}. Добавь контекст и нажми “Сгенерировать задачу”.</p>
      </section>
    );
  }

  const activeRound = rounds[activeIdx];
  const review = reviews[activeRound.id];
  const answerText = answers[activeRound.id] || '';
  const selectedOption = activeRound.options?.find((option) => option.id === selected[activeRound.id]);
  const progress = Math.round(((activeIdx + (review?.passed ? 1 : 0)) / rounds.length) * 100);
  const canCheck =
    activeRound.mode === 'choice'
      ? Boolean(selectedOption)
      : answerText.trim().length >= (activeRound.minLength || 20);

  const acceptedAnswers = Object.fromEntries(
    rounds
      .slice(0, activeIdx)
      .map((round) => [
        round.title,
        round.mode === 'choice'
          ? rounds.find((item) => item.id === round.id)?.options?.find((option) => option.id === selected[round.id])?.label || ''
          : answers[round.id] || '',
      ])
      .filter(([, value]) => value)
  );

  const checkRound = async () => {
    if (!canCheck || checking) return;
    setChecking(true);
    setErr(null);
    try {
      const res = await api.checkInterview({
        directionId: direction.id,
        blockId: block.id,
        taskText,
        roundId: activeRound.id,
        roundTitle: activeRound.title,
        roundGoal: activeRound.prompt,
        answerText,
        selectedOption: selectedOption?.label || '',
        expectedSignals: activeRound.expectedSignals || [],
        previousAnswers: acceptedAnswers,
      });
      setReviews((prev) => ({ ...prev, [activeRound.id]: parseInterviewReview(res.result) }));
    } catch (e) {
      setErr(e.message);
    } finally {
      setChecking(false);
    }
  };

  const goNext = () => {
    setActiveIdx((idx) => Math.min(idx + 1, rounds.length - 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <section className="interviewTask">
      <div className="interviewSectionHead">
        <span>Интервью-тренажёр</span>
        <p>{direction.name} · {block.title}</p>
      </div>

      <div className="interviewMotionShell">
        <aside className="interviewCasePanel">
          <div className="interviewCaseSticky">
            <div className="interviewCaseLabel">Условие кейса</div>
            <InterviewSectionBody
              section={getInterviewSection(sections, 'интервьюер говорит', 'задача') || sections[0]}
              compact
            />
            <div className="interviewMiniData">
              <span>Данные</span>
              <InterviewSectionBody section={getInterviewSection(sections, 'данные') || { text: 'Данные появятся в ходе интервью.' }} data compact />
            </div>
          </div>
        </aside>

        <div className="interviewRoundArea">
          <InterviewProgress rounds={rounds} activeIdx={activeIdx} reviews={reviews} progress={progress} onPick={setActiveIdx} />

          <article className="interviewRoundCard">
            <div className="interviewRoundTop">
              <span>{activeRound.eyebrow}</span>
              <em>{review?.passed ? 'принято' : 'ожидает ответа'}</em>
            </div>
            <h3>{activeRound.title}</h3>
            <p className="interviewRoundPrompt">{activeRound.prompt}</p>
            {activeRound.context && <div className="interviewRoundContext">{activeRound.context}</div>}

            {activeRound.mode === 'choice' ? (
              <div className="interviewChoiceList">
                {activeRound.options.map((option) => (
                  <button
                    key={option.id}
                    className={selected[activeRound.id] === option.id ? 'active' : ''}
                    onClick={() => setSelected((prev) => ({ ...prev, [activeRound.id]: option.id }))}
                  >
                    <span>{option.label}</span>
                    <em>{option.note}</em>
                  </button>
                ))}
              </div>
            ) : (
              <textarea
                className="interviewAnswerInput"
                value={answerText}
                onChange={(e) => setAnswers((prev) => ({ ...prev, [activeRound.id]: e.target.value }))}
                placeholder="Напиши ответ так, как сказал бы интервьюеру вслух: структурно, коротко, с опорой на условие…"
              />
            )}

            <div className="interviewExpected">
              <span>Что проверяет AI</span>
              <ul>
                {activeRound.expectedSignals.slice(0, 4).map((signal) => <li key={signal}>{signal}</li>)}
              </ul>
            </div>

            <div className="interviewFollowups">
              <span>Вопросы, как в live mock</span>
              <div>
                {activeRound.followups.map((question) => <em key={question}>{question}</em>)}
              </div>
            </div>

            {err && <div className="error">{err}</div>}
            {review && <InterviewReview review={review} />}

            <div className="interviewRoundActions">
              <button className="btn btn-ghost" onClick={() => setActiveIdx((idx) => Math.max(0, idx - 1))} disabled={activeIdx === 0}>
                ← Назад
              </button>
              <button className="btn btn-primary" onClick={checkRound} disabled={!canCheck || checking}>
                {checking ? <><span className="spinner" /> Проверяю…</> : <>Проверить AI <span className="arrow">→</span></>}
              </button>
              {review?.passed && activeIdx < rounds.length - 1 && (
                <button className="btn btn-primary" onClick={goNext}>
                  Следующий раунд <span className="arrow">→</span>
                </button>
              )}
            </div>
          </article>
        </div>
      </div>
    </section>
  );
};

const InterviewProgress = ({ rounds, activeIdx, reviews, progress, onPick }) => (
  <div className="interviewProgress">
    <div className="interviewProgressBar"><i style={{ width: `${progress}%` }} /></div>
    <div className="interviewRoundTabs">
      {rounds.map((round, index) => {
        const status = reviews[round.id]?.passed ? 'done' : index === activeIdx ? 'active' : '';
        return (
          <button key={round.id} className={status} onClick={() => onPick(index)}>
            <span>{reviews[round.id]?.passed ? '✓' : index + 1}</span>
            <em>{round.title}</em>
          </button>
        );
      })}
    </div>
  </div>
);

const InterviewReview = ({ review }) => (
  <div className={`interviewReview ${review.passed ? 'passed' : 'retry'}`}>
    <div>
      <span>{review.score ?? 'AI'}</span>
      <em>{review.passed ? 'можно двигаться дальше' : 'нужно усилить'}</em>
    </div>
    <h4>{review.verdict}</h4>
    <p>{review.feedback}</p>
    {review.nextPrompt && <strong>{review.nextPrompt}</strong>}
  </div>
);

const InterviewSectionBody = ({ section, data = false, compact = false }) => {
  const lines = (section?.text || '')
    .split('\n')
    .map(cleanMarkdown)
    .filter(Boolean)
    .filter((line) => !/^[-|:\s]+$/.test(line));

  const tableRows = lines
    .filter((line) => line.includes('|'))
    .map((line) => line.split('|').map((cell) => cleanMarkdown(cell)).filter(Boolean))
    .filter((row) => row.length >= 2);

  if (data && tableRows.length > 0) {
    const rows = tableRows.filter((row) => !row.every((cell) => /^-+$/.test(cell)));
    const [head, ...body] = rows;
    return (
      <table className="interviewDataTable">
        {head && (
          <thead>
            <tr>{head.map((cell) => <th key={cell}>{cell}</th>)}</tr>
          </thead>
        )}
        <tbody>
          {body.map((row) => (
            <tr key={row.join('-')}>
              {row.map((cell) => <td key={cell}>{cell}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    );
  }

  return (
    <ol className={compact ? 'interviewList compact' : 'interviewList'}>
      {lines.map((line) => <li key={line}>{line.replace(/^\d+[.)]\s*/, '')}</li>)}
    </ol>
  );
};

/* ──────────────────────────── Root App ─────────────────────────────── */
const App = () => {
  const [config, setConfig] = useState(null);
  const [err, setErr] = useState(null);
  const [screen, setScreen] = useState('landing'); // landing | track | workspace | quiz | interview | learn
  const [quizCategory, setQuizCategory] = useState(null);
  const [learnInitialTab, setLearnInitialTab] = useState('All Resources');
  const [learnAutoReview, setLearnAutoReview] = useState(false);
  const [track, setTrack] = useState(null);
  const [caseText, setCaseText] = useState('');
  const [busy, setBusy] = useState(false);
  const [evaluation, setEvaluation] = useState(null);

  useEffect(() => {
    api.config().then(setConfig).catch((e) => setErr(e.message));
  }, []);

  const startSimulation = async (params) => {
    setBusy(true);
    setErr(null);
    setEvaluation(null);
    try {
      const res = await api.generate(params);
      setCaseText(res.caseText);
      setScreen('workspace');
    } catch (e) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  };

  const evaluate = async (answers) => {
    setBusy(true);
    setErr(null);
    try {
      const res = await api.evaluate({ caseText, answers, trackId: track?.id });
      setEvaluation(res.evaluation);
      window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
    } catch (e) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  };

  if (err && !config) return <FullErr msg={err} />;
  if (!config) return <Loading />;

  const openLearn = (tab = 'All Resources', options = {}) => {
    setLearnInitialTab(tab);
    setLearnAutoReview(Boolean(options.review));
    setScreen('learn');
  };

  const screenLabel = { landing: 'dojo / resources', track: `exam mode / ${track?.id}`, workspace: 'workspace / live', quiz: 'practice / quiz', interview: 'mock interview', learn: `resources / ${learnInitialTab}` }[screen];

  return (
    <div className="shell">
      <Topbar onHome={() => setScreen('landing')} screen={screenLabel} />
      <main className="main">
        {busy && <BusyBanner screen={screen} />}
        {err && <div className="error">{err}</div>}
        {screen === 'landing' && (
          <Landing
            tracks={config.tracks}
            onPickTrack={(t) => { setTrack(t); setScreen('track'); }}
            onOpenQuiz={() => { setQuizCategory(null); setScreen('quiz'); }}
            onOpenInterview={() => setScreen('interview')}
            onOpenLearn={openLearn}
          />
        )}
        {screen === 'track' && track && (
          <TrackDetail
            track={track}
            industries={config.industries}
            difficulties={config.difficultyLevels}
            onStart={startSimulation}
            onBack={() => setScreen('landing')}
          />
        )}
        {screen === 'quiz' && (
          <QuizPage
            category={quizCategory}
            onSelectCategory={setQuizCategory}
            onBack={() => { setQuizCategory(null); setScreen('landing'); }}
          />
        )}
        {screen === 'interview' && (
          <InterviewTogether onBack={() => setScreen('landing')} />
        )}
        {screen === 'workspace' && (
          <Workspace
            caseText={caseText}
            steps={config.steps}
            track={track}
            onEvaluate={evaluate}
            evaluation={evaluation}
            onBack={() => setScreen('track')}
          />
        )}
        {screen === 'learn' && (
          <LearningScreen
            onBack={() => setScreen('landing')}
            initialTab={learnInitialTab}
            autoOpenReview={learnAutoReview}
            onOpenExam={() => {
              const nextTrack = config.tracks.find((item) => item.id === 'business') || config.tracks[0];
              setTrack(nextTrack);
              setScreen('track');
            }}
          />
        )}
      </main>
    </div>
  );
};

const Loading = () => (
  <div className="shell">
    <main className="main" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
      <div style={{ textAlign: 'center', color: 'var(--paper-dim)' }}>
        <span className="spinner" /> загрузка конфигурации…
      </div>
    </main>
  </div>
);

const FullErr = ({ msg }) => (
  <div className="shell">
    <main className="main">
      <h2>Не удалось подключиться к API</h2>
      <div className="error">{msg}</div>
      <p style={{ color: 'var(--paper-dim)' }}>Проверь VITE_API_BASE_URL и доступность backend.</p>
    </main>
  </div>
);

const BusyBanner = ({ screen }) => (
  <div style={{
    position: 'fixed', top: 70, right: 32, zIndex: 20,
    padding: '10px 16px', border: '1px solid var(--hair-strong)', borderRadius: 999,
    background: 'rgba(11,13,12,0.92)', backdropFilter: 'blur(6px)',
    fontFamily: 'var(--mono)', fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase',
    display: 'flex', gap: 10, alignItems: 'center', color: 'var(--mint)',
  }}>
    <span className="spinner" /> {screen === 'workspace' ? 'analyzing…' : 'generating case…'}
  </div>
);

/* ─────────────────────────────────────────────
   QUIZ — Duolingo-style practice
   ───────────────────────────────────────────── */

const QUIZ_STORAGE_KEY = 'hack-the-case-quiz-progress-v1';

function getQuizQuestionCount() {
  return Object.values(QUIZ_QUESTIONS).reduce((sum, list) => sum + list.length, 0);
}

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function yesterdayKey() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
}

function loadQuizProgress() {
  try {
    const raw = localStorage.getItem(QUIZ_STORAGE_KEY);
    if (!raw) return { xp: 0, streak: 0, lastDay: null, sessions: 0, mastery: {} };
    return { xp: 0, streak: 0, lastDay: null, sessions: 0, mastery: {}, ...JSON.parse(raw) };
  } catch {
    return { xp: 0, streak: 0, lastDay: null, sessions: 0, mastery: {} };
  }
}

function saveQuizProgress(next) {
  try {
    localStorage.setItem(QUIZ_STORAGE_KEY, JSON.stringify(next));
  } catch {
    // localStorage can be unavailable in private windows; quiz still works.
  }
}

function updateQuizProgress(categoryId, score, total) {
  const current = loadQuizProgress();
  const day = todayKey();
  const streak =
    current.lastDay === day ? current.streak :
    current.lastDay === yesterdayKey() ? current.streak + 1 :
    1;
  const pct = Math.round((score / total) * 100);
  const xpGain = score * 10 + (pct >= 80 ? 20 : 0) + (pct === 100 ? 30 : 0);
  const previous = current.mastery?.[categoryId] || { bestPct: 0, attempts: 0 };
  const next = {
    ...current,
    xp: current.xp + xpGain,
    streak,
    lastDay: day,
    sessions: current.sessions + 1,
    mastery: {
      ...current.mastery,
      [categoryId]: {
        bestPct: Math.max(previous.bestPct || 0, pct),
        attempts: (previous.attempts || 0) + 1,
        lastPct: pct,
      },
    },
  };
  saveQuizProgress(next);
  return { progress: next, xpGain };
}

function QuizPage({ category, onSelectCategory, onBack }) {
  if (!category) return <QuizCategoryPicker onSelect={onSelectCategory} onBack={onBack} />;
  return <QuizSession category={category} onBack={() => onSelectCategory(null)} />;
}

function QuizCategoryPicker({ onSelect, onBack }) {
  const progress = loadQuizProgress();
  return (
    <div className="fade-in quizPicker">
      <button className="btn btn-ghost" onClick={onBack} style={{ marginBottom: 32 }}>← На главную</button>
      <div className="eyebrow"><span className="num">00 /</span> Выбери тему</div>
      <h1 className="hero" style={{ fontSize: 'clamp(32px, 5vw, 56px)' }}>
        Практика в формате<br/><em>Duolingo</em>
      </h1>
      <p className="hero-sub">10 вопросов из темы — 4 варианта ответа — мгновенное объяснение. Тренируй то, что спрашивают на интервью в продукте, BigTech и консалтинге.</p>
      <div className="quizStats">
        <div><span>{progress.xp}</span><p>XP</p></div>
        <div><span>{progress.streak}</span><p>дней streak</p></div>
        <div><span>{progress.sessions}</span><p>спринтов</p></div>
        <div><span>{getQuizQuestionCount()}</span><p>вопросов</p></div>
      </div>
      <div className="quizGrid">
        {QUIZ_CATEGORIES.map((cat) => {
          const mastery = progress.mastery?.[cat.id]?.bestPct || 0;
          return (
            <button key={cat.id} className="quiz-cat-card" onClick={() => onSelect(cat)}>
              <span className="quiz-cat-icon">{cat.icon}</span>
              <div className="quiz-cat-body">
                <span className="quiz-cat-title">{cat.title}</span>
                <span className="quiz-cat-sub">{cat.subtitle}</span>
              </div>
              <div className="quiz-cat-mastery">
                <span style={{ width: `${mastery}%` }} />
              </div>
              <div className="quiz-cat-foot">
                <span className="quiz-cat-tag">{cat.tag}</span>
                <span className="quiz-cat-count">{mastery ? `${mastery}% · ` : ''}{(QUIZ_QUESTIONS[cat.id] || []).length} вопр.</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function QuizSession({ category, onBack }) {
  const allQ = QUIZ_QUESTIONS[category.id] || [];
  const [questions] = useState(() => quizShuffle(allQ).slice(0, 10));
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState(null);
  const [score, setScore] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [done, setDone] = useState(false);
  const [resultProgress, setResultProgress] = useState(null);

  const q = questions[index];
  const progress = Math.round(((index + (selected !== null ? 1 : 0)) / questions.length) * 100);
  const answered = selected !== null;
  const hearts = Math.max(0, 3 - mistakes);

  function handleSelect(i) {
    if (answered) return;
    setSelected(i);
    if (i === q.answer) setScore((s) => s + 1);
    else setMistakes((m) => m + 1);
  }

  function handleNext() {
    if (index + 1 >= questions.length) {
      setResultProgress(updateQuizProgress(category.id, score, questions.length));
      setDone(true);
      return;
    }
    setIndex((i) => i + 1);
    setSelected(null);
  }

  if (done) {
    return (
      <QuizResult
        score={score}
        total={questions.length}
        category={category}
        mistakes={mistakes}
        xpGain={resultProgress?.xpGain || 0}
        streak={resultProgress?.progress?.streak || 0}
        onRetry={() => { setIndex(0); setSelected(null); setScore(0); setMistakes(0); setResultProgress(null); setDone(false); }}
        onBack={onBack}
      />
    );
  }

  return (
    <div className="fade-in quizSession">
      <div className="quizSessionHead">
        <button className="btn btn-ghost" onClick={onBack}>← Темы</button>
        <span className="quizSessionMeta">{category.icon} {category.title}</span>
        <span className="quizHearts">{'♥'.repeat(hearts)}{'♡'.repeat(3 - hearts)}</span>
        <span className="quizScoreBadge">{score} / {index + (answered ? 1 : 0)}</span>
      </div>

      <div className="quizBar"><div className="quizBarFill" style={{ width: `${progress}%` }} /></div>
      <p className="quizCounter">{index + 1} / {questions.length}</p>

      <div className="quizCard">
        <div className="quizQuestionMeta">
          {q.difficulty && <span>{q.difficulty}</span>}
          {q.skill && <span>{q.skill}</span>}
          <span>10‑минутный спринт</span>
        </div>
        <p className="quizQ">{q.q}</p>
        <div className="quizOptions">
          {q.options.map((opt, i) => {
            let cls = 'quizOpt';
            if (answered) {
              if (i === q.answer) cls += ' correct';
              else if (i === selected) cls += ' wrong';
              else cls += ' dim';
            }
            return (
              <button key={i} className={cls} onClick={() => handleSelect(i)} disabled={answered}>
                <span className="quizLetter">{String.fromCharCode(65 + i)}</span>
                <span>{opt}</span>
              </button>
            );
          })}
        </div>
      </div>

      {answered && (
        <div className={`quizFeedback ${selected === q.answer ? 'ok' : 'err'}`}>
          <span className="quizFeedIcon">{selected === q.answer ? '✓' : '✗'}</span>
          <div>
            <p className="quizFeedLabel">{selected === q.answer ? 'Правильно!' : `Ответ: ${q.options[q.answer]}`}</p>
            <p className="quizFeedText">{q.explanation}</p>
          </div>
        </div>
      )}

      {answered && (
        <button className="btn btn-primary" style={{ width: '100%', marginTop: 4 }} onClick={handleNext}>
          {index + 1 >= questions.length ? 'Завершить' : 'Следующий →'}
        </button>
      )}
    </div>
  );
}

function QuizResult({ score, total, category, mistakes, xpGain, streak, onRetry, onBack }) {
  const pct = Math.round((score / total) * 100);
  const medal = pct >= 90 ? '🏆' : pct >= 70 ? '🥈' : pct >= 50 ? '🥉' : '💪';
  const msg =
    pct >= 90 ? 'Отлично! Тему знаешь на уровне сеньора.' :
    pct >= 70 ? 'Хороший результат — ещё немного и тема закрыта.' :
    pct >= 50 ? 'Неплохо. Перечитай объяснения к ошибкам.' :
    'Тема требует проработки. Пройди ещё раз.';

  return (
    <div className="fade-in quizResult">
      <div className="quizResultCard">
        <span style={{ fontSize: '3rem' }}>{medal}</span>
        <h2 className="quizResultScore">{score}/{total}</h2>
        <p className="quizResultPct">{pct}% правильных ответов</p>
        <div className="quizResultStats">
          <span>+{xpGain} XP</span>
          <span>{streak} day streak</span>
          <span>{mistakes} ошибок</span>
        </div>
        <p className="quizResultMsg">{msg}</p>
        <p style={{ color: 'var(--paper-dim)', fontSize: 14 }}>{category.icon} {category.title}</p>
        <div style={{ display: 'grid', gap: 10, marginTop: 24 }}>
          <button className="btn btn-primary" onClick={onRetry}>Пройти ещё раз</button>
          <button className="btn btn-ghost" onClick={onBack}>← Другая тема</button>
        </div>
      </div>
    </div>
  );
}

function quizShuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/* ═══════════════════════════════════════════════════════════════════════
   LEARNING SCREEN — adaptive study interface
   ═══════════════════════════════════════════════════════════════════════ */

const LEARN_TABS = ['All Resources', 'Notes', 'Questionbank', 'Flashcards', 'Key Definitions'];
const LEARN_TAB_LABELS = {
  'All Resources': 'Все ресурсы',
  Notes: 'Конспекты',
  Questionbank: 'Банк вопросов',
  Flashcards: 'Карточки',
  'Key Definitions': 'Термины',
};

const LearningScreen = ({ onBack, initialTab = 'All Resources', autoOpenReview = false, onOpenExam }) => {
  const normalizeTab = (tab) => LEARN_TABS.includes(tab) ? tab : 'Notes';
  const [activeTab, setActiveTab] = useState(normalizeTab(initialTab));
  const [selectedChapter, setSelectedChapter] = useState(null);
  const [selectedSubtopic, setSelectedSubtopic] = useState(null);
  const [reviewOpen, setReviewOpen] = useState(false);

  useEffect(() => {
    setActiveTab(normalizeTab(initialTab));
  }, [initialTab]);

  useEffect(() => {
    if (autoOpenReview) setReviewOpen(true);
  }, [autoOpenReview]);

  const selectChapter = useCallback((chapter, subtopic = null) => {
    setSelectedChapter(chapter);
    setSelectedSubtopic(subtopic);
  }, []);

  return (
    <div className="learnScreen fade-in">
      <div className="learnScreenHeader">
        <button className="btn btn-ghost" onClick={onBack}>← Главная</button>
        <div>
          <div className="eyebrow"><span className="num">02 /</span> Resource dojo</div>
          <h1 className="learnScreenTitle">Case prep <em>resources</em></h1>
          <p className="learnScreenSub">{PM_CHAPTERS.length} модулей · {Object.values(FLASHCARDS).reduce((s, a) => s + a.length, 0)} карточек · {PRACTICE_QUESTIONS.length} вопросов · {KEY_DEFINITIONS.length} терминов</p>
        </div>
        <button className="btn btn-primary" onClick={() => setReviewOpen(true)}>
          AI-повторение <span className="arrow">→</span>
        </button>
      </div>

      <div className="learnTabBar">
        {LEARN_TABS.map((t) => (
          <button key={t} className={`learnTab${activeTab === t ? ' active' : ''}`} onClick={() => { setActiveTab(t); setSelectedChapter(null); setSelectedSubtopic(null); }}>{LEARN_TAB_LABELS[t] || t}</button>
        ))}
      </div>

      <div className="learnLayout">
        <LearnSidebar
          activeTab={activeTab}
          selectedChapter={selectedChapter}
          selectedSubtopic={selectedSubtopic}
          onSelect={(chapter, subtopic = null) => {
            setActiveTab('Notes');
            selectChapter(chapter, subtopic);
          }}
        />
        <div className="learnMain">
          {activeTab === 'All Resources' && <ResourcesOverview onSelectChapter={(chapter) => selectChapter(chapter)} onOpenTab={setActiveTab} onOpenReview={() => setReviewOpen(true)} onOpenExam={onOpenExam} />}
          {activeTab === 'Notes' && <NotesContent chapter={selectedChapter} selectedSubtopic={selectedSubtopic} onSelectChapter={selectChapter} />}
          {activeTab === 'Questionbank' && <QuestionBankContent chapter={selectedChapter} />}
          {activeTab === 'Flashcards' && <FlashCardsContent chapter={selectedChapter} onSelectChapter={(chapter) => selectChapter(chapter)} />}
          {activeTab === 'Key Definitions' && <DefinitionsContent />}
        </div>
      </div>
      {reviewOpen && <ReviewSessionModal onClose={() => setReviewOpen(false)} />}
    </div>
  );
};

function ResourcesOverview({ onSelectChapter, onOpenTab, onOpenReview, onOpenExam }) {
  const stats = getLearningStats();
  return (
    <div className="resourcesOverview">
      <div className="resourcesHero">
        <div>
          <span className="resourcesKicker">Все ресурсы</span>
          <h2>Case prep resources</h2>
          <p>Полный учебный кабинет по Product Management: быстрый вход в вопросы, конспекты, карточки, термины и AI-повторение.</p>
        </div>
        <button className="btn btn-primary" onClick={onOpenReview}>AI-повторение</button>
      </div>
      <CasePrepMenu
        stats={stats}
        onOpenTab={onOpenTab}
        onOpenReview={onOpenReview}
        onOpenExam={onOpenExam}
      />
      <CourseContentPreview onSelectChapter={onSelectChapter} onOpenTab={onOpenTab} />
    </div>
  );
}

/* ── Sidebar — expandable chapter + subtopic tree ── */
function LearnSidebar({ activeTab, selectedChapter, selectedSubtopic, onSelect }) {
  const [expanded, setExpanded] = useState(() => new Set(selectedChapter ? [selectedChapter.id] : []));
  const fcProgress = loadFcProgress();

  useEffect(() => {
    if (selectedChapter) setExpanded((prev) => new Set([...prev, selectedChapter.id]));
  }, [selectedChapter]);

  function toggleExpand(chId, e) {
    e.stopPropagation();
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(chId) ? next.delete(chId) : next.add(chId);
      return next;
    });
  }

  return (
    <aside className="learnSidebar">
      <div className="learnSidebarTitle">Разделы курса</div>
      {PM_CHAPTERS.map((ch) => {
        const cards = FLASHCARDS[ch.id] || [];
        const reviewed = cards.filter((c) => fcProgress[c.id]).length;
        const pct = cards.length > 0 ? Math.round((reviewed / cards.length) * 100) : 0;
        const isSelected = selectedChapter?.id === ch.id;
        const isExpanded = expanded.has(ch.id);

        return (
          <div key={ch.id} className="sidebarChapterGroup">
            <button
              className={`sidebarChapterHead${isSelected ? ' active' : ''}`}
              onClick={() => { onSelect(ch); setExpanded((prev) => new Set([...prev, ch.id])); }}
            >
              <div className="sidebarCircle" style={{ '--col': ch.color }}>
                {pct >= 100
                  ? <span className="sidebarCircleFull">✓</span>
                  : pct > 0
                    ? <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="none" stroke="var(--col)" strokeWidth="2.5" strokeDasharray={`${2 * Math.PI * 10 * pct / 100} ${2 * Math.PI * 10}`} strokeLinecap="round" transform="rotate(-90 12 12)" /></svg>
                    : null}
              </div>
              <div className="sidebarChapterText">
                <div className="sidebarChapterName">{ch.number}. {ch.title}</div>
                <div className="sidebarChapterMeta">{ch.subtopics.length} подтем{pct > 0 ? ` · ${pct}%` : ''}</div>
              </div>
              <button className="sidebarExpandBtn" onClick={(e) => toggleExpand(ch.id, e)} aria-label="expand">
                {isExpanded ? '▲' : '▼'}
              </button>
            </button>

            {isExpanded && (
              <div className="sidebarSubtopics">
                {ch.subtopics.map((sub) => (
                  <button
                    key={sub.id}
                    className={`sidebarSubtopic${selectedSubtopic?.id === sub.id ? ' active' : ''}`}
                    onClick={() => onSelect(ch, sub)}
                  >
                    <span className="sidebarSubDot" />
                    <span className="sidebarSubName">{sub.title}</span>
                    <span className="sidebarSubDuration">{sub.duration}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </aside>
  );
}

/* ── Lessons — Alice.tech style adaptive explanations ── */
function LessonsContent({ chapter, onSelectChapter }) {
  const [subtopic, setSubtopic] = useState(null);
  const [sessionStep, setSessionStep] = useState('intro'); // intro | expo | mcq | aiChat | done
  const [mcqAnswered, setMcqAnswered] = useState(null);
  const [health, setHealth] = useState(3);
  const [xp, setXp] = useState(0);
  const [aiExpo, setAiExpo] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [userAnswer, setUserAnswer] = useState('');
  const [aiFeedback, setAiFeedback] = useState(null);
  const [aiFeedbackLoading, setAiFeedbackLoading] = useState(false);
  const contentRef = useRef(null);

  useEffect(() => {
    setSubtopic(null);
    setSessionStep('intro');
    setMcqAnswered(null);
    setUserAnswer('');
    setAiFeedback(null);
  }, [chapter]);

  useEffect(() => {
    contentRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  }, [sessionStep, subtopic]);

  async function handleTooHard() {
    setAiLoading(true);
    try {
      const data = await api.learnSession({ chapterId: chapter?.id || '', subtopicId: subtopic?.id || '', userLevel: 'beginner' });
      setAiExpo(data.exposition);
    } catch {
      setAiExpo(null);
    } finally {
      setAiLoading(false);
    }
  }

  async function handleGetAiFeedback() {
    if (!userAnswer.trim() || aiFeedbackLoading) return;
    setAiFeedbackLoading(true);
    try {
      const content = LEARN_TOGETHER_CONTENT[subtopic?.id];
      const data = await api.learnExplain({
        topic: chapter?.title || '',
        subtopic: subtopic?.title || '',
        question: 'Студент объясняет концепцию своими словами',
        wrongAnswer: userAnswer,
        correctAnswer: '',
        difficulty: 'normal',
      });
      setAiFeedback(data);
      setXp((x) => x + 15);
    } catch {
      setAiFeedback({
        explanation: 'Отличная попытка! Объяснение концепций своими словами — лучший способ проверить понимание.',
        tip: 'Перед интервью попробуй объяснить ключевые концепции вслух за 30 секунд.',
      });
      setXp((x) => x + 10);
    } finally {
      setAiFeedbackLoading(false);
    }
  }

  if (!chapter) {
    return (
      <div className="learnPlaceholder">
        <div className="learnPlaceholderIcon">📖</div>
        <p>Раздел курса открывается из списка слева.</p>
        <div className="learnChapterCards">
          {PM_CHAPTERS.slice(0, 4).map((ch) => (
            <button key={ch.id} className="learnChapterCard" onClick={() => onSelectChapter(ch)} style={{ '--ch-color': ch.color }}>
              <span className="learnChapterCardIcon">{ch.icon}</span>
              <span className="learnChapterCardTitle">{ch.number}. {ch.title}</span>
              <span className="learnChapterCardSub">{ch.subtopics.length} подтем</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (!subtopic) {
    return (
      <div className="learnChapterView" ref={contentRef}>
        <div className="learnChapterViewHeader" style={{ '--ch-color': chapter.color }}>
          <span className="learnChapterViewIcon">{chapter.icon}</span>
          <div>
            <h2>{chapter.number}. {chapter.title}</h2>
            <p className="learnChapterViewDesc">{chapter.description}</p>
          </div>
        </div>

        {/* Notes blocks */}
        <div className="learnNotesSection">
          <div className="learnNotesSectionTitle">Ключевые концепции</div>
          {chapter.notes.map((note, i) => (
            <div key={i} className={`learnNoteBlock learnNoteBlock--${note.type}`}>
              <div className="learnNoteBlockLabel">
                {{ definition: '📘 Определение', example: '💡 Пример', note: '📌 Заметка', analogy: '🔗 Аналогия' }[note.type]}
              </div>
              <h4 className="learnNoteBlockTitle">{note.title}</h4>
              <p className="learnNoteBlockText">{note.text}</p>
            </div>
          ))}
        </div>

        {/* Subtopics */}
        <div className="learnSubtopicList">
          <div className="learnNotesSectionTitle">Подтемы для изучения</div>
          {chapter.subtopics.map((sub, idx) => {
            const content = LEARN_TOGETHER_CONTENT[sub.id];
            return (
              <button key={sub.id} className="learnSubtopicRow" onClick={() => { setSubtopic(sub); setSessionStep('expo'); setMcqAnswered(null); setAiExpo(null); }}>
                <span className="learnSubtopicNum">{idx + 1}</span>
                <div>
                  <div className="learnSubtopicTitle">{sub.title}</div>
                  <div className="learnSubtopicMeta">⏱ {sub.duration}{content ? ' · Интерактивное объяснение' : ''}</div>
                </div>
                <span className="learnSubtopicArrow">→</span>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  const content = LEARN_TOGETHER_CONTENT[subtopic.id];
  const exposition = aiExpo || content?.exposition;

  return (
    <div className="aliceSession" ref={contentRef}>
      {/* Alice.tech-style session header */}
      <div className="aliceSessionHead">
        <button className="btn btn-ghost" style={{ fontSize: 13 }} onClick={() => setSubtopic(null)}>← {chapter.title}</button>
        <div className="aliceStats">
          <span className="aliceHealth">{Array.from({ length: 3 }, (_, i) => i < health ? '♥' : '♡').join('')}</span>
          <span className="aliceXp">⚡ {xp} XP</span>
        </div>
      </div>

      {/* Progress road */}
      <div className="aliceRoad">
        <div className={`aliceRoadStep${sessionStep !== 'done' ? ' active' : ' done'}`}>
          <span className="aliceRoadDot" />
          <span>{subtopic.title}</span>
        </div>
      </div>

      {/* Step: Exposition */}
      {sessionStep === 'expo' && (
        <div className="aliceExpo">
          {content ? (
            <>
              <div className="aliceExpoCard">
                <div className="aliceExpoLabel">📖 Объяснение</div>
                {aiLoading
                  ? <p className="aliceDim">Генерирую упрощённое объяснение…</p>
                  : exposition?.split('\n\n').map((para, i) => <p key={i} className="aliceExpoText">{para}</p>)
                }
              </div>
              <div className="aliceActions">
                <button className="aliceBtn aliceBtnHard" onClick={handleTooHard} disabled={aiLoading}>🤔 Сложно — объясни проще</button>
                <button className="aliceBtn aliceBtnEasy" onClick={() => { setXp((x) => x + 5); setSessionStep('mcq'); }}>🌟 Понятно, дальше</button>
                <button className="aliceBtn aliceBtnContinue" onClick={() => setSessionStep('mcq')}>Продолжить →</button>
              </div>
            </>
          ) : (
            <div className="aliceExpoCard">
              <div className="aliceExpoLabel">📖 Подтема</div>
              <p className="aliceExpoText">Эта подтема входит в раздел «{chapter.title}». Ключевые концепции представлены в конспекте раздела, а закрепление доступно через Flash Cards и Банк вопросов.</p>
              <div className="aliceActions" style={{ marginTop: 20 }}>
                <button className="aliceBtn aliceBtnContinue" onClick={() => setSubtopic(null)}>← К подтемам</button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Step: MCQ */}
      {sessionStep === 'mcq' && content && (
        <div className="aliceMcq">
          <div className="aliceMcqCard">
            <div className="aliceExpoLabel">🔵 Вопрос</div>
            <p className="aliceMcqQ">{content.mcq.question}</p>
            <div className="aliceMcqOptions">
              {content.mcq.options.map((opt, i) => {
                let cls = 'aliceMcqOpt';
                if (mcqAnswered !== null) {
                  if (i === content.mcq.correct) cls += ' correct';
                  else if (i === mcqAnswered) cls += ' wrong';
                  else cls += ' dim';
                }
                return (
                  <button key={i} className={cls} onClick={() => {
                    if (mcqAnswered !== null) return;
                    setMcqAnswered(i);
                    if (i === content.mcq.correct) setXp((x) => x + 10);
                    else setHealth((h) => Math.max(0, h - 1));
                  }} disabled={mcqAnswered !== null}>
                    <span className="aliceMcqLetter">{String.fromCharCode(65 + i)}</span>
                    {opt}
                  </button>
                );
              })}
            </div>
            {mcqAnswered !== null && (
              <div className={`aliceFeedback${mcqAnswered === content.mcq.correct ? ' correct' : ' wrong'}`}>
                <div className="aliceFeedbackIcon">{mcqAnswered === content.mcq.correct ? '✓' : '✗'}</div>
                <div>
                  <strong>{mcqAnswered === content.mcq.correct ? 'Правильно!' : `Правильный ответ: ${content.mcq.options[content.mcq.correct]}`}</strong>
                  <p>{content.mcq.explanation}</p>
                </div>
              </div>
            )}
          </div>
          {/* True/False after wrong */}
          {mcqAnswered !== null && mcqAnswered !== content.mcq.correct && (
            <AliceTrueFalse
              statement={content.trueFalse.statement}
              correct={content.trueFalse.correct}
              explanation={content.trueFalse.explanation}
              onDone={(ok) => { if (ok) setXp((x) => x + 5); else setHealth((h) => Math.max(0, h - 1)); setSessionStep('aiChat'); }}
            />
          )}
          {mcqAnswered === content.mcq.correct && (
            <button className="aliceBtn aliceBtnContinue" style={{ marginTop: 16 }} onClick={() => setSessionStep('aiChat')}>Перейти к AI-разбору →</button>
          )}
          {mcqAnswered !== null && mcqAnswered !== content.mcq.correct && (
            <button className="aliceBtn aliceBtnContinue" style={{ marginTop: 16 }} onClick={() => setSessionStep('aiChat')}>Разбор с AI-ментором →</button>
          )}
        </div>
      )}

      {/* AI Chat Step */}
      {sessionStep === 'aiChat' && (
        <div className="aliceAiChat">
          <div className="aliceExpoCard">
            <div className="aliceExpoLabel">💬 AI-ментор</div>
            <p className="aliceMcqQ">
              Контроль понимания: <strong>что означает «{subtopic.title}» и как эта концепция применяется в реальном PM-кейсе или собеседовании?</strong>
            </p>
            <textarea
              className="aliceAnswerInput"
              value={userAnswer}
              onChange={(e) => setUserAnswer(e.target.value)}
              placeholder="Напиши 3–5 предложений своими словами. AI-ментор даст персональный фидбек."
              disabled={!!aiFeedback}
              rows={4}
            />
            {!aiFeedback && (
              <button
                className="aliceBtn aliceBtnContinue"
                onClick={handleGetAiFeedback}
                disabled={!userAnswer.trim() || aiFeedbackLoading}
                style={{ marginTop: 12 }}
              >
                {aiFeedbackLoading ? '🤖 Анализирую…' : 'Получить фидбек от AI →'}
              </button>
            )}
            {aiFeedback && (
              <div className="aliceAiFeedback">
                <div className="aliceExpoLabel">🤖 Фидбек AI-ментора</div>
                <p>{aiFeedback.explanation}</p>
                {aiFeedback.tip && (
                  <div className="aliceAiFeedbackTip">💡 <strong>Совет:</strong> {aiFeedback.tip}</div>
                )}
                <button className="aliceBtn aliceBtnContinue" style={{ marginTop: 14 }} onClick={() => setSessionStep('done')}>
                  Завершить тему → +{xp} XP
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Done */}
      {sessionStep === 'done' && (
        <div className="aliceDone">
          <div className="aliceDoneEmoji">🎓</div>
          <h3>Тема завершена!</h3>
          <p className="aliceDim">{subtopic.title}</p>
          <div className="aliceDoneStats">
            <span>❤ {health}/3</span>
            <span>⚡ {xp} XP</span>
          </div>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button className="btn btn-primary" onClick={() => { setSubtopic(null); setSessionStep('intro'); setMcqAnswered(null); setHealth(3); setXp(0); setAiExpo(null); }}>← Другая подтема</button>
          </div>
        </div>
      )}
    </div>
  );
}

const NOTE_SOURCE_LINKS = [
  { label: 'SVPG: Discovery / Delivery', href: 'https://www.svpg.com/discovery-delivery/' },
  { label: 'HBR: Jobs To Be Done', href: 'https://hbr.org/2016/09/know-your-customers-jobs-to-be-done' },
  { label: 'ProductTalk: Continuous Discovery', href: 'https://learn.producttalk.org/' },
  { label: 'The Lean Startup', href: 'https://theleanstartup.com/' },
];

const PRODUCT_THINKING_NOTE = {
  title: 'Учебник: продуктовое мышление',
  eyebrow: 'База PM',
  subtitle: 'Раздел объясняет связь между пользовательской задачей, бизнес-результатом, доказательствами и продуктовым решением.',
  introTitle: 'Продуктовое мышление как система принятия решений',
  definitionTitle: 'Продуктовое мышление',
  definition:
    '**Продуктовое мышление** — способ анализа, при котором каждое продуктовое решение связывается с пользовательской проблемой, целевым сегментом, бизнес-результатом, ограничениями реализации и доказательствами из данных или исследований. Такой подход помогает отличать полезное изменение продукта от простой активности команды.',
  bullets: [
    '**Продукт** рассматривается как система: проблема пользователя, аудитория, решение, бизнес-модель и канал доставки ценности.',
    '**Пользовательская ценность** показывает, какой прогресс получает человек или компания при использовании продукта.',
    '**Бизнес-ценность** показывает, как продукт влияет на выручку, удержание, маржу, снижение затрат или стратегическое преимущество.',
    '**Доказательства** включают интервью, аналитику, эксперименты, рыночные данные и наблюдения за поведением пользователей.',
    '**Метрика успеха** переводит качественную идею в измеримый результат, который можно проверить после запуска.',
  ],
  sections: [
    {
      title: 'Problem space и solution space',
      bullets: [
        '**Problem space** описывает пользователя, ситуацию, задачу, боль, текущие альтернативы и критерий успешного прогресса.',
        '**Solution space** включает возможные способы изменить продукт: сценарий, интерфейс, правило, цену, операцию, контент, алгоритм или AI-функцию.',
        '**Связь между пространствами** строится через гипотезу: если у выбранного сегмента есть конкретная проблема, то предложенное решение должно изменить наблюдаемое поведение.',
        '**Продуктовый риск** возникает, когда команда выбирает решение до того, как понятны пользовательская задача, масштаб проблемы и метрика успеха.',
      ],
    },
    {
      title: 'Jobs To Be Done',
      bullets: [
        '**Jobs To Be Done** — подход, согласно которому пользователь выбирает продукт для достижения прогресса в конкретной жизненной или рабочей ситуации.',
        '**Job** включает контекст, мотивацию, функциональный результат, эмоциональный результат, социальный результат и ограничения поведения.',
        '**Status quo** является текущим способом решения задачи: ручной процесс, конкурентный продукт, таблица, звонок, привычка или полное бездействие.',
        '**Сила JTBD** проявляется в объяснении переключения: продукт должен дать достаточно прогресса, чтобы преодолеть тревогу, привычку и стоимость изменения поведения.',
      ],
    },
    {
      title: 'Opportunity Solution Tree',
      bullets: [
        '**Opportunity Solution Tree** — дерево связи между целевым результатом, возможностями из исследований, решениями и экспериментами.',
        '**Outcome** находится наверху дерева и задаёт измеримый продуктовый результат, например рост активации или удержания.',
        '**Opportunities** описывают пользовательские боли, потребности и моменты трения, обнаруженные в исследованиях или данных.',
        '**Solutions** связываются с конкретными opportunities, поэтому roadmap остаётся привязанным к доказательствам, а не к отдельным запросам стейкхолдеров.',
      ],
    },
    {
      title: 'Метрики и проверка гипотез',
      bullets: [
        '**Главная метрика** фиксирует желаемое изменение поведения пользователя или бизнес-результата.',
        '**Guardrail-метрики** защищают продукт от локальной оптимизации, которая ухудшает качество, доверие, маржу или удержание.',
        '**Валидация гипотезы** может проходить через интервью, fake door, concierge MVP, тест прототипа, когортный анализ, A/B-тест или ручной пилот.',
        '**Критерий опровержения** заранее показывает, какие данные будут достаточными для остановки или изменения инициативы.',
      ],
    },
  ],
  callouts: [
    {
      type: 'analogy',
      title: 'Аналогия',
      text: '**Аналогия с диагностикой.** Продуктовое мышление похоже на медицинский разбор: сначала фиксируются симптомы, затем ищется причина, после этого выбирается лечение и измеряется восстановление.',
    },
    {
      type: 'note',
      title: 'Важно',
      text: '**Качественное продуктовое решение** содержит связь между сегментом, проблемой, доказательством, решением, метрикой и риском. Отсутствие любой части делает вывод менее проверяемым.',
    },
    {
      type: 'mistake',
      title: 'Типичная ошибка',
      items: [
        'Перечислить пять фич, не выбрав пользовательский сегмент.',
        'Сказать «улучшить UX» вместо точного трения в сценарии.',
        'Оптимизировать одну метрику без guardrails.',
        'Называть любой способ проверки A/B-тестом.',
      ],
    },
  ],
};

const CHAPTER_DIAGRAM_STEPS = {
  ch0: ['Бизнес-контекст', 'Пользователь', 'Проблема', 'Решение', 'Результат'],
  ch1: ['Проблема', 'Аудитория', 'Решение', 'Бизнес-модель', 'Канал доставки'],
  ch2: ['Ситуация', 'Job (задача)', 'Барьер', 'Желаемый прогресс', 'Переключение'],
  ch3: ['Цель исследования', 'Выбор метода', 'Проведение', 'Синтез', 'Решение'],
  ch4: ['TAM (весь рынок)', 'SAM (реализуемый)', 'SOM (достижимый)', 'Ваша ставка'],
  ch5: ['Диагностика', 'Guiding Policy', 'Coherent Actions', 'North Star', 'Метрики'],
  ch6: ['Business Goal', 'Product Goal', 'NSM', 'Input Metrics', 'Experiments'],
  ch7: ['Acquisition', 'Activation', 'Retention', 'Referral', 'Revenue'],
  ch8: ['Гипотеза', 'Дизайн теста', 'Запуск', 'Измерение', 'Решение'],
  ch9: ['Проблема', 'Backlog идей', 'Приоритизация', 'Roadmap', 'Delivery'],
  ch10: ['Revenue', '− COGS', '= Gross Profit', '− CAC', '= Contribution Margin'],
  ch11: ['Цель', 'Пользователь', 'Боль', 'Варианты', 'Выбор', 'Метрика', 'Риски'],
};

const PRODUCT_THINKING_VISUALS = [
  {
    type: 'venn',
    title: 'Три области продуктового решения',
    items: [
      { label: 'Пользовательская ценность', detail: 'решается значимая задача' },
      { label: 'Бизнес-результат', detail: 'создаётся измеримый эффект' },
      { label: 'Реализуемость', detail: 'решение доступно команде' },
    ],
  },
  {
    type: 'jtbd',
    title: 'Модель Jobs To Be Done',
    items: ['Ситуация', 'Мотивация', 'Прогресс', 'Барьер', 'Наблюдаемый результат'],
  },
  {
    type: 'tree',
    title: 'Opportunity Solution Tree',
    root: 'Outcome',
    branches: [
      { label: 'Opportunity A', children: ['Solution A1', 'Experiment A1'] },
      { label: 'Opportunity B', children: ['Solution B1', 'Experiment B1'] },
      { label: 'Opportunity C', children: ['Solution C1', 'Experiment C1'] },
    ],
  },
];

const getChapterVisuals = (chapter) => {
  if (!chapter) return [];
  if (chapter.id === 'ch1') return PRODUCT_THINKING_VISUALS;
  if (chapter.id === 'ch2') {
    return [
      { type: 'jtbd', title: 'Job Story', items: ['Ситуация', 'Мотивация', 'Прогресс', 'Барьер', 'Результат'] },
      { type: 'forces', title: 'Forces of Progress', items: ['Push', 'Pull', 'Anxiety', 'Habit'] },
    ];
  }
  if (chapter.id === 'ch3') {
    return [
      { type: 'flow', title: 'Цикл discovery', items: ['Гипотеза', 'Интервью', 'Инсайт', 'Opportunity', 'Решение'] },
    ];
  }
  if (chapter.id === 'ch4') {
    return [
      { type: 'flow', title: 'Market sizing', items: ['TAM', 'SAM', 'SOM', 'Доля', 'Вывод'] },
    ];
  }
  if (chapter.id === 'ch5') {
    return [
      { type: 'flow', title: 'Strategy kernel', items: ['Diagnosis', 'Policy', 'Actions', 'Metrics'] },
    ];
  }
  if (chapter.id === 'ch6') {
    return [
      { type: 'tree', title: 'Metric tree', root: 'North Star Metric', branches: [
        { label: 'Acquisition', children: ['Visitors', 'Signup rate'] },
        { label: 'Activation', children: ['Aha moment', 'TTFV'] },
        { label: 'Retention', children: ['D7', 'WAU'] },
      ] },
    ];
  }
  return [
    { type: 'flow', title: `Карта модуля ${chapter.number}`, items: CHAPTER_DIAGRAM_STEPS[chapter.id] || ['Понятие', 'Данные', 'Вывод', 'Действие'] },
  ];
};

const getNotesArticle = (chapter) => {
  if (!chapter || chapter.id === 'ch1') return { ...PRODUCT_THINKING_NOTE, visuals: PRODUCT_THINKING_VISUALS };
  const definitionNote = chapter.notes?.find((n) => n.type === 'definition') || chapter.notes?.[0];
  const exampleNote = chapter.notes?.find((n) => n.type === 'example');
  const analogyNote = chapter.notes?.find((n) => n.type === 'analogy');
  const noteNote = chapter.notes?.find((n) => n.type === 'note');
  const visualNotes = (chapter.notes || []).filter((n) => ['table', 'flow', 'comparison', 'formula'].includes(n.type));

  const callouts = [
    ...(analogyNote ? [{ type: 'analogy', title: analogyNote.title, text: analogyNote.text }] : []),
    ...(noteNote ? [{ type: 'note', title: noteNote.title, text: noteNote.text }] : []),
    ...(exampleNote ? [{ type: 'example', title: exampleNote.title, text: exampleNote.text }] : []),
    ...visualNotes.map((n) => ({ ...n })),
  ];

  return {
    title: `Конспект: ${chapter.title}`,
    eyebrow: `Модуль ${chapter.number}`,
    subtitle: chapter.description,
    introTitle: chapter.title,
    definitionTitle: definitionNote?.title || chapter.title,
    definition: definitionNote?.text || chapter.description,
    bullets: [
      chapter.description,
      '**Фреймворк раздела** связывает цель, пользователя, инструмент анализа, метрику и критерий принятия решения.',
      '**Качественный кейс-ответ** содержит допущения и показывает, какие данные способны изменить рекомендацию.',
      '**Закрепление темы** строится через вопросы, карточки, примеры и применение концепции к продуктовому сценарию.',
    ],
    sections: [
      {
        title: 'Применение в кейсе',
        bullets: [
          '**Проблема** формулируется в одном предложении с указанием пользователя и измеримого результата.',
          '**Фреймворк** выбирается по типу неопределённости: пользовательская, рыночная, техническая, экономическая или операционная.',
          '**Первый срез данных** показывает, где находится главный источник риска или потери ценности.',
          '**Criteria for success** фиксирует момент, когда решение считается сработавшим.',
        ],
      },
    ],
    callouts,
    diagramSteps: CHAPTER_DIAGRAM_STEPS[chapter.id],
    diagramLabel: `Логика: ${chapter.title}`,
    visuals: getChapterVisuals(chapter),
  };
};

const sanitizeTextbookText = (value = '') =>
  value
    .replace(/\bты\b/gi, 'студент')
    .replace(/\bтвой\b/gi, 'изучаемый')
    .replace(/\bтвоя\b/gi, 'изучаемая')
    .replace(/Product Manager — это человек, который управляет созданием ценности\. Не «генератор идей», не «менеджер задач», а тот, кто решает:/g, 'Product Manager управляет созданием ценности и принимает решения:')
    .replace(/Продукт — это не приложение, не сайт и не набор функций\./g, 'Продукт описывает полную систему создания и доставки ценности.')
    .replace(/Продукт — это не список функций\. Это система/g, 'Продукт — это система')
    .replace(/Job — это не демографический сегмент\. Это ситуация/g, 'Job описывает ситуацию')
    .replace(/PM — не официант, который принимает заказы на фичи\. PM ближе к диагносту:/g, 'PM работает как диагност:')
    .replace(/Не «людям нравится», а «люди не могут без этого жить»\./g, 'Признак состояния: пользователи регулярно возвращаются, рекомендуют продукт и считают потерю продукта существенной.')
    .replace(/«Запустили онбординг» — output\. «D7 retention вырос с 22% до 35%» — outcome\./g, 'Пример output: запущен онбординг. Пример outcome: D7 retention вырос с 22% до 35%.')
    .replace(/«Вы бы купили это за 500 рублей\?» — плохо\. Мама из вежливости скажет «да»\./g, 'Вопрос о гипотетической покупке за 500 рублей даёт слабые данные, потому что респонденту легко согласиться из вежливости.')
    .replace(/Никогда не показывай/g, 'Прототип показывается после того, как команда поняла проблему; не следует показывать')
    .replace(/Начинай/g, 'Начинать следует')
    .replace(/Начни/g, 'Начальная точка анализа —')
    .replace(/Выбери/g, 'Выбирается')
    .replace(/Используй/g, 'Применяется')
    .replace(/Проверь/g, 'Проверяется')
    .replace(/проверь/g, 'проверяется')
    .replace(/напиши/g, 'составляется')
    .replace(/сформулируй/g, 'формулируется')
    .replace(/объясни/g, 'объясняется')
    .replace(/открой/g, 'открывается')
    .replace(/переформулируй/g, 'переформулируется')
    .replace(/проведи/g, 'проводится')
    .replace(/Возьми/g, 'Пример')
    .trim();

const renderTextbookText = (value) => {
  const text = sanitizeTextbookText(value);
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={index}>{part.slice(2, -2)}</strong>;
    }
    return <React.Fragment key={index}>{part}</React.Fragment>;
  });
};

const splitLessonParagraphs = (value = '') =>
  sanitizeTextbookText(value)
    .split(/\n\n+/)
    .map((item) => item.trim())
    .filter(Boolean);

const subtopicDefinitionOverrides = {
  ch0_1: 'Product Manager — роль, отвечающая за выбор продуктовой проблемы, целевой аудитории, критерия успеха и способа доставки ценности пользователю и бизнесу.',
  ch1_1: 'Продукт — система, соединяющая проблему, аудиторию, решение, бизнес-модель и канал доставки ценности.',
  ch1_3: 'Product-Market Fit — состояние, при котором конкретный рынок устойчиво получает ценность от продукта, а поведение пользователей подтверждает потребность.',
  ch2_1: 'Jobs To Be Done — подход, в котором продукт рассматривается как средство достижения прогресса пользователя в конкретной ситуации.',
  ch3_3: 'The Mom Test — методика интервью, где вопросы строятся вокруг прошлого поведения, фактических затрат, реального контекста и уже совершённых действий.',
};

const DEFAULT_KEY_POINTS = [
  '**Сначала фиксируется смысл термина.** У понятия должна быть рабочая формулировка, которую можно применить в кейсе.',
  '**Затем определяется управленческое решение.** Концепция полезна, когда помогает выбрать сегмент, метрику, инициативу или эксперимент.',
  '**После этого проверяется связь с данными.** Для каждой идеи нужны наблюдения, метрики или факты из исследования.',
  '**Финальный шаг — вывод.** В ответе должно быть понятно, какое действие меняется благодаря этой теме.',
];

const getSubtopicTextbookLesson = (chapter, subtopic) => {
  const content = subtopic ? LEARN_TOGETHER_CONTENT[subtopic.id] : null;
  const definitionNote = chapter.notes?.find((note) => note.type === 'definition') || chapter.notes?.[0];
  const exampleNote = chapter.notes?.find((note) => note.type === 'example');
  const analogyNote = chapter.notes?.find((note) => note.type === 'analogy');
  const topicTitle = subtopic?.title || chapter.title;
  const exposition = content?.exposition || definitionNote?.text || chapter.description;
  const paragraphs = splitLessonParagraphs(exposition);
  const definitionOverride = content?.definition || subtopicDefinitionOverrides[subtopic?.id];
  const definition = definitionOverride
    ? sanitizeTextbookText(definitionOverride)
    : sanitizeTextbookText(paragraphs[0] || definitionNote?.text || chapter.description);
  const exampleText = content?.mcq?.explanation || exampleNote?.text || `В кейсе тема «${topicTitle}» применяется для перехода от общего описания проблемы к проверяемой гипотезе, метрике успеха и следующему действию команды.`;

  const subtopicVisual = content?.visual;
  const baseVisuals = getLessonVisuals(chapter, subtopic);
  const visuals = subtopicVisual ? [subtopicVisual, ...baseVisuals] : baseVisuals;

  return {
    title: subtopic ? `Урок: ${topicTitle}` : `Конспект: ${chapter.title}`,
    eyebrow: subtopic ? `Модуль ${chapter.number} · Подтема` : `Модуль ${chapter.number}`,
    subtitle: subtopic ? `Учебный разбор темы «${topicTitle}» в контексте Product Management и case interview.` : chapter.description,
    definitionTitle: topicTitle,
    definition,
    paragraphs: paragraphs.length > 1 ? paragraphs.slice(1) : paragraphs,
    keyPoints: content?.keyPoints?.length ? content.keyPoints : DEFAULT_KEY_POINTS,
    realExamples: content?.realExamples || null,
    framework: content?.framework || null,
    comparisonTable: content?.comparisonTable || null,
    formula: content?.formula || null,
    commonMistakes: content?.commonMistakes || null,
    checklist: content?.checklist || null,
    example: sanitizeTextbookText(exampleText),
    analogy: analogyNote?.text ? sanitizeTextbookText(analogyNote.text) : '',
    diagramSteps: CHAPTER_DIAGRAM_STEPS[chapter.id] || ['Термин', 'Зачем нужен', 'Данные', 'Решение', 'Метрика', 'Риск'],
    practice: `Контроль понимания: для темы «${topicTitle}» важны три элемента — точное определение, продуктовый пример и метрика, показывающая успешное применение концепции.`,
    visuals,
  };
};

const getLessonVisuals = (chapter, subtopic) => {
  if (subtopic?.id === 'ch2_1') {
    return [
      {
        type: 'jtbd',
        title: 'Структура Job Story',
        items: ['Ситуация', 'Мотивация', 'Желаемый прогресс', 'Барьер', 'Наблюдаемый результат'],
      },
      {
        type: 'forces',
        title: 'Forces of Progress',
        items: ['Push: боль текущего решения', 'Pull: привлекательность нового', 'Anxiety: риск перехода', 'Habit: сила привычки'],
      },
    ];
  }
  if (chapter.id === 'ch1') return PRODUCT_THINKING_VISUALS;
  return [
    {
      type: 'flow',
      title: 'Схема применения темы',
      items: CHAPTER_DIAGRAM_STEPS[chapter.id] || ['Понятие', 'Данные', 'Вывод', 'Действие'],
    },
  ];
};

const getLessonStudyBlocks = (chapter, subtopic) => {
  const title = subtopic?.title || chapter.title;
  const quality = chapter.id === 'ch6' || chapter.id === 'ch7'
    ? 'выбранная метрика меняет решение команды'
    : chapter.id === 'ch3'
      ? 'исследование даёт проверяемый инсайт'
      : 'понятие помогает выбрать продуктовый ход';

  return {
    why: `Тема «${title}» нужна для того, чтобы продуктовая рекомендация опиралась на поведение пользователя, данные и бизнес-эффект. В кейсе она превращает общий ответ в проверяемую управленческую гипотезу.`,
    example: [
      'Контекст: продукт, пользователь, цель и ограничение.',
      'Неопределённость: ценность, рынок, метрика, экономика или реализация.',
      'Инструмент: концепция используется для выбора следующего действия.',
      `Критерий качества: ${quality}.`,
    ],
    checkQuestion: `Как тема «${title}» меняет решение PM в продуктовой задаче?`,
    checkAnswer: 'Ответ считается сильным, если в нём есть сегмент, проблема, данные, решение, метрика успеха и главный риск.',
    summary: [
      `«${title}» — рабочий инструмент анализа.`,
      'Применение связывает пользователя, данные, решение и метрику.',
      'Главный результат урока — более обоснованное действие команды.',
    ],
  };
};

function PracticumStudyBlocks({ blocks }) {
  if (!blocks) return null;
  return (
    <section className="practicumBlocks">
      <article className="practicumCard practicumWhy">
        <div className="practicumCardLabel">Зачем это нужно</div>
        <p>{blocks.why}</p>
      </article>
      <article className="practicumCard practicumExample">
        <div className="practicumCardLabel">Пример применения</div>
        <ul>{blocks.example.map((item) => <li key={item}>{item}</li>)}</ul>
      </article>
      <article className="practicumCard practicumCheck">
        <div className="practicumCardLabel">Мини-тренажёр</div>
        <p><strong>{blocks.checkQuestion}</strong></p>
        <div className="practicumAnswer">{blocks.checkAnswer}</div>
      </article>
      <article className="practicumCard practicumSummary">
        <div className="practicumCardLabel">Самое главное</div>
        <ol>{blocks.summary.map((item) => <li key={item}>{item}</li>)}</ol>
      </article>
    </section>
  );
}

function ProductCaseCanvas({ chapterId, title }) {
  const labels = chapterId === 'ch3'
    ? ['Гипотеза', 'Интервью', 'Инсайт', 'Opportunity', 'Решение']
    : chapterId === 'ch6' || chapterId === 'ch7'
      ? ['Цель', 'NSM', 'Input', 'Guardrail', 'Решение']
      : ['Пользователь', 'Проблема', 'Данные', 'Решение', 'Метрика'];

  return (
    <figure className="productCaseCanvas">
      <figcaption>{title}</figcaption>
      <svg viewBox="0 0 760 280" role="img" aria-label={title}>
        <path className="canvasSpine" d="M90 140 H670" />
        {labels.map((label, index) => {
          const x = 90 + index * 145;
          const y = index % 2 === 0 ? 72 : 158;
          return (
            <g key={label}>
              <path className="canvasConnector" d={`M${x} 140 V${y + 30}`} />
              <rect className="canvasNode" x={x - 54} y={y} width="108" height="60" rx="16" />
              <text x={x} y={y + 36} textAnchor="middle">{label}</text>
            </g>
          );
        })}
      </svg>
    </figure>
  );
}

function TextbookVisual({ visual }) {
  if (!visual) return null;

  if (visual.type === 'venn') {
    return (
      <div className="textbookVisual textbookVisualVenn">
        <div className="textbookVisualTitle">{visual.title}</div>
        <div className="vennDiagram" aria-label={visual.title}>
          {visual.items.map((item, index) => (
            <div key={item.label} className={`vennCircle vennCircle${index + 1}`}>
              <strong>{item.label}</strong>
              <span>{item.detail}</span>
            </div>
          ))}
          <div className="vennCenter">Сильное продуктовое решение</div>
        </div>
      </div>
    );
  }

  if (visual.type === 'tree') {
    return (
      <div className="textbookVisual textbookVisualTree">
        <div className="textbookVisualTitle">{visual.title}</div>
        <div className="ostTree">
          <div className="ostRoot">{visual.root}</div>
          <div className="ostBranches">
            {visual.branches.map((branch) => (
              <div key={branch.label} className="ostBranch">
                <strong>{branch.label}</strong>
                {branch.children.map((child) => <span key={child}>{child}</span>)}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (visual.type === 'forces') {
    return (
      <div className="textbookVisual textbookForces">
        <div className="textbookVisualTitle">{visual.title}</div>
        <div className="forcesGrid">
          {visual.items.map((item, index) => (
            <div key={item} className={index < 2 ? 'forcePositive' : 'forceNegative'}>{item}</div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="textbookVisual textbookFlow">
      <div className="textbookVisualTitle">{visual.title}</div>
      <div className="textbookFlowSteps">
        {visual.items.map((item, index) => (
          <React.Fragment key={item}>
            <span>{item}</span>
            {index < visual.items.length - 1 && <em>→</em>}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

function TextbookSketch({ title, chapterId, subtopicId }) {
  const isJtbd = chapterId === 'ch2' || subtopicId === 'ch2_1';
  const isMetrics = chapterId === 'ch6' || chapterId === 'ch7';

  return (
    <figure className={`textbookSketch${isJtbd ? ' jtbdSketch' : isMetrics ? ' metricsSketch' : ''}`}>
      <svg viewBox="0 0 720 320" role="img" aria-label={title}>
        {isJtbd ? (
          <>
            <path className="sketchDashed" d="M86 214 C 190 78, 302 72, 364 156 S 528 242, 635 96" />
            <path className="sketchLine" d="M86 236 L 636 236" />
            <circle className="sketchDot" cx="86" cy="236" r="12" />
            <circle className="sketchDot" cx="636" cy="236" r="12" />
            <text x="62" y="276">status quo</text>
            <text x="582" y="276">progress</text>
            <text className="sketchAccent" x="250" y="116">Job</text>
            <text className="sketchAccent" x="388" y="190">barrier</text>
          </>
        ) : isMetrics ? (
          <>
            <rect className="sketchBox" x="70" y="58" width="150" height="62" rx="18" />
            <rect className="sketchBox" x="285" y="58" width="150" height="62" rx="18" />
            <rect className="sketchBox" x="500" y="58" width="150" height="62" rx="18" />
            <path className="sketchArrow" d="M224 88 H 278" />
            <path className="sketchArrow" d="M438 88 H 492" />
            <text x="108" y="96">input</text>
            <text x="318" y="96">proxy</text>
            <text x="535" y="96">NSM</text>
            <path className="sketchLine" d="M120 224 L 260 178 L 396 198 L 560 132" />
            <circle className="sketchDot" cx="120" cy="224" r="9" />
            <circle className="sketchDot" cx="260" cy="178" r="9" />
            <circle className="sketchDot" cx="396" cy="198" r="9" />
            <circle className="sketchDot" cx="560" cy="132" r="9" />
          </>
        ) : (
          <>
            <circle className="sketchOrbit" cx="242" cy="154" r="104" />
            <circle className="sketchOrbit" cx="362" cy="154" r="104" />
            <circle className="sketchOrbit" cx="302" cy="238" r="104" />
            <text x="132" y="78">user value</text>
            <text x="420" y="78">business</text>
            <text x="250" y="302">feasibility</text>
            <rect className="sketchBox" x="252" y="138" width="118" height="48" rx="16" />
            <text className="sketchAccent" x="276" y="168">product</text>
          </>
        )}
      </svg>
      <figcaption>{title}</figcaption>
    </figure>
  );
}

function NoteCallout({ callout }) {
  if (callout.type === 'table') {
    return (
      <div className="noteCalloutTable">
        <div className="noteCalloutTableTitle">{callout.title}</div>
        <div className="noteCalloutTableWrap">
          <table>
            <thead><tr>{callout.headers.map((h) => <th key={h}>{h}</th>)}</tr></thead>
            <tbody>{callout.rows.map((row, i) => <tr key={i}>{row.map((cell, j) => <td key={j}>{cell}</td>)}</tr>)}</tbody>
          </table>
        </div>
      </div>
    );
  }
  if (callout.type === 'flow') {
    return (
      <div className="noteCalloutFlow">
        <div className="noteCalloutFlowTitle">{callout.title}</div>
        <div className="noteCalloutFlowSteps">
          {callout.steps.map((step, i) => (
            <React.Fragment key={i}>
              <div className="noteCalloutFlowStep">{step}</div>
              {i < callout.steps.length - 1 && <div className="noteCalloutFlowArrow">→</div>}
            </React.Fragment>
          ))}
        </div>
      </div>
    );
  }
  if (callout.type === 'comparison') {
    return (
      <div className="noteCalloutComparison">
        <div className="noteCalloutComparisonTitle">{callout.title}</div>
        <div className="noteCalloutComparisonCols">
          <div className="noteCalloutComparisonCol noteCalloutComparisonLeft">
            <div className="noteCalloutComparisonLabel">{callout.left.label}</div>
            <ul>{callout.left.items.map((item) => <li key={item}>{item}</li>)}</ul>
          </div>
          <div className="noteCalloutComparisonCol noteCalloutComparisonRight">
            <div className="noteCalloutComparisonLabel">{callout.right.label}</div>
            <ul>{callout.right.items.map((item) => <li key={item}>{item}</li>)}</ul>
          </div>
        </div>
      </div>
    );
  }
  if (callout.type === 'formula') {
    return (
      <div className="noteCalloutFormula">
        <div className="noteCalloutFormulaTitle">{callout.title}</div>
        {callout.items.map((item) => (
          <div key={item.label} className="noteCalloutFormulaRow">
            <span className="noteCalloutFormulaLabel">{item.label}</span>
            <code className="noteCalloutFormulaCode">{item.formula}</code>
          </div>
        ))}
      </div>
    );
  }
  return (
    <div className={`noteArticleCallout ${callout.type}`}>
      <div className="noteArticleCalloutLabel">{callout.title}</div>
      {callout.items ? (
        <ul>{callout.items.map((item) => <li key={item}>{renderTextbookText(item)}</li>)}</ul>
      ) : (
        <p>{renderTextbookText(callout.text)}</p>
      )}
    </div>
  );
}

function NotesContent({ chapter, selectedSubtopic, onSelectChapter }) {
  const activeChapter = chapter || PM_CHAPTERS.find((item) => item.id === 'ch1') || PM_CHAPTERS[0];
  const article = getNotesArticle(activeChapter);
  const lesson = selectedSubtopic ? getSubtopicTextbookLesson(activeChapter, selectedSubtopic) : null;
  const studyBlocks = getLessonStudyBlocks(activeChapter, selectedSubtopic);

  if (lesson) {
    return (
      <div className="noteArticle textbookLesson">
        <div className="noteArticleHero" style={{ '--ch-color': activeChapter.color }}>
          <div>
            <div className="noteArticleCrumbs">
              <span>Case prep resources</span>
              <b>›</b>
              <span>Уроки</span>
              <b>›</b>
              <strong>{activeChapter.title}</strong>
            </div>
            <h2>{lesson.title}</h2>
            <p>{lesson.subtitle}</p>
          </div>
          <button className="btn btn-ghost" onClick={() => onSelectChapter(activeChapter, null)}>К обзору модуля</button>
        </div>

        <article className="noteArticleBody">
          <div className="textbookMeta">
            <span>{lesson.eyebrow}</span>
            <span>{selectedSubtopic.duration}</span>
          </div>

          <section className="noteArticleDefinition">
            <span>Определение</span>
            <strong>{lesson.definitionTitle}</strong>
            <p>{renderTextbookText(`**${lesson.definition}**`)}</p>
          </section>

          <TextbookSketch title={`Визуальная модель: ${lesson.definitionTitle}`} chapterId={activeChapter.id} subtopicId={selectedSubtopic.id} />
          <ProductCaseCanvas chapterId={activeChapter.id} title="Карта применения в продуктовой задаче" />

          <section className="noteArticleSection">
            <h3>Учебное объяснение</h3>
            {lesson.paragraphs.map((paragraph) => (
              <p key={paragraph} className="textbookParagraph">{renderTextbookText(paragraph)}</p>
            ))}
          </section>

          <section className="noteArticleSection">
            <h3>Ключевые выводы</h3>
            <ol className="noteArticleList">
              {lesson.keyPoints.map((item) => <li key={item}>{renderTextbookText(item)}</li>)}
            </ol>
          </section>

          {lesson.formula && (
            <NoteCallout callout={{ type: 'formula', title: lesson.formula.title, items: lesson.formula.items }} />
          )}

          {lesson.framework && (
            <section className="noteArticleSection noteArticleFramework">
              <h3>{lesson.framework.title}</h3>
              <ol className="noteArticleList">
                {lesson.framework.items.map((item) => (
                  <li key={item.name}>{renderTextbookText(`**${item.name}.** ${item.description}`)}</li>
                ))}
              </ol>
            </section>
          )}

          {lesson.comparisonTable && (
            <NoteCallout callout={{ type: 'table', title: lesson.comparisonTable.title, headers: lesson.comparisonTable.headers, rows: lesson.comparisonTable.rows }} />
          )}

          {lesson.realExamples && lesson.realExamples.length > 0 && (
            <section className="noteArticleSection noteArticleRealExamples">
              <h3>Примеры из реальных продуктов</h3>
              <div className="realExamplesGrid">
                {lesson.realExamples.map((ex) => (
                  <article key={ex.product + ex.situation} className="realExampleCard">
                    <div className="realExampleProduct">{ex.product}</div>
                    <div className="realExampleRow"><strong>Ситуация.</strong> {ex.situation}</div>
                    <div className="realExampleRow"><strong>Действие.</strong> {ex.action}</div>
                    <div className="realExampleRow"><strong>Результат.</strong> {ex.outcome}</div>
                  </article>
                ))}
              </div>
            </section>
          )}

          {lesson.commonMistakes && lesson.commonMistakes.length > 0 && (
            <section className="noteArticleCallout note">
              <div className="noteArticleCalloutLabel">Типичные ошибки</div>
              <ul>
                {lesson.commonMistakes.map((item) => <li key={item}>{renderTextbookText(item)}</li>)}
              </ul>
            </section>
          )}

          {lesson.checklist && lesson.checklist.length > 0 && (
            <section className="noteArticleCallout example">
              <div className="noteArticleCalloutLabel">Чек-лист</div>
              <ul>
                {lesson.checklist.map((item) => <li key={item}>{renderTextbookText(item)}</li>)}
              </ul>
            </section>
          )}

          {lesson.visuals.map((visual) => <TextbookVisual key={visual.title} visual={visual} />)}
          <PracticumStudyBlocks blocks={studyBlocks} />

          <div className="noteArticleDiagram textbookDiagram">
            <span>Схема применения</span>
            <div>
              {lesson.diagramSteps.map((item) => (
                <strong key={item}>{item}</strong>
              ))}
            </div>
          </div>

          <section className="noteArticleCallout example textbookExample">
            <div className="noteArticleCalloutLabel">Пример</div>
            <p>{renderTextbookText(`**Пример применения.** ${lesson.example}`)}</p>
          </section>

          {lesson.analogy && (
            <section className="noteArticleCallout analogy">
              <div className="noteArticleCalloutLabel">Аналогия</div>
              <p>{renderTextbookText(lesson.analogy)}</p>
            </section>
          )}

          <section className="noteArticlePractice">
            <h3>Практика</h3>
            <p>{renderTextbookText(`**${lesson.practice}**`)}</p>
          </section>
        </article>

        <aside className="noteArticleTopicRail">
          <span>Подтемы модуля</span>
          {activeChapter.subtopics.map((item) => (
            <button
              key={item.id}
              className={item.id === selectedSubtopic.id ? 'active' : ''}
              onClick={() => onSelectChapter(activeChapter, item)}
              style={{ '--col': activeChapter.color }}
            >
              <span>{activeChapter.icon}</span>
              <div>
                <strong>{item.title}</strong>
                <small>{item.duration}</small>
              </div>
            </button>
          ))}
        </aside>
      </div>
    );
  }

  return (
    <div className="noteArticle">
      <div className="noteArticleHero" style={{ '--ch-color': activeChapter.color }}>
        <div>
          <div className="noteArticleCrumbs">
            <span>Case prep resources</span>
            <b>›</b>
            <span>Конспекты</span>
            <b>›</b>
            <strong>{activeChapter.title}</strong>
          </div>
          <h2>{article.title}</h2>
          <p>{article.subtitle}</p>
          <div className="noteArticleSources">
            {NOTE_SOURCE_LINKS.map((source) => (
              <a key={source.href} href={source.href} target="_blank" rel="noreferrer">{source.label}</a>
            ))}
          </div>
        </div>
        <button className="btn btn-ghost" onClick={() => onSelectChapter(null)}>Сбросить тему</button>
      </div>

      <article className="noteArticleBody">
        <h3>{article.introTitle}</h3>
        <div className="noteArticleDefinition">
          <span>Определение</span>
          <strong>{article.definitionTitle}</strong>
          <p>{renderTextbookText(article.definition)}</p>
        </div>

        <TextbookSketch title={`Визуальная модель: ${article.definitionTitle}`} chapterId={activeChapter.id} />
        <ProductCaseCanvas chapterId={activeChapter.id} title="Карта применения в продуктовой задаче" />

        <ol className="noteArticleList">
          {article.bullets.map((item) => <li key={item}>{renderTextbookText(item)}</li>)}
        </ol>
        {article.sections.map((section) => (
          <section key={section.title} className="noteArticleSection">
            <h3>{section.title}</h3>
            <ol className="noteArticleList">
              {section.bullets.map((item) => <li key={item}>{renderTextbookText(item)}</li>)}
            </ol>
          </section>
        ))}

        {(article.visuals || []).map((visual) => <TextbookVisual key={visual.title} visual={visual} />)}
        <PracticumStudyBlocks blocks={studyBlocks} />

        <div className="noteArticleDiagram">
          <span>{article.diagramLabel || 'Логика ответа на кейс'}</span>
          <div>
            {(article.diagramSteps || ['Пользователь', 'Проблема', 'Данные', 'Варианты', 'Компромисс', 'Метрика', 'Следующий тест']).map((item) => (
              <strong key={item}>{item}</strong>
            ))}
          </div>
        </div>

        {article.callouts.map((callout, index) => <NoteCallout key={callout.title || `${callout.type}-${index}`} callout={callout} />)}

        <section className="noteArticlePractice">
          <h3>Как отработать конспект</h3>
          <p>{renderTextbookText('**Практический формат.** Выбирается любой продуктовый prompt и составляется ответ на 90 секунд по схеме выше. Затем через банк вопросов проверяется наличие пользователя, проблемы, данных, компромисса и метрики.')}</p>
          <div>
            <button className="btn btn-primary" onClick={() => onSelectChapter(activeChapter)}>Оставить эту тему</button>
          </div>
        </section>
      </article>

      <aside className="noteArticleTopicRail">
        <span>Другие конспекты</span>
        {PM_CHAPTERS.slice(0, 8).map((item) => (
          <button
            key={item.id}
            className={item.id === activeChapter.id ? 'active' : ''}
            onClick={() => onSelectChapter(item)}
            style={{ '--col': item.color }}
          >
            <span>{item.icon}</span>
            <div>
              <strong>{item.title}</strong>
              <small>{item.subtopics.length} подтем</small>
            </div>
          </button>
        ))}
      </aside>
    </div>
  );
}

function ReviewSessionModal({ onClose }) {
  const [step, setStep] = useState(1);
  const [subject, setSubject] = useState('product');
  const [topics, setTopics] = useState([]);
  const [level, setLevel] = useState('knows_a_bit');
  const [length, setLength] = useState('quick');
  const [started, setStarted] = useState(false);
  const [messages, setMessages] = useState([]);
  const [userInput, setUserInput] = useState('');
  const [sending, setSending] = useState(false);
  const chatRef = useRef(null);

  const subjects = [
    { id: 'product', title: 'Product Case Track', sub: 'PM interviews, metrics, discovery, strategy' },
    { id: 'business', title: 'Business Case Track', sub: 'Consulting, market sizing, economics, recommendation' },
  ];
  const availableTopics = PM_CHAPTERS.slice(0, 12);
  const selectedTopics = availableTopics.filter((topic) => topics.includes(topic.id));

  function toggleTopic(id) {
    setTopics((prev) => {
      if (prev.includes(id)) return prev.filter((item) => item !== id);
      if (prev.length >= 3) return prev;
      return [...prev, id];
    });
  }

  function startSession() {
    const topicNames = selectedTopics.map((t) => t.title).join(', ');
    const intro = `Привет! Я AI-ментор Case Dojo. Сегодня разбираем: **${topicNames}**.

Уровень сессии: ${level === 'clueless' ? 'с нуля' : level === 'pretty_familiar' ? 'продвинутый' : 'базовый'}. Формат: ${length === 'quick' ? 'короткий разбор' : 'глубокая проработка'}.

Задай вопрос по теме, попроси объяснить концепцию, проверь своё понимание — я здесь чтобы помочь разобраться. С чего начнём?`;
    setMessages([{ role: 'ai', text: intro }]);
    setStarted(true);
  }

  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [messages]);

  async function sendMessage() {
    const text = userInput.trim();
    if (!text || sending) return;
    const userMsg = { role: 'user', text };
    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setUserInput('');
    setSending(true);
    try {
      const topic = selectedTopics[0] || availableTopics[0];
      const userLevel = level === 'clueless' ? 'simplified' : level === 'pretty_familiar' ? 'advanced' : 'normal';
      const data = await api.learnExplain({
        topic: topic?.title || 'Product Management',
        subtopic: selectedTopics.map((t) => t.title).join(', '),
        question: text,
        wrongAnswer: text,
        correctAnswer: '',
        difficulty: userLevel,
      });
      const aiText = data.explanation + (data.tip ? `\n\n💡 **Совет:** ${data.tip}` : '');
      setMessages([...nextMessages, { role: 'ai', text: aiText }]);
    } catch {
      setMessages([...nextMessages, { role: 'ai', text: 'Не удалось получить ответ от AI. Проверь подключение и попробуй ещё раз.' }]);
    } finally {
      setSending(false);
    }
  }

  function handleInputKey(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  return (
    <div className="reviewOverlay" role="dialog" aria-modal="true">
      <div className="reviewModal">
        <button className="reviewClose" onClick={onClose} aria-label="Close">×</button>
        {!started ? (
          <>
            <div className="reviewStepMeta">Step {step} of 3</div>
            {step === 1 && (
              <div className="reviewStep">
                <h2>Choose your track</h2>
                <p>Pick the case direction you want to review with AI.</p>
                <div className="reviewChoiceGrid">
                  {subjects.map((item) => (
                    <button key={item.id} className={subject === item.id ? 'active' : ''} onClick={() => setSubject(item.id)}>
                      <strong>{item.title}</strong>
                      <small>{item.sub}</small>
                    </button>
                  ))}
                </div>
              </div>
            )}
            {step === 2 && (
              <div className="reviewStep">
                <h2>Choose what to review</h2>
                <p>Select up to 3 topics for a focused session.</p>
                <div className="reviewTopicList">
                  {availableTopics.map((topic) => (
                    <label key={topic.id}>
                      <input type="checkbox" checked={topics.includes(topic.id)} onChange={() => toggleTopic(topic.id)} />
                      <span>{topic.icon} {topic.title}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
            {step === 3 && (
              <div className="reviewStep">
                <h2>Configure your session</h2>
                <p>Set how much the AI mentor should assume you already know.</p>
                <div className="reviewConfig">
                  {[
                    ['clueless', 'С нуля', 'Нужно объяснять максимально просто.'],
                    ['knows_a_bit', 'Знаю немного', 'Есть база, но нужна связная логика.'],
                    ['pretty_familiar', 'Уверенно', 'Фокус на нюансах и tricky parts.'],
                  ].map(([id, title, sub]) => (
                    <button key={id} className={level === id ? 'active' : ''} onClick={() => setLevel(id)}>
                      <strong>{title}</strong>
                      <small>{sub}</small>
                    </button>
                  ))}
                </div>
                <div className="reviewConfig two">
                  {[
                    ['quick', 'Quick Review', 'Короткая сессия для повторения.'],
                    ['deep', 'In-Depth', 'Длиннее, с большим количеством объяснений.'],
                  ].map(([id, title, sub]) => (
                    <button key={id} className={length === id ? 'active' : ''} onClick={() => setLength(id)}>
                      <strong>{title}</strong>
                      <small>{sub}</small>
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div className="reviewFooter">
              <button className="btn btn-ghost" onClick={() => step === 1 ? onClose() : setStep((s) => s - 1)}>Back</button>
              {step < 3 ? (
                <button className="btn btn-primary" onClick={() => setStep((s) => s + 1)} disabled={step === 2 && topics.length === 0}>Next</button>
              ) : (
                <button className="btn btn-primary" onClick={startSession} disabled={topics.length === 0}>Start Review Session</button>
              )}
            </div>
          </>
        ) : (
          <div className="reviewSession">
            <div className="reviewSessionHead">
              <button onClick={() => { setStarted(false); setMessages([]); }}>← Back</button>
              <span>{selectedTopics.map((t) => t.icon).join(' ')} {length === 'quick' ? 'Quick Review' : 'In-Depth'}</span>
              <button onClick={onClose}>End Session</button>
            </div>
            <div className="reviewChat" ref={chatRef}>
              {messages.map((msg, i) => (
                <div key={i} className={`reviewBubble ${msg.role}`}>
                  {msg.role === 'ai' && <strong>Case Dojo AI</strong>}
                  {msg.text.split('\n').map((line, j) => (
                    line ? <p key={j}>{line.replace(/\*\*([^*]+)\*\*/g, '$1')}</p> : <br key={j} />
                  ))}
                </div>
              ))}
              {sending && (
                <div className="reviewBubble ai">
                  <strong>Case Dojo AI</strong>
                  <p className="reviewThinking"><span className="spinner" /> думаю…</p>
                </div>
              )}
            </div>
            <div className="reviewInputRow">
              <textarea
                className="reviewInput"
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                onKeyDown={handleInputKey}
                placeholder="Задай вопрос или объясни концепт своими словами…"
                rows={2}
                disabled={sending}
              />
              <button className="reviewSendBtn" onClick={sendMessage} disabled={!userInput.trim() || sending}>
                {sending ? '…' : '↑'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function AliceTrueFalse({ statement, correct, explanation, onDone }) {
  const [answered, setAnswered] = useState(null);
  return (
    <div className="aliceTf">
      <div className="aliceExpoLabel" style={{ marginBottom: 10 }}>☑️ Верно или нет?</div>
      <p className="aliceTfStatement">{statement}</p>
      <div className="aliceTfBtns">
        <button className={`aliceTfBtn${answered !== null ? (false === correct ? ' wrong' : answered === false ? ' dim' : '') : ''}`}
          onClick={() => { if (answered !== null) return; setAnswered(false); }}
          disabled={answered !== null}>
          ✗ Неверно
        </button>
        <button className={`aliceTfBtn${answered !== null ? (true === correct ? ' correct' : answered === true ? ' wrong' : ' dim') : ''}`}
          onClick={() => { if (answered !== null) return; setAnswered(true); }}
          disabled={answered !== null}>
          ✓ Верно
        </button>
      </div>
      {answered !== null && (
        <div className={`aliceFeedback${answered === correct ? ' correct' : ' wrong'}`} style={{ marginTop: 12 }}>
          <div className="aliceFeedbackIcon">{answered === correct ? '✓' : '✗'}</div>
          <div><strong>{answered === correct ? 'Правильно!' : 'Не совсем...'}</strong><p>{explanation}</p></div>
        </div>
      )}
      {answered !== null && (
        <button className="aliceBtn aliceBtnContinue" style={{ marginTop: 14 }} onClick={() => onDone(answered === correct)}>Завершить →</button>
      )}
    </div>
  );
}

/* ── Flash Cards — Anki-style SRS with dark theme ── */

const SRS_INTERVALS = { again: 10 / (60 * 24), hard: 45 / (60 * 24), good: 1, easy: 4 };

function loadFcProgress() {
  try { return JSON.parse(localStorage.getItem('hc_fc_v2') || '{}'); } catch { return {}; }
}
function saveFcProgress(p) { localStorage.setItem('hc_fc_v2', JSON.stringify(p)); }

function FlashCardsContent({ chapter, onSelectChapter }) {
  const [progress, setProgress] = useState(loadFcProgress);
  const [cardIndex, setCardIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [done, setDone] = useState(false);
  const cards = chapter ? (FLASHCARDS[chapter.id] || []) : [];

  const totalAll = Object.values(FLASHCARDS).reduce((s, a) => s + a.length, 0);
  const reviewedAll = Object.keys(progress).length;
  const confAll = totalAll > 0 ? Math.round((reviewedAll / totalAll) * 100) : 0;

  useEffect(() => { setCardIndex(0); setFlipped(false); setDone(false); }, [chapter]);

  useEffect(() => {
    const fn = (e) => { if (e.code === 'Space' && chapter && cards.length) { e.preventDefault(); setFlipped((f) => !f); } };
    window.addEventListener('keydown', fn);
    return () => window.removeEventListener('keydown', fn);
  }, [chapter, cards.length]);

  function rate(r) {
    const card = cards[cardIndex];
    const interval = SRS_INTERVALS[r];
    const nextReview = Date.now() + interval * 86400000;
    const next = { ...progress, [card.id]: { rating: r, nextReview, reviewedAt: Date.now() } };
    setProgress(next);
    saveFcProgress(next);
    if (cardIndex + 1 >= cards.length) setDone(true);
    else { setCardIndex((i) => i + 1); setFlipped(false); }
  }

  if (!chapter) {
    return (
      <div className="fcHome">
        <div className="fcHomeStats">
          <div className="fcRingWrap">
            <svg viewBox="0 0 64 64" className="fcRingSvg">
              <circle cx="32" cy="32" r="28" fill="none" stroke="var(--hair-strong)" strokeWidth="4" />
              <circle cx="32" cy="32" r="28" fill="none" stroke="var(--mint)" strokeWidth="4"
                strokeDasharray={`${2 * Math.PI * 28}`}
                strokeDashoffset={`${2 * Math.PI * 28 * (1 - confAll / 100)}`}
                strokeLinecap="round" transform="rotate(-90 32 32)" />
            </svg>
            <span className="fcRingPct">{confAll}%</span>
          </div>
          <div>
            <div className="fcHomeStatsLabel">Общий прогресс</div>
            <div className="fcHomeStatsSub">{reviewedAll}/{totalAll} карточек изучено</div>
          </div>
        </div>
        <div className="fcHomeHint">Выбери раздел слева чтобы начать сессию</div>
        <div className="fcChapterGrid">
          {PM_CHAPTERS.map((ch) => {
            const chs = FLASHCARDS[ch.id] || [];
            const chRev = chs.filter((c) => progress[c.id]).length;
            const chPct = chs.length > 0 ? Math.round((chRev / chs.length) * 100) : 0;
            return (
              <button key={ch.id} className="fcChapterTile" style={{ '--col': ch.color }} onClick={() => onSelectChapter(ch)}>
                <span className="fcChapterTileIcon">{ch.icon}</span>
                <div className="fcChapterTileName">{ch.number}. {ch.title}</div>
                <div className="fcChapterTileBar"><div style={{ width: `${chPct}%` }} /></div>
                <div className="fcChapterTilePct">{chPct}% · {chs.length} карточек</div>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  if (!cards.length) return (
    <div className="fcDone">
      <div className="fcDoneEmoji">▰</div>
      <h3>В этом разделе пока нет карточек</h3>
      <p className="aliceDim">Выбери другой модуль слева или вернись к списку карточек.</p>
      <button className="btn btn-primary" onClick={() => onSelectChapter(null)}>К списку модулей</button>
    </div>
  );

  if (done) return (
    <div className="fcDone">
      <div className="fcDoneEmoji">🎉</div>
      <h3>Сессия завершена!</h3>
      <p className="aliceDim">{cards.length} карточек по разделу «{chapter.title}»</p>
      <button className="btn btn-primary" onClick={() => { setCardIndex(0); setFlipped(false); setDone(false); }}>Повторить</button>
    </div>
  );

  const card = cards[cardIndex];
  const chPct = cards.length > 0 ? Math.round((cardIndex / cards.length) * 100) : 0;

  return (
    <div className="fcSession">
      <div className="fcSessionMeta">
        <span className="fcSessionChapter">{chapter.icon} {chapter.title}</span>
        <span className="fcSessionCounter">{cardIndex + 1} / {cards.length}</span>
      </div>
      <div className="fcSessionBar"><div style={{ width: `${chPct}%` }} /></div>

      <div className={`fcCard${flipped ? ' flipped' : ''}`} onClick={() => setFlipped((f) => !f)}>
        <div className="fcFront">
          <p className="fcCardText">{card.front}</p>
          <span className="fcHint">Spacebar / нажми чтобы перевернуть</span>
        </div>
        <div className="fcBack">
          <p className="fcCardText">{card.back}</p>
        </div>
      </div>

      {flipped && (
        <div className="fcRating">
          <p className="fcRatingHint">Насколько хорошо ты знал ответ?</p>
          <div className="fcRatingRow">
            {[['again', '✗ Снова', '10 мин', 'var(--rust)'], ['hard', '~ Сложно', '45 мин', 'var(--amber)'], ['good', '✓ Хорошо', '1 день', '#60a5fa'], ['easy', '★ Легко', '4 дня', 'var(--mint)']].map(([key, label, sub, col]) => (
              <button key={key} className="fcRatingBtn" style={{ '--col': col }} onClick={() => rate(key)}>
                <span className="fcRatingLabel">{label}</span>
                <span className="fcRatingInterval">{sub}</span>
              </button>
            ))}
          </div>
        </div>
      )}
      {!flipped && <p className="aliceDim" style={{ textAlign: 'center', marginTop: 16 }}>Нажми на карточку или Spacebar чтобы увидеть ответ</p>}

      <div className="fcProgressBox">
        <div className="fcProgressBoxLabel">Spaced Repetition Progress</div>
        <div className="fcProgressBoxBar"><div style={{ width: `${confAll}%` }} /></div>
        <div className="fcProgressBoxSub">{confAll}% confidence · {reviewedAll}/{totalAll} карточек</div>
      </div>
    </div>
  );
}

/* ── Question Bank ── */
function QuestionBankContent({ chapter }) {
  const questions = chapter
    ? PRACTICE_QUESTIONS.filter((q) => q.chapter === chapter.id)
    : PRACTICE_QUESTIONS;
  const [diffFilter, setDiffFilter] = useState('all');
  const [answered, setAnswered] = useState({});
  const [saved, setSaved] = useState(() => { try { return new Set(JSON.parse(localStorage.getItem('hc_saved_q_v2') || '[]')); } catch { return new Set(); } });
  const [aiExp, setAiExp] = useState({});
  const [aiLoading, setAiLoading] = useState({});

  const filtered = questions.filter((q) => diffFilter === 'all' || q.difficulty === diffFilter);

  function toggleSave(id) {
    setSaved((prev) => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      localStorage.setItem('hc_saved_q_v2', JSON.stringify([...n]));
      return n;
    });
  }

  async function fetchAi(q) {
    if (aiExp[q.id]) return;
    setAiLoading((p) => ({ ...p, [q.id]: true }));
    try {
      const ch = PM_CHAPTERS.find((c) => c.id === q.chapter);
      const data = await api.learnExplain({ topic: ch?.title || q.chapter, subtopic: q.subtopic || '', question: q.q, wrongAnswer: q.options[answered[q.id]] || '', correctAnswer: q.options[q.answer], difficulty: 'normal' });
      setAiExp((p) => ({ ...p, [q.id]: data }));
    } catch {
      setAiExp((p) => ({ ...p, [q.id]: { explanation: 'Ошибка загрузки объяснения.', tip: '' } }));
    } finally {
      setAiLoading((p) => ({ ...p, [q.id]: false }));
    }
  }

  return (
    <div className="qbContent">
      <div className="qbHeader">
        <div className="qbHeaderTitle">
          {chapter ? `${chapter.icon} ${chapter.title}` : 'Все вопросы'}
          <span className="qbCount"> · {filtered.length}</span>
        </div>
        <div className="qbFilters">
          {['all', 'easy', 'medium', 'hard'].map((d) => (
            <button key={d} className={`qbFilterBtn${diffFilter === d ? ' active' : ''}`} onClick={() => setDiffFilter(d)}>
              {d === 'all' ? 'Все' : d === 'easy' ? 'Лёгкие' : d === 'medium' ? 'Средние' : 'Сложные'}
            </button>
          ))}
        </div>
      </div>

      {filtered.map((q) => {
        const ch = PM_CHAPTERS.find((c) => c.id === q.chapter);
        const isAns = answered[q.id] !== undefined;
        const isOk = answered[q.id] === q.answer;
        const ai = aiExp[q.id];

        return (
          <div key={q.id} className={`qbCard${isAns ? (isOk ? ' correct' : ' wrong') : ''}`}>
            <div className="qbCardTop">
              <div className="qbCardMeta">
                <span className="qbChapterTag" style={{ color: ch?.color }}>
                  {ch?.icon} {ch?.title}
                </span>
                <span className={`qbDiffTag qbDiff-${q.difficulty}`}>
                  {q.difficulty === 'easy' ? 'Лёгкий' : q.difficulty === 'medium' ? 'Средний' : 'Сложный'}
                </span>
              </div>
              <div className="qbCardActions">
                {isAns && <span className="qbStatus">{isOk ? '✓' : '✗'}</span>}
                <button className={`qbIconBtn${saved.has(q.id) ? ' saved' : ''}`} onClick={() => toggleSave(q.id)} title="Сохранить">🔖</button>
              </div>
            </div>

            <p className="qbQuestion">{q.q}</p>

            <div className="qbOptions">
              {q.options.map((opt, i) => {
                let cls = 'qbOpt';
                if (isAns) { if (i === q.answer) cls += ' correct'; else if (i === answered[q.id]) cls += ' wrong'; else cls += ' dim'; }
                return (
                  <button key={i} className={cls} onClick={() => !isAns && setAnswered((p) => ({ ...p, [q.id]: i }))} disabled={isAns}>
                    <span className="qbOptLetter">{String.fromCharCode(65 + i)}</span>
                    {opt}
                  </button>
                );
              })}
            </div>
            {isAns && (
              <div className={`qbFeedback${isOk ? ' correct' : ' wrong'}`}>
                <strong>{isOk ? '✓ Правильно!' : `✗ ${q.options[q.answer]}`}</strong>
                <p>{q.explanation}</p>
                {!isOk && !ai && (
                  <button className="qbAiBtn" onClick={() => fetchAi(q)} disabled={aiLoading[q.id]}>
                    {aiLoading[q.id] ? 'Загружаю…' : '🤖 Объяснить подробнее'}
                  </button>
                )}
                {ai && (
                  <div className="qbAiBlock">
                    <div className="qbAiBlockLabel">🤖 AI-объяснение</div>
                    <p>{ai.explanation}</p>
                    {ai.tip && <div className="qbAiTip">💡 {ai.tip}</div>}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ── Key Definitions ── */
function DefinitionsContent() {
  const [search, setSearch] = useState('');
  const [cat, setCat] = useState('all');
  const cats = ['all', ...new Set(KEY_DEFINITIONS.map((d) => d.category))];
  const filtered = KEY_DEFINITIONS
    .filter((d) => (cat === 'all' || d.category === cat) && (!search || d.term.toLowerCase().includes(search.toLowerCase()) || d.definition.toLowerCase().includes(search.toLowerCase())))
    .sort((a, b) => a.term.localeCompare(b.term));

  return (
    <div className="defsContent">
      <div className="defsHeader">
        <input className="defsSearch" placeholder="Поиск термина…" value={search} onChange={(e) => setSearch(e.target.value)} />
        <select className="defsSelect" value={cat} onChange={(e) => setCat(e.target.value)}>
          {cats.map((c) => <option key={c} value={c}>{c === 'all' ? 'Все категории' : c}</option>)}
        </select>
      </div>
      <div className="defsList">
        {filtered.map((def) => {
          const ch = PM_CHAPTERS.find((c) => c.id === def.chapter);
          return (
            <div key={def.term} className="defCard">
              <div className="defCardTop">
                <strong className="defTerm">{def.term}</strong>
                <span className="defCat">{def.category}</span>
              </div>
              <p className="defText">{def.definition}</p>
              {ch && <div className="defChapter" style={{ color: ch.color }}>{ch.icon} {ch.title}</div>}
            </div>
          );
        })}
        {filtered.length === 0 && <p className="aliceDim">Ничего не найдено для «{search}»</p>}
      </div>
    </div>
  );
}

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error) {
    return { error };
  }
  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: 40, fontFamily: 'monospace', color: '#f4f1ea', background: '#0b0d0c', minHeight: '100vh' }}>
          <h2 style={{ color: '#ff6b6b' }}>Ошибка рендера</h2>
          <pre style={{ color: '#ffb86b', whiteSpace: 'pre-wrap', fontSize: 13 }}>{String(this.state.error)}</pre>
          <button onClick={() => this.setState({ error: null })} style={{ marginTop: 24, padding: '10px 20px', background: '#b8ff5c', color: '#0b0d0c', border: 'none', borderRadius: 6, cursor: 'pointer' }}>
            Перезагрузить
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById('root')).render(<ErrorBoundary><App /></ErrorBoundary>);
