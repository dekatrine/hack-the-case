import { downloadReminder } from './reminder.js';
import { clearReview, dueReview } from './review.js';
import React from 'react';
import { ArrowRight } from 'lucide-react';
import { readDraft, readRuns } from '../interviews/storage.js';
import { readAttempts } from './attempts.js';
import { skeletons } from '../interviews/engine.js';
import { recommendedSkeleton, summarize, weeklyRhythm } from './progress.js';
import './home.css';

export function useProgress() {
  let runs = [];
  try { runs = readRuns(); } catch { runs = []; }
  const attempts = readAttempts();
  const practice = attempts.filter(item => item.kind === 'case');
  return { runs, attempts, summary: summarize(runs, practice), rhythm: weeklyRhythm(attempts.map(item => ({ status: 'finished', updatedAt: item.at }))) };
}

export function Trend({ scores }) {
  if (scores.length < 2) return <p className="home-muted">График появится после двух занятий с оценкой.</p>;
  const last = scores.slice(-8);
  const points = last.map((score, i) => `${10 + i * (300 / (last.length - 1))},${80 - score * 0.7}`).join(' ');
  return <svg className="home-trend" viewBox="0 0 320 90" role="img" aria-label={`Баллы: ${last.join(', ')}`}><polyline fill="none" stroke="#6d8f00" strokeWidth="3" points={points}/></svg>;
}

export default function Home({ preferred = 'discovery', split = false, onStart, onResume, onProgress, onLibrary }) {
  const { attempts, summary, rhythm } = useProgress();
  const draft = readDraft();
  const due = dueReview();
  const dueSkeleton = due ? recommendedSkeleton({ weakest: { id: due.skillId } }) : null;
  const skeletonId = summary.weakest ? recommendedSkeleton(summary) : preferred;
  const skeleton = skeletons.find(item => item.id === skeletonId) || skeletons[0];
  return <div className="home">
    <div className="home-eyebrow">Сегодня</div>
    <h1>{attempts.length ? 'Следующий собес готов' : 'Начни с первого собеса'}</h1>
    {due && <section className="home-card home-due" aria-label="Пора повторить"><span className="home-label">Пора повторить</span>
      <h2>Проверим навык «{due.label}»</h2>
      <p className="home-muted">Прошло 3 дня после слабого места. Один собес покажет, что изменилось.</p>
      <button type="button" className="home-btn" onClick={() => { clearReview(); onStart(dueSkeleton); }}>Повторить навык <ArrowRight size={18}/></button>
      <button type="button" className="home-link" onClick={clearReview}>Не сейчас</button></section>}
    <section className="home-card home-main">
      <span className="home-label">{attempts.length ? 'Рекомендуем сегодня' : 'Первый шаг'}</span>
      <h2>{skeleton.label} · около {skeleton.minutes} мин</h2>
      <p className="home-muted">{summary.weakest
        ? `Слабое место по последним собесам: ${summary.weakest.label.toLowerCase()}. Этот собес тренирует его.`
        : 'Интервьюер задаёт вопросы, ты запрашиваешь данные и защищаешь решения. В конце разбор по цитатам из твоих ответов.'}</p>
      {split && !summary.weakest && <p className="home-muted">Времени мало? Собес можно пройти за два захода: ответы сохраняются на 24 часа.</p>}
      <button type="button" className="home-btn" onClick={() => onStart(skeleton.id)}>Начать собес <ArrowRight size={18}/></button>
    </section>
    {draft && <section className="home-card">
      <div className="home-row"><b>Продолжить</b><span className="home-muted">ход {draft.history.length + 1}</span></div>
      <p className="home-muted">{draft.configured ? draft.skeleton.title : draft.skeleton.label} · {draft.seed.industry.split(' / ').at(-1)}</p>
      <button type="button" className="home-btn home-ghost" onClick={() => onResume(draft.id)}>Продолжить</button>
    </section>}
    <div className="home-grid">
      <div className="home-card"><span className="home-label">Занятий</span><strong>{summary.total}</strong></div>
      <div className="home-card"><span className="home-label">Средний балл</span><strong>{summary.average ?? '—'}</strong></div>
    </div>
    <section className="home-card">
      <div className="home-row"><span className="home-label">Недельный ритм</span><b>{rhythm} из 4 недель</b></div>
      <p className="home-muted">Хотя бы одно занятие в неделю: собес или кейс. Пропуск ничего не сбрасывает.</p>
      <button type="button" className="home-link" onClick={downloadReminder}>Напоминать раз в неделю в календаре</button>
    </section>
    <div className="home-row home-links">
      <button type="button" className="home-link" onClick={onProgress}>Прогресс</button>
      <button type="button" className="home-link" onClick={onLibrary}>Мои кейсы</button>
    </div>
  </div>;
}
