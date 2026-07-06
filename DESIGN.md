# DESIGN.md — Hack the Case

> **CURRENT CANONICAL DESIGN (2026-07): "Clean" — monochrome + lime.**
> The whole app (and the PMQuest hi-fi prototype) is skinned in the Clean
> design imported from Claude Design (project `4766773e`). The earlier
> orange/cream "editorial" look documented further down is **archived**.

## Clean design system (source of truth)

- **Palette:** near-black `#1d1d1f`, white, cool grays (`#f5f5f7` sunk,
  `#e8e8ed` hairline) + a **single lime accent `#d7ff3f`** (`#c2eb2a` deep),
  used sparingly for CTAs / tags / active fills / avatars. Semantic:
  danger `#ff3b30`, warning `#ff9f0a`, success `#34c759`.
- **Type:** Inter / system font (`-apple-system, 'Inter', system-ui`). No serif.
- **Depth:** soft layered shadows (`--shadow-clean-1/2/3`), frosted glass
  (`--blur-material`) only on sticky/floating chrome. No hard borders.
- **Radii:** cards `22px`, controls `12px`, pills `999px`.
- **Selection pattern:** selected/active = **invert to black** (white text),
  not a colored ring.

### Where it lives
- `design/clean-tokens.css` — token `:root` block + `CleanHome` layout classes.
- `design/clean-screens.css` — shared page classes (prefixed `cs-`, scoped
  under `.clean-screen`) + scoped recolor overrides for legacy classes, plus
  `.clean-legacy` / `.clean-learn` wrappers that **remap legacy CSS vars**
  (`--mint`→lime, `--paper`→near-black, `--serif`→Inter, cream→white) so large
  legacy sections (Learn, quiz) recolor at once.
- `design/components/*` — 13 clean React components (`Button`, `Card`, `Chip`,
  `ProgressBar`, `ScoreDisplay`, `ChatBubble`, `StatRing`, `StepRailItem`, …),
  used with `face="clean"`.
- `pmquest-hifi.jsx` — recolored via the `.pmq-hifi { --ph-* }` token block in
  `styles.css`.

### How screens are built
Each screen early-returns as a full clean page from `App` (no shared legacy
shell/Topbar). New screens use `cs-` classes + `design/components`; large
legacy screens keep their markup and are recolored via the var-remap wrappers.
`styles.css` still holds the legacy classes (now recolored) — most are still
referenced, so don't bulk-delete; shared names like `.topbar` are used by
PMQuest.

---

## Vision (original orange iteration — archived)

Переделать интерфейс из "учебного инструмента с CSS" в **продукт, который хочется открывать**. Референсы: Brilliant, Uxcel, Deepstash — чистые, карточные, с ощущением прогресса. Пользователь должен чувствовать, что растёт.

---

## Design Principles

1. **Progress is visible** — пользователь всегда видит, где он и сколько осталось.
2. **Content is king** — интерфейс не конкурирует с текстом кейса. Меньше хрома, больше контента.
3. **Every action has a reward** — завершил шаг → получил визуальный отклик. Решил кейс → оценка в виде результата.
4. **Mobile-first** — SolvePage сейчас нечитаема на телефоне. Колонки сворачиваются, не ломаются.

---

## Stack Decision

| До | После |
|---|---|
| Vanilla CSS (~2000 строк в одном файле) | Tailwind CSS v4 + shadcn/ui |
| Нет дизайн-токенов | CSS custom properties в `tailwind.config` |
| Кастомные кнопки/инпуты | shadcn/ui Button, Input, Tabs, Card, Badge, Progress, Sheet |

**shadcn/ui** выбран потому что: компоненты копируются в проект (не зависимость), легко кастомизировать под бренд, поддерживает dark mode из коробки, совместим с Radix UI accessibility.

---

## Color Tokens

```js
// tailwind.config.js → theme.extend.colors
colors: {
  brand: {
    50:  '#fff4f0',
    100: '#ffe4d8',
    500: '#ef5b2a',   // primary — сохраняем оранжевый как бренд
    600: '#d44b1f',
    700: '#b33d18',
  },
  surface: {
    DEFAULT: '#ffffff',
    muted:   '#f7f8fb',   // page background
    raised:  '#ffffff',   // cards
    overlay: '#f0f2f7',   // hover states, inactive tabs
  },
  canvas: {
    DEFAULT: '#162033',   // dark hero / header
    subtle:  '#1e2d44',
    muted:   '#263650',
  },
  ink: {
    DEFAULT: '#17202f',   // body text
    muted:   '#5a6a85',   // secondary text, labels
    subtle:  '#9aaabb',   // placeholder, hint
    inverse: '#dbe3ef',   // text on dark bg
  },
  accent: {
    DEFAULT: '#6366f1',   // indigo — вторичный акцент (progress, links, AI)
    muted:   '#eef2ff',
  },
  success: '#10b981',
  warning: '#f59e0b',
  error:   '#ef4444',
}
```

---

## Typography

```js
// tailwind.config.js → theme.extend
fontFamily: {
  sans: ['Inter', 'ui-sans-serif', 'system-ui'],
}

// Шкала (использовать через Tailwind классы):
// text-xs   → 0.75rem / labels, badges
// text-sm   → 0.875rem / secondary text
// text-base → 1rem / body
// text-lg   → 1.125rem / subheadings
// text-xl   → 1.25rem / card titles
// text-2xl  → 1.5rem / page titles
// text-3xl  → 1.875rem / hero headings

// Weights: font-normal (400) / font-medium (500) / font-semibold (600) / font-bold (700)
```

Правила:
- **Uppercase мелкий текст** (eyebrow labels) — `text-xs font-bold tracking-widest text-brand-500 uppercase`
- Заголовки страниц — `text-2xl font-bold text-ink`
- Вторичные подписи — `text-sm text-ink-muted`

---

## Spacing & Layout

```
Базовая единица: 4px (Tailwind: 1 = 4px)
Page padding: px-6 py-8 (mobile: px-4 py-6)
Card padding: p-6
Gap between cards: gap-4 или gap-6
Max width: max-w-7xl mx-auto
```

**Breakpoints:**
- `sm` 640px — стек колонок
- `md` 768px — двухколоночный грид
- `lg` 1024px — трёхколоночный SolvePage

---

## Border Radius & Shadows

```
Кнопки, инпуты: rounded-lg (8px)
Карточки: rounded-xl (12px)
Модалки / большие карточки: rounded-2xl (16px)
Бейджи: rounded-full

Тени:
shadow-sm → subtle border replacement
shadow-md → hover state, popovers
shadow-lg → dropdowns, side sheet
```

---

## Components Inventory

### Новые / из shadcn/ui

| Компонент | Где используется |
|---|---|
| `<Button variant="default/outline/ghost">` | Все CTA |
| `<Card> + <CardHeader> + <CardContent>` | Кейсы, шаги, определения |
| `<Tabs> + <TabsList> + <TabsTrigger>` | LearningPage, SolvePage side panels |
| `<Progress>` | Прогресс по шагам, квиз |
| `<Badge>` | Сложность, категории, статусы |
| `<Sheet>` | Мобильный coach-панель (вместо 3й колонки) |
| `<Textarea>` | Ответ на шаг |
| `<Separator>` | Разделители в панелях |
| `<Skeleton>` | Loading states при генерации кейса |

### Кастомные (новые)

| Компонент | Описание |
|---|---|
| `<StepIndicator>` | Numbered steps — inactive / active / completed |
| `<ScoreBadge>` | Финальная оценка: большая цифра + цветовой сигнал |
| `<CaseCard>` | Карточка кейса с треком, сложностью, индустрией |
| `<FlashCard>` | Flip-анимация с front/back |
| `<HintBox>` | Подсказка/обучающий блок с иконкой |
| `<StreakCounter>` | (Опционально) геймификация — серия решённых кейсов |

---

## Page-by-Page Redesign Specs

### StartPage (онбординг + генерация кейса)

**Сейчас:** Два экрана через state, кнопки-табы для трека, форма с select.

**Новый подход:**
- Центрированный layout, max-w-2xl
- **Шаг 1:** Два больших `<CaseCard>`-выбора (PM / Business) с иконкой, описанием и hover-эффектом
- **Шаг 2:** Три `<Card>` в ряд — Индустрия / Сложность / Контекст. Badge для выбранного значения.
- CTA кнопка `<Button size="lg">` фиксированная внизу (sticky на мобайле)
- Skeleton во время генерации вместо текстового "загрузка..."

---

### SolvePage (три колонки)

**Сейчас:** CSS Grid 280px / 1fr / 0.85fr — ломается на < 1280px.

**Новый подход:**

```
Desktop (lg+):    [Sidebar 260px] [Main editor 1fr] [Coach panel 360px]
Tablet (md):      [Sidebar 220px] [Main editor 1fr] [Coach → Sheet trigger]
Mobile:           Full-width editor, Sheet для сайдбара и коуча
```

- **Sidebar:** Sticky `<StepIndicator>` с completed checkmark и точным % прогресса
- **Main:** `<Textarea>` с автоматической высотой, кнопка Submit внизу карточки
- **Coach panel:** `<Tabs>` — "Кейс" / "Подсказки" / "Коуч-чат"
- AI-ответы коуча: отдельные пузыри, `animate-in` при появлении

---

### EvaluatePage (результат)

**Сейчас:** Простой текстовый вывод.

**Новый подход:**
- Hero `<ScoreBadge>` — большая цифра (0–100) с цветом (red/yellow/green)
- Accordion с фидбэком по каждому шагу
- CTA: "Решить ещё" / "Посмотреть ответы"

---

### LearningPage (учебные материалы)

**Сейчас:** shadcn-like Tabs уже есть, но стилизация ручная.

**Новый подход:**
- `<Tabs>` из shadcn/ui, замена кастомных `.tabs`
- Контент-карточки с `<Card>` — каждый раздел/глава
- Флэшкарды: CSS 3D flip через `perspective` + Tailwind `[transform-style:preserve-3d]`
- Квиз: зелёная/красная граница карточки + `<Badge>` с результатом

---

### QuizPage (практика)

**Сейчас:** Category picker → вопросы → результаты.

**Новый подход:**
- Category picker: grid карточек с иконкой и количеством вопросов
- Вопросы: одна карточка = один вопрос, `<Progress>` наверху (вопрос X из Y)
- Результат: `<ScoreBadge>` + список вопросов с правильными ответами

---

## Header / Navigation

**Сейчас:** Тёмный .hero с кнопками-состояниями.

**Новый подход:**
- Sticky header: `bg-canvas text-ink-inverse`, высота 56px
- Logo слева, nav по центру (кнопки → `<Button variant="ghost">` со светлым текстом)
- Активная вкладка: `border-b-2 border-brand-500` вместо filled bg
- На мобайле: hamburger → `<Sheet>` с nav

---

## Motion & Interactions

```
Transitions: duration-200 ease-out (по умолчанию)
Page transitions: fade-in (opacity 0→1, 150ms)
Card hover: hover:shadow-md hover:-translate-y-0.5 transition-all
Button press: active:scale-95
Loading skeleton: animate-pulse
AI message appear: animate-in slide-in-from-bottom-2 duration-300
Step complete: checkmark animate-in zoom-in duration-150
```

---

## Migration Strategy

### Фаза 1 — Инфраструктура (без визуальных изменений)
- [ ] Установить Tailwind v4 + PostCSS
- [ ] Установить shadcn/ui, настроить `components.json`
- [ ] Определить CSS-токены в `tailwind.config.js`
- [ ] Добавить `cn()` утилиту (`clsx + tailwind-merge`)

### Фаза 2 — Атомарные компоненты
- [ ] Заменить все кнопки на `<Button>`
- [ ] Заменить инпуты/select на shadcn `<Input>`, `<Select>`
- [ ] Заменить кастомные табы на shadcn `<Tabs>`
- [ ] Создать `<StepIndicator>`, `<ScoreBadge>`, `<HintBox>`

### Фаза 3 — Страницы
- [ ] StartPage
- [ ] SolvePage (mobile-first layout)
- [ ] EvaluatePage
- [ ] LearningPage
- [ ] QuizPage

### Фаза 4 — Полировка
- [ ] Skeleton loading states
- [ ] Motion / transitions
- [ ] Responsive audit на 375px / 768px / 1280px
- [ ] Удалить `styles.css` (убедиться что ничего не сломалось)
