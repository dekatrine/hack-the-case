import React, { useState } from 'react';
import { Archive, ArrowRight, RotateCcw, Search, BookOpen, ArrowUpRight } from 'lucide-react';
import { caseStats, caseStatus, filterCases, answeredCount } from './caseLibrary.js';
import { answerCountLabel, hasStory } from './storyPath.js';
import './case-library.css';

const STATUS_LABELS = { new:'Новый', draft:'В процессе', reviewed:'Есть AI-разбор', archived:'В архиве' };
function dateLabel(value) {
  const parsed = Date.parse(value || '');
  return Number.isFinite(parsed) ? new Date(parsed).toLocaleDateString('ru-RU',{day:'numeric',month:'short',year:'numeric'}) : 'Дата не указана';
}
export default function CaseLibrary({ cases, interviewTypes, onOpen, onNew, onArchive, onRetry, onLearn, onInterview }) {
  const [query,setQuery]=useState('');
  const [status,setStatus]=useState('active');
  const [type,setType]=useState('all');
  const [sort,setSort]=useState('recent');
  const stats=caseStats(cases);
  const visible=filterCases(cases,{query,status,type,sort});
  return <div className="mycases">
    <div className="mvp-page-heading mycases-heading">
      <div><div className="clean-eyebrow">Твоя практика</div><h1>Мои кейсы<span className="mvp-count">{String(stats.total).padStart(2,'0')}</span></h1><p className="mvp-lead">Практикуй навыки, сохраняй попытки и возвращайся к своим решениям.</p></div>
      <button type="button" className="mycases-new" onClick={onNew}>Новый кейс <ArrowUpRight size={17}/></button>
    </div>
    <div className="mycases-stats" aria-label="Статистика практики">
      {[[stats.total,'Активных кейсов'],[stats.reviewed,'С разбором'],[stats.inProgress,'В работе']].map(([number,label])=><div className="mycases-stat" key={label}><strong>{number}</strong><span>{label}</span></div>)}
    </div>
    <div className="mycases-toolbar">
      <label className="mycases-search"><Search size={17} aria-hidden="true"/><span className="mvp-visually-hidden">Поиск кейсов</span><input aria-label="Поиск кейсов" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Поиск по названию и условию"/></label>
      <label><span className="mvp-visually-hidden">Тип кейса</span><select aria-label="Тип кейса" value={type} onChange={e=>setType(e.target.value)}><option value="all">Все типы</option>{interviewTypes.map(item=><option value={item.id} key={item.id}>{item.label}</option>)}</select></label>
      <label><span className="mvp-visually-hidden">Сортировка кейсов</span><select aria-label="Сортировка кейсов" value={sort} onChange={e=>setSort(e.target.value)}><option value="recent">Сначала новые</option><option value="oldest">Сначала старые</option></select></label>
    </div>
    <div className="mycases-tabs" role="group" aria-label="Статус кейсов">
      {[['active','Активные'],['inprogress','В процессе'],['reviewed','С разбором'],['archived',`Архив · ${stats.archived}`]].map(([key,label])=><button type="button" key={key} aria-pressed={status===key} onClick={()=>setStatus(key)}>{label}</button>)}
    </div>
    {visible.length ? <div className="mycases-list">{visible.map(item=>{
      const state=caseStatus(item);
      const reviewed=item.attempts.length>0;
      const draft=state==='draft'||state==='new';
      const interview=interviewTypes.find(t=>t.id===item.params?.interviewType);
      const label=interview?.label||'Продуктовый кейс';
      const title=String(item.title || item.caseText || 'Новый кейс').split('\n').find(v=>v.trim())?.replace(/^[#\s]+/,'').replace(/[*`]/g,'').trim().slice(0,100)||'Новый кейс';
      const filled=answeredCount(item);
      const story=hasStory(item.caseRoute);
      const totalSteps=item.caseRoute?.length||interview?.questions?.length||8;
      const percentage=Math.min(100,Math.round(filled/totalSteps*100));
      return <article className="mycases-item" key={item.id}>
        <div className="mycases-item-top"><span>{label}{item.mode === 'self_check' ? ' · Самопроверка' : ''}</span><span>{dateLabel(item.updatedAt||item.createdAt)}</span></div>
        <div className="mycases-item-main"><div><span className="mycases-state">{STATUS_LABELS[state]}</span><h2>{title}</h2><p>{item.params?.industry||'Без указанной отрасли'}{item.params?.difficulty?` · ${item.params.difficulty}`:''}</p></div><span className="mycases-count">{reviewed?`${item.attempts.length} версий`:story?answerCountLabel(filled):`${filled} из ${totalSteps} ответов`}</span></div>
        {!reviewed && !story && <div className="mycases-progress" aria-label={`Заполнено ${percentage}%`}><span style={{width:`${percentage}%`}}/></div>}
        <div className="mycases-actions">
          {!item.archivedAt && <button type="button" className="mycases-action-main" onClick={()=>onOpen(item,reviewed&&state==='reviewed'?'review':'solve')}>{reviewed&&state==='reviewed'?'Посмотреть AI-разбор':'Продолжить'} <ArrowRight size={15}/></button>}
          {reviewed&&!item.archivedAt&&state!=='reviewed'&&<button type="button" onClick={()=>onOpen(item,'review')}>Предыдущий разбор</button>}
          {reviewed&&!item.archivedAt&&<button type="button" onClick={()=>onRetry(item)}><RotateCcw size={14}/> Новая попытка</button>}
          {onInterview&&!item.archivedAt&&<button type="button" onClick={()=>onInterview(item)}>Пройти как собес</button>}
          <button type="button" onClick={()=>onArchive(item,!item.archivedAt)}><Archive size={14}/> {item.archivedAt?'Восстановить':'В архив'}</button>
        </div>
      </article>;
    })}</div>:<section className="mycases-empty"><BookOpen size={24}/><h2>{cases.length?'Нет кейсов по выбранным фильтрам':'Здесь появятся твои решения'}</h2><p>{cases.length?'Попробуй изменить запрос, тип или статус. Архивированные кейсы сохраняются.':'Начни с первого бизнес-кейса или потренируй навыки в коротких уроках.'}</p><div className="mycases-actions">{cases.length?<button onClick={()=>{setQuery('');setStatus('active');setType('all');}}>Сбросить фильтры</button>:<><button className="mycases-action-main" onClick={onNew}>Создать кейс <ArrowRight size={14}/></button><button onClick={onLearn}>Перейти к обучению</button></>}</div></section>}
    <p className="mycases-note">Кейсы и версии ответов пока сохраняются в этом браузере. Архивирование не удаляет их.</p>
  </div>;
}
