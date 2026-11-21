import React, { useState } from 'react';
import { track } from '../api/analytics.js';
import { assessReason, DECISION_CASE, evaluateInitiatives } from './decisionCase.js';

const RUB = v=>Math.round(v).toLocaleString('ru-RU')+' ₽';
export default function DecisionChallenge({ onExit, onComplete }) {
  const [selected,setSelected]=useState([]);
  const [stage,setStage]=useState('plan');
  const [check,setCheck]=useState('');
  const [reason,setReason]=useState('');
  const [attempts,setAttempts]=useState(0);
  const [review,setReview]=useState(false);
  const scenario=DECISION_CASE;
  const outcome=evaluateInitiatives(scenario,selected);
  const baseline=scenario.baseline;
  const checkValid=check==='checkout-logs';
  const reasoning=reason?assessReason(reason,outcome):null;
  function toggle(id) {
    if(stage!=='plan')return;
    setSelected(p=>p.includes(id)?p.filter(i=>i!==id):[...p,id]);
  }
  function run() {
    setStage('investigate');
    track('decision_simulation_started',{scenarioId:scenario.id,initiativeIds:selected.join(','),budgetSpent:outcome.spent});
  }
  function submit() {
    setAttempts(p=>p+1);
    setReview(true);
    track('decision_simulation_completed',{scenarioId:scenario.id,budgetSpent:outcome.spent,incrementalContribution:Math.round(outcome.incrementalContribution),checkValid,reasonCorrect:reasoning?.correct});
    onComplete?.({scenarioId:scenario.id,initiativeIds:selected,incrementalContribution:outcome.incrementalContribution,checkValid,reasonCorrect:reasoning?.correct,attempts:attempts+1});
  }
  function reset() {
    setSelected([]);setStage('plan');setCheck('');setReason('');setReview(false);
  }
  return <section className="lp-decision">
    <div className="lp-kicker">Business Lab · Решения с последствиями</div>
    <h1>{scenario.title}</h1>
    <p className="lp-theory">{scenario.description}</p>
    <div className="lp-progress" aria-label="Этап симуляции"><span style={{width:stage==='plan'?'33%':stage==='investigate'?'66%':'100%'}} /></div>
    <div className="lp-sim-results">
      <div><span>Доступный бюджет</span><strong>{RUB(scenario.budget)}</strong></div>
      <div><span>Выбрано инициатив</span><strong>{selected.length}</strong></div>
      <div><span>Остаток бюджета</span><strong>{RUB(outcome.remaining)}</strong></div>
    </div>
    {stage==='plan'?<>
      <h2>01 / Выбери инициативы</h2>
      <p className="mvp-muted">Эффекты — учебные допущения. Можно выбрать несколько инициатив, но нельзя превысить бюджет.</p>
      <div className="lp-initiatives">{scenario.initiatives.map(item=>{
        const chosen=selected.includes(item.id);
        const unavailable=!chosen && outcome.spent+item.cost>scenario.budget;
        return <button type="button" key={item.id} className="lp-initiative" aria-pressed={chosen} disabled={unavailable} onClick={()=>toggle(item.id)}>
          <span className="lp-initiative-check">{chosen?'✓':'+'}</span>
          <span className="lp-initiative-copy"><strong>{item.title}</strong><small>{item.detail}</small></span>
          <span className="lp-initiative-cost">{RUB(item.cost)}</span>
        </button>;
      })}</div>
      <div className="lp-actions"><button type="button" className="lp-secondary" onClick={onExit}>К карте навыков</button><button type="button" className="lp-primary" disabled={!selected.length} onClick={run}>Рассчитать последствия →</button></div>
    </>:<>
      <h2>02 / Последствия решений</h2>
      <div className="lp-sim-results">
        <div><span>Конверсия</span><strong>{outcome.conversionPct.toLocaleString('ru-RU',{maximumFractionDigits:1})}%</strong></div>
        <div><span>Заказы</span><strong>{Math.round(outcome.orders).toLocaleString('ru-RU')}</strong></div>
        <div><span>Выручка</span><strong>{RUB(outcome.revenue)}</strong></div>
      </div>
      <div className="lp-result"><span>Изменение вклада в прибыль после затрат</span><strong>{outcome.incrementalContribution>0?'+':''}{RUB(outcome.incrementalContribution)}</strong><p>Вклад = валовая прибыль после инициатив − базовая валовая прибыль − стоимость инициатив. Это учебная модель без неопределённости, налогов, долгосрочных эффектов и других расходов.</p></div>
      <h2>03 / Что проверишь перед запуском?</h2>
      <div className="lp-answers">{scenario.checks.map(item=><button type="button" key={item.id} className="lp-answer" aria-pressed={check===item.id} disabled={review} onClick={()=>setCheck(item.id)}>{item.label}</button>)}</div>
      <h2>04 / Как оценишь успех?</h2>
      <div className="lp-answers">
        <button type="button" className="lp-answer" aria-pressed={reason==='orders'} disabled={review} onClick={()=>setReason('orders')}>Если заказов стало больше, решение успешное</button>
        <button type="button" className="lp-answer" aria-pressed={reason==='contribution'} disabled={review} onClick={()=>setReason('contribution')}>Сравню прирост валовой прибыли за вычетом расходов, а также риски и guardrail-метрики</button>
      </div>
      {review&&<div role="status" className="lp-feedback"><strong>Разбор решения</strong><p>{scenario.checks.find(i=>i.id===check)?.feedback}</p><p>{reasoning?.feedback}</p><p>{outcome.incrementalContribution>=0?'При принятых допущениях результат положительный. Проверь, насколько реалистичны ожидаемые uplift-эффекты.':'При принятых допущениях расходы превышают дополнительную валовую прибыль. Пересмотри инициативы и сравни альтернативы.'}</p></div>}
      <div className="lp-actions">
        {review?<><button className="lp-primary" onClick={reset}>Попробовать другую стратегию</button><button className="lp-secondary" onClick={onExit}>К карте навыков</button></>:<><button className="lp-secondary" onClick={()=>setStage('plan')}>← Изменить инициативы</button><button className="lp-primary" disabled={!check||!reason} onClick={submit}>Получить разбор →</button></>}
      </div>
    </>}
  </section>;
}
