import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { createRoot } from 'react-dom/client';
import { api } from './api/client.js';
import './styles.css';

/* ───────────────────────────── Topbar ─────────────────────────────── */
const Topbar = ({ onHome, screen }) => (
  <header className="topbar">
    <div className="brand" onClick={onHome} style={{ cursor: 'pointer' }}>
      <span className="brand-mark">hack the <em>case</em></span>
      <span className="brand-tag">v0.2 · ai sim</span>
    </div>
    <div className="topbar-meta">
      <span><span className="dot" />yandex gpt online</span>
      <span>{screen}</span>
    </div>
  </header>
);

/* ──────────────────────────── Landing ─────────────────────────────── */
const Landing = ({ tracks, onPickTrack }) => (
  <div className="fade-in">
    <div className="eyebrow"><span className="num">01 /</span> Choose your track</div>
    <h1 className="hero">
      Симулятор кейсов,<br/>
      который <em>учит думать</em>,<br/>
      а не угадывать.
    </h1>
    <p className="hero-sub">
      AI-репетитор и встроенный коуч в стиле McKinsey, BCG и FAANG. Два направления —
      продуктовые кейсы для собеседований и бизнес-кейсы для консалтинга. Главы основаны
      на фреймворке CIRCLES и классической консалтинговой воронке.
    </p>
    <div className="tracks">
      {tracks.map((t, i) => (
        <TrackCard key={t.id} track={t} idx={i + 1} onPick={() => onPickTrack(t)} />
      ))}
    </div>
  </div>
);

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
    <div className="skills">
      {chapter.skills.map((s) => <span key={s} className="skill">{s}</span>)}
    </div>
    <div className="outcome">{chapter.outcome}</div>
  </div>
);

/* ──────────────────────────── Workspace ─────────────────────────────── */
const Workspace = ({ caseText, steps, track, onEvaluate, evaluation, onBack }) => {
  const [activeIdx, setActiveIdx] = useState(0);
  const [answers, setAnswers] = useState({});
  const step = steps[activeIdx];

  const setAnswer = useCallback((id, val) => {
    setAnswers((prev) => ({ ...prev, [id]: val }));
  }, []);

  return (
    <div className="fade-in">
      <button className="btn btn-ghost" onClick={onBack} style={{ marginBottom: 24 }}>
        ← Изменить параметры
      </button>
      <div className="workspace">
        <StepsRail steps={steps} activeIdx={activeIdx} answers={answers} onPick={setActiveIdx} />
        <div>
          <div className="case-card">
            <h3>Кейс</h3>
            <div className="case-text">{caseText}</div>
          </div>
          <StepBlock
            step={step}
            idx={activeIdx}
            total={steps.length}
            answer={answers[step.id] || ''}
            onAnswer={(v) => setAnswer(step.id, v)}
            onNext={() => setActiveIdx((i) => Math.min(i + 1, steps.length - 1))}
            onPrev={() => setActiveIdx((i) => Math.max(i - 1, 0))}
            isLast={activeIdx === steps.length - 1}
            onEvaluate={() => onEvaluate(answers)}
          />
          <CoachPanel
            step={step}
            caseText={caseText}
            answer={answers[step.id] || ''}
            previousAnswers={answers}
            trackId={track?.id}
          />
          {evaluation && <EvaluationCard evaluation={evaluation} />}
        </div>
      </div>
    </div>
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

const StepBlock = ({ step, idx, total, answer, onAnswer, onNext, onPrev, isLast, onEvaluate }) => (
  <div className="step-block" key={step.id}>
    <div className="step-meta">
      <span className="idx">step {idx + 1} / {total}</span>
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

/* ──────────────────────────── Root App ─────────────────────────────── */
const App = () => {
  const [config, setConfig] = useState(null);
  const [err, setErr] = useState(null);
  const [screen, setScreen] = useState('landing'); // landing | track | workspace
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

  const screenLabel = { landing: 'home / tracks', track: `track / ${track?.id}`, workspace: 'workspace / live' }[screen];

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

createRoot(document.getElementById('root')).render(<App />);
