import React, { useRef, useState } from 'react';
import { Sparkles, ChevronDown } from 'lucide-react';
import { api } from './api/client.js';
import { Button } from './design/components/Button.jsx';
import CaseContent from './CaseContent.jsx';

export default function ConditionAssistant({ caseText }) {
  const [open, setOpen] = useState(false);
  const [question, setQuestion] = useState('');
  const [messages, setMessages] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const lock = useRef(false);
  const ask = async event => {
    event.preventDefault();
    if (lock.current || !question.trim()) return;
    lock.current = true; setBusy(true); setError('');
    const text = question.trim();
    try {
      const result = await api.explainCondition({ caseText, question: text });
      if (!result.message?.trim()) throw new Error('Не удалось получить объяснение. Попробуй ещё раз.');
      setMessages(prev => [...prev, { question: text, answer: result.message }]); setQuestion('');
    } catch { setError('Не удалось получить объяснение. Вопрос сохранён — попробуй отправить ещё раз.'); }
    finally { lock.current = false; setBusy(false); }
  };
  return <section className="mvp-assistant">
    <button className="mvp-assistant-toggle" aria-expanded={open} onClick={() => setOpen(!open)}>
      <Sparkles size={17}/><span>Разобраться в условии<small>ИИ-ассистент · термины и связи</small></span><ChevronDown size={16}/>
    </button>
    {open && <div className="mvp-assistant-body">
      <p>Объясню термин, формулировку или связь понятий. Гипотезы, расчёты и решение — за тобой.</p>
      <div className="mvp-assistant-chat" role="log" aria-label="Объяснения условия" aria-live="polite">
        {messages.map((m,i) => <div className="mvp-assistant-exchange" key={i}><p><b>Ты:</b> {m.question}</p><div><b>Ассистент</b><CaseContent text={m.answer}/></div></div>)}
      </div>
      <form onSubmit={ask}>
        <label htmlFor="condition-question">Что непонятно в условии?</label>
        <textarea id="condition-question" value={question} onChange={e => setQuestion(e.target.value)} maxLength={1500} rows={2} disabled={busy} placeholder="Например: чем GMV отличается от выручки?"/>
        <small>Указывай термин в каждом вопросе — он рассматривается отдельно.</small>
        {error && <p role="alert">{error}</p>}
        <Button size="sm" variant="neutral" type="submit" disabled={busy || !question.trim()}>{busy ? 'Объясняем…' : 'Объяснить'}</Button>
        {busy && <p role="status">Готовим объяснение без подсказок к решению…</p>}
      </form>
    </div>}
  </section>;
}
