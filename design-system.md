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

All theme tokens are defined as CSS custom properties in `app/globals.css`. The app is **dark-first** with an opt-in light mode managed by `next-themes` (class-based toggling on `<html>`).

### Dark Theme (Default)

| Token              | Value                        | Usage                        |
|--------------------|------------------------------|------------------------------|
| `--background`     | `#070511`                    | Page background              |
| `--surface`        | `#110d2a`                    | Cards, panels, elevated UI   |
| `--border`         | `#2d1f5e`                    | Borders, dividers            |
| `--accent`         | `#8b5cf6` (purple-500)       | Primary accent               |
| `--accent2`        | `#ec4899` (pink-500)         | Secondary accent             |
| `--text-base`      | `#f0f0ff`                    | Primary text                 |
| `--sidebar-from`   | `#1a0a3e`                    | Sidebar gradient start       |
| `--sidebar-mid`    | `#110830`                    | Sidebar gradient midpoint    |
| `--sidebar-to`     | `#0d0622`                    | Sidebar gradient end         |
| `--main-bg`        | gradient `#070511 → #0d0822` | Main content area background |

### Light Theme

| Token              | Value                        | Usage                        |
|--------------------|------------------------------|------------------------------|
| `--background`     | `#f0ebff`                    | Page background              |
| `--surface`        | `#e9e0ff`                    | Cards, panels, elevated UI   |
| `--border`         | `#c4b5fd`                    | Borders, dividers            |
| `--accent`         | `#7c3aed` (purple-600)       | Primary accent               |
| `--accent2`        | `#db2777` (pink-600)         | Secondary accent             |
| `--text-base`      | `#1e1b4b`                    | Primary text                 |
| `--sidebar-from`   | `#ede9fe`                    | Sidebar gradient start       |
| `--sidebar-mid`    | `#ddd6fe`                    | Sidebar gradient midpoint    |
| `--sidebar-to`     | `#c4b5fd`                    | Sidebar gradient end         |
| `--main-bg`        | gradient `#f5f3ff → #ede9fe` | Main content area background |

### Light Mode Overrides

In light mode, Tailwind utility classes are globally remapped in `globals.css`:

| Dark Utility          | Light Override         |
|-----------------------|------------------------|
| `text-white`          | `#1e1b4b`              |
| `text-gray-300`       | `#374151`              |
| `text-gray-400`       | `#4b5563`              |
| `text-gray-500`       | `#6b7280`              |
| `bg-white/5`          | `rgba(124,58,237,0.05)`|
| `bg-white/10`         | `rgba(124,58,237,0.08)`|
| `border-white/10`     | `rgba(124,58,237,0.15)`|
| `border-white/20`     | `rgba(124,58,237,0.2)` |

> **Rule:** Never use hardcoded dark colors (`bg-[#0d0a22]`, `bg-gray-900`). Use `bg-white/5`, `bg-white/10`, or CSS variables instead.

---

## Typography

Fonts are loaded via `next/font/google` in `app/layout.tsx`.

### Font Stack

| Role     | Family            | CSS Variable       | Weights             |
|----------|-------------------|--------------------|--------------------|
| Body     | Plus Jakarta Sans  | `--font-jakarta`   | 400, 500, 600, 700, 800 |
| Headings | Space Grotesk      | `--font-grotesk`   | 400, 500, 600, 700      |

### Application

```css
/* Body text */
font-family: var(--font-jakarta), "Plus Jakarta Sans", system-ui, sans-serif;

/* Headings (h1–h6, .font-display) */
font-family: var(--font-grotesk), "Space Grotesk", var(--font-jakarta), system-ui, sans-serif;
letter-spacing: -0.025em;
```

> **Rule:** Do not change font imports in `app/layout.tsx`.

---

## Rarity Color System

Defined in `lib/utils.ts` → `RARITY_COLORS`. Used for quizlet cards, pack reveals, and marketplace items.

| Rarity       | Border              | Glow                                  | Text Color        | CSS Class       |
|-------------|---------------------|---------------------------------------|-------------------|-----------------|
| Common       | `border-gray-400`   | none                                  | `text-gray-400`   | —               |
| Uncommon     | `border-green-400`  | `shadow-green-400/30 shadow-lg`       | `text-green-400`  | —               |
| Rare         | `border-blue-400`   | `shadow-blue-400/40 shadow-xl`        | `text-blue-400`   | —               |
| Epic         | `border-purple-500` | `shadow-purple-500/50 shadow-xl`      | `text-purple-500` | —               |
| Legendary    | `border-yellow-400` | `shadow-yellow-400/60 shadow-2xl`     | `text-yellow-400` | `legendary-card`|
| Secret       | `border-red-800`    | `shadow-red-800/50 shadow-2xl`        | `text-red-500`    | —               |
| Unique       | `border-pink-400`   | `shadow-pink-400/50 shadow-2xl`       | `text-pink-400`   | `rainbow-card`  |
| Impossible   | `border-transparent`| `shadow-2xl` + rainbow border         | gradient text     | `rainbow-card`  |

### Sell Values (coins)

| Rarity     | Coins   |
|-----------|---------|
| Common     | 10      |
| Uncommon   | 25      |
| Rare       | 60      |
| Epic       | 150     |
| Legendary  | 400     |
| Secret     | 1,000   |
| Unique     | 5,000   |
| Impossible | 99,999  |

---

## Milestone Tier Colors

Defined in `lib/milestones-data.ts` → `TIER_COLORS`. 50 milestones at 1K–50K thresholds.

| Tier      | Range       | Border              | Text Color         | Animation Class |
|-----------|-------------|---------------------|--------------------|-----------------|
| Bronze    | 1K – 5K     | `border-amber-600`  | `text-amber-500`   | —               |
| Silver    | 6K – 10K    | `border-slate-400`  | `text-slate-300`   | —               |
| Gold      | 11K – 20K   | `border-yellow-400` | `text-yellow-400`  | `legendary-card`|
| Platinum  | 21K – 35K   | `border-cyan-400`   | `text-cyan-400`    | —               |
| Diamond   | 36K – 50K   | `border-purple-400` | `text-purple-400`  | `rainbow-card`  |

Milestone badge gradients use per-milestone `colorFrom` / `colorTo` values (hex) applied as inline `background: linear-gradient(...)`.

---

## Category Colors

Defined in `lib/utils.ts` → `CATEGORIES`. Each category has a Tailwind text color for its icon.

| Category         | Icon Color         |
|------------------|--------------------|
| Football         | `text-green-400`   |
| Cricket          | `text-orange-400`  |
| Harry Potter     | `text-purple-400`  |
| Technology       | `text-blue-400`    |
| Avengers         | `text-red-400`     |
| Artists          | `text-pink-400`    |
| Musicians        | `text-violet-400`  |
| Math             | `text-cyan-400`    |
| Science          | `text-emerald-400` |
| Physics          | `text-sky-400`     |
| World Languages  | `text-amber-400`   |
| Flags            | `text-rose-400`    |
| Brand Logos      | `text-lime-400`    |
| Animals          | `text-yellow-400`  |
| Anime            | `text-fuchsia-400` |
| Grade 6          | `text-teal-400`    |

---

## Gradients

### Primary Brand Gradient

```
purple-600 → pink-600
```

Used for: primary buttons, avatar fallbacks, scrollbar thumb, audio player, mobile nav active states.

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
background: linear-gradient(135deg, var(--background) 0%, <mid> 50%, var(--background) 100%);
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

| Name            | Duration | Timing          | Description                                      |
|-----------------|----------|-----------------|--------------------------------------------------|
| `rainbow-spin`  | 2s       | linear infinite | Border color cycles through full rainbow spectrum |
| `glow-pulse`    | 2s       | ease-in-out     | Box-shadow oscillates (golden glow)               |
| `rainbow-glow`  | 3s       | ease-in-out     | Box-shadow cycles red → blue → purple             |
| `float`         | 3s       | ease-in-out     | `translateY` oscillates 0 to -8px                 |
| `shimmer`       | 3s       | linear          | Background position slides for text shimmer       |

### Utility Classes

| Class              | Animation                                         | Used For                     |
|--------------------|---------------------------------------------------|------------------------------|
| `.legendary-card`  | `glow-pulse 2s ease-in-out infinite`              | Legendary rarity, gold tier  |
| `.rainbow-card`    | `rainbow-spin 2s` + `rainbow-glow 3s`            | Unique/impossible, diamond   |
| `.float-anim`      | `float 3s ease-in-out infinite`                   | Floating UI elements         |
| `.shimmer-text`    | Gradient text with `shimmer 3s linear infinite`   | Promotional/highlight text   |

### Pack Opening

```css
.pack-reveal     { perspective: 1000px; }
.pack-card-flip  { transition: transform 0.6s ease; transform-style: preserve-3d; }
.pack-card-flip.flipped { transform: rotateY(180deg); }
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
::-webkit-scrollbar-thumb { background: linear-gradient(to bottom, #8b5cf6, #ec4899); border-radius: 3px; }
```

### Hidden Scrollbar

```css
.scrollbar-hide { scrollbar-width: none; -ms-overflow-style: none; }
.scrollbar-hide::-webkit-scrollbar { display: none; }
```

---

## Accessibility & Interaction

| Concern                | Approach                                                    |
|------------------------|-------------------------------------------------------------|
| Theme contrast         | Light mode uses `#1e1b4b` text on light purple backgrounds  |
| Disabled state         | `opacity-60` + `cursor-not-allowed`                         |
| Focus                  | Browser default focus rings (not overridden)                 |
| Touch targets          | Mobile nav items are full-width tap areas                    |
| Motion                 | Animations are decorative (glow, float); no motion-reduce override currently |
| Scale feedback         | `hover:scale-[1.02]` / `active:scale-[0.98]` on interactive cards |

---

## Design Principles

1. **Dark-first** — The app is designed for dark mode; light mode is a mapped inversion, not a separate design.
2. **Purple-pink brand identity** — The gradient `purple-600 → pink-600` is the visual signature across buttons, nav, scrollbar, and avatars.
3. **Glassmorphism** — Cards and surfaces use `bg-white/{opacity}` with subtle borders for depth, not solid backgrounds.
4. **Rarity-driven hierarchy** — Color, glow intensity, and animation escalate with rarity tier, creating natural visual hierarchy.
5. **CSS variables for theming** — Structural backgrounds use variables (`var(--surface)`, `var(--main-bg)`); Tailwind utilities handle component-level styling.
6. **Responsive by default** — Mobile-first with `md:` breakpoint for desktop sidebar; `pb-20 md:pb-0` clears mobile nav.
7. **Minimal custom CSS** — Animations and theme overrides live in `globals.css`; everything else uses Tailwind utilities.
