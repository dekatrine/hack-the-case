import React, { useEffect, useRef, useState } from 'react';
import { api } from './api/client.js';
import { Button } from './design/components/Button.jsx';
import './mvp.css';

export const STORAGE_KEY = 'htc_mvp_cases_v1';
const FIELDS = [
  ['problem', 'Как ты понимаешь проблему?', 'Цель, пользователь, ограничения и критерий успеха.'],
  ['hypotheses', 'Какие гипотезы проверишь?', 'Возможные причины и порядок их проверки.'],
  ['analysis', 'Какие данные и расчёты используешь?', 'Используй числа из условия. Отдельно обозначь допущения.'],
  ['recommendation', 'Что рекомендуешь и почему?', 'Решение, аргументы, риски и способ измерить результат.'],
];
function loadCases() {
  try {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    return Array.isArray(data) ? data.filter(c => c && typeof c.id === 'string' && typeof c.caseText === 'string' && c.answers && Array.isArray(c.attempts)) : [];
  } catch { return []; }
}
function titleOf(text) {
  return text.split('\n').find(line => line.trim())?.replace(/^[#*\s]+|[*]+$/g, '').slice(0, 100) || 'Новый кейс';
}
function Review({ value }) {
  let parsed;
  try { parsed = JSON.parse(value.replace(/```(?:json)?/g, '').trim()); } catch { /* Display a readable model response even if JSON failed. */ }
  if (!parsed || typeof parsed.summary !== 'string') return <div className="mvp-prose">{value}</div>;
  return <>
    <p className="mvp-summary">{parsed.summary}</p>
    {[['strengths', 'Что получилось'], ['improvements', 'Что стоит улучшить'], ['topTips', 'Что исправить в первую очередь']].map(([key, label]) => (
      Array.isArray(parsed[key]) && parsed[key].length > 0 && <section key={key}>
        <h3>{label}</h3><ul>{parsed[key].filter(x => typeof x === 'string').map((item, i) => <li key={i}>{item}</li>)}</ul>
      </section>
    ))}
  </>;
}
export default function MvpApp() {
  const [cases, setCases] = useState(loadCases);
  const [screen, setScreen] = useState('library');
  const [selected, setSelected] = useState(null);
  const [attemptIndex, setAttemptIndex] = useState(null);
  const [config, setConfig] = useState(null);
  const [configError, setConfigError] = useState('');
  const [error, setError] = useState('');
  const [saveError, setSaveError] = useState('');
  const [busy, setBusy] = useState('');
  const lock = useRef(false);
  const [params, setParams] = useState({ trackId: 'product', industry: '', difficulty: '', extraContext: '' });
  const active = cases.find(c => c.id === selected);
  const attempts = active?.attempts || [];
  const attempt = attempts[attemptIndex ?? attempts.length - 1];

  const fetchConfig = () => {
    setConfigError('');
    api.config().then(data => {
      setConfig(data);
      setParams(p => ({ ...p, industry: p.industry || data.industries?.[0] || '', difficulty: p.difficulty || Object.keys(data.difficultyLevels || {})[0] || '' }));
    }).catch(() => setConfigError('Не удалось загрузить настройки генерации. Сохранённые кейсы доступны.'));
  };
  useEffect(fetchConfig, []);
  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(cases)); setSaveError(''); }
    catch { setSaveError('Не удалось сохранить изменения в браузере. Не закрывай страницу, пока не скопируешь ответ.'); }
  }, [cases]);
  useEffect(() => { window.scrollTo?.({ top: 0, behavior: 'auto' }); }, [screen, selected]);
  const go = (next) => { setError(''); setScreen(next); };
  const update = (id, fn) => setCases(prev => prev.map(c => c.id === id ? fn(c) : c));
  const open = (c, next) => { setSelected(c.id); setAttemptIndex(null); go(next); };
  const generate = async (event) => {
    event.preventDefault();
    if (lock.current) return;
    lock.current = true; setBusy('generate'); setError('');
    try {
      const result = await api.generate({ ...params, mvp: true });
      if (!result.caseText?.trim()) throw new Error('ИИ вернул пустой кейс. Попробуй ещё раз.');
      const item = { id: crypto.randomUUID(), title: titleOf(result.caseText), caseText: result.caseText, params: { ...params }, answers: {}, attempts: [], createdAt: new Date().toISOString() };
      setCases(prev => [item, ...prev]); open(item, 'solve');
    } catch (e) { setError(e.message || 'Не удалось сгенерировать кейс. Попробуй ещё раз.'); }
    finally { lock.current = false; setBusy(''); }
  };
  const evaluate = async () => {
    if (lock.current || !active) return;
    if (!Object.values(active.answers).some(a => a.trim())) { setError('Напиши решение хотя бы в одном поле.'); return; }
    lock.current = true; setBusy('evaluate'); setError('');
    const item = active;
    const answers = { ...item.answers };
    try {
      const result = await api.evaluate({ caseText: item.caseText, answers, trackId: item.params.trackId, mvp: true });
      if (!result.evaluation?.trim()) throw new Error('ИИ вернул пустой разбор. Попробуй ещё раз.');
      update(item.id, c => ({ ...c, attempts: [...c.attempts, { answers, evaluation: result.evaluation, createdAt: new Date().toISOString() }] }));
      setAttemptIndex(null); go('review');
    } catch (e) { setError(e.message || 'Не удалось проверить решение. Твой ответ сохранён — попробуй ещё раз.'); }
    finally { lock.current = false; setBusy(''); }
  };
  const hasChanges = active && (!attempts.length || JSON.stringify(active.answers) !== JSON.stringify(attempts.at(-1).answers));

  return <div className="mvp-app">
    <header className="mvp-header">
      <button className="clean-brand" disabled={!!busy} onClick={() => go('library')} aria-label="Hack the Case — мои кейсы"><span className="mark">H</span><b>Hack the Case</b></button>
      <nav aria-label="Основная навигация">
        <button aria-current={screen === 'library' ? 'page' : undefined} disabled={!!busy} onClick={() => go('library')}>Мои кейсы</button>
        <Button variant="accent" size="sm" disabled={!!busy} onClick={() => go('generate')}>Новый кейс</Button>
      </nav>
    </header>
    <main className="mvp-main">
      {saveError && <p role="alert" className="mvp-notice">{saveError}</p>}
      {error && <p role="alert" className="mvp-notice">{error}</p>}
      {screen === 'library' && <>
        <div className="clean-eyebrow">Практика решения кейсов</div>
        <h1>Решай. Разбирай. Улучшай.</h1>
        <p className="mvp-lead">Сгенерируй кейс, предложи решение и получи персональный ИИ-разбор.</p>
        {!cases.length ? <section className="mvp-card mvp-empty">
          <h2>Твой первый кейс</h2><p>Выбери тему и сложность. ИИ подготовит условие и данные — дальше твой ход.</p>
          <Button variant="accent" onClick={() => go('generate')}>Сгенерировать кейс</Button>
          <p className="mvp-muted">Черновики и разборы сохраняются в этом браузере.</p>
        </section> : <div className="mvp-grid">{cases.map(c => {
          const reviewed = c.attempts.length > 0;
          const draft = reviewed && JSON.stringify(c.answers) !== JSON.stringify(c.attempts.at(-1).answers);
          return <article className="mvp-card" key={c.id}>
            <span className="mvp-status">{draft ? 'Ответ обновлён' : reviewed ? 'Есть разбор' : 'В процессе'}</span>
            <h2>{c.title}</h2><p className="mvp-muted">{c.params.difficulty} · {c.params.industry}</p>
            <div className="mvp-actions"><Button onClick={() => open(c, reviewed && !draft ? 'review' : 'solve')}>{reviewed && !draft ? 'Посмотреть разбор' : 'Продолжить'}</Button></div>
          </article>;
        })}</div>}
      </>}
      {screen === 'generate' && <div className="mvp-narrow">
        <div className="clean-eyebrow">Шаг 1 · Кейс</div><h1>Какой кейс решим?</h1>
        <p className="mvp-lead">Настрой задачу под себя. На решение — примерно 15–20 минут.</p>
        {configError && <div role="alert" className="mvp-notice">{configError} <button onClick={fetchConfig}>Повторить загрузку</button></div>}
        {!config && !configError && <p role="status">Загружаем настройки…</p>}
        {config && <form className="mvp-card mvp-form" onSubmit={generate}>
          <label>Направление<select disabled={!!busy} value={params.trackId} onChange={e => setParams(p => ({ ...p, trackId: e.target.value }))}><option value="product">Продуктовые кейсы</option><option value="business">Бизнес-кейсы</option></select></label>
          <label>Отрасль<select required disabled={!!busy} value={params.industry} onChange={e => setParams(p => ({ ...p, industry: e.target.value }))}>{config.industries.map(x => <option key={x}>{x}</option>)}</select></label>
          <label>Сложность<select required disabled={!!busy} value={params.difficulty} onChange={e => setParams(p => ({ ...p, difficulty: e.target.value }))}>{Object.keys(config.difficultyLevels).map(x => <option key={x}>{x}</option>)}</select></label>
          <label>Тема или контекст · необязательно<textarea maxLength={2000} disabled={!!busy} value={params.extraContext} onChange={e => setParams(p => ({ ...p, extraContext: e.target.value }))} placeholder="Например: в маркетплейсе падает конверсия из поиска в заказ" rows={3}/></label>
          <Button variant="accent" type="submit" disabled={!!busy}>{busy ? 'Генерируем кейс…' : 'Сгенерировать кейс'}</Button>
          {busy && <p role="status">ИИ готовит условие и данные. Это может занять около минуты.</p>}
        </form>}
      </div>}
      {screen === 'solve' && active && <>
        <button className="mvp-back" disabled={!!busy} onClick={() => go('library')}>← Мои кейсы</button>
        <div className="clean-eyebrow">Шаг 2 · Решение</div><h1>Твой ход</h1>
        <p className="mvp-lead">Сформулируй решение в четырёх блоках. Можно отправить неполный ответ.</p>
        <div className="mvp-workspace">
          <aside className="mvp-card mvp-condition"><h2>Условие кейса</h2><p className="mvp-muted">Данные кейса сгенерированы ИИ для тренировки.</p><div className="mvp-prose">{active.caseText}</div>
            {attempts.length > 0 && <details><summary>Предыдущий разбор</summary><Review value={attempts.at(-1).evaluation}/></details>}
          </aside>
          <section className="mvp-card mvp-form" aria-label="Твоё решение">
            {FIELDS.map(([key, label, hint], index) => <label key={key} htmlFor={`answer-${key}`}><span>{index + 1}. {label}</span><span className="mvp-muted">{hint}</span><textarea id={`answer-${key}`} rows={5} disabled={!!busy} value={active.answers[key] || ''} onChange={e => { const value = e.target.value; update(active.id, c => ({ ...c, answers: { ...c.answers, [key]: value } })); }}/></label>)}
            <p className="mvp-muted">{saveError ? 'Сохранение недоступно' : 'Черновик сохраняется в этом браузере'}</p>
            <Button variant="accent" disabled={!!busy || !hasChanges} onClick={evaluate}>{busy ? 'Разбираем решение…' : attempts.length ? 'Проверить новую версию' : 'Получить ИИ-разбор'}</Button>
            {busy && <p role="status">Проверяем аргументы, расчёты и рекомендацию…</p>}
            {!hasChanges && <p className="mvp-muted">Измени ответ, чтобы проверить новую версию.</p>}
            {attempts.length > 0 && <Button variant="neutral" disabled={!!busy} onClick={() => { setAttemptIndex(null); go('review'); }}>Посмотреть разбор</Button>}
          </section>
        </div>
      </>}
      {screen === 'review' && active && attempt && <div className="mvp-narrow">
        <button className="mvp-back" onClick={() => go('library')}>← Мои кейсы</button>
        <div className="clean-eyebrow">Шаг 3 · Обратная связь</div><h1>Разбор решения</h1><p className="mvp-lead">{active.title}</p>
        <label className="mvp-version">Версия решения<select value={attemptIndex ?? attempts.length - 1} onChange={e => setAttemptIndex(Number(e.target.value))}>{attempts.map((a, i) => <option key={i} value={i}>Версия {i + 1} · {new Date(a.createdAt).toLocaleString('ru-RU')}</option>)}</select></label>
        <article className="mvp-card mvp-review"><Review value={attempt.evaluation}/><details><summary>Ответ этой версии</summary>{FIELDS.map(([key, label]) => <section key={key}><h3>{label}</h3><div className="mvp-prose">{attempt.answers[key] || 'Не заполнено'}</div></section>)}</details></article>
        <div className="mvp-actions"><Button variant="accent" onClick={() => go('solve')}>Улучшить решение</Button><Button variant="neutral" onClick={() => go('generate')}>Новый кейс</Button></div>
        <p className="mvp-muted">Редактирование продолжится с последнего черновика. ИИ может ошибаться — сверяй выводы с данными кейса.</p>
      </div>}
    </main>
  </div>;
}
