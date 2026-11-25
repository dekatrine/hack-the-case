import React, { useEffect, useRef, useState } from 'react';
import { ArrowUpRight, ArrowRight, Calculator, ChartNoAxesColumnIncreasing, ChevronDown, Check, Clock3, Compass, FlaskConical, Lightbulb, Sparkles, UsersRound } from 'lucide-react';
import { api } from './api/client.js';
import { LOCAL_CASE_CONFIG } from './api/localCaseConfig.js';
import { Button } from './design/components/Button.jsx';
import './mvp.css';
import CaseContent from './CaseContent.jsx';
import LearningPath from './learning/LearningPath.jsx';
import CaseLibrary from './cases/CaseLibrary.jsx';
import { countHints, duplicateAsNewAttempt, hasAttemptChanges } from './cases/caseLibrary.js';
import { hasStory, storyPath, storyAnswers } from './cases/storyPath.js';
import { guideCaseRoute } from './cases/caseWriting.js';
import CaseFlow from './CaseFlow.jsx';
import Interview from './interviews/Interview.jsx';
import { readRuns } from './interviews/storage.js';
import { CASES_KEY } from './home/attempts.js';
import Home from './home/Home.jsx';
import Progress from './home/Progress.jsx';
import Onboarding from './home/Onboarding.jsx';
import { needsSplit, preferredSkeleton, readOnboarding } from './home/onboarding.js';
import { debrief } from './interviews/rubric.js';
import SearchDiagnostic from './cases/SearchDiagnostic.jsx';
import { SEARCH_CASE_INTRO, SEARCH_CASE_TITLE, SEARCH_ROUTE, SEARCH_SLICES } from './cases/searchDiagnostic.js';
import ConditionAssistant from './ConditionAssistant.jsx';
import TheoryPage from './TheoryPage.jsx';
import BookTheoryPage from './BookTheoryPage.jsx';
import CaseMaterials, { readSavedTheory, SAVED_THEORY_KEY } from './CaseMaterials.jsx';
import INTERVIEWS from './backend/app/product_interviews.json';
import CASE_VARIANTS from './backend/app/case_variants.json';
import PRACTICE_SKILLS from './backend/app/practice_skills.json';

const DIRECTION_ICONS = {
  product_sense: Lightbulb,
  product_execution: ChartNoAxesColumnIncreasing,
  product_strategy: Compass,
  product_experiment: FlaskConical,
  product_estimation: Calculator,
  product_segmentation: UsersRound,
};
// Ready-made interview for each direction; used when a case has no data route of its own.
export const SKELETON_BY_DIRECTION = {
  product_sense: 'discovery',
  product_execution: 'diagnosis',
  product_strategy: 'strategy',
  product_experiment: 'experiments',
  product_estimation: 'market',
  product_segmentation: 'segmentation',
};
const DEFAULT_PRACTICE = {
  product_sense: 'evidence',
  product_execution: 'validation',
  product_strategy: 'tradeoffs',
  product_experiment: 'metrics',
  product_estimation: 'assumptions',
  product_segmentation: 'segments',
};

function PracticeStatus({ feedback }) {
  if (!feedback) return null;
  const details = [
    feedback.applied === true ? 'Критерий выполнен' : feedback.applied === false ? 'Навык стоит закрепить' : '',
    feedback.assisted === true ? 'Подсказки открывались на этом шаге'
      : feedback.assisted === false ? 'Без подсказок на этом шаге' : '',
  ].filter(Boolean);
  return <>
    {feedback.observation && <p>{feedback.observation}</p>}
    {details.length > 0 && <small>{details.join(' · ')}</small>}
  </>;
}
const interviewFields = type => INTERVIEWS.find(t => t.id === type)?.questions.map(q => [q.id, q.label, q.hint, 'Короткий ответ…']);
const routeFields = route => route.map(step => [step.id, step.question, step.hint, 'Короткий ответ…']);

export const STORAGE_KEY = CASES_KEY;
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
const caseWords = text => text.toLowerCase().match(/[\p{L}\p{N}]+/gu)?.join(' ') || '';
function generationHistory(cases, params) {
  const relevance = item => Number(item.params?.industry === params.industry) + Number(item.params?.interviewType === params.interviewType);
  const distinct = new Map();
  for (const item of [...cases].sort((a, b) => relevance(b) - relevance(a))) {
    const key = caseWords(item.caseText);
    if (!key || distinct.has(key)) continue;
    const text = item.caseText.trim();
    distinct.set(key, text.length > 2000 ? `${text.slice(0, 1250)}\n…\n${text.slice(-745)}` : text);
    if (distinct.size === 12) break;
  }
  return [...distinct.values()];
}
function titleOf(text) {
  return text.split('\n').find(line => line.trim())?.replace(/^[#\s]+/, '').replace(/[*`]/g, '').trim().slice(0, 100) || 'Новый кейс';
}
function ReviewScore({ score }) {
  if (!score) return null;
  return <section className="mvp-review-score" aria-label="Итоговая оценка">
    <span className="mvp-review-label" aria-hidden="true">Итоговая оценка</span>
    {Number.isInteger(score.final) && <strong>{score.final} из 100</strong>}
    <p>{Number.isInteger(score.quality) && `Качество решения · ${score.quality} из 100. `}
      {score.hintPenalty ? `За подсказки · −${score.hintPenalty}.` : 'Подсказки не использовались.'}
    </p>
    {!!score.hintPenalty && <small>Обычные · {score.hints.basic} · ИИ · {score.hints.ai}</small>}
  </section>;
}
function Review({ value, score }) {
  let parsed;
  try { parsed = JSON.parse(value.replace(/```(?:json)?/g, '').trim()); } catch { /* Display a readable model response even if JSON failed. */ }
  if (!parsed || typeof parsed.summary !== 'string') return <><ReviewScore score={score}/><div className="mvp-prose">{value}</div></>;
  const steps = Object.values(parsed.stepScores || {});
  return <>
    <ReviewScore score={score}/>
    {steps.length > 0 && <p className="mvp-muted">
      Полный балл на {steps.filter(grade => grade === 3).length} из {steps.length} шагов
    </p>}
    <section className="mvp-summary-card"><span className="mvp-review-label">Коротко</span><p className="mvp-summary">{parsed.summary}</p></section>
    {[['strengths', 'Что получилось'], ['improvements', 'Что стоит улучшить'], ['topTips', 'Что исправить в первую очередь']].map(([key, label]) => (
      Array.isArray(parsed[key]) && parsed[key].length > 0 && <details className="mvp-review-block" key={key} open={key === 'strengths'}>
        <summary>{label}</summary><ul>{parsed[key].filter(x => typeof x === 'string').map((item, i) => <li key={i}>{item}</li>)}</ul>
      </details>
    ))}
  </>;
}
function InterviewEntry({ onOpen, onOpenRun, showList }) {
  let finished = [];
  try { finished = readRuns(); } catch { finished = []; }
  const last = finished[0];
  let score = null;
  try { score = last && !last.configured ? debrief(last).final : null; } catch { score = null; }
  return <>
    <button type="button" className="mvp-starter mvp-search-starter" onClick={onOpen}>
      <span className="mvp-starter-tag">Собеседование<ArrowUpRight size={17}/></span>
      <b>{finished.length ? 'Пройти ещё одно собеседование' : 'Пройти кейс как собеседование'}</b>
      <p>{finished.length
        ? `Пройдено: ${finished.length}${score !== null ? `. Последний результат: ${score}/100` : ''}. Каждый раз новый кейс.`
        : 'Интервьюер задаёт вопросы, ты запрашиваешь данные и защищаешь решения. В конце разбор с цитатами из твоих ответов.'}</p>
    </button>
    {showList && finished.length > 0 && <div className="mvp-interview-list">
      {finished.slice(0, 5).map(run => {
        let value = null;
        try { value = run.configured ? run.review?.score?.final ?? null : debrief(run).final; } catch { value = null; }
        return <button type="button" className="mvp-starter" key={run.id} onClick={() => onOpenRun(run.id)}>
          <span className="mvp-starter-tag">Собес · {new Date(run.updatedAt).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}{value !== null ? ` · ${value}/100` : ''}<ArrowUpRight size={17}/></span>
          <b>{run.configured ? run.skeleton.title : run.skeleton.label}</b>
          <p>{run.seed.industry.split(' / ').at(-1)}</p>
        </button>;
      })}
    </div>}
  </>;
}

export default function MvpApp({ initialScreen = 'home' }) {
  const [savedTheory, setSavedTheory] = useState(readSavedTheory);
  const [bookChapter, setBookChapter] = useState(1);
  const [theorySavedOnly, setTheorySavedOnly] = useState(false);
  const [studyLesson, setStudyLesson] = useState(null);
  const [theoryError, setTheoryError] = useState('');
  const toggleTheory = id => {
    const next = savedTheory.includes(id) ? savedTheory.filter(x => x !== id) : [...savedTheory, id];
    try { localStorage.setItem(SAVED_THEORY_KEY, JSON.stringify(next)); setSavedTheory(next); setTheoryError(''); }
    catch { setTheoryError('Не удалось сохранить материал в браузере. Попробуй ещё раз.'); }
  };
  const [cases, setCases] = useState(loadCases);
  const [screen, setScreen] = useState(initialScreen);
  const [interviewStart, setInterviewStart] = useState(null);
  const [libFilter, setLibFilter] = useState(() => { try { return loadCases().length > 0 || readRuns().length === 0 ? 'self' : 'interview'; } catch { return 'self'; } });
  const [profile, setProfile] = useState(readOnboarding);
  const [selected, setSelected] = useState(null);
  const [attemptIndex, setAttemptIndex] = useState(null);
  const [config, setConfig] = useState(null);
  const [configError, setConfigError] = useState('');
  const [error, setError] = useState('');
  const [saveError, setSaveError] = useState('');
  const [reviewError, setReviewError] = useState('');
  const [busy, setBusy] = useState('');
  const [hintBusy, setHintBusy] = useState(false);
  const lock = useRef(false);
  const hintLock = useRef(false);
  const [params, setParams] = useState({ trackId: 'product', interviewType: 'product_sense', industry: '', difficulty: '', extraContext: '' });
  const [mode, setMode] = useState('practice');
  const [variantId, setVariantId] = useState('surprise');
  const active = cases.find(c => c.id === selected);
  const selfCheck = active?.mode === 'self_check';
  const diagnostic = active?.scenario === 'search_diagnostic';
  const diagnosticSlice = diagnostic ? SEARCH_SLICES.find(slice => slice.id === active.diagnosticSource) : undefined;
  const story = hasStory(active?.caseRoute);
  const caseRoute = diagnosticSlice
    ? [SEARCH_ROUTE[0], { ...SEARCH_ROUTE[1], question: diagnosticSlice.question, evidence: diagnosticSlice.evidence }]
    : guideCaseRoute(active, story ? storyPath(active.caseRoute, active.answers) : active?.caseRoute || []);
  const fields = caseRoute.length ? routeFields(caseRoute) : interviewFields(active?.params?.interviewType) || FIELDS;
  const evidenceStep = caseRoute.find(step => step.evidence);
  const conditionText = story
    ? [active.caseIntro, ...new Set(caseRoute.filter(step => step.evidence && active.answers[step.id]?.trim()).map(step => step.evidence))].filter(Boolean).join('\n\n')
    : evidenceStep && !active.answers[evidenceStep.id]?.trim()
    ? active.caseText.replace(`\n\n**Дополнительный срез данных**\n\n${evidenceStep.evidence}`, '')
    : active?.caseText;
  const selectedType = INTERVIEWS.find(t => t.id === params.interviewType) || INTERVIEWS[0];
  const variants = CASE_VARIANTS[selectedType.id];
  const attempts = active?.attempts || [];
  const attempt = attempts[attemptIndex ?? attempts.length - 1];
  const practice = attempt?.practice;
  const priorPractice = active?.practiceSource;
  const practiceSkill = active?.focusSkill || practice?.skillId || DEFAULT_PRACTICE[active?.params?.interviewType];
  const skillLabel = PRACTICE_SKILLS[practiceSkill]?.label;
  const canPractice = skillLabel && active?.params?.industry && active?.params?.difficulty;

  const fetchConfig = () => {
    api.config().then(data => {
      setConfig(data);
      setConfigError('');
      setParams(p => ({ ...p, industry: p.industry || data.industries?.find(x => x.includes('Маркетплейсы')) || data.industries?.[0] || '', difficulty: p.difficulty || Object.keys(data.difficultyLevels || {})[0] || '' }));
    }).catch(() => {
      setConfig(LOCAL_CASE_CONFIG);
      setConfigError('Сервер генерации пока недоступен. Можно выбрать параметры, но для создания AI-кейса требуется подключение. Проверь, запущен ли backend, затем повтори подключение.');
      setParams(p => ({ ...p, industry: p.industry || 'E-commerce / Маркетплейсы', difficulty: p.difficulty || 'Начальный' }));
    });
  };
  useEffect(fetchConfig, []);
  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(cases)); setSaveError(''); }
    catch { setSaveError('Не удалось сохранить изменения в браузере. Не закрывай страницу, пока не скопируешь ответ.'); }
  }, [cases]);
  useEffect(() => { window.scrollTo?.({ top: 0, behavior: 'auto' }); }, [screen, selected]);
  const startInterviewFor = item => {
    // Если у кейса есть данные и развилки, собес идёт по нему самому. Иначе берём готовый сценарий.
    const route = item?.caseRoute;
    const hasRoute = item?.caseIntro && Array.isArray(route) && route.some(step => step.evidence) && route.some(step => step.nextByAnswer && Object.keys(step.nextByAnswer).length);
    setInterviewStart(hasRoute
      ? { fromCase: {
        result: { caseText: item.caseText, caseIntro: item.caseIntro, caseRoute: route, variantId: item.params?.variantId, fingerprints: item.fingerprints || [] },
        settings: item.params, label: INTERVIEWS.find(type => type.id === item.params?.interviewType)?.label || item.title || 'Кейс',
      } }
      : { skeleton: SKELETON_BY_DIRECTION[item?.params?.interviewType] || 'discovery' });
    go('interviews');
  };
  const go = (next) => { setError(''); setReviewError(''); if (next === 'generate') setVariantId('surprise'); setScreen(next); };
  const update = (id, fn) => setCases(prev => prev.map(c => c.id === id ? { ...fn(c), updatedAt: new Date().toISOString() } : c));
  const open = (c, next) => { setSelected(c.id); setAttemptIndex(null); go(next); };
  const archive = (item, shouldArchive) => update(item.id, c => ({ ...c, archivedAt: shouldArchive ? new Date().toISOString() : null, updatedAt: new Date().toISOString() }));
  const retryCase = (item) => { const now = new Date().toISOString(); const copy = duplicateAsNewAttempt(item, crypto.randomUUID(), now); setCases(prev => [copy, ...prev]); open(copy, 'solve'); };
  const revealHint = key => {
    if (selfCheck) return;
    update(active.id, item => ({
      ...item, hints: { ...item.hints, [key]: { ...item.hints?.[key], basic: true } },
    }));
  };
  const requestHint = async (key, question, guidance) => {
    const previous = active.hints?.[key]?.ai || [];
    if (selfCheck || hintLock.current || lock.current || previous.length >= 2) return;
    hintLock.current = true;
    setHintBusy(true);
    const item = active;
    const step = caseRoute.find(entry => entry.id === key);
    try {
      const { message } = await api.coach({
        stepHint: true, stepId: key, stepTitle: question, stepDescription: guidance,
        trackId: item.params.trackId, caseText: [conditionText, step?.scene, step?.evidence].filter(Boolean).join('\n\n'),
        answerText: item.answers[key] || '', userMessage: 'Дай подсказку к текущему шагу.',
        chatHistory: previous.map(text => ({ role: 'coach', text })),
      });
      const hint = message?.trim();
      if (!hint || previous.includes(hint)) throw new Error('Новая подсказка пока не получилась. Попробуй ещё раз.');
      update(item.id, current => ({
        ...current, hints: {
          ...current.hints, [key]: { ...current.hints?.[key], ai: [...previous, hint] },
        },
      }));
    } finally {
      hintLock.current = false;
      setHintBusy(false);
    }
  };
  const startSearchDiagnostic = () => {
    const now = new Date().toISOString();
    const item = {
      id: crypto.randomUUID(), scenario: 'search_diagnostic',
      title: SEARCH_CASE_TITLE, caseText: SEARCH_CASE_INTRO, caseRoute: SEARCH_ROUTE,
      params: { trackId: 'product', interviewType: 'product_execution' },
      answers: {}, attempts: [], createdAt: now, updatedAt: now,
    };
    setCases(previous => [item, ...previous]);
    open(item, 'solve');
  };
  const requestDiagnosticSlice = async () => {
    if (lock.current) return false;
    lock.current = true; setBusy('evidence');
    try {
      const { source } = await api.requestEvidence({
        answer: active.answers.search_request.trim(),
        sources: SEARCH_SLICES.map(slice => slice.label),
      });
      const selectedSlice = SEARCH_SLICES.find(slice => slice.label === source);
      if (!selectedSlice) return false;
      update(active.id, c => ({ ...c, diagnosticSource: selectedSlice.id }));
      return true;
    } finally {
      lock.current = false; setBusy('');
    }
  };
  const startCase = async (caseParams, scenario, caseMode, practiceSource) => {
    if (lock.current) return;
    lock.current = true; setBusy('generate'); setError('');
    try {
      const history = [...cases, ...loadCases()];
      const result = await api.generate({
        ...caseParams, mvp: true, variantId: scenario, recentCases: generationHistory(history, caseParams),
        ...(practiceSource ? { focusSkill: practiceSource.skillId, previousVariant: caseParams.variantId } : {}),
        seenVariants: [...new Set(history.filter(item => item.params?.interviewType === caseParams.interviewType).map(item => item.params.variantId).filter(Boolean))],
        seenFingerprints: [...new Set(history.flatMap(item => item.fingerprints || []))],
      });
      if (!result.caseText?.trim()) throw new Error('ИИ вернул пустой кейс. Попробуй ещё раз.');
      const received = new Set(result.fingerprints || []);
      if ([...cases, ...loadCases()].some(item => caseWords(item.caseText) === caseWords(result.caseText)
          || item.fingerprints?.some(fingerprint => received.has(fingerprint)))) {
        throw new Error('Получился повтор предыдущего кейса. Попробуй сгенерировать ещё раз.');
      }
      if (caseParams.interviewType === 'product_execution' && !result.caseRoute?.length) {
        throw new Error('Не удалось подготовить шаги кейса. Попробуй сгенерировать ещё раз.');
      }
      if (practiceSource && (result.focusSkill !== practiceSource.skillId || !result.caseRoute?.some(step => step.id === 'skill_checkpoint'))) {
        throw new Error('Не удалось подготовить тренировку навыка. Попробуй ещё раз.');
      }
      const item = { id: crypto.randomUUID(), title: titleOf(result.caseText), caseText: result.caseText, caseIntro: result.caseIntro, caseRoute: result.caseRoute || [], fingerprints: result.fingerprints || [], params: { ...caseParams, variantId: result.variantId || undefined }, mode: caseMode, focusSkill: result.focusSkill, practiceSource, answers: {}, attempts: [], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
      setCases(prev => [item, ...prev]); open(item, 'solve');
    } catch (e) { setError(e.message || 'Не удалось сгенерировать кейс. Попробуй ещё раз.'); }
    finally { lock.current = false; setBusy(''); }
  };
  const generate = event => {
    event.preventDefault();
    startCase(params, variantId, mode);
  };
  const practiceAgain = () => startCase(active.params, 'surprise', active.mode || 'practice', {
    skillId: practiceSkill, title: active.title || titleOf(active.caseText),
    feedback: practice?.skillId === practiceSkill ? practice : undefined,
  });
  const evaluate = async () => {
    if (lock.current || hintLock.current || !active) return;
    const missing = fields.find(([key]) => !active.answers[key]?.trim());
    if (missing) { update(active.id, c => ({ ...c, currentQuestionId: missing[0] })); setError('Перед разбором заполни все ответы кейса.'); return; }
    lock.current = true; setBusy('evaluate'); setError(''); setReviewError('');
    const item = active;
    const answers = { ...item.answers };
    try {
      const hintedSteps = Object.entries(item.hints || {}).filter(([, hint]) => hint?.basic || hint?.ai?.length).map(([id]) => id);
      const reviewRoute = caseRoute.map(({ id, question, scene, evidence, answerFormat }) => ({ id, question, scene, evidence, ...(answerFormat ? { hint: answerFormat } : {}) }));
      const result = await api.evaluate({
        caseText: story ? item.caseIntro || item.caseText : item.caseText,
        answers,
        trackId: item.params.trackId,
        interviewType: item.params.interviewType,
        mvp: true,
        hintUsage: countHints(item.hints),
        hintedSteps,
        ...(item.focusSkill ? { focusSkill: item.focusSkill } : {}),
        ...(reviewRoute.length ? { caseRoute: reviewRoute } : {}),
      });
      if (!result.evaluation?.trim()) throw new Error('ИИ вернул пустой разбор. Попробуй ещё раз.');
      update(item.id, c => ({ ...c, attempts: [...c.attempts, { answers, questionVersion: 2, questions: fields, evaluation: result.evaluation, score: result.score, practice: result.practice, createdAt: new Date().toISOString() }] }));
      setAttemptIndex(null);
      if (!diagnostic) go('review');
    } catch (e) {
      setReviewError(e.message || 'Не удалось проверить решение.');
    }
    finally { lock.current = false; setBusy(''); }
  };
  const hasChanges = active && hasAttemptChanges(active, attempts.at(-1));

  if (screen === 'interviews') return <Interview start={interviewStart} onExit={() => { setInterviewStart(null); go('home'); }} onStudy={(target, params = {}) => { setInterviewStart(null); setStudyLesson(params.lessonId || null); if (params.chapter) setBookChapter(params.chapter); if (target === 'cards') setTheorySavedOnly(false); go(target); }}/>;

  return <div className="mvp-app">
    <header className="mvp-header" data-focus={screen === 'solve' ? 'true' : undefined}>
      <button className="clean-brand" disabled={!!busy} onClick={() => go('library')} aria-label="Hack the Case — практика"><span className="mark">H</span><b>Hack the Case</b></button>
      <nav aria-label="Основная навигация">
        <button aria-current={screen === 'home' || screen === 'progress' ? 'page' : undefined} disabled={!!busy} onClick={() => go('home')}>Главная</button>
        <button aria-current={screen === 'library' ? 'page' : undefined} disabled={!!busy} onClick={() => go('library')}>Практика</button>
        <button aria-current={['learning', 'cards', 'theory'].includes(screen) ? 'page' : undefined} disabled={!!busy} onClick={() => go('learning')}>Учёба</button>
        <Button variant="accent" size="sm" disabled={!!busy} onClick={() => go('generate')}>Новый кейс</Button>
      </nav>
    </header>
    <main className={`mvp-main mvp-screen-${screen}`}>
      {saveError && <p role="alert" className="mvp-notice">{saveError}</p>}
      {error && <p role="alert" className="mvp-notice">{error}</p>}
      {theoryError && <p role="alert" className="mvp-notice">{theoryError}</p>}
      {['learning', 'theory', 'cards'].includes(screen) && <div className="mvp-lib-filter" role="group" aria-label="Раздел учёбы">
        {[['learning', 'Путь'], ['theory', 'Теория'], ['cards', 'Карточки']].map(([key, label]) => <button type="button" key={key} aria-pressed={screen === key} onClick={() => { if (key === 'cards') setTheorySavedOnly(false); if (key === 'learning') setStudyLesson(null); go(key); }}>{label}</button>)}
      </div>}
      {screen === 'learning' && <LearningPath key={studyLesson || 'path'} focusLessonId={studyLesson} onOpenCases={() => go('library')}/>}
      {screen === 'theory' && <BookTheoryPage initialChapter={bookChapter} savedIds={savedTheory} onToggle={toggleTheory} onResume={active ? () => go('solve') : null}/>}
      {screen === 'cards' && <TheoryPage onOpenChapter={number => { setBookChapter(number); go('theory'); }} savedIds={savedTheory} onToggle={toggleTheory} initialSavedOnly={theorySavedOnly} onResume={active ? () => go('solve') : null}/>}
      {screen === 'home' && !profile && cases.length === 0 && readRuns().length === 0 && <Onboarding onDone={answers => { setProfile(answers); }}/>}
      {screen === 'home' && (profile || cases.length > 0 || readRuns().length > 0) && <Home preferred={preferredSkeleton(profile)} split={needsSplit(profile)} onStart={id => { setInterviewStart({ skeleton: id }); go('interviews'); }} onResume={id => { setInterviewStart({ open: id }); go('interviews'); }} onProgress={() => go('progress')} onLibrary={() => go('library')}/>}
      {screen === 'progress' && <Progress onStart={id => { setInterviewStart({ skeleton: id }); go('interviews'); }}/>}
      {screen === 'library' && <div className="mvp-lib-filter" role="group" aria-label="Тип практики">
        {[['interview', 'Собесы'], ['self', 'Кейсы'], ['history', 'История']].map(([key, label]) => <button type="button" key={key} aria-pressed={libFilter === key} onClick={() => setLibFilter(key)}>{label}</button>)}
      </div>}
      {screen === 'library' && libFilter === 'history' && <Progress onStart={id => { setInterviewStart({ skeleton: id }); go('interviews'); }}/>}
      {screen === 'library' && libFilter === 'interview' && <InterviewEntry onOpen={() => go('interviews')} onOpenRun={id => { setInterviewStart({ open: id }); go('interviews'); }} showList/>}
      {screen === 'library' && libFilter === 'self' && (cases.length === 0 ? <>
        <div className="mvp-page-heading"><div><div className="clean-eyebrow">Твоя практика</div>
        <h1>Мои кейсы<span className="mvp-count">{String(cases.length).padStart(2, '0')}</span></h1>
        <p className="mvp-lead">От первой гипотезы до уверенного решения.</p></div><span className="mvp-small-note"><Clock3 size={15}/>15–20 минут на практику</span></div>

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
        </> : <CaseLibrary cases={cases} interviewTypes={INTERVIEWS} onOpen={open} onNew={() => go('generate')} onArchive={archive} onRetry={retryCase} onLearn={() => go('learning')} onInterview={startInterviewFor}/>)}
      {screen === 'generate' && <>
        <button type="button" className="mvp-starter mvp-search-starter" onClick={() => go('interviews')}>
          <span className="mvp-starter-tag">Кейс-интервью<ArrowUpRight size={17}/></span>
          <b>Пройти интервью</b>
          <p>Запрашивай данные, защищай решения и получай разбор по ходу интервью.</p>
        </button>
        <div className="mvp-page-heading"><div><div className="clean-eyebrow">Новая тренировка</div><h1>Настрой свой кейс</h1>
        <p className="mvp-lead"><strong>Тренируйся на новых задачах сколько угодно.</strong> Как на собеседовании: знакомый навык, новая ситуация, другие данные и вопросы.</p></div><div className="mvp-flow"><b>01 Кейс</b><ArrowRight size={14}/><span>02 Решение</span><ArrowRight size={14}/><span>03 Разбор</span></div></div>
        <button type="button" className="mvp-starter mvp-search-starter" disabled={!!busy} onClick={startSearchDiagnostic}>
          <span className="mvp-starter-tag">Диагностика метрик · 2 хода<ArrowUpRight size={17}/></span>
          <b>{SEARCH_CASE_TITLE}</b>
          <p>Запроси данные, предложи действие и доработай его после короткого комментария.</p>
        </button>
        {configError && <div role="alert" className="mvp-notice">{configError} <button onClick={fetchConfig}>Повторить загрузку</button></div>}
        {!config && !configError && <p role="status">Загружаем настройки…</p>}
        {config && <div className="mvp-setup-layout"><form className="mvp-card mvp-form mvp-setup" onSubmit={generate}>
          <fieldset>
            <legend>01 / Направление</legend>
            <div className="mvp-direction">{INTERVIEWS.map(type => {
              const Icon = DIRECTION_ICONS[type.id];
              const selected = params.interviewType === type.id;
              return <button type="button" className={selected ? 'selected' : ''} aria-pressed={selected} disabled={!!busy} key={type.id}
                onClick={() => {
                  setVariantId('surprise');
                  setParams(p => ({ ...p, trackId: 'product', interviewType: type.id }));
                }}>
                <span className="mvp-direction-top"><Icon size={20} aria-hidden="true"/><span className="mvp-choice-check">{selected && <Check size={12} aria-hidden="true"/>}</span></span>
                <b>{type.label}</b><small>{type.description}</small>
              </button>;
            })}</div>
          </fieldset>
          <label>Вариант тренировки<span className="mvp-select-wrap">
            <select value={variantId} disabled={!!busy} onChange={event => setVariantId(event.target.value)}>
              <option value="surprise">Подобрать сценарий</option>
              {variants.map(([id, title]) => <option key={id} value={id}>{title}</option>)}
            </select><ChevronDown size={16}/>
          </span></label>
          {variantId !== 'surprise' && <p className="mvp-muted">{variants.find(([id]) => id === variantId)?.[2]}</p>}
          <label>02 / Отрасль<span className="mvp-select-wrap"><select required disabled={!!busy} value={params.industry} onChange={e => setParams(p => ({ ...p, industry: e.target.value }))}>{config.industries.map(x => <option value={x} key={x}>{x.includes(' / ') ? x.split(' / ').slice(1).join(' / ') : x}</option>)}</select><ChevronDown size={16}/></span></label>
          <fieldset><legend>03 / Сложность</legend><div className="mvp-levels">{Object.keys(config.difficultyLevels).map(x => <button type="button" aria-pressed={params.difficulty === x} className={params.difficulty === x ? 'selected' : ''} disabled={!!busy} key={x} onClick={() => setParams(p => ({ ...p, difficulty:x }))}>{x}</button>)}</div></fieldset>
          <label><span>04 / Свой контекст <small className="mvp-muted">необязательно</small></span><textarea maxLength={2000} disabled={!!busy} value={params.extraContext} onChange={e => setParams(p => ({ ...p, extraContext: e.target.value }))} placeholder="Например: пользователи добавляют товары в корзину, но не оформляют заказ" rows={2}/></label>
          <fieldset>
            <legend>Режим прохождения</legend>
            <div className="mvp-levels">
              <button type="button" className={mode === 'practice' ? 'selected' : ''} aria-pressed={mode === 'practice'} disabled={!!busy} onClick={() => setMode('practice')}>Тренировка</button>
              <button type="button" className={mode === 'self_check' ? 'selected' : ''} aria-pressed={mode === 'self_check'} disabled={!!busy} onClick={() => setMode('self_check')}>Самопроверка</button>
            </div>
            <p className="mvp-muted">{mode === 'self_check' ? 'Решаешь самостоятельно. Разбор откроется в конце.' : 'Подсказки и материалы доступны по ходу кейса.'}</p>
          </fieldset>
          <div className="mvp-form-footer"><span><Clock3 size={14}/>15–20 минут на решение</span><Button variant="accent" type="submit" icon={<ArrowRight size={17}/>} disabled={!!busy}>{busy ? 'Генерируем кейс…' : 'Сгенерировать кейс'}</Button></div>
          {busy && <p role="status">ИИ готовит условие и данные. Это может занять около минуты.</p>}
        </form><aside className="mvp-setup-aside"><span className="mvp-kicker">Твоя тренировка</span><h2>{selectedType.label}</h2><p>{selectedType.description}. Условие, вопросы и разбор адаптируются под выбранный тип.</p><div className="mvp-setup-spec"><span>Направление<b>Продуктовое</b></span><span>Уровень<b>{params.difficulty}</b></span><span>Формат<b>Письменный кейс</b></span></div><div className="mvp-aside-bottom"><Sparkles size={20}/><b>Обратная связь по делу</b><p>Что получилось, где не хватает аргументов и что улучшить в следующей попытке.</p></div></aside></div>}
      </>}
      {screen === 'solve' && active && diagnostic && <>
        <button className="mvp-back" disabled={!!busy} onClick={() => go('library')}>← Мои кейсы</button>
        <h1>{active.title}</h1>
        <SearchDiagnostic key={active.id} item={active} slice={diagnosticSlice} attempt={attempts.at(-1)} busy={busy}
          reviewError={reviewError} hasChanges={hasChanges} onRequest={requestDiagnosticSlice}
          onAnswer={(key, value) => update(active.id, c => ({ ...c, answers: { ...c.answers, [key]: value } }))}
          onReset={() => {
            setReviewError('');
            update(active.id, c => ({
              ...c, diagnosticSource: null, answers: { search_request: c.answers.search_request },
            }));
          }}
          onEvaluate={evaluate} onReview={() => { setAttemptIndex(null); go('review'); }}/>
      </>}
      {screen === 'solve' && active && !diagnostic && <>
        <div className="mvp-solve-top"><button className="mvp-back" disabled={!!busy} onClick={() => go('library')}>← Мои кейсы</button>
        <button className="mvp-back" disabled={!!busy} onClick={() => startInterviewFor(active)}>Пройти как собес →</button></div>
        {!story && <div className="clean-eyebrow">Шаг 2 · Решение</div>}<h1>{story ? active.title : 'Твой ход'}</h1>
        {(selfCheck || (active.focusSkill && skillLabel)) && <p className="mvp-muted">
          {selfCheck ? 'Самопроверка' : 'Фокус тренировки'}{active.focusSkill && skillLabel ? ` · ${skillLabel}` : ''}
        </p>}
        {!story && <p className="mvp-lead">Один кейс, {fields.length} шагов. Отвечай на один вопрос за раз — все мысли сложатся в полное решение.</p>}
        <CaseFlow key={active.id} fields={fields} caseRoute={caseRoute} caseIntro={active.caseIntro} answers={active.answers} questionId={active.currentQuestionId}
          interviewType={active.params.interviewType} hints={active.hints} hintBusy={hintBusy} onRevealHint={revealHint} onRequestHint={requestHint} selfCheck={selfCheck}
          onQuestion={key => update(active.id, c => ({ ...c, currentQuestionId: key }))}
          onAnswer={(key, value) => update(active.id, c => ({
            ...c, currentQuestionId: key,
            answers: story ? storyAnswers(caseRoute, c.answers, key, value) : { ...c.answers, [key]: value },
          }))}
          onEvaluate={evaluate} busy={busy} saveError={saveError} reviewError={reviewError} hasChanges={hasChanges} attempts={attempts}
          onReview={() => { setAttemptIndex(null); go('review'); }}
          condition={<>
            <p className="mvp-muted">Данные кейса вымышлены и даны для тренировки.</p>
            {!selfCheck && <ConditionAssistant key={active.id} caseText={conditionText}/>}
            <CaseContent text={conditionText}/>
            {!selfCheck && <>
              <CaseMaterials key={`materials-${active.id}`} item={active} savedIds={savedTheory} onToggle={toggleTheory} onOpenTheory={() => { setTheorySavedOnly(true); go('cards'); }}/>
              {attempts.length > 0 && <details><summary>Предыдущий разбор</summary><Review value={attempts.at(-1).evaluation} score={attempts.at(-1).score}/></details>}
            </>}
          </>}/>
      </>}
      {screen === 'review' && active && attempt && <div className="mvp-narrow">
        <button className="mvp-back" disabled={!!busy} onClick={() => go('library')}>← Мои кейсы</button>
        <div className="clean-eyebrow">Шаг 3 · Обратная связь</div><h1>Разбор решения</h1><p className="mvp-lead">{titleOf(active.title || active.caseText)}</p>
        {selfCheck && <p className="mvp-muted">Результат самопроверки</p>}
        <label className="mvp-version">Версия решения<select value={attemptIndex ?? attempts.length - 1} onChange={e => setAttemptIndex(Number(e.target.value))}>{attempts.map((a, i) => <option key={i} value={i}>Версия {i + 1} · {new Date(a.createdAt).toLocaleString('ru-RU')}</option>)}</select></label>
        <article className="mvp-card mvp-review"><Review value={attempt.evaluation} score={attempt.score}/>{/(конверс|воронк|метрик|conversion|funnel|metric)/i.test(attempt.evaluation) && <div className="mycases-learning-tip"><strong>Хочешь потренировать метрики?</strong><p>Это дополнительная практика по теме разбора, а не автоматическая оценка твоих навыков.</p><button type="button" onClick={() => go('learning')}>Перейти к урокам по метрикам →</button></div>}<details className="mvp-review-block"><summary>Ответ этой версии</summary>{(attempt.questions || (attempt.questionVersion === 2 ? FIELDS : LEGACY_FIELDS)).map(([key, label]) => <section key={key}><h3>{label}</h3><div className="mvp-prose">{attempt.answers[key] || 'Не заполнено'}</div>{(!diagnostic && (!story || fields.some(([id]) => id === key))) && <button className="mvp-edit-step" onClick={() => { update(active.id, c => ({ ...c, currentQuestionId: key })); go('solve'); }}>Доработать этот шаг</button>}</section>)}</details><button type="button" className="mvp-review-interview" onClick={() => startInterviewFor(active)}>Пройти как собес →</button></article>
        {canPractice && <section className="mvp-card mvp-practice-link">
          <h2>{skillLabel}</h2>
          {priorPractice ? <div className="mvp-practice-comparison">
            <div><strong>Прошлый кейс · {priorPractice.title}</strong>
              {priorPractice.feedback ? <PracticeStatus feedback={priorPractice.feedback}/> : <p>Сравнение по этому навыку началось с текущей тренировки.</p>}
            </div>
            <div><strong>Текущий кейс</strong>
              {practice?.skillId === practiceSkill ? <PracticeStatus feedback={practice}/> : <p>Нет оценки контрольного шага.</p>}
            </div>
          </div> : practice ? <PracticeStatus feedback={practice}/> : <p>В новом кейсе будет отдельный вопрос на этот навык.</p>}
          <Button variant="accent" disabled={!!busy} onClick={practiceAgain}>
            {busy ? 'Подбираем кейс…' : active.focusSkill ? 'Ещё кейс на этот навык' : 'Потренировать этот навык'}
          </Button>
        </section>}
        <div className="mvp-actions"><Button variant={canPractice ? 'neutral' : 'accent'} disabled={!!busy} onClick={() => go('solve')}>Улучшить решение</Button><Button variant="neutral" disabled={!!busy} onClick={() => go('generate')}>Новый кейс</Button></div>
        <p className="mvp-muted">Редактирование продолжится с последнего черновика. ИИ может ошибаться — сверяй выводы с данными кейса.</p>
      </div>}
    </main>
  </div>;
}
