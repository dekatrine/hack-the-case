import React from 'react';
import CaseContent from '../CaseContent.jsx';

function sentences(text) {
  return text.match(/[\s\S]+?(?:[.!?](?=\s+(?:[«"]?[А-ЯЁA-Z]|\d)|$)|$)/gu)?.map(sentence => sentence.trim()) || [];
}

function openingSentence(text, limit) {
  const value = text?.trim();
  if (!value || value.length <= limit) return value;
  const opening = sentences(value)[0];
  if (opening && opening.length <= limit) return opening;
  const end = value.lastIndexOf(' ', limit);
  return `${value.slice(0, end > 0 ? end : limit).trimEnd()}…`;
}

export function InterviewCondition({ run, label = 'Условие' }) {
  return <details className="iv-condition">
    <summary>{label}</summary>
    <div className="iv-condition-content">
      {run.configured ? <CaseContent text={run.seed.intro}/> : <p>{run.seed.intro}</p>}
      {run.story && <p>{run.story}</p>}
    </div>
  </details>;
}

export default function InterviewBrief({ run }) {
  const intro = run.seed.intro;
  if (!run.configured) {
    return <div className="iv-bubble">
      <p>{intro}</p>
      {run.story && <p>{run.story}</p>}
    </div>;
  }

  const fields = new Map();
  const paragraphs = intro.split(/\n\s*\n/u).filter(paragraph => {
    const field = paragraph.trim().match(/^\*\*(Продукт|Для кого|Особенность|Задача команды)\*\*\s+([\s\S]+)/u);
    if (!field) return true;
    fields.set(field[1], field[2]);
    return false;
  });
  const product = openingSentence(fields.get('Продукт'), 106);
  const audience = openingSentence(fields.get('Для кого'), 116);
  const task = openingSentence(fields.get('Задача команды') || sentences(paragraphs[0] || '')[0], 214);
  const figures = paragraphs
    .flatMap(sentences)
    .filter(sentence => /\d/u.test(sentence) && sentence.length <= 208 && !task?.includes(sentence))
    .slice(0, 2);

  return <section className="iv-bubble iv-brief-card" aria-label="Короткий брифинг">
    {product && <p className="iv-brief-product">{product}</p>}
    {audience && <p className="iv-brief-audience">{audience}</p>}
    {task && <p className="iv-brief-task">{task}</p>}
    {!!figures.length && <ul className="iv-brief-facts" aria-label="Исходные цифры">
      {figures.map((sentence, index) => <li key={index}>{sentence}</li>)}
    </ul>}
    <InterviewCondition run={run} label="Полное условие"/>
  </section>;
}
