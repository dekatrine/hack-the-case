import React, { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Check, Clock3, Lock, X } from 'lucide-react';
import { api } from '../api/client.js';
import { track } from '../api/analytics.js';
import { advance, createRun, currentTurn, plan, skeletons, targetEntry } from './engine.js';
import { debrief } from './rubric.js';
import { mergeRuns, pullRuns, pushRun, readRuns, saveRuns } from './storage.js';
import './interview.css';

const upcoming = ['Эксперименты', 'Приоритизация и стратегия', 'Рынок и экономика'];

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

function Map({ entries }) {
  const latest = entries.filter(entry => !entries.some(other => other.revises === entry.id));
  return latest.length > 0 && <details className="iv-map">
    <summary aria-label="Карта решений"><span>Карта</span>
      {latest.length > 2 && <b>+{latest.length - 2}</b>}
      {latest.slice(-2).map(entry => <b title={entry.value} key={entry.id}>{entry.label} · {entry.value}</b>)}
    </summary>
    <dl>{latest.map(entry => <div key={entry.id}><dt>{entry.label}{entry.revises ? ' · пересмотрено' : ''}</dt><dd>{entry.value}</dd></div>)}</dl>
  </details>;
}

function Debrief({ run, onNext, onBack }) {
  const result = debrief(run);
  const { seed, skeleton } = run;
  return <>
    <button className="iv-text-button" onClick={onBack}><ArrowLeft size={18}/> Интервью</button>
    <h1>Разбор интервью</h1>
    <section className="iv-scores" aria-label="Оценки">
      <div><strong>{result.final}</strong><span>Итого из 100</span></div>
      <div><strong>{result.quality}</strong><span>Качество</span></div>
      <div><strong>{result.penalty ? `−${result.penalty}` : '0'}</strong><span>За подсказки</span></div>
    </section>
    <section className="iv-bubble">
      <h2>{skeleton.id === 'discovery' ? 'Что показали данные' : 'Что произошло'}</h2>
      <p>{seed.truth}</p>
      {seed.example && <p>Точка для сравнения с твоим решением — {seed.example.toLowerCase()}.</p>}
    </section>
    <section className="iv-debrief-section">
      <h2>Цепочка решений</h2>
      {skeleton.phases.map(phase => <details key={phase.id}>
        <summary>{phase.label}</summary>
        <ol>{run.history.filter(entry => entry.phase === phase.id).map(entry => <li id={`iv-answer-${entry.id}`} key={entry.id}>
          <strong>{entry.label}</strong>
          <p>{entry.choice && entry.choice !== entry.answer && <strong>{entry.choice} · </strong>}{entry.answer}</p>
          {entry.targetQuote && <small>Опирается на ответ «{entry.targetQuote}»</small>}
          {run.map.some(item => item.id === entry.id && item.revises) && <small>Выбор пересмотрен</small>}
        </li>)}</ol>
      </details>)}
    </section>
    <section className="iv-debrief-section">
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
    <button className="iv-primary" onClick={onNext}>Следующий кейс <ArrowRight size={18}/></button>
  </>;
}

export default function Interview({ onExit }) {
  const [runs, setRuns] = useState(readRuns);
  const [id, setId] = useState(null);
  const [sessionSeconds, setSessionSeconds] = useState(0);
  const [saveError, setSaveError] = useState(false);
  const [turnError, setTurnError] = useState('');
  const [preparing, setPreparing] = useState(false);
  const runsRef = useRef(runs);
  const started = useRef(null);
  const persistedDraft = useRef(null);
  const heading = useRef(null);
  const run = runs.find(item => item.id === id);
  const move = currentTurn(run);

  function setAll(next) {
    runsRef.current = next;
    setRuns(next);
    try { saveRuns(next); setSaveError(false); }
    catch { setSaveError(true); }
  }

  function save(item, online = true) {
    const existing = runsRef.current.find(entry => entry.id === item.id);
    const nextItem = { ...item, updatedAt: Math.max(Date.now(), (existing?.updatedAt || 0) + 1) };
    setAll([nextItem, ...runsRef.current.filter(entry => entry.id !== item.id)]);
    if (online) pushRun(nextItem).catch(() => {});
    return nextItem;
  }

  useEffect(() => {
    let mounted = true;
    pullRuns().then(remote => {
      if (!mounted) return;
      const next = mergeRuns(runsRef.current, remote);
      setAll(next);
      for (const item of next.slice(0, 5)) pushRun(item).catch(() => {});
    }).catch(() => {});
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    setTurnError('');
    heading.current?.focus();
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
    window.addEventListener('pagehide', checkpoint);
    return () => {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', setVisibility);
      window.removeEventListener('pagehide', checkpoint);
      checkpoint();
      clearTimeout(persistedDraft.current);
    };
  }, [id, run?.status]);

  useEffect(() => {
    if (run?.status !== 'briefing' || run.storyUsage) return;
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
    const sorted = [...runsRef.current].sort((a, b) => b.createdAt - a.createdAt);
    const item = save(createRun(skeleton, sorted));
    setId(item.id);
  }

  function shown(item) {
    const next = item.queue[0];
    if (next) event('turn_shown', item, { turn: item.history.length + 1, move: next.kind, phase: next.phase });
  }

  function start() {
    const item = save({ ...run, status: 'active' });
    event('case_started', item);
    shown(item);
  }

  function open(item) {
    setId(item.id);
    if (item.status === 'active') { event('resumed', item); shown(item); }
    if (item.status === 'finished') event('debrief_opened', item);
  }

  function pause(exit = false) {
    if (run?.status === 'active') {
      const elapsed = started.current === null ? 0 : Date.now() - started.current;
      started.current = null;
      save({ ...run, elapsed: run.elapsed + elapsed });
      event('paused', run);
    }
    if (exit) onExit();
    else setId(null);
  }

  function edit(patch) {
    const snapshot = save({ ...run, ...patch }, false);
    clearTimeout(persistedDraft.current);
    persistedDraft.current = setTimeout(() => pushRun(snapshot).catch(() => {}), 800);
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
    clearTimeout(persistedDraft.current);
    save(item);
    window.scrollTo({ top: 0, behavior: 'auto' });
    const entry = item.history.at(-1);
    event('turn_answered', item, { turn: entry.id, length: entry.answer.length, elapsedMs: elapsed, targetId: entry.targetId, grade: entry.assessment.grade });
    for (const clue of entry.opened) event('data_requested', item, { clue });
    if (entry.kind === 'CHALLENGE') event('challenge_answered', item, { targetId: entry.targetId, revised: !!item.map.find(row => row.id === entry.id)?.revises });
    if (item.status === 'finished') {
      const { final, quality, penalty } = debrief(item);
      event('case_finished', item, { final, quality, penalty, inputTokens: item.storyUsage?.input || 0, outputTokens: item.storyUsage?.output || 0, costRub: item.storyUsage?.cost ?? null });
      event('debrief_opened', item);
    } else shown(item);
  }

  const selected = move && targetEntry(run, move);
  const phaseIndex = run && move ? run.skeleton.phases.findIndex(phase => phase.id === move.phase) : 0;
  const seconds = run ? Math.max(0, run.skeleton.minutes * 60 - Math.floor(run.elapsed / 1000) - sessionSeconds) : 0;
  const clock = `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
  const options = move?.options === 'segments' ? run.seed.groups : move?.options;

  return <div className="iv-shell"><div className="iv-panel">
    {saveError && <p role="alert" className="iv-warning">Не удалось сохранить черновик в браузере.</p>}
    {!run && <>
      <button className="iv-text-button" onClick={onExit}><ArrowLeft size={18}/> Мои кейсы</button>
      <h1 ref={heading} tabIndex={-1}>Кейс-интервью</h1>
      {runs.length > 0 && <section className="iv-menu"><h2>Твои интервью</h2>
        {runs.map(item => <button className="iv-card" key={item.id} onClick={() => open(item)}>
          <span><strong>{item.skeleton.label}</strong><small>{item.seed.industry} · {item.status === 'finished' ? 'Разбор' : item.status === 'briefing' ? 'Брифинг' : `Продолжить с хода ${item.history.length + 1}`}</small></span><ArrowRight size={18}/>
        </button>)}
      </section>}
      <section className="iv-menu"><h2>Новое интервью</h2>
        {skeletons.map(skeleton => <button className="iv-card" key={skeleton.id} onClick={() => select(skeleton)}>
          <span><strong>{skeleton.label}</strong><small>{skeleton.min}–{skeleton.max} ходов · около {skeleton.minutes} мин</small></span><ArrowRight size={18}/>
        </button>)}
        {upcoming.filter(label => !skeletons.some(skeleton => skeleton.label === label)).map(label => <div className="iv-card iv-upcoming" key={label}><span><strong>{label}</strong><small>Следующий этап</small></span><Lock size={17}/></div>)}
      </section>
    </>}
    {run?.status === 'briefing' && <>
      <button className="iv-text-button" onClick={() => pause()}><ArrowLeft size={18}/> Интервью</button>
      <h1 ref={heading} tabIndex={-1}>{run.skeleton.title}</h1>
      <div className="iv-person"><span>{run.seed.profile[0]}</span><div><strong>{run.seed.profile}</strong><small>Интервьюер · {run.seed.industry}</small></div></div>
      <div className="iv-bubble">{run.seed.intro}{run.story && <p>{run.story}</p>}</div>
      <h2>Фазы интервью</h2>
      <ol className="iv-phases">{run.skeleton.phases.map(phase => <li key={phase.id}>{phase.label}</li>)}</ol>
      <p className="iv-muted">{plan(run.skeleton).length} ходов по плану. Вопросы меняются по ходу интервью.</p>
      <p className="iv-muted">Запрашивай данные и защищай выбор. Можно сделать паузу.</p>
      {preparing && <div className="iv-loading" role="status">Готовим брифинг…</div>}
      <button className="iv-primary" onClick={start} disabled={preparing}>Начать интервью <ArrowRight size={18}/></button>
    </>}
    {run?.status === 'active' && move && <>
      <div className="iv-progress"><button aria-label="Пауза" onClick={() => pause()}><X size={18}/></button><strong>Ход {run.history.length + 1} из {run.history.length + run.queue.length}</strong><span aria-label="Осталось времени"><Clock3 size={15}/> {clock}</span></div>
      <div className="iv-phase-status"><span>Фаза {phaseIndex + 1} из {run.skeleton.phases.length} · {run.skeleton.phases[phaseIndex].label}</span><div aria-hidden="true">{run.skeleton.phases.map((phase, i) => <i className={i <= phaseIndex ? 'iv-phase-on' : ''} key={phase.id}/>)}</div></div>
      <details className="iv-condition" open={run.history.length === 0}>
        <summary>Условие кейса</summary>
        <div className="iv-condition-content">
          <p>{run.seed.intro}</p>
          {run.story && <p>{run.story}</p>}
        </div>
      </details>
      <Map entries={run.map}/>
      {seconds === 0 && <p className="iv-muted">Плановое время вышло. Можно закончить без штрафа.</p>}
      {run.lastReply && <div className="iv-bubble" role="status">{run.lastReply}</div>}
      {run.history.at(-1)?.opened.length > 0 && <p className="iv-feedback" role="status"><Check size={16}/> Улика открыта и добавлена в карту</p>}
      {run.history.at(-1)?.assessment.error && <p className="iv-warning" role="status">{run.history.at(-1).assessment.error}</p>}
      <div className={move.kind === 'CHALLENGE' ? 'iv-bubble iv-challenge' : 'iv-bubble'}>
        {move.kind === 'CHALLENGE' && <span className="iv-tag">Перебивает</span>}
        {move.kind === 'TWIST' && <span className="iv-tag">Новое условие</span>}
        {selected && <blockquote>{selected.value !== selected.quote && <strong>{selected.value} · </strong>}«{selected.quote}»</blockquote>}
        {move.kind === 'TWIST' && <p>{run.seed.twist}</p>}
        <h1 className="iv-question" ref={heading} tabIndex={-1}>{move.prompt}</h1>
      </div>
      <Table value={run.seed.scenes[move.scene || move.public]}/>
      {run.seed.clues.filter(clue => move.evidence?.includes(clue.id) && !run.opened.includes(clue.id)).map(clue =>
        <p className="iv-locked" key={clue.id}><Lock size={15}/> {clue.title}</p>)}
      {run.opened.length > 0 && <details className="iv-opened" open={run.history.at(-1)?.opened.length > 0 || undefined}><summary>Открытые улики ({run.opened.length})</summary>
        {run.seed.clues.filter(clue => run.opened.includes(clue.id)).map(clue => <Table key={clue.id} value={clue}/>)}
      </details>}
      <form className="iv-form" onSubmit={submit}>
        {options && <fieldset><legend>{move.justify ? 'Твой выбор' : 'Твой вопрос'}</legend>{options.map(option =>
          <button type="button" key={option} aria-pressed={run.choice === option} onClick={() => edit({ choice: option })}>{option}</button>)}</fieldset>}
        {(!options || move.justify || run.hints[move.id]) && <label> {move.justify ? 'Почему этот вариант?' : move.evidence ? 'Твой запрос к данным' : 'Твой ответ'}
          <textarea value={run.draft} rows={3} maxLength={1200} onChange={e => edit({ draft: e.target.value })} placeholder="Одна–три фразы"/>
        </label>}
        {turnError && <p role="alert" className="iv-warning">{turnError}</p>}
        {run.hints[move.id] ? <p className="iv-hint">{move.hint} <small>−1 балл к итогу</small></p>
          : <button className="iv-text-button" type="button" onClick={useHint}>Не знаю, с чего начать</button>}
        <button className="iv-primary" type="submit" disabled={move.justify ? !run.choice || !run.draft.trim() : !run.choice && !run.draft.trim()}>
          {move.kind === 'DEMAND' ? 'Завершить интервью' : move.kind === 'DATA' && move.evidence ? 'Запросить данные' : options && !move.justify ? 'Спросить' : 'Ответить'} <ArrowRight size={18}/>
        </button>
      </form>
    </>}
    {run?.status === 'finished' && <Debrief run={run} onBack={() => pause()} onNext={() => { event('next_case_clicked', run); select(run.skeleton); }}/>}
  </div></div>;
}
