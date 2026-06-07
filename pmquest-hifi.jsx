import React, { useEffect, useMemo, useRef, useState } from 'react';
import { api } from './api/client.js';

/* =====================================================================
   PMQuest Hi-Fi — port of Claude Design handoff bundle
   Scoped under .pmq-hifi (all styles in styles.css)
   ===================================================================== */

// ─── icons ───────────────────────────────────────────────────────────
const Icon = {
  home:   <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 11l9-7 9 7v9a2 2 0 0 1-2 2h-4v-7H9v7H5a2 2 0 0 1-2-2z"/></svg>,
  book:   <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 3h13a3 3 0 0 1 3 3v15H7a3 3 0 0 1-3-3z"/><path d="M4 18h16"/></svg>,
  zap:    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10"/></svg>,
  mic:    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="2" width="6" height="13" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v4"/></svg>,
  cards:  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="6" width="14" height="14" rx="2"/><path d="M8 6V4a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-2"/></svg>,
  teach:  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M2 9l10-5 10 5-10 5z"/><path d="M6 11v5c3 2 9 2 12 0v-5"/></svg>,
  trophy: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 3h12v5a6 6 0 1 1-12 0z"/><path d="M6 5H3v3a3 3 0 0 0 3 3M18 5h3v3a3 3 0 0 1-3 3M9 21h6M12 17v4"/></svg>,
  case:   <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="7" width="18" height="13" rx="2"/><path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2"/></svg>,
  vault:  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="12" cy="12" r="4"/><path d="M20 8v8M4 8v8"/></svg>,
  cv:     <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M8 13h8M8 17h5"/></svg>,
  search: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3-3"/></svg>,
  chev:   <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6"/></svg>,
  back:   <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>,
  play:   <svg viewBox="0 0 24 24" fill="currentColor"><polygon points="6 4 20 12 6 20" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/></svg>,
  bolt:   <svg viewBox="0 0 24 24" fill="currentColor"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/></svg>,
};

// ─── Pim mascot ──────────────────────────────────────────────────────
const PIM_EXPRESSIONS = {
  idle:   { eyes: "open",    mouth: "smile",  armsUp: false },
  smile:  { eyes: "open",    mouth: "grin",   armsUp: false },
  talk:   { eyes: "open",    mouth: "open",   armsUp: false },
  think:  { eyes: "think",   mouth: "flat",   armsUp: false },
  cheer:  { eyes: "sparkle", mouth: "grin",   armsUp: true  },
  wink:   { eyes: "wink",    mouth: "smile",  armsUp: false },
  sleepy: { eyes: "sleepy",  mouth: "smile",  armsUp: false },
  teach:  { eyes: "open",    mouth: "open",   armsUp: false, cap: true },
};

function PimFigure({ size = 110, expression = "idle", className = "" }) {
  const exp = PIM_EXPRESSIONS[expression] || PIM_EXPRESSIONS.idle;
  return (
    <div className={`pim-figure ${className}`} style={{ width: size, height: size * 1.1 }}>
      <svg viewBox="0 0 120 132" width={size} height={size * 1.1}>
        <defs>
          <radialGradient id="ph-pim-body" cx="35%" cy="35%" r="80%">
            <stop offset="0%" stopColor="#ffc097" />
            <stop offset="60%" stopColor="#ff8a4d" />
            <stop offset="100%" stopColor="#ff6b3d" />
          </radialGradient>
          <radialGradient id="ph-pim-cheek" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#ff9bb8" stopOpacity="0.95" />
            <stop offset="100%" stopColor="#ff9bb8" stopOpacity="0" />
          </radialGradient>
        </defs>
        <g transform="translate(86 78)">
          <path d="M 0 0 Q 18 -6 24 8 Q 28 22 14 26 Q 8 28 4 22 Z" fill="#ff8a4d" stroke="#181628" strokeWidth="2.5" strokeLinejoin="round" />
          <path d="M 18 14 Q 24 14 24 22" fill="none" stroke="#181628" strokeWidth="2" />
        </g>
        <g stroke="#181628" strokeWidth="2.6" strokeLinecap="round" fill="none">
          {exp.armsUp ? (
            <>
              <path d="M 30 78 Q 18 58 18 44" />
              <path d="M 90 78 Q 102 58 102 44" />
            </>
          ) : (
            <>
              <path d="M 28 86 Q 18 92 22 102" />
              <path d="M 92 86 Q 102 92 98 102" />
            </>
          )}
        </g>
        <ellipse cx="44" cy="118" rx="11" ry="6" fill="#181628" />
        <ellipse cx="76" cy="118" rx="11" ry="6" fill="#181628" />
        <ellipse cx="44" cy="116" rx="9" ry="4.5" fill="#ff8a4d" stroke="#181628" strokeWidth="2" />
        <ellipse cx="76" cy="116" rx="9" ry="4.5" fill="#ff8a4d" stroke="#181628" strokeWidth="2" />
        <path d="M 60 12 C 26 12 12 38 12 64 C 12 92 30 116 60 116 C 90 116 108 92 108 64 C 108 38 94 12 60 12 Z" fill="url(#ph-pim-body)" stroke="#181628" strokeWidth="3" />
        <path d="M 24 28 L 18 4 L 42 18 Z" fill="#ff8a4d" stroke="#181628" strokeWidth="2.5" strokeLinejoin="round" />
        <path d="M 96 28 L 102 4 L 78 18 Z" fill="#ff8a4d" stroke="#181628" strokeWidth="2.5" strokeLinejoin="round" />
        <path d="M 26 24 L 24 14 L 36 20 Z" fill="#ff9bb8" />
        <path d="M 94 24 L 96 14 L 84 20 Z" fill="#ff9bb8" />
        <ellipse cx="60" cy="82" rx="30" ry="24" fill="#fff5e8" stroke="#181628" strokeWidth="2.5" />
        <ellipse cx="34" cy="76" rx="10" ry="6" fill="url(#ph-pim-cheek)" />
        <ellipse cx="86" cy="76" rx="10" ry="6" fill="url(#ph-pim-cheek)" />
        {exp.eyes === "open" && (
          <g>
            <ellipse cx="44" cy="58" rx="9" ry="11" fill="#181628" />
            <ellipse cx="76" cy="58" rx="9" ry="11" fill="#181628" />
            <circle cx="47" cy="54" r="3.5" fill="#fff" />
            <circle cx="79" cy="54" r="3.5" fill="#fff" />
            <circle cx="42" cy="62" r="1.5" fill="#fff" />
            <circle cx="74" cy="62" r="1.5" fill="#fff" />
          </g>
        )}
        {exp.eyes === "wink" && (
          <g>
            <ellipse cx="44" cy="58" rx="9" ry="11" fill="#181628" />
            <circle cx="47" cy="54" r="3.5" fill="#fff" />
            <path d="M 68 58 Q 76 52 84 58" fill="none" stroke="#181628" strokeWidth="3" strokeLinecap="round" />
          </g>
        )}
        {exp.eyes === "sparkle" && (
          <g>
            <path d="M 44 50 L 47 58 L 44 66 L 41 58 Z M 36 58 L 52 58" stroke="#181628" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M 76 50 L 79 58 L 76 66 L 73 58 Z M 68 58 L 84 58" stroke="#181628" strokeWidth="2.5" strokeLinecap="round" />
          </g>
        )}
        {exp.eyes === "think" && (
          <g>
            <ellipse cx="44" cy="58" rx="9" ry="11" fill="#181628" />
            <ellipse cx="76" cy="58" rx="9" ry="11" fill="#181628" />
            <circle cx="41" cy="54" r="3" fill="#fff" />
            <circle cx="73" cy="54" r="3" fill="#fff" />
            <path d="M 32 42 Q 42 38 56 44" fill="none" stroke="#181628" strokeWidth="3" strokeLinecap="round" />
            <path d="M 88 42 Q 78 38 64 44" fill="none" stroke="#181628" strokeWidth="3" strokeLinecap="round" />
          </g>
        )}
        {exp.eyes === "sleepy" && (
          <g>
            <path d="M 36 60 Q 44 64 52 60" fill="none" stroke="#181628" strokeWidth="3" strokeLinecap="round" />
            <path d="M 68 60 Q 76 64 84 60" fill="none" stroke="#181628" strokeWidth="3" strokeLinecap="round" />
          </g>
        )}
        <ellipse cx="60" cy="72" rx="4" ry="3" fill="#181628" />
        {exp.mouth === "smile" && (<path d="M 52 84 Q 60 90 68 84" fill="none" stroke="#181628" strokeWidth="2.8" strokeLinecap="round" />)}
        {exp.mouth === "open" && (<path d="M 52 82 Q 60 96 68 82 Q 60 86 52 82 Z" fill="#5b4bd6" stroke="#181628" strokeWidth="2.5" strokeLinejoin="round" />)}
        {exp.mouth === "grin" && (
          <g>
            <path d="M 48 82 Q 60 96 72 82" fill="#fff" stroke="#181628" strokeWidth="2.8" strokeLinejoin="round" />
            <path d="M 48 82 L 72 82" stroke="#181628" strokeWidth="2.5" />
          </g>
        )}
        {exp.mouth === "flat" && (<path d="M 54 86 L 66 86" stroke="#181628" strokeWidth="2.8" strokeLinecap="round" />)}
        {exp.cap && (
          <g transform="translate(60 10) rotate(-12)">
            <rect x="-22" y="-2" width="44" height="6" fill="#181628" />
            <polygon points="-26,4 26,4 0,16" fill="#181628" />
            <line x1="0" y1="4" x2="20" y2="16" stroke="#ffd23f" strokeWidth="2.5" />
            <circle cx="20" cy="16" r="3" fill="#ffd23f" stroke="#181628" strokeWidth="1.5" />
          </g>
        )}
        {expression === "cheer" && (
          <g fill="#ffd23f" stroke="#181628" strokeWidth="1.5">
            <path d="M 10 30 L 12 26 L 14 30 L 18 32 L 14 34 L 12 38 L 10 34 L 6 32 Z" />
            <path d="M 108 24 L 110 20 L 112 24 L 116 26 L 112 28 L 110 32 L 108 28 L 104 26 Z" transform="scale(0.8)" />
          </g>
        )}
      </svg>
    </div>
  );
}

const TODAY_KEY = () => new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Moscow" }).format(new Date());

const initialProgress = () => {
  try {
    const saved = JSON.parse(localStorage.getItem("pmquest-progress-v1") || "{}");
    return { xp: 0, streak: 0, completed: {}, cases: 0, cardsDue: 0, checkStats: {}, onboarded: false, ...saved };
  } catch {
    return { xp: 0, streak: 0, completed: {}, cases: 0, cardsDue: 0, checkStats: {}, onboarded: false };
  }
};

const getLevel = (xp) => Math.max(1, Math.floor(xp / 300) + 1);
const getLevelProgress = (xp) => {
  const current = Math.floor(xp / 300) * 300;
  return Math.min(100, Math.round(((xp - current) / 300) * 100));
};

function useMoscowClock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(timer);
  }, []);
  return useMemo(() => {
    const day = new Intl.DateTimeFormat("ru-RU", { weekday: "long", timeZone: "Europe/Moscow" }).format(now);
    const date = new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "long", timeZone: "Europe/Moscow" }).format(now);
    const time = new Intl.DateTimeFormat("ru-RU", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Moscow" }).format(now);
    return {
      day: day.charAt(0).toUpperCase() + day.slice(1),
      date,
      time,
      label: `${day.charAt(0).toUpperCase() + day.slice(1)} · ${date} · ${time} МСК`,
    };
  }, [now]);
}

const KNOWLEDGE_NOTES = [
  { id: "pm-role-101", t: "Кто такой Product Manager", cat: "beginner", c: "is-sky", ex: "PM отвечает за ценность продукта: понимает пользователя, бизнес-цель и помогает команде выбрать, что строить.", s: 0, rookie: "Я только начинаю. PM — это начальник дизайнеров и разработчиков или кто?", hints: ["объясни роль без власти", "свяжи user/business/tech", "дай пример решения PM"] },
  { id: "product-thinking-101", t: "Product thinking с нуля", cat: "beginner", c: "is-mint", ex: "Продуктовое мышление: видеть проблему пользователя, выбирать сегмент, формулировать гипотезу и проверять эффект.", s: 0, rookie: "Что значит «думать продуктово»? Это просто придумывать фичи?", hints: ["начни с проблемы", "выбери сегмент", "покажи проверку гипотезы"] },
  { id: "users-and-segments", t: "Пользователи и сегменты", cat: "beginner", c: "is-sun", ex: "Сегмент — группа пользователей с похожей задачей, контекстом и болью; не просто возраст или профессия.", s: 0, rookie: "Почему нельзя сказать «наш пользователь — все»? Чем сегмент отличается от аудитории?", hints: ["объясни narrow target", "дай пример сегмента", "свяжи с pain"] },
  { id: "problem-solution-fit", t: "Problem/Solution Fit", cat: "beginner", c: "is-pink", ex: "До масштабирования продукта важно доказать, что проблема реальная, частая и решение действительно помогает.", s: 0, rookie: "Если идея классная, зачем сначала доказывать problem/solution fit?", hints: ["проверка боли", "частота и сила проблемы", "MVP как тест"] },
  { id: "mvp-basics", t: "MVP без мифов", cat: "beginner", c: "is-mint", ex: "MVP — минимальный способ проверить рискованную гипотезу, а не обязательно урезанная версия большого продукта.", s: 0, rookie: "MVP — это просто сделать дешёвую первую версию?", hints: ["назови гипотезу", "убери лишнее", "определи learning metric"] },
  { id: "discovery-basics", t: "Customer discovery", cat: "beginner", c: "is-sky", ex: "Discovery помогает понять реальные задачи, боли и контекст пользователей до выбора решения.", s: 0, rookie: "Зачем интервьюировать пользователей, если мы и так знаем, что им нужно?", hints: ["не продавать идею", "слушать поведение", "искать паттерны"] },
  { id: "user-stories", t: "User stories и acceptance criteria", cat: "beginner", c: "is-sun", ex: "User story описывает, кому и зачем нужна возможность; acceptance criteria фиксируют, когда задача готова.", s: 0, rookie: "User story — это просто описание фичи в Jira?", hints: ["as a/I want/so that", "критерии готовности", "пример для фичи"] },
  { id: "basic-metrics", t: "Базовые продуктовые метрики", cat: "beginner", c: "is-pink", ex: "PM должен различать acquisition, activation, retention, revenue и понимать, какая метрика отвечает на какой вопрос.", s: 0, rookie: "Метрик много. Какие самые базовые надо знать новичку?", hints: ["объясни AARRR просто", "дай пример метрики", "отдели vanity"] },
  { id: "experiments-101", t: "Эксперименты для новичков", cat: "beginner", c: "is-mint", ex: "Эксперимент проверяет гипотезу на данных: что меняем, для кого, какую метрику ждём и какие guardrails бережём.", s: 0, rookie: "Любой запуск фичи — это эксперимент?", hints: ["гипотеза", "метрика успеха", "guardrail"] },
  { id: "roadmap-101", t: "Roadmap для новичков", cat: "beginner", c: "is-sky", ex: "Roadmap — не список желаний, а порядок решения проблем с учётом стратегии, ресурсов и зависимостей.", s: 0, rookie: "Почему roadmap постоянно меняется? Разве это не план, который надо выполнить?", hints: ["цель roadmap", "приоритеты", "обновление по данным"] },
  { id: "stakeholder-101", t: "Стейкхолдеры для новичков", cat: "beginner", c: "is-sun", ex: "PM синхронизирует ожидания бизнеса, дизайна, инженерии, маркетинга и поддержки, чтобы команда принимала согласованные решения.", s: 0, rookie: "Что делать, если все стейкхолдеры хотят разные фичи?", hints: ["единая цель", "критерии решения", "decision log"] },
  { id: "prd-basics", t: "PRD: документ продукта", cat: "beginner", c: "is-pink", ex: "PRD описывает проблему, цель, пользователей, решение, scope, метрики и риски так, чтобы команда одинаково понимала задачу.", s: 0, rookie: "PRD — это бюрократия или реально полезный документ?", hints: ["проблема и цель", "scope/non-scope", "метрики и риски"] },
  { id: "pm-vs-po", t: "PM vs PO vs Project Manager", cat: "beginner", c: "is-sky", ex: "PM отвечает за ценность и направление продукта, PO — за детализацию backlog, Project Manager — за сроки, ресурсы и координацию исполнения.", s: 0, rookie: "Я путаю PM, PO и project manager. На интервью это вообще важно различать?", hints: ["раздели value/backlog/delivery", "дай пример одной фичи", "объясни пересечения ролей"] },
  { id: "problem-statement", t: "Problem statement", cat: "beginner", c: "is-mint", ex: "Сильная формулировка проблемы описывает пользователя, контекст, боль, частоту и бизнес-последствие, а не сразу предлагает решение.", s: 0, rookie: "Почему нельзя начать с решения, если проблема вроде очевидна?", hints: ["назови user/context/pain", "покажи плохую и хорошую формулировку", "свяжи с метрикой"] },
  { id: "hypothesis-basics", t: "Гипотезы в продукте", cat: "beginner", c: "is-sun", ex: "Гипотеза связывает изменение, аудиторию, ожидаемое поведение и метрику успеха: если сделаем X для Y, то увидим Z.", s: 0, rookie: "Гипотеза — это просто идея фичи другими словами?", hints: ["формат if/then/because", "отдели идею от проверки", "добавь leading metric"] },
  { id: "prioritization-101", t: "Приоритизация для новичков", cat: "beginner", c: "is-pink", ex: "Приоритизация — это выбор не самой красивой идеи, а лучшего следующего шага с учётом цели, эффекта, уверенности, усилий и риска.", s: 0, rookie: "Как выбрать между несколькими хорошими идеями, если все выглядят полезными?", hints: ["назови критерии", "сравни эффект и effort", "зафиксируй trade-off"] },
  { id: "circles", t: "CIRCLES для кейсов", cat: "framework", c: "is-sun", ex: "Comprehend → Identify → Report → Cut → List → Evaluate → Summarize. 7 шагов под любой product design.", s: 3, m: true, rookie: "Я увидел CIRCLES, но кажется это просто список шагов. Когда его реально применять и как не звучать как робот?", hints: ["объясни порядок шагов", "дай пример product design", "скажи, где можно гибко отойти"] },
  { id: "double-diamond", t: "Double Diamond", cat: "framework", c: "is-sky", ex: "Discover → Define → Develop → Deliver помогает развести исследование проблемы и генерацию решений, чтобы команда не прыгала сразу в фичи.", s: 0, rookie: "Double Diamond выглядит как красивая схема. Чем она реально помогает PM?", hints: ["раздели problem/solution space", "покажи divergent/convergent thinking", "дай пример product discovery"] },
  { id: "opportunity-solution-tree", t: "Opportunity Solution Tree", cat: "framework", c: "is-mint", ex: "OST связывает outcome, пользовательские opportunities, solutions и experiments в одну карту принятия решений.", s: 0, rookie: "Зачем рисовать дерево opportunities, если можно просто вести backlog идей?", hints: ["начни с outcome", "отдели opportunity от solution", "добавь experiment"] },
  { id: "kano-model", t: "Kano model", cat: "framework", c: "is-pink", ex: "Kano помогает отличать базовые ожидания, performance-факторы и delight-фичи, чтобы не переинвестировать в вау-эффекты без фундамента.", s: 0, rookie: "Почему delight-фичи не всегда надо делать первыми? Они же нравятся пользователям.", hints: ["объясни must-be/performance/delighters", "дай пример продукта", "свяжи с приоритетом"] },
  { id: "moscow", t: "MoSCoW prioritization", cat: "framework", c: "is-sun", ex: "Must, Should, Could, Won't помогает договориться о scope релиза и явно вынести часть требований за границы текущей поставки.", s: 0, rookie: "MoSCoW — это просто список важности? Чем он лучше обычного top-10?", hints: ["раздели must/should/could/won't", "объясни scope", "дай пример релиза"] },
  { id: "nsm", t: "North Star Metric — как выбрать", cat: "metrics", c: "is-mint", ex: "Одна метрика, отражающая ценность для пользователя. Не выручка. Примеры: Airbnb nights booked.", s: 2, rookie: "Привет! Я тут читал доку и не понял — а зачем нужна одна метрика? У нас же DAU, retention, revenue, NPS — давай за всеми следить?", hints: ["упомяни retention", "приведи 1 FAANG-пример", "объясни leading vs lagging"] },
  { id: "rice", t: "RICE для приоритизации", cat: "framework", c: "is-pink", ex: "Reach × Impact × Confidence ÷ Effort. Когда применять, типичные ошибки.", s: 2, rookie: "Почему мы не можем просто взять идею, которая нравится команде? Зачем эти Reach, Impact, Confidence и Effort?", hints: ["покажи формулу", "объясни confidence", "скажи про evidence"] },
  { id: "aarrr", t: "AARRR (Pirate metrics)", cat: "metrics", c: "is-sky", ex: "Acquisition · Activation · Retention · Referral · Revenue. Воронка для продуктовых решений.", s: 1, rookie: "Я путаюсь в AARRR. Это просто маркетинговая воронка или PM тоже должен ей пользоваться?", hints: ["пройди 5 шагов", "дай пример продукта", "отдели activation от retention"] },
  { id: "retention-cohorts", t: "Retention cohorts", cat: "metrics", c: "is-mint", ex: "Когортный retention показывает, возвращаются ли пользователи после первого опыта, и помогает не скрывать проблему средними значениями.", s: 0, rookie: "Почему нельзя просто смотреть общий retention по всем пользователям?", hints: ["объясни когорту", "покажи D1/D7/D30", "найди изменение после релиза"] },
  { id: "funnel-analysis", t: "Funnel analysis", cat: "metrics", c: "is-sky", ex: "Воронка показывает, на каком шаге пользователь теряет мотивацию или сталкивается с барьером: visit → signup → activation → habit.", s: 0, rookie: "Если конверсия плохая, как понять, какой шаг чинить первым?", hints: ["разбей путь на события", "найди самый большой drop-off", "сегментируй пользователей"] },
  { id: "ltv-cac", t: "LTV/CAC простыми словами", cat: "metrics", c: "is-sun", ex: "LTV/CAC показывает, окупается ли привлечение клиента; важно учитывать маржинальность, payback period и churn.", s: 0, rookie: "Если LTV больше CAC, значит бизнес точно здоровый?", hints: ["объясни LTV и CAC", "добавь payback", "упомяни churn и маржу"] },
  { id: "metric-tree", t: "Metric tree", cat: "metrics", c: "is-pink", ex: "Дерево метрик раскладывает главную цель на драйверы, чтобы команда понимала, какой рычаг двигает результат.", s: 0, rookie: "Как не утонуть в десятках метрик и понять, на что реально влиять?", hints: ["начни с target metric", "разложи на драйверы", "выбери controllable input"] },
  { id: "star", t: "STAR-метод ответов", cat: "behavioral", c: "is-sun", ex: "Situation → Task → Action → Result. Что делает ответ «джуновым» и как этого избежать.", s: 1, rookie: "Я отвечаю на behavioral как историю, но интервьюер просит структуру. Чем STAR реально помогает?", hints: ["разложи S/T/A/R", "покажи плохой vs хороший ответ", "упомяни результат в цифрах"] },
  { id: "conflict-story", t: "История про конфликт", cat: "behavioral", c: "is-pink", ex: "Сильный behavioral-ответ про конфликт показывает цель, факты, вклад PM, компромисс и результат, а не драму и обвинения.", s: 0, rookie: "Как рассказать про конфликт с дизайнером или разработчиком и не выглядеть токсично?", hints: ["не обвиняй людей", "покажи процесс решения", "заверши результатом"] },
  { id: "failure-story", t: "История про ошибку", cat: "behavioral", c: "is-sky", ex: "Ответ про ошибку должен показать ownership: что произошло, какой был твой вклад, что изменил(а) в процессе и какой урок вынес(ла).", s: 0, rookie: "На вопрос про провал лучше выбрать маленькую ошибку или честно рассказать большой фейл?", hints: ["выбери реальную ставку", "покажи ownership", "назови изменение поведения"] },
  { id: "leadership-without-authority", t: "Leadership without authority", cat: "behavioral", c: "is-mint", ex: "PM влияет без прямой власти через ясную цель, данные, доверие, фасилитацию решений и уважение к ограничениям команды.", s: 0, rookie: "Если команда не обязана меня слушать, как PM вообще может вести людей?", hints: ["объясни влияние без власти", "дай пример alignment", "покажи результат команды"] },
  { id: "ab-power", t: "A/B тест: power & MDE", cat: "metrics", c: "is-mint", ex: "Минимально детектируемый эффект, мощность, длительность. Базовая интуиция, без формул.", s: 0, rookie: "Я понимаю A/B тест, но не понимаю power и MDE. Почему нельзя просто запустить и посмотреть?", hints: ["объясни риск false negative", "простыми словами MDE", "скажи про длительность теста"] },
  { id: "tradeoff-matrix", t: "Trade-off матрица", cat: "design", c: "is-pink", ex: "Как структурно объяснять компромиссы между фичами — без «зависит от».", s: 2, rookie: "На кейсе я всё время говорю «зависит». Как trade-off матрица помогает выбрать решение?", hints: ["назови критерии", "сравни 2 альтернативы", "сделай рекомендацию"] },
  { id: "estimation", t: "Estimation на собесе", cat: "design", c: "is-sky", ex: "Шаги «сверху вниз» vs «снизу вверх». Где джуны теряют баллы.", s: 1, rookie: "Если меня спросят оценить рынок, я боюсь ошибиться в цифрах. Что важнее: точность или ход мысли?", hints: ["сверху вниз vs снизу вверх", "проговори assumptions", "сделай sanity check"] },
  { id: "danger-words", t: "Опасные слова в ответах", cat: "behavioral", c: "is-pink", ex: "«Мы», «помог», «занимался» — что слышит интервьюер и как переформулировать.", s: 3, m: true, rookie: "Почему плохо говорить «мы сделали»? Это же командная работа.", hints: ["отдели вклад от команды", "замени слабые глаголы", "сохрани уважение к команде"] },
  { id: "sysdesign-101", t: "System design 101 для PM", cat: "sysdesign", c: "is-sun", ex: "API gateway, очереди, кэши — что должен знать PM на собесе и где «технический потолок».", s: 0, rookie: "PM точно должен знать system design? Где граница между PM и инженером?", hints: ["объясни PM-уровень", "свяжи с trade-offs", "не уходи в код"] },
  { id: "activation", t: "Activation events", cat: "metrics", c: "is-mint", ex: "Aha-moment, magic number — как определить и измерить.", s: 2, rookie: "Что такое activation event? Это просто регистрация или первое действие?", hints: ["объясни aha-moment", "дай magic number", "свяжи с retention"] },
  { id: "latency-cost", t: "Trade-off: latency vs cost", cat: "sysdesign", c: "is-sky", ex: "Типовой follow-up в FAANG. Как структурно отвечать.", s: 1, rookie: "Если latency лучше для пользователя, почему мы вообще думаем про cost?", hints: ["объясни business constraint", "назови guardrail", "покажи компромисс"] },
  { id: "api-basics-pm", t: "API basics для PM", cat: "sysdesign", c: "is-mint", ex: "PM не обязан проектировать API, но должен понимать request/response, ошибки, rate limits и влияние интеграций на пользовательский опыт.", s: 0, rookie: "На техническом интервью спросили про API. Что PM должен ответить без ухода в код?", hints: ["объясни request/response", "свяжи с UX", "назови ошибки и limits"] },
  { id: "queues-basics", t: "Очереди и async flows", cat: "sysdesign", c: "is-sun", ex: "Очереди помогают обрабатывать тяжёлые задачи асинхронно: быстрее отвечать пользователю, сглаживать пики и снижать риск падений.", s: 0, rookie: "Почему нельзя всё делать сразу синхронно, если пользователь ждёт результат?", hints: ["объясни async", "дай пример долгой операции", "назови trade-off freshness"] },
  { id: "caching-basics", t: "Кэширование для PM", cat: "sysdesign", c: "is-pink", ex: "Кэш ускоряет повторные запросы и снижает нагрузку, но создаёт риск устаревших данных и требует понятной политики invalidation.", s: 0, rookie: "Кэш звучит как магия ускорения. Почему его не включают везде?", hints: ["объясни speed/cost", "упомяни stale data", "назови invalidation"] },
  { id: "jtbd", t: "JTBD / user pain", cat: "design", c: "is-mint", ex: "Jobs-to-be-done: какую задачу пользователь пытается решить в конкретном контексте.", s: 1, rookie: "Я написал сегмент: женщины 25-34. Это же и есть пользовательская задача, да?", hints: ["отдели сегмент от задачи", "дай формат when/I want/so I can", "приведи пример"] },
  { id: "persona-vs-segment", t: "Persona vs segment", cat: "design", c: "is-sky", ex: "Сегмент нужен для выбора рынка и приоритета, persona — для эмпатии и сценариев; оба инструмента опасны, если основаны на фантазиях.", s: 0, rookie: "Persona с именем и фото — это полезно или просто театральщина?", hints: ["раздели segment/persona", "покажи данные", "свяжи с JTBD"] },
  { id: "cjm-basics", t: "Customer Journey Map", cat: "design", c: "is-sun", ex: "CJM раскладывает путь пользователя на шаги, эмоции, боли и точки контакта, чтобы найти момент для продуктового вмешательства.", s: 0, rookie: "CJM — это просто красивая карта в Miro или реально инструмент решения?", hints: ["назови шаги пути", "найди pain point", "предложи вмешательство"] },
  { id: "onboarding-design", t: "Onboarding design", cat: "design", c: "is-pink", ex: "Хороший onboarding быстро доводит пользователя до first value, не перегружает объяснениями и измеряется activation/retention.", s: 0, rookie: "Что лучше: подробно всё объяснить новому пользователю или сразу дать действовать?", hints: ["объясни time-to-value", "дай пример progressive disclosure", "добавь activation metric"] },
  { id: "accessibility-pm", t: "Accessibility для PM", cat: "design", c: "is-mint", ex: "Доступность — продуктовый критерий качества: контраст, навигация с клавиатуры, понятные состояния и сценарии для разных пользователей.", s: 0, rookie: "Accessibility — это задача дизайнера или PM тоже должен об этом думать?", hints: ["свяжи с инклюзивностью и рынком", "назови 2 требования", "добавь guardrail"] },
  { id: "guardrails", t: "Guardrail metrics", cat: "metrics", c: "is-pink", ex: "Метрики, которые защищают качество продукта, доверие и долгосрочную ценность при запуске фичи.", s: 0, rookie: "Если primary metric растёт, зачем ещё guardrails? Разве этого мало?", hints: ["дай пример вредного роста", "назови 2 guardrails", "свяжи с rollout"] },
  { id: "root-cause", t: "Root cause analysis", cat: "metrics", c: "is-sky", ex: "Как диагностировать падение метрики через funnel, сегменты, события и внешние факторы.", s: 1, rookie: "Метрика упала. Почему нельзя сразу придумать фичу, чтобы её поднять?", hints: ["построй дерево причин", "разрежь по сегментам", "проверь instrumentation"] },
  { id: "pricing", t: "Pricing & packaging", cat: "framework", c: "is-sun", ex: "Как думать о тарифах, упаковке value, willingness-to-pay и paywall trade-offs.", s: 0, rookie: "Почему нельзя просто поднять цену, если хотим больше revenue?", hints: ["объясни value perception", "скажи про churn", "предложи эксперимент"] },
  { id: "marketplace", t: "Marketplace liquidity", cat: "design", c: "is-mint", ex: "Баланс спроса и предложения, time-to-match, density и chicken-and-egg проблемы.", s: 0, rookie: "В маркетплейсе кого важнее растить первым: продавцов или покупателей?", hints: ["объясни liquidity", "выбери constrained side", "дай метрику match quality"] },
  { id: "roadmap", t: "Roadmap narrative", cat: "framework", c: "is-pink", ex: "Как связать стратегию, пользовательскую боль, метрики и порядок фич в понятный roadmap.", s: 0, rookie: "Roadmap — это просто список фич по кварталам?", hints: ["свяжи с целью", "объясни sequencing", "назови trade-offs"] },
  { id: "stakeholders", t: "Stakeholder management", cat: "behavioral", c: "is-sky", ex: "Как PM работает с конфликтами, alignment, decision log и эскалациями без политики.", s: 1, rookie: "Если дизайн и инженерка спорят, PM должен просто выбрать сторону?", hints: ["проясни цель", "раздели факты и мнения", "зафиксируй decision"] },
  { id: "ai-products", t: "AI product evaluation", cat: "metrics", c: "is-sun", ex: "Как оценивать AI-фичи: качество ответа, hallucination, latency, trust и human-in-the-loop.", s: 0, rookie: "У AI-фичи всё субъективно. Как вообще понять, что она стала лучше?", hints: ["назови offline/online метрики", "добавь human eval", "поставь trust guardrail"] },
];

// Упорядоченный стартовый путь новичка: 7 тем по порядку, от роли PM до MVP.
const BEGINNER_PATH = [
  "pm-role-101",
  "product-thinking-101",
  "users-and-segments",
  "problem-statement",
  "basic-metrics",
  "prioritization-101",
  "mvp-basics",
];

// Глубокий контент по конкретным темам: реальные MCQ, мини-кейс, ошибки на собесе и эталон ответа.
// Используется при наличии; иначе экраны откатываются на шаблон по категории.
// Формат mcq-строки: [вопрос, правильный, неверный1, неверный2, неверный3, объяснение].
const TOPIC_CONTENT = {
  "pm-role-101": {
    mcq: [
      ["За что в первую очередь отвечает Product Manager?", "За ценность продукта для пользователя и бизнеса", "За то, чтобы разработчики писали код в срок", "За дизайн интерфейсов", "За найм команды", "PM владеет «что и зачем строим» и почему это важно бизнесу, а не управляет людьми напрямую."],
      ["Что НЕ входит в зону ответственности PM?", "Прямое управление зарплатами и наймом инженеров", "Приоритизация задач", "Формулировка проблемы пользователя", "Выбор метрик успеха", "PM влияет без формальной власти; найм и зарплаты — зона руководителя, а не PM."],
      ["Чем PM отличается от Project Manager?", "PM отвечает за ценность и направление, Project — за сроки и координацию", "Это одно и то же", "PM пишет код, Project — нет", "PM подчиняется Project Manager", "PM решает что строить и зачем; project manager следит, чтобы это доставили в срок."],
    ],
    miniCase: "Тебя берут PM в приложение доставки еды. CEO говорит: «сделай так, чтобы заказывали чаще». Покажи, что понимаешь роль: не прыгай в фичи, а сформулируй, чью проблему и какой бизнес-результат решаешь, и где граница ответственности твоя и команды.",
    mistakes: [
      { t: "Свести роль к Jira и backlog", d: "PM — это ценность, пользователь и бизнес-результат, а не только ведение задач." },
      { t: "Брать власть, которой нет", d: "PM влияет через аргументы и данные, а не приказы дизайну и инженерии." },
      { t: "Начать с решения", d: "Сначала чья проблема и какой бизнес-эффект, потом — что строим." },
    ],
    modelAnswer: "«PM отвечает за то, чтобы команда строила ценное для пользователя и выгодное бизнесу. Начинаю с проблемы и цели: например, цель — поднять частоту заказов. Выясняю, какой сегмент и почему заказывает редко, формулирую гипотезу, выбираю метрику (частота заказов на активного пользователя) и вместе с дизайном и инженерией выбираю решение. «Что и зачем» — на мне, реализацию ведёт команда.»",
  },
  "product-thinking-101": {
    mcq: [
      ["Что значит «думать продуктово»?", "Идти от проблемы пользователя к проверяемой гипотезе и эффекту", "Придумывать как можно больше фич", "Копировать конкурентов", "Делать красивый интерфейс", "Продуктовое мышление = проблема → сегмент → гипотеза → метрика, а не генерация фич."],
      ["С чего начинается продуктовое решение?", "С проблемы и сегмента пользователей", "С выбора технологии", "С дизайна экранов", "С названия фичи", "Сначала чья и какая проблема, потом уже решение."],
      ["Что отличает гипотезу от идеи фичи?", "Гипотеза связывает изменение, аудиторию и ожидаемую метрику", "Ничего, это синонимы", "Гипотеза всегда про дизайн", "Идея фичи всегда точнее", "Гипотеза проверяема: «если сделаем X для Y, метрика Z вырастет»."],
    ],
    miniCase: "У музыкального приложения новые пользователи редко возвращаются на 2-й день. Покажи продуктовое мышление: какой сегмент, какую боль подозреваешь, какую гипотезу и какую метрику проверишь — без перечисления фич.",
    mistakes: [
      { t: "Сразу выдать список фич", d: "Это feature brainstorm, а не мышление: нет проблемы, сегмента и метрики." },
      { t: "Пользователь = все", d: "Без выбора сегмента гипотеза размывается и её нельзя проверить." },
      { t: "Нет способа проверки", d: "Гипотеза без метрики и эксперимента — просто мнение." },
    ],
    modelAnswer: "«Взял бы сегмент новичков, кто послушал один плейлист, но не сохранил ни трека. Гипотеза: они не находят музыку под свой вкус в первый день, поэтому не возвращаются. Метрика — D1/D2 retention сегмента и доля сохранивших трек. Сначала проверю гипотезу на данных, потом предложу решение под неё.»",
  },
  "users-and-segments": {
    mcq: [
      ["Что такое сегмент пользователей?", "Группа с похожей задачей, контекстом и болью", "Все, кто пользуется продуктом", "Разбивка только по возрасту", "Люди из одного города", "Сегмент определяется задачей и поведением, а не только демографией."],
      ["Почему нельзя сказать «наш пользователь — все»?", "Решение для всех не попадает точно ни в один сценарий", "Так говорить невежливо", "Это слишком дорого считать", "Маркетинг запрещает", "Узкий сегмент даёт фокус: понятны боль, канал и метрика."],
      ["Хороший критерий сегментации?", "Поведение и задача (job), которую решает пользователь", "Цвет любимого бренда", "Случайный набор людей", "Только уровень дохода", "Сильная сегментация опирается на поведение/JTBD, а не поверхностную демографию."],
    ],
    miniCase: "Маркетплейс хочет растить повторные покупки. Вместо «наши пользователи — все покупатели» выбери конкретный приоритетный сегмент, объясни его боль и почему он выгоден бизнесу.",
    mistakes: [
      { t: "Сегмент = демография", d: "«Женщины 25-34» — это не задача и не боль, по такому сегменту нельзя строить решение." },
      { t: "Сегмент «все»", d: "Теряется фокус: непонятно, чью боль и какой канал оптимизируем." },
      { t: "Не объяснить выгоду", d: "Нужно показать, почему сегмент важен бизнесу (LTV, объём, рост)." },
    ],
    modelAnswer: "«Выбрал бы сегмент „новые покупатели с 1 заказом за 30 дней“: высокий потенциал повторных покупок, но привычки ещё нет. Боль — неуверенность в качестве и доставке. Сегмент выгоден: перевод во 2-3 заказ заметно поднимает retention и LTV дешевле, чем привлечение новых.»",
  },
  "problem-statement": {
    mcq: [
      ["Что описывает сильный problem statement?", "Пользователя, контекст, боль, частоту и бизнес-последствие", "Готовое решение и список фич", "Название продукта конкурента", "Технологию реализации", "Формулировка проблемы — про боль и контекст, а не про решение."],
      ["Почему нельзя начинать с решения?", "Можно красиво решить не ту проблему", "Решение всегда дороже", "Так не принято в Agile", "Решение нельзя измерить", "Без доказанной проблемы рискуешь оптимизировать неважное."],
      ["Чего НЕ должно быть в problem statement?", "Конкретной фичи как ответа", "Сегмента пользователя", "Частоты проблемы", "Бизнес-последствия", "Фича — это уже решение; в формулировке проблемы её быть не должно."],
    ],
    miniCase: "Финтех теряет пользователей на этапе KYC. Сформулируй problem statement: кто, в каком контексте, что не получается, как часто и чем это бьёт по бизнесу — без предложения решения.",
    mistakes: [
      { t: "Зашить решение в проблему", d: "«Нужна кнопка X» — это решение; проблема описывает боль, а не ответ." },
      { t: "Без частоты и масштаба", d: "Непонятно, стоит ли решать: одна жалоба или 30% воронки?" },
      { t: "Нет бизнес-последствия", d: "Проблема без связи с метрикой/деньгами не пройдёт приоритизацию." },
    ],
    modelAnswer: "«Новые пользователи (сегмент) при прохождении KYC (контекст) бросают заявку на шаге загрузки документов (боль); это у ~40% дошедших до KYC (частота) и режет конверсию в активацию и выручку (бизнес-последствие). Решение предложу после, под эту проблему.»",
  },
  "basic-metrics": {
    mcq: [
      ["На какой вопрос отвечает retention?", "Возвращаются ли пользователи и получают ли ценность повторно", "Сколько новых пользователей пришло", "Сколько денег принёс маркетинг", "Сколько стоит привлечение", "Retention — про повторное получение ценности, а не про привлечение."],
      ["Что такое vanity-метрика?", "Растёт, но не отражает реальную ценность", "Любая метрика про деньги", "Метрика retention", "Метрика активации", "Vanity красиво растёт, но не помогает принять решение."],
      ["Зачем нужна guardrail-метрика?", "Чтобы не улучшить главную метрику во вред (качество, жалобы)", "Чтобы заменить primary metric", "Чтобы считать выручку", "Чтобы измерять CAC", "Guardrail охраняет то, что нельзя уронить, пока двигаешь primary."],
    ],
    miniCase: "У приложения новостей вырос CTR заголовков, но упало время чтения и выросли жалобы. Разложи это на primary / proxy / guardrail метрики и скажи, действительно ли продукт стал лучше.",
    mistakes: [
      { t: "Гнаться за vanity", d: "Рост DAU/CTR может маскировать падение реальной ценности и retention." },
      { t: "Забыть guardrails", d: "Primary можно улучшить вредно: кликбейт поднимает CTR, но убивает доверие." },
      { t: "Метрика без действия", d: "Хорошая метрика подсказывает, что команда поменяет завтра." },
    ],
    modelAnswer: "«Primary здесь — не CTR, а вовлечённое чтение (время/завершённые статьи). CTR — proxy, его легко обмануть кликбейтом. Guardrails — жалобы и доля дочитываний. Раз CTR вырос, а чтение упало и жалобы выросли — продукт стал хуже: оптимизировали proxy в ущерб ценности.»",
  },
  "prioritization-101": {
    mcq: [
      ["Что такое приоритизация по сути?", "Выбор лучшего следующего шага под цель, а не самой приятной идеи", "Список всех идей по алфавиту", "То, что хочет CEO", "Самая дешёвая задача", "Приоритизация = осознанный выбор с учётом эффекта, усилий и риска."],
      ["Что означает E в RICE?", "Effort (усилия)", "Engagement", "Estimate revenue", "Experience", "RICE = (Reach × Impact × Confidence) ÷ Effort."],
      ["Главная ошибка в RICE?", "Подставить красивые числа без доказательств", "Учитывать confidence", "Сравнивать несколько идей", "Оценивать reach", "RICE полезен ровно настолько, насколько честны оценки."],
    ],
    miniCase: "У тебя 4 идеи и 1 спринт. Покажи, как выберешь, что делать первым: назови критерии (impact, effort, confidence, риск) и привяжи выбор к цели продукта, а не к тому, что нравится команде.",
    mistakes: [
      { t: "Делать то, что нравится", d: "Симпатия команды/CEO — не критерий; нужен эффект на цель." },
      { t: "Числа без evidence", d: "RICE с выдуманными оценками создаёт иллюзию объективности." },
      { t: "Игнорировать риск и зависимости", d: "Дешёвая на вид задача может блокироваться или быть рискованной." },
    ],
    modelAnswer: "«Привяжу идеи к цели (например, рост активации), оценю каждую по reach, impact, confidence и effort, отдельно помечу риск и зависимости. Выберу не самую любимую, а ту, что даёт максимум эффекта на цель при разумном усилии и проверяемой гипотезе — и проговорю trade-off остальных.»",
  },
  "mvp-basics": {
    mcq: [
      ["Что такое MVP по сути?", "Минимальный способ проверить рискованную гипотезу", "Дешёвая урезанная версия большого продукта", "Финальный релиз без багов", "Прототип для инвесторов", "MVP проверяет ключевую гипотезу ценности, а не «делает подешевле»."],
      ["Что обязательно у хорошего MVP?", "Чёткая гипотеза и learning-метрика", "Полный набор фич", "Идеальный дизайн", "Маркетинговый бюджет", "MVP бессмыслен без того, что именно проверяем и как поймём результат."],
      ["Когда MVP сделан правильно?", "Когда даёт обучение быстрее и дешевле полного запуска", "Когда в нём максимум функций", "Когда он красивее конкурента", "Когда его хвалит CEO", "Цель MVP — обучение и снижение риска, а не полнота."],
    ],
    miniCase: "Команда хочет потратить квартал на большую фичу «AI-рекомендации». Предложи MVP: какую одну гипотезу проверяешь, что минимально достаточно построить и по какой метрике поймёшь успех.",
    mistakes: [
      { t: "MVP = просто «дешевле»", d: "Главное не урезать, а проверить рискованную гипотезу ценности." },
      { t: "Нет learning-метрики", d: "Без метрики MVP не отвечает на вопрос «работает ли гипотеза»." },
      { t: "Строить сразу много", d: "Чем больше scope, тем дольше и дороже обучение." },
    ],
    modelAnswer: "«Сформулирую гипотезу: „персональные рекомендации поднимут долю пользователей, нашедших контент в первый день“. MVP — простые рекомендации на правилах для одного сегмента, без сложной модели. Метрика обучения — доля кликнувших по рекомендации и D1 retention сегмента. Подтвердится — инвестируем в полноценный ML.»",
  },
  "nsm": {
    mcq: [
      ["Что такое North Star Metric?", "Метрика реализованной ценности для пользователя, ведущая к росту", "Главная метрика выручки", "Самая большая по абсолюту метрика", "Любимая метрика CEO", "NSM отражает ценность для пользователя и предсказывает долгосрочный рост, а не просто деньги."],
      ["Хорошая NSM для Spotify?", "Время активного прослушивания на пользователя", "Число регистраций", "Кол-во скачиваний приложения", "Выручка за месяц", "NSM = повторно получаемая ценность, а не разовое привлечение или деньги."],
      ["Почему revenue — плохая NSM?", "Это lagging-метрика, может расти при падении ценности", "Её нельзя измерить", "Она не важна бизнесу", "Её сложно объяснить", "Выручка отстаёт и маскирует отток; NSM должна быть leading-индикатором ценности."],
    ],
    miniCase: "Стриминг хочет одну метрику, которая объединит команды вокруг ценности. Предложи NSM, объясни, почему не выручка и не DAU, и какие input-метрики её двигают.",
    mistakes: [
      { t: "Взять выручку или DAU", d: "Это lagging/vanity: растут и при ухудшении продукта." },
      { t: "NSM без input-метрик", d: "NSM нужна декомпозиция на рычаги, иначе ей нельзя управлять." },
      { t: "Несколько «главных» метрик", d: "NSM одна — иначе фокуса нет." },
    ],
    modelAnswer: "«NSM — время активного прослушивания на активного пользователя в неделю: это реализованная ценность, которая ведёт к retention и подписке. Не выручка (lagging, маскирует отток) и не DAU (vanity). Input-метрики: доля нашедших трек по вкусу в первый день, число сохранённых треков, частота сессий.»",
  },
  "aarrr": {
    mcq: [
      ["Что проверяет Activation в AARRR?", "Получил ли пользователь ценность в первый раз", "Сколько пользователей пришло", "Сколько заплатили", "Сколько привели друзей", "Activation — момент первой полученной ценности (aha), до retention."],
      ["Где чаще всего «течёт» воронка у нового продукта?", "Activation: пришли, но не дошли до ценности", "Referral", "Revenue", "Awareness", "У большинства продуктов главная утечка между acquisition и activation."],
      ["Зачем PM нужна AARRR?", "Локализовать, на каком этапе теряем пользователей", "Чтобы посчитать выручку", "Заменить product discovery", "Для маркетингового отчёта", "AARRR — каркас диагностики: где именно ломается путь."],
    ],
    miniCase: "У приложения доставки растёт acquisition, но выручка стоит. Разложи путь по AARRR и скажи, на каком этапе вероятнее всего проблема и как это проверить данными.",
    mistakes: [
      { t: "Лить трафик в дырявую воронку", d: "Рост acquisition без activation/retention сжигает бюджет." },
      { t: "Путать activation и retention", d: "Activation — первая ценность, retention — повторная." },
      { t: "Смотреть только на revenue", d: "Деньги — следствие; чинить надо ранний этап утечки." },
    ],
    modelAnswer: "«Разложу: Acquisition (трафик есть) → Activation (дошли ли до первого заказа за N минут?) → Retention (повтор за 30 дней) → Revenue. Гипотеза: проблема в activation — пришли, но не сделали первый заказ. Проверю долю завершивших первый заказ по сегментам и шагам онбординга, найду шаг с максимальной утечкой.»",
  },
  "rice": {
    mcq: [
      ["Расшифруй RICE.", "Reach × Impact × Confidence ÷ Effort", "Revenue × Impact × Cost × Effort", "Reach × Income × Confidence × Effort", "Risk × Impact × Cost × Effort", "RICE = (Reach × Impact × Confidence) ÷ Effort."],
      ["Зачем в RICE Confidence?", "Штрафует идеи со слабыми доказательствами", "Увеличивает любую оценку", "Считает деньги", "Заменяет Reach", "Confidence снижает балл, если оценки не подкреплены данными."],
      ["Главная ловушка RICE?", "Выдуманные числа создают иллюзию объективности", "Слишком долго считать", "Нельзя сравнить идеи", "Не учитывает effort", "RICE честен ровно настолько, насколько честны входные оценки."],
    ],
    miniCase: "У тебя 5 идей на квартал. Покажи, как через RICE выберешь топ-2, и где честно проставишь низкий Confidence из-за нехватки данных.",
    mistakes: [
      { t: "Числа без evidence", d: "RICE с фантазийными оценками — ложная точность." },
      { t: "Игнорировать Confidence", d: "Без него рискованные идеи всплывают наверх незаслуженно." },
      { t: "Считать RICE священным", d: "Это инструмент сравнения, а не замена стратегии и здравого смысла." },
    ],
    modelAnswer: "«Для каждой идеи оценю Reach (сколько пользователей за период), Impact (1–3), Confidence (доля, по данным/гипотезе) и Effort (человеко-недели), посчитаю (R×I×C)/E. Идеям без данных честно поставлю Confidence 50%. Возьму топ-2 по баллу, но проговорю риск и зависимости — RICE помогает сравнить, решение всё равно за мной.»",
  },
  "jtbd": {
    mcq: [
      ["Что описывает JTBD?", "Прогресс, которого пользователь хочет достичь в ситуации", "Демографию пользователя", "Список фич продукта", "Должность пользователя", "JTBD — про задачу и контекст, а не про то, кто человек по паспорту."],
      ["Сильная формулировка job?", "«Когда …, я хочу …, чтобы …»", "«Пользователи 25-34»", "«Нужна кнопка лайка»", "«Сделать как у конкурента»", "Формат when/I want/so I can фиксирует ситуацию, мотив и желаемый результат."],
      ["Зачем JTBD в product design?", "Чтобы строить решение под реальную задачу, а не под фичу", "Чтобы показать большой рынок", "Чтобы избежать метрик", "Чтобы быстрее накидать фич", "JTBD удерживает от feature-brainstorm без причины."],
    ],
    miniCase: "Тебя просят «добавить ленту рекомендаций». Переформулируй это через JTBD: какую работу пользователь нанимает продукт сделать и в какой ситуации, прежде чем проектировать фичу.",
    mistakes: [
      { t: "Job = демография", d: "«Женщины 25-34» — это не задача и не ситуация." },
      { t: "Сразу фича вместо job", d: "«Нужна лента» — решение; сначала какая работа за ним." },
      { t: "Job без контекста", d: "Без ситуации (когда/где) job не отличить от лозунга." },
    ],
    modelAnswer: "«Переформулирую: „Когда у меня мало времени вечером, я хочу быстро найти, что посмотреть, чтобы не листать полчаса“. Это job. Лента рекомендаций — лишь одно из решений; теперь я могу сравнить его с другими (быстрые подборки, продолжить просмотр) по тому, как хорошо они закрывают эту работу.»",
  },
  "root-cause": {
    mcq: [
      ["С чего начать диагностику падения метрики?", "Разложить метрику на драйверы и найти, где именно просадка", "Сразу запустить промо", "Добавить новых фич", "Поднять рекламный бюджет", "Сначала локализуй слом по дереву метрик и сегментам, потом лечи."],
      ["Что важно проверить во времени?", "Что изменилось прямо перед падением (релиз, цена, канал)", "Среднюю метрику за год", "Прогноз на 3 года", "Мнение CEO", "Change log выявляет триггер падения."],
      ["Как сузить причину?", "Сравнить сегменты/каналы/устройства: где есть просадка, где нет", "Усреднить всё вместе", "Спросить маркетинг", "Сделать редизайн", "Segment isolation показывает, где именно сломалось."],
    ],
    miniCase: "Продажи маркетплейса упали на 20% за неделю. Построй диагностику: дерево метрик, какие разрезы проверишь и что искал бы в change log — до любых решений.",
    mistakes: [
      { t: "Лечить симптом скидками", d: "Не доказав, где сломалась воронка, тратишь деньги вслепую." },
      { t: "Смотреть только среднее", d: "Среднее прячет, что упал один сегмент/канал/платформа." },
      { t: "Игнорировать change log", d: "Чаще всего падение совпадает с конкретным изменением." },
    ],
    modelAnswer: "«Разложу: заказы = трафик × конверсия × частота. Сравню по сегментам, каналам, устройствам, гео и периодам — найду, где именно −20%. Посмотрю change log: релизы, цены, изменения поиска/оплаты в дни падения. Сформулирую root cause как проверяемую гипотезу (например, «упала конверсия в оплату на Android после релиза X») и проверю на данных, прежде чем предлагать решение.»",
  },
  "ab-power": {
    mcq: [
      ["Что такое MDE?", "Минимальный эффект, который тест способен задетектить", "Среднее по выборке", "Максимальный эффект фичи", "Доверительный интервал", "MDE — насколько метрика должна измениться, чтобы тест это увидел."],
      ["Зачем A/A-тест?", "Проверить корректность сплитования и метрик", "Удвоить эффект", "Заменить A/B", "Поднять конверсию", "A/A: две одинаковые группы не должны системно различаться."],
      ["«Серый» результат теста — это…", "Нет значимого роста и нет падения guardrails", "Однозначный успех", "Однозначный провал", "Ошибка данных", "Серый тест требует проверить мощность, баги, сегменты и новые гипотезы."],
    ],
    miniCase: "Хочешь проверить, что подсказки на карточке поднимут конверсию в контакт. Спроектируй A/B: целевая метрика, guardrails, единица рандомизации, MDE и правило решения.",
    mistakes: [
      { t: "Нет расчёта мощности/MDE", d: "Тест без MDE может «ничего не показать» просто из-за малой выборки." },
      { t: "Подсматривать и останавливать рано", d: "Peeking раздувает ложноположительные; фиксируй длительность заранее." },
      { t: "Забыть guardrails", d: "Можно поднять целевую метрику, уронив жалобы/латентность/маржу." },
    ],
    modelAnswer: "«Гипотеза: подсказки на карточке поднимут конверсию в контакт. Целевая — contact rate; guardrails — жалобы и время на странице. Рандомизация по пользователю, MDE 3% при 80% мощности задаёт нужную выборку и срок (~2 недели). Правило: катим, если +3% по целевой при стабильных guardrails; иначе — серый/красный и разбор причин.»",
  },
  "estimation": {
    mcq: [
      ["Что важнее в estimation на собесе?", "Прозрачная логика и допущения, а не точная цифра", "Угадать точное число", "Большая формула", "Знание реальных данных рынка", "Оценивают ход мысли и явные допущения, а не точность."],
      ["Top-down оценка — это…", "От большой базы вниз: население → сегмент → доля → частота", "От одной единицы вверх", "Случайное число", "Только онлайн-данные", "Top-down идёт от рынка к сегменту."],
      ["Что обязательно сделать в конце?", "Sanity check порядка величины", "Назвать только итог", "Усложнить формулу", "Извиниться за неточность", "Проверка на здравый смысл показывает зрелость оценки."],
    ],
    miniCase: "Оцени число заказов доставки еды в городе на 1 млн жителей за месяц. Покажи базу, сегменты, допущения, формулу, диапазон и sanity check.",
    mistakes: [
      { t: "Одно «точное» число", d: "Без сегментации и допущений это угадайка, а не оценка." },
      { t: "Молча взять допущение", d: "Каждое допущение проговаривай — его и проверяют." },
      { t: "Нет sanity check", d: "Без проверки порядка величины легко ошибиться в 10×." },
    ],
    modelAnswer: "«Top-down: 1 млн жителей × 60% взрослых смартфон-юзеров × 30% пользуются доставкой × 4 заказа/мес ≈ 720 тыс. заказов/мес. Допущения проговариваю явно (penetration, частота). Диапазон ±30% из-за частоты. Sanity check: ~0,7 заказа на жителя в месяц — правдоподобно для крупного города. Самое чувствительное допущение — penetration доставки.»",
  },
  "star": {
    mcq: [
      ["Что значит STAR?", "Situation · Task · Action · Result", "Strategy · Tactic · Action · Review", "Story · Task · Aim · Result", "Situation · Time · Action · Risk", "STAR: ситуация, задача, действия (от первого лица), результат."],
      ["Где джуны теряют баллы в STAR?", "Говорят «мы» вместо личного вклада в Action", "Слишком короткая Situation", "Называют результат", "Структурируют ответ", "Интервьюер оценивает твой личный вклад, а не «мы всё сделали»."],
      ["Что усиливает Result?", "Конкретная цифра/наблюдаемый эффект + вывод", "Длинное описание процесса", "Список всех участников", "Эмоции", "Result должен быть измерим и завершаться learning."],
    ],
    miniCase: "Подготовь STAR-историю на 90 секунд про конфликт с дизайном или инженерией: коротко ситуация, твоя задача, твои действия от первого лица, измеримый результат и вывод.",
    mistakes: [
      { t: "Прятаться за «мы»", d: "Action должен показать твой личный вклад и решения." },
      { t: "Уйти в драму", d: "Конфликт — через цель, факты и решение, без обвинений." },
      { t: "Нет learning", d: "Без вывода история выглядит как случайность, а не рост." },
    ],
    modelAnswer: "«S: дизайн и инженерия спорили о scope релиза, дедлайн горел. T: мне как PM нужно было выровнять команду и не сорвать срок. A: я свёл спор к цели релиза, развёл факты и мнения, предложил резать scope по критерию impact/effort и зафиксировал decision log. R: вышли в срок, конверсия онбординга +12%. Learning: ранний decision log снимает половину споров.»",
  },
  "guardrails": {
    mcq: [
      ["Что такое guardrail-метрика?", "Метрика, которую нельзя ухудшить, улучшая основную", "Главная метрика роста", "Метрика выручки", "Vanity-метрика", "Guardrail охраняет качество/доверие, пока двигаешь primary."],
      ["Пример guardrail при росте CTR?", "Жалобы и доля дочитываний", "Число показов", "Бюджет рекламы", "Размер команды", "CTR можно поднять кликбейтом — guardrail ловит вред."],
      ["Зачем guardrails в эксперименте?", "Чтобы не выкатить улучшение, которое вредит в другом месте", "Чтобы ускорить тест", "Чтобы заменить primary", "Для отчёта маркетингу", "Guardrails не дают оптимизировать метрику во вред продукту."],
    ],
    miniCase: "Команда хочет растить time-in-app. Назови риск метрики и подбери 2-3 guardrail, которые не дадут «накрутить» вовлечённость во вред пользователю.",
    mistakes: [
      { t: "Только primary-метрика", d: "Её часто можно улучшить вредным способом." },
      { t: "Guardrail без порога", d: "Нужно явно: что считаем «нельзя уронить»." },
      { t: "Путать guardrail и proxy", d: "Proxy предсказывает успех, guardrail охраняет от вреда." },
    ],
    modelAnswer: "«Time-in-app легко накрутить тёмными паттернами, поэтому к нему ставлю guardrails: доля пользователей с жалобами/uninstall, доля «бесцельных» сессий и retention следующей недели. Расту time-in-app, только если guardrails не ухудшаются — иначе это вред под видом вовлечённости.»",
  },
};

const getBeginnerPathNotes = () =>
  BEGINNER_PATH.map((id) => KNOWLEDGE_NOTES.find((n) => n.id === id)).filter(Boolean);

function Pim({ message, actions = [], expression = "idle", muted = false, route = "home", progress, openSignal = 0 }) {
  const [show, setShow] = useState(true);
  const [chatOpen, setChatOpen] = useState(false);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [messages, setMessages] = useState([
    { role: "coach", text: "Привет! Я Pim. Можешь спрашивать что угодно: про кейсы, метрики, интервью, резюме или конкретный ответ." },
  ]);

  const askPim = async (text) => {
    const question = text.trim();
    if (!question || busy) return;
    const nextMessages = [...messages, { role: "student", text: question }];
    setMessages(nextMessages);
    setInput("");
    setBusy(true);
    try {
      const res = await api.coach({
        stepId: route,
        stepTitle: `PMQuest / ${route}`,
        stepDescription: "Свободный AI-агент Pim отвечает на вопросы пользователя внутри тренажёра PMQuest.",
        frameworks: ["PM interview", "Product sense", "Case interview", "Metrics"],
        caseHint: "Отвечай кратко, практически, на русском. Если вопрос общий, дай структуру и пример.",
        caseText: "Пользователь готовится к PM/case-интервью в PMQuest.",
        answerText: "",
        userMessage: question,
        chatHistory: nextMessages.slice(-8),
        previousAnswers: {},
        trackId: "product",
      });
      setMessages([...nextMessages, { role: "coach", text: res.message }]);
    } catch (e) {
      setMessages([
        ...nextMessages,
        {
          role: "coach",
          text: `Не смог достучаться до AI API (${e.message}). Но я рядом: переформулируй вопрос или проверь, что backend проснулся на Render.`,
        },
      ]);
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    setShow(true);
    // Авто-сворачивание пузыря, чтобы маскот не висел поверх контента постоянно.
    const t = window.setTimeout(() => setShow(false), 9000);
    return () => window.clearTimeout(t);
  }, [message]);

  useEffect(() => {
    if (openSignal > 0) setChatOpen(true);
  }, [openSignal]);

  return (
    <div className={`pim-anchor ${muted ? "muted" : ""}`}>
      {chatOpen && (
        <div className="pim-chat">
          <div className="pim-chat-head">
            <div>
              <strong>Pim AI agent</strong>
              <span>Lvl {getLevel(progress?.xp || 0)} · {progress?.xp || 0} XP</span>
            </div>
            <button onClick={() => setChatOpen(false)} aria-label="close">×</button>
          </div>
          <div className="pim-chat-log">
            {messages.map((m, i) => (
              <div key={i} className={`pim-chat-msg ${m.role === "student" ? "you" : "agent"}`}>
                {m.text}
              </div>
            ))}
            {busy && <div className="pim-chat-msg agent">Думаю…</div>}
          </div>
          <form className="pim-chat-form" onSubmit={(e) => { e.preventDefault(); askPim(input); }}>
            <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Спроси Pim что угодно..." />
            <button className="pa" type="submit" disabled={busy || !input.trim()}>→</button>
          </form>
        </div>
      )}
      {message && show && (
        <div className="pim-bubble">
          <button className="close-bubble" onClick={() => setShow(false)} aria-label="close">×</button>
          <div className="pim-name">Pim</div>
          <div>{message}</div>
          {actions.length > 0 && (
            <div className="pim-actions">
              {actions.map((a, i) => (<button key={i} className="pa" onClick={a.on}>{a.label}</button>))}
            </div>
          )}
        </div>
      )}
      <button className="pim-face-button" onClick={() => setChatOpen(true)} aria-label="Открыть Pim AI agent">
        <PimFigure size={110} expression={chatOpen ? "talk" : expression} className="idle" />
      </button>
    </div>
  );
}

// ─── Sidebar + Topbar ────────────────────────────────────────────────
function Sidebar({ route, go, progress }) {
  const level = getLevel(progress.xp);
  const items = [
    { k: "home",    label: "Home",          ico: Icon.home,   group: "main" },
    { k: "library", label: "Уроки",         ico: Icon.book,   group: "main", badge: String(KNOWLEDGE_NOTES.length) },
    { k: "check",   label: "Check · MCQ",   ico: Icon.cards,  group: "learn" },
    { k: "srs",     label: "Карточки SRS",  ico: Icon.zap,    group: "learn", badge: String(progress.cardsDue) },
    { k: "case",    label: "Кейс",          ico: Icon.case,   group: "practice" },
    { k: "mock",    label: "Mock с AI",     ico: Icon.mic,    group: "practice" },
    { k: "drill",   label: "Drill 60s",     ico: Icon.bolt,   group: "practice" },
    { k: "teach",   label: "Teach Rookie",  ico: Icon.teach,  group: "practice" },
    { k: "review",  label: "Score",         ico: Icon.trophy, group: "results" },
    { k: "cv",      label: "Резюме",        ico: Icon.cv,     group: "results" },
  ];
  const groups = [
    { key: "main",     label: null },
    { key: "learn",    label: "учи" },
    { key: "practice", label: "практикуй" },
    { key: "results",  label: "результат" },
  ];
  return (
    <aside className="sidebar">
      <div className="logo">
        <div className="mark"><PimFigure size={32} expression="smile" /></div>
        <div>PMQuest</div>
      </div>
      {groups.map(g => (
        <React.Fragment key={g.key}>
          {g.label && <div className="nav-group-label">{g.label}</div>}
          {items.filter(it => it.group === g.key).map(it => (
            <button type="button" key={it.k} className={`sb-item ${route === it.k ? "active" : ""}`} onClick={() => go(it.k)}>
              <span className="ico">{it.ico}</span>
              <span>{it.label}</span>
              {it.badge && <span className="badge">{it.badge}</span>}
            </button>
          ))}
        </React.Fragment>
      ))}
      <div className="sb-profile">
        <div className="av">Я</div>
        <div>
          <div className="who">Мой прогресс</div>
          <div className="lvl">Lvl {level} · {progress.xp} XP</div>
        </div>
      </div>
    </aside>
  );
}

function Topbar({ crumbs = [], progress, clock }) {
  const level = getLevel(progress.xp);
  return (
    <div className="topbar">
      <div className="crumbs">
        {crumbs.map((c, i) => (
          <React.Fragment key={i}>
            <span className={i === crumbs.length - 1 ? "now" : ""}>{c}</span>
            {i < crumbs.length - 1 && <span className="sep">›</span>}
          </React.Fragment>
        ))}
      </div>
      <div className="grow" />
      <button type="button" className="search" onClick={() => window.dispatchEvent(new CustomEvent("pmquest-open-search"))}>
        {Icon.search}<span>поиск кейсов, тем, компаний</span>
      </button>
      <div className="stat"><span className="em">🕒</span><span>{clock.time} МСК</span></div>
      <div className="stat"><span className="em">🔥</span><span>{progress.streak}</span></div>
      <div className="stat" style={{ background: "var(--ph-sun-2)" }}><span className="em">✦</span><span>{progress.xp}</span></div>
      <div className="stat" style={{ background: "var(--ph-mint-2)" }}><span className="em">★</span><span>Lvl {level}</span></div>
    </div>
  );
}

// ─── Screen: HOME (bento) ────────────────────────────────────────────
function HomeScreen({ go, progress, clock, completeTask, openPim }) {
  const level = getLevel(progress.xp);
  const isNew = progress.xp === 0 && Object.keys(progress.completed || {}).length === 0;
  const levelProgress = getLevelProgress(progress.xp);
  const week = ["Пн","Вт","Ср","Чт","Пт","Сб","Вс"];
  const todayIdx = (new Date().getDay() + 6) % 7;
  const lessonDone = KNOWLEDGE_NOTES.filter((note) => progress.completed?.[`lesson-${note.id}`]).length;
  const checkDone = KNOWLEDGE_NOTES.filter((note) => progress.completed?.[`check-${note.id}`]).length;
  const teachDone = KNOWLEDGE_NOTES.filter((note) => progress.completed?.[`teach-${note.id}`]).length;
  const lessonPct = Math.round((lessonDone / KNOWLEDGE_NOTES.length) * 100);
  const checkPct = Math.round((checkDone / KNOWLEDGE_NOTES.length) * 100);
  const teachPct = Math.round((teachDone / KNOWLEDGE_NOTES.length) * 100);
  const casePct = Math.min(100, Math.round((progress.cases / 12) * 100));
  const storyPct = Math.min(100, Math.round((teachDone / 8) * 100));
  const srsPct = Math.max(0, Math.min(100, 100 - progress.cardsDue * 8));
  const beginnerNotes = getBeginnerPathNotes();
  const beginnerDoneFn = (n) => Boolean(progress.completed?.[`check-${n.id}`] || progress.completed?.[`teach-${n.id}`] || progress.completed?.[`lesson-${n.id}`]);
  const beginnerDoneCount = beginnerNotes.filter(beginnerDoneFn).length;
  const nextBeginner = beginnerNotes.find((n) => !beginnerDoneFn(n)) || beginnerNotes[0];
  const pathComplete = beginnerDoneCount === beginnerNotes.length;
  return (
    <div className="screen" style={{ maxWidth: "none" }}>
      <Topbar crumbs={["PMQuest", "Home"]} progress={progress} clock={clock} />
      <div className="screen-head" style={{ marginBottom: 18 }}>
        <div>
          <span className="eyebrow">{clock.label} · {isNew ? "первый день подготовки" : "продолжай маршрут подготовки"}</span>
          <h1 style={{ marginTop: 4 }}>{progress.xp ? "С возвращением" : "Начнём с основ"} <span style={{ color: "var(--ph-coral)" }}>✦</span></h1>
        </div>
        <div className="right">
          <button className="btn ghost sm" onClick={() => window.dispatchEvent(new CustomEvent("pmquest-open-plan"))}>Мой план</button>
          <button className="btn ghost sm" onClick={() => window.dispatchEvent(new CustomEvent("pmquest-open-goal"))}>🎯 Junior PM · 54 дн.</button>
        </div>
      </div>

      <div className="bento">
        <div className="tile t-mission is-coral" onClick={() => go("lesson", { lessonTopicId: nextBeginner.id })}>
          <span className="corner-ico">путь новичка · {beginnerDoneCount}/{beginnerNotes.length} тем</span>
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 14, paddingTop: 18, paddingRight: 130, position: "relative", zIndex: 2 }}>
            <span className="chip" style={{ background: "rgba(255,255,255,0.18)", color: "#fff", border: "1.5px solid #fff", width: "fit-content" }}>{pathComplete ? "база пройдена · переходи к практике" : `стартовый путь · тема ${beginnerDoneCount + 1} из ${beginnerNotes.length}`}</span>
            <h3 className="h-display" style={{ fontSize: 38, color: "#fff", margin: 0, maxWidth: "16ch" }}>{pathComplete ? "Продолжи практикой: Drill и Mock" : `${beginnerDoneCount === 0 ? "Начни" : "Дальше"}: «${nextBeginner.t}»`}</h3>
            <p style={{ color: "rgba(255,255,255,0.9)", fontSize: 15, maxWidth: "44ch" }}>
              Проходи 7 базовых тем по порядку: урок → Check → объясни стажёру. После пути новичка открывай кейсы и Mock.
            </p>
          </div>
          <div className="mission-bars">
            <div><span>теория</span><i><b style={{ width: `${lessonPct}%` }}></b></i><em>{lessonDone}/{KNOWLEDGE_NOTES.length}</em></div>
            <div><span>check</span><i><b style={{ width: `${checkPct}%` }}></b></i><em>{checkDone}/{KNOWLEDGE_NOTES.length}</em></div>
            <div><span>practice</span><i><b style={{ width: `${teachPct}%` }}></b></i><em>{teachDone}/{KNOWLEDGE_NOTES.length}</em></div>
          </div>
          <div className="footer" style={{ position: "relative", zIndex: 2 }}>
            <div className="mission-chips">
              <span className="chip" style={{ background: "var(--ph-sun)", borderColor: "var(--ph-ink)" }}>+90 XP за цикл</span>
              <span className="chip" style={{ background: "#fff", borderColor: "var(--ph-ink)" }}>🎯 product sense</span>
            </div>
            <button className="btn lg" style={{ background: "#fff", color: "var(--ph-ink)" }}>{Icon.play}<span>Начать миссию</span></button>
          </div>
          <div style={{ position: "absolute", right: 14, top: 32, opacity: 0.95, transform: "rotate(8deg)", zIndex: 1, pointerEvents: "none" }}>
            <PimFigure size={108} expression="cheer" />
          </div>
        </div>

        <div className="tile t-streak is-sun">
          <span className="corner-ico">streak</span>
          <h3>🔥 {progress.streak} дней подряд</h3>
          <p>держи темп — Пим в тебя верит</p>
          <div className="streak-row" style={{ marginTop: "auto" }}>
            {week.map((d, i) => (
              <div key={d + i} className={`day ${progress.streak > 0 && i <= todayIdx ? "on" : ""} ${i === todayIdx ? "today" : ""}`}>{d[0]}</div>
            ))}
          </div>
        </div>

        <div className="tile t-xp is-cream" onClick={() => go("review")}>
          <span className="corner-ico">level {level} → {level + 1}</span>
          <h3 style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
            <span>{progress.xp} XP</span>
            <span className="mono" style={{ color: "var(--ph-ink-3)" }}>+{300 - (progress.xp % 300)} до lvl {level + 1}</span>
          </h3>
          <div className="bar tall" style={{ marginTop: "auto" }}><i style={{ width: `${levelProgress}%` }}></i></div>
        </div>

        <div className="tile t-bank" onClick={() => go("check")}>
          <span className="corner-ico">practice bank</span>
          <h3>Вопросы для PM-собеседований</h3>
          <p>тренируй темы по одной, от базы к mock</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 6 }}>
            {[
              { c: "Product sense", n: "урок → drill", col: "var(--ph-sky-2)" },
              { c: "Execution", n: "метрики", col: "var(--ph-plum-2)" },
              { c: "Strategy", n: "trade-offs", col: "var(--ph-sun-2)" },
              { c: "Behavioral", n: "STAR", col: "var(--ph-card-sunk)" },
            ].map(r => (
              <div key={r.c} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "4px 10px", borderRadius: 8, background: r.col, border: "1.5px solid var(--ph-ink)" }}>
                <b style={{ fontSize: 13 }}>{r.c}</b>
                <span className="mono">{r.n}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="tile t-cases is-mint" onClick={() => go("case")}>
          <span className="corner-ico">кейсы</span>
          <h3>Кейсы</h3>
          <p>product design · estimation · strategy</p>
          <div className="footer">
            <div className="bar live-bar"><i style={{ width: `${casePct}%` }}></i></div>
            <button className="btn sm">{Icon.chev}</button>
          </div>
        </div>

        <div className="tile t-behav is-pink" onClick={() => go("teach")}>
          <span className="corner-ico">star · behavioral</span>
          <h3>Банк историй</h3>
          <p>STAR-подход и тренировка твоих историй</p>
          <div className="footer">
            <div className="bar live-bar"><i style={{ width: `${storyPct}%`, background: "var(--ph-plum)" }}></i></div>
            <button className="btn sm">{Icon.chev}</button>
          </div>
        </div>

        <div className="tile t-pim is-plum" onClick={openPim}>
          <span className="corner-ico" style={{ color: "rgba(255,255,255,0.7)" }}>ai-тутор</span>
          <h3 style={{ color: "#fff" }}>Pim рядом — всегда</h3>
          <p>Спрашивай по любой теме. Отвечу с FAANG-примерами и подсветкой пробелов.</p>
          <div style={{ marginTop: "auto", display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 10 }}>
            <button className="btn sm" style={{ background: "#fff", color: "var(--ph-ink)" }}>спросить</button>
            <div style={{ marginRight: -8, marginBottom: -8 }}>
              <PimFigure size={84} expression="teach" />
            </div>
          </div>
        </div>

        <div className="tile t-srs" onClick={() => go("srs")}>
          <span className="corner-ico">srs · повторение</span>
          <h3>{progress.cardsDue} карточек к повтору</h3>
          <p>{progress.cardsDue ? "Термины вернулись по расписанию" : "Появятся после Check и практики"}</p>
          <div className="footer">
            <span className="chip mint">~6 мин</span>
            <div className="bar live-bar"><i style={{ width: `${srsPct}%`, background: "var(--ph-mint)" }}></i></div>
            <button className="btn sm primary">{Icon.play}</button>
          </div>
        </div>

        <div className="tile t-cv is-sky" onClick={() => go("cv")}>
          <span className="corner-ico">резюме</span>
          <h3>CV-чеклист для PM-роли</h3>
          <p>Демо · проверь структуру, impact и метрики</p>
          <div className="footer">
            <span className="chip" style={{ background: "#fff", borderColor: "var(--ph-ink)" }}>📎 drop file</span>
            <button className="btn sm">{Icon.chev}</button>
          </div>
        </div>

        <div className="tile t-plan is-cream">
          <span className="corner-ico">8-недельный план · пример</span>
          <h3>Примерный roadmap к интервью</h3>
          <div className="week-rail">
            {[
              { n: "1", l: "Found.", st: isNew ? "now" : "done" },
              { n: "2", l: "Cases",  st: isNew ? "" : "now" },
              { n: "3", l: "Cases+", st: "" },
              { n: "4", l: "Behav.", st: "" },
              { n: "5", l: "SysD",   st: "" },
              { n: "6", l: "Metrics",st: "" },
              { n: "7", l: "Mocks",  st: "" },
              { n: "8", l: "Final",  st: "" },
            ].map((w) => (
              <div key={w.n} className={`wk ${w.st}`}>
                <div>нед.{w.n}</div>
                <div className="l">{w.l}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="tile t-com" style={{ opacity: 0.7 }}>
          <span className="corner-ico">комьюнити · в разработке</span>
          <h3>Практикуй в своём темпе</h3>
          <p>Раздел сообщества ещё не запущен — здесь пока нечего сравнивать. Это честная заглушка, а не реальные пользователи.</p>
          <p style={{ marginTop: "auto" }}>
            <span className="chip" style={{ background: "var(--ph-card)", borderColor: "var(--ph-ink)" }}>появится позже</span>
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Screen: LIBRARY ─────────────────────────────────────────────────
function LibraryScreen({ go, progress, clock, notes = KNOWLEDGE_NOTES, onAddLesson }) {
  const [cat, setCat] = useState("beginner");
  const [sortMode, setSortMode] = useState("new");
  const [showAddLesson, setShowAddLesson] = useState(false);
  const [lessonDraft, setLessonDraft] = useState({ title: "", summary: "", cat: "beginner" });
  const categoryCounts = notes.reduce((acc, note) => ({ ...acc, [note.cat]: (acc[note.cat] || 0) + 1 }), {});
  const cats = [
    { k: "all",       label: "Все",                  n: notes.length },
    { k: "beginner",  label: "Новичку в PM",         n: categoryCounts.beginner || 0 },
    { k: "framework", label: "Фреймворки",           n: categoryCounts.framework || 0 },
    { k: "metrics",   label: "Метрики & A/B",        n: categoryCounts.metrics || 0 },
    { k: "design",    label: "Product design",       n: categoryCounts.design || 0 },
    { k: "behavioral",label: "Behavioral / STAR",    n: categoryCounts.behavioral || 0 },
    { k: "sysdesign", label: "System design для PM", n: categoryCounts.sysdesign || 0 },
  ];
  const filtered = (cat === "all" ? notes : notes.filter(n => n.cat === cat))
    .slice()
    .sort((a, b) => {
      if (sortMode === "az") return a.t.localeCompare(b.t);
      if (sortMode === "mastery") {
        const aDone = Boolean(progress.completed?.[`check-${a.id}`] || progress.completed?.[`teach-${a.id}`]);
        const bDone = Boolean(progress.completed?.[`check-${b.id}`] || progress.completed?.[`teach-${b.id}`]);
        return Number(bDone) - Number(aDone);
      }
      return Number(b.isCustom) - Number(a.isCustom);
    });
  const masteredCount = notes.filter((n) => progress.completed?.[`teach-${n.id}`]).length;
  const sortLabel = { new: "новые", az: "A–Я", mastery: "освоение" }[sortMode];
  const cycleSort = () => setSortMode((current) => current === "new" ? "az" : current === "az" ? "mastery" : "new");
  const submitLesson = () => {
    const title = lessonDraft.title.trim();
    const summary = lessonDraft.summary.trim();
    if (!title || !summary) return;
    onAddLesson?.({ title, summary, cat: lessonDraft.cat });
    setLessonDraft({ title: "", summary: "", cat: "beginner" });
    setShowAddLesson(false);
    setCat("all");
    setSortMode("new");
  };
  return (
    <div className="screen" style={{ maxWidth: "none" }}>
      <Topbar crumbs={["PMQuest", "Уроки"]} progress={progress} clock={clock} />
      <div className="screen-head">
        <div>
          <span className="eyebrow">Хранилище — {notes.length} уроков, статус освоения открывается практикой</span>
          <h1>Твои уроки</h1>
        </div>
        <div className="right">
          <button className="btn ghost" onClick={cycleSort}>Сортировка: {sortLabel}</button>
          <span className="chip mint">освоено {masteredCount}/{notes.length}</span>
          <button className="btn primary" onClick={() => setShowAddLesson(true)}>＋ свой урок</button>
        </div>
      </div>
      <div className="lib-stage">
        <aside className="lib-sidebar">
          <h5>Категории</h5>
          {cats.map(c => (
            <button type="button" key={c.k} className={`lib-cat ${cat === c.k ? "active" : ""}`} onClick={() => setCat(c.k)}>
              <span>{c.label}</span>
              <span className="cnt">{c.n}</span>
            </button>
          ))}
          <h5 style={{ marginTop: 14 }}>Метки</h5>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", padding: "0 6px" }}>
            <span className="chip mint">освоено после практики</span>
            <span className="chip sun">готово к практике</span>
            <span className="chip pink">новое</span>
            <span className="chip sky">избранное</span>
          </div>
        </aside>
        <div>
          {cat === "beginner" && (
            <div className="beginner-path">
              <span className="eyebrow">маршрут новичка · проходи по порядку</span>
              <h3>7 базовых тем перед первой тренировкой</h3>
              <ol className="beginner-path-list">
                {getBeginnerPathNotes().map((n, i) => {
                  const done = Boolean(progress.completed?.[`check-${n.id}`] || progress.completed?.[`teach-${n.id}`] || progress.completed?.[`lesson-${n.id}`]);
                  return (
                    <li key={n.id}>
                      <button type="button" className={`beginner-path-step ${done ? "done" : ""}`} onClick={() => go("lesson", { lessonTopicId: n.id })}>
                        <span className="bp-num">{done ? "✓" : i + 1}</span>
                        <span className="bp-title">{n.t}</span>
                        <span className="bp-go">{done ? "повторить" : "начать"} →</span>
                      </button>
                    </li>
                  );
                })}
              </ol>
            </div>
          )}
        <div className="notes-grid">
          {filtered.map((n) => {
            const mastered = Boolean(progress.completed?.[`check-${n.id}`] || progress.completed?.[`teach-${n.id}`]);
            const checked = progress.checkStats?.[n.id] || 0;
            const progressSteps = Math.min(4, (n.s > 0 ? 1 : 0) + (checked > 0 ? 1 : 0) + (mastered ? 2 : 0));
            return (
              <button type="button" key={n.id} className={`note-card ${n.c}`} onClick={() => go("lesson", { lessonTopicId: n.id })}>
                {mastered && <span className="mastered-badge">✓ освоено</span>}
                {n.isCustom && <span className="mastered-badge" style={{ background: "var(--ph-sky-2)", right: "auto", left: 12 }}>моя заметка</span>}
                <h4>{n.t}</h4>
                <p className="excerpt">{n.ex}</p>
                <div className="lesson-progress">
                  <div className="bar"><i style={{ width: `${progressSteps * 25}%`, background: mastered ? "var(--ph-mint)" : "var(--ph-sun)" }}></i></div>
                  <span>{mastered ? "практика пройдена" : checked > 0 ? "check начат · нужна практика" : "урок готов к практике"}</span>
                </div>
                <div className="nfoot">
                  <span className="mono" style={{ color: "var(--ph-ink-3)" }}>{n.cat}</span>
                  <span className="stars">
                    {[0,1,2,3].map(k => <i key={k} className={k < progressSteps ? "on" : ""}></i>)}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
        </div>
      </div>
      {showAddLesson && (
        <div className="pmq-modal-backdrop" onClick={() => setShowAddLesson(false)}>
          <section className="pmq-modal" onClick={(event) => event.stopPropagation()}>
            <div className="pmq-modal-head">
              <div>
                <span className="eyebrow">своя заметка</span>
                <h3>Добавить свою тему-заметку</h3>
              </div>
              <button className="btn ghost sm" onClick={() => setShowAddLesson(false)}>×</button>
            </div>
            <p style={{ margin: "0 0 12px", color: "var(--ph-ink-3)", fontSize: 13.5 }}>
              Это твоя личная заметка, а не AI-урок: сохраним название и твой текст, чтобы вернуться позже. Готовый разбор по шагам есть только у встроенных тем.
            </p>
            <label className="pmq-field">
              <span>Название темы</span>
              <input value={lessonDraft.title} onChange={(event) => setLessonDraft((draft) => ({ ...draft, title: event.target.value }))} placeholder="Например: B2B onboarding" />
            </label>
            <label className="pmq-field">
              <span>Твоя заметка по теме</span>
              <textarea value={lessonDraft.summary} onChange={(event) => setLessonDraft((draft) => ({ ...draft, summary: event.target.value }))} placeholder="Запиши своими словами: что это, зачем PM, пример, на что обратить внимание." />
            </label>
            <label className="pmq-field">
              <span>Категория</span>
              <select value={lessonDraft.cat} onChange={(event) => setLessonDraft((draft) => ({ ...draft, cat: event.target.value }))}>
                {cats.filter((item) => item.k !== "all").map((item) => <option key={item.k} value={item.k}>{item.label}</option>)}
              </select>
            </label>
            <button className="btn primary lg" onClick={submitLesson} disabled={!lessonDraft.title.trim() || !lessonDraft.summary.trim()}>сохранить заметку</button>
          </section>
        </div>
      )}
    </div>
  );
}

// ─── Screen: LESSON ──────────────────────────────────────────────────
const LESSON_GUIDES = {
  beginner: {
    context: "Эта тема закрывает базовый словарь PM: без неё сложно звучать уверенно на product sense и behavioral-интервью.",
    steps: ["Сформулируй простое определение одним предложением", "Покажи, где это встречается в работе PM", "Назови, какое решение помогает принять тема", "Заверши примером из продукта или команды"],
    example: "На примере образовательного приложения PM сначала уточняет, какую проблему решает пользователь, затем выбирает сегмент и только после этого предлагает изменение в продукте.",
    mistakes: [
      { t: "Путать роль и артефакт", d: "Например, говорить только про backlog, хотя задача PM шире: ценность, пользователь и бизнес-результат." },
      { t: "Сразу прыгать в фичи", d: "Для новичка это главный риск: фича звучит активно, но без проблемы и метрики она не доказывает reasoning." },
      { t: "Не назвать владельца решения", d: "Интервьюер должен услышать, какую часть решения берёт на себя PM, а где подключает команду." },
    ],
    checklist: ["Я могу объяснить тему простым языком", "Я знаю, зачем она нужна PM", "Я могу привести пример из продукта", "Я называю метрику или критерий качества"],
  },
  framework: {
    context: "Фреймворк нужен не для красивого названия, а чтобы удержать структуру ответа и не потерять важные проверки.",
    steps: ["Назови цель фреймворка", "Разложи шаги в правильном порядке", "Покажи, где можно адаптировать структуру", "Закрой ответ рекомендацией или trade-off"],
    example: "В product design кейсе фреймворк помогает сначала понять пользователя и контекст, затем выбрать проблему, сгенерировать варианты и оценить их по понятным критериям.",
    mistakes: [
      { t: "Механически перечислять шаги", d: "Интервьюеру важна логика выбора, а не заученный список терминов." },
      { t: "Использовать фреймворк не к месту", d: "RICE не заменяет discovery, а CIRCLES не является финансовой моделью." },
      { t: "Не сделать вывод", d: "Фреймворк должен привести к решению: что делаем, почему и как проверяем." },
    ],
    checklist: ["Я понимаю, какую проблему решает фреймворк", "Я могу назвать шаги без заученного тона", "Я умею показать пример", "В конце есть выбор или рекомендация"],
  },
  metrics: {
    context: "Метрики превращают продуктовый разговор из мнений в проверяемые гипотезы: что изменилось, для кого и какой ценой.",
    steps: ["Определи пользовательскую ценность", "Выбери primary metric", "Добавь proxy/input metrics", "Защити качество guardrail-метриками"],
    example: "Для EdTech-продукта одной регистрации мало: сильнее смотреть activation, завершённые уроки, D7 retention и долю пользователей, достигших учебной цели.",
    mistakes: [
      { t: "Выбрать vanity metric", d: "DAU или регистрации могут расти, пока реальная ценность и retention падают." },
      { t: "Забыть guardrails", d: "Primary metric можно улучшить вредным способом: например, поднять CTR кликбейтом и потерять доверие." },
      { t: "Не связать метрику с действием", d: "Хорошая метрика должна подсказать, что команда будет менять завтра." },
    ],
    checklist: ["Есть primary metric", "Есть proxy или input metric", "Есть guardrail", "Я понимаю, какое решение приму по данным"],
  },
  design: {
    context: "Product design темы помогают перейти от абстрактной идеи к конкретному пользовательскому сценарию и качественному решению.",
    steps: ["Выбери primary user", "Опиши job/pain/context", "Найди момент в journey", "Сравни решения по impact, effort и риску"],
    example: "Если пользователь бросает onboarding, PM не добавляет сразу десять подсказок, а ищет момент потери ценности и проверяет более короткий путь к first value.",
    mistakes: [
      { t: "Проектировать для всех", d: "Решение для всех обычно не попадает ни в один конкретный сценарий достаточно хорошо." },
      { t: "Решать симптом", d: "Плохой экран может быть следствием неверного сегмента, неясной ценности или слишком позднего aha-moment." },
      { t: "Не учитывать ограничения", d: "Даже красивая идея должна пройти проверку feasibility, privacy, cost и поддержки." },
    ],
    checklist: ["Назван пользователь", "Названа задача или боль", "Есть сценарий использования", "Решение сравнивается по критериям"],
  },
  behavioral: {
    context: "Behavioral-уроки учат показывать не только результат, но и зрелость: ownership, коммуникацию, работу с конфликтом и выводы.",
    steps: ["Коротко задай ситуацию", "Назови свою задачу и ставку", "Опиши действия от первого лица", "Закрой результатом и выводом"],
    example: "Сильный ответ не звучит как 'мы всё сделали': он показывает личный вклад, влияние на команду и измеримый результат.",
    mistakes: [
      { t: "Спрятаться за 'мы'", d: "Командность важна, но интервьюер оценивает твой вклад и способ мышления." },
      { t: "Уйти в драму", d: "Конфликт нужно описывать через цель, факты и решение, а не через обвинения." },
      { t: "Не назвать урок", d: "Без вывода история выглядит как случайность, а не как рост." },
    ],
    checklist: ["Есть Situation и Task", "Action описан от первого лица", "Result измерим или наблюдаем", "Есть learning на будущее"],
  },
  sysdesign: {
    context: "System design для PM — это язык trade-offs: скорость, стоимость, надёжность, масштабирование и пользовательский опыт.",
    steps: ["Опиши пользовательский сценарий", "Назови системное ограничение", "Объясни trade-off простыми словами", "Предложи метрику качества и guardrail"],
    example: "Если AI-фича медленно отвечает, PM обсуждает latency, cost, fallback, качество ответа и доверие пользователя, не уходя в код реализации.",
    mistakes: [
      { t: "Пытаться быть инженером", d: "PM не обязан писать архитектуру, но должен понимать последствия решений для пользователя и бизнеса." },
      { t: "Игнорировать стоимость", d: "Самое быстрое решение может быть слишком дорогим или нестабильным при росте нагрузки." },
      { t: "Не назвать fallback", d: "Для технических систем важно объяснить, что увидит пользователь при ошибке или задержке." },
    ],
    checklist: ["Есть пользовательский сценарий", "Назван trade-off", "Есть метрика качества", "Есть fallback или риск"],
  },
};

const getLessonGuide = (note) => {
  const guide = LESSON_GUIDES[note.cat] || LESSON_GUIDES.beginner;
  const categorySignals = {
    beginner: {
      signal: "Интервьюер должен услышать, что студент отличает роль PM от исполнителя задач: начинает с пользователя и бизнеса, а заканчивает решением и метрикой.",
      metric: "Критерий качества ответа: есть пользователь, проблема, действие PM, бизнес-эффект и граница ответственности.",
      drill: "Возьми любой продукт, например Spotify или Duolingo, и объясни тему через одну конкретную пользовательскую ситуацию.",
    },
    framework: {
      signal: "Сильный ответ показывает, зачем выбран фреймворк, где его границы и к какому решению он приводит.",
      metric: "Критерий качества ответа: фреймворк не висит в воздухе, а помогает сравнить варианты, выбрать приоритет или сформулировать next step.",
      drill: "Примени фреймворк к кейсу «улучшить onboarding в B2C-приложении» и назови итоговый выбор.",
    },
    metrics: {
      signal: "Сильный ответ связывает метрику с пользовательской ценностью, продуктовым рычагом и guardrail, который нельзя ухудшить.",
      metric: "Критерий качества ответа: primary metric + input/proxy metric + guardrail + решение, которое команда примет по данным.",
      drill: "Построй мини-дерево метрик для EdTech-продукта: activation, completion, retention, revenue и guardrails.",
    },
    design: {
      signal: "Сильный ответ начинает с primary user и сценария, а не с красивой фичи.",
      metric: "Критерий качества ответа: выбран сегмент, описан job/pain/context, сравниваются 2-3 решения и назван риск.",
      drill: "Разбери один экран продукта: кто пользователь, что он пытается сделать, где friction и какой эксперимент проверит решение.",
    },
    behavioral: {
      signal: "Сильный ответ показывает зрелость: ownership, влияние без власти, факты, результат и урок на будущее.",
      metric: "Критерий качества ответа: Situation короткая, Action от первого лица, Result наблюдаемый или измеримый, learning конкретный.",
      drill: "Подготовь STAR-историю на 90 секунд: конфликт, ошибка или влияние без формальной власти.",
    },
    sysdesign: {
      signal: "Сильный ответ переводит технический выбор в пользовательский и бизнес trade-off.",
      metric: "Критерий качества ответа: сценарий, ограничение, trade-off, fallback, метрика качества и cost/risk guardrail.",
      drill: "Разбери AI-фичу: latency, качество ответа, hallucination, стоимость, trust и fallback для пользователя.",
    },
  };
  const signals = categorySignals[note.cat] || categorySignals.beginner;
  return {
    ...guide,
    ...signals,
    steps: [
      note.hints?.[0] || guide.steps[0],
      note.hints?.[1] || guide.steps[1],
      note.hints?.[2] || guide.steps[2],
      guide.steps[3],
    ],
  };
};

const LESSON_WHAT_TEMPLATES = {
  beginner: {
    practice: (note) => `${note.t} помогает собрать базовую PM-логику: кто пользователь, какая у него задача, почему это важно бизнесу и какое решение команда выбирает дальше.`,
    pmValue: "PM использует эту тему, чтобы не спорить мнениями, а связать пользователя, проблему, решение, метрику и ограничения команды.",
    interviewUse: (note) => `На интервью это звучит как короткий разбор: сначала объяснение простыми словами, затем пример из продукта, затем ответ на вопрос «${note.rookie}».`,
    trap: "Слабый ответ остаётся на уровне определения. Сильный показывает, какое решение PM примет иначе после применения темы.",
  },
  framework: {
    practice: (note) => `${note.t} — это рабочая структура мышления. Она помогает не потерять важные проверки и превратить хаотичный brainstorm в понятный путь к решению.`,
    pmValue: "PM берёт фреймворк, когда нужно сравнить варианты, договориться о критериях, объяснить trade-off и дойти до рекомендации.",
    interviewUse: (note) => `На интервью важно не просто назвать шаги. Нужно показать, как ${note.t} помогает пройти от контекста к выбору и next step.`,
    trap: "Главная ловушка — звучать как учебник: перечислить аббревиатуру, но не применить её к пользователю, данным и решению.",
  },
  metrics: {
    practice: (note) => `${note.t} переводит продуктовый разговор в измеримую систему: что считаем ценностью, какой рычаг двигаем и какую метрику нельзя ухудшить.`,
    pmValue: "PM использует метрики, чтобы диагностировать проблему, выбрать приоритет, проверить гипотезу и понять, стал ли продукт реально лучше.",
    interviewUse: (note) => `В кейсе по метрикам сильный ответ объясняет смысл показателя, источник данных, primary/proxy/input-метрики и guardrails.`,
    trap: "Слабый ответ выбирает красивую vanity metric. Сильный связывает метрику с поведением пользователя и действием команды.",
  },
  design: {
    practice: (note) => `${note.t} помогает спроектировать решение не «для всех», а для конкретного пользователя, сценария, боли и момента в journey.`,
    pmValue: "PM применяет эту тему, чтобы сузить фокус, понять friction, сравнить решения и выбрать вариант с лучшим impact при разумном effort.",
    interviewUse: (note) => `На product design интервью это раскрывается через primary user, job, pain point, несколько решений, критерии выбора и риск.`,
    trap: "Главная ошибка — сразу придумывать фичи. Сначала нужно доказать проблему и объяснить, почему выбранный сценарий важнее других.",
  },
  behavioral: {
    practice: (note) => `${note.t} нужен, чтобы behavioral-ответ показывал зрелость кандидата: контекст, личную ответственность, действие, результат и вывод.`,
    pmValue: "PM постоянно работает через коммуникацию, влияние без власти и конфликт интересов; поэтому интервьюер проверяет не только знания, но и способ поведения.",
    interviewUse: (note) => `Сильный ответ строится как история: Situation, Task, Action, Result, а затем короткий learning на будущее.`,
    trap: "Слабый ответ уходит в пересказ событий или обвинения. Сильный показывает личный вклад, факты и изменение результата.",
  },
  sysdesign: {
    practice: (note) => `${note.t} помогает PM говорить о технических решениях через пользовательский опыт, стоимость, надёжность и риски.`,
    pmValue: "PM не обязан проектировать архитектуру, но должен понимать trade-offs: latency, масштабирование, стоимость, качество, fallback и влияние на доверие.",
    interviewUse: (note) => `На интервью это звучит как продуктовый system design: сценарий пользователя, ограничение, компромисс, метрика качества и guardrail.`,
    trap: "Слабый ответ пытается выглядеть инженером. Сильный переводит технический выбор в последствия для пользователя и бизнеса.",
  },
};

const getLessonWhat = (note, guide) => {
  const template = LESSON_WHAT_TEMPLATES[note.cat] || LESSON_WHAT_TEMPLATES.beginner;
  return {
    definition: note.ex,
    practice: template.practice(note),
    pmValue: template.pmValue,
    interviewUse: template.interviewUse(note),
    trap: template.trap,
    answerFormula: [
      `1. Объясни: ${note.ex}`,
      `2. Примени: ${guide.steps[0]}.`,
      `3. Проверь: ${guide.metric}`,
    ],
  };
};

function ModelAnswer({ text }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="lesson-callout pink" style={{ marginTop: 12, flexDirection: "column", alignItems: "stretch" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
        <h4 style={{ margin: 0 }}>Эталон ответа</h4>
        <button className="btn ghost sm" onClick={() => setOpen((v) => !v)}>{open ? "скрыть" : "сначала ответь сам(а) → показать"}</button>
      </div>
      {open && <p style={{ margin: "10px 0 0", lineHeight: 1.55 }}>{text}</p>}
    </div>
  );
}

function LessonScreen({ go, progress, clock, completeTask, initialTopicId = "nsm", notes = KNOWLEDGE_NOTES }) {
  const [idx, setIdx] = useState(0);
  const note = notes.find((item) => item.id === initialTopicId) || notes[1] || notes[0];
  const guide = getLessonGuide(note);
  const what = getLessonWhat(note, guide);
  const rich = TOPIC_CONTENT[note.id] || {};
  const mistakes = rich.mistakes || guide.mistakes;
  useEffect(() => setIdx(0), [initialTopicId]);
  const slides = [
    { tag: "Слайд 1 · 5 мин", title: `Что такое ${note.t}?`, lede: what.definition,
      body: (
        <div className="body lesson-what">
          <div className="lesson-what-lede">
            <b>Коротко</b>
            <p>{what.definition}</p>
          </div>
          <div className="lesson-what-grid">
            <article>
              <span>01</span>
              <b>Что это на практике</b>
              <p>{what.practice}</p>
            </article>
            <article>
              <span>02</span>
              <b>Зачем это PM</b>
              <p>{what.pmValue}</p>
            </article>
            <article>
              <span>03</span>
              <b>Как использовать на интервью</b>
              <p>{what.interviewUse}</p>
            </article>
            <article>
              <span>04</span>
              <b>Где ловушка</b>
              <p>{what.trap}</p>
            </article>
          </div>
          <div className="lesson-answer-formula">
            {what.answerFormula.map((item) => <p key={item}>{item}</p>)}
          </div>
          <div className="lesson-callout">
            <div className="ico">★</div>
            <div>
              <h4>Главное правило</h4>
              <p>{guide.steps[0]}. На интервью важно не назвать термин, а показать, как он помогает принять продуктовое решение.</p>
            </div>
          </div>
        </div>) },
    { tag: "Слайд 2 · 3 мин", title: "Как применять пошагово", lede: "Используй тему как рабочий инструмент, а не как заученный термин.",
      body: (
        <div className="body">
          <div className="lesson-step-grid">
            {guide.steps.map((step, i) => (
              <div key={step} className="lesson-step-card">
                <span>{i + 1}</span>
                <p>{step}</p>
              </div>
            ))}
          </div>
          <div className="lesson-callout mint">
            <div className="ico">⚡</div>
            <div>
              <h4>На собесе</h4>
              <p>Сначала проговори контекст, затем логику выбора, затем пример и способ проверки. Так ответ звучит как мышление PM, а не как пересказ учебника.</p>
            </div>
          </div>
        </div>) },
    { tag: "Слайд 3 · 3 мин", title: "Пример сильного ответа", lede: "Формула: тезис → пример → критерий проверки.",
      body: (
        <div className="body">
          <p>{guide.example}</p>
          <div className="faang-cards">
            <div className="faang-card spotify">
              <div className="name">Тезис</div>
              <div className="metric">{note.t}</div>
              <p style={{ fontSize: 13, margin: "8px 0 0", color: "var(--ph-ink-2)" }}>Я бы применил(а) это, чтобы не спорить вкусовщиной, а сравнить варианты по критериям.</p>
            </div>
            <div className="faang-card airbnb">
              <div className="name">Пример</div>
              <div className="metric">реальный продукт</div>
              <p style={{ fontSize: 13, margin: "8px 0 0", color: "var(--ph-ink-2)" }}>{guide.example}</p>
            </div>
            <div className="faang-card facebook">
              <div className="name">Проверка</div>
              <div className="metric">метрика</div>
              <p style={{ fontSize: 13, margin: "8px 0 0", color: "var(--ph-ink-2)" }}>{note.hints[2] || "Назови метрику и guardrail."}</p>
            </div>
          </div>
        </div>) },
    { tag: "Слайд 4 · 3 мин", title: "Как понять, что ответ сильный", lede: "Проверяй тему не по памяти, а по качеству продуктового reasoning.",
      body: (
        <div className="body">
          <div className="lesson-signal-card">
            <b>Сигнал для интервьюера</b>
            <p>{guide.signal}</p>
          </div>
          <div className="lesson-proof-grid">
            <div>
              <span>01</span>
              <b>Что доказываем</b>
              <p>{note.ex}</p>
            </div>
            <div>
              <span>02</span>
              <b>Как проверяем</b>
              <p>{guide.metric}</p>
            </div>
            <div>
              <span>03</span>
              <b>Что решаем</b>
              <p>Какой сегмент, проблему, метрику, эксперимент или trade-off выбирает PM после применения темы.</p>
            </div>
          </div>
        </div>) },
    { tag: "Слайд 5 · 2 мин", title: "Анти-паттерны — чего избегать", lede: "За эти ответы на интервью снимут баллы.",
      body: (
        <div className="body">
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {mistakes.map((a) => (
              <div key={a.t} className="anti-pattern">
                <div className="x">✕</div>
                <div>
                  <b>{a.t}</b>
                  <p style={{ margin: "2px 0 0", fontSize: 14, color: "var(--ph-ink-2)" }}>{a.d}</p>
                </div>
              </div>
            ))}
          </div>
        </div>) },
    { tag: "Слайд 6 · 3 мин", title: "Мини-кейс для закрепления", lede: "Собери ответ как на интервью: контекст → решение → проверка.",
      body: (
        <div className="body">
          <div className="lesson-callout mint">
            <div className="ico">▶</div>
            <div>
              <h4>Задание</h4>
              <p>{rich.miniCase || guide.drill}</p>
            </div>
          </div>
          <div className="lesson-answer-frame">
            {[
              ["Контекст", "Для какого пользователя и в какой ситуации эта тема важна?"],
              ["Проблема", "Какая боль, риск или неопределённость мешает принять решение?"],
              ["Действие PM", "Какой шаг, фреймворк, метрика или эксперимент выбирается?"],
              ["Проверка", "Как команда поймёт, что решение сработало и не навредило guardrails?"],
            ].map(([label, text]) => (
              <div key={label}>
                <b>{label}</b>
                <p>{text}</p>
              </div>
            ))}
          </div>
          {rich.modelAnswer && <ModelAnswer text={rich.modelAnswer} />}
        </div>) },
    { tag: "Слайд 7 · 2 мин", title: "Финальный чеклист", lede: "Перед Check быстро проверь, что можешь объяснить тему вслух.",
      body: (
        <div className="body">
          <div className="lesson-checklist">
            {guide.checklist.map((item) => (
              <div key={item} className="lesson-check-item">
                <span>✓</span>
                <p>{item}</p>
              </div>
            ))}
          </div>
          <div className="lesson-callout pink">
            <div className="ico">?</div>
            <div>
              <h4>Мини-задание</h4>
              <p>Сформулируй ответ на вопрос стажёра: «{note.rookie}» Используй 3 части: объяснение, пример, критерий проверки.</p>
            </div>
          </div>
        </div>) },
  ];
  const s = slides[idx];
  return (
    <div className="screen">
      <Topbar crumbs={["Home", "Уроки", note.t]} progress={progress} clock={clock} />
      <div className="screen-head">
        <div>
          <span className="eyebrow">Урок · 13 мин · +30 XP</span>
          <h1>{note.t}</h1>
        </div>
        <div className="right" style={{ minWidth: 280 }}>
          <div className="progress-pills" style={{ flex: 1 }}>
            {slides.map((_, i) => <div key={i} className={`pp ${i < idx ? "done" : ""} ${i === idx ? "now" : ""}`} />)}
          </div>
          <button className="btn ghost sm" onClick={() => go("library")}>× выйти</button>
        </div>
      </div>
      <div className="lesson-stage">
        <div className="lesson-card">
          {note.isCustom && (
            <div className="lesson-callout" style={{ marginBottom: 12, background: "var(--ph-sky-2)" }}>
              <div className="ico">✎</div>
              <div><h4>Твоя заметка</h4><p>Это тема, которую ты добавил(а) сам(а). Слайды ниже — общий шаблон-подсказка; твой текст: «{note.ex}»</p></div>
            </div>
          )}
          <span className="slide-tag">{s.tag}</span>
          <h2>{s.title}</h2>
          <p className="lede">{s.lede}</p>
          {s.body}
          <div className="lesson-nav">
            <button className="btn ghost" disabled={idx === 0} onClick={() => setIdx(idx - 1)}>{Icon.back} назад</button>
            <div style={{ display: "flex", gap: 10 }}>
              {idx < slides.length - 1 ? (
                <button className="btn primary lg" onClick={() => setIdx(idx + 1)}>далее {Icon.chev}</button>
              ) : (
                <button className="btn primary lg" onClick={() => { completeTask(`lesson-${note.id}`, 30, "check"); go("check", { checkTopicId: note.id }); }}>к проверке {Icon.chev}</button>
              )}
            </div>
          </div>
        </div>
        <aside className="lesson-rail">
          {slides.map((sl, i) => (
            <div key={i} className={`slide-thumb ${i === idx ? "active" : ""} ${i < idx ? "done" : ""}`} onClick={() => setIdx(i)}>
              <div className="n">{i < idx ? "✓" : i + 1}</div>
              <div>
                <b>{["Что","Шаги","Пример","Сигнал","Ошибки","Кейс","Чеклист"][i]}</b>
                <i>{sl.tag.split(" · ")[1]}</i>
              </div>
            </div>
          ))}
          <div className="lesson-callout pink" style={{ marginTop: 8 }}>
            <div className="ico">★</div>
            <div>
              <h4>Что дальше</h4>
              <p>После урока — Check, потом короткий кейс на этом же концепте.</p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

// ─── Screen: CHECK / MCQ ─────────────────────────────────────────────
function CheckScreen({ go, progress, clock, completeTask, updateProgress, initialTopicId = "nsm" }) {
  const [idx, setIdx] = useState(0);
  const [topicId, setTopicId] = useState(initialTopicId);
  const [batchSeed, setBatchSeed] = useState(0);
  const [picked, setPicked] = useState(null);
  const [showExplain, setShowExplain] = useState(false);
  const [whyTarget, setWhyTarget] = useState(null);
  const [correctCount, setCorrectCount] = useState(0);
  const topics = KNOWLEDGE_NOTES.map((note) => ({
    id: note.id,
    label: note.t.replace(" — как выбрать", ""),
    solved: progress.checkStats?.[note.id] || 0,
    note,
  }));
  const topicBanks = {
    nsm: [
      ["Какая NSM лучше для Spotify?", "Время прослушивания на активного слушателя", "Доход с подписок", "DAU", "Количество лайков", "NSM должна отражать реализованную ценность, а не vanity-активность или деньги."],
      ["Что НЕ подходит как NSM для Airbnb?", "DAU приложения", "Забронированные ночи", "Завершённые поездки", "GMV", "Для marketplace NSM обычно привязана к реальной транзакции двух сторон."],
      ["Как объяснить NSM на интервью?", "Leading indicator долгосрочной ценности", "Любая главная KPI бизнеса", "То же самое, что revenue", "Самая лёгкая метрика для команды", "Сильный ответ связывает value, retention и будущую выручку."],
    ],
    aarrr: [
      ["Где находится activation в AARRR?", "После acquisition, до retention", "После revenue", "До acquisition", "Это то же самое, что referral", "Activation показывает первый момент полученной ценности."],
      ["Какая метрика ближе всего к retention?", "Доля пользователей, вернувшихся через 7 дней", "CTR рекламы", "CAC", "Количество регистраций", "Retention проверяет повторное использование, а не привлечение."],
      ["Что делать, если revenue растёт, а retention падает?", "Проверить качество монетизации и долгосрочную ценность", "Только поднять цены", "Увеличить acquisition любой ценой", "Считать продукт успешным", "Revenue может быть lagging indicator и скрывать churn."],
    ],
    rice: [
      ["Что означает C в RICE?", "Confidence", "Cost", "Conversion", "Customer", "Confidence снижает вес идеи, если оценка ненадёжна."],
      ["Какая идея получит больший RICE score?", "Высокий reach и impact при низком effort", "Высокий effort без confidence", "Низкий reach и высокий effort", "Идея, которая нравится CEO", "RICE дисциплинирует сравнение идей через reach, impact, confidence, effort."],
      ["Главная ошибка в RICE?", "Подставить красивые числа без evidence", "Считать effort", "Сравнивать несколько идей", "Указывать confidence", "RICE полезен только настолько, насколько честны оценки."],
    ],
    jtbd: [
      ["Что такое JTBD?", "Прогресс, которого пользователь хочет добиться в ситуации", "Должностная инструкция пользователя", "Список фичей", "Сегмент по возрасту", "JTBD описывает мотивацию и контекст, а не демографию."],
      ["Сильная формулировка pain point?", "Когда я выбираю курс, боюсь ошибиться и потерять месяц", "Пользователи хотят красивый UI", "Нужна кнопка рекомендаций", "Все хотят дешевле", "Pain point должен быть конкретной проблемой пользователя."],
      ["Зачем JTBD в product design case?", "Чтобы выбрать primary user и строить решения под настоящую задачу", "Чтобы быстрее назвать 10 фичей", "Чтобы избежать метрик", "Чтобы доказать, что рынок большой", "JTBD удерживает ответ от feature brainstorm без причины."],
    ],
  };
  const makeQuestion = (row, n) => {
    const [q, right, a, b, c, explain] = row;
    const opts = [
      { l: "A", t: right, right: true, why: explain },
      { l: "B", t: a, right: false, why: "Звучит похоже, но не отвечает на ключевую логику темы." },
      { l: "C", t: b, right: false, why: "Это типичная ловушка: метрика или формулировка слишком поверхностная." },
      { l: "D", t: c, right: false, why: "Такой ответ обычно не показывает продуктового reasoning." },
    ];
    const shift = n % opts.length;
    return { q, opts: [...opts.slice(shift), ...opts.slice(0, shift)].map((o, i) => ({ ...o, l: "ABCD"[i] })), explain };
  };
  const makeFallbackBank = (note) => ([
    [`Что главное в теме «${note.t}»?`, note.ex, "Запомнить только название темы", "Использовать только на behavioral", "Всегда выбирать самую быструю фичу", `Сильный ответ объясняет смысл темы: ${note.ex}`],
    [`Как применить «${note.t}» на PM-интервью?`, "Сначала объяснить логику, затем дать пример и метрику", "Сразу перечислить 10 фичей", "Сказать «зависит» без критериев", "Уйти в технические детали без продуктовой цели", "Интервьюер ждёт структуру, пример и связь с решением."],
    [`Какая типичная ошибка в теме «${note.t}»?`, "Не связать концепт с пользовательской ценностью или метрикой", "Задать уточняющий вопрос", "Назвать trade-off", "Проверить гипотезу экспериментом", "Большинство ошибок возникает, когда концепт остаётся абстрактным."],
  ]);
  const questions = Array.from({ length: 5 }, (_, i) => {
    const note = topics.find((t) => t.id === topicId)?.note || KNOWLEDGE_NOTES[0];
    const bank = topicBanks[topicId] || TOPIC_CONTENT[topicId]?.mcq || makeFallbackBank(note);
    return makeQuestion(bank[(i + batchSeed) % bank.length], i + batchSeed);
  });
  const cur = questions[idx];
  const visibleTopics = topics.filter((topic, index) => index < 8 || topic.id === topicId);
  const pick = (i) => {
    setPicked(i);
    setShowExplain(true);
    setWhyTarget(null);
    if (cur.opts[i].right) {
      setCorrectCount((value) => value + 1);
      updateProgress((prev) => ({
        ...prev,
        checkStats: {
          ...(prev.checkStats || {}),
          [topicId]: (prev.checkStats?.[topicId] || 0) + 1,
        },
      }));
    }
  };
  const next = () => {
    if (idx < questions.length - 1) { setIdx(idx + 1); setPicked(null); setShowExplain(false); setWhyTarget(null); }
    else if (correctCount >= 3) {
      completeTask(`check-${topicId}`, 10, "teach", { cardsDue: progress.cardsDue + 1 });
      go("teach", { teachTopicId: topicId });
    } else {
      newBatch();
    }
  };
  const newBatch = () => {
    setBatchSeed((v) => v + 1);
    setIdx(0);
    setPicked(null);
    setShowExplain(false);
    setWhyTarget(null);
    setCorrectCount(0);
  };
  const selectTopic = (id) => {
    setTopicId(id);
    setBatchSeed((v) => v + 1);
    setIdx(0);
    setPicked(null);
    setShowExplain(false);
    setWhyTarget(null);
    setCorrectCount(0);
  };
  useEffect(() => {
    selectTopic(initialTopicId);
  }, [initialTopicId]);
  return (
    <div className="screen" style={{ maxWidth: 880 }}>
      <Topbar crumbs={["Home", "Уроки", "Check"]} progress={progress} clock={clock} />
      <div className="screen-head">
        <div>
          <span className="eyebrow">Check · тема: {topics.find(t => t.id === topicId)?.label}</span>
          <h1>Проверь — усвоил(а)?</h1>
        </div>
        <div className="right" style={{ minWidth: 220 }}>
          <div className="progress-pills" style={{ flex: 1 }}>
            {questions.map((_, i) => <div key={i} className={`pp ${i < idx ? "done" : ""} ${i === idx ? "now" : ""}`} />)}
          </div>
        </div>
      </div>
      <div className="check-topic-row">
        {visibleTopics.map((t) => (
          <button key={t.id} className={`check-topic ${topicId === t.id ? "active" : ""}`} onClick={() => selectTopic(t.id)}>
            <strong>{t.label}</strong>
            <span>решено: {t.solved}</span>
          </button>
        ))}
        <button className="check-topic generate" onClick={newBatch}>
          <strong>+ ещё вопросы</strong>
          <span>новая попытка · нужно 3/5</span>
        </button>
      </div>
      <label className="check-topic-select">
        <span>Все темы</span>
        <select value={topicId} onChange={(event) => selectTopic(event.target.value)}>
          {topics.map((topic) => <option key={topic.id} value={topic.id}>{topic.label}</option>)}
        </select>
      </label>
      <div className="mcq-card">
        <span className="chip pink">Вопрос {idx + 1} из {questions.length}</span>
        <span className="chip mint" style={{ marginLeft: 8 }}>правильно: {correctCount}/3</span>
        <div className="mcq-question">{cur.q}</div>
        <div className="mcq-options">
          {cur.opts.map((o, i) => {
            const isPicked = picked === i;
            const reveal = showExplain;
            return (
              <div key={o.l} className={`mcq-opt ${isPicked ? "picked" : ""} ${reveal && o.right ? "right" : ""} ${reveal && isPicked && !o.right ? "wrong" : ""}`} onClick={() => !showExplain && pick(i)}>
                <div className="letter">{o.l}</div>
                <div>{o.t}</div>
                {reveal && (
                  <button className="why-btn" onClick={(e) => { e.stopPropagation(); setWhyTarget(whyTarget === i ? null : i); }}>
                    {o.right ? "разобрать ✓" : "почему?"}
                  </button>
                )}
              </div>
            );
          })}
        </div>
        {showExplain && whyTarget !== null && (
          <div className="mcq-explain">
            <h5>{cur.opts[whyTarget].right ? "Почему это правильно" : "Почему не подходит"}</h5>
            <p>{cur.opts[whyTarget].why}</p>
          </div>
        )}
        {showExplain && (
          <div className="mcq-explain" style={{ background: "var(--ph-mint-2)", marginTop: 10 }}>
            <h5>Что слышит интервьюер</h5>
            <p>{cur.explain}</p>
          </div>
        )}
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 22 }}>
          <button className="btn ghost" onClick={() => go("library")}>{Icon.back} назад к урокам</button>
          {showExplain ? (
            <button className="btn primary lg" onClick={next}>{idx === questions.length - 1 ? "к практике" : "следующий"} {Icon.chev}</button>
          ) : (
            <button className="btn ghost" disabled>выбери вариант</button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Screen: SRS ─────────────────────────────────────────────────────
function SRSScreen({ go, progress, clock, completeTask }) {
  const [idx, setIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const curatedCards = [
    { q: "CIRCLES — что значит каждая буква?", a: "Comprehend the situation · Identify the user · Report the user's needs · Cut through prioritization · List solutions · Evaluate tradeoffs · Summarize. 7 шагов под любой product-design кейс." },
    { q: "Что такое North Star Metric?", a: "Одна метрика, отражающая реализованную ценность продукта для пользователя. Не выручка, не активность." },
    { q: "AARRR — расшифровать", a: "Acquisition · Activation · Retention · Referral · Revenue. Воронка от первого касания до «платит и рекомендует»." },
    { q: "RICE — формула приоритизации", a: "(Reach × Impact × Confidence) ÷ Effort. Число для сравнения фич." },
    { q: "Что такое aha-moment?", a: "Действие или событие, после которого пользователь понимает ценность продукта. У Facebook — 7 друзей за 10 дней." },
    { q: "STAR-метод — формула", a: "Situation · Task · Action · Result. Action = что сделал лично ты, Result = с цифрами." },
    { q: "MDE в A/B-тесте — что это", a: "Minimum Detectable Effect — минимальный размер эффекта, который тест способен заметить." },
    { q: "Чем product sense ≠ user empathy?", a: "Empathy — про эмоции. Product sense — empathy + интуиция по бизнесу + умение видеть, какая фича сдвинет метрику." },
  ];
  // По одной карточке на каждый урок из базы знаний — чтобы SRS покрывал все темы, а не 8 захардкоженных.
  const lessonCards = KNOWLEDGE_NOTES.map((note) => ({ q: `Объясни простыми словами: ${note.t}`, a: note.ex }));
  const seen = new Set();
  const allCards = [...curatedCards, ...lessonCards].filter((card) => {
    if (seen.has(card.q)) return false;
    seen.add(card.q);
    return true;
  });
  const cards = allCards.slice(0, Math.min(allCards.length, progress.cardsDue));
  const c = cards[idx];
  if (!c) {
    return (
      <div className="screen">
        <Topbar crumbs={["Home", "SRS · карточки"]} progress={progress} clock={clock} />
        <div className="score-hero">
          <span className="eyebrow">Spaced repetition</span>
          <h1>Пока нечего повторять</h1>
          <p>Карточки появятся после Check и практики по урокам. Начни с первой базовой темы.</p>
          <button className="btn primary lg" onClick={() => go("lesson", { lessonTopicId: "pm-role-101" })}>к первому уроку →</button>
        </div>
      </div>
    );
  }
  return (
    <div className="screen">
      <Topbar crumbs={["Home", "SRS · карточки"]} progress={progress} clock={clock} />
      <div className="screen-head">
        <div>
          <span className="eyebrow">Повторение · термины и фреймворки</span>
          <h1>{cards.length} карточек на сегодня</h1>
        </div>
        <div className="right">
          <span className="chip mint">в сессии: {cards.length}</span>
          <span className="chip sun">~6 мин</span>
        </div>
      </div>
      <div className="notice" style={{ marginBottom: 14 }}>
        Упрощённое повторение: проходим все карточки сессии за один заход. Интервалы на кнопках — ориентир, по которому стоит вернуться к теме (полноценный SRS-график пока не реализован).
      </div>
      <div className="srs-stage">
        <div className="srs-flash" onClick={() => setFlipped(!flipped)} style={{ cursor: "pointer" }}>
          <span className="tag chip pink">Фреймворк · термин</span>
          <span className="count mono">{idx + 1} / {cards.length}</span>
          {!flipped ? (
            <>
              <h2>{c.q}</h2>
              <div className="srs-flip">[ Spacebar или клик ] чтобы перевернуть</div>
            </>
          ) : (
            <>
              <div className="eyebrow">Ответ</div>
              <div className="answer">{c.a}</div>
              <div className="srs-flip">оцени, как помнил(а)</div>
            </>
          )}
        </div>
        {flipped && (
          <div className="srs-buttons">
            {[
              { k: "again", l: "Снова", t: "10 мин" },
              { k: "hard", l: "Тяжело", t: "45 мин" },
              { k: "good", l: "Нормально", t: "1 день" },
              { k: "easy", l: "Легко", t: "4 дня" },
            ].map(b => (
              <div key={b.k} className={`sb ${b.k}`} onClick={() => {
                setFlipped(false);
                if (idx < cards.length - 1) setIdx(idx + 1);
                else completeTask("srs-today", 40, "home", { cardsDue: 0 });
              }}>
                <div className="l">{b.l}</div>
                <div className="t">{b.t}</div>
              </div>
            ))}
          </div>
        )}
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <button className="btn ghost" onClick={() => go("home")}>{Icon.back} закрыть</button>
          {!flipped && <button className="btn ghost" onClick={() => setFlipped(true)}>показать ответ →</button>}
        </div>
      </div>
    </div>
  );
}

// ─── Screen: CASE ────────────────────────────────────────────────────
// Лёгкий рендер кейс-условия: убираем markdown-мусор (**жирный**, ---, лишние пустые строки)
// и подсвечиваем строки-заголовки вида «Компания:», «Данные:».
function renderCaseBrief(raw = "") {
  const clean = raw
    .replace(/\*\*/g, "")
    .replace(/^#{1,6}\s*/gm, "")
    .replace(/^-{3,}$/gm, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  return clean.split("\n").map((line, i) => {
    const t = line.trim();
    if (!t) return <div key={i} style={{ height: 8 }} />;
    const m = t.match(/^([A-Za-zА-Яа-я ёЁ/]{3,40}):\s*(.*)$/);
    if (m) {
      return (
        <p key={i} style={{ margin: "0 0 6px" }}>
          <b>{m[1]}:</b>{m[2] ? ` ${m[2]}` : ""}
        </p>
      );
    }
    return <p key={i} style={{ margin: "0 0 6px" }}>{t}</p>;
  });
}

function CaseScreen({ go, progress, clock, completeTask }) {
  const [step, setStep] = useState(0);
  const [text, setText] = useState("");
  const [answers, setAnswers] = useState({});
  const [evaluation, setEvaluation] = useState("");
  const [evaluating, setEvaluating] = useState(false);
  const [savedNotice, setSavedNotice] = useState("");
  const [showHint, setShowHint] = useState(false);
  const [briefOpen, setBriefOpen] = useState(true);
  const [showSaved, setShowSaved] = useState(false);
  const [savedCases, setSavedCases] = useState(() => {
    try { return JSON.parse(localStorage.getItem("pmquest-saved-cases-v1") || "[]"); } catch { return []; }
  });
  const caseSuggestions = [
    {
      id: "spotify-likes",
      label: "Spotify · лайки",
      theme: "Music streaming / Entertainment",
      trackId: "product",
      interviewType: "product_design",
      prompt: "Spotify хочет добавить лайки песен в плейлистах. Сфокусируй кейс на activation, retention, discovery и выборе метрик.",
    },
    {
      id: "marketplace-retention",
      label: "Маркетплейс · retention",
      theme: "E-commerce / Маркетплейсы",
      trackId: "product",
      interviewType: "product_growth",
      prompt: "Маркетплейс видит падение повторных покупок у новых пользователей. Нужен PM case про диагностику воронки, сегменты, гипотезы роста и эксперименты.",
    },
    {
      id: "fintech-onboarding",
      label: "Fintech · onboarding",
      theme: "Fintech / Банки",
      trackId: "product",
      interviewType: "product_execution",
      prompt: "Финтех-приложение теряет пользователей на KYC/onboarding. Сгенерируй кейс с данными по funnel, ограничениями compliance и выбором решения.",
    },
    {
      id: "edtech-monetization",
      label: "EdTech · monetization",
      theme: "EdTech / Образование",
      trackId: "product",
      interviewType: "product_strategy",
      prompt: "EdTech хочет поднять trial-to-paid conversion без ухудшения learning outcomes. Нужен кейс про сегменты, pricing/paywall, retention и guardrail metrics.",
    },
    {
      id: "consulting-profit",
      label: "Банк · прибыльность",
      theme: "Fintech / Банки",
      trackId: "business",
      interviewType: "",
      prompt: "Цифровой банк растёт по клиентам, но прибыльность падает. Сгенерируй consulting case с экономикой, CAC, cross-sell, cost-to-serve и decision question.",
    },
  ];
  const fallbackCaseText = `Компания: Spotify.

Контекст: команда хочет добавить «лайки» песен прямо внутри плейлистов. Сейчас пользователи часто слушают curated-плейлисты, но редко сохраняют отдельные треки, а retention новых слушателей после 30 дней ниже целевого.

Данные: 42% новых пользователей слушают хотя бы один плейлист в первую неделю; только 9% сохраняют трек; пользователи, которые сохраняют 3+ трека, имеют на 28% выше D30 retention.

Вопрос: стоит ли запускать лайки в плейлистах, для какого сегмента и какими метриками проверять успех?`;
  const [selectedSuggestion, setSelectedSuggestion] = useState(caseSuggestions[0]);
  const [difficulty, setDifficulty] = useState("Средний");
  const [customTopic, setCustomTopic] = useState("");
  const [caseTitle, setCaseTitle] = useState("Spotify — фича лайков");
  const [caseText, setCaseText] = useState(fallbackCaseText);
  const [genBusy, setGenBusy] = useState(false);
  const [genErr, setGenErr] = useState("");
  // Шаги нейтральны к конкретному кейсу: подходят и под Spotify, и под маркетплейс, и под банк.
  const steps = [
    { n: "1", title: "Clarifying questions", desc: "уточни цели и контекст", prompt: "Что уточнишь у интервьюера перед решением этого кейса?", placeholder: "1. Какая главная цель и метрика успеха?\n2. Какой сегмент / рынок в фокусе?\n3. Какие ограничения по срокам, бюджету, регуляторике?", hint: "Сильные кандидаты тратят ~30% времени на clarify + понимание пользователя, прежде чем предлагать решения." },
    { n: "2", title: "User & pain points", desc: "выбери сегмент, опиши боли", prompt: "Кто приоритетный пользователь в этом кейсе и какую его боль решаем?", placeholder: "Сегмент: …\nЗадача (JTBD): …\nБоли: …", hint: "Не «все пользователи». Выбери один сегмент по задаче/поведению и объясни, почему он важен бизнесу." },
    { n: "3", title: "Solutions", desc: "3-5 идей под боль", prompt: "Предложи 3-5 решений под выбранную боль. Один — смелый, один — минимальный (MVP).", placeholder: "1. …\n2. …\n3. …", hint: "Сначала покажи диапазон идей, потом выбирай. Каждое решение должно бить в названную боль, а не быть «фичей ради фичи»." },
    { n: "4", title: "Priorities & trade-offs", desc: "приоритизируй с обоснованием", prompt: "Что выберешь для V1 и почему? Какие trade-offs?", placeholder: "Выбираю …, потому что …\nTrade-off: …\nЧем жертвуем: …", hint: "Привяжи выбор к цели и критериям (impact / effort / риск), а не к тому, что «нравится»." },
    { n: "5", title: "Metrics & success", desc: "как поймёшь, что сработало", prompt: "Какими метриками измеришь успех? Что нельзя уронить (guardrails)?", placeholder: "Primary metric: …\nProxy / leading: …\nGuardrails: …", hint: "Нужны primary + proxy + guardrail и решение, которое команда примет по данным." },
  ];
  const cur = steps[step];
  const saveCurrentAnswer = () => {
    const clean = text.trim();
    if (clean) setAnswers((prev) => ({ ...prev, [cur.title]: clean }));
    return clean;
  };
  const goToStep = (nextStep) => {
    const clean = saveCurrentAnswer();
    const collected = { ...answers, ...(clean ? { [cur.title]: clean } : {}) };
    setStep(nextStep);
    setText(collected[steps[nextStep].title] || "");
    setShowHint(false);
  };
  const finishCase = async () => {
    const clean = saveCurrentAnswer();
    const collected = { ...answers, ...(clean ? { [cur.title]: clean } : {}) };
    if (Object.keys(collected).length < steps.length) return;
    setEvaluating(true);
    try {
      const res = await api.evaluate({ caseText, answers: collected, trackId: selectedSuggestion.trackId });
      setEvaluation(res.evaluation);
      completeTask(`case-${selectedSuggestion.id}`, 60, "case", { cases: progress.cases + 1 });
    } catch (e) {
      setEvaluation(`Не удалось собрать AI-разбор: ${e.message}`);
    } finally {
      setEvaluating(false);
    }
  };
  const readSaved = () => {
    try { return JSON.parse(localStorage.getItem("pmquest-saved-cases-v1") || "[]"); } catch { return []; }
  };
  const saveCase = () => {
    const saved = readSaved();
    const next = [
      {
        id: `${selectedSuggestion.id}-${Date.now()}`,
        title: caseTitle,
        caseText,
        step: cur.title,
        draft: text,
        savedAt: new Date().toISOString(),
      },
      ...saved,
    ].slice(0, 12);
    localStorage.setItem("pmquest-saved-cases-v1", JSON.stringify(next));
    setSavedCases(next);
    setSavedNotice("сохранено");
    window.setTimeout(() => setSavedNotice(""), 1800);
  };
  const openSavedCase = (item) => {
    setCaseText(item.caseText || "");
    setCaseTitle(item.title || "Сохранённый кейс");
    setStep(0);
    setText(item.draft || "");
    setAnswers({});
    setEvaluation("");
    setShowSaved(false);
    setBriefOpen(true);
  };
  const deleteSavedCase = (id) => {
    const next = readSaved().filter((c) => c.id !== id);
    localStorage.setItem("pmquest-saved-cases-v1", JSON.stringify(next));
    setSavedCases(next);
  };
  const generateCase = async (suggestion = selectedSuggestion) => {
    setGenBusy(true);
    setGenErr("");
    setSelectedSuggestion(suggestion);
    try {
      const extraContext = customTopic.trim()
        ? `${suggestion.prompt}\n\nСвоя тематика пользователя: ${customTopic.trim()}`
        : suggestion.prompt;
      const res = await api.generate({
        industry: suggestion.theme,
        difficulty,
        extraContext,
        trackId: suggestion.trackId,
        interviewType: suggestion.interviewType || undefined,
        grade: "middle",
      });
      setCaseText(res.caseText || fallbackCaseText);
      setCaseTitle(customTopic.trim() || suggestion.label);
      setStep(0);
      setText("");
      setAnswers({});
      setEvaluation("");
      setShowHint(false);
    } catch (e) {
      setGenErr(`Не удалось сгенерировать кейс (${e.message}). Показан пример-заглушка — нажми «сгенерировать» ещё раз.`);
    } finally {
      setGenBusy(false);
    }
  };

  return (
    <div className="screen">
      <Topbar crumbs={["Home", "Кейс", caseTitle]} progress={progress} clock={clock} />
      <div className="screen-head">
        <div>
          <span className="eyebrow">Кейс · ~15 мин · +60 XP · {selectedSuggestion.trackId === "business" ? "consulting / business" : "product"} · {difficulty}</span>
          <h1>{caseTitle}</h1>
        </div>
        <div className="right">
          <span className="chip sun">{selectedSuggestion.trackId === "business" ? "business case" : "product case"}</span>
          <button className="btn ghost sm" onClick={saveCase}>{savedNotice || "сохранить"}</button>
          <button className="btn ghost sm" onClick={() => go("home")}>× выйти</button>
        </div>
      </div>
      <section className="case-generator">
        <div className="case-generator-head">
          <div>
            <span className="eyebrow">AI генератор кейсов</span>
            <h2>Сгенерируй свой кейс по тематике</h2>
          </div>
          <div className="case-generator-controls">
            <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
              <option>Начальный</option>
              <option>Средний</option>
              <option>Сложный</option>
            </select>
            <button className="btn primary" onClick={() => generateCase()} disabled={genBusy}>
              {genBusy ? "генерирую..." : "сгенерировать"}
            </button>
          </div>
        </div>
        <div className="case-suggest-row">
          {caseSuggestions.map((item) => (
            <button
              key={item.id}
              className={`case-suggest ${selectedSuggestion.id === item.id ? "active" : ""}`}
              onClick={() => generateCase(item)}
              disabled={genBusy}
            >
              <strong>{item.label}</strong>
              <span>{item.trackId === "business" ? "business" : item.interviewType.replace("product_", "")}</span>
            </button>
          ))}
        </div>
        <textarea
          className="case-topic-input"
          value={customTopic}
          onChange={(e) => setCustomTopic(e.target.value)}
          placeholder="Своя тематика: например, «AI travel planner для семей», «B2B SaaS churn», «доставка еды: рост среднего чека», «банк теряет прибыльность в premium-сегменте»"
        />
        {genErr && <div className="case-generator-error">{genErr}</div>}
        <div className="saved-cases">
          <button className="btn ghost sm" onClick={() => setShowSaved((v) => !v)}>
            {showSaved ? "скрыть сохранённые" : `сохранённые кейсы (${savedCases.length})`}
          </button>
          {showSaved && (
            savedCases.length === 0 ? (
              <p style={{ margin: "10px 2px 0", color: "var(--ph-ink-3)", fontSize: 13.5 }}>Пока ничего не сохранено. Нажми «сохранить» в шапке во время работы над кейсом.</p>
            ) : (
              <div className="saved-cases-list">
                {savedCases.map((item) => (
                  <div key={item.id} className="saved-case-row">
                    <button className="saved-case-open" onClick={() => openSavedCase(item)}>
                      <b>{item.title}</b>
                      <span>шаг: {item.step || "—"}</span>
                    </button>
                    <button className="btn ghost sm" onClick={() => deleteSavedCase(item.id)} aria-label="удалить">×</button>
                  </div>
                ))}
              </div>
            )
          )}
        </div>
      </section>
      <div className="case-wrap">
        <aside className="case-steps">
          <div className="eyebrow" style={{ padding: "0 4px 4px" }}>5 шагов кейса</div>
          {steps.map((s, i) => (
            <div key={i} className={`case-step ${answers[s.title] ? "done" : ""} ${i === step ? "active" : ""}`} onClick={() => goToStep(i)}>
              <div className="n">{answers[s.title] ? "✓" : s.n}</div>
              <div>
                <b>{s.title}</b>
                <i>{s.desc}</i>
              </div>
            </div>
          ))}
          <div style={{ padding: "10px 4px 0", borderTop: "1.5px dashed var(--ph-ink-4)", marginTop: 6 }}>
            <div className="eyebrow" style={{ marginBottom: 6 }}>прогресс</div>
            <div className="bar"><i style={{ width: `${(step / (steps.length - 1)) * 100}%` }}></i></div>
            <div className="mono" style={{ marginTop: 6, color: "var(--ph-ink-3)" }}>{step + 1} / {steps.length} · ~7 мин до конца</div>
          </div>
        </aside>
        <div className="case-stage">
          <div className="generated-case-brief">
            <div className="case-brief-head" style={{ alignItems: "center" }}>
              <span className="eyebrow">условие кейса</span>
              <button className="btn ghost sm" onClick={() => setBriefOpen((v) => !v)}>{briefOpen ? "свернуть ▲" : "развернуть ▼"}</button>
            </div>
            {briefOpen && <div className="case-brief-body">{renderCaseBrief(caseText)}</div>}
          </div>
          <div className="meta">
            <span className="chip solid-ink">Шаг {step + 1} / 5</span>
            <span className="chip pink">{cur.title}</span>
            <span className="chip">⏱ ~3 мин</span>
          </div>
          <h2>{cur.title}</h2>
          <p className="promptq">{cur.prompt}</p>
          <textarea className="case-input" placeholder={cur.placeholder} value={text} onChange={(e) => setText(e.target.value)} />
          {evaluation && (
            <div className="mcq-explain" style={{ background: "var(--ph-mint-2)" }}>
              <h5>AI-разбор кейса</h5>
              <div className="case-brief-body">{renderCaseBrief(evaluation)}</div>
            </div>
          )}
          <div className="case-hint-row">
            <button className="hint-pill" onClick={() => setShowHint((v) => !v)}>
              {showHint ? "скрыть подсказку" : "💡 подсказка по шагу"}
            </button>
            {showHint && <div className="case-hint-box">{cur.hint}</div>}
          </div>
          <div className="case-actions">
            <div style={{ display: "flex", gap: 10, marginLeft: "auto" }}>
              <button className="btn ghost" onClick={() => goToStep(Math.max(0, step - 1))} disabled={step === 0}>{Icon.back} назад</button>
              {step < steps.length - 1 ? (
                <button className="btn primary lg" onClick={() => goToStep(step + 1)} disabled={text.trim().length < 20}>сохранить и далее {Icon.chev}</button>
              ) : (
                <button className="btn primary lg" onClick={finishCase} disabled={evaluating || text.trim().length < 20 || Object.keys(answers).length < steps.length - 1}>{evaluating ? "собираю разбор..." : "отправить на разбор"} {Icon.chev}</button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Screen: MOCK ────────────────────────────────────────────────────
function MockScreen({ go, progress, clock, completeTask }) {
  const blockOptions = [
    { id: "product_sense", label: "Product design", tone: "про пользователей, боли, решения", direction: "product" },
    { id: "product_execution", label: "Execution / Metrics", tone: "про диагностику, метрики, root cause", direction: "product" },
    { id: "product_strategy", label: "Strategy / Growth", tone: "про рынок, монетизацию, trade-offs", direction: "product" },
    { id: "consulting_opening", label: "Consulting opening", tone: "про структуру, гипотезы и clarifying", direction: "consulting" },
  ];
  const gradeOptions = [
    { id: "junior", label: "Junior", persona: "добрый интервьюер", pressure: "мягко подсказывает" },
    { id: "middle", label: "Middle", persona: "standard persona", pressure: "держит темп и просит конкретику" },
    { id: "senior", label: "Senior", persona: "bar raiser", pressure: "перебивает, давит на trade-offs" },
  ];
  const casePresets = [
    { id: "google-maps-kids", block: "product_sense", company: "Google", title: "Maps для детей 8-12", prompt: "Представь, что Google делает Maps для детей 8-12 лет. Какие вопросы задашь и какой продукт спроектируешь?", source: "IGotAnOffer / Exponent style" },
    { id: "youtube-education", block: "product_sense", company: "YouTube", title: "Educational product", prompt: "Design an educational product for YouTube. Сфокусируйся на learner personas, engagement и safety.", source: "Exponent questions" },
    { id: "meta-fitness", block: "product_sense", company: "Meta", title: "Fitness app", prompt: "Design a fitness app for Meta. Выбери сегмент, pain point, решение и success metrics.", source: "IGotAnOffer style" },
    { id: "facebook-movies", block: "product_sense", company: "Meta", title: "Movies experience", prompt: "Design a Facebook experience around movies. Сначала выбери primary user, затем pain point, social loop и метрики.", source: "IGotAnOffer prep" },
    { id: "kids-umbrella", block: "product_sense", company: "Consumer", title: "Umbrella for kids", prompt: "Design an umbrella for kids. Сфокусируйся на контексте использования, безопасности, parents vs kids и MVP.", source: "IGotAnOffer product sense" },
    { id: "chrome-improve", block: "product_sense", company: "Google", title: "Improve Chrome", prompt: "How would you improve Google Chrome? Выбери сегмент, боль, 3 решения и success metrics.", source: "IGotAnOffer product sense" },
    { id: "instagram-travel", block: "product_sense", company: "Instagram", title: "Travel discovery", prompt: "Design a travel planning experience inside Instagram. Учти creators, saved posts, itinerary и trust.", source: "YouTube mock style" },
    { id: "spotify-podcasts", block: "product_sense", company: "Spotify", title: "Podcast discovery", prompt: "Improve podcast discovery on Spotify for users who rarely finish episodes. Найди сегмент, pain и retention loop.", source: "PM mock bank" },
    { id: "amazon-returns", block: "product_sense", company: "Amazon", title: "Returns experience", prompt: "Design a better returns experience for Amazon customers without increasing fraud or cost-to-serve.", source: "PM mock bank" },
    { id: "duolingo-teams", block: "product_sense", company: "Duolingo", title: "Learning with friends", prompt: "Design a social learning feature for Duolingo. Как повысить motivation без shame и spam?", source: "Product design mock" },
    { id: "linkedin-career-switch", block: "product_sense", company: "LinkedIn", title: "Career switchers", prompt: "Design a LinkedIn product for people switching careers. Сфокусируйся на trust, skill gap и measurable outcomes.", source: "Product design mock" },
    { id: "airbnb-accessibility", block: "product_sense", company: "Airbnb", title: "Accessible stays", prompt: "Design an Airbnb experience for travelers with accessibility needs. Как проверишь quality и trust?", source: "Product design mock" },
    { id: "facebook-likes", block: "product_execution", company: "Meta", title: "Success of Likes", prompt: "Как бы ты измерил(а) успех Facebook Like button? Назови primary metric, guardrails и риски.", source: "PM Exercises metrics" },
    { id: "ubereats-metric", block: "product_execution", company: "Uber", title: "UberEats NSM", prompt: "Какая самая важная метрика для UberEats и почему? Как диагностировать падение этой метрики?", source: "PM Exercises / Exponent style" },
    { id: "youtube-ads-drop", block: "product_execution", company: "YouTube", title: "Ad starts dropped", prompt: "YouTube ad starts упали на 12% за неделю. Построй диагностику: instrumentation, supply/demand, creators, users, geo/device.", source: "Metrics change mock" },
    { id: "instagram-stories-retention", block: "product_execution", company: "Instagram", title: "Stories retention", prompt: "D7 retention у новых Stories users падает. Какие разрезы проверишь и какие гипотезы протестируешь?", source: "Execution mock" },
    { id: "slack-notifications", block: "product_execution", company: "Slack", title: "Notifications quality", prompt: "Как измерить качество Slack notifications и понять, что новая ML-сортировка стала лучше?", source: "Metrics definition" },
    { id: "netflix-search", block: "product_execution", company: "Netflix", title: "Search success", prompt: "Определи success metrics для Netflix search. Как диагностировать падение search-to-play conversion?", source: "Metrics mock" },
    { id: "doordash-late-orders", block: "product_execution", company: "DoorDash", title: "Late orders", prompt: "Late delivery rate вырос на 8%. Построй root cause tree и план экспериментов.", source: "Execution mock" },
    { id: "tiktok-creator-retention", block: "product_execution", company: "TikTok", title: "Creator retention", prompt: "Creator retention падает среди small creators. Какие метрики и сегменты проверишь?", source: "Execution mock" },
    { id: "notion-ai-quality", block: "product_execution", company: "Notion", title: "AI answer quality", prompt: "Как оценить качество Notion AI summaries? Определи online/offline metrics, guardrails и human eval.", source: "AI PM mock" },
    { id: "premium-bank", block: "product_strategy", company: "Fintech", title: "Premium monetization", prompt: "Цифровой банк хочет увеличить прибыльность premium-сегмента. Какие варианты стратегии предложишь?", source: "Case interview style" },
    { id: "youtube-double-users", block: "product_strategy", company: "YouTube", title: "Double user base", prompt: "How would you double YouTube’s user base? Выбери рынок/сегмент, стратегические bets и риски.", source: "IGotAnOffer strategy" },
    { id: "snapchat-3year", block: "product_strategy", company: "Snapchat", title: "3-year strategy", prompt: "What would be your 3-year strategy for Snapchat? Учти конкуренцию, creators, AI и monetization.", source: "IGotAnOffer strategy" },
    { id: "google-unmapped-area", block: "product_strategy", company: "Google Maps", title: "Unmapped areas", prompt: "How would you map an unmapped area? Разбери supply, data quality, partnerships и rollout.", source: "IGotAnOffer strategy" },
    { id: "apple-health-subscription", block: "product_strategy", company: "Apple", title: "Health subscription", prompt: "Apple Health хочет запустить paid subscription. Какую стратегию, packaging и metrics предложишь?", source: "Strategy mock" },
    { id: "figma-ai-pricing", block: "product_strategy", company: "Figma", title: "AI pricing", prompt: "Figma запускает AI-фичи. Как выбрать pricing/packaging, не ухудшив collaboration loop?", source: "AI PM strategy" },
    { id: "openai-teams-growth", block: "product_strategy", company: "OpenAI", title: "Teams growth", prompt: "OpenAI хочет увеличить adoption Teams среди SMB. Какую go-to-market и product strategy предложишь?", source: "AI PM mock" },
    { id: "reddit-monetization", block: "product_strategy", company: "Reddit", title: "Monetization without harm", prompt: "Reddit хочет поднять revenue без ухудшения community trust. Какие стратегические опции выберешь?", source: "Strategy mock" },
    { id: "airbnb-long-term", block: "product_strategy", company: "Airbnb", title: "Long-term stays", prompt: "Airbnb рассматривает long-term stays. Оцени opportunity, risks, supply constraints и MVP.", source: "Strategy mock" },
    { id: "marketplace-profit", block: "consulting_opening", company: "Marketplace", title: "Profitability drop", prompt: "Маркетплейс растёт по GMV, но прибыль падает. Сформулируй clarifying questions и дерево гипотез.", source: "Consulting case style" },
    { id: "food-delivery-margin", block: "consulting_opening", company: "Food delivery", title: "Margin pressure", prompt: "Delivery app видит рост заказов, но contribution margin ухудшается. Какие вопросы задашь и как структурируешь кейс?", source: "Consulting case style" },
    { id: "saas-churn", block: "consulting_opening", company: "B2B SaaS", title: "Enterprise churn", prompt: "B2B SaaS теряет enterprise-клиентов после первого года. Построй issue tree и первые данные, которые попросишь.", source: "Consulting/Product case" },
    { id: "ride-hailing-supply", block: "consulting_opening", company: "Ride-hailing", title: "Driver supply shortage", prompt: "Ride-hailing app столкнулся с нехваткой водителей в часы пик. Сформулируй opening, hypotheses и math setup.", source: "Consulting case style" },
    { id: "edtech-profit", block: "consulting_opening", company: "EdTech", title: "Trial-to-paid problem", prompt: "EdTech растит trials, но trial-to-paid conversion падает. Как структурируешь диагностику и юнит-экономику?", source: "Business case mock" },
    { id: "cloud-costs", block: "consulting_opening", company: "Cloud SaaS", title: "Cloud costs spike", prompt: "Cloud SaaS резко увеличил infra costs при стабильной выручке. Какие clarifying questions и buckets анализа?", source: "Business case mock" },
    // Тематические пресеты по индустриям (перенесены из раздела «Кейс»)
    { id: "ind-spotify-likes", block: "product_sense", company: "Spotify", title: "Лайки песен в плейлистах", industry: "Music streaming / Entertainment", prompt: "Spotify хочет добавить лайки песен в плейлистах. Сфокусируй кейс на activation, retention, discovery и выборе метрик.", source: "Индустрия · product design" },
    { id: "ind-marketplace-retention", block: "product_execution", company: "Маркетплейс", title: "Падение повторных покупок", industry: "E-commerce / Маркетплейсы", prompt: "Маркетплейс видит падение повторных покупок у новых пользователей. Нужен PM case про диагностику воронки, сегменты, гипотезы роста и эксперименты.", source: "Индустрия · growth" },
    { id: "ind-fintech-onboarding", block: "product_execution", company: "Fintech", title: "Потери на KYC/onboarding", industry: "Fintech / Банки", prompt: "Финтех-приложение теряет пользователей на KYC/onboarding. Сгенерируй кейс с данными по funnel, ограничениями compliance и выбором решения.", source: "Индустрия · execution" },
    { id: "ind-edtech-monetization", block: "product_strategy", company: "EdTech", title: "Trial-to-paid conversion", industry: "EdTech / Образование", prompt: "EdTech хочет поднять trial-to-paid conversion без ухудшения learning outcomes. Нужен кейс про сегменты, pricing/paywall, retention и guardrail metrics.", source: "Индустрия · strategy" },
    { id: "ind-bank-profit", block: "consulting_opening", company: "Цифровой банк", title: "Падение прибыльности", industry: "Fintech / Банки", prompt: "Цифровой банк растёт по клиентам, но прибыльность падает. Сгенерируй consulting case с экономикой, CAC, cross-sell, cost-to-serve и decision question.", source: "Индустрия · business case" },
  ];
  const cleanMockText = (value = "") =>
    value
      .replace(/\*\*/g, "")
      .replace(/\s*\|\s*/g, " · ")
      .replace(/---+/g, "")
      .replace(/\n{3,}/g, "\n\n")
      .trim();

  const getCaseBrief = (value = "") => {
    const text = cleanMockText(value);
    const titleMatch = text.match(/(?:Раунд|Round):?\s*([^\n.]+)/i);
    const dataMatch = text.match(/(?:Данные|Data):?\s*([\s\S]*?)(?:Ожидаемые|Pushback|Критерии|$)/i);
    const expectedMatch = text.match(/(?:Ожидаемые блоки ответа|Expected answer blocks):?\s*([\s\S]*?)(?:Pushback|Критерии|$)/i);
    const pushbackMatch = text.match(/(?:Pushback интервьюера|Pushback):?\s*([\s\S]*?)(?:Критерии|$)/i);
    const criteriaMatch = text.match(/(?:Критерии сильного ответа|Criteria):?\s*([\s\S]*)/i);
    const intro = text
      .replace(/(?:Данные|Data):?[\s\S]*/i, "")
      .replace(/(?:Ожидаемые блоки ответа|Expected answer blocks):?[\s\S]*/i, "")
      .replace(/(?:Pushback интервьюера|Pushback):?[\s\S]*/i, "")
      .replace(/(?:Критерии сильного ответа|Criteria):?[\s\S]*/i, "")
      .trim();
    const toItems = (chunk = "") =>
      cleanMockText(chunk)
        .split(/\n|(?:\s+\d+\.\s+)/)
        .map((item) => item.replace(/^\d+\.\s*/, "").trim())
        .filter(Boolean)
        .slice(0, 6);

    return {
      title: titleMatch?.[1]?.trim() || selectedCase.title,
      intro: intro || text,
      data: toItems(dataMatch?.[1]),
      expected: toItems(expectedMatch?.[1]),
      pushback: toItems(pushbackMatch?.[1]),
      criteria: toItems(criteriaMatch?.[1]),
    };
  };

  const MockCaseBrief = ({ text }) => {
    const brief = getCaseBrief(text);
    const sections = [
      { title: "Данные", items: brief.data },
      { title: "Ожидаемые блоки ответа", items: brief.expected },
      { title: "Pushback", items: brief.pushback },
      { title: "Критерии сильного ответа", items: brief.criteria },
    ].filter((section) => section.items.length > 0);

    return (
      <div className="generated-case-brief compact">
        <div className="case-brief-head">
          <span className="eyebrow">исходный кейс</span>
          <strong>{brief.title}</strong>
        </div>
        <p>{brief.intro}</p>
        {sections.map((section) => (
          <div key={section.title} className="case-brief-section">
            <b>{section.title}</b>
            <ul>{section.items.map((item) => <li key={item}>{item}</li>)}</ul>
          </div>
        ))}
      </div>
    );
  };

  const buildRounds = (blockId, casePrompt) => {
    const commonStart = {
      id: "clarify",
      title: "Clarify",
      prompt: "С каких 3-4 уточняющих вопросов начнёшь?",
      expectedSignals: ["цель", "сегмент", "ограничения", "success criteria"],
    };
    const map = {
      product_sense: [
        commonStart,
        { id: "user", title: "User & pain", prompt: "Кто primary user и его 2-3 главные боли?", expectedSignals: ["segmentation", "JTBD", "pain severity", "frequency"] },
        { id: "solutions", title: "Solutions", prompt: "Дай 3 решения (MVP / смелое / простое). Что в V1?", expectedSignals: ["solution range", "prioritization", "trade-off", "V1 scope"] },
        { id: "metrics", title: "Metrics", prompt: "Success metric, guardrails и как проверишь?", expectedSignals: ["primary metric", "guardrails", "experiment", "risks"] },
      ],
      product_execution: [
        commonStart,
        { id: "diagnose", title: "Diagnose", prompt: "Какие разрезы и сегменты проверишь? Дерево диагностики.", expectedSignals: ["funnel", "segments", "instrumentation", "root cause"] },
        { id: "metrics", title: "Metrics", prompt: "Primary metric + 3 supporting. Что исказит вывод?", expectedSignals: ["metric hierarchy", "leading/lagging", "counter-metrics"] },
        { id: "actions", title: "Actions", prompt: "Какие 2-3 действия после диагностики и как проверишь?", expectedSignals: ["experiments", "impact", "confidence", "rollout"] },
      ],
      product_strategy: [
        commonStart,
        { id: "market", title: "Market", prompt: "Рынок, конкуренты, fit — где главный leverage?", expectedSignals: ["market sizing", "competition", "moat", "fit"] },
        { id: "options", title: "Options", prompt: "3 стратегические опции и trade-offs.", expectedSignals: ["options", "trade-offs", "resources", "timing"] },
        { id: "recommend", title: "Recommendation", prompt: "Финальная рекомендация: что делаем, какие риски?", expectedSignals: ["clear recommendation", "risks", "next steps", "metrics"] },
      ],
      consulting_opening: [
        commonStart,
        { id: "structure", title: "Structure", prompt: "Issue tree: revenue / costs / mix / external. С чего начнёшь?", expectedSignals: ["MECE", "hypothesis", "profit equation", "prioritization"] },
        { id: "math", title: "Math setup", prompt: "Какие данные и формулу возьмёшь для первого расчёта?", expectedSignals: ["unit economics", "formula", "assumptions", "sanity check"] },
        { id: "synthesis", title: "Synthesis", prompt: "Предварительная гипотеза и следующие шаги?", expectedSignals: ["synthesis", "confidence", "risks", "client-ready answer"] },
      ],
    };
    return map[blockId] || map.product_sense;
  };
  const [setupDone, setSetupDone] = useState(false);
  const [mode, setMode] = useState("live");
  const [savedNotice, setSavedNotice] = useState("");
  const [blockId, setBlockId] = useState("product_sense");
  const [grade, setGrade] = useState("middle");
  const [caseId, setCaseId] = useState("google-maps-kids");
  const [customMode, setCustomMode] = useState(false);
  const [customContext, setCustomContext] = useState("");
  const [taskText, setTaskText] = useState(casePresets[0].prompt);
  const [generatingCase, setGeneratingCase] = useState(false);
  const [interviewerMood, setInterviewerMood] = useState("listening");
  const [rounds, setRounds] = useState(() => buildRounds("product_sense", casePresets[0].prompt));
  const [roundIdx, setRoundIdx] = useState(0);
  const [seconds, setSeconds] = useState(0);
  const [paused, setPaused] = useState(false);
  const [answer, setAnswer] = useState("");
  const [checking, setChecking] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [listening, setListening] = useState(false);
  const [speechDraft, setSpeechDraft] = useState("");
  const [speechError, setSpeechError] = useState("");
  const [roundAnswers, setRoundAnswers] = useState({});
  const [finished, setFinished] = useState(false);
  const [evaluating, setEvaluating] = useState(false);
  const [finalResult, setFinalResult] = useState(null);
  const [transcript, setTranscript] = useState([
    { role: "them", who: "Виктор", text: "Привет. Выбери блок интервью и грейд — потом начнём как настоящий live mock." },
  ]);
  const recognitionRef = useRef(null);
  const selectedBlock = blockOptions.find((item) => item.id === blockId) || blockOptions[0];
  const selectedGrade = gradeOptions.find((item) => item.id === grade) || gradeOptions[1];
  const selectedCase = customMode
    ? { id: "custom", block: blockId, company: "Custom", title: "свой собес", prompt: customContext.trim() || "Свой кастомный mock interview", source: "user topic" }
    : (casePresets.find((item) => item.id === caseId) || casePresets[0]);
  const availableCases = casePresets.filter((item) => item.block === blockId);
  const cur = rounds[roundIdx] || rounds[0];
  const elapsed = `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
  const pace = Math.min(100, Math.round((seconds / (15 * 60)) * 100));
  useEffect(() => {
    if (paused || !setupDone || finished) return undefined;
    const timer = setInterval(() => setSeconds((v) => v + 1), 1000);
    return () => clearInterval(timer);
  }, [paused, setupDone, finished]);

  useEffect(() => {
    const first = casePresets.find((item) => item.block === blockId) || casePresets[0];
    setCaseId(first.id);
  }, [blockId]);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSpeechError("Браузер не поддерживает распознавание речи. В Safari/Chrome на HTTPS должно работать.");
      return undefined;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = "ru-RU";
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;
    recognition.onstart = () => {
      setListening(true);
      setSpeechError("");
      setSpeechDraft("");
    };
    recognition.onresult = (event) => {
      let finalText = "";
      let interimText = "";
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const chunk = event.results[i][0]?.transcript || "";
        if (event.results[i].isFinal) finalText += chunk;
        else interimText += chunk;
      }
      if (finalText.trim()) {
        setAnswer((prev) => `${prev}${prev.trim() ? " " : ""}${finalText.trim()}`);
      }
      setSpeechDraft(interimText.trim());
    };
    recognition.onerror = (event) => {
      const messages = {
        "not-allowed": "Нужно разрешить доступ к микрофону в браузере.",
        "no-speech": "Не услышал речь. Попробуй ещё раз и говори ближе к микрофону.",
        "audio-capture": "Микрофон не найден или занят другим приложением.",
      };
      setSpeechError(messages[event.error] || `Ошибка микрофона: ${event.error}`);
      setListening(false);
    };
    recognition.onend = () => {
      setListening(false);
      setSpeechDraft("");
    };
    recognitionRef.current = recognition;
    return () => {
      recognitionRef.current?.abort();
      recognitionRef.current = null;
    };
  }, []);

  const toggleMic = () => {
    const recognition = recognitionRef.current;
    if (!recognition) {
      setSpeechError("Распознавание речи недоступно в этом браузере.");
      return;
    }
    if (listening) {
      recognition.stop();
      return;
    }
    try {
      setSpeechError("");
      setSpeechDraft("");
      recognition.start();
    } catch {
      recognition.stop();
    }
  };

  const submitAnswer = async () => {
    const clean = answer.trim();
    if (!clean || checking) return;
    setTranscript((items) => [...items, { role: "you", who: "Ты", text: clean }]);
    setRoundAnswers((prev) => ({ ...prev, [cur.id]: clean }));
    setChecking(true);
    setFeedback("");
    setInterviewerMood("thinking");
    try {
      const res = await api.checkInterview({
        directionId: selectedBlock.direction,
        blockId,
        taskText,
        roundId: cur.id,
        roundTitle: cur.title,
        roundGoal: cur.prompt,
        answerText: clean,
        expectedSignals: cur.expectedSignals,
        previousAnswers: roundAnswers,
        mode: "coach",
      });
      const hint = res.result.trim();
      setFeedback(hint);
      setTranscript((items) => [...items, { role: "them", who: "Виктор", text: hint.slice(0, 480) }]);
      setInterviewerMood("push");
    } catch (e) {
      const msg = `Виктор не ответил (${e.message}). Если это первый запрос — бэкенд мог засыпать, разбудится за ~30 сек, попробуй ещё раз.`;
      setFeedback(msg);
      setTranscript((items) => [...items, { role: "them", who: "Виктор", text: msg }]);
      setInterviewerMood("listening");
    } finally {
      setChecking(false);
    }
  };

  const nextRound = () => {
    if (answer.trim()) setRoundAnswers((prev) => ({ ...prev, [cur.id]: answer.trim() }));
    const next = Math.min(rounds.length - 1, roundIdx + 1);
    setRoundIdx(next);
    setFeedback("");
    setAnswer(roundAnswers[rounds[next]?.id] || "");
    setInterviewerMood("listening");
  };
  const selectRound = (index) => {
    const clean = answer.trim();
    const collected = { ...roundAnswers, ...(clean ? { [cur.id]: clean } : {}) };
    if (clean) setRoundAnswers(collected);
    setRoundIdx(index);
    setFeedback("");
    setAnswer(collected[rounds[index]?.id] || "");
  };

  const finishMock = async () => {
    if (evaluating) return;
    const collected = { ...roundAnswers };
    if (answer.trim()) collected[cur.id] = answer.trim();
    if (rounds.some((round) => !collected[round.id]?.trim())) {
      setFeedback("Ответь на каждый раунд перед итоговым разбором. Если застрял, дай короткую структуру и переходи дальше.");
      return;
    }
    const labelled = {};
    rounds.forEach((r) => {
      if (collected[r.id]?.trim()) labelled[r.title] = collected[r.id].trim();
    });
    setFinished(true);
    setEvaluating(true);
    setFinalResult(null);
    try {
      const res = await api.checkInterview({
        directionId: selectedBlock.direction,
        blockId,
        taskText,
        roundId: "final",
        roundTitle: "Итог",
        roundGoal: "Итоговая оценка интервью",
        answerText: "",
        expectedSignals: [],
        previousAnswers: labelled,
        mode: "final",
      });
      const cleaned = res.result.replace(/```(?:json)?/g, "").replace(/```/g, "").trim();
      try {
        setFinalResult(JSON.parse(cleaned));
      } catch {
        setFinalResult({ verdict: cleaned });
      }
    } catch (e) {
      setFinalResult({ verdict: `Не удалось собрать разбор (${e.message}). Если бэкенд просыпался — подожди ~30 сек и нажми «завершить» ещё раз.` });
    } finally {
      setEvaluating(false);
    }
  };

  const startMock = (caseText = selectedCase.prompt) => {
    const nextRounds = buildRounds(blockId, caseText);
    setTaskText(caseText);
    setRounds(nextRounds);
    setRoundIdx(0);
    setSeconds(0);
    setPaused(false);
    setSetupDone(true);
    setRoundAnswers({});
    setFinished(false);
    setFinalResult(null);
    setEvaluating(false);
    setTranscript([
      { role: "them", who: "Виктор", text: `Окей, ${selectedGrade.label}. Я ${selectedGrade.pressure}. Кейс открыт в briefing, начнём с clarify.` },
    ]);
    setFeedback("");
    setAnswer("");
    setInterviewerMood("listening");
  };

  const saveCase = () => {
    const saved = JSON.parse(localStorage.getItem("pmquest-saved-cases-v1") || "[]");
    const next = [
      {
        id: `${selectedCase.id}-${Date.now()}`,
        title: `${selectedCase.company} · ${selectedCase.title}`,
        caseText: taskText,
        step: cur.title,
        draft: answer,
        savedAt: new Date().toISOString(),
      },
      ...saved,
    ].slice(0, 12);
    localStorage.setItem("pmquest-saved-cases-v1", JSON.stringify(next));
    setSavedNotice("сохранено");
    window.setTimeout(() => setSavedNotice(""), 1800);
  };

  const generateAndStart = async () => {
    setGeneratingCase(true);
    setFeedback("");
    try {
      const industryPrefix = selectedCase.industry ? `Индустрия: ${selectedCase.industry}. ` : "";
      const res = await api.generateInterview({
        directionId: selectedBlock.direction,
        blockId,
        difficulty: grade,
        companyContext: customMode
          ? `Кастомная тема пользователя: ${customContext.trim() || "PM mock interview по выбранному блоку"}`
          : (customContext.trim() || `${industryPrefix}${selectedCase.company}: ${selectedCase.title}. ${selectedCase.prompt}`),
      });
      startMock(res.taskText || selectedCase.prompt);
    } catch (e) {
      setFeedback(`AI не сгенерировал кейс (${e.message}). Запускаю выбранный готовый кейс. Если это был первый запрос — бэкенд мог засыпать (~30 сек), можешь вернуться и нажать AI-генерацию снова.`);
      startMock(customContext.trim() || selectedCase.prompt);
    } finally {
      setGeneratingCase(false);
    }
  };

  if (!setupDone) {
    return (
      <div className="screen">
        <Topbar crumbs={["Home", "Mock с AI", "Настройка"]} progress={progress} clock={clock} />
        <div className="screen-head">
          <div>
            <span className="eyebrow">Live mock setup · кейсы из публичных PM question banks</span>
            <h1>Выбери часть интервью, грейд и кейс</h1>
          </div>
          <div className="right">
            <span className="chip plum">{selectedGrade.persona}</span>
            <span className="chip sun">{selectedBlock.label}</span>
          </div>
        </div>
        <div className="mock-setup">
          <div className="mock-setup-main">
          <section className="mock-setup-panel">
            <div className="eyebrow">режим практики</div>
            <div className="mock-mode-switch">
              <button className={mode === "live" ? "active" : ""} onClick={() => setMode("live")}>Live mock с микрофоном</button>
              <button className={mode === "written" ? "active" : ""} onClick={() => setMode("written")}>Письменный разбор</button>
            </div>
          </section>
          <section className="mock-setup-panel">
            <div className="eyebrow">1 · часть mock interview</div>
            <div className="mock-choice-grid">
              {blockOptions.map((item) => (
                <button key={item.id} className={`mock-choice ${blockId === item.id ? "active" : ""}`} onClick={() => setBlockId(item.id)}>
                  <strong>{item.label}</strong>
                  <span>{item.tone}</span>
                </button>
              ))}
            </div>
          </section>
          <section className="mock-setup-panel">
            <div className="eyebrow">2 · грейд</div>
            <div className="mock-choice-grid grade">
              {gradeOptions.map((item) => (
                <button key={item.id} className={`mock-choice ${grade === item.id ? "active" : ""}`} onClick={() => setGrade(item.id)}>
                  <strong>{item.label}</strong>
                  <span>{item.pressure}</span>
                </button>
              ))}
            </div>
          </section>
          <section className="mock-setup-panel">
            <div className="eyebrow">3 · кейс</div>
            <div className="mock-mode-switch">
              <button className={!customMode ? "active" : ""} onClick={() => setCustomMode(false)}>готовый кейс</button>
              <button className={customMode ? "active" : ""} onClick={() => setCustomMode(true)}>свой кастомный собес</button>
            </div>
            {!customMode ? (
              <>
                <div className="mock-case-list">
                  {availableCases.map((item) => (
                    <button key={item.id} className={`mock-case-pick ${caseId === item.id ? "active" : ""}`} onClick={() => setCaseId(item.id)}>
                      <b>{item.company} · {item.title}</b>
                      <span>{item.prompt}</span>
                      <i>{item.source}</i>
                    </button>
                  ))}
                </div>
                <textarea
                  className="case-topic-input"
                  value={customContext}
                  onChange={(e) => setCustomContext(e.target.value)}
                  placeholder="Можно добавить контекст к выбранному кейсу: компания, продукт, рынок, ограничение..."
                />
              </>
            ) : (
              <div className="mock-custom-box">
                <h4>Какую тему ты хочешь?</h4>
                <p>Напиши компанию, продукт, проблему или рынок. AI превратит это в live mock под выбранный блок и грейд.</p>
                <textarea
                  className="case-topic-input"
                  value={customContext}
                  onChange={(e) => setCustomContext(e.target.value)}
                  placeholder="Например: «AI travel planner для семей», «B2B SaaS churn», «банк теряет прибыльность в premium», «YouTube Shorts падает retention у подростков»"
                />
              </div>
            )}
            {feedback && <div className="case-generator-error">{feedback}</div>}
          </section>
          </div>
          <aside className="mock-setup-card">
            <PimFigure size={120} expression="teach" />
            <h3>Виктор готов</h3>
            <p>Он будет вести интервью по выбранному блоку: задаст opening, дождётся ответа, проверит через AI и подкинет следующий вопрос.</p>
            <button className="btn primary lg" style={{ width: "100%" }} onClick={() => generateAndStart()} disabled={generatingCase}>
              {generatingCase ? "AI готовит кейс..." : "AI сгенерировать и начать"}
            </button>
            <button className="btn ghost lg" style={{ width: "100%" }} onClick={() => startMock(customContext.trim() || selectedCase.prompt)} disabled={generatingCase}>
              {customMode ? "начать с моей темой" : "начать с выбранным кейсом"}
            </button>
          </aside>
        </div>
      </div>
    );
  }

  if (finished) {
    const fr = finalResult || {};
    return (
      <div className="screen">
        <Topbar crumbs={["Home", "Mock с AI", "Итог"]} progress={progress} clock={clock} />
        <div className="screen-head">
          <div>
            <span className="eyebrow">Итоговый разбор · {selectedBlock.label} · {selectedGrade.label}</span>
            <h1>{selectedCase.company} · {selectedCase.title}</h1>
          </div>
          <div className="right">
            <span className="chip sun">{progress.xp} XP</span>
          </div>
        </div>
        <div className="review-stage">
          <div>
            <div className="score-hero">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 20 }}>
                <div>
                  <div className="eyebrow">общая оценка</div>
                  <div className="score-num" style={{ fontSize: 70 }}>{evaluating ? "…" : (fr.overallScore ?? "—")}</div>
                  <div className="score-sub">{evaluating ? "AI собирает разбор…" : "из 100 · по всем раундам"}</div>
                </div>
                <PimFigure size={130} expression={evaluating ? "think" : "smile"} />
              </div>
              {fr.verdict && <p style={{ marginTop: 14, fontSize: 16, lineHeight: 1.5 }}>{fr.verdict}</p>}
              {Array.isArray(fr.perRound) && fr.perRound.length > 0 && (
                <div className="score-bars" style={{ marginTop: 16 }}>
                  {fr.perRound.map((r, i) => (
                    <div key={i} className="score-bar-row">
                      <div className="nm">{r.round}</div>
                      <div className="bar tall"><i style={{ width: `${Math.min(100, Number(r.score) || 0)}%`, background: (Number(r.score) || 0) >= 60 ? "var(--ph-mint)" : (Number(r.score) || 0) >= 35 ? "var(--ph-coral)" : "var(--ph-ink-4)" }}></i></div>
                      <div className="vl">{r.score ?? "—"}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            {(Array.isArray(fr.strengths) || Array.isArray(fr.gaps)) && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginTop: 18 }}>
                <div className="review-card" style={{ background: "var(--ph-mint-2)" }}>
                  <h4>Сильные стороны</h4>
                  <ul style={{ margin: "6px 0 0", paddingLeft: 18, fontSize: 14, lineHeight: 1.6 }}>
                    {(fr.strengths || []).map((s, i) => <li key={i}>{s}</li>)}
                  </ul>
                </div>
                <div className="review-card" style={{ background: "#ffe1e1" }}>
                  <h4>Зоны роста</h4>
                  <ul style={{ margin: "6px 0 0", paddingLeft: 18, fontSize: 14, lineHeight: 1.6 }}>
                    {(fr.gaps || []).map((g, i) => <li key={i}>{g}</li>)}
                  </ul>
                </div>
              </div>
            )}
          </div>
          <div className="review-side">
            {fr.nextStep && (
              <div className="review-card pim-says">
                <h4>📣 Следующий шаг</h4>
                <p style={{ fontSize: 15, lineHeight: 1.5 }}>{fr.nextStep}</p>
              </div>
            )}
            <div className="next-row">
              <button className="btn primary lg" style={{ flex: 1 }} onClick={() => completeTask(`mock-${selectedCase.id}`, 60, "home", { cases: progress.cases + 1 })}>домой →</button>
            </div>
            <div className="next-row">
              <button className="btn ghost" style={{ flex: 1 }} onClick={() => { setFinished(false); setSetupDone(false); }}>ещё кейс</button>
              <button className="btn ghost" style={{ flex: 1 }} onClick={() => go("review")}>в Score</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="screen">
      <Topbar crumbs={["Home", "Mock с AI"]} progress={progress} clock={clock} />
      <div className="screen-head">
        <div>
          <span className="eyebrow">{mode === "written" ? "Письменный разбор" : "Mock-интервью"} · {selectedGrade.label} · {selectedBlock.label} · 15 мин</span>
          <h1>{selectedCase.company} · {selectedCase.title}</h1>
        </div>
        <div className="right">
          <button className="btn ghost sm" onClick={() => setSetupDone(false)}>сменить mock</button>
          <button className="btn ghost sm" onClick={saveCase}>{savedNotice || "сохранить"}</button>
          <span className="chip plum">🧐 {selectedGrade.persona}</span>
          {mode === "live" && <span className="chip sun">⏱ {elapsed} / 15:00</span>}
          {mode === "live" && <button className="btn ghost sm" onClick={() => setPaused(!paused)}>{paused ? "▶ продолжить" : "⏸ пауза"}</button>}
        </div>
      </div>
      {mode === "written" ? (
        <div className="case-wrap">
          <aside className="case-steps">
            <div className="eyebrow" style={{ padding: "0 4px 4px" }}>{rounds.length} шагов разбора</div>
            {rounds.map((r, i) => (
              <div key={r.id} className={`case-step ${roundAnswers[r.id] ? "done" : ""} ${i === roundIdx ? "active" : ""}`} onClick={() => selectRound(i)}>
                <div className="n">{roundAnswers[r.id] ? "✓" : i + 1}</div>
                <div>
                  <b>{r.title}</b>
                  <i>{r.prompt.length > 52 ? `${r.prompt.slice(0, 52)}…` : r.prompt}</i>
                </div>
              </div>
            ))}
          </aside>
          <div className="case-stage">
            <MockCaseBrief text={taskText} />
            <div className="meta">
              <span className="chip solid-ink">Шаг {roundIdx + 1} / {rounds.length}</span>
              <span className="chip pink">{cur.title}</span>
            </div>
            <h2>{cur.title}</h2>
            <p className="promptq">{cur.prompt}</p>
            <textarea
              className="case-input"
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="Ответь письменно: структура, сегмент, метрики, trade-offs…"
            />
            {feedback && (
              <div className="mcq-explain" style={{ background: "var(--ph-mint-2)" }}>
                <h5>AI feedback</h5>
                <p>{feedback}</p>
              </div>
            )}
            <div className="case-actions">
              <div style={{ display: "flex", gap: 10, marginLeft: "auto" }}>
                <button className="btn ghost" onClick={() => selectRound(Math.max(0, roundIdx - 1))} disabled={roundIdx === 0}>{Icon.back} назад</button>
                <button className="btn" onClick={submitAnswer} disabled={checking || !answer.trim()}>{checking ? "проверяю" : "проверить ответ (AI)"}</button>
                {roundIdx < rounds.length - 1 ? (
                  <button className="btn primary lg" onClick={nextRound} disabled={!answer.trim() && !roundAnswers[cur.id]?.trim()}>далее {Icon.chev}</button>
                ) : (
                  <button className="btn primary lg" onClick={finishMock} disabled={!answer.trim() && !roundAnswers[cur.id]?.trim()}>отправить на разбор {Icon.chev}</button>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
      <div className="mock-stage">
        <div className="mock-room">
          <div className="mock-interviewer">
            <div className={`interviewer-av mood-${interviewerMood}`}>VK</div>
            <div className="mock-bubble">
              <div className="eyebrow" style={{ marginBottom: 4 }}>Виктор · Sr. PM · {selectedGrade.pressure}</div>
              <div className="mock-current-prompt">{cur.prompt}</div>
            </div>
          </div>
          <MockCaseBrief text={taskText} />
          <div className="mock-transcript">
            <div className="mock-line note">— Mock начат: {elapsed} · transcript on · round {roundIdx + 1}/{rounds.length} —</div>
            {transcript.map((line, i) => (
              <div key={i} className={`mock-line ${line.role}`}>
                <span className="who">{line.who}:</span><span>{line.text}</span>
              </div>
            ))}
          </div>
          <div className="pace-rail">
            <h5><span>Pace-meter — сейчас «{cur.title}»</span><span className="mono" style={{ color: "var(--ph-ink-3)" }}>{elapsed} / 15:00</span></h5>
            <div className="pace-track">
              <i style={{ width: `${pace}%` }}></i>
              {[13, 33, 55, 78].map((p) => <span key={p} className="tick" style={{ left: `${p}%` }}></span>)}
            </div>
            <div className="pace-labels">
              {rounds.map((round) => <span key={round.id}>{round.title}</span>)}
            </div>
          </div>
          {feedback && (
            <div className="mcq-explain" style={{ background: "var(--ph-mint-2)" }}>
              <h5>AI feedback</h5>
              <p>{feedback}</p>
            </div>
          )}
          <div className="mic-row">
            <button className={`mic-btn ${listening ? "listening" : ""}`} onClick={toggleMic} type="button" aria-label={listening ? "Остановить микрофон" : "Включить микрофон"}>
              {Icon.mic}
            </button>
            <div style={{ flex: 1 }}>
              <textarea className="mock-answer-input" value={answer} onChange={(e) => setAnswer(e.target.value)} placeholder="Ответь как на интервью. Можно коротко: 3 вопроса, структура, метрики..." />
              <div className={`speech-status ${listening ? "on" : ""}`}>
                {listening ? `Слушаю речь… ${speechDraft}` : speechError || "Нажми на микрофон и говори. Речь появится в ответе, затем AI проверит смысл."}
              </div>
            </div>
            <button className="btn ghost sm" onClick={nextRound}>пропустить</button>
            <button className="btn primary" onClick={submitAnswer} disabled={checking || !answer.trim()}>{checking ? "проверяю" : "ответить"}</button>
          </div>
        </div>
        <aside style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div className="review-card">
            <h4>Прогресс mock</h4>
            <div style={{ fontSize: 13, color: "var(--ph-ink-3)", marginBottom: 10 }}>оценка появится после завершения</div>
            <div className="score-bars" style={{ marginTop: 0 }}>
              {rounds.map((round, index) => {
                const done = Boolean(roundAnswers[round.id]?.trim());
                return (
                <div key={round.id} className="score-bar-row">
                  <div className="nm">{round.title}</div>
                  <div className="bar"><i style={{ width: done ? "100%" : index === roundIdx ? "45%" : "0%", background: done ? "var(--ph-mint)" : "var(--ph-coral)" }}></i></div>
                  <div className="vl">{done ? "готово" : index === roundIdx ? "сейчас" : "—"}</div>
                </div>
                );
              })}
            </div>
          </div>
          <div className="review-card pim-says">
            <h4>📣 Pim шепнёт, если…</h4>
            <ul style={{ margin: "6px 0 0", paddingLeft: 18, fontSize: 14, lineHeight: 1.6 }}>
              <li>выходишь за тайминг шага (&gt; 1 мин)</li>
              <li>пропускаешь clarifying questions</li>
              <li>говоришь «мы», когда хотел «я»</li>
              <li>не назвал ни одной метрики</li>
            </ul>
          </div>
          <button className="btn lg" style={{ width: "100%" }} onClick={finishMock} disabled={rounds.some((round) => !roundAnswers[round.id]?.trim() && round.id !== cur.id) || (!roundAnswers[cur.id]?.trim() && !answer.trim())}>завершить mock → разбор</button>
        </aside>
      </div>
      )}
    </div>
  );
}

// ─── Screen: DRILL ───────────────────────────────────────────────────
function DrillScreen({ go, progress, clock, completeTask }) {
  const drillTopics = [
    {
      id: "product-sense",
      label: "Product sense",
      hint: "Фичи, пользователи, ценность, trade-offs",
      bank: {
        junior: [
          "Что такое product sense простыми словами? Ответь через пользователя, проблему и решение.",
          "Выбери primary user для приложения заметок и назови его главную боль.",
          "Придумай 2 улучшения для Spotify и объясни, какое выберешь первым.",
          "Что такое aha-moment для приложения изучения языков?",
          "Как отличить хорошую фичу от просто красивой идеи?",
          "Назови одну метрику успеха для новой функции лайков в музыкальном приложении.",
        ],
        middle: [
          "Как бы ты улучшил Google Chrome для студентов? Сегмент, боль, решение, метрика.",
          "Sub-2 sec latency vs full personalization — какой trade-off выберешь и почему?",
          "У приложения медитации низкий D7 retention. Дай 3 product sense гипотезы.",
          "Как бы ты оценил идею «stories в банковском приложении»?",
          "Выбери MVP для функции групповых плейлистов в Spotify.",
          "Какой сегмент первым брать для нового AI calendar assistant?",
        ],
        senior: [
          "Компания хочет добавить AI-assistant в mature consumer app. Как решить, стоит ли это делать?",
          "Конкурент скопировал вашу ключевую фичу. Какой продуктовый ответ выберешь?",
          "Как бы ты сформировал product principles для детского финансового приложения?",
          "Новая фича повышает engagement, но снижает доверие. Как рассуждать?",
          "Как выбрать между глубокой персонализацией и прозрачностью алгоритма?",
          "Продукт растёт, но пользователи называют его «слишком сложным». Какой product sense план?",
        ],
      },
    },
    {
      id: "metrics",
      label: "Метрики",
      hint: "NSM, funnels, guardrails, диагностика",
      bank: {
        junior: [
          "Чем activation отличается от acquisition? Дай пример.",
          "Что такое vanity metric? Назови пример для EdTech.",
          "Выбери primary metric для onboarding в fintech-приложении.",
          "Зачем нужны guardrail metrics? Объясни на примере push-уведомлений.",
          "Чем retention D1 отличается от retention D30?",
          "Какая метрика покажет, что пользователь получил первую ценность?",
        ],
        middle: [
          "Какая North Star Metric подойдёт для маркетплейса услуг и почему?",
          "Revenue растёт, retention падает. Какие 3 проверки сделаешь первыми?",
          "Придумай guardrail metrics для запуска AI-рекомендаций.",
          "Как измерить качество onboarding в B2B SaaS?",
          "Конверсия в оплату выросла, NPS упал. Как интерпретировать?",
          "Как построить metric tree для подписочного EdTech?",
        ],
        senior: [
          "NSM растёт, но unit economics ухудшается. Какой dashboard нужен PM?",
          "Как выбрать метрики для marketplace liquidity в новом городе?",
          "A/B тест улучшил primary metric, но ударил по retention через месяц. Что делать?",
          "Как отличить сезонность от реального продуктового эффекта?",
          "Какие leading indicators выберешь для enterprise SaaS с длинным sales cycle?",
          "Как бы ты пересобрал систему метрик, если команда оптимизирует локальные KPI?",
        ],
      },
    },
    {
      id: "growth",
      label: "Growth",
      hint: "Activation, referral, retention, CAC",
      bank: {
        junior: [
          "Что такое activation в growth-воронке? Приведи пример.",
          "Назови 3 способа увеличить повторное использование приложения.",
          "Чем referral отличается от paid acquisition?",
          "Как понять, что onboarding слишком длинный?",
          "Какая метрика покажет качество новых пользователей?",
          "Почему нельзя просто покупать больше трафика?",
        ],
        middle: [
          "Как бы ты искал причину падения activation после регистрации?",
          "Предложи 3 гипотезы роста repeat purchase в маркетплейсе.",
          "Какой эксперимент поставишь для referral-механики?",
          "CAC вырос на 30%. Что проверишь до предложения решения?",
          "Как отличить плохой acquisition от плохого продукта?",
          "Push-кампания подняла DAU, но не revenue. Какой следующий шаг?",
        ],
        senior: [
          "Growth-команда разгоняет acquisition, а Core-команда жалуется на качество пользователей. Как синхронизировать?",
          "Как выбрать growth loop для consumer social app?",
          "Referral даёт много пользователей с низким retention. Как решить, масштабировать ли канал?",
          "Как построить экспериментальную программу на квартал для activation?",
          "Платный канал масштабируется, но payback растёт с 6 до 15 месяцев. Что делать?",
          "Как определить, что growth-проблема на самом деле является product-market fit проблемой?",
        ],
      },
    },
    {
      id: "strategy",
      label: "Strategy",
      hint: "Сегменты, moat, build/buy/partner",
      bank: {
        junior: [
          "Что значит выбрать сегмент? Почему нельзя идти во всех сразу?",
          "Назови 3 вопроса перед запуском продукта на новом рынке.",
          "Чем стратегия отличается от roadmap?",
          "Что такое конкурентное преимущество простыми словами?",
          "Когда лучше не делать фичу, даже если пользователь просит?",
          "Как объяснить trade-off между скоростью запуска и качеством?",
        ],
        middle: [
          "Компания хочет выйти в B2B. Какие 3 вопроса задашь перед решением?",
          "Build vs partner для новой AI-фичи: как рассуждать?",
          "Как выбрать сегмент для первого запуска продукта?",
          "Конкурент копирует фичу. Что делать PM?",
          "Какие trade-offs есть у premium-подписки в consumer app?",
          "Как оценить, стоит ли запускать продукт в новой стране?",
        ],
        senior: [
          "Продукт достиг плато роста. Как выбрать следующий стратегический bet?",
          "Как решить, строить ли platform capability внутри компании?",
          "Два сегмента прибыльные, но требуют разных продуктов. Как выбрать?",
          "Какой moat может быть у AI productivity app и как его усилить?",
          "Стоит ли каннибализировать текущую выручку новым self-serve продуктом?",
          "Как сформулировать where to play / how to win для B2B SaaS?",
        ],
      },
    },
    {
      id: "discovery",
      label: "Discovery",
      hint: "Интервью, JTBD, problem space",
      bank: {
        junior: [
          "Что такое problem interview и чем оно отличается от продажи идеи?",
          "Назови 3 плохих вопроса для интервью пользователя.",
          "Как понять, что боль пользователя достаточно сильная?",
          "Что такое JTBD простыми словами?",
          "Почему прошлое поведение надёжнее обещаний о будущем?",
          "Как сформулировать problem statement для приложения привычек?",
        ],
        middle: [
          "Как бы ты провёл discovery для функции совместного бюджета в банке?",
          "Пользователи говорят «нужны уведомления». Как проверить реальную проблему?",
          "Какие сигналы покажут, что opportunity стоит брать в roadmap?",
          "Как сегментировать пользователей не по демографии, а по jobs?",
          "Что делать, если интервью и аналитика противоречат друг другу?",
          "Как построить Opportunity Solution Tree для падения activation?",
        ],
        senior: [
          "Как встроить continuous discovery в команду, которая живёт релизами?",
          "Sales требует enterprise-фичу для крупного клиента. Как провести discovery без потери фокуса?",
          "Как выбрать между несколькими opportunity areas с неполными данными?",
          "Как доказать leadership, что команде нужно 2 недели discovery до delivery?",
          "Какие discovery-артефакты реально помогают decision-making, а какие являются театром?",
          "Как организовать research cadence для multi-sided marketplace?",
        ],
      },
    },
    {
      id: "execution",
      label: "Execution",
      hint: "Roadmap, запуск, риски, RCA",
      bank: {
        junior: [
          "Что должно быть в хорошем PRD?",
          "Чем roadmap отличается от списка фич?",
          "Как PM понимает, что фича готова к запуску?",
          "Что такое rollout и зачем запускать поэтапно?",
          "Назови 3 риска запуска новой функции.",
          "Как объяснить engineering, зачем нужна метрика успеха?",
        ],
        middle: [
          "Метрика упала после релиза. Какие первые 5 проверок сделаешь?",
          "Как подготовить launch plan для новой функции оплаты?",
          "Как приоритизировать баг, технический долг и новую фичу?",
          "Что включить в pre-mortem перед крупным релизом?",
          "Как синхронизировать roadmap между design, engineering и sales?",
          "Команда не успевает к дедлайну. Какой trade-off предложишь?",
        ],
        senior: [
          "Как построить operating cadence для команды из 4 squads?",
          "Запуск провалился: adoption низкий, но feedback хороший. Как диагностировать?",
          "Как удержать стратегический roadmap, когда enterprise sales постоянно меняет приоритеты?",
          "Как решить конфликт между reliability work и growth roadmap?",
          "Какие launch gates нужны для regulated fintech продукта?",
          "Как понять, что execution-проблема на самом деле является strategy-проблемой?",
        ],
      },
    },
  ];
  const drillLevels = [
    { id: "junior", label: "Junior", desc: "база и простые кейсы" },
    { id: "middle", label: "Middle", desc: "диагностика и trade-offs" },
    { id: "senior", label: "Senior", desc: "стратегия и неоднозначность" },
  ];
  const getTopicBank = (item, level) => item.bank?.[level] || item.bank?.middle || [];
  const [topicId, setTopicId] = useState("product-sense");
  const [levelId, setLevelId] = useState("middle");
  const [questions, setQuestions] = useState(getTopicBank(drillTopics[0], "middle"));
  const [qIdx, setQIdx] = useState(0);
  const [paused, setPaused] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(60);
  const [stats, setStats] = useState({ clean: 0, shaky: 0, missed: 0 });
  const [answer, setAnswer] = useState("");
  const [feedback, setFeedback] = useState("");
  const [checking, setChecking] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [checkedText, setCheckedText] = useState("");
  const topic = drillTopics.find((item) => item.id === topicId) || drillTopics[0];
  const level = drillLevels.find((item) => item.id === levelId) || drillLevels[1];
  const total = questions.length;
  const currentQuestion = questions[qIdx % questions.length];

  useEffect(() => {
    if (paused) return undefined;
    const timer = setInterval(() => {
      setSecondsLeft((value) => {
        if (value > 1) return value - 1;
        setStats((prev) => ({ ...prev, missed: prev.missed + 1 }));
      setQIdx((idx) => (idx < total - 1 ? idx + 1 : idx));
        setAnswer("");
        setFeedback("Время вышло: засчитала как «не успел». Следующий вопрос уже открыт.");
        setCheckedText("");
        return 60;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [paused, total]);

  const parseQuestions = (raw) => {
    const match = raw.match(/\[[\s\S]*\]/);
    const parsed = JSON.parse(match ? match[0] : raw);
    return parsed.map((item) => (typeof item === "string" ? item : item.question)).filter(Boolean).slice(0, 10);
  };

  const generateQuestions = async (nextTopic = topic) => {
    setGenerating(true);
    setFeedback("");
    try {
      const res = await api.coach({
        stepId: "drill-generate",
        stepTitle: `Drill questions: ${nextTopic.label} · ${level.label}`,
        stepDescription: "Сгенерируй короткие вопросы для 60-секундного PM drill.",
        frameworks: [nextTopic.label, level.label, "PM interview", "Product thinking"],
        caseHint: "Ответь только JSON-массивом из 10 строк. Без markdown.",
        caseText: `Тема drill: ${nextTopic.label}. Уровень: ${level.label} (${level.desc}).`,
        answerText: "",
        userMessage: `Сгенерируй 10 разных коротких вопросов на тему ${nextTopic.label} для уровня ${level.label}. Junior = простые базовые вопросы, Middle = диагностика и trade-offs, Senior = стратегия, неоднозначность, ownership. Каждый вопрос должен проверять reasoning, метрики или trade-offs.`,
        chatHistory: [],
        previousAnswers: {},
        trackId: "product",
      });
      const nextQuestions = parseQuestions(res.message);
      setQuestions(nextQuestions.length ? nextQuestions : getTopicBank(nextTopic, level.id));
      setQIdx(0);
      setSecondsLeft(60);
      setAnswer("");
      setCheckedText("");
      setFeedback("AI сгенерировал новый набор вопросов.");
    } catch {
      setQuestions(getTopicBank(nextTopic, level.id));
      setFeedback("AI не ответил, включил локальный набор вопросов по теме.");
    } finally {
      setGenerating(false);
    }
  };

  const selectTopic = (id) => {
    const nextTopic = drillTopics.find((item) => item.id === id) || drillTopics[0];
    setTopicId(nextTopic.id);
    setQuestions(getTopicBank(nextTopic, levelId));
    setQIdx(0);
    setSecondsLeft(60);
    setAnswer("");
    setCheckedText("");
    setFeedback("");
    generateQuestions(nextTopic);
  };

  const selectLevel = (id) => {
    const nextLevel = drillLevels.find((item) => item.id === id) || drillLevels[1];
    setLevelId(nextLevel.id);
    setQuestions(getTopicBank(topic, nextLevel.id));
    setQIdx(0);
    setSecondsLeft(60);
    setAnswer("");
    setCheckedText("");
    setFeedback("");
  };

  const checkAnswer = async () => {
    const clean = answer.trim();
    if (!clean || checking || clean === checkedText) return;
    setChecking(true);
    setCheckedText(clean);
    try {
      const res = await api.coach({
        stepId: "drill-check",
        stepTitle: currentQuestion,
        stepDescription: "Проверь короткий ответ на PM drill. Верни краткий вердикт.",
        frameworks: [topic.label, level.label, "PM interview", "60-second drill"],
        caseHint: "Формат: ✅ Чисто / ⚠️ Под вопросом / ✕ Не успел, затем 1 короткая причина и 1 улучшение.",
        caseText: currentQuestion,
        answerText: clean,
        userMessage: clean,
        chatHistory: [],
        previousAnswers: {},
        trackId: "product",
      });
      const verdict = /чисто|✅|strong|сильно/i.test(res.message)
        ? "clean"
        : /не успел|слабо|✕|плохо/i.test(res.message)
          ? "missed"
          : "shaky";
      setStats((prev) => ({ ...prev, [verdict]: prev[verdict] + 1 }));
      setFeedback(res.message);
    } catch {
      // Без AI честно не оцениваем качество: засчитываем как «отвечено», но без вердикта.
      setStats((prev) => ({ ...prev, shaky: prev.shaky + 1 }));
      setFeedback("AI-проверка недоступна (возможно, бэкенд просыпается — до 30 сек). Ответ засчитан как «отвечено», но без оценки качества. Сверься с чеклистом: цель → сегмент → решение → метрика/риск.");
    } finally {
      setChecking(false);
    }
  };

  const finishQuestion = (kind = "clean") => {
    if (kind === "missed" && !checkedText) setStats((prev) => ({ ...prev, missed: prev.missed + 1 }));
    if (qIdx < total - 1) {
      setQIdx(qIdx + 1);
      setSecondsLeft(60);
      setAnswer("");
      setFeedback("");
      setCheckedText("");
    } else {
      const answered = stats.clean + stats.shaky + (checkedText ? 1 : 0);
      if (answered >= Math.ceil(total / 2)) completeTask(`drill-${topic.id}-${level.id}`, 50, "review");
      else setFeedback("Ответь хотя бы на половину вопросов, чтобы завершить drill и получить разбор.");
    }
  };
  return (
    <div className="screen">
      <Topbar crumbs={["Home", `Drill 60s · ${topic.label}`]} progress={progress} clock={clock} />
      <div className="screen-head">
        <div>
          <span className="eyebrow">Drill · {total} вопросов · {level.label} · ⏱ 60 сек каждый</span>
          <h1>Drill-режим: {topic.label} ⚡</h1>
        </div>
        <div className="right">
          <span className="chip mint">+5 XP / правильный</span>
          <button className="btn ghost sm" onClick={() => setPaused(!paused)}>{paused ? "продолжить" : "пауза"}</button>
        </div>
      </div>
      <div className="drill-stage">
        <div className="drill-config-panel">
          <div>
            <span className="drill-config-label">Тема</span>
            <div className="drill-topic-row">
              {drillTopics.map((item) => (
                <button key={item.id} className={`drill-topic ${topicId === item.id ? "active" : ""}`} onClick={() => selectTopic(item.id)} disabled={generating}>
                  <strong>{item.label}</strong>
                  <small>{item.hint}</small>
                </button>
              ))}
            </div>
          </div>
          <div>
            <span className="drill-config-label">Уровень</span>
            <div className="drill-level-row">
              {drillLevels.map((item) => (
                <button key={item.id} className={`drill-level ${levelId === item.id ? "active" : ""}`} onClick={() => selectLevel(item.id)} disabled={generating}>
                  <strong>{item.label}</strong>
                  <small>{item.desc}</small>
                </button>
              ))}
            </div>
          </div>
          <button className="drill-topic generate" onClick={() => generateQuestions(topic)} disabled={generating}>
            {generating ? "AI думает..." : "+ AI вопросы под выбор"}
          </button>
        </div>
        <div className="drill-progress-row">
          {Array.from({ length: total }).map((_, i) => (
            <div key={i} className={`seg ${i < qIdx ? "done" : ""} ${i === qIdx ? "now" : ""}`}></div>
          ))}
        </div>
        <div className="drill-card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <span className="chip" style={{ background: "rgba(255,255,255,0.18)", border: "1.5px solid #fff", color: "#fff" }}>Вопрос {qIdx + 1} / {total}</span>
            <div className="drill-timer-ring" style={{ background: paused ? "var(--ph-sun-2)" : "#fff", color: "var(--ph-ink)" }}>{secondsLeft}</div>
          </div>
          <h2>{currentQuestion}</h2>
          <p>{paused ? "пауза включена" : "пиши коротко: структура, причина, метрика или trade-off. Нажми «проверить» или Enter, когда готов(а)."}</p>
          <div className="drill-answer-row">
            <input
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") checkAnswer(); }}
              placeholder="Например: 1) выберу сегмент... 2) метрика... 3) риск..."
              disabled={paused || checking}
            />
            <button className="btn lg" style={{ background: "#fff", color: "var(--ph-ink)" }} onClick={checkAnswer} disabled={checking || !answer.trim()}>
              {checking ? "проверяю" : "проверить"}
            </button>
          </div>
          {feedback && <div className="drill-feedback">{feedback}</div>}
          <div style={{ marginTop: 18, display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
            <button className="btn lg" style={{ background: "var(--ph-ink)", color: "#fff", borderColor: "#fff" }} onClick={() => finishQuestion("missed")}>пропустить</button>
            <button className="btn lg" style={{ background: "#fff", color: "var(--ph-ink)" }} onClick={() => finishQuestion()} disabled={!checkedText}>дальше →</button>
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
          <div className="review-card">
            <h4>✓ Чисто</h4>
            <div className="h-display" style={{ fontSize: 36, color: "var(--ph-mint)" }}>{stats.clean}</div>
          </div>
          <div className="review-card">
            <h4>⚠ Под вопросом</h4>
            <div className="h-display" style={{ fontSize: 36, color: "var(--ph-sun)" }}>{stats.shaky}</div>
          </div>
          <div className="review-card">
            <h4>✕ Не успел</h4>
            <div className="h-display" style={{ fontSize: 36, color: "var(--ph-ink-4)" }}>{stats.missed}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Screen: TEACH ───────────────────────────────────────────────────
function TeachScreen({ go, progress, clock, completeTask, initialTopicId = "nsm" }) {
  const topics = KNOWLEDGE_NOTES.map((note) => ({
    id: note.id,
    title: note.t,
    prompt: `Объясни «${note.t}» стажёру`,
    rookie: note.rookie,
    hints: note.hints,
    cat: note.cat,
    excerpt: note.ex,
  }));
  const [topicId, setTopicId] = useState(initialTopicId);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const topic = topics.find((item) => item.id === topicId) || topics[0];
  const [messages, setMessages] = useState([{ role: "rookie", text: topics.find((item) => item.id === "nsm")?.rookie || topics[0].rookie }]);
  const answerCount = messages.filter((m) => m.role === "you").length;
  // Засчитываем только содержательные объяснения (не «ааа»), чтобы XP/карточка были за реальную практику.
  const meaningfulAnswers = messages.filter((m) => m.role === "you" && m.text.trim().length >= 40).length;
  const canFinish = meaningfulAnswers >= 2;
  useEffect(() => {
    const nextTopic = topics.find((item) => item.id === initialTopicId) || topics[0];
    setTopicId(nextTopic.id);
    setMessages([{ role: "rookie", text: nextTopic.rookie }]);
    setInput("");
  }, [initialTopicId]);
  const selectTopic = (id) => {
    const nextTopic = topics.find((item) => item.id === id) || topics[0];
    setTopicId(nextTopic.id);
    setMessages([{ role: "rookie", text: nextTopic.rookie }]);
    setInput("");
  };
  const switchTopic = () => {
    const index = topics.findIndex((item) => item.id === topic.id);
    selectTopic(topics[(index + 1) % topics.length].id);
  };
  const sendTeach = async () => {
    const answer = input.trim();
    if (!answer || busy) return;
    const nextMessages = [...messages, { role: "you", text: answer }];
    setMessages(nextMessages);
    setInput("");
    setBusy(true);
    try {
      const res = await api.coach({
        stepId: "teach-rookie",
        stepTitle: topic.prompt,
        stepDescription: "Пользователь в роли senior PM объясняет концепцию стажёру. Ответь только как стажёр Тима: короткая реакция и следующий наивный или каверзный вопрос.",
        frameworks: [topic.title, "Feynman technique", "Product management"],
        caseHint: "Не оценивай пользователя как ментор. Не давай лекцию. Пиши от первого лица стажёра. 1-3 предложения, в конце один вопрос. Русский язык.",
        caseText: `Тема обучения: ${topic.title}`,
        answerText: answer,
        userMessage: `Я объяснил стажёру: ${answer}. Теперь задай следующий вопрос стажёра по теме ${topic.title}.`,
        chatHistory: nextMessages.slice(-8),
        previousAnswers: {},
        trackId: "product",
      });
      setMessages([...nextMessages, { role: "rookie", text: res.message || "Кажется понятнее. А можешь привести пример из реального продукта?" }]);
    } catch {
      setMessages([...nextMessages, { role: "rookie", text: "Понял. А можешь теперь привести пример и одну метрику, по которой видно, что это работает?" }]);
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="screen">
      <Topbar crumbs={["Home", "Teach the Rookie"]} progress={progress} clock={clock} />
      <div className="screen-head">
        <div>
          <span className="eyebrow">Feynman-режим · 12 мин · +50 XP</span>
          <h1>{topic.prompt}</h1>
        </div>
        <div className="right">
          <span className="chip plum">🐣 Rookie: «Тима»</span>
          <button className="btn ghost sm" onClick={switchTopic}>сменить тему</button>
        </div>
      </div>
      <div className="teach-stage">
        <div className="teach-chat">
          <div className="teach-topic-picker">
            <div>
              <span className="eyebrow">тема из уроков</span>
              <strong>{topic.title}</strong>
            </div>
            <select value={topicId} onChange={(e) => selectTopic(e.target.value)}>
              {topics.map((item) => (
                <option key={item.id} value={item.id}>{item.title}</option>
              ))}
            </select>
          </div>
          <div className="lesson-callout">
            <div className="ico">🎯</div>
            <div>
              <h4>Цель сессии</h4>
              <p>Тима просит объяснить выбранный урок: {topic.excerpt} Ты отвечаешь как senior PM: просто, структурно, с примером. После каждого ответа Тима задаёт следующий вопрос.</p>
            </div>
          </div>
          {messages.map((m, i) => (
            <div key={i} className={m.role === "you" ? "you-msg" : "rookie-msg"}>
              <div className={m.role === "you" ? "you-av" : "rookie-av"}>{m.role === "you" ? "К" : "🐣"}</div>
              <div className="chat-bubble">{m.text}</div>
            </div>
          ))}
          {busy && (
            <div className="rookie-msg">
              <div className="rookie-av">🐣</div>
              <div className="chat-bubble">думаю над твоим объяснением…</div>
            </div>
          )}
          <div className="chat-compose">
            <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") sendTeach(); }} placeholder="Объясни на пальцах…" />
            <button className="btn primary sm" onClick={sendTeach} disabled={busy || !input.trim()}>отправить →</button>
          </div>
        </div>
        <aside className="teach-sidebar">
          <div className="teach-gaps">
            <h5>🔎 Что Pim замечает</h5>
            {answerCount === 0 ? (
              <div className="gap-row"><b>старт</b><span>ответь на первый вопрос Тимы — после этого начну подсвечивать пробелы</span></div>
            ) : (
              <>
                <div className="gap-row"><b>диалог</b><span>ответов senior: {answerCount}</span></div>
                <div className="gap-row"><b>фокус</b><span>{topic.hints[Math.min(answerCount - 1, topic.hints.length - 1)]}</span></div>
                <div className="gap-row"><b>сильно</b><span>строй ответ: тезис → пример → проверка понимания</span></div>
              </>
            )}
          </div>
          <div className="review-card">
            <h4>Подсказки тебе</h4>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {topic.hints.map((hint, i) => (
                <span key={hint} className={`chip ${["pink", "mint", "sun"][i % 3]}`}>{hint}</span>
              ))}
            </div>
          </div>
          <div className="review-card pim-says">
            <h4>Pim говорит</h4>
            <p style={{ margin: 0, fontSize: 14, color: "rgba(255,255,255,0.9)" }}>
              «Сейчас это не заготовленный чат. Диалог строится по твоим ответам: объясни как senior, а Тима уточнит слабое место.»
            </p>
          </div>
          <button className="btn lg" style={{ width: "100%" }} disabled={!canFinish || busy} onClick={() => completeTask(`teach-${topic.id}`, 50, "review", { cardsDue: progress.cardsDue + 1 })}>
            {!canFinish ? `ещё ${2 - meaningfulAnswers} развёрнутых объяснени(я) до разбора` : "завершить → разбор"}
          </button>
        </aside>
      </div>
    </div>
  );
}

// ─── Screen: REVIEW ──────────────────────────────────────────────────
function ReviewScreen({ go, progress, clock, completeTask }) {
  const completedKeys = Object.keys(progress.completed || {});
  const completedLessons = KNOWLEDGE_NOTES.filter((note) => progress.completed?.[`lesson-${note.id}`]);
  const checkedLessons = KNOWLEDGE_NOTES.filter((note) => progress.completed?.[`check-${note.id}`]);
  const practicedLessons = KNOWLEDGE_NOTES.filter((note) => progress.completed?.[`teach-${note.id}`]);
  const hasRealPractice = completedKeys.some((key) => key.startsWith("check-") || key.startsWith("teach-") || key.startsWith("mock-") || key.startsWith("case-") || key.startsWith("drill-"));
  const drillDone = completedKeys.some((key) => key.startsWith("drill-"));
  const mockDone = completedKeys.some((key) => key.startsWith("mock-"));
  const caseDone = completedKeys.some((key) => key.startsWith("case-"));
  const score = Math.min(10, Math.max(0, Math.round((checkedLessons.length * 0.7 + practicedLessons.length * 1.3 + Number(drillDone) + Number(mockDone) + Number(caseDone)) * 10) / 10));
  const CATEGORY_LABELS = { beginner: "База PM", framework: "Фреймворки", metrics: "Метрики", design: "Product design", behavioral: "Behavioral", sysdesign: "System design" };
  const categoryStats = Object.keys(CATEGORY_LABELS)
    .map((cat) => {
      const inCat = KNOWLEDGE_NOTES.filter((n) => n.cat === cat);
      const mastered = inCat.filter((n) => progress.completed?.[`check-${n.id}`] || progress.completed?.[`teach-${n.id}`]).length;
      return { cat, label: CATEGORY_LABELS[cat], total: inCat.length, mastered, pct: inCat.length ? Math.round((mastered / inCat.length) * 100) : 0 };
    })
    .filter((c) => c.total > 0)
    .sort((a, b) => a.pct - b.pct);
  const weakest = categoryStats[0];
  if (!hasRealPractice) {
    return (
      <div className="screen">
        <Topbar crumbs={["Home", "Score"]} progress={progress} clock={clock} />
        <div className="screen-head">
          <div>
            <span className="eyebrow">Score · пока без фейковой оценки</span>
            <h1>Здесь появится разбор, когда ты пройдёшь практику.</h1>
          </div>
          <div className="right">
            <span className="chip sun">{progress.xp} XP</span>
          </div>
        </div>
        <div className="review-stage">
          <div className="score-hero">
            <div style={{ display: "flex", justifyContent: "space-between", gap: 20, alignItems: "center" }}>
              <div>
                <div className="eyebrow">текущий статус</div>
                <div className="score-num" style={{ fontSize: 70 }}>0.0</div>
                <div className="score-sub">оценка появится после Check, Teach, Drill, Mock или кейса</div>
              </div>
              <PimFigure size={130} expression="teach" />
            </div>
            <div className="score-bars">
              {[
                { n: "Теория", v: completedLessons.length, max: KNOWLEDGE_NOTES.length, c: "var(--ph-sun)" },
                { n: "Check · MCQ", v: checkedLessons.length, max: KNOWLEDGE_NOTES.length, c: "var(--ph-mint)" },
                { n: "Teach Rookie", v: practicedLessons.length, max: KNOWLEDGE_NOTES.length, c: "var(--ph-coral)" },
              ].map(r => (
                <div key={r.n} className="score-bar-row">
                  <div className="nm">{r.n}</div>
                  <div className="bar tall"><i style={{ width: `${Math.min(100, (r.v / r.max) * 100)}%`, background: r.c }}></i></div>
                  <div className="vl">{r.v}/{r.max}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="review-side">
            <div className="review-card pim-says">
              <h4>Pim говорит</h4>
              <p style={{ fontSize: 15, lineHeight: 1.5 }}>
                «Ты права: я не должен показывать разбор, которого ещё не было. Начни с урока, потом Check — и я соберу честный score.»
              </p>
            </div>
            <div className="next-row">
              <button className="btn primary lg" style={{ flex: 1 }} onClick={() => go("library")}>к урокам →</button>
            </div>
            <div className="next-row">
              <button className="btn ghost" style={{ flex: 1 }} onClick={() => go("check")}>Check · MCQ</button>
              <button className="btn ghost" style={{ flex: 1 }} onClick={() => go("mock")}>Mock с AI</button>
            </div>
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="screen">
      <Topbar crumbs={["Home", "Кейс", "Разбор"]} progress={progress} clock={clock} />
      <div className="screen-head">
        <div>
          <span className="eyebrow">Разбор · 5 мин чтения · +30 XP за прохождение</span>
          <h1>Готово. Pim разобрал твой ответ.</h1>
        </div>
        <div className="right">
          <span className="chip mint">🔥 стрик {progress.streak}</span>
          <span className="chip sun">{progress.xp} XP</span>
        </div>
      </div>
      <div className="review-stage">
        <div>
          <div className="score-hero">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <div className="eyebrow">общая оценка</div>
                <div className="score-num">{score.toFixed(1)}</div>
                <div className="score-sub">из 10 · это не балл за качество ответов, а индекс активности по практикам</div>
              </div>
              <div style={{ marginRight: -10, marginTop: -10 }}>
                <PimFigure size={120} expression="think" />
              </div>
            </div>
            <details style={{ marginTop: 10 }}>
              <summary style={{ cursor: "pointer", color: "var(--ph-ink-3)", fontSize: 13 }}>как считается этот балл</summary>
              <p style={{ margin: "8px 0 0", fontSize: 13, color: "var(--ph-ink-2)", lineHeight: 1.5 }}>
                Балл = 0.7 × (тем с Check) + 1.3 × (тем с Teach) + по 1 за пройденные Drill, Mock и Кейс, всё ограничено сверху 10.
                Это индекс охвата практик, а не оценка качества решений. Смотри блок «слабые зоны» ниже — он показывает, что подтянуть.
              </p>
            </details>
            <div className="score-bars">
              {[
                { n: "Теория", v: completedLessons.length, max: KNOWLEDGE_NOTES.length, c: "var(--ph-sun)" },
                { n: "Check · MCQ", v: checkedLessons.length, max: KNOWLEDGE_NOTES.length, c: "var(--ph-mint)" },
                { n: "Teach Rookie", v: practicedLessons.length, max: KNOWLEDGE_NOTES.length, c: "var(--ph-coral)" },
                { n: "Drill", v: drillDone ? 1 : 0, max: 1, c: "var(--ph-sky)" },
                { n: "Mock", v: mockDone ? 1 : 0, max: 1, c: "var(--ph-plum)" },
                { n: "Кейс", v: caseDone ? 1 : 0, max: 1, c: "var(--ph-coral)" },
              ].map(r => (
                <div key={r.n} className="score-bar-row">
                  <div className="nm">{r.n}</div>
                  <div className="bar tall"><i style={{ width: `${(r.v / r.max) * 100}%`, background: r.c }}></i></div>
                  <div className="vl">{r.v}/{r.max}</div>
                </div>
              ))}
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 20, flexWrap: "wrap" }}>
              <span className="chip pink">практик: {checkedLessons.length + practicedLessons.length}</span>
              <span className="chip mint">освоено: {practicedLessons.length}</span>
              <span className="chip sun">уроков: {completedLessons.length}</span>
            </div>
          </div>
          <div className="review-card" style={{ marginTop: 18 }}>
            <h4>Слабые зоны по темам</h4>
            <p style={{ margin: "0 0 12px", fontSize: 13, color: "var(--ph-ink-3)" }}>
              Освоение = пройден Check или объяснение стажёру. {weakest && weakest.pct < 100 ? `Подтяни сначала: ${weakest.label}.` : "Ровный прогресс по категориям — добивай оставшиеся темы."}
            </p>
            <div className="score-bars">
              {categoryStats.map((c) => (
                <div key={c.cat} className="score-bar-row">
                  <div className="nm">{c.label}</div>
                  <div className="bar tall"><i style={{ width: `${c.pct}%`, background: c.pct >= 66 ? "var(--ph-mint)" : c.pct >= 33 ? "var(--ph-sun)" : "var(--ph-coral)" }}></i></div>
                  <div className="vl">{c.mastered}/{c.total}</div>
                </div>
              ))}
            </div>
            {weakest && weakest.pct < 100 && (
              <div className="next-row" style={{ marginTop: 12 }}>
                <button className="btn ghost" onClick={() => go("library")}>открыть темы «{weakest.label}» →</button>
              </div>
            )}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginTop: 18 }}>
            <div className="review-card" style={{ background: "var(--ph-mint-2)" }}>
              <h4>Что уже сделано</h4>
              {(practicedLessons.length ? practicedLessons : checkedLessons).slice(0, 3).map((note) => (
                <div key={note.id} className="quote">
                  <span className="who">тема</span>
                  {note.t}
                  <div style={{ fontSize: 12, color: "var(--ph-ink-3)", marginTop: 4 }}>→ {progress.completed?.[`teach-${note.id}`] ? "объяснено стажёру" : "пройден Check"}</div>
                </div>
              ))}
            </div>
            <div className="review-card" style={{ background: "#ffe1e1" }}>
              <h4>Что ещё не закрыто</h4>
              {KNOWLEDGE_NOTES.filter((note) => !progress.completed?.[`teach-${note.id}`]).slice(0, 3).map((note) => (
                <div key={note.id} className="quote" style={{ borderColor: "#ff5e5e" }}>
                  <span className="who" style={{ color: "#d63333" }}>нужна практика</span>
                  {note.t}
                  <div style={{ fontSize: 12, color: "var(--ph-ink-3)", marginTop: 4 }}>→ объясни Тиме, чтобы отметить освоение.</div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="review-side">
          <div className="review-card pim-says">
            <h4>📣 Pim говорит</h4>
            <p style={{ fontSize: 15, lineHeight: 1.5 }}>
              «Теперь score не рисуется заранее. Я считаю только то, что ты реально прошла: уроки, Check, Teach, Drill и Mock.»
            </p>
          </div>
          <div className="review-card">
            <h4>Что закрепить в SRS</h4>
            <p style={{ margin: "0 0 10px", fontSize: 13, color: "var(--ph-ink-3)" }}>карточки по пройденным темам ждут в разделе «Карточки SRS»</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {(practicedLessons.length ? practicedLessons : checkedLessons).slice(0, 3).map((note) => (
                <span key={note.id} className="chip" style={{ background: "var(--ph-sun-2)", borderColor: "var(--ph-ink)" }}>● {note.t}</span>
              ))}
              {practicedLessons.length === 0 && checkedLessons.length === 0 && (
                <span className="chip" style={{ background: "var(--ph-card)", borderColor: "var(--ph-ink)" }}>пройди Check/Teach — появятся карточки</span>
              )}
            </div>
          </div>
          <div className="next-row">
            <button className="btn primary lg" style={{ flex: 1 }} onClick={() => go("mock")}>этот же кейс в mock-формате →</button>
          </div>
          <div className="next-row">
            <button className="btn ghost" style={{ flex: 1 }} onClick={() => go("srs")}>в SRS</button>
            <button className="btn ghost" style={{ flex: 1 }} onClick={() => completeTask("review-read", 30, "home")}>домой</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Screen: CV ──────────────────────────────────────────────────────
function CVScreen({ progress, clock, completeTask }) {
  const criteria = [
    { t: "Структура", d: "Подними самые релевантные PM-проекты выше education и второстепенного опыта." },
    { t: "Impact & метрики", d: "Проверь, есть ли в bullets цифры результата: uplift, пользователи, деньги или экономия времени." },
    { t: "Action verbs", d: "Замени «занимался» и «помогал» на owned-действия: launched, led, improved, reduced, validated." },
    { t: "PM fit", d: "Добавь evidence про discovery, гипотезы, приоритизацию и решения с trade-offs." },
  ];
  const [checked, setChecked] = useState({});
  const doneCount = criteria.filter((_, i) => checked[i]).length;
  const toggle = (i) => setChecked((prev) => ({ ...prev, [i]: !prev[i] }));
  return (
    <div className="screen" style={{ maxWidth: 980 }}>
      <Topbar crumbs={["Home", "Резюме"]} progress={progress} clock={clock} />
      <div className="screen-head">
        <div>
          <span className="eyebrow">Самопроверка резюме · без загрузки файла и AI</span>
          <h1>Чеклист резюме перед PM-собеседованием</h1>
        </div>
        <div className="right">
          <span className="chip mint">{doneCount}/{criteria.length} проверок</span>
        </div>
      </div>
      <div className="notice" style={{ marginBottom: 16 }}>
        Это ручной чеклист: загрузки и AI-анализа резюме пока нет. Открой своё резюме рядом и пройди 4 проверки сам(а), отмечая выполненные.
      </div>
      <div className="mcq-card">
        <div className="cv-criteria-grid">
          {criteria.map((item, i) => (
            <button
              type="button"
              key={item.t}
              className="cv-criterion"
              onClick={() => toggle(i)}
              style={{ textAlign: "left", cursor: "pointer", border: "var(--ph-b)", borderRadius: 14, padding: 16, background: checked[i] ? "var(--ph-mint-2)" : "var(--ph-card)" }}
            >
              <div className="cv-criterion-head" style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ width: 24, height: 24, borderRadius: 7, border: "var(--ph-b)", display: "flex", alignItems: "center", justifyContent: "center", background: checked[i] ? "var(--ph-mint)" : "#fff", fontWeight: 800 }}>{checked[i] ? "✓" : ""}</span>
                <b>{item.t}</b>
              </div>
              <p style={{ margin: "8px 0 0", color: "var(--ph-ink-2)" }}>{item.d}</p>
            </button>
          ))}
        </div>
        {doneCount === criteria.length && (
          <div className="lesson-callout mint" style={{ marginTop: 16 }}>
            <div className="ico">✓</div>
            <div>
              <h4>Готово</h4>
              <p>Все 4 проверки пройдены. Перечитай резюме вслух за 30 секунд: видно ли роль, impact и PM-мышление сразу.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── App router + persistent Pim ─────────────────────────────────────
const PIM_BY_ROUTE = {
  home:    { msg: "Начни с базового урока, затем проверь себя и только потом переходи к кейсам.", actions: [{ label: "Открыть уроки", on: "library" }], expression: "smile" },
  library: { msg: "Урок считается освоенным только после практики. Выбери тему и объясни её Тиме.", actions: [{ label: "Открыть SRS", on: "srs" }], expression: "wink" },
  check:   { msg: "3 вопроса. Один с подвохом. После каждого — кнопка «почему».", actions: [], expression: "think" },
  case:    { msg: "Иди по шагам слева. На каждом шаге есть кнопка «подсказка по шагу», если застрял(а).", actions: [], expression: "think" },
  mock:    { msg: "На mock я в фоне — слежу за таймингом и шепну, если выйдешь за лимит шага.", actions: [], expression: "wink", muted: true },
  drill:   { msg: "Не думай долго — это drill. Главное темп и «думаешь вслух».", actions: [], expression: "cheer" },
  teach:   { msg: "Тима задаст ещё 2-3 каверзных вопроса. Главное — не отвечать общими словами.", actions: [], expression: "teach" },
  srs:     { msg: "Честно оцени, как помнил(а). Если «Снова» — ничего страшного, лучше так, чем «легко» и забыть.", actions: [], expression: "smile" },
  review:  { msg: "Хороший разбор. Сильные стороны выписал в банк историй — пригодится в behavioral.", actions: [], expression: "cheer" },
  cv:      { msg: "Сейчас это демо-чеклист: файл не читаю, но покажу, что проверить перед отправкой.", actions: [], expression: "smile" },
};

export default function PMQuestHifi({ onExit }) {
  const [route, setRoute] = useState("home");
  const [selectedLessonTopicId, setSelectedLessonTopicId] = useState("nsm");
  const [selectedTeachTopicId, setSelectedTeachTopicId] = useState("nsm");
  const [selectedCheckTopicId, setSelectedCheckTopicId] = useState("nsm");
  const [pimOpenSignal, setPimOpenSignal] = useState(0);
  const [progress, setProgress] = useState(initialProgress);
  const [userLessons, setUserLessons] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("pmquest-user-lessons-v1") || "[]");
    } catch {
      return [];
    }
  });
  const [overlay, setOverlay] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const clock = useMoscowClock();
  const lessonTopics = [...userLessons, ...KNOWLEDGE_NOTES];
  const query = searchQuery.trim().toLowerCase();
  // Поиск по урокам + быстрые переходы в практику (Кейс/Mock), чтобы плейсхолдер не врал.
  const practiceShortcuts = [
    { id: "go-case", t: "Кейс-тренажёр", ex: "Сгенерируй и реши бизнес/продуктовый кейс по шагам.", route: "case", kw: "кейс case кейсы маркетплейс spotify банк fintech edtech генерат" },
    { id: "go-mock", t: "Mock с AI", ex: "Live или письменный разбор интервью с AI-проверкой.", route: "mock", kw: "mock мок интервью собес компания google meta uber netflix живой" },
    { id: "go-drill", t: "Drill 60s", ex: "Короткие ответы на скорость по темам PM.", route: "drill", kw: "drill дрилл скорость быстро" },
  ];
  const lessonResults = lessonTopics
    .filter((note) => query && `${note.t} ${note.ex} ${note.cat}`.toLowerCase().includes(query))
    .slice(0, 6)
    .map((note) => ({ id: note.id, t: note.t, ex: note.ex, route: "lesson", lessonId: note.id }));
  const shortcutResults = practiceShortcuts.filter((s) => query && `${s.t} ${s.kw}`.toLowerCase().includes(query));
  const searchResults = [...shortcutResults, ...lessonResults].slice(0, 8);

  useEffect(() => {
    localStorage.setItem("pmquest-progress-v1", JSON.stringify(progress));
  }, [progress]);

  useEffect(() => {
    localStorage.setItem("pmquest-user-lessons-v1", JSON.stringify(userLessons));
  }, [userLessons]);

  useEffect(() => {
    const openSearch = () => setOverlay("search");
    const openPlan = () => setOverlay("plan");
    const openGoal = () => setOverlay("goal");
    window.addEventListener("pmquest-open-search", openSearch);
    window.addEventListener("pmquest-open-plan", openPlan);
    window.addEventListener("pmquest-open-goal", openGoal);
    return () => {
      window.removeEventListener("pmquest-open-search", openSearch);
      window.removeEventListener("pmquest-open-plan", openPlan);
      window.removeEventListener("pmquest-open-goal", openGoal);
    };
  }, []);

  const go = (r, options = {}) => {
    if (options.lessonTopicId) setSelectedLessonTopicId(options.lessonTopicId);
    if (options.teachTopicId) setSelectedTeachTopicId(options.teachTopicId);
    if (options.checkTopicId) setSelectedCheckTopicId(options.checkTopicId);
    setRoute(r);
    document.querySelector(".pmq-hifi .canvas")?.scrollTo(0, 0);
  };

  const completeTask = (key, xp, nextRoute, patch = {}) => {
    setProgress((prev) => {
      const alreadyDone = Boolean(prev.completed?.[key]);
      const today = TODAY_KEY();
      const appliedPatch = alreadyDone ? {} : patch;
      return {
        ...prev,
        ...appliedPatch,
        xp: alreadyDone ? prev.xp : prev.xp + xp,
        streak: prev.lastActiveDate === today ? prev.streak : prev.streak + 1,
        lastActiveDate: today,
        completed: { ...prev.completed, [key]: true },
      };
    });
    go(nextRoute);
  };

  const addLesson = ({ title, summary, cat }) => {
    const id = `custom-${Date.now()}`;
    setUserLessons((items) => [
      {
        id,
        t: title,
        ex: summary,
        cat,
        c: "is-sky",
        s: 0,
        isCustom: true,
        rookie: `Я хочу разобраться в теме «${title}». С чего начать и где это пригодится PM?`,
        hints: ["объясни тему простыми словами", "дай продуктовый пример", "назови способ проверки"],
      },
      ...items,
    ]);
  };
  const finishOnboarding = () => {
    setProgress((prev) => ({ ...prev, onboarded: true }));
    go("lesson", { lessonTopicId: "pm-role-101" });
  };

  const shared = {
    progress,
    clock,
    completeTask,
    updateProgress: setProgress,
  };

  const screens = {
    home:    <HomeScreen go={go} openPim={() => setPimOpenSignal((v) => v + 1)} {...shared} />,
    library: <LibraryScreen go={go} notes={lessonTopics} onAddLesson={addLesson} {...shared} />,
    lesson:  <LessonScreen go={go} notes={lessonTopics} initialTopicId={selectedLessonTopicId} {...shared} />,
    check:   <CheckScreen go={go} initialTopicId={selectedCheckTopicId} {...shared} />,
    srs:     <SRSScreen go={go} {...shared} />,
    case:    <CaseScreen go={go} {...shared} />,
    mock:    <MockScreen go={go} {...shared} />,
    drill:   <DrillScreen go={go} {...shared} />,
    teach:   <TeachScreen go={go} initialTopicId={selectedTeachTopicId} {...shared} />,
    review:  <ReviewScreen go={go} {...shared} />,
    cv:      <CVScreen go={go} {...shared} />,
  };
  const pim = PIM_BY_ROUTE[route] || PIM_BY_ROUTE.home;
  const pimActions = (pim.actions || []).map(a => ({
    label: a.label,
    on: a.on ? () => go(a.on) : () => {},
  }));

  return (
    <div className="pmq-hifi">
      {onExit && (
        <button className="pmq-hifi-exit" onClick={onExit}>← Выйти из Hi-Fi</button>
      )}
      <div className="app">
        <Sidebar route={route} go={go} progress={progress} />
        <main className="canvas">
          {screens[route] || screens.home}
        </main>
        <Pim
          message={pim.msg}
          actions={pimActions}
          expression={pim.expression}
          muted={pim.muted}
          route={route}
          progress={progress}
          openSignal={pimOpenSignal}
        />
        {!progress.onboarded && (
          <div className="pmq-modal-backdrop">
            <section className="pmq-modal pmq-onboarding">
              <span className="eyebrow">первый вход · 1 минута</span>
              <h2>Освой PM-теорию и научись проходить собеседования</h2>
              <p>Здесь не нужно знать термины заранее. Начнём с роли PM, затем закрепим знания вопросами и постепенно дойдём до mock-интервью.</p>
              <div className="pmq-onboarding-grid">
                <article><b>1. Теория</b><span>Короткие уроки от основ к фреймворкам.</span></article>
                <article><b>2. Практика</b><span>Check, объяснение стажёру и кейсы.</span></article>
                <article><b>3. Собеседование</b><span>Mock с AI и разбор зон роста.</span></article>
              </div>
              <button className="btn primary lg" onClick={finishOnboarding}>начать с первого урока →</button>
            </section>
          </div>
        )}
        {overlay && (
          <div className="pmq-modal-backdrop" onClick={() => setOverlay(null)}>
            <section className="pmq-modal pmq-global-modal" onClick={(event) => event.stopPropagation()}>
              <div className="pmq-modal-head">
                <div>
                  <span className="eyebrow">{overlay === "search" ? "быстрый поиск" : overlay === "plan" ? "маршрут подготовки" : "цель"}</span>
                  <h3>{overlay === "search" ? "Найти тему" : overlay === "plan" ? "План на ближайшие шаги" : "Junior PM interview"}</h3>
                </div>
                <button className="btn ghost sm" onClick={() => setOverlay(null)}>×</button>
              </div>
              {overlay === "search" && (
                <>
                  <label className="pmq-field">
                    <span>Урок, тема или практика (Кейс / Mock / Drill)</span>
                    <input autoFocus value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Например: retention, STAR, JTBD, кейс, mock" />
                  </label>
                  <div className="pmq-search-results">
                    {!searchQuery.trim() && <p>Начни вводить тему или «кейс»/«mock». Открою подходящий урок или тренажёр.</p>}
                    {searchQuery.trim() && searchResults.length === 0 && <p>Ничего не найдено. Добавь свой урок в библиотеке.</p>}
                    {searchResults.map((item) => (
                      <button key={item.id} onClick={() => { setOverlay(null); setSearchQuery(""); item.route === "lesson" ? go("lesson", { lessonTopicId: item.lessonId }) : go(item.route); }}>
                        <strong>{item.t}</strong>
                        <span>{item.ex}</span>
                      </button>
                    ))}
                  </div>
                </>
              )}
              {overlay === "plan" && (
                <div className="pmq-plan-list">
                  {[
                    ["1", "Урок", "Выбери одну тему из слабого места недели.", "library"],
                    ["2", "Check · MCQ", "Ответь на вопросы и разбери ошибки.", "check"],
                    ["3", "Drill 60s", "Потренируй короткие ответы вслух.", "drill"],
                    ["4", "Mock с AI", "Пройди интервью целиком и получи score.", "mock"],
                  ].map(([num, title, text, target]) => (
                    <button key={num} onClick={() => { setOverlay(null); go(target); }}>
                      <span>{num}</span>
                      <div><strong>{title}</strong><p>{text}</p></div>
                    </button>
                  ))}
                </div>
              )}
              {overlay === "goal" && (
                <div className="pmq-goal-card">
                  <p>Цель: подготовиться к Junior PM-интервью за 54 дня через короткий ежедневный цикл.</p>
                  <div><b>Каждый день</b><span>1 урок → 1 Check → 1 практика</span></div>
                  <div><b>Каждую неделю</b><span>1 Mock с AI → разбор Score → корректировка слабого места</span></div>
                  <button className="btn primary lg" onClick={() => { setOverlay(null); go("library"); }}>начать с урока</button>
                </div>
              )}
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
