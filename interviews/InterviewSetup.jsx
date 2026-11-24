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

export default function InterviewSetup({ initial, busy, error, onBack, onGenerate, presets = [], onPreset }) {
  const [settings, setSettings] = useState(initial || defaultInterviewSettings);
  function change(key, value) {
    setSettings(previous => ({ ...previous, [key]: value, ...(key === 'interviewType' ? { variantId: 'surprise' } : {}) }));
  }
  return <>
    <button className="iv-text-button" disabled={busy} onClick={onBack}><ArrowLeft size={18}/> Интервью</button>
    <h1>Настрой свой собес</h1>
    {presets.length > 0 && <section className="iv-presets" aria-label="Быстрый старт">
      <span className="iv-chip-label">Быстрый старт</span>
      {presets.map(preset => <button type="button" className="iv-card" key={preset.id} disabled={busy} onClick={() => onPreset(preset)}>
        <span><strong>{preset.label}</strong><small>Около {preset.minutes} мин · без ожидания</small></span><ArrowRight size={17}/>
      </button>)}
    </section>}
    <form className="iv-form iv-setup-form" onSubmit={event => {
      event.preventDefault();
      const direction = directions.find(item => item.id === settings.interviewType);
      onGenerate(settings, direction.label);
    }}>
      <fieldset disabled={busy}>
        <div className="iv-chip-field"><span className="iv-chip-label">Направление</span>
          <div className="iv-chips" role="radiogroup" aria-label="Направление">{directions.map(direction =>
            <button type="button" role="radio" aria-checked={settings.interviewType === direction.id} className={`iv-chip${settings.interviewType === direction.id ? ' on' : ''}`}
              key={direction.id} onClick={() => change('interviewType', direction.id)}>{direction.label}</button>)}</div></div>
        <label>Отрасль<select value={settings.industry} onChange={event => change('industry', event.target.value)}>
          {LOCAL_CASE_CONFIG.industries.map(industry => <option value={industry} key={industry}>{industryLabel(industry)}</option>)}
        </select></label>
        <div className="iv-chip-field"><span className="iv-chip-label">Сложность</span>
          <div className="iv-chips" role="radiogroup" aria-label="Сложность">{Object.keys(LOCAL_CASE_CONFIG.difficultyLevels).map(difficulty =>
            <button type="button" role="radio" aria-checked={settings.difficulty === difficulty} className={`iv-chip${settings.difficulty === difficulty ? ' on' : ''}`}
              key={difficulty} onClick={() => change('difficulty', difficulty)}>{difficulty}</button>)}</div></div>
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
      <button type="submit" className="iv-primary" disabled={busy}>Собрать кейс <ArrowRight size={18}/></button>
    </form>
  </>;
}
