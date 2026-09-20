import React, { useEffect, useRef, useState } from 'react';
import { ArrowUpRight, ArrowRight, ChevronDown, Check, Layers3, Clock3, Sparkles } from 'lucide-react';
import { api } from './api/client.js';
import { Button } from './design/components/Button.jsx';
import './mvp.css';
import CaseContent from './CaseContent.jsx';
import ConditionAssistant from './ConditionAssistant.jsx';
import TheoryPage from './TheoryPage.jsx';
import BookTheoryPage from './BookTheoryPage.jsx';
import CaseMaterials, { readSavedTheory, SAVED_THEORY_KEY } from './CaseMaterials.jsx';
import INTERVIEWS from './backend/app/product_interviews.json';
const interviewFields = type => INTERVIEWS.find(t => t.id === type)?.questions.map(q => [q.id, q.label, q.hint, 'Короткий ответ…']);

export const STORAGE_KEY = 'htc_mvp_cases_v1';
const LEGACY_FIELDS = [
  ['problem', 'Как ты понимаешь проблему?', 'Цель, пользователь, ограничения и критерий успеха.'],
  ['hypotheses', 'Какие гипотезы проверишь?', 'Возможные причины и порядок их проверки.'],
  ['analysis', 'Какие данные и расчёты используешь?', 'Используй числа из условия. Отдельно обозначь допущения.'],
  ['recommendation', 'Что рекомендуешь и почему?', 'Решение, аргументы, риски и способ измерить результат.'],
];
const FIELDS = [
  ['problem', 'Что нужно изменить в этом кейсе?', 'Назови одну главную проблему или цель.', 'Например: повысить конверсию в заказ.'],
  ['audience', 'Для кого это особенно важно?', 'Один сегмент пользователей, клиентов или часть бизнеса.', 'Назови сегмент и коротко объясни выбор.'],
  ['hypotheses', 'В чём может быть причина проблемы?', 'Достаточно одной-двух гипотез.', 'Думаю, причина в …'],
  ['analysis', 'Какой факт из условия поддерживает твою мысль?', 'Одно число, сравнение или короткий расчёт. Если данных нет — укажи это.', 'В условии … Это может означать …'],
  ['validation', 'Что проверишь первым?', 'Назови одну проверку, которая поможет подтвердить или отвергнуть гипотезу.', 'Сравню … / Проверю …'],
  ['recommendation', 'Какое действие предлагаешь?', 'Одно конкретное действие и короткое «почему».', 'Предлагаю …, потому что …'],
  ['metric', 'По чему поймёшь, что стало лучше?', 'Метрика и желаемое направление изменения.', 'Должна вырасти / снизиться …'],
  ['risk', 'Что может пойти не так?', 'Один риск или ограничение твоего решения.', 'Есть риск, что …'],
];
function loadCases() {
  try {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    return Array.isArray(data) ? data.filter(c => c && typeof c.id === 'string' && typeof c.caseText === 'string' && c.answers && Array.isArray(c.attempts)) : [];
  } catch { return []; }
}
function titleOf(text) {
  return text.split('\n').find(line => line.trim())?.replace(/^[#\s]+/, '').replace(/[*`]/g, '').trim().slice(0, 100) || 'Новый кейс';
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
  const [savedTheory, setSavedTheory] = useState(readSavedTheory);
  const [bookChapter, setBookChapter] = useState(1);
  const [theorySavedOnly, setTheorySavedOnly] = useState(false);
  const [theoryError, setTheoryError] = useState('');
  const toggleTheory = id => {
    const next = savedTheory.includes(id) ? savedTheory.filter(x => x !== id) : [...savedTheory, id];
    try { localStorage.setItem(SAVED_THEORY_KEY, JSON.stringify(next)); setSavedTheory(next); setTheoryError(''); }
    catch { setTheoryError('Не удалось сохранить материал в браузере. Попробуй ещё раз.'); }
  };
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
  const [params, setParams] = useState({ trackId: 'product', interviewType: 'product_sense', industry: '', difficulty: '', extraContext: '' });
  const active = cases.find(c => c.id === selected);
  const fields = interviewFields(active?.params.interviewType) || FIELDS;
  const selectedType = INTERVIEWS.find(t => t.id === params.interviewType) || INTERVIEWS[0];
  const attempts = active?.attempts || [];
  const attempt = attempts[attemptIndex ?? attempts.length - 1];

  const fetchConfig = () => {
    setConfigError('');
    api.config().then(data => {
      setConfig(data);
      setParams(p => ({ ...p, industry: p.industry || data.industries?.find(x => x.includes('Маркетплейсы')) || data.industries?.[0] || '', difficulty: p.difficulty || Object.keys(data.difficultyLevels || {})[0] || '' }));
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
      const result = await api.evaluate({ caseText: item.caseText, answers, trackId: item.params.trackId, interviewType: item.params.interviewType, mvp: true });
      if (!result.evaluation?.trim()) throw new Error('ИИ вернул пустой разбор. Попробуй ещё раз.');
      update(item.id, c => ({ ...c, attempts: [...c.attempts, { answers, questionVersion: 2, questions: fields, evaluation: result.evaluation, createdAt: new Date().toISOString() }] }));
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
        <button aria-current={screen === 'cards' ? 'page' : undefined} disabled={!!busy} onClick={() => { setTheorySavedOnly(false); go('cards'); }}>Карточки</button>
        <button aria-current={screen === 'theory' ? 'page' : undefined} disabled={!!busy} onClick={() => go('theory')}>Теория</button>
        <Button variant="accent" size="sm" disabled={!!busy} onClick={() => go('generate')}>Новый кейс</Button>
      </nav>
    </header>
    <main className={`mvp-main mvp-screen-${screen}`}>
      {saveError && <p role="alert" className="mvp-notice">{saveError}</p>}
      {error && <p role="alert" className="mvp-notice">{error}</p>}
      {theoryError && <p role="alert" className="mvp-notice">{theoryError}</p>}
      {screen === 'theory' && <BookTheoryPage initialChapter={bookChapter} savedIds={savedTheory} onToggle={toggleTheory} onResume={active ? () => go('solve') : null}/>}
      {screen === 'cards' && <TheoryPage onOpenChapter={number => { setBookChapter(number); go('theory'); }} savedIds={savedTheory} onToggle={toggleTheory} initialSavedOnly={theorySavedOnly} onResume={active ? () => go('solve') : null}/>}
      {screen === 'library' && <>
        <div className="mvp-page-heading"><div><div className="clean-eyebrow">Твоя практика</div>
        <h1>Мои кейсы<span className="mvp-count">{String(cases.length).padStart(2, '0')}</span></h1>
        <p className="mvp-lead">От первой гипотезы до уверенного решения.</p></div><span className="mvp-small-note"><Clock3 size={15}/>15–20 минут на практику</span></div>
        {!cases.length ? <>
          <section className="mvp-start">
            <div className="mvp-start-copy"><span className="mvp-kicker"><Sparkles size={14}/>Кейс под твою задачу</span>
              <h2>Сильные решения<br/>начинаются с практики.</h2>
              <p>Реальная бизнес-ситуация, твои гипотезы и конкретная обратная связь. Начни с одного кейса.</p>
              <Button variant="accent" icon={<ArrowUpRight size={18}/>} onClick={() => go('generate')}>Сгенерировать кейс</Button>
            </div>
            <div className="mvp-start-route"><span className="mvp-kicker">Одна тренировка</span>
              {[['01','Получи задачу','ИИ подготовит условие и исходные данные.'],['02','Предложи решение','Разложи проблему, гипотезы и аргументы.'],['03','Сделай ответ сильнее','Получи разбор и доработай слабые места.']].map(([n,t,d]) => <div className="mvp-route-row" key={n}><span>{n}</span><div><b>{t}</b><p>{d}</p></div></div>)}
            </div>
          </section>
          <div className="mvp-section-label"><h2>С чего начать</h2><span>Выбери задачу для первой тренировки</span></div>
          <div className="mvp-starters">{[
            ['Диагностика метрик','Почему падает конверсия?','Найди причину изменения метрики и предложи проверку.', 'В маркетплейсе падает конверсия из поиска в заказ'],
            ['Продуктовое решение','Что улучшить в продукте?','Определи проблему пользователя и приоритет решения.', 'Как улучшить повторные покупки в маркетплейсе'],
            ['Продуктовая стратегия','Как вырастить прибыль?','Разбери экономику и выбери точку роста.', 'Рост прибыли маркетплейса при ограниченном бюджете'],
          ].map(([tag,t,d,context],i) => <button className="mvp-starter" key={tag} onClick={() => { setParams(p => ({ ...p, trackId: 'product', interviewType: ['product_execution', 'product_sense', 'product_strategy'][i], extraContext: context })); go('generate'); }}><span className="mvp-starter-tag">{tag}<ArrowUpRight size={17}/></span><b>{t}</b><p>{d}</p></button>)}</div>
          <p className="mvp-storage-note">Здесь появятся твои кейсы, черновики и разборы. Они сохраняются в этом браузере.</p>
        </> : <div className="mvp-grid">{cases.map(c => {
          const reviewed = c.attempts.length > 0;
          const draft = reviewed && JSON.stringify(c.answers) !== JSON.stringify(c.attempts.at(-1).answers);
          return <article className="mvp-card" key={c.id}>
            <span className="mvp-status">{draft ? 'Ответ обновлён' : reviewed ? 'Есть разбор' : 'В процессе'}</span>
            <h2>{titleOf(c.title || c.caseText)}</h2><p className="mvp-muted">{INTERVIEWS.find(t => t.id === c.params.interviewType)?.label || 'Кейс'} · {c.params.difficulty} · {c.params.industry}</p>
            <div className="mvp-actions"><Button onClick={() => open(c, reviewed && !draft ? 'review' : 'solve')}>{reviewed && !draft ? 'Посмотреть разбор' : 'Продолжить'}</Button></div>
          </article>;
        })}</div>}
      </>}
      {screen === 'generate' && <>
        <div className="mvp-page-heading"><div><div className="clean-eyebrow">Новая тренировка</div><h1>Настрой свой кейс</h1>
        <p className="mvp-lead">Выбери задачу. Условие и данные подготовит ИИ.</p></div><div className="mvp-flow"><b>01 Кейс</b><ArrowRight size={14}/><span>02 Решение</span><ArrowRight size={14}/><span>03 Разбор</span></div></div>
        {configError && <div role="alert" className="mvp-notice">{configError} <button onClick={fetchConfig}>Повторить загрузку</button></div>}
        {!config && !configError && <p role="status">Загружаем настройки…</p>}
        {config && <div className="mvp-setup-layout"><form className="mvp-card mvp-form mvp-setup" onSubmit={generate}>
          <fieldset><legend>01 / Тип продуктового собеседования</legend><div className="mvp-direction">{INTERVIEWS.map(t => <button type="button" className={params.interviewType === t.id ? 'selected' : ''} aria-pressed={params.interviewType === t.id} disabled={!!busy} key={t.id} onClick={() => setParams(p => ({ ...p, trackId: 'product', interviewType:t.id }))}><span className="mvp-direction-top"><Layers3 size={20}/><span className="mvp-choice-check">{params.interviewType === t.id && <Check size={12}/>}</span></span><b>{t.label}</b><small>{t.description}</small></button>)}</div></fieldset>
          <label>02 / Отрасль<span className="mvp-select-wrap"><select required disabled={!!busy} value={params.industry} onChange={e => setParams(p => ({ ...p, industry: e.target.value }))}>{config.industries.map(x => <option value={x} key={x}>{x.includes(' / ') ? x.split(' / ').slice(1).join(' / ') : x}</option>)}</select><ChevronDown size={16}/></span></label>
          <fieldset><legend>03 / Сложность</legend><div className="mvp-levels">{Object.keys(config.difficultyLevels).map(x => <button type="button" aria-pressed={params.difficulty === x} className={params.difficulty === x ? 'selected' : ''} disabled={!!busy} key={x} onClick={() => setParams(p => ({ ...p, difficulty:x }))}>{x}</button>)}</div></fieldset>
          <label><span>04 / Свой контекст <small className="mvp-muted">необязательно</small></span><textarea maxLength={2000} disabled={!!busy} value={params.extraContext} onChange={e => setParams(p => ({ ...p, extraContext: e.target.value }))} placeholder="Например: пользователи добавляют товары в корзину, но не оформляют заказ" rows={2}/></label>
          <div className="mvp-form-footer"><span><Clock3 size={14}/>15–20 минут на решение</span><Button variant="accent" type="submit" icon={<ArrowRight size={17}/>} disabled={!!busy}>{busy ? 'Генерируем кейс…' : 'Сгенерировать кейс'}</Button></div>
          {busy && <p role="status">ИИ готовит условие и данные. Это может занять около минуты.</p>}
        </form><aside className="mvp-setup-aside"><span className="mvp-kicker">Твоя тренировка</span><h2>{selectedType.label}</h2><p>{selectedType.description}. Условие, вопросы и разбор адаптируются под выбранный тип.</p><div className="mvp-setup-spec"><span>Направление<b>Продуктовое</b></span><span>Уровень<b>{params.difficulty}</b></span><span>Формат<b>Письменный кейс</b></span></div><div className="mvp-aside-bottom"><Sparkles size={20}/><b>Обратная связь по делу</b><p>Что получилось, где не хватает аргументов и что улучшить в следующей попытке.</p></div></aside></div>}
      </>}
      {screen === 'solve' && active && <>
        <button className="mvp-back" disabled={!!busy} onClick={() => go('library')}>← Мои кейсы</button>
        <div className="clean-eyebrow">Шаг 2 · Решение</div><h1>Твой ход</h1>
        <p className="mvp-lead">Восемь коротких вопросов. На каждый достаточно одной-двух фраз — важна мысль, а не объём.</p>
        <div className="mvp-workspace">
          <aside className="mvp-card mvp-condition"><h2>Условие кейса</h2><p className="mvp-muted">Данные кейса сгенерированы ИИ для тренировки.</p><ConditionAssistant key={active.id} caseText={active.caseText}/><CaseContent text={active.caseText}/><CaseMaterials key={`materials-${active.id}`} item={active} savedIds={savedTheory} onToggle={toggleTheory} onOpenTheory={() => { setTheorySavedOnly(true); go('cards'); }}/>
            {attempts.length > 0 && <details><summary>Предыдущий разбор</summary><Review value={attempts.at(-1).evaluation}/></details>}
          </aside>
          <section className="mvp-card mvp-form" aria-label="Твоё решение">
            {fields.map(([key, label, hint, placeholder], index) => <label key={key} htmlFor={`answer-${key}`}><span>{index + 1}. {label}</span><span className="mvp-muted">{hint}</span><textarea id={`answer-${key}`} placeholder={placeholder} rows={2} disabled={!!busy} value={active.answers[key] || ''} onChange={e => { const value = e.target.value; update(active.id, c => ({ ...c, answers: { ...c.answers, [key]: value } })); }}/></label>)}
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
        <div className="clean-eyebrow">Шаг 3 · Обратная связь</div><h1>Разбор решения</h1><p className="mvp-lead">{titleOf(active.title || active.caseText)}</p>
        <label className="mvp-version">Версия решения<select value={attemptIndex ?? attempts.length - 1} onChange={e => setAttemptIndex(Number(e.target.value))}>{attempts.map((a, i) => <option key={i} value={i}>Версия {i + 1} · {new Date(a.createdAt).toLocaleString('ru-RU')}</option>)}</select></label>
        <article className="mvp-card mvp-review"><Review value={attempt.evaluation}/><details><summary>Ответ этой версии</summary>{(attempt.questions || (attempt.questionVersion === 2 ? FIELDS : LEGACY_FIELDS)).map(([key, label]) => <section key={key}><h3>{label}</h3><div className="mvp-prose">{attempt.answers[key] || 'Не заполнено'}</div></section>)}</details></article>
        <div className="mvp-actions"><Button variant="accent" onClick={() => go('solve')}>Улучшить решение</Button><Button variant="neutral" onClick={() => go('generate')}>Новый кейс</Button></div>
        <p className="mvp-muted">Редактирование продолжится с последнего черновика. ИИ может ошибаться — сверяй выводы с данными кейса.</p>
      </div>}
    </main>
  </div>;
}
