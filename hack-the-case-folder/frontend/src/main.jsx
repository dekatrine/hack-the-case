import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { askCoach, evaluateCase, fetchConfig, generateCase } from './api/client';
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
    </main>
  );
}

function StartPage(props) {
  const difficultyKeys = Object.keys(props.config.difficultyLevels);

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
        <button className="primary" onClick={props.onGenerate} disabled={props.loading}>Сгенерировать кейс</button>
      </div>

      <div className="panel">
        <h2>Твой кейс</h2>
        {props.caseText ? (
          <>
            <MarkdownText text={props.caseText} />
            <button className="primary" onClick={props.onStart}>Начать решение</button>
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
  const progress = props.steps.length ? Math.round((props.completedCount / props.steps.length) * 100) : 0;

  function sendCoachMessage(message) {
    props.onAskCoach(message);
    setCoachInput('');
  }

  return (
    <section className="workspace">
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

      <div className="panel work">
        <p className="eyebrow">Этап {props.currentStepIndex + 1} из {props.steps.length}</p>
        <h2>{props.currentStep.title}</h2>
        <p>{props.currentStep.description}</p>
        <div className="hintBox">{props.currentStep.caseHint}</div>
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
        <button className="primary" onClick={props.onNext}>
          {props.currentStepIndex < props.steps.length - 1 ? 'Следующий этап' : 'Завершить'}
        </button>
      </div>

      <div className="sideColumn">
        <CaseReference caseText={props.caseText} />

        <div className="panel coach">
          <h2>AI Coach</h2>
          <div className="coachIntro">
            <b>Можно спрашивать как у поисковика по кейсу.</b>
            <p>Коуч объяснит термины, найдёт нужные данные в условии, подскажет фреймворк, проверит логику и поможет сформулировать следующий шаг.</p>
          </div>
          <div className="chat">
            {props.chat.length === 0 && (
              <div className="emptyCoach">
                <p>Напиши вопрос простыми словами: «что такое MECE?», «какие данные взять из кейса?», «как начать этот блок?».</p>
              </div>
            )}
            {props.chat.map((message, index) => (
              <div key={`${message.role}-${index}`} className={`message ${message.role}`}>
                <b>{message.role === 'coach' ? 'Coach' : 'Ты'}</b>
                <p>{message.text}</p>
              </div>
            ))}
          </div>
          <div className="quick">
            <button onClick={() => sendCoachMessage('Объясни простыми словами термины и фреймворки этого этапа.')}>Объясни термины</button>
            <button onClick={() => sendCoachMessage('Какие данные из условия кейса полезны для этого этапа?')}>Найди данные</button>
            <button onClick={() => sendCoachMessage('Задай 3 наводящих вопроса для этого этапа.')}>3 вопроса</button>
            <button onClick={() => sendCoachMessage('Проверь логику и связь моего ответа с кейсом.')}>Проверить логику</button>
            <button onClick={() => sendCoachMessage('Подскажи следующий шаг, не давая готового решения.')}>Следующий шаг</button>
          </div>
          <div className="ask">
            <input
              value={coachInput}
              onChange={(event) => setCoachInput(event.target.value)}
              placeholder="Спроси коуча"
            />
            <button onClick={() => coachInput.trim() && sendCoachMessage(coachInput)}>Отправить</button>
          </div>
        </div>
      </div>
    </section>
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
  if (!theory) return null;

  return (
    <section className="learning">
      <div>
        <p className="sectionLabel">Теория блока</p>
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
        <div>
          <span>Пример</span>
          <p>{theory.example}</p>
        </div>
        <div>
          <span>Как оформить ответ</span>
          <p>{theory.answerTemplate}</p>
        </div>
        <div>
          <span>Типичная ошибка</span>
          <p>{theory.commonMistake}</p>
        </div>
      </div>
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

createRoot(document.getElementById('root')).render(<App />);
