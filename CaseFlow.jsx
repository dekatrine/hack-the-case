import React, { useEffect, useRef, useState } from 'react';
import { ArrowRight, Check, FileText, Sparkles, X } from 'lucide-react';
import { Button } from './design/components/Button.jsx';
import CaseContent from './CaseContent.jsx';
import { answerCountLabel } from './cases/storyPath.js';

const GUIDES = {
  problem: 'Сначала опиши потребность или изменение, которого нужно добиться. Решение и конкретные функции оставь для следующих шагов.',
  audience: 'Выбери один сегмент и объясни, почему задача особенно важна именно для него. Опирайся на контекст кейса.',
  hypotheses: 'Сформулируй разные варианты. Для каждого подумай, какой факт помог бы его проверить.',
  analysis: 'Найди конкретный факт или число в условии. Отдельно обозначь вывод и допущение: данные могут не доказывать причину.',
  validation: 'Выбери проверку, результат которой поможет принять решение. Что изменится в твоём выводе, если гипотеза не подтвердится?',
  recommendation: 'Свяжи выбранное действие с проблемой и предыдущими ответами. Объясни выбор с учётом ресурсов и ограничений.',
  metric: 'Укажи целевое поведение, период измерения и направление изменения. Подумай, какой показатель защитит от побочных эффектов.',
  risk: 'Назови один существенный риск и способ его заметить или ограничить. Учитывай бюджет, сроки и опыт пользователя.',
};

const RESPONSE_GUIDANCE = {
  problem: 'Укажи, что изменилось и какой результат нужен команде.',
  audience: 'Объясни, чем выбранная группа отличается от остальных.',
  hypotheses: 'Для каждого варианта отметь, какое наблюдение могло бы его подтвердить.',
  analysis: 'Выбери одну цифру или ограничение и объясни, как оно влияет на твой вывод.',
  validation: 'Укажи, какой результат проверки изменит твоё решение.',
  recommendation: 'Свяжи предлагаемое действие с одним фактом из кейса.',
  metric: 'Укажи, в какую сторону должна измениться метрика и за какой срок.',
  risk: 'Опиши, по какому раннему сигналу заметишь проблему.',
};

export function initialQuestion(fields, answers, savedQuestion) {
  const saved = fields.findIndex(([key]) => key === savedQuestion);
  if (saved >= 0) return saved;
  const missing = fields.findIndex(([key]) => !answers[key]?.trim());
  return missing < 0 ? 0 : missing;
}

export default function CaseFlow({ fields, caseRoute = [], caseIntro, answers, questionId, onQuestion, onAnswer, onEvaluate, condition, busy, saveError, reviewError, hasChanges, attempts, onReview, interviewType, hints = {}, hintBusy, onRevealHint, onRequestHint, selfCheck = false }) {
  const [currentKey, setCurrentKey] = useState(() => fields[initialQuestion(fields, answers, questionId)][0]);
  const index = Math.max(0, fields.findIndex(([id]) => id === currentKey));
  const [key, label, hint, placeholder] = fields[index];
  const { evidence, options, scene, longAnswer, chapter, chapterTitle, nextByAnswer, answerFormat } = caseRoute[index] || {};
  const story = !!chapter;
  const hasNext = index < fields.length - 1 || (story && Object.keys(nextByAnswer || {}).length > 0);
  const previous = story && index > 0 ? answers[fields[index - 1][0]] : '';
  const completed = fields.filter(([id]) => answers[id]?.trim()).length;
  const [notice, setNotice] = useState('');
  const [showHint, setShowHint] = useState(false);
  const [hintError, setHintError] = useState(null);
  const stepHints = hints[key]?.ai || [];
  const detail = options?.length ? 'Выбери вариант, который лучше отвечает на вопрос этого шага.'
    : longAnswer ? 'Начни с вывода, затем подкрепи его данными или ограничением из условия.'
    : interviewType === 'product_strategy' && key === 'analysis' ? 'Выбери одну цифру о рынке или ресурсах и объясни, почему она усиливает выбранный вариант.'
    : RESPONSE_GUIDANCE[key] || (evidence ? 'Открой данные шага и укажи, какое сравнение поддерживает твой вывод.' : 'Достаточно одного конкретного аргумента, который связан с условием.');
  const guidance = answerFormat || hint || detail;
  const coaching = GUIDES[key] || (hint && hint !== answerFormat ? hint : guidance);
  const openingContext = index === 0 && story && caseIntro && !scene;
  const answerDescription = [(!selfCheck || answerFormat) && `hint-${key}`, notice && 'case-step-error'].filter(Boolean).join(' ') || undefined;
  const conditionSheet = useRef(null);
  const conditionBody = useRef(null);
  const conditionButton = useRef(null);
  const heading = useRef(null);
  const input = useRef(null);
  const progress = useRef(null);
  useEffect(() => {
    setNotice(''); setShowHint(false);
    heading.current?.focus({ preventScroll: true });
  }, [key]);
  const move = next => {
    setNotice('');
    setCurrentKey(fields[next][0]);
    onQuestion(fields[next][0]);
    progress.current?.scrollIntoView?.({ block: 'start' });
  };
  const askForHint = async () => {
    setHintError(null);
    try {
      await onRequestHint(key, label, guidance);
    } catch (error) {
      setHintError({ key, message: error.message || 'Не удалось получить подсказку. Попробуй ещё раз.' });
    }
  };
  const forward = () => {
    if (!answers[key]?.trim()) {
      setNotice(options?.length ? 'Выбери один вариант.' : answerFormat || (longAnswer ? 'Напиши решение и объясни свои аргументы.' : 'Напиши ответ на этот вопрос — достаточно одной-двух фраз.'));
      input.current?.focus(); return;
    }
    if (hasNext && index < fields.length - 1) { move(index + 1); return; }
    const missing = fields.findIndex(([id]) => !answers[id]?.trim());
    if (missing >= 0) { move(missing); return; }
    onEvaluate();
  };
  return <div className="mvp-case-flow">
    {story ? <section ref={progress} className="mvp-story-progress" aria-label="Прогресс кейса">
      <div className="mvp-case-progress-caption"><span aria-live="polite">Глава {chapter} из 4 · Шаг {index + 1}</span><span>{answerCountLabel(completed)}</span></div>
      <div className="mvp-story-progress-segments" role="progressbar" aria-label="Пройденные главы" aria-valuemin={0} aria-valuemax={4} aria-valuenow={chapter - (completed < fields.length ? 1 : 0)}>
        {[1, 2, 3, 4].map(number => <span key={number} data-state={number < chapter ? 'done' : number === chapter ? 'active' : 'future'}/>)}
      </div>
    </section> : <section ref={progress} className="mvp-case-progress" aria-label="Прохождение полного кейса">
      <div className="mvp-case-progress-caption"><span aria-live="polite">Шаг {index + 1} из {fields.length}</span><span>Заполнено {completed} из {fields.length}</span></div>
      <div className="mvp-case-progress-track" role="progressbar" aria-label="Заполненные ответы" aria-valuemin={0} aria-valuemax={fields.length} aria-valuenow={completed}><span style={{ width: `${completed / fields.length * 100}%` }}/></div>
      <nav className="mvp-question-steps" aria-label="Вопросы кейса">{fields.map(([id, title], i) => <button type="button" key={id} disabled={!!busy} aria-current={i === index ? 'step' : undefined} aria-label={`Шаг ${i + 1}: ${title}${answers[id]?.trim() ? ' — заполнено' : ''}`} onClick={() => move(i)}>{answers[id]?.trim() ? <Check size={15} aria-hidden="true"/> : i + 1}</button>)}</nav>
    </section>}
    <div className={story ? 'mvp-story-workspace' : undefined}>
      <section className="mvp-card mvp-form mvp-question-card" aria-label="Твоё решение">
        <div className="mvp-question-toolbar">
          {story && <span className="mvp-kicker">{chapterTitle}</span>}
          <button ref={conditionButton} className="mvp-condition-trigger" type="button" aria-haspopup="dialog" aria-controls="case-condition-sheet"
            onClick={() => {
              conditionSheet.current.showModal();
              conditionBody.current.scrollTop = 0;
            }}>
            <FileText size={16} aria-hidden="true"/>{evidence || scene ? 'Условие и данные' : 'Условие кейса'}
          </button>
        </div>
        <h2 ref={heading} tabIndex={-1} id={`question-${key}`}>{label}</h2>
        {(scene || evidence || openingContext) && <section className="mvp-step-evidence" aria-label="Данные для текущего шага">
          {openingContext && <CaseContent text={caseIntro}/>}
          {scene && <CaseContent text={scene}/>}
          {evidence && <CaseContent text={evidence}/>}
        </section>}
        {(!selfCheck || answerFormat) && <p className="mvp-question-hint" id={`hint-${key}`}>{answerFormat && <strong>Что написать. </strong>}{guidance}</p>}
        {story && Object.keys(nextByAnswer || {}).length > 0 && fields.slice(index + 1).some(([id]) => answers[id]?.trim()) &&
          <p className="mvp-question-hint">Если изменить выбор, ответы после этого шага начнутся заново.</p>}
        {options?.length ? <fieldset className="mvp-step-options" aria-labelledby={`question-${key}`} aria-describedby={answerDescription} disabled={!!busy}>
          {options.map((option, optionIndex) => <label key={option}>
            <input ref={optionIndex === 0 ? input : undefined} type="radio" name={`answer-${key}`} value={option} checked={answers[key] === option} onChange={() => { setNotice(''); onAnswer(key, option); }}/>
            <span>{option}</span>
          </label>)}
        </fieldset> : <label className={`mvp-question-input${longAnswer ? ' mvp-question-input-long' : ''}`} htmlFor={`answer-${key}`}><span className="mvp-visually-hidden">{index + 1}. {label}</span><textarea ref={input} id={`answer-${key}`} aria-describedby={answerDescription} aria-invalid={notice ? true : undefined} placeholder={selfCheck ? 'Твой ответ…' : longAnswer ? 'Разверни аргументы и опирайся на данные…' : placeholder || 'Запиши ход своих мыслей…'} rows={longAnswer ? 9 : story ? 3 : 6} disabled={!!busy} value={answers[key] || ''} onChange={e => { setNotice(''); onAnswer(key, e.target.value); }}/></label>}
        {notice && <p id="case-step-error" role="alert" className="mvp-step-error">{notice}</p>}
        {!selfCheck && <><div className="mvp-step-help">
          {coaching !== guidance && <button type="button" className="mvp-step-hint-toggle" disabled={!!busy || hintBusy} aria-expanded={showHint} aria-controls="case-step-hint" onClick={() => {
            if (!showHint && !hints[key]?.basic) onRevealHint(key);
            setShowHint(!showHint);
          }}>{showHint ? 'Скрыть подсказку' : hints[key]?.basic ? 'Обычная подсказка' : 'Обычная подсказка · −1'}</button>}
          {stepHints.length < 2 && <button type="button" className="mvp-step-hint-toggle" disabled={!!busy || hintBusy} onClick={askForHint}>
            <Sparkles size={15} aria-hidden="true"/>{hintBusy ? 'Готовим подсказку…' : stepHints.length ? 'Ещё ИИ-подсказка · −2' : 'ИИ-подсказка · −2'}
          </button>}
        </div>
        {showHint && <div id="case-step-hint" className="mvp-step-hint"><b>С чего начать</b><p>{coaching}</p></div>}
        {!!stepHints.length && <div className="mvp-step-hint" aria-live="polite"><b>ИИ-подсказки</b>{stepHints.map(text => <p key={text}>{text}</p>)}</div>}
        {hintError?.key === key && <p className="mvp-step-error" role="alert">{hintError.message}</p>}</>}
        <p className="mvp-muted mvp-autosave" role="status">{saveError ? 'Сохранение недоступно' : 'Черновик сохраняется в этом браузере'}</p>
        <div className="mvp-step-navigation"><Button variant="neutral" disabled={!!busy || hintBusy || index === 0} onClick={() => move(index - 1)}>Назад</Button><Button variant="accent" disabled={!!busy || hintBusy || (!hasNext && !hasChanges)} icon={<ArrowRight size={17}/>} onClick={forward}>{busy ? 'Разбираем решение…' : hasNext ? 'Дальше' : attempts.length ? 'Проверить новую версию' : selfCheck ? 'Завершить и получить разбор' : 'Получить ИИ-разбор'}</Button></div>
        {!hasNext && reviewError && <div role="alert" className="mvp-step-error">
          {reviewError}
          {!saveError && <div>Ответы сохранены в этом браузере.</div>}
        </div>}
        {!hasNext && completed < fields.length && <p className="mvp-muted mvp-step-note">Перед разбором заполни все ответы. Кнопка вернёт к первому пропущенному вопросу.</p>}
        {!hasChanges && <p className="mvp-muted mvp-step-note">Измени ответ, чтобы проверить новую версию.</p>}
        {busy && <p role="status" className="mvp-step-note">Проверяем всё решение: аргументы, данные и рекомендацию…</p>}
        {!selfCheck && attempts.length > 0 && <button type="button" className="mvp-step-review-link" disabled={!!busy} onClick={onReview}>Посмотреть предыдущий разбор</button>}
      </section>
    </div>
    <dialog ref={conditionSheet} id="case-condition-sheet" className="mvp-condition-sheet" aria-labelledby="case-condition-title"
      onClose={() => conditionButton.current?.focus({ preventScroll: true })}
      onClick={event => { if (event.target === event.currentTarget) event.currentTarget.close(); }}>
      <header className="mvp-condition-sheet-header">
        <h2 id="case-condition-title">Условие кейса</h2>
        <button type="button" className="mvp-condition-close" aria-label="Закрыть условие"
          onClick={() => conditionSheet.current.close()}><X size={20} aria-hidden="true"/></button>
      </header>
      <div ref={conditionBody} className="mvp-condition-sheet-body">
        {scene && <div className="mvp-story-scene"><CaseContent text={scene}/></div>}
        {evidence && <section className="mvp-step-evidence" aria-label="Данные для шага"><CaseContent text={evidence}/></section>}
        {previous && <details key={key} className="mvp-story-previous"><summary>Твой предыдущий ответ</summary><p>{previous}</p></details>}
        {condition}
      </div>
    </dialog>
  </div>;
}
