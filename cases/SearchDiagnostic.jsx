import React, { useEffect, useRef, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { Button } from '../design/components/Button.jsx';
import { SEARCH_ROUTE } from './searchDiagnostic.js';

export default function SearchDiagnostic({
  item, slice, attempt, busy, reviewError, hasChanges, onAnswer, onRequest, onReset, onEvaluate, onReview,
}) {
  const [requestStep, decisionStep] = SEARCH_ROUTE;
  const [requestError, setRequestError] = useState('');
  const evidence = useRef(null);
  useEffect(() => {
    if (slice) evidence.current?.focus({ preventScroll: true });
  }, [slice]);

  const request = async event => {
    event.preventDefault();
    setRequestError('');
    try {
      if (!await onRequest()) {
        setRequestError('Уточни один показатель и разбивку. Какое сравнение тебе нужно?');
      }
    } catch (error) {
      setRequestError(error.message || 'Не удалось открыть данные. Попробуй ещё раз.');
    }
  };
  let feedback;
  if (attempt?.evaluation && attempt.answers[requestStep.id] === item.answers[requestStep.id]) {
    try {
      const review = JSON.parse(attempt.evaluation);
      feedback = review.topTips?.[0] || review.improvements?.[0] || review.summary;
    } catch {
      feedback = 'Подробный комментарий доступен в разборе.';
    }
  }

  return <div className="mvp-case-flow mvp-search-case">
    <section className="mvp-card mvp-form mvp-question-card" aria-label="Твоё решение">
      <p className="mvp-kicker">Ход {slice ? '2' : '1'} из 2</p>
      <p className="mvp-search-intro">{item.caseText}</p>
      {slice ? <>
        <section className="mvp-step-evidence" aria-label="Ответ интервьюера" ref={evidence} tabIndex={-1}>
          <p className="mvp-kicker">Ответ интервьюера</p>
          <p>{slice.evidence}</p>
          <details>
            <summary>Твой запрос</summary>
            <p>{item.answers[requestStep.id]}</p>
            <button type="button" className="mvp-edit-step" disabled={!!busy} onClick={() => { setRequestError(''); onReset(); }}>
              {item.answers[decisionStep.id] ? 'Изменить запрос и начать решение заново' : 'Изменить запрос'}
            </button>
          </details>
        </section>
        <form onSubmit={event => { event.preventDefault(); onEvaluate(); }}>
          <label className="mvp-question-input">
            <span>{slice.question}</span>
            <textarea rows={3} required maxLength={4000} disabled={!!busy}
              value={item.answers[decisionStep.id] || ''} onChange={event => onAnswer(decisionStep.id, event.target.value)}/>
          </label>
          {feedback && <section className="mvp-step-hint" aria-label="Обратная связь" aria-live="polite">
            <b>{hasChanges ? 'Комментарий к прошлому ответу' : 'Обратная связь'}</b>
            <p>{feedback}</p>
          </section>}
          {reviewError && <p className="mvp-step-error" role="alert">{reviewError}</p>}
          <div className="mvp-step-navigation">
            <Button type="submit" variant="accent" icon={<ArrowRight size={17}/>}
              disabled={!!busy || !hasChanges || !item.answers[decisionStep.id]?.trim()}>
              {busy ? 'Проверяем ответ…' : attempt ? 'Проверить новую версию' : 'Проверить ответ'}
            </Button>
            {attempt && <Button variant="neutral" disabled={!!busy} onClick={onReview}>Полный разбор</Button>}
          </div>
        </form>
      </> : <form onSubmit={request}>
        <label className="mvp-question-input">
          <span>{requestStep.question}</span>
          <textarea rows={3} required maxLength={4000} disabled={!!busy}
            value={item.answers[requestStep.id] || ''} onChange={event => { setRequestError(''); onAnswer(requestStep.id, event.target.value); }}/>
        </label>
        {requestError && <p role="alert" className="mvp-step-error">{requestError}</p>}
        <div className="mvp-step-navigation">
          <Button type="submit" variant="accent" icon={<ArrowRight size={17}/>}
            disabled={!!busy || !item.answers[requestStep.id]?.trim()}>
            {busy ? 'Открываем данные…' : 'Запросить данные'}
          </Button>
        </div>
      </form>}
    </section>
  </div>;
}
