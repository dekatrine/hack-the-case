import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { askCoach, evaluateCase, fetchConfig, generateCase } from './api/client';
import { QUIZ_CATEGORIES, QUIZ_QUESTIONS } from './quizData';
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
      const data = await generateCase({ industry, difficulty, extraContext });
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
    </main>
  );
}

function StartPage(props) {
  const difficultyKeys = Object.keys(props.config.difficultyLevels);
  const casePanelRef = useRef(null);

  useEffect(() => {
    if (props.caseText) {
      casePanelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [props.caseText]);

  return (
    <section className="grid two">
      <div className="panel">
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

createRoot(document.getElementById('root')).render(<App />);
