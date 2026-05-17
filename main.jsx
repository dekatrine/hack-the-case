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
      group: 'Practice',
      items: [
        {
          title: 'Questionbank',
          subtitle: 'Practice questions with AI feedback',
          meta: `${stats.questions} questions`,
          tone: 'blue',
          icon: '?',
          onClick: () => onOpenTab('Questionbank'),
        },
        {
          title: 'Exam builder',
          subtitle: 'Build your own mock case exam',
          meta: 'AI-generated case',
          tone: 'gray',
          icon: '↗',
          onClick: onOpenExam,
        },
      ],
    },
    {
      group: 'Learn',
      items: [
        {
          title: 'Notes',
          subtitle: 'Study guides with frameworks and examples',
          meta: `${stats.chapters} chapters`,
          tone: 'yellow',
          icon: '≡',
          onClick: () => onOpenTab('Notes'),
        },
        {
          title: 'Teach Jojo',
          subtitle: 'Practice teaching by topic and track what you covered',
          meta: 'AI review session',
          tone: 'purple',
          icon: 'AI',
          badge: 'New',
          onClick: onOpenReview,
        },
        {
          title: 'Lessons',
          subtitle: 'Step-by-step lessons and quizzes',
          meta: `${stats.chapters} lessons`,
          tone: 'orange',
          icon: '▤',
          onClick: () => onOpenTab('Lessons'),
        },
        {
          title: 'Flashcards',
          subtitle: 'Remember concepts with active recall',
          meta: `${stats.cards} flashcard decks`,
          tone: 'cyan',
          icon: '▰',
          onClick: () => onOpenTab('Flashcards'),
        },
        {
          title: 'Key Definitions',
          subtitle: 'Essential terms and concepts explained',
          meta: `${stats.definitions} definitions`,
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
      <span>Course contents</span>
      <h2>Содержание курса</h2>
      <p>Меню сверху даёт быстрый вход в формат занятия, а ниже — карта курса. Выбери модуль, чтобы открыть его в Lessons.</p>
    </div>
    <div className="caseCourseRows">
      {PM_CHAPTERS.map((chapter) => (
        <button key={chapter.id} className="caseCourseRow" onClick={() => { onSelectChapter(chapter); onOpenTab('Lessons'); }} style={{ '--col': chapter.color }}>
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
    <div className="dojoHome fade-in">
      <section className="dojoHero">
        <div>
          <div className="eyebrow"><span className="num">01 /</span> AI case club resources</div>
          <h1 className="dojoHeroTitle">Case prep resources</h1>
          <p className="dojoHeroSub">
            Учебный кабинет в стиле RevisionDojo, но в визуальном языке Hack the Case:
            notes, lessons, questionbank, flashcards, definitions и AI review собраны рядом.
          </p>
        </div>
        <div className="dojoHeroPanel">
          <span>Resource stack</span>
          <strong>{stats.chapters} модулей</strong>
          <p>{stats.questions} вопросов · {stats.cards} карточек · {stats.definitions} терминов</p>
          <button className="btn btn-primary" onClick={() => onOpenLearn('All Resources')}>
            Открыть ресурсы <span className="arrow">→</span>
          </button>
        </div>
      </section>

      <section className="dojoGrid">
        <article className="dojoPrimaryCard">
          <div className="dojoCardHead">
            <span>Start here</span>
            <button onClick={() => onOpenLearn('Notes')}>Open notes →</button>
          </div>
          <h2>Сначала конспект, потом практика</h2>
          <p>Открой `Case prep resources`: там будет меню Practice/Learn и сразу содержание курса. Это больше не отдельная белая страница.</p>
          <button className="btn btn-primary" onClick={() => onOpenLearn('All Resources')}>Перейти к ресурсам</button>
        </article>
        <div className="dojoSideStack">
          <button className="dojoActionCard" onClick={() => onOpenLearn('Questionbank')}>
            <span>Questionbank</span>
            <strong>{stats.questions} вопросов</strong>
            <small>Проверка и AI-разбор после ошибки.</small>
          </button>
          <button className="dojoActionCard" onClick={() => businessTrack && onPickTrack(businessTrack)}>
            <span>Exam builder</span>
            <strong>Полный кейс</strong>
            <small>Сгенерировать условие и защитить решение.</small>
          </button>
          <button className="dojoActionCard" onClick={onOpenInterview}>
            <span>Mock interview</span>
            <strong>Раунды интервью</strong>
            <small>Уточнение, exhibit, pushback, финальный синтез.</small>
          </button>
          <button className="dojoActionCard" onClick={onOpenQuiz}>
            <span>Sprints</span>
            <strong>{getQuizQuestionCount()} быстрых вопросов</strong>
            <small>Короткие тренировки с XP и streak.</small>
          </button>
        </div>
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
   LEARNING SCREEN — RevisionDojo layout + Alice.tech explanations
   ═══════════════════════════════════════════════════════════════════════ */

const LEARN_TABS = ['All Resources', 'Lessons', 'Notes', 'Questionbank', 'Flashcards', 'Key Definitions'];

const LearningScreen = ({ onBack, initialTab = 'All Resources', autoOpenReview = false, onOpenExam }) => {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [selectedChapter, setSelectedChapter] = useState(null);
  const [reviewOpen, setReviewOpen] = useState(false);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  useEffect(() => {
    if (autoOpenReview) setReviewOpen(true);
  }, [autoOpenReview]);

  return (
    <div className="learnScreen fade-in">
      <div className="learnScreenHeader">
        <button className="btn btn-ghost" onClick={onBack}>← Главная</button>
        <div>
          <div className="eyebrow"><span className="num">02 /</span> Resource dojo</div>
          <h1 className="learnScreenTitle">Case prep <em>resources</em></h1>
          <p className="learnScreenSub">{PM_CHAPTERS.length} lessons · {Object.values(FLASHCARDS).reduce((s, a) => s + a.length, 0)} flashcards · {PRACTICE_QUESTIONS.length} questionbank items · {KEY_DEFINITIONS.length} definitions</p>
        </div>
        <button className="btn btn-primary" onClick={() => setReviewOpen(true)}>
          AI Review Session <span className="arrow">→</span>
        </button>
      </div>

      <div className="learnTabBar">
        {LEARN_TABS.map((t) => (
          <button key={t} className={`learnTab${activeTab === t ? ' active' : ''}`} onClick={() => { setActiveTab(t); setSelectedChapter(null); }}>{t}</button>
        ))}
      </div>

      <div className="learnLayout">
        <LearnSidebar
          activeTab={activeTab}
          selectedChapter={selectedChapter}
          onSelect={setSelectedChapter}
        />
        <div className="learnMain">
          {activeTab === 'All Resources' && <ResourcesOverview onSelectChapter={setSelectedChapter} onOpenTab={setActiveTab} onOpenReview={() => setReviewOpen(true)} onOpenExam={onOpenExam} />}
          {activeTab === 'Lessons' && <LessonsContent chapter={selectedChapter} onSelectChapter={setSelectedChapter} />}
          {activeTab === 'Notes' && <NotesContent chapter={selectedChapter} onSelectChapter={setSelectedChapter} />}
          {activeTab === 'Questionbank' && <QuestionBankContent chapter={selectedChapter} />}
          {activeTab === 'Flashcards' && <FlashCardsContent chapter={selectedChapter} />}
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
          <span className="resourcesKicker">All Resources</span>
          <h2>Case prep resources</h2>
          <p>Меню Practice/Learn как в RevisionDojo, но без смены визуального языка: тёмный workspace, плотная навигация и фокус на подготовке к кейсам.</p>
        </div>
        <button className="btn btn-primary" onClick={onOpenReview}>Start AI Review</button>
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

/* ── Sidebar — RevisionDojo style chapter tree ── */
function LearnSidebar({ activeTab, selectedChapter, onSelect }) {
  const fcProgress = loadFcProgress();
  return (
    <aside className="learnSidebar">
      <div className="learnSidebarTitle">Разделы курса</div>
      {PM_CHAPTERS.map((ch) => {
        const cards = FLASHCARDS[ch.id] || [];
        const reviewed = cards.filter((c) => fcProgress[c.id]).length;
        const pct = cards.length > 0 ? Math.round((reviewed / cards.length) * 100) : 0;
        const isSelected = selectedChapter?.id === ch.id;
        return (
          <button
            key={ch.id}
            className={`learnSidebarItem${isSelected ? ' active' : ''}`}
            onClick={() => onSelect(ch)}
          >
            <div className="learnSidebarProgress" style={{ '--pct': pct + '%', '--col': ch.color }}>
              <span>{ch.icon}</span>
            </div>
            <div className="learnSidebarText">
              <div className="learnSidebarName">{ch.number}. {ch.title}</div>
              <div className="learnSidebarMeta">{ch.subtopics.length} подтем · {pct}%</div>
            </div>
          </button>
        );
      })}
    </aside>
  );
}

/* ── Lessons — Alice.tech style adaptive explanations ── */
function LessonsContent({ chapter, onSelectChapter }) {
  const [subtopic, setSubtopic] = useState(null);
  const [sessionStep, setSessionStep] = useState('intro'); // intro | expo | mcq | done
  const [mcqAnswered, setMcqAnswered] = useState(null);
  const [health, setHealth] = useState(3);
  const [xp, setXp] = useState(0);
  const [aiExpo, setAiExpo] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const contentRef = useRef(null);

  useEffect(() => {
    setSubtopic(null);
    setSessionStep('intro');
    setMcqAnswered(null);
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

  if (!chapter) {
    return (
      <div className="learnPlaceholder">
        <div className="learnPlaceholderIcon">📖</div>
        <p>Выбери раздел из списка слева чтобы начать изучение</p>
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
              <p className="aliceExpoText">Эта подтема входит в раздел «{chapter.title}». Изучи ключевые концепции раздела выше, затем проверь себя с помощью Flash Cards и Банка вопросов.</p>
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
              onDone={(ok) => { if (ok) setXp((x) => x + 5); else setHealth((h) => Math.max(0, h - 1)); setSessionStep('done'); }}
            />
          )}
          {mcqAnswered === content.mcq.correct && (
            <button className="aliceBtn aliceBtnContinue" style={{ marginTop: 16 }} onClick={() => setSessionStep('done')}>Завершить тему →</button>
          )}
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
  title: 'Product Thinking Notes',
  eyebrow: 'PM foundations',
  subtitle: 'Как думать проблемами, пользователями и бизнес-результатом, а не списком фич.',
  introTitle: 'What is product thinking?',
  definitionTitle: 'Product thinking',
  definition:
    'Product thinking is the habit of connecting user problems, business outcomes, constraints and evidence before choosing a solution.',
  bullets: [
    'A product is not a feature list. It is a system for creating user value and business value at the same time.',
    'Start from the user job, context and pain, then translate it into a measurable product outcome.',
    'Good PM answers move through problem -> evidence -> options -> trade-offs -> metric -> next test.',
    'Discovery and delivery are not separate worlds: discovery reduces uncertainty, delivery turns the validated bet into product.',
    'A strong case answer makes assumptions explicit and names what evidence would change the recommendation.',
  ],
  sections: [
    {
      title: 'Problem Space Before Solution Space',
      bullets: [
        'Problem space describes who struggles, in what situation, what progress they want and why the current workaround fails.',
        'Solution space is the set of possible product changes: feature, workflow, pricing, policy, content, operation or AI intervention.',
        'Jumping straight to solution space creates feature theater: lots of output, weak evidence, unclear impact.',
        'A useful interview answer keeps asking: what user segment, what behavior, what friction, what metric?',
      ],
    },
    {
      title: 'Jobs To Be Done',
      bullets: [
        'JTBD says users "hire" products to make progress in a specific circumstance.',
        'The job is not a demographic segment. It is the situation, motivation, desired progress and constraints around a behavior.',
        'For case interviews, JTBD helps avoid generic personas and focus on why a user would switch from the status quo.',
        'Good JTBD statement: When [situation], user wants to [progress], but [barrier], so success means [observable outcome].',
      ],
    },
    {
      title: 'Opportunity Solution Tree',
      bullets: [
        'Start with an outcome, map opportunities from research, then connect candidate solutions and experiments.',
        'This keeps roadmap ideas tied to evidence instead of stakeholder preference.',
        'Use it in cases when you need to prioritize: choose opportunities by severity, frequency, reach and strategic fit.',
      ],
    },
    {
      title: 'Metrics and Validation',
      bullets: [
        'Pick one primary success metric, then add guardrails so the team cannot win by damaging trust, margin or retention.',
        'Validation is not only A/B testing. It can be interview evidence, concierge MVP, fake door, prototype test, cohort read or manual pilot.',
        'The strongest answers say what would prove the idea wrong.',
      ],
    },
  ],
  callouts: [
    {
      type: 'analogy',
      title: 'Analogy',
      text: 'A PM is not a waiter taking feature orders. A PM is closer to a diagnostician: understand symptoms, locate the cause, test treatment, then measure recovery.',
    },
    {
      type: 'note',
      title: 'Interview move',
      text: 'When the prompt asks for a feature, first reframe it: "I will start by clarifying the target user and success metric, because the right feature depends on the problem we are solving."',
    },
    {
      type: 'mistake',
      title: 'Common mistake',
      items: [
        'Listing five features without choosing a user segment.',
        'Using "improve UX" as a cause instead of naming the exact friction.',
        'Optimizing one metric without guardrails.',
        'Calling every validation method an A/B test.',
      ],
    },
  ],
};

const getNotesArticle = (chapter) => {
  if (!chapter || chapter.id === 'ch1') return PRODUCT_THINKING_NOTE;
  return {
    title: `${chapter.title} Notes`,
    eyebrow: `Module ${chapter.number}`,
    subtitle: chapter.description,
    introTitle: chapter.title,
    definitionTitle: chapter.notes?.[0]?.title || chapter.title,
    definition: chapter.notes?.[0]?.text || chapter.description,
    bullets: [
      chapter.description,
      'Use this module as a case-interview lens: state the objective, name the user or business driver, then connect evidence to a decision.',
      'A strong answer separates facts, assumptions and recommendations.',
      'Before moving to solutions, write the metric that would prove the analysis worked.',
    ],
    sections: [
      {
        title: 'How to use this in a case',
        bullets: [
          'Restate the problem in one sentence.',
          'Choose the most relevant framework, not every framework you know.',
          'Name the first data cut you would ask for.',
          'End with a decision criterion and next step.',
        ],
      },
    ],
    callouts: (chapter.notes || []).slice(1, 4).map((note) => ({
      type: note.type === 'example' ? 'example' : note.type === 'analogy' ? 'analogy' : 'note',
      title: note.title,
      text: note.text,
    })),
  };
};

function NoteCallout({ callout }) {
  return (
    <div className={`noteArticleCallout ${callout.type}`}>
      <div className="noteArticleCalloutLabel">{callout.title}</div>
      {callout.items ? (
        <ul>
          {callout.items.map((item) => <li key={item}>{item}</li>)}
        </ul>
      ) : (
        <p>{callout.text}</p>
      )}
    </div>
  );
}

function NotesContent({ chapter, onSelectChapter }) {
  const activeChapter = chapter || PM_CHAPTERS.find((item) => item.id === 'ch1') || PM_CHAPTERS[0];
  const article = getNotesArticle(activeChapter);

  return (
    <div className="noteArticle">
      <div className="noteArticleHero" style={{ '--ch-color': activeChapter.color }}>
        <div>
          <div className="noteArticleCrumbs">
            <span>Case prep resources</span>
            <b>›</b>
            <span>Notes</span>
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
          <span>Definition</span>
          <strong>{article.definitionTitle}</strong>
          <p>{article.definition}</p>
        </div>

        <ol className="noteArticleList">
          {article.bullets.map((item) => <li key={item}>{item}</li>)}
        </ol>

        {article.sections.map((section) => (
          <section key={section.title} className="noteArticleSection">
            <h3>{section.title}</h3>
            <ol className="noteArticleList">
              {section.bullets.map((item) => <li key={item}>{item}</li>)}
            </ol>
          </section>
        ))}

        <div className="noteArticleDiagram">
          <span>Case answer flow</span>
          <div>
            {['User', 'Problem', 'Evidence', 'Options', 'Trade-off', 'Metric', 'Next test'].map((item) => (
              <strong key={item}>{item}</strong>
            ))}
          </div>
        </div>

        {article.callouts.map((callout) => <NoteCallout key={callout.title} callout={callout} />)}

        <section className="noteArticlePractice">
          <h3>How to practice this note</h3>
          <p>Take any product prompt and write a 90-second answer using the flow above. Then open Questionbank and check whether your answer names user, problem, evidence, trade-off and metric.</p>
          <div>
            <button className="btn btn-primary" onClick={() => onSelectChapter(activeChapter)}>Оставить эту тему</button>
          </div>
        </section>
      </article>

      <aside className="noteArticleTopicRail">
        <span>Other notes</span>
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
  const [helper, setHelper] = useState('');
  const [loading, setLoading] = useState(false);

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

  async function askForHelp() {
    setLoading(true);
    try {
      const topic = selectedTopics[0] || availableTopics[0];
      const data = await api.learnSession({
        chapterId: topic?.id || '',
        subtopicId: topic?.subtopics?.[0]?.id || '',
        userLevel: level === 'clueless' ? 'beginner' : level === 'pretty_familiar' ? 'advanced' : 'normal',
      });
      setHelper(data.exposition);
    } catch {
      setHelper('Подсказка сейчас недоступна. Начни с формулы: цель → структура → данные → вывод → риск.');
    } finally {
      setLoading(false);
    }
  }

  const sessionPrompt = selectedTopics.length
    ? `Разбери ${selectedTopics.map((topic) => topic.title).join(', ')} через простой кейсовый пример.`
    : 'Выбери 1-3 темы для персональной review-сессии.';

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
                <button className="btn btn-primary" onClick={() => setStarted(true)} disabled={topics.length === 0}>Start Review Session</button>
              )}
            </div>
          </>
        ) : (
          <div className="reviewSession">
            <div className="reviewSessionHead">
              <button onClick={() => setStarted(false)}>← Back</button>
              <span>Progress 1/3 · {length === 'quick' ? 'Quick Review' : 'In-Depth'}</span>
              <button onClick={onClose}>End Session</button>
            </div>
            <div className="reviewChat">
              <div className="reviewBubble ai">
                <strong>Case Dojo AI</strong>
                <p>{sessionPrompt}</p>
              </div>
              <div className="reviewBubble user">
                <p>Начни с простого примера и проверь, где я путаюсь.</p>
              </div>
              {helper && (
                <div className="reviewBubble ai">
                  <strong>Hint</strong>
                  <p>{helper}</p>
                </div>
              )}
            </div>
            <div className="reviewInputRow">
              <button onClick={askForHelp} disabled={loading}>{loading ? 'Thinking…' : 'Give me a hint'}</button>
              <input readOnly value="Ask AI mentor for help..." />
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

function FlashCardsContent({ chapter }) {
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
    const fn = (e) => { if (e.code === 'Space' && chapter) { e.preventDefault(); setFlipped((f) => !f); } };
    window.addEventListener('keydown', fn);
    return () => window.removeEventListener('keydown', fn);
  }, [chapter]);

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
              <div key={ch.id} className="fcChapterTile" style={{ '--col': ch.color }}>
                <span className="fcChapterTileIcon">{ch.icon}</span>
                <div className="fcChapterTileName">{ch.number}. {ch.title}</div>
                <div className="fcChapterTileBar"><div style={{ width: `${chPct}%` }} /></div>
                <div className="fcChapterTilePct">{chPct}% · {chs.length} карточек</div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

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
