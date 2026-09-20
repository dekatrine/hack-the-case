import React, { useState } from 'react';
import { Search, BookOpen, ArrowLeft } from 'lucide-react';
import TheoryCard from './TheoryCard.jsx';
import { THEORY_BLOCKS } from './theoryData.js';

export default function TheoryPage({ onResume, savedIds = [], onToggle, initialSavedOnly = false, onOpenChapter }) {
  const [savedOnly, setSavedOnly] = useState(initialSavedOnly);
  const [block, setBlock] = useState('all');
  const [query, setQuery] = useState('');
  const needle = query.trim().toLocaleLowerCase('ru');
  const groups = THEORY_BLOCKS.filter(g => block === 'all' || g.id === block).map(g => ({ ...g, cards: g.cards.filter(c => (!savedOnly || savedIds.includes(c.id)) && (!needle || [g.title,c.title,c.definition,c.example,c.application,c.mistake,...c.types].join(' ').toLocaleLowerCase('ru').includes(needle))) })).filter(g => g.cards.length);
  const count = groups.reduce((n,g) => n + g.cards.length, 0);
  return <>
    {onResume && <button className="mvp-back" onClick={onResume}><ArrowLeft size={14}/> Вернуться к решению</button>}
    <div className="mvp-page-heading"><div><div className="clean-eyebrow">База для продуктовых собеседований</div><h1>Карточки для практики</h1><p className="mvp-lead">Разберись в понятии, посмотри пример и примени в кейсе.</p></div><BookOpen size={28}/></div>
    <div className="theory-filters" role="group" aria-label="Библиотека карточек"><button aria-pressed={!savedOnly} onClick={() => setSavedOnly(false)}>Все карточки</button><button aria-pressed={savedOnly} onClick={() => setSavedOnly(true)}>Мои карточки · {savedIds.length}</button></div>
    {savedOnly && <p className="mvp-muted">Материалы, которые ты сохранил из кейсов или библиотеки. Сохраняются в этом браузере.</p>}
    <div className="theory-tools"><label className="theory-search"><Search size={17}/><input aria-label="Поиск по карточкам" type="search" value={query} onChange={e => setQuery(e.target.value)} placeholder="Найти термин: конверсия, JTBD, GMV…"/></label><span role="status">Найдено карточек: {count}</span></div>
    <div className="theory-filters" role="group" aria-label="Темы карточек"><button aria-pressed={block === 'all'} onClick={() => setBlock('all')}>Все темы</button>{THEORY_BLOCKS.map(g => <button key={g.id} aria-pressed={block === g.id} onClick={() => setBlock(g.id)}>{g.title}</button>)}</div>
    {!count && <div className="mvp-card"><h2>{savedOnly && !savedIds.length ? 'Пока нет сохранённых материалов' : 'Ничего не найдено'}</h2><p>{savedOnly && !savedIds.length ? 'Добавь карточку из кейса или общей библиотеки — она появится здесь.' : 'Попробуй другой термин или посмотри все темы.'}</p><button onClick={() => { setBlock('all'); setQuery(''); setSavedOnly(false); }}>Сбросить поиск и фильтр</button></div>}
    {groups.map(g => <section className="theory-block" key={g.id}><div className="theory-block-heading"><h2>{g.title}<span className="mvp-count">{g.cards.length}</span></h2><p>{g.description}</p></div><div className="theory-cards">{g.cards.map(c => <TheoryCard key={c.id} card={c} saved={savedIds.includes(c.id)} onToggle={onToggle} onOpenChapter={onOpenChapter}/>)}</div></section>)}
  </>;
}
