import React, { useState } from 'react';
import { Search, BookOpen, ArrowLeft } from 'lucide-react';
import { THEORY_BLOCKS } from './theoryData.js';

export default function TheoryPage({ onResume }) {
  const [block, setBlock] = useState('all');
  const [query, setQuery] = useState('');
  const needle = query.trim().toLocaleLowerCase('ru');
  const groups = THEORY_BLOCKS.filter(g => block === 'all' || g.id === block).map(g => ({ ...g, cards: g.cards.filter(c => !needle || [g.title,c.title,c.definition,c.example,c.application,c.mistake,...c.types].join(' ').toLocaleLowerCase('ru').includes(needle)) })).filter(g => g.cards.length);
  const count = groups.reduce((n,g) => n + g.cards.length, 0);
  return <>
    {onResume && <button className="mvp-back" onClick={onResume}><ArrowLeft size={14}/> Вернуться к решению</button>}
    <div className="mvp-page-heading"><div><div className="clean-eyebrow">База для продуктовых собеседований</div><h1>Теория для практики</h1><p className="mvp-lead">Разберись в понятии, посмотри пример и примени в кейсе.</p></div><BookOpen size={28}/></div>
    <div className="theory-tools"><label className="theory-search"><Search size={17}/><input aria-label="Поиск по теории" type="search" value={query} onChange={e => setQuery(e.target.value)} placeholder="Найти термин: конверсия, JTBD, GMV…"/></label><span role="status">Найдено карточек: {count}</span></div>
    <div className="theory-filters" role="group" aria-label="Темы теории"><button aria-pressed={block === 'all'} onClick={() => setBlock('all')}>Все темы</button>{THEORY_BLOCKS.map(g => <button key={g.id} aria-pressed={block === g.id} onClick={() => setBlock(g.id)}>{g.title}</button>)}</div>
    {!count && <div className="mvp-card"><h2>Ничего не найдено</h2><p>Попробуй другой термин или посмотри все темы.</p><button onClick={() => { setBlock('all'); setQuery(''); }}>Сбросить поиск и фильтр</button></div>}
    {groups.map(g => <section className="theory-block" key={g.id}><div className="theory-block-heading"><h2>{g.title}<span className="mvp-count">{g.cards.length}</span></h2><p>{g.description}</p></div><div className="theory-cards">{g.cards.map(c => <article className="theory-card" key={c.id}>
      <h3>{c.title}</h3><div className="theory-label">Определение</div><p>{c.definition}</p>
      <details><summary>Пример, виды и применение</summary><div className="theory-example"><h4>Пример</h4><p>{c.example}</p></div><h4>Виды и различия</h4><ul>{c.types.map(t => <li key={t}>{t}</li>)}</ul><h4>Как применять в кейсе</h4><p>{c.application}</p><div className="theory-mistake"><h4>Частая ошибка</h4><p>{c.mistake}</p></div></details>
    </article>)}</div></section>)}
  </>;
}
