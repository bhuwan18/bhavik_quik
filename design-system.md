# BittsQuiz Design System

A comprehensive reference for the visual language, tokens, and component patterns used across BittsQuiz.

---

## Table of Contents

1. [Theme & Color Tokens](#theme--color-tokens)
2. [Typography](#typography)
3. [Rarity Color System](#rarity-color-system)
4. [Milestone Tier Colors](#milestone-tier-colors)
5. [Category Colors](#category-colors)
6. [Gradients](#gradients)
7. [Spacing & Layout](#spacing--layout)
8. [Component Patterns](#component-patterns)
9. [Animations & Effects](#animations--effects)
10. [Icons](#icons)
11. [Scrollbar & Utilities](#scrollbar--utilities)
12. [Accessibility & Interaction](#accessibility--interaction)
13. [Design Principles](#design-principles)

---

## Theme & Color Tokens

All theme tokens are defined as CSS custom properties in `app/globals.css`. The app is **dark-first** with a deep navy + amber/gold color scheme. Light mode is not currently defined — `--background` and related variables apply to both `:root` and `.dark`.

### Dark Theme (Default)

| Token              | Value                                                 | Usage                        |
|--------------------|-------------------------------------------------------|------------------------------|
| `--background`     | `#08091c`                                             | Page background              |
| `--surface`        | `#0d1230`                                             | Cards, panels, elevated UI   |
| `--border`         | `#1c2550`                                             | Borders, dividers            |
| `--accent`         | `#f59e0b` (amber-500)                                 | Primary accent               |
| `--accent2`        | `#60a5fa` (blue-400)                                  | Secondary accent             |
| `--text-base`      | `#eef2ff`                                             | Primary text                 |
| `--sidebar-from`   | `#0d1435`                                             | Sidebar gradient start       |
| `--sidebar-mid`    | `#090e25`                                             | Sidebar gradient midpoint    |
| `--sidebar-to`     | `#060b1c`                                             | Sidebar gradient end         |
| `--main-bg`        | `linear-gradient(135deg, #08091c 0%, #0d1230 50%, #08091c 100%)` | Main content area background |

> **Rule:** Never use hardcoded dark colors (`bg-[#0d0a22]`, `bg-gray-900`). Use `bg-white/5`, `bg-white/10`, or CSS variables instead.

---

## Typography

Fonts are loaded via `next/font/google` in `app/layout.tsx`.

### Font Stack

| Role     | Family            | CSS Variable       | Weights                  |
|----------|-------------------|--------------------|--------------------------|
| Body     | Plus Jakarta Sans  | `--font-jakarta`   | 400, 500, 600, 700, 800  |
| Headings | Space Grotesk      | `--font-grotesk`   | 400, 500, 600, 700       |

### Application

```css
/* Body text */
font-family: var(--font-jakarta), "Nunito", system-ui, sans-serif;

/* Headings (h1–h6, .font-display) */
font-family: var(--font-grotesk), "Rubik", var(--font-jakarta), sans-serif;
letter-spacing: -0.025em;
```

> **Rule:** Do not change font imports in `app/layout.tsx`.

---

## Rarity Color System

Defined in `lib/utils.ts` → `RARITY_COLORS`. Used for quizlet cards, pack reveals, and marketplace items.

| Rarity       | Border               | Glow                                           | Text Color         | CSS Class        |
|-------------|----------------------|------------------------------------------------|--------------------|------------------|
| Common       | `border-gray-400`    | none                                           | `text-gray-400`    | —                |
| Uncommon     | `border-green-400`   | `shadow-green-400/30 shadow-lg`                | `text-green-400`   | —                |
| Rare         | `border-blue-400`    | `shadow-blue-400/40 shadow-xl`                 | `text-blue-400`    | —                |
| Epic         | `border-purple-500`  | `shadow-purple-500/50 shadow-xl`               | `text-purple-500`  | —                |
| Legendary    | `border-yellow-400`  | `shadow-yellow-400/60 shadow-2xl`              | `text-yellow-400`  | `legendary-card` |
| Secret       | `border-red-800`     | `shadow-red-800/50 shadow-2xl`                 | `text-red-500`     | —                |
| Mystical     | `border-teal-400`    | `shadow-teal-400/60 shadow-2xl mystical-card`  | `text-teal-400`    | `mystical-card`  |
| Unique       | `border-pink-400`    | `shadow-pink-400/50 shadow-2xl`                | `text-pink-400`    | `rainbow-card`   |
| Impossible   | `border-transparent` | `shadow-2xl rainbow-border`                    | gradient text      | `rainbow-card`   |

### Sell Values (coins)

| Rarity     | Coins   |
|-----------|---------|
| Common     | 10      |
| Uncommon   | 25      |
| Rare       | 60      |
| Epic       | 150     |
| Legendary  | 400     |
| Secret     | 1,000   |
| Mystical   | 500     |
| Unique     | 5,000   |
| Impossible | 99,999  |

---

## Milestone Tier Colors

Defined in `lib/milestones-data.ts` → `TIER_COLORS`. 6 tiers spanning coin milestones from 1K to 100K, plus multi-type milestone tiers (quizzes, answers, categories, streak).

| Tier      | Coin Range        | Border               | Text Color         | Animation Class |
|-----------|-------------------|----------------------|--------------------|-----------------|
| Bronze    | 1K – 5K           | `border-amber-600`   | `text-amber-500`   | —               |
| Silver    | 6K – 10K          | `border-slate-400`   | `text-slate-300`   | —               |
| Gold      | 11K – 20K         | `border-yellow-400`  | `text-yellow-400`  | `legendary-card`|
| Platinum  | 21K – 35K         | `border-cyan-400`    | `text-cyan-400`    | —               |
| Diamond   | 36K – 50K         | `border-purple-400`  | `text-purple-400`  | `rainbow-card`  |
| Cosmic    | 51K – 100K        | `border-pink-400`    | `text-pink-400`    | `rainbow-card`  |

**Coin milestone thresholds:** 1K–60K (every 1K) + 65K, 70K, 75K, 85K, 100K — 65 total coin milestones.

Milestone badge gradients use per-milestone `colorFrom` / `colorTo` values (hex) applied as inline `background: linear-gradient(...)`.

---

## Category Colors

Defined in `lib/utils.ts` → `CATEGORIES`. 20 categories total; 5 are premium-gated.

| Category         | Icon Color          | Premium Tier |
|------------------|---------------------|-------------|
| Football         | `text-green-400`    | —           |
| Cricket          | `text-orange-400`   | —           |
| Harry Potter     | `text-purple-400`   | —           |
| Technology       | `text-blue-400`     | —           |
| Avengers         | `text-red-400`      | —           |
| Artists          | `text-pink-400`     | —           |
| Musicians        | `text-violet-400`   | —           |
| Math             | `text-cyan-400`     | —           |
| Science          | `text-emerald-400`  | —           |
| Physics          | `text-sky-400`      | —           |
| World Languages  | `text-amber-400`    | —           |
| Flags            | `text-rose-400`     | —           |
| Brand Logos      | `text-lime-400`     | —           |
| Animals          | `text-yellow-400`   | —           |
| Anime            | `text-fuchsia-400`  | —           |
| Grade 6          | `text-teal-400`     | Tier 1      |
| Geography        | `text-green-600`    | Tier 1      |
| World Travel     | `text-sky-500`      | Tier 2      |
| Gaming           | `text-indigo-400`   | Tier 2      |
| Memes            | `text-yellow-400`   | Tier 3      |

---

## Gradients

### Primary Brand Gradient (Buttons, CTAs)

```
purple-600 → pink-600
```

Used for: primary buttons, avatar fallbacks, mobile nav active states.

```css
/* CSS */
background: linear-gradient(135deg, #7c3aed, #ec4899);

/* Tailwind */
bg-gradient-to-r from-purple-600 to-pink-600
```

### Sidebar Gradient

```css
background: linear-gradient(180deg, var(--sidebar-from) 0%, var(--sidebar-mid) 50%, var(--sidebar-to) 100%);
```

### Main Background Gradient

```css
background: var(--main-bg);
/* = linear-gradient(135deg, #08091c 0%, #0d1230 50%, #08091c 100%) */
```

### Active Nav Item Gradient

```
/* User nav */
bg-gradient-to-r from-purple-600/30 to-pink-600/20

/* Admin nav */
bg-gradient-to-r from-purple-600/40 to-pink-600/30
```

---

## Spacing & Layout

### Responsive Padding

| Context          | Mobile    | Desktop   |
|------------------|-----------|-----------|
| Page content     | `p-4`     | `p-8`     |
| Bottom clearance | `pb-20`   | `pb-0`    |

### Sidebar

| State      | Width  |
|-----------|--------|
| Expanded   | 240px  |
| Collapsed  | 68px   |

Collapse state is stored in `localStorage` key `bq_sidebar_collapsed`.

### Mobile Navigation

| Property     | Value                  |
|-------------|------------------------|
| Height       | 56px                   |
| Position     | Fixed bottom           |
| Visibility   | `md:hidden`            |
| More drawer  | Max 80vh, rounded 20px |

### Border Radius Scale

| Usage           | Radius        |
|-----------------|---------------|
| Buttons         | `rounded-2xl` |
| Cards           | `rounded-2xl` |
| Pack cards      | `rounded-3xl` |
| Small elements  | `rounded-xl`  |
| Scrollbar thumb | `3px`         |
| More drawer     | `20px` (top)  |

---

## Component Patterns

### Cards

```
/* Base card */
bg-white/5 border border-white/10 rounded-2xl

/* Card with hover */
hover:bg-gradient-to-br hover:from-purple-600/20 hover:to-pink-600/10
hover:border-purple-500/50

/* Quiz card */
bg-white/3 border border-white/5 rounded-xl p-3 md:p-5

/* Premium/locked overlay */
bg-black/40 backdrop-blur-sm

/* Glow card hover (amber accent) */
.glow-card:hover → box-shadow: 0 0 28px rgba(245,158,11,0.25), 0 0 56px rgba(245,158,11,0.1)
```

### Buttons

```
/* Primary */
bg-gradient-to-r from-purple-600 to-pink-600
hover:from-purple-500 hover:to-pink-500
text-white font-bold rounded-2xl

/* Secondary */
bg-white/10 border border-white/10 text-gray-300
hover:bg-white/15

/* Destructive */
bg-red-500/10 text-red-400
hover:bg-red-500/20 hover:border-red-500/20

/* Link-style */
text-purple-400 hover:text-purple-300 transition-colors

/* Interactive feedback */
hover:scale-[1.02] active:scale-[0.98]
```

### Avatar Ring

```
/* Pro/Max user */
ring-yellow-400 shadow-md shadow-yellow-400/50

/* Regular user */
ring-purple-500/50
```

### Notification Badge

```
bg-red-500 text-white rounded-full text-xs
```

### Audio Player (Floating)

```
/* Button: 12x12 rounded-full */
background: linear-gradient(135deg, #7c3aed, #ec4899);

/* Playing glow */
box-shadow: 0 0 16px rgba(139, 92, 246, 0.6);

/* Expanded panel */
rounded-2xl p-4, uses CSS variables
```

---

## Animations & Effects

All keyframes are defined in `app/globals.css`.

### Keyframes

| Name                | Duration | Timing                          | Description                                           |
|---------------------|----------|---------------------------------|-------------------------------------------------------|
| `rainbow-spin`      | 2s       | linear infinite                 | Border color cycles through full rainbow spectrum      |
| `glow-pulse`        | 2s       | ease-in-out infinite            | Box-shadow oscillates (golden glow)                   |
| `rainbow-glow`      | 3s       | ease-in-out infinite            | Box-shadow cycles red → blue → purple                 |
| `float`             | 3s       | ease-in-out infinite            | `translateY` oscillates 0 to -8px                     |
| `mystical-shimmer`  | 2.5s     | ease-in-out infinite            | Box-shadow pulses with teal glow (Mystical rarity)    |
| `legendary-burst`   | 0.5s     | cubic-bezier(0.34,1.56,0.64,1) | Scale entrance (0.82→1.1→1) for legendary card reveal |
| `card-shimmer`      | 1.6s     | ease-in-out infinite            | Opacity + subtle scale pulse on unrevealed card backs |
| `card-flip-in`      | 0.4s     | cubic-bezier(0.34,1.2,0.64,1)  | Staggered entrance: rotateY(-90°) → 0 + scale 0.8→1  |

### Utility Classes

| Class                 | Animation                                          | Used For                              |
|-----------------------|----------------------------------------------------|---------------------------------------|
| `.legendary-card`     | `glow-pulse 2s ease-in-out infinite`               | Legendary rarity, gold milestone tier |
| `.rainbow-card`       | `rainbow-spin 2s` + `rainbow-glow 3s`             | Unique/impossible, diamond/cosmic     |
| `.float-anim`         | `float 3s ease-in-out infinite`                    | Floating UI elements                  |
| `.mystical-card`      | `mystical-shimmer 2.5s ease-in-out infinite`       | Mystical rarity quizlet cards         |
| `.legendary-reveal`   | `legendary-burst 0.5s … forwards`                 | Pack opening — legendary card reveal  |
| `.card-shimmer`       | `card-shimmer 1.6s ease-in-out infinite`           | Unrevealed pack card backs            |
| `.bulk-card-reveal`   | `card-flip-in 0.4s … forwards` (opacity: 0 init)  | Staggered entrance of bulk pack cards |

### Pack Opening

```css
.pack-reveal { perspective: 1200px; }
.pack-card-flip {
  transition: transform 0.65s cubic-bezier(0.45, 0, 0.25, 1);
  transform-style: preserve-3d;
  position: relative;
}
.pack-card-flip.flipped { transform: rotateY(180deg); }
.pack-card-back,
.pack-card-face {
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
  position: absolute;
  inset: 0;
  border-radius: inherit;
}
.pack-card-face { transform: rotateY(180deg); }
```

### Interaction Transitions

- Hover scale: `hover:scale-[1.02]`
- Active scale: `active:scale-[0.98]`
- Color transitions: `transition-colors` (default 150ms)
- General transitions: `transition-all duration-200`

---

## Icons

### Custom SVG Icons

Located in `components/icons/`. Each accepts `size`, `className`, and `strokeWidth` props.

| Component             | Category   | Style   |
|-----------------------|-----------|---------|
| `SoccerBallIcon`      | Football   | Stroke  |
| `CricketWicketIcon`   | Cricket    | Stroke  |
| `AvengersIcon`        | Avengers   | Fill    |

### Icon Library

**Lucide React** (`lucide-react`) is the primary icon library. Common icons used:

- **Navigation:** `LayoutDashboard`, `Compass`, `Trophy`, `ShoppingBag`, `Layers`, `Gamepad2`, `Medal`
- **Actions:** `MessageSquare`, `Store`, `Bell`, `PenLine`, `Users`, `CreditCard`, `Settings`
- **Theme toggle:** `Moon`, `Sun`
- **Navigation controls:** `ChevronLeft`, `ChevronRight`, `Menu`, `X`
- **Forms:** `ClipboardList`, `MessageCircle`, `LogOut`

### Emoji Icons

Categories and quizlets use emoji as primary identifiers (e.g., category icon, quizlet `icon` field). These are rendered as plain text, not image assets.

---

## Scrollbar & Utilities

### Custom Scrollbar

```css
::-webkit-scrollbar       { width: 6px; }
::-webkit-scrollbar-track { background: var(--background); }
::-webkit-scrollbar-thumb { background: var(--accent); border-radius: 3px; }
/* = amber #f59e0b in dark theme */
```

### Hidden Scrollbar

```css
.scrollbar-hide { scrollbar-width: none; -ms-overflow-style: none; }
.scrollbar-hide::-webkit-scrollbar { display: none; }
```

---

## Accessibility & Interaction

| Concern                | Approach                                                                      |
|------------------------|-------------------------------------------------------------------------------|
| Focus rings            | `outline: 2px solid var(--accent)` with 2px offset + 4px border-radius (`:focus-visible` only) |
| Unfocused              | `:focus:not(:focus-visible)` has no outline — keyboard-only users get clear rings |
| Disabled state         | `opacity-60` + `cursor-not-allowed`                                           |
| Touch targets          | Mobile nav items are full-width tap areas                                     |
| Reduced motion         | `@media (prefers-reduced-motion: reduce)` disables all animations and transitions |
| Scale feedback         | `hover:scale-[1.02]` / `active:scale-[0.98]` on interactive cards            |

---

## Design Principles

1. **Dark navy-first** — The app uses a deep navy (`#08091c`) base. Light mode is not currently implemented.
2. **Amber/gold accent system** — `--accent` (`#f59e0b`) drives scrollbar, focus rings, and hover glows; `--accent2` (`#60a5fa`) is the secondary blue accent.
3. **Purple-pink for primary actions** — Buttons, CTAs, avatar fallbacks, and nav active states still use `purple-600 → pink-600` gradient for strong call-to-action contrast against the navy base.
4. **Glassmorphism** — Cards and surfaces use `bg-white/{opacity}` with subtle borders for depth, not solid backgrounds.
5. **Rarity-driven hierarchy** — Color, glow intensity, and animation escalate with rarity tier, creating natural visual hierarchy.
6. **CSS variables for theming** — Structural backgrounds use variables (`var(--surface)`, `var(--main-bg)`); Tailwind utilities handle component-level styling.
7. **Responsive by default** — Mobile-first with `md:` breakpoint for desktop sidebar; `pb-20 md:pb-0` clears mobile nav.
8. **Minimal custom CSS** — Animations and theme tokens live in `globals.css`; everything else uses Tailwind utilities.
9. **Reduced-motion respect** — All animations are disabled via `@media (prefers-reduced-motion: reduce)`.
