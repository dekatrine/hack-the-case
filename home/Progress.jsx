import React from 'react';
import { ArrowRight } from 'lucide-react';
import { recommendedSkeleton } from './progress.js';
import { Trend, useProgress } from './Home.jsx';
import BackupCard from './BackupCard.jsx';

const KIND = { interview: 'Собес', case: 'Кейс' };
import './home.css';

export default function Progress({ onStart }) {
  const { summary, attempts } = useProgress();
  const { scores, skills, weakest } = summary;
  if (!scores.length) return <div className="home"><div className="home-eyebrow">Прогресс</div><h1>Здесь появится твой рост</h1>
    <p className="home-muted">Пройди первый собес, и тут будут баллы и навыки.</p>
    <button type="button" className="home-btn" onClick={() => onStart('discovery')}>Начать собес <ArrowRight size={18}/></button>
    <BackupCard/></div>;
  const change = scores.length > 1 ? scores.at(-1) - scores[0] : null;
  return <div className="home">
    <div className="home-eyebrow">Прогресс · {summary.total} занятий</div>
    <h1>{weakest ? `Слабее всего: ${weakest.label.toLowerCase()}` : 'Твой прогресс'}</h1>
    <section className="home-card"><span className="home-label">Балл по занятиям</span><Trend scores={scores}/>
      {change !== null && <p className="home-muted">{scores[0]} → {scores.at(-1)} ({change >= 0 ? '+' : ''}{change})</p>}</section>
    <section className="home-card"><span className="home-label">Навыки по последним трём собесам</span>
      <div className="home-skills">{skills.map(skill => <div key={skill.id}>
        <div className="home-row"><span>{skill.label}</span><span className="home-muted">{skill.percent === null ? '—' : `${skill.percent}%`}</span></div>
        <div className="home-meter"><b style={{ width: `${skill.percent || 0}%` }}/></div></div>)}</div></section>
    <section className="home-card"><span className="home-label">История</span>
      <div className="home-skills">{attempts.slice(0, 8).map(item => <div className="home-row" key={item.id}>
        <span>{KIND[item.kind]} · {item.title}</span>
        <span className="home-muted" style={{ whiteSpace: "nowrap" }}>{new Date(item.at).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}{item.score !== null ? ` · ${item.score}` : ''}</span></div>)}</div></section>
    {weakest && <section className="home-card home-next"><span className="home-label">Следующий шаг</span>
      <p>{weakest.label} — слабее всего. Один собес на этот навык даст больше всего.</p>
      <button type="button" className="home-btn" onClick={() => onStart(recommendedSkeleton(summary))}>Начать собес <ArrowRight size={18}/></button></section>}
    <BackupCard/>
    <p className="home-muted">Навыки считаются только по собесам из готовых сценариев ({summary.skillRuns}). У настроенных интервью в график попадает итоговый балл после ИИ-разбора.</p>
  </div>;
}
