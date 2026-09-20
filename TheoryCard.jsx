import React from 'react';

export default function TheoryCard({ card: c, saved = false, onToggle, onOpenChapter }) {
  return <article className="theory-card">
    <h3>{c.title}</h3><div className="theory-label">Определение</div><p>{c.definition}</p>
    <details><summary>Пример, виды и применение</summary><div className="theory-example"><h4>{c.source ? 'Учебный пример' : 'Пример'}</h4><p>{c.example}</p></div><h4>Виды и различия</h4><ul>{c.types.map(t => <li key={t}>{t}</li>)}</ul><h4>Как применять в кейсе</h4><p>{c.application}</p><div className="theory-mistake"><h4>Частая ошибка</h4><p>{c.mistake}</p></div></details>
    {c.source && <p className="theory-source">По материалам: {c.source}{onOpenChapter && <button onClick={() => onOpenChapter(c.chapterNumber)}>Читать главу {c.chapterNumber} →</button>}</p>}
    {onToggle && <button className="theory-save" aria-pressed={saved} onClick={() => onToggle(c.id)}>{saved ? 'В моих карточках · убрать' : 'Добавить в мои карточки'}</button>}
  </article>;
}
