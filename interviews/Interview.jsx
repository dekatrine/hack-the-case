import React, { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Check, Clock3, Lock, X } from 'lucide-react';
import { api } from '../api/client.js';
import { track } from '../api/analytics.js';
import { advance, createRun, currentTurn, optionLabel, plan, skeletons, targetEntry } from './engine.js';
import { assessTurn, debrief } from './rubric.js';
import InterviewBrief, { InterviewCondition } from './InterviewBrief.jsx';
import InterviewSetup, { defaultInterviewSettings } from './InterviewSetup.jsx';
import { configuredRun, configuredRemaining, configuredReviewPayload } from './configured.js';
import CaseContent from '../CaseContent.jsx';
import {
  discardLocalDrafts, discardRemoteDrafts, mergeRuns, pullRuns, pushRun,
  readRuns, readSeenRuns, rememberRuns, saveRuns, readDraft, saveDraft, clearDraft,
} from './storage.js';
import './interview.css';

function previousRuns(runs) {
  return [...new Map([...readSeenRuns(), ...runs].map(run => [run.id, run])).values()]
    .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
}

function event(name, run, details = {}) {
  track(name, { schemaVersion: 1, runId: run.id, skeleton: run.skeleton.id, seed: run.seed.id, version: run.skeleton.version, ...details });
}

function Table({ value }) {
  if (!value) return null;
  if (typeof value === 'string') return <p className="iv-data">{value}</p>;
  return <div className="iv-data">
    <strong>{value.title}</strong>
    <table aria-label={value.title}>
      <thead><tr>{value.headers.map(name => <th key={name} scope="col">{name}</th>)}</tr></thead>
      <tbody>{value.rows.map(([first, ...rest]) => <tr key={first}><th scope="row">{first}</th>{rest.map((cell, i) => <td key={i}>{cell}</td>)}</tr>)}</tbody>
    </table>
  </div>;
}

function DecisionMap({ entries }) {
  const latest = entries.filter(entry => !entries.some(other => other.revises === entry.id));
  return latest.length > 0 && <details className="iv-map">
    <summary aria-label="Карта решений"><span>Карта</span>
      {latest.length > 2 && <b>+{latest.length - 2}</b>}
      {latest.slice(-2).map(entry => <b title={entry.value} key={entry.id}>{entry.label} · {entry.value}</b>)}
    </summary>
    <dl>{latest.map(entry => <div key={entry.id}><dt>{entry.label}{entry.revises ? ' · пересмотрено' : ''}</dt><dd>{entry.value}</dd></div>)}</dl>
  </details>;
}

function Drill({ run, result }) {
  const [text, setText] = useState('');
  const [checked, setChecked] = useState(null);
  const target = result.results.filter(row => row.turnId && row.grade < 3).sort((a, b) => a.grade - b.grade)[0];
  const entry = target && run.history.find(item => item.id === target.turnId);
  const move = entry && plan(run.skeleton).find(turn => turn.id === entry.id.replace(/_clarify$/, ''));
  if (!entry || !move) return null;
  const before = Math.round(entry.assessment.grade);
  function check(e) {
    e.preventDefault();
    const { grade, error } = assessTurn(run, move, text, '', []);
    setChecked({ grade, error });
  }
  return <section className="iv-bubble iv-drill" aria-label="Тренировка">
    <span className="iv-tag">Тренировка · {target.label}</span>
    <h2>Перепиши свой ответ из хода «{entry.label.replace(/^Уточнение · /, '')}»</h2>
    <blockquote>{entry.answer}</blockquote>
    <p className="iv-muted">{move.hint}</p>
    <form className="iv-form" onSubmit={check}>
      <textarea value={text} rows={4} maxLength={1200} onChange={e => { setText(e.target.value); setChecked(null); }} placeholder="Новая версия ответа"/>
      <button className="iv-primary" type="submit" disabled={!text.trim()}>Проверить</button>
    </form>
    {checked && <p role="status" className={checked.grade >= 2 && !checked.error ? 'iv-feedback' : 'iv-warning'}>
      {checked.error ? checked.error
        : checked.grade >= 3 ? `Было ${before} из 3, стало 3 из 3. Ответ закрывает все признаки хода.`
        : checked.grade > before ? `Было ${before} из 3, стало ${checked.grade} из 3. Ещё не хватает: ${move.hint.toLowerCase()}`
        : `Пока ${checked.grade} из 3. Попробуй так: ${move.hint.toLowerCase()}`}
    </p>}
  </section>;
}

function Debrief({ run, onNext, onBack, onReview, reviewing, reviewError }) {
  const result = run.configured ? null : debrief(run);
  let evaluated;
  try { evaluated = JSON.parse(run.review?.evaluation || 'null'); } catch { /* Plain text feedback. */ }
  const { seed, skeleton } = run;
  return <>
    <button className="iv-text-button" onClick={onBack}><ArrowLeft size={18}/> Интервью</button>
    <h1>Разбор интервью</h1>
    {result && <><section className="iv-scores" aria-label="Оценки">
      <div><strong>{result.final}</strong><span>Итого из 100</span></div>
      <div><strong>{result.quality}</strong><span>Качество</span></div>
      <div><strong>{result.penalty ? `−${result.penalty}` : '0'}</strong><span>За подсказки</span></div>
    </section>
    <section className="iv-bubble">
      <h2>{skeleton.id === 'discovery' ? 'Что показали данные' : 'Что произошло'}</h2>
      <p>{seed.truth}</p>
      {seed.example && <p>Точка для сравнения с твоим решением — {seed.example.toLowerCase()}.</p>}
    </section></>}
    {run.configured && <section className="iv-bubble">
      <h2>Разбор кейса</h2>
      {Number.isFinite(run.review?.score?.final) && <div className="iv-scores" aria-label="Оценки">
        <div><strong>{run.review.score.final}</strong><span>Итого из 100</span></div>
        <div><strong>{run.review.score.quality}</strong><span>Качество</span></div>
        <div><strong>{run.review.score.hintPenalty ? `−${run.review.score.hintPenalty}` : '0'}</strong><span>За подсказки</span></div>
      </div>}
      {run.review && (evaluated ? <>
        {evaluated.summary && <p>{evaluated.summary}</p>}
        {[['strengths', 'Что получилось'], ['improvements', 'Что улучшить'], ['topTips', 'Что попробовать дальше']].map(([key, title]) =>
          Array.isArray(evaluated[key]) && evaluated[key].length > 0 &&
          <details key={key}><summary>{title}</summary><ul>{evaluated[key].filter(item => typeof item === 'string').map((item, i) => <li key={i}>{item}</li>)}</ul></details>)}
      </> : <CaseContent text={run.review.evaluation}/>)}
      {reviewing && <p role="status">Проверяем решение и аргументы…</p>}
      {reviewError && <p role="alert" className="iv-warning">{reviewError}</p>}
      {!run.review && !reviewing && <button className="iv-text-button" onClick={onReview}>Получить ИИ-разбор</button>}
    </section>}
    <section className="iv-debrief-section">
      <h2>Цепочка решений</h2>
      {skeleton.phases.map(phase => <details key={phase.id}>
        <summary>{phase.label}</summary>
        <ol>{run.history.filter(entry => entry.phase === phase.id).map(entry => <li id={`iv-answer-${entry.id}`} key={entry.id}>
          <strong>{entry.label}</strong>
          <p>{entry.choice === entry.answer ? (entry.choiceLabel || entry.answer) : <>{entry.choice && <strong>{entry.choiceLabel || entry.choice} · </strong>}{entry.answer}</>}</p>
          {entry.targetQuote && <small>Опирается на ответ «{entry.targetQuote}»</small>}
          {run.map.some(item => item.id === entry.id && item.revises) && <small>Выбор пересмотрен</small>}
        </li>)}</ol>
      </details>)}
    </section>
    {result && <><section className="iv-debrief-section">
      <h2>Оценка по критериям</h2>
      {result.results.map(row => <details key={row.id}>
        <summary>{row.label}<b>{Number(row.grade.toFixed(1))} / 3</b></summary>
        {row.quote && <blockquote>{row.quote}</blockquote>}
        <small>Связанный навык · {row.practice}</small>
      </details>)}
    </section>
    {result.errors.length > 0 && <section className="iv-bubble iv-warning"><h2>Сверка с данными</h2>
      {result.errors.map(entry => <div key={entry.id}><blockquote>{entry.answer}</blockquote><p>{entry.assessment.error}</p></div>)}
    </section>}
    <section className="iv-bubble"><h2>Как усилить решение</h2><p>{result.recommendation}</p></section>
    <Drill run={run} result={result}/></>}
    <button className="iv-primary" onClick={onNext}>Следующий кейс <ArrowRight size={18}/></button>
  </>;
}

function shuffled(list, key) {
  let h = 2166136261;
  for (const ch of key) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  const rand = () => { h = Math.imul(h ^ (h >>> 15), 2246822507); h ^= h >>> 13; return (h >>> 0) / 4294967296; };
  const out = [...list];
  for (let i = out.length - 1; i > 0; i -= 1) { const j = Math.floor(rand() * (i + 1)); [out[i], out[j]] = [out[j], out[i]]; }
  return out;
}

export default function Interview({ onExit, start: startOptions }) {
  const [runs, setRuns] = useState(() => {
    const draft = readDraft();
    return draft ? [draft, ...readRuns()] : readRuns();
  });
  const [confirmLeave, setConfirmLeave] = useState(false);
  const [id, setId] = useState(null);
  const [sessionSeconds, setSessionSeconds] = useState(0);
  const [saveError, setSaveError] = useState(false);
  const [turnError, setTurnError] = useState('');
  const [preparing, setPreparing] = useState(false);
  const [setup, setSetup] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [generationError, setGenerationError] = useState('');
  const [reviewing, setReviewing] = useState(null);
  const [reviewError, setReviewError] = useState(null);
  const generationLock = useRef(false);
  const reviewLock = useRef(false);
  const runsRef = useRef(runs);
  const started = useRef(null);
  const heading = useRef(null);
  const run = runs.find(item => item.id === id);
  const move = currentTurn(run);

  function setAll(next, persist = true) {
    runsRef.current = next;
    setRuns(next);
    if (!persist) return;
    try { saveRuns(next); setSaveError(false); }
    catch { setSaveError(true); }
  }

  function save(item) {
    const existing = runsRef.current.find(entry => entry.id === item.id);
    const nextItem = { ...item, updatedAt: Math.max(Date.now(), (existing?.updatedAt || 0) + 1) };
    const finished = nextItem.status === 'finished';
    setAll([nextItem, ...runsRef.current.filter(entry => entry.id !== item.id)], finished);
    if (!existing) {
      try { rememberRuns([nextItem]); }
      catch { setSaveError(true); }
    }
    try { saveDraft(nextItem); }
    catch { setSaveError(true); }
    if (finished) pushRun(nextItem).catch(() => {});
    return nextItem;
  }

  useEffect(() => {
    let mounted = true;
    try { discardLocalDrafts(); }
    catch { setSaveError(true); }
    discardRemoteDrafts().catch(() => {});
    pullRuns().then(remote => {
      if (!mounted) return;
      const next = mergeRuns(runsRef.current, remote);
      setAll(next);
      for (const item of next.slice(0, 5)) pushRun(item).catch(() => {});
    }).catch(() => {});
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    if (!startOptions) return;
    if (startOptions.open) {
      const item = runsRef.current.find(entry => entry.id === startOptions.open);
      if (item) setId(item.id);
    } else if (startOptions.skeleton) {
      const skeleton = skeletons.find(entry => entry.id === startOptions.skeleton);
      if (skeleton) select(skeleton);
    }
  }, []);

  useEffect(() => {
    setTurnError('');
    heading.current?.focus({ preventScroll: true });
  }, [id, move?.id, run?.status]);

  useEffect(() => {
    if (run?.status !== 'active') return;
    function checkpoint() {
      const current = runsRef.current.find(item => item.id === id);
      if (started.current === null || current?.status !== 'active') return;
      save({ ...current, elapsed: current.elapsed + Math.max(0, Date.now() - started.current) });
      started.current = null;
    }
    function setVisibility() {
      if (document.hidden) checkpoint();
      else started.current = Date.now();
      setSessionSeconds(0);
    }
    setVisibility();
    const timer = setInterval(() => {
      if (started.current !== null) setSessionSeconds(Math.floor((Date.now() - started.current) / 1000));
    }, 500);
    document.addEventListener('visibilitychange', setVisibility);
    return () => {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', setVisibility);
      started.current = null;
    };
  }, [id, run?.status]);

  useEffect(() => {
    if (run?.status !== 'briefing' || run.storyUsage || run.configured) return;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2800);
    let mounted = true;
    setPreparing(true);
    Promise.resolve().then(() => api.interviewStory({ type: run.skeleton.id, industry: run.seed.industry, transaction: run.seed.transaction }, controller.signal))
      .catch(() => ({ story: '', usage: { input: 0, output: 0, cost: null } }))
      .then(({ story, usage }) => {
        if (!mounted) return;
        const current = runsRef.current.find(item => item.id === id);
        if (current?.status === 'briefing') save({ ...current, story, storyUsage: usage });
        setPreparing(false);
      });
    return () => { mounted = false; clearTimeout(timeout); controller.abort(); };
  }, [id, run?.status, Boolean(run?.storyUsage)]);

  function select(skeleton) {
    const item = save(createRun(skeleton, previousRuns(runsRef.current)));
    setId(item.id);
  }

  async function generate(settings, directionLabel) {
    if (generationLock.current) return;
    generationLock.current = true;
    setGenerating(true);
    setGenerationError('');
    try {
      const previous = previousRuns(runsRef.current).filter(item => item.configured);
      const sameIndustry = previous.filter(item => item.settings.industry === settings.industry);
      const sameDirection = previous.filter(item => item.settings.interviewType === settings.interviewType);
      const relevant = [...new Set([...sameIndustry, ...sameDirection])].slice(0, 12);
      const result = await api.generate({
        ...settings, trackId: 'product', mvp: true, detailedInterview: true,
        recentCases: relevant.map(item => item.seed.intro?.slice(0, 2000)).filter(Boolean),
        seenVariants: [...new Set(sameDirection.map(item => item.configured.variantId).filter(Boolean))],
        seenFingerprints: [...new Set([...sameIndustry, ...sameDirection].slice(0, 80).flatMap(item => item.configured.fingerprints))],
      });
      const item = save(configuredRun(result, settings, directionLabel));
      setSetup(null);
      setId(item.id);
      window.scrollTo({ top: 0, behavior: 'auto' });
    } catch (error) {
      setGenerationError(error.message || 'Не удалось создать интервью. Попробуй ещё раз.');
    } finally {
      generationLock.current = false;
      setGenerating(false);
    }
  }

  async function review(item) {
    if (reviewLock.current || item.review) return;
    reviewLock.current = true;
    setReviewing(item.id);
    setReviewError(null);
    try {
      const { evaluation, score } = await api.evaluate(configuredReviewPayload(item));
      if (!evaluation?.trim()) throw new Error('Разбор не получился. Попробуй ещё раз.');
      const current = runsRef.current.find(entry => entry.id === item.id);
      if (current) save({ ...current, review: { evaluation, score } });
    } catch (error) {
      setReviewError({ id: item.id, message: error.message || 'Не удалось получить разбор. Ответы сохранены.' });
    } finally {
      reviewLock.current = false;
      setReviewing(null);
    }
  }

  function openSetup(settings = defaultInterviewSettings) {
    setGenerationError('');
    setId(null);
    setSetup(settings);
    window.scrollTo({ top: 0, behavior: 'auto' });
  }

  function shown(item) {
    const next = item.queue[0];
    if (next) event('turn_shown', item, { turn: item.history.length + 1, move: next.kind, phase: next.phase });
  }

  function start() {
    const item = save({ ...run, status: 'active' });
    window.scrollTo({ top: 0, behavior: 'auto' });
    event('case_started', item);
    shown(item);
  }

  function open(item) {
    setId(item.id);
    window.scrollTo({ top: 0, behavior: 'auto' });
    if (item.status === 'finished') event('debrief_opened', item);
  }

  useEffect(() => {
    if (!run || run.status === 'finished') return;
    const onRestore = event => {
      if (event.persisted) leave();
    };
    window.addEventListener('pageshow', onRestore);
    return () => window.removeEventListener('pageshow', onRestore);
  }, [id, run?.status]);

  function leave() {
    if (run && run.status !== 'finished') {
      const current = runsRef.current.find(item => item.id === run.id) || run;
      if (started.current !== null) save({ ...current, elapsed: current.elapsed + Math.max(0, Date.now() - started.current) });
      started.current = null;
      // Начатое интервью остаётся черновиком на 24 часа, пустое убираем.
      if (!current.history.length) {
        setAll(runsRef.current.filter(item => item.id !== run.id), false);
        try { clearDraft(run.id); } catch { /* ignore */ }
      }
      event('case_abandoned', run);
    }
    setConfirmLeave(false);
    setId(null);
    window.scrollTo({ top: 0, behavior: 'auto' });
  }

  function edit(patch) {
    const current = runsRef.current.find(item => item.id === run.id);
    if (current) save({ ...current, ...patch });
  }

  function useHint() {
    save({ ...run, hints: { ...run.hints, [move.id]: true } });
    event('hint_used', run, { turn: move.id, type: 'structure', penalty: 1 });
  }

  function submit(e) {
    e.preventDefault();
    const current = runsRef.current.find(item => item.id === run.id);
    if (current.queue[0]?.id !== move.id) return;
    const elapsed = started.current === null ? 0 : Date.now() - started.current;
    const item = advance(current, current.draft, current.choice, elapsed);
    if (item.requestError) { setTurnError(item.requestError); return; }
    if (item === current) return;
    started.current = document.hidden ? null : Date.now();
    setSessionSeconds(0);
    save(item);
    window.scrollTo({ top: 0, behavior: 'auto' });
    const entry = item.history.at(-1);
    event('turn_answered', item, { turn: entry.id, length: entry.answer.length, elapsedMs: elapsed, targetId: entry.targetId, grade: entry.assessment?.grade });
    for (const clue of entry.opened) event('data_requested', item, { clue });
    if (entry.kind === 'CHALLENGE') event('challenge_answered', item, { targetId: entry.targetId, revised: !!item.map.find(row => row.id === entry.id)?.revises });
    if (item.status === 'finished') {
      if (item.configured) {
        event('case_finished', item);
        review(item);
      } else {
        const { final, quality, penalty } = debrief(item);
        event('case_finished', item, { final, quality, penalty, inputTokens: item.storyUsage?.input || 0, outputTokens: item.storyUsage?.output || 0, costRub: item.storyUsage?.cost ?? null });
      }
      event('debrief_opened', item);
    } else shown(item);
  }

  const selected = move && targetEntry(run, move);
  const phaseIndex = run && move ? run.skeleton.phases.findIndex(phase => phase.id === move.phase) : 0;
  const seconds = run ? Math.max(0, run.skeleton.minutes * 60 - Math.floor(run.elapsed / 1000) - sessionSeconds) : 0;
  const clock = `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
  const priorData = run?.configured ? run.history
    .map(entry => run.configured.graph[entry.id])
    .filter(step => step?.caseEvidence && step.caseEvidence !== move?.caseEvidence) : [];
  const finishedRuns = runs.filter(item => item.status === 'finished');
  const draftRun = runs.find(item => item.status !== 'finished' && item.status !== 'briefing' && item.history.length > 0 && Date.now() - item.updatedAt < 24 * 3600 * 1000);
  const remaining = run?.configured ? configuredRemaining(run) : run?.queue.length;
  const rawOptions = move?.options === 'segments' ? run.seed.groups : move?.options;
  // Порядок вариантов зависит от попытки и хода, а не от того, какой из них верный.
  const options = rawOptions && !run?.configured ? shuffled(rawOptions, `${run.id}:${move.id}`) : rawOptions;

  return <div className="iv-shell"><div className="iv-panel">
    {saveError && <p role="alert" className="iv-warning">Не удалось сохранить историю в браузере.</p>}
    {setup && <InterviewSetup presets={skeletons} onPreset={skeleton => { setSetup(null); select(skeleton); }} initial={setup} busy={generating} error={generationError} onGenerate={generate} onBack={() => setSetup(null)}/>}
    {!run && !setup && <>
      <button className="iv-text-button" onClick={onExit}><ArrowLeft size={18}/> Мои кейсы</button>
      <h1 ref={heading} tabIndex={-1}>Кейс-интервью</h1>
      {draftRun && <section className="iv-menu iv-resume">
        <h2>Продолжить собес</h2>
        <button type="button" className="iv-card" onClick={() => open(draftRun)}>
          <span><strong>{draftRun.configured ? draftRun.skeleton.title : draftRun.skeleton.label}</strong><small>Ход {draftRun.history.length + 1} · {draftRun.seed.industry.split(' / ').at(-1)}</small></span><ArrowRight size={17}/>
        </button>
      </section>}
      <section className="iv-menu iv-new-interview">
        <h2>Новое интервью</h2>
        <button type="button" className="iv-primary" onClick={() => openSetup()}>
          Настроить своё интервью <ArrowRight size={18}/>
        </button>
        <div className="iv-ready" aria-label="Готовые сценарии">
          {skeletons.map(skeleton => <button type="button" className="iv-card" key={skeleton.id} onClick={() => select(skeleton)}>
            <span><strong>{skeleton.label}</strong><small>Около {skeleton.minutes} мин</small></span><ArrowRight size={17}/>
          </button>)}
        </div>
      </section>
      {finishedRuns.length > 0 && <details className="iv-menu iv-review-history">
        <summary>Прошлые разборы <span>{finishedRuns.length}</span></summary>
        <div className="iv-ready">
          {finishedRuns.map(item => <button type="button" className="iv-card" key={item.id} onClick={() => open(item)}>
            <span><strong>{item.configured ? item.skeleton.title : item.skeleton.label}</strong><small>{item.seed.industry.split(' / ').at(-1)}</small></span>
            <ArrowRight size={17}/>
          </button>)}
        </div>
      </details>}
    </>}
    {run?.status === 'briefing' && <>
      <button className="iv-text-button" onClick={leave}><ArrowLeft size={18}/> Интервью</button>
      <h1 ref={heading} tabIndex={-1}>{run.skeleton.title}</h1>
      <div className="iv-person"><span>{run.seed.profile[0]}</span><div><strong>{run.seed.profile}</strong><small>Интервьюер · {run.seed.industry}</small></div></div>
      <InterviewBrief run={run}/>
      {run.configured && <p className="iv-muted">{run.skeleton.label} · {run.settings.difficulty}</p>}
      <h2>Фазы интервью</h2>
      <ol className="iv-phases">{run.skeleton.phases.map(phase => <li key={phase.id}>{phase.label}</li>)}</ol>
      <p className="iv-muted">{run.configured ? `Около ${remaining} ходов. Вопросы и данные зависят от твоего выбора.` : `${plan(run.skeleton).length} ходов по плану. Вопросы меняются по ходу интервью.`}</p>
      <p className="iv-muted">Если выйти, ответы сохранятся на 24 часа.</p>
      {preparing && !run.configured && <div className="iv-loading" role="status">Готовим брифинг…</div>}
      <button className="iv-primary" onClick={start} disabled={preparing && !run.configured}>Начать интервью <ArrowRight size={18}/></button>
    </>}
    {run?.status === 'active' && move && <>
      <div className="iv-progress"><button aria-label="Выйти из интервью" onClick={() => run.history.length ? setConfirmLeave(true) : leave()}><X size={18}/></button><strong>Ход {run.history.length + 1} из {run.history.length + remaining}</strong><span aria-label="Осталось времени"><Clock3 size={15}/> {clock}</span></div>
      {confirmLeave && <div className="iv-bubble iv-confirm" role="alertdialog" aria-label="Выйти из собеса?">
        <h2>Выйти из собеса?</h2>
        <p className="iv-muted">Ответы сохранятся на 24 часа. Продолжишь с хода {run.history.length + 1}.</p>
        <button type="button" className="iv-primary" onClick={() => setConfirmLeave(false)}>Остаться</button>
        <button type="button" className="iv-card" onClick={leave}>Выйти и сохранить</button>
      </div>}
      <div className="iv-phase-status"><span>Фаза {phaseIndex + 1} из {run.skeleton.phases.length} · {run.skeleton.phases[phaseIndex].label}</span><div aria-hidden="true">{run.skeleton.phases.map((phase, i) => <i className={i <= phaseIndex ? 'iv-phase-on' : ''} key={phase.id}/>)}</div></div>
      <div className="iv-turn-context">
        <InterviewCondition key={move.id} run={run}/>
      </div>
      {seconds === 0 && <p className="iv-muted">Плановое время вышло. Можно закончить без штрафа.</p>}
      {run.lastReply && <div className="iv-bubble" role="status">{run.lastReply}</div>}
      {run.history.at(-1)?.opened.length > 0 && <p className="iv-feedback" role="status"><Check size={16}/> Улика открыта и добавлена в карту</p>}
      {run.history.at(-1)?.assessment?.error && <p className="iv-warning" role="status">{run.history.at(-1).assessment.error}</p>}
      <div className={move.kind === 'CHALLENGE' ? 'iv-bubble iv-challenge' : 'iv-bubble'}>
        {['ASK', 'DATA', 'DEMAND'].includes(move.kind) && <div className="iv-who"><span aria-hidden="true">{run.seed.profile[0]}</span><small>{run.seed.profile} · интервьюер</small></div>}
        {['CHALLENGE', 'CLARIFY'].includes(move.kind) && <span className="iv-tag">Уточнение интервьюера</span>}
        {move.kind === 'TWIST' && <span className="iv-tag">Новое условие</span>}
        {selected && <blockquote>{selected.value !== selected.quote && !selected.quote.startsWith(selected.value.replace(/…$/, '')) && <strong>{selected.value} · </strong>}«{selected.quote}»</blockquote>}
        {move.kind === 'TWIST' && !run.configured && <p>{run.seed.twist}</p>}
        <h1 className="iv-question" ref={heading} tabIndex={-1}>{move.prompt}</h1>
        {move.answerFormat && <p className="iv-answer-format" id="iv-answer-format">
          <strong>{options ? 'Как выбрать. ' : 'Что написать. '}</strong>{move.answerFormat}
        </p>}
      </div>
      {move.scene && run.configured && <div className="iv-data"><CaseContent text={move.scene}/></div>}
      {move.caseEvidence && <section className="iv-data" aria-label="Данные по твоему запросу"><CaseContent text={move.caseEvidence}/></section>}
      {priorData.length > 0 && <details className="iv-opened"><summary>Открытые данные ({priorData.length})</summary>
        {priorData.map(step => <section className="iv-data" key={step.id}><CaseContent text={step.caseEvidence}/></section>)}
      </details>}
      <Table value={run.seed.scenes[move.scene || move.public]}/>
      {run.seed.clues.filter(clue => move.evidence?.includes(clue.id) && !run.opened.includes(clue.id)).map(clue =>
        <p className="iv-locked" key={clue.id}><Lock size={15}/> {clue.title}</p>)}
      {run.opened.length > 0 && <details className="iv-opened" open={run.history.at(-1)?.opened.length > 0 || undefined}><summary>Открытые улики ({run.opened.length})</summary>
        {run.seed.clues.filter(clue => run.opened.includes(clue.id)).map(clue => <Table key={clue.id} value={clue}/>)}
      </details>}
      <DecisionMap entries={run.map}/>
      <form className="iv-form iv-turn-form" onSubmit={submit}>
        {options && <fieldset aria-describedby={move.answerFormat ? 'iv-answer-format' : undefined}><legend>{run.configured || move.justify ? 'Выбери один вариант' : 'Выбери один вопрос'}</legend>{options.map(option =>
          <button type="button" key={option} aria-pressed={run.choice === option} onClick={() => edit({ choice: option })}>{optionLabel(move, option)}</button>)}</fieldset>}
        {(!options || move.justify || run.hints[move.id]) && <label> {move.justify ? 'Почему этот вариант?' : move.evidence ? 'Какие данные запросишь?' : 'Твой ответ'}
          <textarea aria-describedby={move.answerFormat ? 'iv-answer-format' : undefined} value={run.draft} rows={3} maxLength={1200} onChange={e => edit({ draft: e.target.value })} placeholder={move.evidence ? 'Напиши, что с чем сравнить' : 'Ответь своими словами'}/>
        </label>}
        {turnError && <p role="alert" className="iv-warning">{turnError}</p>}
        {run.hints[move.id] ? <p className="iv-hint">{move.hint} <small>−1 балл к итогу</small></p>
          : move.kind !== 'CLARIFY' && (!run.configured || (move.hint && move.hint !== move.answerFormat)) && <button className="iv-text-button" type="button" onClick={useHint}>Не знаю, с чего начать</button>}
        <button className="iv-primary" type="submit" disabled={move.justify ? !run.choice || !run.draft.trim() : !run.choice && !run.draft.trim()}>
          {move.kind === 'DEMAND' ? 'Завершить интервью' : move.kind === 'DATA' && move.evidence ? 'Запросить данные' : options && !move.justify ? (run.configured ? 'Подтвердить выбор' : 'Спросить') : 'Ответить'} <ArrowRight size={18}/>
        </button>
      </form>
    </>}
    {run?.status === 'finished' && <Debrief run={run} onBack={leave} onReview={() => review(run)} reviewing={reviewing === run.id} reviewError={reviewError?.id === run.id ? reviewError.message : ''}
      onNext={() => { event('next_case_clicked', run); if (run.configured) openSetup(run.settings); else select(run.skeleton); }}/>}
  </div></div>;
}
