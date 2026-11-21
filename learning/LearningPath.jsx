import React, { useEffect, useState } from 'react';
import { track } from '../api/analytics.js';
import { SKILL_PATH } from './skillPath.js';
import './learning-path.css';

const KEY = 'htc_learning_path_v1';
function loadProgress() {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || '{}');
    return { completed: Array.isArray(raw.completed) ? raw.completed : [], mistakes: raw.mistakes && typeof raw.mistakes === 'object' ? raw.mistakes : {} };
  } catch { return { completed: [], mistakes: {} }; }
}
export default function LearningPath({ onOpenCases }) {
  const [progress,setProgress] = useState(loadProgress);
  const [active,setActive] = useState(null);
  const [phase,setPhase] = useState('theory');
  const [selected,setSelected] = useState(null);
  const [order,setOrder] = useState([]);
  const [numeric,setNumeric] = useState('');
  const [result,setResult] = useState(null);
  const [error,setError] = useState('');
  useEffect(() => { try { localStorage.setItem(KEY, JSON.stringify(progress));setError(''); } catch { setError('Не удалось сохранить прогресс в этом браузере.'); } },[progress]);
  const lessons = SKILL_PATH.lessons;
  const completed = progress.completed;
  const next = lessons.findIndex(l => !completed.includes(l.id));
  const current = next < 0 ? lessons.length-1 : next;
  function openLesson(index) {
    if (index > current) return;
    setActive(index);setPhase('theory');setSelected(null);setNumeric('');setResult(null);
    setOrder([...(lessons[index].task.items || [])].reverse());
    track('lesson_started',{lessonId:lessons[index].id,skillPath:SKILL_PATH.id});
  }
  function check() {
    const lesson=lessons[active];const task=lesson.task;
    const correct=task.type==='choice' ? selected===task.answer : task.type==='order' ? order.every((v,i)=>v===task.answer[i]) : Number(numeric)===task.answer && numeric.trim()!=='';
    setResult(correct);
    track('answer_submitted',{lessonId:lesson.id,correct,taskType:task.type});
    track('feedback_viewed',{lessonId:lesson.id,correct});
    if (!correct) setProgress(p=>({...p,mistakes:{...p.mistakes,[lesson.id]:(p.mistakes[lesson.id]||0)+1}}));
  }
  function finish() {
    const id=lessons[active].id;
    setProgress(p=>({...p,completed:p.completed.includes(id)?p.completed:[...p.completed,id]}));
    track(lessons[active].final?'case_completed':'lesson_completed',{lessonId:id,skillPath:SKILL_PATH.id});
    setActive(null);setPhase('theory');setResult(null);
  }
  if (active===null) return <div className="lp">
    <div className="lp-head"><div><div className="lp-kicker">Трек · Product Management</div><h1>{SKILL_PATH.title}</h1><p className="mvp-lead">{SKILL_PATH.description}</p></div><div className="lp-summary"><b>{completed.length}/{lessons.length}</b><span>Уроков пройдено</span></div></div>
    <div className="lp-rail">{lessons.map((lesson,i)=><button type="button" key={lesson.id} className={['lp-node',completed.includes(lesson.id)?'complete':'',i===current?'current':'',lesson.final?'final':''].join(' ')} disabled={i>current} onClick={()=>openLesson(i)}>
      <span className="lp-node-number">{completed.includes(lesson.id)?'✓':String(i+1).padStart(2,'0')}</span><span className="lp-node-copy"><strong>{lesson.title}</strong><small>{lesson.skill} · {lesson.final?'Итоговая задача':'3–5 минут'}</small></span><span className="lp-node-meta">{completed.includes(lesson.id)?'Пройдено':i>current?'Закрыто':'Начать →'}</span>
    </button>)}</div>
    <div className="lp-actions"><button className="lp-secondary" onClick={onOpenCases}>Перейти к полным кейсам →</button></div>
  </div>;
  const lesson=lessons[active];const task=lesson.task;
  const canCheck=task.type==='choice'?selected!==null:task.type==='order'?order.length===task.items.length:numeric.trim()!=='';
  function reorder(index,delta) {setOrder(prev=>{const next=[...prev];const target=index+delta;if(target<0||target>=next.length)return prev;[next[index],next[target]]=[next[target],next[index]];return next;});}
  return <div className="lp lp-session">
    <button className="mvp-back" onClick={()=>setActive(null)}>← Карта навыков</button>
    <div className="lp-kicker">{lesson.final?'Итоговый мини-кейс':'Микроурок'} {active+1} / {lessons.length}</div>
    <div className="lp-progress" aria-label="Прогресс урока"><span style={{width:phase==='theory'?'45%':result===true?'100%':'75%'}} /></div>
    <h1>{lesson.title}</h1>
    {phase==='theory'?<><p className="lp-theory">{lesson.theory}</p><div className="lp-example"><small>ПРИМЕР</small>{lesson.example}</div><div className="lp-actions"><button className="lp-primary" onClick={()=>setPhase('practice')}>Попробовать →</button></div></>:
    <><div className="lp-kicker">Твоя практика</div><h2>{task.question}</h2>
      {task.type==='choice'&&<div className="lp-answers">{task.options.map((option,i)=><button className="lp-answer" aria-pressed={selected===i} disabled={result!==null} key={option} onClick={()=>setSelected(i)}>{option}</button>)}</div>}
      {task.type==='order'&&<div className="lp-answers">{order.map((item,i)=><div className="lp-order-row" key={item}><span>{i+1}. {item}</span><span className="lp-order-actions"><button aria-label={`Поднять ${item}`} disabled={result!==null||i===0} onClick={()=>reorder(i,-1)}>↑</button><button aria-label={`Опустить ${item}`} disabled={result!==null||i===order.length-1} onClick={()=>reorder(i,1)}>↓</button></span></div>)}</div>}
      {task.type==='number'&&<div className="lp-answers"><label>Ответ в {task.unit}<div><input className="lp-number" type="number" step="any" value={numeric} disabled={result!==null} onChange={e=>setNumeric(e.target.value)}/></div></label></div>}
      {result!==null&&<div className="lp-feedback" role="status"><strong>{result?'Верно!':'Пока не так. Попробуй ещё раз.'}</strong>{task.explanation}</div>}
      {error&&<p role="alert">{error}</p>}
      <div className="lp-actions">{result===true?<button className="lp-primary" onClick={finish}>{lesson.final?'Завершить мини-кейс':'Завершить урок'} →</button>:result===false?<button className="lp-primary" onClick={()=>{setResult(null);setSelected(null);setNumeric('');}}>Повторить попытку</button>:<button className="lp-primary" disabled={!canCheck} onClick={check}>Проверить ответ</button>}</div>
    </>}
  </div>;
}
