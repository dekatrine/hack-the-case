import React, { useEffect, useRef, useState } from 'react';
import { ArrowRight, Check, ChevronDown, Sparkles } from 'lucide-react';
import { Button } from './design/components/Button.jsx';

const GUIDES = {
  problem: 'Сначала опиши потребность или изменение, которого нужно добиться. Решение и конкретные функции оставь для следующих шагов.',
  audience: 'Выбери один сегмент и объясни, почему задача особенно важна именно для него. Опирайся на контекст кейса.',
  hypotheses: 'Сформулируй разные варианты. Для каждого подумай, какой факт помог бы его проверить.',
  analysis: 'Найди конкретный факт или число в условии. Отдельно обозначь вывод и допущение: данные могут не доказывать причину.',
  validation: 'Выбери проверку, результат которой поможет принять решение. Что изменится в твоём выводе, если гипотеза не подтвердится?',
  recommendation: 'Свяжи выбранное действие с проблемой и предыдущими ответами. Объясни выбор с учётом ресурсов и ограничений.',
  metric: 'Укажи целевое поведение, период измерения и направление изменения. Подумай, какой показатель защитит от побочных эффектов.',
  risk: 'Назови один существенный риск и способ его заметить или ограничить. Учитывай бюджет, сроки и опыт пользователя.',
};

export function initialQuestion(fields, answers, savedQuestion) {
  const saved = fields.findIndex(([key]) => key === savedQuestion);
  if (saved >= 0) return saved;
  const missing = fields.findIndex(([key]) => !answers[key]?.trim());
  return missing < 0 ? 0 : missing;
}

export default function CaseFlow({ fields, answers, questionId, onQuestion, onAnswer, onEvaluate, condition, busy, saveError, hasChanges, attempts, onReview }) {
  const [currentKey, setCurrentKey] = useState(() => fields[initialQuestion(fields, answers, questionId)][0]);
  const index = Math.max(0, fields.findIndex(([id]) => id === currentKey));
  const [key, label, hint, placeholder] = fields[index];
  const completed = fields.filter(([id]) => answers[id]?.trim()).length;
  const [notice, setNotice] = useState('');
  const [showHint, setShowHint] = useState(false);
  const [conditionOpen, setConditionOpen] = useState(() => typeof window.matchMedia !== 'function' || window.matchMedia('(min-width: 761px)').matches);
  const heading = useRef(null);
  const input = useRef(null);
  useEffect(() => {
    setNotice(''); setShowHint(false);
    heading.current?.focus({ preventScroll: true });
  }, [key]);
  const move = next => {
    setNotice('');
    setCurrentKey(fields[next][0]);
    onQuestion(fields[next][0]);
  };
  const forward = () => {
    if (!answers[key]?.trim()) {
      setNotice('Напиши ответ на этот вопрос — достаточно одной-двух фраз.');
      input.current?.focus(); return;
    }
    if (index < fields.length - 1) { move(index + 1); return; }
    const missing = fields.findIndex(([id]) => !answers[id]?.trim());
    if (missing >= 0) { move(missing); return; }
    onEvaluate();
  };
  return <div className="mvp-case-flow">
    <section className="mvp-case-progress" aria-label="Прохождение полного кейса">
      <div className="mvp-case-progress-caption"><span aria-live="polite">Шаг {index + 1} из {fields.length}</span><span>Заполнено {completed} из {fields.length}</span></div>
      <div className="mvp-case-progress-track" role="progressbar" aria-label="Заполненные ответы" aria-valuemin={0} aria-valuemax={fields.length} aria-valuenow={completed}><span style={{ width: `${completed / fields.length * 100}%` }}/></div>
      <nav className="mvp-question-steps" aria-label="Вопросы кейса">{fields.map(([id, title], i) => <button type="button" key={id} disabled={!!busy} aria-current={i === index ? 'step' : undefined} aria-label={`Шаг ${i + 1}: ${title}${answers[id]?.trim() ? ' — заполнено' : ''}`} onClick={() => move(i)}>{answers[id]?.trim() ? <Check size={15} aria-hidden="true"/> : i + 1}</button>)}</nav>
    </section>
    <div className="mvp-workspace mvp-guided-workspace">
      <aside className="mvp-card mvp-condition mvp-flow-condition"><details className="mvp-condition-disclosure" open={conditionOpen} onToggle={e => setConditionOpen(e.currentTarget.open)}><summary><span>Условие кейса</span><ChevronDown size={17} aria-hidden="true"/></summary><div className="mvp-condition-body">{condition}</div></details></aside>
      <section className="mvp-card mvp-form mvp-question-card" aria-label="Твоё решение">
        <span className="mvp-kicker">Один вопрос · часть полного решения</span>
        <h2 ref={heading} tabIndex={-1} id={`question-${key}`}>{label}</h2>
        <p className="mvp-question-hint" id={`hint-${key}`}>{hint}</p>
        <label className="mvp-question-input" htmlFor={`answer-${key}`}><span className="mvp-visually-hidden">{index + 1}. {label}</span><textarea ref={input} id={`answer-${key}`} aria-describedby={`hint-${key}${notice ? ' case-step-error' : ''}`} aria-invalid={notice ? true : undefined} placeholder={placeholder || 'Запиши ход своих мыслей…'} rows={6} disabled={!!busy} value={answers[key] || ''} onChange={e => { setNotice(''); onAnswer(key, e.target.value); }}/></label>
        {notice && <p id="case-step-error" role="alert" className="mvp-step-error">{notice}</p>}
        <button type="button" className="mvp-step-hint-toggle" disabled={!!busy} aria-expanded={showHint} aria-controls="case-step-hint" onClick={() => setShowHint(v => !v)}><Sparkles size={15} aria-hidden="true"/>{showHint ? 'Скрыть подсказку' : 'Подсказка к шагу'}</button>
        {showHint && <div id="case-step-hint" className="mvp-step-hint"><b>С чего начать</b><p>{GUIDES[key] || 'Опирайся на условие и свои предыдущие ответы. Отдельно отмечай факты и предположения.'}</p><small>Это ориентир для рассуждения. Итоговый ИИ-разбор появится после всего кейса.</small></div>}
        <p className="mvp-muted mvp-autosave" role="status">{saveError ? 'Сохранение недоступно' : 'Черновик сохраняется в этом браузере'}</p>
        <div className="mvp-step-navigation"><Button variant="neutral" disabled={!!busy || index === 0} onClick={() => move(index - 1)}>Назад</Button><Button variant="accent" disabled={!!busy || (index === fields.length - 1 && !hasChanges)} icon={<ArrowRight size={17}/>} onClick={forward}>{busy ? 'Разбираем решение…' : index < fields.length - 1 ? 'Дальше' : attempts.length ? 'Проверить новую версию' : 'Получить ИИ-разбор'}</Button></div>
        {index === fields.length - 1 && completed < fields.length && <p className="mvp-muted mvp-step-note">Перед разбором заполни все ответы. Кнопка вернёт к первому пропущенному вопросу.</p>}
        {!hasChanges && <p className="mvp-muted mvp-step-note">Измени ответ, чтобы проверить новую версию.</p>}
        {busy && <p role="status" className="mvp-step-note">Проверяем всё решение: аргументы, данные и рекомендацию…</p>}
        {attempts.length > 0 && <button type="button" className="mvp-step-review-link" disabled={!!busy} onClick={onReview}>Посмотреть предыдущий разбор</button>}
      </section>
    </div>
  </div>;
}
