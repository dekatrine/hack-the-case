# Hack the Case — Design System

An unofficial design system for **Hack the Case** (in-product also branded "Case Solver Studio"), a Russian-language edtech product preparing candidates for product-management interviews, plus onboarding content for interns/junior PMs (as described by the requester: *"Edtech стартап подготовки к продуктовым собеседованиям + информационные блоки для стажеров и джунов продакт менеджеров"*).

## Sources — and which one wins
Two sources exist, from two different iterations of the product, and they disagree visually:

1. **GitHub: [dekatrine/hack-the-case](https://github.com/dekatrine/hack-the-case)** — an earlier React + Vite codebase (`main.jsx`, `styles.css`, `pmquest-hifi.jsx`). Warm cream background, burnt-orange accent, Fraunces serif (an "editorial" theme) plus a separate neo-brutalist "PMQuest" gamified layer with a mascot ("Pim"), hard ink borders and offset comic shadows.
2. **User-provided screenshots of the current live app**, hosted on Lovable as "Case Solver Studio" — a much cleaner black/white/lime-green interface: solid-black pills, thin hairline borders, no shadows, no serif, no mascot. Selected states invert to solid black instead of using color rings.

**The screenshots are authoritative — this system is built to match them.** Per explicit instruction, the older GitHub-derived palette/type/components are kept in the codebase, but scoped under `.theme-editorial-legacy` and `.theme-quest`, with every specimen card and component variant clearly labeled "Legacy." Every component defaults to the current clean look (`face="clean"`). If you can get renewed access to the live app's real source (the Lovable project itself, or a newer GitHub branch), read it directly — screenshots are a lossier source than code, and the font name in particular is only a best-guess substitution here (see Visual foundations).

## The product, in one paragraph
Hack the Case / Case Solver Studio is an AI case-interview simulator for the Product Manager track: set an industry and difficulty, and the AI generates a fresh case with a guided 5–7 step solve flow — each step has a goal, an answer template, a common-mistake warning, and an AI coach you can ask for hints via a sticky bottom bar. At the end you get a score and a coached debrief. A separate "Уроки" (Lessons) library holds short framework/metric reference cards, filterable by category, and the homepage tracks streak/level/average-score as light gamification.

## Components
- **Core** — `Button`, `Chip`, `Card`, `ProgressBar`, `IconActionRow`
- **Forms** — `Field` (input / select / textarea), `ToggleRow`
- **Navigation** — `SidebarNavItem`, `StepRailItem`
- **Feedback** — `ScoreDisplay`, `ChatBubble`, `SuccessCheck`, `StatRing`

Every component defaults to `face="clean"` (current live product). `face="editorial"` / `face="quest"` render the two archived looks from the earlier GitHub codebase — keep for reference, don't use in new work unless asked to recreate the old look.

### Intentional additions
None of the above were invented wholesale — every one maps to a real screen element visible in the screenshots (buttons, tag chips, white bordered cards, progress bars, sidebar nav rows, numbered step rows, the big score readout, chat bubbles in the coach modal) or, for the legacy faces, a CSS class pattern in `styles.css`/`main.jsx`/`pmquest-hifi.jsx`. Four components — `IconActionRow`, `ToggleRow`, `SuccessCheck`, `StatRing` — were added afterward, adapting well-established mobile-banking UX patterns (a row of circular icon actions, a checklist of toggleable rows, a big-checkmark confirmation panel, a circular goal-progress ring inspired by Banco Plata's spend-breakdown ring) that don't exist yet in the source screenshots but fit real upcoming needs: step-level actions in the case workspace, multi-select skill/category pickers, case/lesson-completion moments, and a weekly-goal habit loop on the homepage. They use the system's own black/white/lime "clean" tokens throughout, not any external brand's colors or marks.

## Retention & habit-loop patterns
The StartPage now bakes in a few explicit habit-forming mechanics, adapted from Banco Plata's own retention UX (circular spend ring, monthly summary, freeze control on a card) rather than invented from scratch:
- **`StatRing`** turns "3 кейса решено" into a filling ring against a weekly goal (5) — a goal reads as "how full is this week," which is a stronger return-trigger than a bare number.
- **Weekly summary card** ("Твоя неделя": cases solved / average score / strongest track) gives a fixed, recurring reason to check back, the same way Plata's monthly spend/cashback summary does.
- **Streak freeze control** — a small snowflake button on the streak stat — lets a user protect a mid-length streak instead of losing it entirely after one missed day, directly adapted from Plata's card freeze/refresh/discard action row (`IconActionRow`).

These are UX strategy additions, not visual reskins of Plata — no Plata colors, marks, or copy are used; only the interaction *pattern* was adapted.

## UI kit
`ui_kits/hack-the-case/` — five core screens, rebuilt to match the live-app screenshots:
- **StartPage** — homepage: streak/level/score stats, XP progress, track picker, recent cases, lessons-library entry point
- **SolvePage** — the guided case-solving workspace (step progress, case brief, per-step guidance, answer box, sticky coach bar) — **mobile-first layout**
- **EvaluatePage** — score + AI coach debrief
- **LearningPage** — Уроки library: search, category filters, lesson cards
- **QuizPage** — the "new case" setup wizard (track / industry / difficulty / optional context). *Note: the screenshots show no separate multiple-choice quiz screen in the current app — this slot recreates the real "Настрой параметры" wizard rather than inventing an MCQ UI that isn't evidenced.*

These are cosmetic recreations for prototyping — not the production interaction logic.

## Index
```
styles.css                 → import-only entry point
tokens/                     colors.css, typography.css, spacing.css, fonts.css
components/
  core/                     Button, Chip, Card, ProgressBar, IconActionRow
  forms/                    Field, ToggleRow
  navigation/               SidebarNavItem, StepRailItem
  feedback/                 ScoreDisplay, ChatBubble, SuccessCheck, StatRing
guidelines/                 foundation specimen cards (clean = primary, editorial/quest = legacy)
ui_kits/hack-the-case/      StartPage, SolvePage, EvaluatePage, LearningPage, QuizPage
SKILL.md                    Claude Code / Agent Skills-compatible entry point
```

---

## Content fundamentals

**Language & address.** All product copy is Russian, informal **ты**-address ("Продолжай маршрут подготовки", "Задай вопрос коучу"). Copy speaks directly to the learner as a coach would, not a corporate "we".

**Tone.** Direct, calm, encouraging without being cutesy. Headlines ask a question the user answers by clicking ("Готов разобрать кейс сегодня?"). Guidance boxes are structured like a mentor's checklist: "Цель шага," "Шаблон ответа," "Частая ошибка," each answered in one plain sentence.

**Structure labels are terse, uppercase, gray** — "ПРИВЕТ!", "НОВЫЙ КЕЙС", "ШАГ 1 ИЗ 7", "ИНДУСТРИЯ" — small caps set apart from body copy, functioning purely as UI chrome, not sentence-case prose. English loanwords are used freely where the audience already knows them (Product Manager, McKinsey/BCG/Bain, Goal statement, SMART, e-commerce, SaaS/B2B) — a PM-training product for people fluent in English-inflected business vocabulary.

**Emoji are essentially absent** in this iteration (one 💡 tip glyph is the only exception seen) — a shift from the earlier GitHub codebase, which used 🔥/✦/★/🎯 as stat glyphs. Treat the current product as *emoji-free by default*; icons (thin line-art) carry that role instead.

**Numbers matter but are understated.** "0 дн.", "Ур. 1", "0/300 XP", "6 мин", "18 месяцев" appear inline, bold, unadorned — no colored badges or celebratory framing, just plain data next to the words it modifies.

## Visual foundations

**This system is deliberately keyed to Apple's own product design language** (Apple Design Award-caliber minimalism — see the recreated live-app screenshots plus this refinement pass): the underlying black/white/lime identity from the live app is kept, but depth, motion, type, and materials are now modeled on Apple HIG conventions rather than left flat.

**Backgrounds.** Pure white or `#f5f5f7` (Apple's own light-gray surface value) — no warm tint, no gradients, no textures. Content areas stay bright; only sticky chrome (sidebar, bottom coach bar) uses translucency (see Materials, below).

**Color.** Near-black (`#1d1d1f` — Apple's actual near-black, warmer than pure `#000`) and white still carry ~95% of the interface. **One** accent exists: lime/chartreuse (`#d7ff3f`), used only as discrete solid fills — CTA, avatar, active tag — never as a wash or hover tint. Selected/active states still invert to solid black rather than taking on color.

**Type.** System font stack first — `-apple-system` (resolves to San Francisco on any Apple device, zero download), Inter as the cross-platform fallback since the real family can't be embedded here. Display sizes are bigger and tracking is tighter than the original recreation (`-0.022em` at large sizes) — the single biggest "Apple" typographic tell. Weights are pulled back from 800/900 to 600/700 — confident but not shouty, matching Apple's own restraint (SF Pro rarely goes past Semibold in product UI).

**Depth.** The flat, shadowless cards from the original recreation now carry **soft, layered, diffused shadows** (`--shadow-clean-1/2/3`) instead of relying on a border alone — elevation reads as proximity to a soft light source, the way HIG "materials" describe depth, never a hard single-offset drop shadow. Hover raises elevation one step with a 1px lift; press scales down slightly (`0.97`) rather than changing color. This motion is deliberately restrained: fast (120–200ms), decelerating, never bouncy or elastic.

**Materials / glass.** Sticky chrome — the sidebar and the mobile solve-screen's bottom coach bar — now sits on a frosted, translucent surface (`--surface-glass` + `backdrop-filter: saturate(180%) blur(20px)`), the signature Apple "vibrancy" treatment, so content scrolling underneath is legible but softened rather than fully obscured.

**Motion.** One easing family throughout — a soft decelerating curve (`cubic-bezier(0.22,1,0.36,1)`), matching the "ease-out" feel of Apple's own view-controller transitions. No elastic/bounce, no spring overshoot, no linear motion. Two speeds: ~150ms for micro-interactions (hover, chip/pill state), ~300ms for anything sheet- or panel-sized.

**Spacing.** Generous, airy — cards keep ~24px internal padding, sections keep 24–36px vertical rhythm. Pills/circles (buttons, chips, tags, filter pills, avatars) stay fully rounded (999px); cards now round a touch more generously (22–28px) for a softer, more "continuous-corner" feel.

**Corners & cards.** White panel, 1px hairline border, soft multi-layer shadow, 22px radius as the default recipe (28px for large sheet-like surfaces, e.g. the coach modal). No hard offset shadows anywhere — that motif belongs only to the archived Quest legacy face.

**Borders.** Thin (1px), light gray, solid — now mostly a secondary depth cue since shadows do more of the elevation work; borders alone no longer have to carry hover/selection feedback.

**Selection pattern.** Unchanged from the live product: unselected = white card + gray border + gray/black text; selected = solid black fill + white text, still with zero color-ring gimmick — now the selected state also picks up one shadow step so it visually "lifts."

**Icons.** Same simple thin-stroke line icons (~2px stroke, rounded caps) as before — see Iconography.

**Imagery.** Still none — no photography, no illustration, no mascot. Visual richness now comes from type weight, black/white/lime contrast, soft depth, and glass materials rather than flat whitespace alone.

## Iconography
Icons are simple thin-stroke line glyphs (~2px stroke, rounded caps/joins), matching the **Lucide** icon style closely — used for navigation (home, book, play-circle) and inline affordances (search, clock, chat bubble, arrow, back). No icon font, no PNG sprite, no emoji-as-icon. Load Lucide from CDN (or hand-copy the small set already captured in `guidelines/iconography.card.html`, inherited from the legacy codebase's hand-drawn set, which is stylistically identical).

**No logo file exists anywhere in either source.** Per instructions, none was invented — `guidelines/brand-wordmark.card.html` renders the product name in type only, with a plain lime circle carrying the initial "H" standing in for a mark (matching what the live app itself does — its sidebar avatar is just a colored circle with a letter, not an illustrated logo). If a real logo exists in a design tool the team uses, attach it and this system will incorporate it.
