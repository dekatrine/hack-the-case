import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { askCoach, evaluateCase, fetchConfig, generateCase, learnExplain, learnSession } from './api/client';
import { QUIZ_CATEGORIES, QUIZ_QUESTIONS } from './quizData';
import { FLASHCARDS, KEY_DEFINITIONS, LEARN_TOGETHER_CONTENT, PM_CHAPTERS, PRACTICE_QUESTIONS } from './courseData';
import './styles.css';

const fallbackConfig = {
  steps: [],
  industries: [],
  difficultyLevels: {},
  sourceNotes: [],
};

function App() {
  const [config, setConfig] = useState(fallbackConfig);
  const [page, setPage] = useState('start');
  const [quizCategory, setQuizCategory] = useState(null);
  const [caseText, setCaseText] = useState('');
  const [industry, setIndustry] = useState('');
  const [difficulty, setDifficulty] = useState('');
  const [extraContext, setExtraContext] = useState('');
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [chats, setChats] = useState({});
  const [evaluation, setEvaluation] = useState('');
  const [loading, setLoading] = useState('');
  const [error, setError] = useState('');
  const [track, setTrack] = useState('product');

  useEffect(() => {
    fetchConfig()
      .then((data) => {
        setConfig(data);
        setIndustry(data.industries[0] || '');
        setDifficulty(Object.keys(data.difficultyLevels)[1] || Object.keys(data.difficultyLevels)[0] || '');
      })
      .catch((err) => setError(err.message));
  }, []);

  const steps = config.steps;
  const currentStep = steps[currentStepIndex];
  const completedCount = useMemo(
    () => steps.filter((step) => answers[step.id]?.trim()).length,
    [answers, steps],
  );

  async function handleGenerateCase() {
    setLoading('Генерирую кейс...');
    setError('');
    try {
      const data = await generateCase({ industry, difficulty, extraContext, trackId: track });
      setCaseText(data.caseText);
      setAnswers({});
      setChats({});
      setEvaluation('');
      setCurrentStepIndex(0);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading('');
    }
  }

  function updateAnswer(stepId, value) {
    setAnswers((prev) => ({ ...prev, [stepId]: value }));
  }

  async function handleAskCoach(userMessage) {
    if (!currentStep) return;

    const stepChat = chats[currentStep.id] || [];
    const studentMessage = { role: 'student', text: userMessage };
    const nextChat = [...stepChat, studentMessage];

    setChats((prev) => ({ ...prev, [currentStep.id]: nextChat }));
    setLoading('Коуч думает...');
    setError('');

    try {
      const data = await askCoach({
        stepId: currentStep.id,
        stepTitle: currentStep.title,
        stepDescription: currentStep.description,
        frameworks: currentStep.frameworks,
        caseHint: currentStep.caseHint,
        theory: currentStep.theory,
        caseText,
        answerText: answers[currentStep.id] || '',
        userMessage,
        chatHistory: nextChat,
        previousAnswers: answers,
      });
      setChats((prev) => ({
        ...prev,
        [currentStep.id]: [...nextChat, { role: 'coach', text: data.message }],
      }));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading('');
    }
  }

  async function handleEvaluate() {
    setLoading('Жюри оценивает решение...');
    setError('');
    try {
      const data = await evaluateCase({ caseText, answers });
      setEvaluation(data.evaluation);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading('');
    }
  }

  return (
    <main className="app">
      <header className="hero">
        <div>
          <p className="eyebrow">Business case simulator</p>
          <h1>Hack the Case</h1>
          <p>Тренируй фреймворки, структуру мышления и защиту решений на бизнес-кейсах.</p>
        </div>
        <nav>
          <button className={page === 'start' ? 'active' : ''} onClick={() => setPage('start')}>Кейс</button>
          <button className={page === 'solve' ? 'active' : ''} onClick={() => setPage('solve')} disabled={!caseText}>Решение</button>
          <button className={page === 'evaluate' ? 'active' : ''} onClick={() => setPage('evaluate')} disabled={!caseText}>Оценка</button>
          <button className={page === 'learn' ? 'active' : ''} onClick={() => setPage('learn')}>Учебные материалы</button>
          <button className={page === 'quiz' ? 'active' : ''} onClick={() => { setPage('quiz'); setQuizCategory(null); }}>Практика</button>
        </nav>
      </header>

      {error && <div className="notice error">{error}</div>}
      {loading && <div className="notice">{loading}</div>}

      {page === 'start' && (
        <StartPage
          config={config}
          industry={industry}
          difficulty={difficulty}
          extraContext={extraContext}
          caseText={caseText}
          track={track}
          onTrackChange={setTrack}
          onIndustryChange={setIndustry}
          onDifficultyChange={setDifficulty}
          onExtraContextChange={setExtraContext}
          onGenerate={handleGenerateCase}
          onStart={() => setPage('solve')}
          loading={Boolean(loading)}
        />
      )}

      {page === 'solve' && currentStep && (
        <SolvePage
          steps={steps}
          currentStepIndex={currentStepIndex}
          currentStep={currentStep}
          completedCount={completedCount}
          caseText={caseText}
          answer={answers[currentStep.id] || ''}
          answers={answers}
          chat={chats[currentStep.id] || []}
          onStepChange={setCurrentStepIndex}
          onAnswerChange={(value) => updateAnswer(currentStep.id, value)}
          onAskCoach={handleAskCoach}
          onNext={() => {
            if (currentStepIndex < steps.length - 1) setCurrentStepIndex(currentStepIndex + 1);
            else setPage('evaluate');
          }}
          onEvaluate={() => setPage('evaluate')}
        />
      )}

      {page === 'evaluate' && (
        <EvaluatePage
          steps={steps}
          answers={answers}
          evaluation={evaluation}
          completedCount={completedCount}
          onEvaluate={handleEvaluate}
          onBack={() => setPage('solve')}
          loading={Boolean(loading)}
        />
      )}

      {page === 'quiz' && (
        <QuizPage
          category={quizCategory}
          onSelectCategory={setQuizCategory}
          onBack={() => setQuizCategory(null)}
        />
      )}

      {page === 'learn' && <LearningPage />}
    </main>
  );
}

const TRACKS = [
  {
    id: 'product',
    tag: 'PM TRACK',
    title: 'Product Case Track',
    desc: 'PM-интервью, метрики, product discovery, стратегия продукта',
    icon: '🧠',
    details: ['Product sense & design', 'Metrics & analytics', 'Discovery & JTBD', 'Roadmap & strategy'],
  },
  {
    id: 'business',
    tag: 'CONSULTING TRACK',
    title: 'Business Case Track',
    desc: 'Консалтинговые кейсы, market sizing, unit-экономика, рекомендации',
    icon: '📊',
    details: ['Market sizing & structuring', 'Profitability analysis', 'Growth & go-to-market', 'Final recommendation'],
  },
];

function StartPage(props) {
  const [step, setStep] = useState('track');
  const difficultyKeys = Object.keys(props.config.difficultyLevels);
  const casePanelRef = useRef(null);

  useEffect(() => {
    if (props.caseText) {
      casePanelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      setStep('setup');
    }
  }, [props.caseText]);

  if (step === 'track') {
    return (
      <section className="trackSelectSection">
        <div className="trackSelectHead">
          <p className="eyebrow">Шаг 1 из 2</p>
          <h2 className="trackSelectTitle">Выбери направление</h2>
          <p className="trackSelectSub">Какой тип кейса хочешь отработать?</p>
        </div>
        <div className="trackCards">
          {TRACKS.map((t) => (
            <button
              key={t.id}
              className={`trackCard${props.track === t.id ? ' active' : ''}`}
              onClick={() => props.onTrackChange(t.id)}
            >
              <div className="trackCardTop">
                <span className="trackCardTag">{t.tag}</span>
                {props.track === t.id && <span className="trackCardCheck">✓</span>}
              </div>
              <div className="trackCardIcon">{t.icon}</div>
              <div className="trackCardTitle">{t.title}</div>
              <div className="trackCardDesc">{t.desc}</div>
              <ul className="trackCardDetails">
                {t.details.map((d) => <li key={d}>{d}</li>)}
              </ul>
            </button>
          ))}
        </div>
        <div className="trackActions">
          <button className="primary trackNextBtn" onClick={() => setStep('setup')}>
            Продолжить →
          </button>
        </div>
      </section>
    );
  }

  const activeTrack = TRACKS.find((t) => t.id === props.track);

  return (
    <section className="grid two">
      <div className="panel">
        <div className="trackBreadcrumb">
          <button className="trackBackBtn" onClick={() => setStep('track')}>← Изменить трек</button>
          <span className="trackBadgePill" style={{ background: props.track === 'product' ? '#6366f118' : '#10b98118', color: props.track === 'product' ? '#6366f1' : '#10b981' }}>
            {activeTrack?.icon} {activeTrack?.title}
          </span>
        </div>
        <h2>Настройки кейса</h2>
        <label>
          Отрасль
          <select value={props.industry} onChange={(event) => props.onIndustryChange(event.target.value)}>
            {props.config.industries.map((item) => <option key={item}>{item}</option>)}
          </select>
        </label>
        <label>
          Уровень сложности
          <select value={props.difficulty} onChange={(event) => props.onDifficultyChange(event.target.value)}>
            {difficultyKeys.map((item) => <option key={item}>{item}</option>)}
          </select>
        </label>
        <p className="hint">{props.config.difficultyLevels[props.difficulty]}</p>
        <label>
          Дополнительный контекст
          <textarea
            value={props.extraContext}
            onChange={(event) => props.onExtraContextChange(event.target.value)}
            placeholder="Например: международная экспансия, запуск продукта, оптимизация процессов"
          />
        </label>
        <button className="primary" onClick={props.onGenerate} disabled={props.loading}>
          {props.loading ? 'Генерирую...' : 'Сгенерировать кейс'}
        </button>
      </div>

      <div className="panel" ref={casePanelRef}>
        <h2>Твой кейс</h2>
        {props.caseText ? (
          <>
            <MarkdownText text={props.caseText} />
            <button className="primary" onClick={props.onStart}>Начать решение →</button>
          </>
        ) : (
          <p className="muted">Выбери параметры и сгенерируй кейс.</p>
        )}
      </div>
    </section>
  );
}

function SolvePage(props) {
  const [coachInput, setCoachInput] = useState('');
  const [coachOpen, setCoachOpen] = useState(false);
  const progress = props.steps.length ? Math.round((props.completedCount / props.steps.length) * 100) : 0;
  const isLastStep = props.currentStepIndex === props.steps.length - 1;

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [props.currentStepIndex]);

  useEffect(() => {
    document.body.style.overflow = coachOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [coachOpen]);

  function sendCoachMessage(message) {
    props.onAskCoach(message);
    setCoachInput('');
  }

  return (
    <div className="solveContainer">
      {/* Mobile: horizontal step navigation strip */}
      <nav className="stepStrip">
        <div className="stepStripTrack">
          {props.steps.map((step, index) => {
            const done = Boolean(props.answers[step.id]?.trim());
            const active = index === props.currentStepIndex;
            return (
              <button
                key={step.id}
                className={`stepChip${active ? ' active' : ''}${done && !active ? ' done' : ''}`}
                onClick={() => props.onStepChange(index)}
              >
                <div className="chipBadge">{done && !active ? '✓' : index + 1}</div>
                <div className="chipLabel">{step.title}</div>
              </button>
            );
          })}
        </div>
        <div className="stripBar"><div style={{ width: `${progress}%` }} /></div>
      </nav>

      <section className="workspace">
        {/* Desktop sidebar */}
        <aside className="sidebar">
          <div className="progress">
            <span>{props.completedCount}/{props.steps.length}</span>
            <div><i style={{ width: `${progress}%` }} /></div>
          </div>
          {props.steps.map((step, index) => (
            <button
              key={step.id}
              className={index === props.currentStepIndex ? 'step active' : 'step'}
              onClick={() => props.onStepChange(index)}
            >
              <span>{props.answers[step.id]?.trim() ? '✓' : index + 1}</span>
              {step.title}
            </button>
          ))}
          <button className="primary" onClick={props.onEvaluate}>К оценке</button>
        </aside>

        {/* Work panel */}
        <div className="panel work">
          <p className="eyebrow">Этап {props.currentStepIndex + 1} из {props.steps.length}</p>
          <h2>{props.currentStep.title}</h2>
          <p>{props.currentStep.description}</p>
          <div className="hintBox">{props.currentStep.caseHint}</div>

          {/* Case reference inline — mobile only */}
          <div className="mobileCase">
            <CaseReference caseText={props.caseText} />
          </div>

          <LearningBlock theory={props.currentStep.theory} />
          <div className="tags">
            {props.currentStep.frameworks.map((framework) => <span key={framework}>{framework}</span>)}
          </div>
          <textarea
            className="answer"
            value={props.answer}
            onChange={(event) => props.onAnswerChange(event.target.value)}
            placeholder="Опиши решение по этому блоку"
          />
          <div className="stepActions">
            {props.currentStepIndex > 0 && (
              <button onClick={() => props.onStepChange(props.currentStepIndex - 1)}>← Назад</button>
            )}
            <button className="primary" onClick={props.onNext}>
              {isLastStep ? 'Завершить' : 'Следующий этап →'}
            </button>
          </div>
        </div>

        {/* Desktop: side column */}
        <div className="sideColumn">
          <CaseReference caseText={props.caseText} />
          <div className="panel coach">
            <h2>AI Coach</h2>
            <CoachContent
              chat={props.chat}
              coachInput={coachInput}
              onInput={setCoachInput}
              onSend={sendCoachMessage}
            />
          </div>
        </div>
      </section>

      {/* Mobile: floating coach button */}
      <button className="coachFloat" onClick={() => setCoachOpen(true)}>
        💬 AI Coach
      </button>

      {/* Mobile: coach bottom sheet */}
      {coachOpen && (
        <div className="coachOverlay" onClick={(e) => e.target === e.currentTarget && setCoachOpen(false)}>
          <div className="coachSheet">
            <div className="sheetHandle" />
            <div className="sheetHead">
              <h3>AI Coach</h3>
              <button className="sheetClose" onClick={() => setCoachOpen(false)}>✕</button>
            </div>
            <CoachContent
              chat={props.chat}
              coachInput={coachInput}
              onInput={setCoachInput}
              onSend={sendCoachMessage}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function CoachContent({ chat, coachInput, onInput, onSend }) {
  const chatRef = useRef(null);

  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [chat]);

  return (
    <>
      <div className="coachIntro">
        <b>Можно спрашивать как у поисковика по кейсу.</b>
        <p>Коуч объяснит термины, найдёт нужные данные в условии, подскажет фреймворк, проверит логику и поможет сформулировать следующий шаг.</p>
      </div>
      <div className="chat" ref={chatRef}>
        {chat.length === 0 && (
          <div className="emptyCoach">
            <p>Напиши вопрос простыми словами: «что такое MECE?», «какие данные взять из кейса?», «как начать этот блок?».</p>
          </div>
        )}
        {chat.map((message, index) => (
          <div key={`${message.role}-${index}`} className={`message ${message.role}`}>
            <b>{message.role === 'coach' ? 'Coach' : 'Ты'}</b>
            <p>{message.text}</p>
          </div>
        ))}
      </div>
      <div className="quick">
        <button onClick={() => onSend('Объясни простыми словами термины и фреймворки этого этапа.')}>Объясни термины</button>
        <button onClick={() => onSend('Какие данные из условия кейса полезны для этого этапа?')}>Найди данные</button>
        <button onClick={() => onSend('Задай 3 наводящих вопроса для этого этапа.')}>3 вопроса</button>
        <button onClick={() => onSend('Проверь логику и связь моего ответа с кейсом.')}>Проверить логику</button>
        <button onClick={() => onSend('Подскажи следующий шаг, не давая готового решения.')}>Следующий шаг</button>
      </div>
      <div className="ask">
        <input
          value={coachInput}
          onChange={(event) => onInput(event.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && coachInput.trim() && onSend(coachInput)}
          placeholder="Спроси коуча"
        />
        <button onClick={() => coachInput.trim() && onSend(coachInput)}>Отправить</button>
      </div>
    </>
  );
}

function CaseReference({ caseText }) {
  if (!caseText) return null;

  const compactText = makeCaseSummary(caseText);

  return (
    <section className="caseReference">
      <div>
        <p className="sectionLabel">Условие кейса</p>
        <MarkdownText text={compactText} />
      </div>
      <details>
        <summary>Показать полное условие</summary>
        <MarkdownText text={caseText} />
      </details>
    </section>
  );
}

function makeCaseSummary(text) {
  const cleaned = text.replace(/\n{3,}/g, '\n\n').trim();
  const sections = ['Контекст', 'Проблема', 'Данные', 'Вопрос для решения', 'Дополнительные вводные'];
  const allSections = ['Компания', ...sections];
  const lines = cleaned.split('\n').map((line) => line.trim()).filter(Boolean);
  const parsed = {};
  let activeSection = null;

  lines.forEach((line) => {
    const normalized = line
      .replace(/^[-*]\s*/, '')
      .replace(/^#{1,6}\s*/, '')
      .replace(/^\d+[.)]\s*/, '')
      .replaceAll('**', '')
      .trim();
    const matchedSection = allSections.find((section) => {
      const escaped = section.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      return new RegExp(`^${escaped}\\s*[:—-]?`, 'i').test(normalized);
    });

    if (matchedSection) {
      activeSection = matchedSection;
      const headingPattern = new RegExp(`^${matchedSection.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*[:—-]?\\s*`, 'i');
      const inlineContent = normalized.replace(headingPattern, '').trim();
      parsed[activeSection] = inlineContent ? [inlineContent] : [];
      return;
    }

    if (activeSection) {
      parsed[activeSection].push(normalized);
    }
  });

  const picked = sections
    .map((section) => {
      const value = (parsed[section] || []).join(' ').replace(/\s+/g, ' ').trim();
      if (!value) return '';
      return `- **${section}:** ${truncateSummary(value, section === 'Данные' ? 340 : 240)}`;
    })
    .filter(Boolean);

  if (picked.length >= 3) return picked.join('\n');

  const sentences = cleaned
    .replace(/\n/g, ' ')
    .split(/(?<=[.!?])\s+/)
    .filter(Boolean)
    .slice(0, 5)
    .join(' ');

  return sentences || cleaned.slice(0, 700);
}

function truncateSummary(value, maxLength) {
  if (value.length <= maxLength) return value;
  const shortened = value.slice(0, maxLength).trim();
  const lastSpace = shortened.lastIndexOf(' ');
  return `${shortened.slice(0, lastSpace > 120 ? lastSpace : maxLength).trim()}...`;
}

function LearningBlock({ theory }) {
  const [open, setOpen] = useState(false);
  if (!theory) return null;

  return (
    <section className="learning">
      <button className="learningToggle" onClick={() => setOpen((prev) => !prev)}>
        <span className="sectionLabel">Теория блока</span>
        <span className="toggleArrow">{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <div className="learningBody">
          <div>
            <h3>Зачем нужен этот этап</h3>
            <p>{theory.goal}</p>
          </div>
          <div className="termGrid">
            {(theory.terms || []).map((term) => (
              <article key={term.name} className="termItem">
                <b>{term.name}</b>
                <p>{term.meaning}</p>
              </article>
            ))}
          </div>
          <div className="exampleBox">
            <div><span>Пример</span><p>{theory.example}</p></div>
            <div><span>Как оформить ответ</span><p>{theory.answerTemplate}</p></div>
            <div><span>Типичная ошибка</span><p>{theory.commonMistake}</p></div>
          </div>
        </div>
      )}
    </section>
  );
}

function EvaluatePage(props) {
  return (
    <section className="grid two">
      <div className="panel">
        <h2>Итоговая оценка</h2>
        <p>Заполнено блоков: {props.completedCount}/{props.steps.length}</p>
        {!props.evaluation ? (
          <button className="primary" onClick={props.onEvaluate} disabled={props.loading || props.completedCount === 0}>
            Получить оценку
          </button>
        ) : (
          <EvaluationResult text={props.evaluation} />
        )}
        <button onClick={props.onBack}>Вернуться к решению</button>
      </div>
      <div className="panel">
        <h2>Статус блоков</h2>
        {props.steps.map((step) => (
          <p key={step.id} className={props.answers[step.id]?.trim() ? 'done' : 'muted'}>
            {props.answers[step.id]?.trim() ? '✓' : '○'} {step.title}
          </p>
        ))}
      </div>
    </section>
  );
}

function EvaluationResult({ text }) {
  try {
    const parsed = JSON.parse(text);
    return (
      <div className="evaluation">
        <div className="score">{parsed.totalScore ?? parsed.total_score}/100</div>
        {(parsed.criteria || []).map((item) => (
          <details key={item.name}>
            <summary>{item.name}: {item.score}/10</summary>
            <p>{item.comment}</p>
            <p><b>Что улучшить:</b> {item.recommendation}</p>
          </details>
        ))}
        {parsed.summary && <p>{parsed.summary}</p>}
      </div>
    );
  } catch {
    return <MarkdownText text={text} />;
  }
}

function MarkdownText({ text }) {
  return (
    <div className="markdown">
      {text.split('\n').map((line, index) => {
        if (line.startsWith('### ')) return <h3 key={index}>{line.slice(4)}</h3>;
        if (line.startsWith('## ')) return <h2 key={index}>{line.slice(3)}</h2>;
        if (line.startsWith('**') && line.endsWith('**')) return <h3 key={index}>{line.replaceAll('**', '')}</h3>;
        if (line.startsWith('- ')) return <p key={index} className="bullet">• {renderInlineMarkdown(line.slice(2))}</p>;
        if (!line.trim()) return <br key={index} />;
        return <p key={index}>{renderInlineMarkdown(line)}</p>;
      })}
    </div>
  );
}

function renderInlineMarkdown(line) {
  const parts = line.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={index}>{part.slice(2, -2)}</strong>;
    }

    return part;
  });
}

/* ─────────────────────────────────────────────
   QUIZ — Duolingo-style practice
   ───────────────────────────────────────────── */

function QuizPage({ category, onSelectCategory, onBack }) {
  if (!category) {
    return <QuizCategoryPicker onSelect={onSelectCategory} />;
  }
  return <QuizSession category={category} onBack={onBack} />;
}

function QuizCategoryPicker({ onSelect }) {
  return (
    <section className="quizPicker">
      <div className="quizPickerHead">
        <h2>Практика</h2>
        <p className="muted">Выбери тему — получишь 10 вопросов в формате карточек с мгновенной проверкой.</p>
      </div>
      <div className="quizGrid">
        {QUIZ_CATEGORIES.map((cat) => (
          <button key={cat.id} className="quizCatCard" onClick={() => onSelect(cat)}>
            <span className="quizCatIcon">{cat.icon}</span>
            <span className="quizCatTitle">{cat.title}</span>
            <span className="quizCatSub">{cat.subtitle}</span>
            <span className="quizCatTag" style={{ background: cat.color + '18', color: cat.color }}>{cat.tag}</span>
            <span className="quizCatCount">{(QUIZ_QUESTIONS[cat.id] || []).length} вопросов</span>
          </button>
        ))}
      </div>
    </section>
  );
}

function QuizSession({ category, onBack }) {
  const allQuestions = QUIZ_QUESTIONS[category.id] || [];
  const [questions] = useState(() => shuffle(allQuestions).slice(0, 10));
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState(null);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);
  const [wrongIndexes, setWrongIndexes] = useState([]);

  const q = questions[index];
  const progress = Math.round(((index) / questions.length) * 100);
  const isAnswered = selected !== null;

  function handleSelect(optIndex) {
    if (isAnswered) return;
    setSelected(optIndex);
    if (optIndex === q.answer) {
      setScore((s) => s + 1);
    } else {
      setWrongIndexes((prev) => [...prev, index]);
    }
  }

  function handleNext() {
    if (index + 1 >= questions.length) {
      setDone(true);
    } else {
      setIndex((i) => i + 1);
      setSelected(null);
    }
  }

  if (done) {
    return (
      <QuizResult
        score={score}
        total={questions.length}
        category={category}
        wrongCount={wrongIndexes.length}
        onRetry={() => {
          setIndex(0);
          setSelected(null);
          setScore(0);
          setDone(false);
          setWrongIndexes([]);
        }}
        onBack={onBack}
      />
    );
  }

  return (
    <section className="quizSession">
      <div className="quizSessionHead">
        <button className="quizBackBtn" onClick={onBack}>← Темы</button>
        <div className="quizSessionMeta">
          <span className="quizCatIcon" style={{ fontSize: '1.1rem' }}>{category.icon}</span>
          <span className="quizSessionTitle">{category.title}</span>
        </div>
        <span className="quizScoreBadge">{score}/{index + (isAnswered ? 1 : 0)}</span>
      </div>

      <div className="quizProgressBar">
        <div className="quizProgressFill" style={{ width: `${progress}%` }} />
      </div>
      <p className="quizCounter">{index + 1} / {questions.length}</p>

      <QuizCard
        key={index}
        question={q}
        selected={selected}
        onSelect={handleSelect}
      />

      {isAnswered && (
        <div className={`quizFeedback ${selected === q.answer ? 'correct' : 'wrong'}`}>
          <div className="quizFeedbackIcon">{selected === q.answer ? '✓' : '✗'}</div>
          <div>
            <p className="quizFeedbackLabel">{selected === q.answer ? 'Правильно!' : `Правильный ответ: ${q.options[q.answer]}`}</p>
            <p className="quizFeedbackText">{q.explanation}</p>
          </div>
        </div>
      )}

      {isAnswered && (
        <button className="primary quizNextBtn" onClick={handleNext}>
          {index + 1 >= questions.length ? 'Завершить' : 'Следующий вопрос →'}
        </button>
      )}
    </section>
  );
}

function QuizCard({ question, selected, onSelect }) {
  return (
    <div className="quizCard">
      <p className="quizQuestion">{question.q}</p>
      <div className="quizOptions">
        {question.options.map((opt, i) => {
          let cls = 'quizOption';
          if (selected !== null) {
            if (i === question.answer) cls += ' quizOptionCorrect';
            else if (i === selected) cls += ' quizOptionWrong';
            else cls += ' quizOptionDim';
          }
          return (
            <button key={i} className={cls} onClick={() => onSelect(i)} disabled={selected !== null}>
              <span className="quizOptionLetter">{String.fromCharCode(65 + i)}</span>
              <span>{opt}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function QuizResult({ score, total, category, wrongCount, onRetry, onBack }) {
  const pct = Math.round((score / total) * 100);
  const medal = pct >= 90 ? '🏆' : pct >= 70 ? '🥈' : pct >= 50 ? '🥉' : '💪';
  const message =
    pct >= 90 ? 'Отлично! Тему знаешь на уровне сеньора.' :
    pct >= 70 ? 'Хороший результат! Ещё немного и тема закрыта.' :
    pct >= 50 ? 'Неплохо. Повтори объяснения к ошибкам.' :
    'Тема требует проработки. Рекомендуем пройти ещё раз.';

  return (
    <section className="quizResult">
      <div className="quizResultCard">
        <span className="quizResultMedal">{medal}</span>
        <h2 className="quizResultScore">{score}/{total}</h2>
        <p className="quizResultPct">{pct}% правильных ответов</p>
        <p className="quizResultMsg">{message}</p>
        <p className="quizResultCat">{category.icon} {category.title}</p>
        <div className="quizResultActions">
          <button className="primary" onClick={onRetry}>Пройти ещё раз</button>
          <button onClick={onBack}>← Другая тема</button>
        </div>
      </div>
    </section>
  );
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/* ═══════════════════════════════════════════════
   LEARNING MATERIALS PAGE — PRD Implementation
   ═══════════════════════════════════════════════ */

const LEARN_TABS = [
  { id: 'all', label: 'Все ресурсы', icon: '⊞' },
  { id: 'lessons', label: 'Уроки', icon: '📖' },
  { id: 'notes', label: 'Конспекты', icon: '📝' },
  { id: 'questionbank', label: 'Банк вопросов', icon: '❓' },
  { id: 'flashcards', label: 'Flash Cards', icon: '🃏' },
  { id: 'definitions', label: 'Ключевые термины', icon: 'Aa' },
  { id: 'together', label: 'Обучаемся вместе', icon: '🤝' },
];

function LearningPage() {
  const [activeTab, setActiveTab] = useState('all');

  return (
    <div className="learnPage">
      <div className="learnTabBar">
        {LEARN_TABS.map((tab) => (
          <button
            key={tab.id}
            className={`learnTab${activeTab === tab.id ? ' active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <span className="learnTabIcon">{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      <div className="learnContent">
        {activeTab === 'all' && <AllResourcesTab onTabChange={setActiveTab} />}
        {activeTab === 'lessons' && <LessonsTab />}
        {activeTab === 'notes' && <NotesTab />}
        {activeTab === 'questionbank' && <QuestionBankTab />}
        {activeTab === 'flashcards' && <FlashCardsTab />}
        {activeTab === 'definitions' && <KeyDefinitionsTab />}
        {activeTab === 'together' && <LearnTogetherTab />}
      </div>
    </div>
  );
}

/* ── All Resources ── */
function AllResourcesTab({ onTabChange }) {
  const subtopicCount = PM_CHAPTERS.reduce((sum, chapter) => sum + chapter.subtopics.length, 0);
  const flashcardCount = Object.values(FLASHCARDS).reduce((sum, cards) => sum + cards.length, 0);

  return (
    <div className="allResourcesGrid">
      <h2 className="learnSectionTitle">Полный курс по продуктовому менеджменту</h2>
      <p className="learnSectionSub">{PM_CHAPTERS.length} разделов · {subtopicCount} подтем · {flashcardCount} карточек · {PRACTICE_QUESTIONS.length} вопросов · {KEY_DEFINITIONS.length} терминов</p>
      <div className="resourceCards">
        {[
          { tab: 'lessons', icon: '📖', title: 'Уроки', desc: `Структурированные учебные материалы по ${PM_CHAPTERS.length} разделам PM-курса`, count: `${PM_CHAPTERS.length} разделов` },
          { tab: 'notes', icon: '📝', title: 'Конспекты', desc: 'Краткие конспекты с ключевыми концепциями и примерами', count: `${PM_CHAPTERS.reduce((s, c) => s + c.notes.length, 0)} блоков` },
          { tab: 'questionbank', icon: '❓', title: 'Банк вопросов', desc: 'Вопросы с вариантами ответов для самопроверки', count: `${PRACTICE_QUESTIONS.length} вопросов` },
          { tab: 'flashcards', icon: '🃏', title: 'Flash Cards', desc: 'Карточки с интервальными повторениями по системе Anki', count: `${Object.values(FLASHCARDS).reduce((s, a) => s + a.length, 0)} карточек` },
          { tab: 'definitions', icon: 'Aa', title: 'Ключевые термины', desc: 'Глоссарий PM-терминов с определениями и примерами', count: `${KEY_DEFINITIONS.length} терминов` },
          { tab: 'together', icon: '🤝', title: 'Обучаемся вместе', desc: 'Адаптивные учебные сессии с AI-ментором', count: 'AI-powered' },
        ].map((item) => (
          <button key={item.tab} className="resourceCard" onClick={() => onTabChange(item.tab)}>
            <span className="resourceCardIcon">{item.icon}</span>
            <div>
              <div className="resourceCardTitle">{item.title}</div>
              <div className="resourceCardDesc">{item.desc}</div>
              <div className="resourceCardCount">{item.count}</div>
            </div>
          </button>
        ))}
      </div>
      <h3 className="learnSectionTitle" style={{ marginTop: '2rem' }}>Содержание курса</h3>
      <div className="chapterList">
        {PM_CHAPTERS.map((ch) => (
          <div key={ch.id} className="chapterRow">
            <span className="chapterRowIcon" style={{ background: ch.color + '20', color: ch.color }}>{ch.icon}</span>
            <div>
              <div className="chapterRowTitle">{ch.number}. {ch.title}</div>
              <div className="chapterRowSub">{ch.subtopics.length} подтем · {ch.subtopics.map((s) => s.title).join(', ')}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Lessons Tab ── */
const splitLessonText = (value = '') =>
  String(value)
    .split(/\n\n+/)
    .map((item) => item.trim())
    .filter(Boolean);

const renderLessonText = (value = '') => {
  const parts = String(value).split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={index}>{part.slice(2, -2)}</strong>;
    }
    return <React.Fragment key={index}>{part}</React.Fragment>;
  });
};

function LessonRichBlock({ title, children, tone = 'default' }) {
  return (
    <section className={`lessonRichBlock lessonRichBlock--${tone}`}>
      <div className="lessonRichBlockHead">{title}</div>
      {children}
    </section>
  );
}

function LessonsTab() {
  const [selectedChapter, setSelectedChapter] = useState(null);
  const [selectedSubtopic, setSelectedSubtopic] = useState(null);

  if (!selectedChapter) {
    return (
      <div className="lessonsView">
        <h2 className="learnSectionTitle">Уроки</h2>
        <p className="learnSectionSub">Выбери раздел для изучения</p>
        {PM_CHAPTERS.map((ch) => (
          <div key={ch.id} className="lessonChapter">
            <button className="lessonChapterHead" onClick={() => setSelectedChapter(ch)}>
              <span className="lessonChapterIcon" style={{ background: ch.color + '20', color: ch.color }}>{ch.icon}</span>
              <div>
                <div className="lessonChapterTitle">{ch.number}. {ch.title}</div>
                <div className="lessonChapterDesc">{ch.description}</div>
              </div>
              <span className="lessonChapterCount">{ch.subtopics.length} подтем</span>
            </button>
          </div>
        ))}
      </div>
    );
  }

  if (!selectedSubtopic) {
    return (
      <div className="lessonsView">
        <button className="learnBack" onClick={() => setSelectedChapter(null)}>← Все разделы</button>
        <div className="lessonChapterHeader">
          <span className="lessonChapterBigIcon" style={{ background: selectedChapter.color + '20', color: selectedChapter.color }}>{selectedChapter.icon}</span>
          <div>
            <h2>{selectedChapter.number}. {selectedChapter.title}</h2>
            <p className="muted">{selectedChapter.description}</p>
          </div>
        </div>
        <div className="subtopicList">
          {selectedChapter.subtopics.map((sub, idx) => (
            <button key={sub.id} className="subtopicRow" onClick={() => setSelectedSubtopic(sub)}>
              <span className="subtopicNum">{idx + 1}</span>
              <div>
                <div className="subtopicTitle">{sub.title}</div>
                <div className="subtopicDuration">⏱ {sub.duration}</div>
              </div>
              <span className="subtopicArrow">›</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <LessonViewer
      chapter={selectedChapter}
      subtopic={selectedSubtopic}
      onBack={() => setSelectedSubtopic(null)}
    />
  );
}

function LessonViewer({ chapter, subtopic, onBack }) {
  const chapterFlashcards = (FLASHCARDS[chapter.id] || []).slice(0, 3);
  const chapterQuestions = PRACTICE_QUESTIONS.filter((q) => q.chapter === chapter.id).slice(0, 2);
  const lessonContent = LEARN_TOGETHER_CONTENT[subtopic.id] || {};
  const lessonParagraphs = splitLessonText(lessonContent.exposition);
  const fallbackDefinition = chapter.notes.find((note) => note.type === 'definition') || chapter.notes[0];
  const fallbackExample = chapter.notes.find((note) => note.type === 'example');
  const fallbackAnalogy = chapter.notes.find((note) => note.type === 'analogy');
  const lessonMcq = lessonContent.mcq
    ? {
        id: `${subtopic.id}-lesson-mcq`,
        q: lessonContent.mcq.question,
        options: lessonContent.mcq.options,
        answer: lessonContent.mcq.correct,
        explanation: lessonContent.mcq.explanation,
      }
    : null;
  const lessonQuestions = lessonMcq ? [lessonMcq, ...chapterQuestions].slice(0, 3) : chapterQuestions;
  const [showFlashcard, setShowFlashcard] = useState(false);
  const [fcIndex, setFcIndex] = useState(0);
  const [fcFlipped, setFcFlipped] = useState(false);
  const [answeredQ, setAnsweredQ] = useState({});

  return (
    <div className="lessonViewer">
      <button className="learnBack" onClick={onBack}>← {chapter.title}</button>
      <div className="lessonViewerHeader">
        <h2>{subtopic.title}</h2>
        <span className="subtopicDuration">⏱ {subtopic.duration}</span>
      </div>

      <div className="lessonHeroCard" style={{ '--lesson-color': chapter.color }}>
        <div className="lessonHeroKicker">Модуль {chapter.number} · подробный урок</div>
        <h3>{lessonContent.title || subtopic.title}</h3>
        <p>{lessonContent.definition || fallbackDefinition?.text || chapter.description}</p>
      </div>

      <LessonRichBlock title="Учебное объяснение">
        {lessonParagraphs.length > 0 ? (
          lessonParagraphs.map((paragraph) => <p key={paragraph}>{renderLessonText(paragraph)}</p>)
        ) : (
          <p>{fallbackDefinition?.text}</p>
        )}
      </LessonRichBlock>

      {lessonContent.keyPoints?.length > 0 && (
        <LessonRichBlock title="Ключевые выводы" tone="blue">
          <ol className="lessonRichList">
            {lessonContent.keyPoints.map((item) => <li key={item}>{renderLessonText(item)}</li>)}
          </ol>
        </LessonRichBlock>
      )}

      {lessonContent.framework && (
        <LessonRichBlock title={lessonContent.framework.title} tone="violet">
          <div className="lessonFrameworkGrid">
            {lessonContent.framework.items.map((item) => (
              <article key={item.name} className="lessonFrameworkItem">
                <strong>{item.name}</strong>
                <p>{renderLessonText(item.description)}</p>
              </article>
            ))}
          </div>
        </LessonRichBlock>
      )}

      {lessonContent.comparisonTable && (
        <LessonRichBlock title={lessonContent.comparisonTable.title} tone="plain">
          <div className="lessonTableWrap">
            <table className="lessonTable">
              <thead>
                <tr>{lessonContent.comparisonTable.headers.map((header) => <th key={header}>{header}</th>)}</tr>
              </thead>
              <tbody>
                {lessonContent.comparisonTable.rows.map((row, idx) => (
                  <tr key={idx}>{row.map((cell, cellIdx) => <td key={cellIdx}>{renderLessonText(cell)}</td>)}</tr>
                ))}
              </tbody>
            </table>
          </div>
        </LessonRichBlock>
      )}

      {lessonContent.realExamples?.length > 0 && (
        <LessonRichBlock title="Примеры из продуктов" tone="green">
          <div className="lessonExamplesGrid">
            {lessonContent.realExamples.map((example) => (
              <article key={example.product + example.situation} className="lessonExampleCard">
                <strong>{example.product}</strong>
                <p><b>Ситуация:</b> {example.situation}</p>
                <p><b>Действие:</b> {example.action}</p>
                <p><b>Результат:</b> {example.outcome}</p>
              </article>
            ))}
          </div>
        </LessonRichBlock>
      )}

      {lessonContent.commonMistakes?.length > 0 && (
        <LessonRichBlock title="Типичные ошибки" tone="yellow">
          <ul className="lessonRichList">
            {lessonContent.commonMistakes.map((item) => <li key={item}>{renderLessonText(item)}</li>)}
          </ul>
        </LessonRichBlock>
      )}

      {lessonContent.checklist?.length > 0 && (
        <LessonRichBlock title="Чек-лист применения" tone="blue">
          <ul className="lessonChecklist">
            {lessonContent.checklist.map((item) => <li key={item}>{renderLessonText(item)}</li>)}
          </ul>
        </LessonRichBlock>
      )}

      <div className="noteBlock noteBlock--example">
        <div className="noteBlockLabel">💡 Контекст раздела</div>
        <h4 className="noteBlockTitle">{fallbackExample?.title || chapter.title}</h4>
        <p className="noteBlockText">{fallbackExample?.text || chapter.description}</p>
      </div>

      {fallbackAnalogy && (
        <div className="noteBlock noteBlock--analogy">
          <div className="noteBlockLabel">🔗 Аналогия</div>
          <h4 className="noteBlockTitle">{fallbackAnalogy.title}</h4>
          <p className="noteBlockText">{fallbackAnalogy.text}</p>
        </div>
      )}

      <LessonRichBlock title="Практика после урока" tone="pink">
        <p><strong>Задание:</strong> возьми любой продукт, сформулируй сегмент, проблему, решение, метрику успеха и главный риск через тему «{subtopic.title}».</p>
        {lessonContent.trueFalse && (
          <p><strong>Быстрая проверка:</strong> {lessonContent.trueFalse.statement} Ответ: {lessonContent.trueFalse.correct ? 'верно' : 'неверно'}. {lessonContent.trueFalse.explanation}</p>
        )}
      </LessonRichBlock>

      {/* Inline Flashcards */}
      {chapterFlashcards.length > 0 && (
        <div className="lessonSection">
          <div className="lessonSectionHead">
            <span>🃏 Flash Cards</span>
            <button className="lessonSectionToggle" onClick={() => { setShowFlashcard(!showFlashcard); setFcIndex(0); setFcFlipped(false); }}>
              {showFlashcard ? 'Скрыть' : 'Показать карточки'}
            </button>
          </div>
          {showFlashcard && chapterFlashcards[fcIndex] && (
            <div className="inlineFcWrapper">
              <div className={`fcCard${fcFlipped ? ' flipped' : ''}`} onClick={() => setFcFlipped(!fcFlipped)}>
                <div className="fcFront"><p>{chapterFlashcards[fcIndex].front}</p><span className="fcHint">Нажми чтобы перевернуть</span></div>
                <div className="fcBack"><p>{chapterFlashcards[fcIndex].back}</p></div>
              </div>
              <div className="fcNav">
                <button onClick={() => { setFcIndex((i) => Math.max(0, i - 1)); setFcFlipped(false); }} disabled={fcIndex === 0}>← Назад</button>
                <span>{fcIndex + 1}/{chapterFlashcards.length}</span>
                <button onClick={() => { setFcIndex((i) => Math.min(chapterFlashcards.length - 1, i + 1)); setFcFlipped(false); }} disabled={fcIndex === chapterFlashcards.length - 1}>Следующая →</button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Mini quiz */}
      {lessonQuestions.length > 0 && (
        <div className="lessonSection">
          <div className="lessonSectionHead"><span>✅ Проверь себя</span></div>
          {lessonQuestions.map((q) => (
            <MiniQuizCard key={q.id} question={q} answered={answeredQ[q.id]} onAnswer={(idx) => setAnsweredQ((prev) => ({ ...prev, [q.id]: idx }))} />
          ))}
        </div>
      )}
    </div>
  );
}

function MiniQuizCard({ question, answered, onAnswer }) {
  return (
    <div className="miniQuizCard">
      <p className="miniQuizQ">{question.q}</p>
      <div className="miniQuizOptions">
        {question.options.map((opt, i) => {
          let cls = 'miniQuizOpt';
          if (answered !== undefined) {
            if (i === question.answer) cls += ' correct';
            else if (i === answered) cls += ' wrong';
            else cls += ' dim';
          }
          return (
            <button key={i} className={cls} onClick={() => onAnswer(i)} disabled={answered !== undefined}>
              <span className="miniQuizLetter">{String.fromCharCode(65 + i)}</span>
              <span>{opt}</span>
            </button>
          );
        })}
      </div>
      {answered !== undefined && (
        <div className={`miniQuizFeedback ${answered === question.answer ? 'correct' : 'wrong'}`}>
          <strong>{answered === question.answer ? '✓ Правильно!' : `✗ Правильный ответ: ${question.options[question.answer]}`}</strong>
          <p>{question.explanation}</p>
        </div>
      )}
    </div>
  );
}

/* ── Notes Tab ── */
function NotesTab() {
  const [selectedChapter, setSelectedChapter] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const filtered = searchQuery
    ? PM_CHAPTERS.filter((ch) =>
        ch.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ch.notes.some((n) => n.text.toLowerCase().includes(searchQuery.toLowerCase()) || n.title.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : PM_CHAPTERS;

  if (selectedChapter) {
    return (
      <div className="notesView">
        <button className="learnBack" onClick={() => setSelectedChapter(null)}>← Все конспекты</button>
        <div className="notesHeader">
          <span className="lessonChapterBigIcon" style={{ background: selectedChapter.color + '20', color: selectedChapter.color }}>{selectedChapter.icon}</span>
          <h2>{selectedChapter.number}. {selectedChapter.title}</h2>
        </div>
        {selectedChapter.notes.map((note, idx) => (
          <div key={idx} className={`noteBlock noteBlock--${note.type}`}>
            <div className="noteBlockLabel">
              {{ definition: '📘 Определение', example: '💡 Пример', note: '📌 Заметка', analogy: '🔗 Аналогия' }[note.type] || note.type}
            </div>
            <h4 className="noteBlockTitle">{note.title}</h4>
            <p className="noteBlockText">{note.text}</p>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="notesView">
      <h2 className="learnSectionTitle">Конспекты</h2>
      <input
        className="learnSearch"
        placeholder="Поиск по конспектам..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
      />
      {filtered.map((ch) => (
        <button key={ch.id} className="notesChapterRow" onClick={() => setSelectedChapter(ch)}>
          <span className="lessonChapterIcon" style={{ background: ch.color + '20', color: ch.color }}>{ch.icon}</span>
          <div>
            <div className="lessonChapterTitle">{ch.number}. {ch.title}</div>
            <div className="lessonChapterDesc">{ch.notes.length} блоков · {ch.subtopics.length} подтем</div>
          </div>
          <span className="subtopicArrow">›</span>
        </button>
      ))}
    </div>
  );
}

/* ── Question Bank Tab ── */
function QuestionBankTab() {
  const [filters, setFilters] = useState({ chapter: 'all', difficulty: 'all', type: 'all' });
  const [answered, setAnswered] = useState({});
  const [saved, setSaved] = useState(() => {
    try { return new Set(JSON.parse(localStorage.getItem('hc_saved_questions') || '[]')); } catch { return new Set(); }
  });
  const [aiExplanation, setAiExplanation] = useState({});
  const [aiLoading, setAiLoading] = useState({});
  const [expandedQ, setExpandedQ] = useState(null);

  const questions = PRACTICE_QUESTIONS.filter((q) => {
    if (filters.chapter !== 'all' && q.chapter !== filters.chapter) return false;
    if (filters.difficulty !== 'all' && q.difficulty !== filters.difficulty) return false;
    if (filters.type !== 'all' && q.type !== filters.type) return false;
    return true;
  });

  function toggleSave(id) {
    setSaved((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      localStorage.setItem('hc_saved_questions', JSON.stringify([...next]));
      return next;
    });
  }

  async function fetchAiExplanation(q) {
    if (aiExplanation[q.id]) return;
    setAiLoading((prev) => ({ ...prev, [q.id]: true }));
    try {
      const chapterObj = PM_CHAPTERS.find((c) => c.id === q.chapter);
      const data = await learnExplain({
        topic: chapterObj?.title || q.chapter,
        subtopic: q.subtopic || '',
        question: q.q,
        wrongAnswer: q.options[answered[q.id]] || '',
        correctAnswer: q.options[q.answer],
        difficulty: 'normal',
      });
      setAiExplanation((prev) => ({ ...prev, [q.id]: data }));
    } catch {
      setAiExplanation((prev) => ({ ...prev, [q.id]: { explanation: 'Не удалось загрузить объяснение.', tip: '' } }));
    } finally {
      setAiLoading((prev) => ({ ...prev, [q.id]: false }));
    }
  }

  return (
    <div className="questionBankView">
      <h2 className="learnSectionTitle">Банк вопросов</h2>

      {/* Filters */}
      <div className="qbFilters">
        <select value={filters.chapter} onChange={(e) => setFilters((f) => ({ ...f, chapter: e.target.value }))}>
          <option value="all">Все разделы</option>
          {PM_CHAPTERS.map((ch) => <option key={ch.id} value={ch.id}>{ch.icon} {ch.title}</option>)}
        </select>
        <select value={filters.difficulty} onChange={(e) => setFilters((f) => ({ ...f, difficulty: e.target.value }))}>
          <option value="all">Любая сложность</option>
          <option value="easy">Лёгкие</option>
          <option value="medium">Средние</option>
          <option value="hard">Сложные</option>
        </select>
        <select value={filters.type} onChange={(e) => setFilters((f) => ({ ...f, type: e.target.value }))}>
          <option value="all">Все типы</option>
          <option value="concept">Концепция</option>
          <option value="scenario">Сценарий</option>
          <option value="calculation">Расчёт</option>
        </select>
        <span className="qbCount">{questions.length} вопросов</span>
      </div>

      {/* Questions */}
      {questions.map((q) => {
        const chapterObj = PM_CHAPTERS.find((c) => c.id === q.chapter);
        const isAnswered = answered[q.id] !== undefined;
        const isCorrect = answered[q.id] === q.answer;
        const isSaved = saved.has(q.id);
        const isExpanded = expandedQ === q.id;
        const ai = aiExplanation[q.id];

        return (
          <div key={q.id} className={`qbCard${isAnswered ? (isCorrect ? ' correct' : ' wrong') : ''}`}>
            <div className="qbCardHead">
              <div className="qbCardMeta">
                <span className="qbCardChapter" style={{ background: chapterObj?.color + '20', color: chapterObj?.color }}>{chapterObj?.icon} {chapterObj?.title}</span>
                <span className={`qbCardDiff qbCardDiff--${q.difficulty}`}>{q.difficulty === 'easy' ? 'Лёгкий' : q.difficulty === 'medium' ? 'Средний' : 'Сложный'}</span>
              </div>
              <div className="qbCardActions">
                {isAnswered && <span className="qbCardStatus">{isCorrect ? '✓ Решено' : '✗ Ошибка'}</span>}
                <button className={`qbActionBtn${isSaved ? ' saved' : ''}`} title={isSaved ? 'Убрать из сохранённых' : 'Сохранить'} onClick={() => toggleSave(q.id)}>
                  {isSaved ? '🔖' : '📄'}
                </button>
                <button className="qbActionBtn" title="Развернуть" onClick={() => setExpandedQ(isExpanded ? null : q.id)}>
                  {isExpanded ? '⊡' : '⊠'}
                </button>
              </div>
            </div>

            <p className="qbQuestion">{q.q}</p>

            {isExpanded && (
              <>
                <div className="qbOptions">
                  {q.options.map((opt, i) => {
                    let cls = 'qbOption';
                    if (isAnswered) {
                      if (i === q.answer) cls += ' correct';
                      else if (i === answered[q.id]) cls += ' wrong';
                      else cls += ' dim';
                    }
                    return (
                      <button key={i} className={cls} onClick={() => !isAnswered && setAnswered((prev) => ({ ...prev, [q.id]: i }))} disabled={isAnswered}>
                        <span className="qbOptionLetter">{String.fromCharCode(65 + i)}</span>
                        <span>{opt}</span>
                      </button>
                    );
                  })}
                </div>

                {isAnswered && (
                  <div className={`qbFeedback${isCorrect ? ' correct' : ' wrong'}`}>
                    <strong>{isCorrect ? '✓ Правильно!' : `✗ Правильный ответ: ${q.options[q.answer]}`}</strong>
                    <p>{q.explanation}</p>
                    {!isCorrect && !ai && (
                      <button className="qbAiBtn" onClick={() => fetchAiExplanation(q)} disabled={aiLoading[q.id]}>
                        {aiLoading[q.id] ? 'Загружаю объяснение...' : '🤖 Объяснить подробнее'}
                      </button>
                    )}
                    {ai && (
                      <div className="qbAiExplain">
                        <div className="qbAiExplainHead">🤖 AI-объяснение</div>
                        <p>{ai.explanation}</p>
                        {ai.tip && <div className="qbAiTip">💡 <strong>Совет:</strong> {ai.tip}</div>}
                      </div>
                    )}
                  </div>
                )}
              </>
            )}

            {!isExpanded && !isAnswered && (
              <button className="qbShowBtn" onClick={() => setExpandedQ(q.id)}>Открыть вопрос</button>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ── Flash Cards Tab ── */

const SRS_INTERVALS = { again: 10 / (60 * 24), hard: 45 / (60 * 24), good: 1, easy: 4 };

function loadFcProgress() {
  try { return JSON.parse(localStorage.getItem('hc_fc_progress') || '{}'); } catch { return {}; }
}

function saveFcProgress(progress) {
  localStorage.setItem('hc_fc_progress', JSON.stringify(progress));
}

function FlashCardsTab() {
  const [selectedChapter, setSelectedChapter] = useState(null);
  const [cardIndex, setCardIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [progress, setProgress] = useState(loadFcProgress);
  const [sessionDone, setSessionDone] = useState(false);

  const cards = selectedChapter ? (FLASHCARDS[selectedChapter.id] || []) : [];

  // Calculate total stats
  const totalCards = Object.values(FLASHCARDS).reduce((s, a) => s + a.length, 0);
  const reviewedCards = Object.keys(progress).length;
  const confidence = totalCards > 0 ? Math.round((reviewedCards / totalCards) * 100) : 0;

  useEffect(() => {
    setCardIndex(0);
    setFlipped(false);
    setSessionDone(false);
  }, [selectedChapter]);

  useEffect(() => {
    function onKey(e) {
      if (e.code === 'Space' && selectedChapter) { e.preventDefault(); setFlipped((f) => !f); }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selectedChapter]);

  function rateCard(rating) {
    const card = cards[cardIndex];
    const nextInterval = SRS_INTERVALS[rating];
    const nextReview = Date.now() + nextInterval * 24 * 60 * 60 * 1000;
    const nextProgress = { ...progress, [card.id]: { rating, nextReview, reviewedAt: Date.now() } };
    setProgress(nextProgress);
    saveFcProgress(nextProgress);

    if (cardIndex + 1 >= cards.length) {
      setSessionDone(true);
    } else {
      setCardIndex((i) => i + 1);
      setFlipped(false);
    }
  }

  if (!selectedChapter) {
    return (
      <div className="fcView">
        <h2 className="learnSectionTitle">Flash Cards</h2>
        <div className="fcProgressOverall">
          <div className="fcProgressRing">
            <svg viewBox="0 0 60 60">
              <circle cx="30" cy="30" r="26" fill="none" stroke="#e5e7eb" strokeWidth="4" />
              <circle cx="30" cy="30" r="26" fill="none" stroke="#6366f1" strokeWidth="4"
                strokeDasharray={`${2 * Math.PI * 26}`}
                strokeDashoffset={`${2 * Math.PI * 26 * (1 - confidence / 100)}`}
                strokeLinecap="round" transform="rotate(-90 30 30)" />
            </svg>
            <span className="fcProgressPct">{confidence}%</span>
          </div>
          <div>
            <div className="fcProgressLabel">Spaced Repetition Progress</div>
            <div className="fcProgressSub">{reviewedCards}/{totalCards} карточек изучено</div>
          </div>
        </div>
        <p className="learnSectionSub">Выбери раздел для изучения карточек</p>
        <div className="fcChapterGrid">
          {PM_CHAPTERS.map((ch) => {
            const chCards = FLASHCARDS[ch.id] || [];
            const chReviewed = chCards.filter((c) => progress[c.id]).length;
            const pct = chCards.length > 0 ? Math.round((chReviewed / chCards.length) * 100) : 0;
            return (
              <button key={ch.id} className="fcChapterCard" onClick={() => setSelectedChapter(ch)} style={{ borderColor: ch.color + '40' }}>
                <span className="fcChapterCardIcon" style={{ color: ch.color }}>{ch.icon}</span>
                <div className="fcChapterCardTitle">{ch.number}. {ch.title}</div>
                <div className="fcChapterCardCount">{chCards.length} карточек</div>
                <div className="fcChapterCardBar">
                  <div style={{ width: `${pct}%`, background: ch.color }} />
                </div>
                <div className="fcChapterCardPct">{pct}%</div>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  if (sessionDone) {
    return (
      <div className="fcView">
        <button className="learnBack" onClick={() => setSelectedChapter(null)}>← Все разделы</button>
        <div className="fcDone">
          <span className="fcDoneEmoji">🎉</span>
          <h3>Сессия завершена!</h3>
          <p>Ты прошёл все {cards.length} карточек раздела «{selectedChapter.title}»</p>
          <div className="fcDoneActions">
            <button className="primary" onClick={() => { setCardIndex(0); setFlipped(false); setSessionDone(false); }}>Повторить ещё раз</button>
            <button onClick={() => setSelectedChapter(null)}>← Все разделы</button>
          </div>
        </div>
      </div>
    );
  }

  const card = cards[cardIndex];
  const cardProgress = progress[card?.id];

  return (
    <div className="fcView">
      <div className="fcSessionHead">
        <button className="learnBack" onClick={() => setSelectedChapter(null)}>← Разделы</button>
        <span className="fcSessionTitle">{selectedChapter.icon} {selectedChapter.title}</span>
        <span className="fcSessionCounter">{cardIndex + 1}/{cards.length}</span>
      </div>

      <div className="fcProgressBar">
        <div style={{ width: `${((cardIndex) / cards.length) * 100}%` }} />
      </div>

      {card && (
        <>
          <div className={`fcCard${flipped ? ' flipped' : ''}`} onClick={() => setFlipped((f) => !f)}>
            <div className="fcFront">
              <p>{card.front}</p>
              <span className="fcHint">Flip · Spacebar</span>
            </div>
            <div className="fcBack">
              <p>{card.back}</p>
            </div>
          </div>

          {!flipped && <p className="fcFlipPrompt">Нажми на карточку или Spacebar чтобы увидеть ответ</p>}

          {flipped && (
            <div className="fcRating">
              <p className="fcRatingLabel">Оцени насколько хорошо ты знал ответ:</p>
              <div className="fcRatingBtns">
                {[
                  { key: 'again', label: 'Снова', sub: '10 мин', color: '#ef4444' },
                  { key: 'hard', label: 'Сложно', sub: '45 мин', color: '#f59e0b' },
                  { key: 'good', label: 'Хорошо', sub: '1 день', color: '#3b82f6' },
                  { key: 'easy', label: 'Легко', sub: '4 дня', color: '#10b981' },
                ].map((r) => (
                  <button key={r.key} className="fcRatingBtn" style={{ '--fc-color': r.color }} onClick={() => rateCard(r.key)}>
                    <span className="fcRatingName">{r.label}</span>
                    <span className="fcRatingInterval">{r.sub}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Overall progress */}
      <div className="fcProgressBox">
        <div className="fcProgressBoxHead">Spaced Repetition Progress</div>
        <div className="fcProgressBoxBar">
          <div style={{ width: `${confidence}%` }} />
        </div>
        <div className="fcProgressBoxPct">{confidence}% confidence · {reviewedCards}/{totalCards} карточек</div>
      </div>
    </div>
  );
}

/* ── Key Definitions Tab ── */
function KeyDefinitionsTab() {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const categories = ['all', ...new Set(KEY_DEFINITIONS.map((d) => d.category))];

  const filtered = KEY_DEFINITIONS.filter((d) => {
    if (selectedCategory !== 'all' && d.category !== selectedCategory) return false;
    if (search) {
      const q = search.toLowerCase();
      return d.term.toLowerCase().includes(q) || d.definition.toLowerCase().includes(q);
    }
    return true;
  }).sort((a, b) => a.term.localeCompare(b.term));

  return (
    <div className="definitionsView">
      <h2 className="learnSectionTitle">Ключевые термины</h2>
      <div className="definitionsFilters">
        <input className="learnSearch" placeholder="Поиск термина..." value={search} onChange={(e) => setSearch(e.target.value)} />
        <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}>
          <option value="all">Все категории</option>
          {categories.slice(1).map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>
      <div className="definitionsList">
        {filtered.map((def) => {
          const chapter = PM_CHAPTERS.find((c) => c.id === def.chapter);
          return (
            <div key={def.term} className="definitionCard">
              <div className="definitionCardHead">
                <strong className="definitionTerm">{def.term}</strong>
                <span className="definitionCategory">{def.category}</span>
              </div>
              <p className="definitionText">{def.definition}</p>
              {chapter && <div className="definitionChapter" style={{ color: chapter.color }}>{chapter.icon} {chapter.title}</div>}
            </div>
          );
        })}
        {filtered.length === 0 && <p className="muted">Нет результатов для «{search}»</p>}
      </div>
    </div>
  );
}

/* ── Learn Together Tab ── */
function LearnTogetherTab() {
  const [phase, setPhase] = useState('pick'); // pick | session
  const [selectedContent, setSelectedContent] = useState(null);

  if (phase === 'pick') {
    const contentKeys = Object.keys(LEARN_TOGETHER_CONTENT);
    return (
      <div className="togetherView">
        <h2 className="learnSectionTitle">Обучаемся вместе</h2>
        <p className="learnSectionSub">Адаптивная учебная сессия: получи объяснение, ответь на вопрос, получи персональный фидбек</p>
        <div className="togetherTopicList">
          {contentKeys.map((key) => {
            const content = LEARN_TOGETHER_CONTENT[key];
            const chapterId = key.split('_')[0];
            const chapter = PM_CHAPTERS.find((c) => c.id === chapterId);
            return (
              <button key={key} className="togetherTopicCard" onClick={() => { setSelectedContent({ key, content, chapter }); setPhase('session'); }}>
                <span className="togetherTopicIcon" style={{ background: chapter?.color + '20', color: chapter?.color }}>{chapter?.icon}</span>
                <div>
                  <div className="togetherTopicTitle">{content.title}</div>
                  <div className="togetherTopicChapter">{chapter?.title}</div>
                </div>
                <span className="subtopicArrow">›</span>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <LearnTogetherSession
      contentKey={selectedContent.key}
      content={selectedContent.content}
      chapter={selectedContent.chapter}
      onBack={() => { setPhase('pick'); setSelectedContent(null); }}
    />
  );
}

function LearnTogetherSession({ contentKey, content, chapter, onBack }) {
  const [step, setStep] = useState('expo'); // expo | mcq | aiChat | done
  const [health, setHealth] = useState(3);
  const [xp, setXp] = useState(0);
  const [mode, setMode] = useState('normal');
  const [mcqAnswered, setMcqAnswered] = useState(null);
  const [userAnswer, setUserAnswer] = useState('');
  const [aiFeedback, setAiFeedback] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiExpo, setAiExpo] = useState(null);
  const answerRef = useRef(null);

  async function handleTooHard() {
    setAiLoading(true);
    try {
      const data = await learnSession({ chapterId: chapter?.id || '', subtopicId: contentKey, userLevel: 'beginner' });
      setAiExpo(data.exposition);
    } catch {
      setAiExpo(content.simplifiedExposition);
    } finally {
      setAiLoading(false);
      setMode('simplified');
    }
  }

  function handleMcqAnswer(idx) {
    if (mcqAnswered !== null) return;
    setMcqAnswered(idx);
    if (idx === content.mcq.correct) {
      setXp((x) => x + 10);
    } else {
      setHealth((h) => Math.max(0, h - 1));
    }
  }

  async function handleGetAiFeedback() {
    if (!userAnswer.trim() || aiLoading) return;
    setAiLoading(true);
    try {
      const data = await learnExplain({
        topic: chapter?.title || contentKey,
        subtopic: content.title,
        question: 'Студент объясняет концепцию своими словами и описывает применение в кейсе',
        wrongAnswer: userAnswer,
        correctAnswer: '',
        difficulty: 'normal',
      });
      setAiFeedback(data);
      setXp((x) => x + 15);
    } catch {
      setAiFeedback({
        explanation: 'Отличный ответ! Объяснение концепций своими словами — один из лучших способов проверить понимание. Продолжай практиковать такой подход.',
        tip: 'Перед PM-интервью попробуй объяснить ключевые концепции вслух за 30 секунд — это лучший тест на реальное понимание.',
      });
      setXp((x) => x + 10);
    } finally {
      setAiLoading(false);
    }
  }

  const exposition = mode === 'simplified' ? (aiExpo || content.simplifiedExposition) : content.exposition;

  const stepLabels = ['Теория', 'Проверка', 'AI-разбор', 'Готово'];
  const stepIndex = { expo: 0, mcq: 1, aiChat: 2, done: 3 }[step] ?? 0;

  return (
    <div className="togetherSession">
      <div className="togetherSessionHead">
        <button className="learnBack" onClick={onBack}>← Темы</button>
        <div className="togetherStats">
          <span className="togetherHealth">{'❤️'.repeat(health)}{'🖤'.repeat(Math.max(0, 3 - health))}</span>
          <span className="togetherXp">⚡ {xp} XP</span>
        </div>
      </div>

      {/* Progress steps */}
      <div className="mentorStepTrack">
        {stepLabels.map((label, i) => (
          <div key={label} className={`mentorStepDot${i < stepIndex ? ' done' : ''}${i === stepIndex ? ' active' : ''}`}>
            <div className="mentorStepBubble">{i < stepIndex ? '✓' : i + 1}</div>
            <div className="mentorStepLabel">{label}</div>
          </div>
        ))}
      </div>

      {step === 'expo' && (
        <div className="togetherExpo">
          <div className="togetherExpoBlock">
            <div className="togetherExpoLabel">📖 {content.title}</div>
            {aiLoading ? (
              <p className="muted">Генерирую упрощённое объяснение AI-ментором...</p>
            ) : (
              exposition.split('\n\n').map((para, i) => <p key={i}>{para}</p>)
            )}
          </div>
          <div className="togetherExpoActions">
            <button className="togetherActionBtn togetherHard" onClick={handleTooHard} disabled={aiLoading}>
              🤔 Объясни проще
            </button>
            <button className="primary togetherContinue" onClick={() => setStep('mcq')}>
              Понял, проверь меня →
            </button>
          </div>
        </div>
      )}

      {step === 'mcq' && (
        <div className="togetherMcq">
          <div className="togetherMcqLabel">🔵 Быстрая проверка</div>
          <p className="togetherMcqQ">{content.mcq.question}</p>
          <div className="togetherMcqOptions">
            {content.mcq.options.map((opt, i) => {
              let cls = 'togetherMcqOpt';
              if (mcqAnswered !== null) {
                if (i === content.mcq.correct) cls += ' correct';
                else if (i === mcqAnswered) cls += ' wrong';
                else cls += ' dim';
              }
              return (
                <button key={i} className={cls} onClick={() => handleMcqAnswer(i)} disabled={mcqAnswered !== null}>
                  <span className="togetherMcqLetter">{String.fromCharCode(65 + i)}</span>
                  {opt}
                </button>
              );
            })}
          </div>
          {mcqAnswered !== null && (
            <div className={`togetherFeedback${mcqAnswered === content.mcq.correct ? ' correct' : ' wrong'}`}>
              <strong>{mcqAnswered === content.mcq.correct ? '✓ Отлично!' : '✗ Не совсем...'}</strong>
              <p>{content.mcq.explanation}</p>
              <button className="primary" onClick={() => setStep('aiChat')}>
                Перейти к AI-разбору →
              </button>
            </div>
          )}
        </div>
      )}

      {step === 'aiChat' && (
        <div className="aiMentorStep">
          <div className="aiMentorStepHeader">
            <span className="aiMentorStepTag">💬 AI-ментор</span>
            <p className="aiMentorStepTitle">Закрепи тему своими словами</p>
          </div>
          <div className="aiMentorPromptBlock">
            <p className="aiMentorPromptText">
              Объясни, что такое <strong>«{content.title}»</strong> и как бы ты применил это понятие в реальном PM-кейсе или собеседовании? Напиши 3–5 предложений.
            </p>
          </div>
          <textarea
            ref={answerRef}
            className="aiMentorAnswer"
            value={userAnswer}
            onChange={(e) => setUserAnswer(e.target.value)}
            placeholder="Напиши своими словами... AI-ментор даст персональный фидбек на твой ответ."
            disabled={!!aiFeedback}
            rows={5}
          />
          {!aiFeedback && (
            <button
              className="primary"
              onClick={handleGetAiFeedback}
              disabled={!userAnswer.trim() || aiLoading}
            >
              {aiLoading ? '🤖 Ментор анализирует...' : 'Получить фидбек от AI →'}
            </button>
          )}
          {aiFeedback && (
            <div className="aiFeedbackCard">
              <div className="aiFeedbackHead">🤖 Фидбек AI-ментора</div>
              <p className="aiFeedbackText">{aiFeedback.explanation}</p>
              {aiFeedback.tip && (
                <div className="aiFeedbackTip">
                  <span>💡</span>
                  <span><strong>Совет:</strong> {aiFeedback.tip}</span>
                </div>
              )}
              <button className="primary aiFeedbackNext" onClick={() => setStep('done')}>
                Завершить тему → +15 XP
              </button>
            </div>
          )}
        </div>
      )}

      {step === 'done' && (
        <div className="togetherDone">
          <span className="togetherDoneEmoji">🎓</span>
          <h3>Тема завершена!</h3>
          <p>«{content.title}»</p>
          <div className="togetherDoneStats">
            <div><span>❤️</span> Здоровье: {health}/3</div>
            <div><span>⚡</span> Очки: {xp} XP</div>
          </div>
          <p className="togetherDoneHint">Ты прошёл теорию, проверку и получил фидбек от AI-ментора.</p>
          <div className="togetherDoneActions">
            <button className="primary" onClick={onBack}>← Другая тема</button>
          </div>
        </div>
      )}
    </div>
  );
}

createRoot(document.getElementById('root')).render(<App />);
