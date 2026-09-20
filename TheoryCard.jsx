import React from 'react';

export default function TheoryCard({ card: c, saved = false, onToggle }) {
  return <article className="theory-card">
    <h3>{c.title}</h3><div className="theory-label">Определение</div><p>{c.definition}</p>
    <details><summary>Пример, виды и применение</summary><div className="theory-example"><h4>Пример</h4><p>{c.example}</p></div><h4>Виды и различия</h4><ul>{c.types.map(t => <li key={t}>{t}</li>)}</ul><h4>Как применять в кейсе</h4><p>{c.application}</p><div className="theory-mistake"><h4>Частая ошибка</h4><p>{c.mistake}</p></div></details>
    {onToggle && <button className="theory-save" aria-pressed={saved} onClick={() => onToggle(c.id)}>{saved ? 'В моей теории · убрать' : 'Добавить в мою теорию'}</button>}
  </article>;
}
