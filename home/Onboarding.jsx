import React, { useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { EXPERIENCE, MINUTES, ROLES, saveOnboarding } from './onboarding.js';
import './home.css';

const STEPS = [
  ['role', 'Куда идёшь?', ROLES.map(([id, label]) => [id, label])],
  ['experience', 'Сколько у тебя было собеседований?', EXPERIENCE],
  ['minutes', 'Сколько времени есть на один собес?', MINUTES],
];

export default function Onboarding({ onDone }) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const [id, title, options] = STEPS[step];
  const last = step === STEPS.length - 1;
  function next() {
    if (!answers[id]) return;
    if (!last) { setStep(step + 1); return; }
    saveOnboarding(answers);
    onDone(answers);
  }
  return <div className="home">
    <div className="home-eyebrow">{step + 1} из {STEPS.length}</div>
    <h1>{step === 0 ? 'Готовишься к кейс-собесу?' : title}</h1>
    <p className="home-muted">{step === 0 ? 'Три вопроса, чтобы подобрать первый собес. Займёт 30 секунд. Без регистрации.' : 'Это нужно, чтобы подобрать первый собес.'}</p>
    {step === 0 && <span className="home-label">{title}</span>}
    <div className="home-options" role="radiogroup" aria-label={title}>
      {options.map(([value, label]) => <button type="button" role="radio" aria-checked={answers[id] === value} key={value}
        className={`home-option${answers[id] === value ? ' on' : ''}`} onClick={() => setAnswers({ ...answers, [id]: value })}>{label}</button>)}
    </div>
    <button type="button" className="home-btn" disabled={!answers[id]} onClick={next}>{last ? 'Показать первый собес' : 'Дальше'} <ArrowRight size={18}/></button>
    <button type="button" className="home-link" onClick={() => { saveOnboarding({ skipped: true }); onDone({}); }}>Пропустить</button>
  </div>;
}
