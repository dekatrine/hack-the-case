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
    {chapter.definition && <p className="definition">{chapter.definition}</p>}
    <div className="skills">
      {chapter.skills.map((s) => <span key={s} className="skill">{s}</span>)}
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

/* ──────────────────────────── Workspace ─────────────────────────────── */
const Workspace = ({ caseText, steps, track, onEvaluate, evaluation, onBack }) => {
  const [activeIdx, setActiveIdx] = useState(0);
  const [answers, setAnswers] = useState({});
  const trackSteps = useMemo(() => getTrackSteps(track, steps), [track, steps]);
  const step = trackSteps[Math.min(activeIdx, trackSteps.length - 1)];
  const activeChapter = getActiveChapter(track, step);

  useEffect(() => {
    if (activeIdx >= trackSteps.length) setActiveIdx(0);
  }, [activeIdx, trackSteps.length]);

  const setAnswer = useCallback((id, val) => {
    setAnswers((prev) => ({ ...prev, [id]: val }));
  }, []);

  return (
    <div className="fade-in">
      <button className="btn btn-ghost" onClick={onBack} style={{ marginBottom: 24 }}>
        ← Изменить параметры
      </button>
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
