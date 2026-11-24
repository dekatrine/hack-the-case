import React, { useState } from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { LOCAL_CASE_CONFIG } from '../api/localCaseConfig.js';
import directions from '../backend/app/product_interviews.json';
import variants from '../backend/app/case_variants.json';

const industryLabel = industry => industry.split(' / ').at(-1);

export const defaultInterviewSettings = {
  interviewType: 'product_sense', industry: 'E-commerce / Маркетплейсы',
  difficulty: 'Начальный', variantId: 'surprise', extraContext: '',
};

export default function InterviewSetup({ initial, busy, error, onBack, onGenerate }) {
  const [settings, setSettings] = useState(initial || defaultInterviewSettings);
  function change(key, value) {
    setSettings(previous => ({ ...previous, [key]: value, ...(key === 'interviewType' ? { variantId: 'surprise' } : {}) }));
  }
  return <>
    <button className="iv-text-button" disabled={busy} onClick={onBack}><ArrowLeft size={18}/> Интервью</button>
    <h1>Настроить своё интервью</h1>
    <form className="iv-form iv-setup-form" onSubmit={event => {
      event.preventDefault();
      const direction = directions.find(item => item.id === settings.interviewType);
      onGenerate(settings, direction.label);
    }}>
      <fieldset disabled={busy}>
        <label>Направление<select value={settings.interviewType} onChange={event => change('interviewType', event.target.value)}>
          {directions.map(direction => <option value={direction.id} key={direction.id}>{direction.label}</option>)}
        </select></label>
        <label>Отрасль<select value={settings.industry} onChange={event => change('industry', event.target.value)}>
          {LOCAL_CASE_CONFIG.industries.map(industry => <option value={industry} key={industry}>{industryLabel(industry)}</option>)}
        </select></label>
        <label>Сложность<select value={settings.difficulty} onChange={event => change('difficulty', event.target.value)}>
          {Object.keys(LOCAL_CASE_CONFIG.difficultyLevels).map(difficulty => <option key={difficulty}>{difficulty}</option>)}
        </select></label>
        <label>Тема кейса<select value={settings.variantId} onChange={event => change('variantId', event.target.value)}>
          <option value="surprise">Подобрать автоматически</option>
          {variants[settings.interviewType].map(([id, label]) => <option value={id} key={id}>{label}</option>)}
        </select></label>
        <label>Пожелания к кейсу <small>необязательно</small>
          <textarea rows={3} maxLength={400} value={settings.extraContext} onChange={event => change('extraContext', event.target.value)}
            placeholder="Например, первый заказ на маркетплейсе и падение конверсии после корзины"/>
        </label>
      </fieldset>
      {busy && <p role="status" className="iv-loading">Готовим условие, данные и вопросы. Это может занять до минуты.</p>}
      {error && <p role="alert" className="iv-warning">{error}</p>}
      <button type="submit" className="iv-primary" disabled={busy}>Создать интервью <ArrowRight size={18}/></button>
    </form>
  </>;
}
