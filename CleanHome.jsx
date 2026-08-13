import React, { useMemo } from 'react';
import { Button } from './design/components/Button.jsx';
import { Chip } from './design/components/Chip.jsx';
import { Card } from './design/components/Card.jsx';
import { ProgressBar } from './design/components/ProgressBar.jsx';
import { SidebarNavItem } from './design/components/SidebarNavItem.jsx';
import { StatRing } from './design/components/StatRing.jsx';

/* CleanHome — главный экран в новом «clean»-дизайне (Claude Design handoff):
   белые поверхности, hairline-границы, один лаймовый акцент.
   Данные реальные: XP из PMQuest-прогресса, баллы и попытки из skill-истории. */

const HomeIcon = <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 11l9-7 9 7v9a2 2 0 0 1-2 2h-4v-7H9v7H5a2 2 0 0 1-2-2z"/></svg>;
const BookIcon = <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 3h13a3 3 0 0 1 3 3v15H7a3 3 0 0 1-3-3z"/><path d="M4 18h16"/></svg>;
const PlayIcon = <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="9"/><polygon points="10 8 16 12 10 16" fill="currentColor"/></svg>;
const MicIcon = <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="2" width="6" height="12" rx="3"/><path d="M5 10v1a7 7 0 0 0 14 0v-1M12 18v4"/></svg>;

const WEEK_GOAL = 5;

function readJSON(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; }
}

function computeStats() {
  const history = readJSON('htc_skill_history_v1', []);
  const pmq = readJSON('pmquest-progress-v1', {});
  const xp = Number(pmq.xp || 0);
  const level = Math.max(1, Math.floor(xp / 300) + 1);
  const xpIntoLevel = xp - (level - 1) * 300;

  const now = Date.now();
  const weekAgo = now - 7 * 24 * 3600 * 1000;
  const weekAttempts = history.filter((h) => h.ts >= weekAgo);
  const scores = history.map((h) => Number(h.totalScore)).filter((n) => Number.isFinite(n));
  const avgScore = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null;

  // Стрик: подряд идущие дни (включая сегодня/вчера) с хотя бы одной попыткой.
  const days = new Set(history.map((h) => new Date(h.ts).toDateString()));
  let streak = 0;
  for (let i = 0; ; i += 1) {
    const day = new Date(now - i * 24 * 3600 * 1000).toDateString();
    if (days.has(day)) streak += 1;
    else if (i === 0) continue; // сегодня ещё без попытки — не обнуляем
    else break;
  }

  return { xp, level, xpIntoLevel, weekCount: weekAttempts.length, avgScore, streak, attempts: history.length };
}

export default function CleanHome({ onNewCase, onOpenInterview, onOpenLegacy }) {
  const stats = useMemo(computeStats, []);
  const savedCases = useMemo(() => readJSON('pmquest-saved-cases-v1', []), []);
  const lastCase = savedCases.length ? savedCases[savedCases.length - 1] : null;

  return (
      <main className="clean-main">
        <div className="clean-eyebrow">Привет!</div>
        <div className="clean-hero-row">
          <div>
            <div className="clean-track-line">
              <span className="name">Продуктовый менеджер</span>
              <span className="focus">· продуктовые кейсы, метрики, эксперименты</span>
            </div>
            <h1>Готов разобрать кейс сегодня?</h1>
          </div>
          <div className="clean-stats">
            <div className="clean-stat"><b>{stats.streak} дн.</b><span>Дней подряд</span></div>
            <div className="clean-stat"><b>Ур. {stats.level}</b><span>Уровень</span></div>
            <div className="clean-stat"><b>{stats.avgScore ?? '—'}</b><span>Средний балл</span></div>
          </div>
        </div>

        <div className="clean-goal">
          <StatRing
            value={Math.min(stats.weekCount, WEEK_GOAL)}
            max={WEEK_GOAL}
            label={`${Math.min(stats.weekCount, WEEK_GOAL)}/${WEEK_GOAL}`}
            sublabel="кейсов на этой неделе"
          />
          <div className="divider" />
          <div className="xp">
            <div className="clean-progress-row">
              <span>Прогресс уровня</span>
              <span>{stats.xpIntoLevel} / 300 опыта</span>
            </div>
            <ProgressBar face="clean" value={Math.round((stats.xpIntoLevel / 300) * 100)} />
          </div>
        </div>

        <section>
          <Button face="clean" variant="primary" size="lg" icon={PlayIcon} onClick={onNewCase}>
            Начать новый кейс →
          </Button>
        </section>

        <section>
          <h2>Твоя неделя</h2>
          <div className="clean-week">
            <div className="cell"><b>{stats.weekCount}</b><span>Кейсов решено</span></div>
            <div className="cell"><b>{stats.avgScore ?? '—'}</b><span>Средний балл</span></div>
            <div className="cell"><b>{stats.attempts}</b><span>Всего попыток</span></div>
          </div>
        </section>

        <section>
          <h2>Продолжить</h2>
          {lastCase && (
            <Card face="clean" style={{ marginBottom: 12 }}>
              <div className="clean-recent-tags" style={{ marginBottom: 8 }}>
                <Chip face="clean" tone="accent">Недавний кейс</Chip>
              </div>
              <h3 style={{ fontSize: 18, margin: 0, fontWeight: 700 }}>
                {(lastCase.title || lastCase.label || String(lastCase).slice(0, 80) || 'Сохранённый кейс')}
              </h3>
            </Card>
          )}
          <Card face="clean" className="clean-library" onClick={onOpenInterview}>
            <div className="ico">{MicIcon}</div>
            <div style={{ flex: 1 }}>
              <b>Устное интервью</b>
              <p>5 раундов с ИИ-интервьюером, вопросы и разбор ответа.</p>
            </div>
            <div className="open">Открыть →</div>
          </Card>
        </section>
      </main>
  );
}
