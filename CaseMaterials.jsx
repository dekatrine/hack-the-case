import React from 'react';
import { THEORY_BLOCKS } from './theoryData.js';
import TheoryCard from './TheoryCard.jsx';
export const SAVED_THEORY_KEY = 'htc_saved_theory_v1';
const cards = THEORY_BLOCKS.flatMap(g => g.cards);
const byType = {
  product_sense: ['segment', 'jtbd', 'problem', 'research', 'book-10'],
  product_execution: ['conversion', 'funnel', 'change', 'retention', 'book-14'],
  product_strategy: ['strategy-choice', 'value', 'prioritization', 'market', 'book-7'],
  product_experiment: ['ab', 'experiment-metrics', 'significance', 'book-12'],
  product_estimation: ['market', 'estimation-methods', 'assumptions', 'book-26'],
};
export function readSavedTheory() {
  try {
    const ids = JSON.parse(localStorage.getItem(SAVED_THEORY_KEY) || '[]');
    return Array.isArray(ids) ? [...new Set(ids.filter(id => cards.some(c => c.id === id)))] : [];
  } catch { return []; }
}
export function materialsForCase(item) {
  const ids = [...(byType[item.params?.interviewType] || ['problem', 'conversion', 'assumptions'])];
  const text = item.caseText.toLowerCase();
  for (const [pattern, id] of [[/gmv|комисси|выручк/, 'gmv'], [/средн.{0,8}чек|arppu|arpu/, 'average'], [/cac|ltv|привлечени/, 'cac-ltv'], [/юнит|переменн.{0,10}затрат/, 'unit']]) {
    if (pattern.test(text)) ids.push(id);
  }
  return [...new Set(ids)].slice(0, 6).map(id => cards.find(c => c.id === id)).filter(Boolean);
}
export default function CaseMaterials({ item, savedIds, onToggle, onOpenTheory }) {
  const recommended = materialsForCase(item);
  return <details className="case-materials">
    <summary>Какие материалы могут понадобиться<span>{recommended.length} карточек по теме кейса</span></summary>
    <p className="mvp-muted">Подборка по типу собеседования и понятиям в условии. Общая теория с отдельными примерами, без разбора твоего кейса.</p>
    <div className="case-materials-cards">{recommended.map(c => <TheoryCard key={c.id} card={c} saved={savedIds.includes(c.id)} onToggle={onToggle}/>)}</div>
    <button className="theory-save" onClick={onOpenTheory}>Открыть мои карточки</button>
  </details>;
}
