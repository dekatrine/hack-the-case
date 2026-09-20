import React, { useEffect, useRef, useState } from 'react';
import { BOOK, BOOK_CHAPTERS, BOOK_CARDS } from './bookData.js';
import TheoryCard from './TheoryCard.jsx';

export default function BookTheoryPage({ initialChapter = 1, onResume, savedIds, onToggle }) {
  const [selected, setSelected] = useState(initialChapter);
  const [query, setQuery] = useState('');
  const article = useRef(null);
  const chapter = BOOK_CHAPTERS.find(c => c.number === selected) || BOOK_CHAPTERS[0];
  const visible = BOOK_CHAPTERS.filter(c => `${c.number} ${c.title} ${c.concept} ${c.summary} ${c.sections.map(s => s.title).join(' ')}`.toLowerCase().includes(query.toLowerCase().trim()));
  const choose = number => { setSelected(number); requestAnimationFrame(() => { article.current?.focus({ preventScroll: true }); article.current?.scrollIntoView?.({ block: 'start', behavior: 'smooth' }); }); };
  useEffect(() => { setSelected(initialChapter); }, [initialChapter]);
  return <>
    {onResume && <button className="mvp-back" onClick={onResume}>← Вернуться к решению</button>}
    <div className="mvp-page-heading"><div><div className="clean-eyebrow">Конспект по книге</div><h1>Теория по главам</h1><p className="mvp-lead">{BOOK.author} · «{BOOK.title}» · {BOOK.publisher}, {BOOK.year}</p></div><span className="mvp-count">27 глав</span></div>
    <p className="book-intro">Подробные конспекты всех 27 модулей: понятия, методы, этапы и критерии. Материал изложен своими словами с указанием страниц источника. Учебные примеры и советы для кейсов подготовлены для Hack the Case.</p>
    <div className="book-layout"><aside className="book-toc"><label htmlFor="chapter-search">Найти главу</label><input id="chapter-search" type="search" value={query} onChange={e => setQuery(e.target.value)} placeholder="MVP, аналитика, команда…"/><nav aria-label="Главы книги">{visible.map(c => <button key={c.id} aria-current={c.number === chapter.number ? 'page' : undefined} onClick={() => choose(c.number)}><span>{String(c.number).padStart(2,'0')}</span>{c.title}</button>)}</nav>{!visible.length && <p>Глав не найдено. Измени запрос.</p>}</aside>
      <article className="book-article" ref={article} tabIndex={-1}>
        <div className="clean-eyebrow">Глава {chapter.number} · Модуль {chapter.number} книги · с. {chapter.start}–{chapter.end}</div>
        <h2>{chapter.title}</h2><p className="book-summary">{chapter.summary}</p>
        <nav className="book-section-index" aria-label="Содержание главы"><b>В этой главе</b>{chapter.sections.map((s,i) => <a key={i} href={`#book-${chapter.number}-section-${i}`}>{i+1}. {s.title}</a>)}</nav>
        {chapter.sections.map((s,i) => <section className="book-section" id={`book-${chapter.number}-section-${i}`} key={`${chapter.number}-${i}`}>
          <h3>{s.title}</h3>
          {s.start && <span className="book-section-source">По книге: с. {s.start}{s.end !== s.start ? `–${s.end}` : ''}</span>}
          {(s.paragraphs || [s.body]).map((p,j) => <p key={j}>{p}</p>)}
          {s.points?.length > 0 && <ul className="book-key-points">{s.points.map((point,j) => <li key={j}>{point}</li>)}</ul>}
        </section>)}
        <section className="theory-example"><h3>Учебный пример</h3><p>{chapter.example}</p></section>
        <section><h3>Что использовать в кейсе</h3><p>{chapter.application}</p><h3>Частая ошибка</h3><p>{chapter.mistake}</p></section>
        <section className="book-related"><h3>Карточка для повторения</h3><TheoryCard card={BOOK_CARDS.find(c => c.chapterNumber === chapter.number)} saved={savedIds.includes(chapter.cardId)} onToggle={onToggle}/></section>
        <p className="book-source">Источник: {BOOK.author}. «{BOOK.title}». {BOOK.publisher}, {BOOK.year}. Модуль {chapter.number}, с. {chapter.start}–{chapter.end}.</p>
        <div className="book-pagination"><button disabled={chapter.number === 1} onClick={() => choose(chapter.number-1)}>← Предыдущая глава</button><button disabled={chapter.number === BOOK_CHAPTERS.length} onClick={() => choose(chapter.number+1)}>Следующая глава →</button></div>
      </article>
    </div>
  </>;
}
