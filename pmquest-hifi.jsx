import React, { useEffect, useMemo, useState } from 'react';
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
    return { xp: 1240, streak: 7, completed: {}, cases: 3, cardsDue: 8, ...saved };
  } catch {
    return { xp: 1240, streak: 7, completed: {}, cases: 3, cardsDue: 8 };
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
    { k: "library", label: "Конспекты",     ico: Icon.vault,  group: "main", badge: "12" },
    { k: "lesson",  label: "Урок",          ico: Icon.book,   group: "learn" },
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
            <div key={it.k} className={`sb-item ${route === it.k ? "active" : ""}`} onClick={() => go(it.k)}>
              <span className="ico">{it.ico}</span>
              <span>{it.label}</span>
              {it.badge && <span className="badge">{it.badge}</span>}
            </div>
          ))}
        </React.Fragment>
      ))}
      <div className="sb-profile">
        <div className="av">К</div>
        <div>
          <div className="who">Катя</div>
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
      <div className="search">{Icon.search}<span>поиск кейсов, тем, компаний</span></div>
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
  const levelProgress = getLevelProgress(progress.xp);
  const week = ["Пн","Вт","Ср","Чт","Пт","Сб","Вс"];
  const todayIdx = (new Date().getDay() + 6) % 7;
  return (
    <div className="screen" style={{ maxWidth: "none" }}>
      <Topbar crumbs={["PMQuest", "Home"]} progress={progress} clock={clock} />
      <div className="screen-head" style={{ marginBottom: 18 }}>
        <div>
          <span className="eyebrow">{clock.label} · 6 неделя подготовки</span>
          <h1 style={{ marginTop: 4 }}>Привет, Катя <span style={{ color: "var(--ph-coral)" }}>✦</span></h1>
        </div>
        <div className="right">
          <button className="btn ghost sm">Мой план</button>
          <button className="btn ghost sm">🎯 Junior PM @ FAANG · 54 дн.</button>
        </div>
      </div>

      <div className="bento">
        <div className="tile t-mission is-coral" onClick={() => go("lesson")}>
          <span className="corner-ico">миссия дня · 35 мин</span>
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 14, paddingTop: 18, paddingRight: 130, position: "relative", zIndex: 2 }}>
            <span className="chip" style={{ background: "rgba(255,255,255,0.18)", color: "#fff", border: "1.5px solid #fff", width: "fit-content" }}>FAANG product design · слабое место недели</span>
            <h3 className="h-display" style={{ fontSize: 38, color: "#fff", margin: 0, maxWidth: "16ch" }}>Сегодня: «Spotify — фича лайков»</h3>
            <p style={{ color: "rgba(255,255,255,0.9)", fontSize: 15, maxWidth: "44ch" }}>
              1 урок (8 мин) → 3 MCQ-вопроса (3 мин) → кейс на 5 шагов (15 мин) → разбор от Pim.
            </p>
          </div>
          <div className="footer" style={{ position: "relative", zIndex: 2 }}>
            <div style={{ display: "flex", gap: 8 }}>
              <span className="chip" style={{ background: "var(--ph-sun)", borderColor: "var(--ph-ink)" }}>+120 XP</span>
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
              <div key={d + i} className={`day ${i <= todayIdx ? "on" : ""} ${i === todayIdx ? "today" : ""}`}>{d[0]}</div>
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
          <span className="corner-ico">faang bank</span>
          <h3>820 вопросов из реальных интервью</h3>
          <p>фильтры по компаниям, уровню, типу</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 6 }}>
            {[
              { c: "Google",  n: 142, col: "var(--ph-sky-2)" },
              { c: "Meta",    n: 110, col: "var(--ph-plum-2)" },
              { c: "Amazon",  n: 188, col: "var(--ph-sun-2)" },
              { c: "Apple",   n: 76,  col: "var(--ph-card-sunk)" },
              { c: "Netflix", n: 38,  col: "#ffd2d2" },
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
            <div className="bar" style={{ width: 120 }}><i style={{ width: "62%" }}></i></div>
            <button className="btn sm">{Icon.chev}</button>
          </div>
        </div>

        <div className="tile t-behav is-pink" onClick={() => go("teach")}>
          <span className="corner-ico">star · behavioral</span>
          <h3>Банк историй</h3>
          <p>30 STAR-шаблонов + твои истории</p>
          <div className="footer">
            <div className="bar" style={{ width: 120 }}><i style={{ width: "38%", background: "var(--ph-plum)" }}></i></div>
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
          <p>CIRCLES, NSM, AARM — вернулись по расписанию</p>
          <div className="footer">
            <span className="chip mint">~6 мин</span>
            <button className="btn sm primary">{Icon.play}</button>
          </div>
        </div>

        <div className="tile t-cv is-sky" onClick={() => go("cv")}>
          <span className="corner-ico">резюме</span>
          <h3>Загрузи CV — Pim даст 3 правки</h3>
          <p>PDF · DOCX · 30 сек разбор</p>
          <div className="footer">
            <span className="chip" style={{ background: "#fff", borderColor: "var(--ph-ink)" }}>📎 drop file</span>
            <button className="btn sm">{Icon.chev}</button>
          </div>
        </div>

        <div className="tile t-plan is-cream">
          <span className="corner-ico">8-недельный план</span>
          <h3>Твой roadmap к интервью</h3>
          <div className="week-rail">
            {[
              { n: "1", l: "Found.", st: "done" },
              { n: "2", l: "Cases",  st: "done" },
              { n: "3", l: "Cases+", st: "now" },
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

        <div className="tile t-com">
          <span className="corner-ico">сегодня в комьюнити</span>
          <h3>{progress.cases + 3} джуна решают тот же кейс</h3>
          <p style={{ display: "flex", gap: 8, marginTop: "auto", alignItems: "center" }}>
            <span style={{ display: "flex" }}>
              {["М","А","Л","К","+8"].map((c, i) => (
                <span key={c + i} style={{
                  width: 28, height: 28, borderRadius: "50%",
                  background: ["var(--ph-sun)","var(--ph-sky)","var(--ph-pink)","var(--ph-mint)","var(--ph-plum)"][i],
                  border: "2px solid var(--ph-ink)",
                  marginLeft: i === 0 ? 0 : -8,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontWeight: 700, fontSize: 12, color: i === 4 ? "#fff" : "var(--ph-ink)"
                }}>{c}</span>
              ))}
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Screen: LIBRARY ─────────────────────────────────────────────────
function LibraryScreen({ go, progress, clock }) {
  const [cat, setCat] = useState("all");
  const cats = [
    { k: "all",       label: "Все",                  n: 32 },
    { k: "framework", label: "Фреймворки",           n: 12 },
    { k: "metrics",   label: "Метрики & A/B",        n: 8 },
    { k: "design",    label: "Product design",       n: 6 },
    { k: "behavioral",label: "Behavioral / STAR",    n: 4 },
    { k: "sysdesign", label: "System design для PM", n: 2 },
  ];
  const notes = [
    { t: "CIRCLES для кейсов", cat: "framework", c: "is-sun",  ex: "Comprehend → Identify → Report → Cut → List → Evaluate → Summarize. 7 шагов под любой product design.", s: 3, m: true },
    { t: "North Star Metric — как выбрать", cat: "metrics",  c: "is-mint", ex: "Одна метрика, отражающая ценность для пользователя. Не выручка. Примеры: Airbnb nights booked.", s: 2 },
    { t: "RICE для приоритизации", cat: "framework", c: "is-pink", ex: "Reach × Impact × Confidence ÷ Effort. Когда применять, типичные ошибки.", s: 2 },
    { t: "AARRR (Pirate metrics)", cat: "metrics", c: "is-sky", ex: "Acquisition · Activation · Retention · Referral · Revenue. Воронка для продуктовых решений.", s: 1 },
    { t: "STAR-метод ответов", cat: "behavioral", c: "is-sun", ex: "Situation → Task → Action → Result. Что делает ответ «джуновым» и как этого избежать.", s: 1 },
    { t: "A/B тест: power & MDE", cat: "metrics", c: "is-mint", ex: "Минимально детектируемый эффект, мощность, длительность. Базовая интуиция, без формул.", s: 0 },
    { t: "Trade-off матрица", cat: "design", c: "is-pink", ex: "Как структурно объяснять компромиссы между фичами — без «зависит от».", s: 2 },
    { t: "Estimation на собесе", cat: "design", c: "is-sky", ex: "Шаги «сверху вниз» vs «снизу вверх». Где джуны теряют баллы.", s: 1 },
    { t: "Опасные слова в ответах", cat: "behavioral", c: "is-pink", ex: "«Мы», «помог», «занимался» — что слышит интервьюер и как переформулировать.", s: 3, m: true },
    { t: "System design 101 для PM", cat: "sysdesign", c: "is-sun", ex: "API gateway, очереди, кэши — что должен знать PM на собесе и где «технический потолок».", s: 0 },
    { t: "Activation events", cat: "metrics", c: "is-mint", ex: "Aha-moment, magic number — как определить и измерить.", s: 2 },
    { t: "Trade-off: latency vs cost", cat: "sysdesign", c: "is-sky", ex: "Типовой follow-up в FAANG. Как структурно отвечать.", s: 1 },
  ];
  const filtered = cat === "all" ? notes : notes.filter(n => n.cat === cat);
  return (
    <div className="screen" style={{ maxWidth: "none" }}>
      <Topbar crumbs={["PMQuest", "Конспекты"]} progress={progress} clock={clock} />
      <div className="screen-head">
        <div>
          <span className="eyebrow">Хранилище — 32 урока, конспекты собираются автоматически</span>
          <h1>Твой банк знаний</h1>
        </div>
        <div className="right">
          <button className="btn ghost">Сортировка: новые</button>
          <button className="btn primary">＋ свой конспект</button>
        </div>
      </div>
      <div className="lib-stage">
        <aside className="lib-sidebar">
          <h5>Категории</h5>
          {cats.map(c => (
            <div key={c.k} className={`lib-cat ${cat === c.k ? "active" : ""}`} onClick={() => setCat(c.k)}>
              <span>{c.label}</span>
              <span className="cnt">{c.n}</span>
            </div>
          ))}
          <h5 style={{ marginTop: 14 }}>Метки</h5>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", padding: "0 6px" }}>
            <span className="chip mint">освоено</span>
            <span className="chip sun">в SRS</span>
            <span className="chip pink">слабое место</span>
            <span className="chip sky">избранное</span>
          </div>
        </aside>
        <div className="notes-grid">
          {filtered.map((n, i) => (
            <div key={i} className={`note-card ${n.c}`} onClick={() => go("lesson")}>
              {n.m && <span className="mastered-badge">✓ освоено</span>}
              <h4>{n.t}</h4>
              <p className="excerpt">{n.ex}</p>
              <div className="nfoot">
                <span className="mono" style={{ color: "var(--ph-ink-3)" }}>{n.cat}</span>
                <span className="stars">
                  {[0,1,2,3].map(k => <i key={k} className={k < n.s ? "on" : ""}></i>)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Screen: LESSON ──────────────────────────────────────────────────
function LessonScreen({ go, progress, clock, completeTask }) {
  const [idx, setIdx] = useState(0);
  const slides = [
    { tag: "Слайд 1 · 2 мин", title: "Что такое North Star Metric?", lede: "Одна главная метрика, которая отражает ценность продукта для пользователя — а не выручку напрямую.",
      body: (
        <div className="body">
          <p>NSM — это компас. Если она растёт, продукт реально становится полезнее людям. Если падает — даже растущий доход не спасёт в долгую.</p>
          <div className="lesson-callout">
            <div className="ico">★</div>
            <div>
              <h4>Главное правило</h4>
              <p>NSM описывает реализованную <b>ценность</b>, а не активность. «10 кликов» — не NSM. «Минута, потраченная пользователем с пользой» — может быть.</p>
            </div>
          </div>
        </div>) },
    { tag: "Слайд 2 · 2 мин", title: "Зачем она нужна?", lede: "Чтобы команда из 200 человек принимала похожие решения без созвонов.",
      body: (
        <div className="body">
          <p>NSM нужна, чтобы:</p>
          <ul>
            <li><b>Сравнивать гипотезы</b> в одной системе координат («это поднимет NSM или нет?»)</li>
            <li><b>Приоритизировать roadmap</b> без политики</li>
            <li><b>Согласовать команды</b> — дизайн, инжиниринг, маркетинг смотрят на одно число</li>
          </ul>
          <div className="lesson-callout mint">
            <div className="ico">⚡</div>
            <div>
              <h4>Что говорят на интервью</h4>
              <p>«Хорошая NSM коррелирует с retention в долгую и предсказывает выручку.» — фраза, после которой джун перестаёт быть джуном.</p>
            </div>
          </div>
        </div>) },
    { tag: "Слайд 3 · 2 мин", title: "FAANG-примеры — что они выбрали", lede: "Три реальные NSM. У каждой — своя логика.",
      body: (
        <div className="body">
          <div className="faang-cards">
            <div className="faang-card spotify">
              <div className="name">Spotify</div>
              <div className="metric">Время прослушивания на активного пользователя</div>
              <p style={{ fontSize: 13, margin: "8px 0 0", color: "var(--ph-ink-2)" }}>Не клики, не лайки — а реальное «потребление продукта».</p>
            </div>
            <div className="faang-card airbnb">
              <div className="name">Airbnb</div>
              <div className="metric">Забронированных ночей</div>
              <p style={{ fontSize: 13, margin: "8px 0 0", color: "var(--ph-ink-2)" }}>Покрывает оба борта маркетплейса разом.</p>
            </div>
            <div className="faang-card facebook">
              <div className="name">Meta</div>
              <div className="metric">MAU + 7 контактов за 10 дней</div>
              <p style={{ fontSize: 13, margin: "8px 0 0", color: "var(--ph-ink-2)" }}>Не просто «зашёл», а «связался с людьми».</p>
            </div>
          </div>
        </div>) },
    { tag: "Слайд 4 · 2 мин", title: "Анти-паттерны — чего избегать", lede: "За эти ответы на интервью снимут баллы.",
      body: (
        <div className="body">
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {[
              { t: "«Наша NSM — выручка»", d: "Выручка — следствие. NSM должна предсказывать её." },
              { t: "«DAU как NSM для маркетплейса»", d: "Активность ≠ ценность. Зашёл и ушёл — не считается." },
              { t: "5 «равноправных» NSM", d: "Тогда у вас 0 NSM. Compass указывает в одну сторону." },
            ].map((a) => (
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
  ];
  const s = slides[idx];
  return (
    <div className="screen">
      <Topbar crumbs={["Home", "Урок", "North Star Metric"]} progress={progress} clock={clock} />
      <div className="screen-head">
        <div>
          <span className="eyebrow">Урок · 8 мин · +20 XP</span>
          <h1>North Star Metric</h1>
        </div>
        <div className="right" style={{ minWidth: 280 }}>
          <div className="progress-pills" style={{ flex: 1 }}>
            {slides.map((_, i) => <div key={i} className={`pp ${i < idx ? "done" : ""} ${i === idx ? "now" : ""}`} />)}
          </div>
          <button className="btn ghost sm" onClick={() => go("home")}>× выйти</button>
        </div>
      </div>
      <div className="lesson-stage">
        <div className="lesson-card">
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
                <button className="btn primary lg" onClick={() => completeTask("lesson-nsm", 20, "check")}>к проверке {Icon.chev}</button>
              )}
            </div>
          </div>
        </div>
        <aside className="lesson-rail">
          {slides.map((sl, i) => (
            <div key={i} className={`slide-thumb ${i === idx ? "active" : ""} ${i < idx ? "done" : ""}`} onClick={() => setIdx(i)}>
              <div className="n">{i < idx ? "✓" : i + 1}</div>
              <div>
                <b>{["Что","Зачем","FAANG-примеры","Анти-паттерны"][i]}</b>
                <i>{sl.tag.split(" · ")[1]}</i>
              </div>
            </div>
          ))}
          <div className="lesson-callout pink" style={{ marginTop: 8 }}>
            <div className="ico">★</div>
            <div>
              <h4>Что дальше</h4>
              <p>После урока — Check (3 MCQ), потом кейс на этом же концепте.</p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

// ─── Screen: CHECK / MCQ ─────────────────────────────────────────────
function CheckScreen({ go, progress, clock, completeTask }) {
  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState(null);
  const [showExplain, setShowExplain] = useState(false);
  const [whyTarget, setWhyTarget] = useState(null);
  const questions = [
    { q: "Какая из этих метрик ближе всего к настоящей North Star для Spotify?",
      opts: [
        { l: "A", t: "Общее число лайков в день", right: false, why: "Это активность, не ценность. Лайк ничего не говорит о реальном потреблении музыки." },
        { l: "B", t: "Среднее число прослушиваний на пользователя в неделю", right: false, why: "Близко, но «прослушивание» можно накрутить случайным треком. Spotify считает время." },
        { l: "C", t: "Время прослушивания на активного слушателя", right: true, why: "Это и есть NSM Spotify. Описывает реализованную ценность — человек реально провёл с продуктом время." },
        { l: "D", t: "Доход с подписок", right: false, why: "Доход — следствие NSM, а не она сама. NSM должна предсказывать его, не подменять." },
      ],
      explain: "NSM измеряет ценность, а не активность или деньги. Spotify выбрал «время прослушивания на активного» — это связывает retention, удовлетворённость и в долгую — выручку." },
    { q: "Что точно НЕ должно быть North Star Metric маркетплейса (типа Airbnb)?",
      opts: [
        { l: "A", t: "Забронированных ночей", right: false, why: "Это и есть NSM Airbnb — покрывает оба борта рынка." },
        { l: "B", t: "DAU приложения", right: true, why: "DAU = активность, не транзакция. Можно зайти 100 раз и ничего не забронировать." },
        { l: "C", t: "GMV (gross merchandise value)", right: false, why: "Чуть ближе к деньгам, чем хочется, но связь с ценностью есть." },
        { l: "D", t: "Количество завершённых поездок (для гостя + хоста)", right: false, why: "Связано с реальной ценностью обеим сторонам." },
      ],
      explain: "У маркетплейсов NSM почти всегда привязана к транзакции — она объединяет интересы обеих сторон. DAU — ловушка." },
    { q: "Какой ответ интервьюер посчитает «джуновым»?",
      opts: [
        { l: "A", t: "«NSM — то, что коррелирует с retention»", right: false, why: "Нормальный ответ middle-уровня." },
        { l: "B", t: "«Зависит от продукта, давайте обсудим контекст»", right: true, why: "Это ответ-отговорка. Сильный кандидат сам выберет 1-2 подходящие NSM на лету." },
        { l: "C", t: "«Для X я бы выбрал Y, потому что Z»", right: false, why: "Структурный ответ — то, что ждут." },
        { l: "D", t: "«NSM = leading indicator выручки»", right: false, why: "Хороший продвинутый ответ." },
      ],
      explain: "На FAANG-интервью «зависит» = нет ответа. Лучше: выбрать с пометкой «допустим X, тогда NSM=Y» и быть готовым менять — но иметь позицию." }
  ];
  const cur = questions[idx];
  const pick = (i) => { setPicked(i); setShowExplain(true); setWhyTarget(null); };
  const next = () => {
    if (idx < questions.length - 1) { setIdx(idx + 1); setPicked(null); setShowExplain(false); setWhyTarget(null); }
    else { completeTask("check-nsm", 10, "case"); }
  };
  return (
    <div className="screen" style={{ maxWidth: 880 }}>
      <Topbar crumbs={["Home", "Урок", "Check"]} progress={progress} clock={clock} />
      <div className="screen-head">
        <div>
          <span className="eyebrow">Check · 3 мин · +10 XP</span>
          <h1>Проверь — усвоил(а)?</h1>
        </div>
        <div className="right" style={{ minWidth: 220 }}>
          <div className="progress-pills" style={{ flex: 1 }}>
            {questions.map((_, i) => <div key={i} className={`pp ${i < idx ? "done" : ""} ${i === idx ? "now" : ""}`} />)}
          </div>
        </div>
      </div>
      <div className="mcq-card">
        <span className="chip pink">Вопрос {idx + 1} из {questions.length}</span>
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
          <button className="btn ghost" onClick={() => go("lesson")}>{Icon.back} назад в урок</button>
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
  const cards = [
    { q: "CIRCLES — что значит каждая буква?", a: "Comprehend the situation · Identify the user · Report the user's needs · Cut through prioritization · List solutions · Evaluate tradeoffs · Summarize. 7 шагов под любой product-design кейс." },
    { q: "Что такое North Star Metric?", a: "Одна метрика, отражающая реализованную ценность продукта для пользователя. Не выручка, не активность." },
    { q: "AARRR — расшифровать", a: "Acquisition · Activation · Retention · Referral · Revenue. Воронка от \"узнал о продукте\" до \"платит и рекомендует\"." },
    { q: "RICE — формула приоритизации", a: "(Reach × Impact × Confidence) ÷ Effort. Число для сравнения фич." },
    { q: "Что такое \"aha-moment\"?", a: "Действие или событие, после которого пользователь понимает ценность продукта. У Facebook — 7 друзей за 10 дней." },
    { q: "STAR-метод — формула", a: "Situation · Task · Action · Result. Action = что сделал лично ты, Result = с цифрами." },
    { q: "MDE в A/B-тесте — что это", a: "Minimum Detectable Effect — минимальный размер эффекта, который тест способен заметить." },
    { q: "Чем product sense ≠ user empathy?", a: "Empathy — про эмоции. Product sense — empathy + интуиция по бизнесу + умение видеть, какая фича сдвинет метрику." },
  ];
  const c = cards[idx];
  return (
    <div className="screen">
      <Topbar crumbs={["Home", "SRS · карточки"]} progress={progress} clock={clock} />
      <div className="screen-head">
        <div>
          <span className="eyebrow">Spaced repetition · фреймворки и термины</span>
          <h1>8 карточек к повтору</h1>
        </div>
        <div className="right">
          <span className="chip mint">сегодня запланировано: 8</span>
          <span className="chip sun">~6 мин</span>
        </div>
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
function CaseScreen({ go, progress, clock, completeTask }) {
  const [step, setStep] = useState(2);
  const [text, setText] = useState("");
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
  const steps = [
    { n: "1", title: "Clarifying questions", desc: "уточни цели и контекст", prompt: "Что хочешь уточнить у интервьюера?", placeholder: "1. Какая цель — engagement, retention или revenue?\n2. На каких устройствах…" },
    { n: "2", title: "User & pain points", desc: "выбери сегмент, опиши боли", prompt: "Кто целевой пользователь? Какую проблему ему решает «лайк песен»?", placeholder: "Сегмент: «активные слушатели» 18-35.\nБоли: …" },
    { n: "3", title: "Solutions", desc: "3-5 идей под боль", prompt: "Сгенерируй 3-5 решений. Один должен быть «дикий», один — минимальный.", placeholder: "1. Сердечко рядом с треком\n2. Свайп вправо = like\n3. …" },
    { n: "4", title: "Priorities & trade-offs", desc: "приоритизируй с обоснованием", prompt: "Какой выбираешь и почему? Какие компромиссы?", placeholder: "Выбираю #1 — самый дешёвый и понятный.\nTrade-off: …" },
    { n: "5", title: "Metrics & success", desc: "как поймёшь, что сработало", prompt: "Какие метрики? Какие предсказывают долгосрочный успех?", placeholder: "Лидирующая метрика: …" },
  ];
  const cur = steps[step];
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
    } catch (e) {
      setGenErr(e.message);
    } finally {
      setGenBusy(false);
    }
  };

  return (
    <div className="screen">
      <Topbar crumbs={["Home", "Кейс", caseTitle]} progress={progress} clock={clock} />
      <div className="screen-head">
        <div>
          <span className="eyebrow">Кейс · ~15 мин · +60 XP · FAANG product design</span>
          <h1>{caseTitle}</h1>
        </div>
        <div className="right">
          <span className="chip sun">{selectedSuggestion.trackId === "business" ? "business case" : "product case"}</span>
          <button className="btn ghost sm">сохранить</button>
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
      </section>
      <div className="case-wrap">
        <aside className="case-steps">
          <div className="eyebrow" style={{ padding: "0 4px 4px" }}>5 шагов кейса</div>
          {steps.map((s, i) => (
            <div key={i} className={`case-step ${i < step ? "done" : ""} ${i === step ? "active" : ""}`} onClick={() => setStep(i)}>
              <div className="n">{i < step ? "✓" : s.n}</div>
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
            <span className="eyebrow">условие кейса</span>
            <pre>{caseText}</pre>
          </div>
          <div className="meta">
            <span className="chip solid-ink">Шаг {step + 1} / 5</span>
            <span className="chip pink">{cur.title}</span>
            <span className="chip">⏱ ~3 мин</span>
          </div>
          <h2>{cur.title}</h2>
          <p className="promptq">{cur.prompt}</p>
          <textarea className="case-input" placeholder={cur.placeholder} value={text} onChange={(e) => setText(e.target.value)} />
          <div className="case-actions">
            <div className="case-hints">
              <span className="eyebrow" style={{ marginRight: 4 }}>подсказки Pim:</span>
              <span className="hint-pill">подсказать фреймворк</span>
              <span className="hint-pill">пример сильного ответа</span>
              <span className="hint-pill">типичные ошибки джунов</span>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button className="btn ghost" onClick={() => setStep(Math.max(0, step - 1))}>{Icon.back} назад</button>
              {step < steps.length - 1 ? (
                <button className="btn primary lg" onClick={() => { setStep(step + 1); setText(""); }}>далее {Icon.chev}</button>
              ) : (
                <button className="btn primary lg" onClick={() => completeTask(`case-${selectedSuggestion.id}`, 60, "review", { cases: progress.cases + 1 })}>отправить на разбор {Icon.chev}</button>
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
  return (
    <div className="screen">
      <Topbar crumbs={["Home", "Mock с AI"]} progress={progress} clock={clock} />
      <div className="screen-head">
        <div>
          <span className="eyebrow">Mock-интервью · Standard persona · 30 мин</span>
          <h1>Google · Product Design</h1>
        </div>
        <div className="right">
          <span className="chip plum">🧐 Standard</span>
          <span className="chip sun">⏱ 06:18 / 15:00</span>
          <button className="btn ghost sm">⏸ пауза</button>
        </div>
      </div>
      <div className="mock-stage">
        <div className="mock-room">
          <div className="mock-interviewer">
            <div className="interviewer-av">VK</div>
            <div className="mock-bubble">
              <div className="eyebrow" style={{ marginBottom: 4 }}>Виктор · Sr. PM @ Google</div>
              <div>Окей, давай так — представь, что мы делаем Maps для детей 8-12 лет. <b>Какие первые 3 вопроса</b> ты задашь, прежде чем начать брейнсторм?</div>
            </div>
          </div>
          <div className="mock-transcript">
            <div className="mock-line note">— Mock начат: 06:18 · vol 75% · transcript on —</div>
            <div className="mock-line them"><span className="who">Виктор:</span><span>Привет! Сегодня кейс на product design. Готова?</span></div>
            <div className="mock-line you"><span className="who">Ты:</span><span>Да, готова. Дай 30 секунд собраться.</span></div>
            <div className="mock-line them"><span className="who">Виктор:</span><span>Конечно. Постарайся думать вслух — мне важно слышать ход мыслей.</span></div>
            <div className="mock-line you"><span className="who">Ты:</span><span>Понятно. Прежде чем начать, можно уточнить — мы говорим про новый продукт или фичу внутри существующего Maps?</span></div>
            <div className="mock-line them"><span className="who">Виктор:</span><span>Хороший вопрос. Допустим, фича внутри существующего Maps.</span></div>
            <div className="mock-line you"><span className="who">Ты:</span><span>Окей. И таргет-устройство — телефон родителя или у ребёнка свой?</span></div>
            <div className="mock-line them"><span className="who">Виктор:</span><span>Допустим, у ребёнка свой телефон. Поехали глубже.</span></div>
          </div>
          <div className="pace-rail">
            <h5><span>Pace-meter — ты сейчас на «User & pain», должен быть на «Solutions»</span><span className="mono" style={{ color: "var(--ph-ink-3)" }}>06:18 / 15:00</span></h5>
            <div className="pace-track">
              <i style={{ width: "42%" }}></i>
              {[13, 33, 55, 78].map((p) => <span key={p} className="tick" style={{ left: `${p}%` }}></span>)}
            </div>
            <div className="pace-labels">
              <span>Clarify · 2м</span>
              <span>User · 3м</span>
              <span>Solutions · 4м</span>
              <span>Priorities · 3м</span>
              <span>Metrics · 3м</span>
            </div>
          </div>
          <div className="mic-row">
            <div className="mic-btn">{Icon.mic}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, marginBottom: 4 }}>Слушаю… говори свободно</div>
              <div className="mic-wave">
                {[8,18,12,24,16,28,14,20,10,22,16,12,18,24,10,18].map((h, i) =>
                  <i key={i} style={{ height: h, animationDelay: `${i * 0.08}s` }} />
                )}
              </div>
            </div>
            <button className="btn ghost sm">пропустить</button>
            <button className="btn primary">завершить</button>
          </div>
        </div>
        <aside style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div className="review-card">
            <h4>Score-черновик</h4>
            <div style={{ fontSize: 13, color: "var(--ph-ink-3)", marginBottom: 10 }}>обновляется в реальном времени</div>
            <div className="score-bars" style={{ marginTop: 0 }}>
              {[
                { n: "Clarify", v: 4 },
                { n: "User & pain", v: 3 },
                { n: "Solutions", v: 2 },
                { n: "Priorities", v: 0 },
                { n: "Metrics", v: 0 },
              ].map(r => (
                <div key={r.n} className="score-bar-row">
                  <div className="nm">{r.n}</div>
                  <div className="bar"><i style={{ width: `${r.v * 20}%`, background: r.v > 3 ? "var(--ph-mint)" : r.v > 1 ? "var(--ph-coral)" : "var(--ph-ink-4)" }}></i></div>
                  <div className="vl">{r.v}/5</div>
                </div>
              ))}
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
          <button className="btn lg" style={{ width: "100%" }} onClick={() => completeTask("mock-google", 50, "review")}>завершить mock → score</button>
        </aside>
      </div>
    </div>
  );
}

// ─── Screen: DRILL ───────────────────────────────────────────────────
function DrillScreen({ go, progress, clock, completeTask }) {
  const [qIdx, setQIdx] = useState(2);
  const total = 10;
  const questions = [
    "Назови 3 метрики для оценки качества поиска",
    "Sub-2 sec latency vs full personalization — выбор и обоснование за 60 сек",
    "Чем NSM отличается от вторичной метрики? Один пример.",
    "Опиши aha-moment для приложения для медитации",
    "Какой trade-off ты бы обсудил для лайков в Spotify?",
  ];
  return (
    <div className="screen">
      <Topbar crumbs={["Home", "Drill 60s · Product sense"]} progress={progress} clock={clock} />
      <div className="screen-head">
        <div>
          <span className="eyebrow">Drill · 10 вопросов · ⏱ 60 сек каждый</span>
          <h1>Drill-режим: Product sense ⚡</h1>
        </div>
        <div className="right">
          <span className="chip mint">+5 XP / правильный</span>
          <button className="btn ghost sm">пауза</button>
        </div>
      </div>
      <div className="drill-stage">
        <div className="drill-progress-row">
          {Array.from({ length: total }).map((_, i) => (
            <div key={i} className={`seg ${i < qIdx ? "done" : ""} ${i === qIdx ? "now" : ""}`}></div>
          ))}
        </div>
        <div className="drill-card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <span className="chip" style={{ background: "rgba(255,255,255,0.18)", border: "1.5px solid #fff", color: "#fff" }}>Вопрос {qIdx + 1} / {total}</span>
            <div className="drill-timer-ring" style={{ background: "#fff", color: "var(--ph-ink)" }}>42</div>
          </div>
          <h2>{questions[qIdx % questions.length]}</h2>
          <p>отвечай голосом или коротким текстом · флоу-режим, не стесняйся</p>
          <div style={{ marginTop: 22, display: "flex", gap: 10, justifyContent: "center" }}>
            <div className="mic-btn" style={{ background: "#fff", color: "var(--ph-coral)" }}>{Icon.mic}</div>
            <button className="btn lg" style={{ background: "var(--ph-ink)", color: "#fff", borderColor: "#fff" }}>пропустить</button>
            <button className="btn lg" style={{ background: "#fff", color: "var(--ph-ink)" }} onClick={() => qIdx < total - 1 ? setQIdx(qIdx + 1) : completeTask("drill-product-sense", 50, "review")}>готово →</button>
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
          <div className="review-card">
            <h4>✓ Чисто</h4>
            <div className="h-display" style={{ fontSize: 36, color: "var(--ph-mint)" }}>1</div>
          </div>
          <div className="review-card">
            <h4>⚠ Под вопросом</h4>
            <div className="h-display" style={{ fontSize: 36, color: "var(--ph-sun)" }}>1</div>
          </div>
          <div className="review-card">
            <h4>✕ Не успел</h4>
            <div className="h-display" style={{ fontSize: 36, color: "var(--ph-ink-4)" }}>0</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Screen: TEACH ───────────────────────────────────────────────────
function TeachScreen({ go, progress, clock, completeTask }) {
  return (
    <div className="screen">
      <Topbar crumbs={["Home", "Teach the Rookie"]} progress={progress} clock={clock} />
      <div className="screen-head">
        <div>
          <span className="eyebrow">Feynman-режим · 12 мин · +50 XP</span>
          <h1>Объясни North Star Metric стажёру</h1>
        </div>
        <div className="right">
          <span className="chip plum">🐣 Rookie: «Тима»</span>
          <button className="btn ghost sm">сменить тему</button>
        </div>
      </div>
      <div className="teach-stage">
        <div className="teach-chat">
          <div className="lesson-callout">
            <div className="ico">🎯</div>
            <div>
              <h4>Цель сессии</h4>
              <p>Стажёр Тима пришёл в команду на этой неделе. Объясни ему, что такое NSM. Тима будет задавать «глупые» вопросы — это нормально и полезно.</p>
            </div>
          </div>
          <div className="rookie-msg">
            <div className="rookie-av">🐣</div>
            <div className="chat-bubble">Привет! Я тут читал доку и не понял — а зачем нужна <b>одна</b> метрика? У нас же DAU, retention, revenue, NPS — давай за всеми следить?</div>
          </div>
          <div className="you-msg">
            <div className="you-av">К</div>
            <div className="chat-bubble">Окей. <mark>North Star — это компас.</mark> Когда у команды 200 человек, без неё все тянут в разные стороны.</div>
          </div>
          <div className="rookie-msg">
            <div className="rookie-av">🐣</div>
            <div className="chat-bubble">Ага, а чем тогда NSM отличается от обычной «бизнес-цели»? Это же просто KPI команды?</div>
          </div>
          <div className="you-msg">
            <div className="you-av">К</div>
            <div className="chat-bubble">Хороший вопрос. NSM — про <mark>ценность для пользователя</mark>, а не про деньги. Выручка — это следствие.</div>
          </div>
          <div className="rookie-msg">
            <div className="rookie-av">🐣</div>
            <div className="chat-bubble">Окей, а как её выбрать, если есть 5 равных кандидатов? Это интуиция или есть метод?</div>
          </div>
          <div className="chat-compose">
            <input placeholder="Объясни на пальцах…" />
            <button className="btn primary sm">отправить →</button>
          </div>
        </div>
        <aside className="teach-sidebar">
          <div className="teach-gaps">
            <h5>🔎 Что Pim замечает</h5>
            <div className="gap-row"><b>пробел</b><span>не сказала, что NSM привязана к retention</span></div>
            <div className="gap-row"><b>пробел</b><span>не привела ни одного FAANG-примера</span></div>
            <div className="gap-row"><b>сильно</b><span>метафора «компас» — Тима поймёт</span></div>
            <div className="gap-row"><b>сильно</b><span>чётко отделила NSM от выручки</span></div>
          </div>
          <div className="review-card">
            <h4>Подсказки тебе</h4>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <span className="chip pink">упомяни retention</span>
              <span className="chip mint">приведи 1 FAANG-пример</span>
              <span className="chip sun">объясни «leading vs lagging»</span>
            </div>
          </div>
          <div className="review-card pim-says">
            <h4>Pim говорит</h4>
            <p style={{ margin: 0, fontSize: 14, color: "rgba(255,255,255,0.9)" }}>
              «Тима задаст ещё 2-3 вопроса. Будет один с подвохом — про NSM маркетплейсов.»
            </p>
          </div>
          <button className="btn lg" style={{ width: "100%" }} onClick={() => completeTask("teach-rookie", 50, "review")}>завершить → разбор</button>
        </aside>
      </div>
    </div>
  );
}

// ─── Screen: REVIEW ──────────────────────────────────────────────────
function ReviewScreen({ go, progress, clock, completeTask }) {
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
                <div className="score-num">7.4</div>
                <div className="score-sub">из 10 · ниже среднего FAANG-кандидата, но это исправимо</div>
              </div>
              <div style={{ marginRight: -10, marginTop: -10 }}>
                <PimFigure size={120} expression="think" />
              </div>
            </div>
            <div className="score-bars">
              {[
                { n: "Clarifying Qs", v: 4, max: 5, c: "var(--ph-mint)" },
                { n: "User & pain", v: 4, max: 5, c: "var(--ph-mint)" },
                { n: "Solutions", v: 2, max: 5, c: "var(--ph-coral)" },
                { n: "Priorities", v: 3, max: 5, c: "var(--ph-sun)" },
                { n: "Metrics", v: 2, max: 5, c: "var(--ph-coral)" },
              ].map(r => (
                <div key={r.n} className="score-bar-row">
                  <div className="nm">{r.n}</div>
                  <div className="bar tall"><i style={{ width: `${(r.v / r.max) * 100}%`, background: r.c }}></i></div>
                  <div className="vl">{r.v}/{r.max}</div>
                </div>
              ))}
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 20, flexWrap: "wrap" }}>
              <span className="chip pink">+ слабо: Solutions, Metrics</span>
              <span className="chip mint">+ сильно: User, Clarify</span>
              <span className="chip sun">⏱ уложилась в тайминг</span>
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginTop: 18 }}>
            <div className="review-card" style={{ background: "var(--ph-mint-2)" }}>
              <h4>Топ-3 сильных момента</h4>
              <div className="quote">
                <span className="who">твои слова</span>
                «Сегмент — активные слушатели 18-35»
                <div style={{ fontSize: 12, color: "var(--ph-ink-3)", marginTop: 4 }}>→ конкретно, не общо.</div>
              </div>
              <div className="quote">
                <span className="who">твои слова</span>
                «Спрошу, мы решаем engagement или retention»
                <div style={{ fontSize: 12, color: "var(--ph-ink-3)", marginTop: 4 }}>→ правильный clarifying.</div>
              </div>
            </div>
            <div className="review-card" style={{ background: "#ffe1e1" }}>
              <h4>Топ-3 слабых момента</h4>
              <div className="quote" style={{ borderColor: "#ff5e5e" }}>
                <span className="who" style={{ color: "#d63333" }}>пропустила</span>
                «Не назвала alternatives — только 2 идеи»
                <div style={{ fontSize: 12, color: "var(--ph-ink-3)", marginTop: 4 }}>→ интервьюер ждёт 4-5.</div>
              </div>
              <div className="quote" style={{ borderColor: "#ff5e5e" }}>
                <span className="who" style={{ color: "#d63333" }}>твои слова</span>
                «Метрика — количество лайков»
                <div style={{ fontSize: 12, color: "var(--ph-ink-3)", marginTop: 4 }}>→ это vanity-метрика.</div>
              </div>
            </div>
          </div>
        </div>
        <div className="review-side">
          <div className="review-card pim-says">
            <h4>📣 Pim говорит</h4>
            <p style={{ fontSize: 15, lineHeight: 1.5 }}>
              «Хорошая работа на user & pain — там у тебя FAANG-уровень. Слабое звено — solutions: накидывай больше идей.»
            </p>
          </div>
          <div className="review-card">
            <h4>Что закрепляем</h4>
            <p style={{ margin: "0 0 10px", fontSize: 13, color: "var(--ph-ink-3)" }}>уйдёт в SRS, вернётся через 1 день</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <span className="chip" style={{ background: "var(--ph-sun-2)", borderColor: "var(--ph-ink)" }}>● Trade-off матрица</span>
              <span className="chip" style={{ background: "var(--ph-sun-2)", borderColor: "var(--ph-ink)" }}>● Vanity vs actionable метрики</span>
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
function CVScreen({ progress, clock }) {
  return (
    <div className="screen" style={{ maxWidth: 980 }}>
      <Topbar crumbs={["Home", "Резюме"]} progress={progress} clock={clock} />
      <div className="screen-head">
        <div>
          <span className="eyebrow">CV ревью · 30 сек разбор от Pim</span>
          <h1>Загрузи резюме — Pim даст 3 правки</h1>
        </div>
      </div>
      <div className="mcq-card" style={{ textAlign: "center" }}>
        <div style={{ border: "3px dashed var(--ph-ink-4)", borderRadius: 18, padding: "60px 30px", background: "var(--ph-bg-warm)" }}>
          <div style={{ display: "inline-block" }}><PimFigure size={120} expression="cheer" /></div>
          <h2 style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontSize: 26, fontWeight: 800, margin: "16px 0 8px" }}>Перетащи сюда PDF или DOCX</h2>
          <p style={{ color: "var(--ph-ink-3)", margin: "0 0 22px" }}>или нажми, чтобы выбрать файл с компьютера</p>
          <button className="btn primary lg">выбрать файл</button>
        </div>
        <div style={{ marginTop: 24, display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
          {[
            { t: "Структура", d: "проверю порядок секций под PM-роль" },
            { t: "Action verbs", d: "найду 'занимался', заменю на сильные глаголы" },
            { t: "Метрики", d: "подсвечу проекты без цифр результата" },
          ].map((c, i) => (
            <div key={i} className="review-card" style={{ background: ["var(--ph-sun-2)","var(--ph-mint-2)","var(--ph-pink-2)"][i] }}>
              <h4>{c.t}</h4>
              <p style={{ margin: 0, fontSize: 13.5, color: "var(--ph-ink-2)" }}>{c.d}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── App router + persistent Pim ─────────────────────────────────────
const PIM_BY_ROUTE = {
  home:    { msg: "С возвращением, Катя! Слабое место недели — product design. Я подобрал кейс под него.", actions: [{ label: "Старт миссии", on: "lesson" }], expression: "smile" },
  library: { msg: "12 конспектов уже освоено. Подсветил карточки, которые скоро вернутся в SRS.", actions: [{ label: "Открыть SRS", on: "srs" }], expression: "wink" },
  lesson:  { msg: "Подсветить или объяснить любой кусок — просто выдели текст. Я рядом.", actions: [], expression: "teach" },
  check:   { msg: "3 вопроса. Один с подвохом. После каждого — кнопка «почему».", actions: [], expression: "think" },
  case:    { msg: "Не торопись с решениями. Сильные кандидаты тратят 30% времени на clarify + user.", actions: [], expression: "think" },
  mock:    { msg: "На mock я в фоне — слежу за таймингом и шепну, если выйдешь за лимит шага.", actions: [], expression: "wink", muted: true },
  drill:   { msg: "Не думай долго — это drill. Главное темп и «думаешь вслух».", actions: [], expression: "cheer" },
  teach:   { msg: "Тима задаст ещё 2-3 каверзных вопроса. Главное — не отвечать общими словами.", actions: [], expression: "teach" },
  srs:     { msg: "Честно оцени, как помнил(а). Если «Снова» — ничего страшного, лучше так, чем «легко» и забыть.", actions: [], expression: "smile" },
  review:  { msg: "Хороший разбор. Сильные стороны выписал в банк историй — пригодится в behavioral.", actions: [], expression: "cheer" },
  cv:      { msg: "Загрузи PDF — за 30 сек найду 3 главных правки. Без воды.", actions: [], expression: "smile" },
};

export default function PMQuestHifi({ onExit }) {
  const [route, setRoute] = useState("home");
  const [pimOpenSignal, setPimOpenSignal] = useState(0);
  const [progress, setProgress] = useState(initialProgress);
  const clock = useMoscowClock();

  useEffect(() => {
    localStorage.setItem("pmquest-progress-v1", JSON.stringify(progress));
  }, [progress]);

  const go = (r) => {
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

  const shared = {
    progress,
    clock,
    completeTask,
  };

  const screens = {
    home:    <HomeScreen go={go} openPim={() => setPimOpenSignal((v) => v + 1)} {...shared} />,
    library: <LibraryScreen go={go} {...shared} />,
    lesson:  <LessonScreen go={go} {...shared} />,
    check:   <CheckScreen go={go} {...shared} />,
    srs:     <SRSScreen go={go} {...shared} />,
    case:    <CaseScreen go={go} {...shared} />,
    mock:    <MockScreen go={go} {...shared} />,
    drill:   <DrillScreen go={go} {...shared} />,
    teach:   <TeachScreen go={go} {...shared} />,
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
      </div>
    </div>
  );
}
