# CLAUDE.md — AI Assistant Guide for BittsQuiz 2026

This file provides guidance for AI assistants working in this repository.

---

## Project Overview

**App Name:** BittsQuiz {currentYear} (auto-increments yearly — no hardcoded year anywhere)
**Type:** Full-stack Next.js webapp — quiz game with collectible characters (Quizlets)
**Status:** Fully functional — DB wired, auth working, all features live

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) + TypeScript |
| Styling | Tailwind CSS v4 + CSS custom properties for theming |
| Fonts | Plus Jakarta Sans (body) + Space Grotesk (headings) via next/font/google |
| UI Components | Custom components (shadcn unavailable, built manually) |
| Auth | NextAuth.js v5 (Google OAuth + admin username/password) |
| ORM | Prisma v7 |
| Database | PostgreSQL (Neon — see `.env`) |
| Real-time | Socket.io (integrated in DinoRex game mode) |
| Animations | Framer Motion |
| Icons | Lucide React + Emoji |
| Theming | next-themes (dark/light toggle, class-based) |
| Email | Nodemailer v7 (SMTP — new user alerts only; feedback is DB-stored) |
| Analytics | Vercel Analytics + Speed Insights |

---

## Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL database (Neon recommended: https://neon.tech)
- Google OAuth app (https://console.cloud.google.com)

### Setup

```bash
# Install dependencies
npm install

# Copy env file and fill in values
cp .env.example .env

# Push database schema
npm run db:push

# Seed with 50 official quizzes + all quizlets + packs
npm run db:seed

# Start development server
npm run dev
```

### Environment Variables (`.env`)

```env
DATABASE_URL="postgresql://..."        # Neon PostgreSQL connection string
NEXTAUTH_SECRET="..."                  # Random string: openssl rand -base64 32
NEXTAUTH_URL="http://localhost:3000"
GOOGLE_CLIENT_ID="..."                 # From Google Cloud Console
GOOGLE_CLIENT_SECRET="..."

# Admin credentials (used for admin panel login)
ADMIN_USERNAME="admin"
ADMIN_PASSWORD="..."
ADMIN_EMAIL="admin@quizlet.internal"

# UPI payment (merchant info shown to users — not secret)
NEXT_PUBLIC_UPI_ID="merchant@upi"
NEXT_PUBLIC_UPI_NAME="BittsQuiz"
UPI_ID="merchant@upi"
UPI_NAME="BittsQuiz"

# Background music URL (publicly accessible MP3 stream)
NEXT_PUBLIC_MUSIC_URL="https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3"

# Email / SMTP (for feedback form + new user registration alerts)
# Gmail: use App Password from Google Account → Security → App Passwords
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_SECURE="false"
SMTP_USER="your-gmail@gmail.com"
SMTP_PASS="your-app-password"
ADMIN_NOTIFY_EMAIL="your-gmail@gmail.com"   # defaults to SMTP_USER if unset
```

---

## Directory Structure

```
app/
├── layout.tsx                    Root layout — ThemeProvider + SessionProvider + Vercel Analytics
├── page.tsx                      Redirects: logged in → /dashboard, else → /login
├── login/page.tsx                Google sign-in screen
├── certificate/page.tsx          Completion certificate (only if all quizlets owned)
├── globals.css                   CSS variables for dark/light theme + Tailwind overrides
├── (main)/                       Auth-guarded area (sidebar layout + AudioProvider)
│   ├── layout.tsx                Auth guard + Sidebar (desktop) + MobileNav + OnlinePing + AudioPlayer
│   ├── dashboard/page.tsx        Play-first hero + category quick-play + stats (server component)
│   ├── discover/page.tsx         Browse quizzes — shows ✓ Completed badge on perfect-score quizzes
│   ├── quiz/[id]/page.tsx        Quiz player (music auto-pauses here)
│   ├── marketplace/page.tsx      Buy packs with coins
│   ├── quizlets/page.tsx         View/sell owned Quizlet characters (+ Hidden section)
│   ├── quiz-maker/page.tsx       Create and publish custom quizzes
│   ├── leaderboard/page.tsx      Top players — green online dot if active within 5 min
│   ├── feedback/page.tsx         User feedback form → saves to DB (no email)
│   ├── info/page.tsx             All quizlets directory with rarity guide
│   ├── game/page.tsx             Game mode selection hub
│   ├── buy-coins/page.tsx        UPI payment flow for coins
│   ├── upgrade/page.tsx          UPI payment flow for Pro
│   └── admin/
│       ├── quizzes/page.tsx      List all quizzes with Edit links
│       ├── quizzes/[id]/edit/    Edit quiz title/description/category/difficulty/questions
│       ├── payments/page.tsx     Approve/reject pending UPI payment requests
│       └── feedback/page.tsx     View all user feedback — filter by type, mark read/unread
└── api/
    ├── auth/[...nextauth]/       NextAuth handler
    ├── feedback/                 POST — saves feedback to DB (Feedback model)
    ├── quizzes/                  GET quizzes list, POST create quiz
    ├── quizzes/[id]/             GET single quiz; PATCH (admin) update quiz + questions
    ├── attempt/                  POST quiz attempt, awards coins
    ├── packs/                    GET active packs (incl. festival packs)
    ├── packs/open/               POST open pack, roll characters
    ├── quizlets/                 GET owned quizlets
    ├── quizlets/sell/            POST sell a quizlet for coins
    ├── user/stats/               GET dashboard stats
    ├── user/ping/                POST update lastSeenAt — called every 2 min by OnlinePing
    ├── user/submit-payment/      POST submit UTR number for UPI payment
    ├── admin/payments/
    │   ├── route.ts              GET list payment requests
    │   └── [id]/route.ts         PATCH approve/reject payment → credit coins/pro
    └── admin/feedback/
        └── route.ts              GET all feedback; PATCH mark isRead

components/
├── layout/Sidebar.tsx            Navigation sidebar (desktop only) — theme toggle + admin nav (incl. Feedback)
├── layout/MobileNav.tsx          Bottom tab bar (mobile only, md:hidden) — 5 key nav items
├── layout/OnlinePing.tsx         Client component — silently POSTs /api/user/ping every 2 min
├── ThemeProvider.tsx             next-themes wrapper (class-based, default: dark)
├── IntroOverlay.tsx              First-visit onboarding overlay (5 steps, localStorage key bq_intro_seen_v1)
├── AudioPlayer.tsx               Floating music player (bottom-right) — volume + on/off
├── quiz/QuizPlayer.tsx           Interactive quiz — answers shuffled randomly each session
├── quiz/QuizMakerForm.tsx        Quiz creation form
├── marketplace/
│   ├── MarketplaceClient.tsx     Pack browsing + purchase
│   └── PackOpeningModal.tsx      Animated pack reveal (tap cards)
├── quizlets/QuizletsClient.tsx   Collection grid + sell + filters + Hidden section
└── game/
    ├── GameModesClient.tsx       Mode selection
    ├── HackDevGame.tsx           60-second tech quiz sprint
    ├── DinoRexLobby.tsx          Elimination game (AI sim mode)
    └── SpeedBlitzGame.tsx        20 questions in 30 seconds

lib/
├── auth.ts                       NextAuth config — Google + admin credentials + createUser email event
├── db.ts                         Prisma client singleton
├── email.ts                      Nodemailer helper — sendEmail() + ADMIN_EMAIL constant
├── audio-context.tsx             React context for background music state + controls
├── quizlets-data.ts              All character definitions
├── packs-data.ts                 All pack definitions
├── festivals.ts                  Festival calendar (6 festivals)
├── roll.ts                       Pack opening RNG logic
└── utils.ts                      cn(), CATEGORIES, RARITY_COLORS, SELL_VALUES

prisma/
├── schema.prisma                 Full DB schema (includes PaymentRequest, Feedback models + lastSeenAt on User)
└── seed.ts                       50 official quizzes + all quizlets + packs
```

---

## Core Domain Concepts

### Quizlets (Characters)
- Called "Quizlets" in-game (not "characters")
- 55 total: spread across 7 packs + 3 global uniques
- Each has: name, rarity, pack, icon (emoji), color gradient, description
- Rarities: `common` | `uncommon` | `rare` | `epic` | `legendary` | `secret` | `unique` | `impossible`
- Secret/Unique/Impossible have `isHidden: true` — shown in a separate "Hidden" section in the Quizlets tab, not in Info tab or pack descriptions

### Rarity Visual System
Defined in `lib/utils.ts → RARITY_COLORS`:
- Common: gray border, no glow
- Uncommon: green border, soft glow
- Rare: blue border, medium glow
- Epic: purple border, strong glow
- Legendary: gold border, animated pulse (`legendary-card` CSS class)
- Secret: dark/red border
- Unique: pink border, rainbow animation (`rainbow-card`)
- Impossible: full rainbow animation

### Coin Economy
- 1 correct quiz answer = **5 coins**
- Selling a quizlet returns `sellValue` coins (defined in `SELL_VALUES` in utils.ts)
- Pack costs: 80–500 coins (festival: 160–250)
- Coins can also be purchased via UPI (1 coin = ₹1)

### Pack Opening (`lib/roll.ts`)
When a pack is opened, guaranteed slots: 2 common, 2 uncommon, 1 rare.
One bonus roll can hit epic/legendary/secret/unique.
Rainbow pack: tiny chance (0.001%) for the impossible character.
If user already owns a quizlet: refund coins equal to its sell value.

### Festival System (`lib/festivals.ts`)
6 festivals hardcoded by `MM-DD` date. On festival days, `GET /api/packs` includes
the festival pack slug. No DB change needed — pure date comparison at request time.

### Pre-made Quiz Content
10 categories × 5 quizzes (difficulty 1–5) = **50 official quizzes** seeded via `prisma/seed.ts`.
Categories: football, cricket, harry-potter, technology, avengers, artists, musicians, math, science, physics.

### Quiz Answer Shuffling
QuizPlayer shuffles answer options on every session using a seeded Fisher-Yates shuffle (`shuffleOrder` in `components/quiz/QuizPlayer.tsx`). The correct answer mapping is preserved — do not change this logic.

### Game Modes
- **HackDev**: Single player, tech questions, 60-second timer
- **DinoRex**: Elimination mode (practice vs AI bots; real multiplayer via Socket.io pending)
- **Speed Blitz**: 20 questions in 30 seconds, all categories

### UPI Payment Flow
1. User selects amount on `/buy-coins` or `/upgrade`
2. QR code + UPI deep link shown (`upi://pay?pa=...`)
3. User pays in GPay/PhonePe/etc., enters UTR number
4. `POST /api/user/submit-payment` → creates `PaymentRequest` (status: pending)
5. Admin sees it at `/admin/payments` → clicks Approve or Reject
6. On approve: coins credited or Pro granted via `prisma.user.update`

### Feedback System
- `/feedback` page with type selector (General, Bug Report, Feature Request, Content Issue, Other)
- Submissions POST to `/api/feedback` → saved to `Feedback` DB table (no email)
- Admin views all feedback at `/admin/feedback` — filter by type, mark read/unread, shows user info
- `Feedback` model: `id`, `userId`, `type`, `message`, `isRead` (default false), `createdAt`

### New User Onboarding
- `components/IntroOverlay.tsx` — shown once on first login (localStorage key `bq_intro_seen_v1`)
- 5-step walkthrough: Welcome → Earn Coins → Collect Quizlets → Compete → Let's Play
- Has Skip button; final step links directly to `/discover`
- Rendered in `app/(main)/dashboard/page.tsx`

### Online Status (Leaderboard)
- `User.lastSeenAt DateTime?` field updated every 2 minutes by `OnlinePing` client component
- Leaderboard shows green dot on avatar if `lastSeenAt > now - 5 minutes`
- `POST /api/user/ping` handles the update

### New User Email Notification
- NextAuth `events.createUser` fires when a brand-new Google account signs up
- Sends admin notification email via `lib/email.ts → sendEmail()`

### Quiz Completion Tracking
- Discover page fetches user's `QuizAttempt` records where `score === total` (perfect score)
- Those quiz cards show a green **✓ Completed** badge and green border

### Mobile Navigation
- Desktop: full `Sidebar` (hidden on mobile via `hidden md:flex`)
- Mobile: `MobileNav` bottom tab bar with 5 items (Home, Discover, Shop, Quizlets, Feedback)
- Main content has `pb-20 md:pb-0` to clear the mobile nav bar

### Dark/Light Theme
- Managed by `next-themes` with `attribute="class"` — adds `dark` or `light` to `<html>`
- CSS custom properties in `globals.css` define `--background`, `--surface`, `--main-bg`, `--sidebar-*`, `--text-base`
- Structural elements use `style={{ background: "var(--main-bg)" }}` etc.
- Light mode overrides for Tailwind utility classes (`text-white`, `bg-white/5`, `border-white/10`, etc.) are in `globals.css`
- **Do not use hardcoded dark colors** (`bg-[#0d0a22]`, `bg-gray-900`, `bg-[#070511]`) — use `bg-white/5` or CSS variables instead
- Select/input/textarea elements are globally overridden in `.light` to show white bg + dark text

### Background Music
- `AudioProvider` in `lib/audio-context.tsx` wraps `(main)/layout.tsx`
- State (enabled, volume) persisted in `localStorage` keys `bq_music_enabled` / `bq_music_volume`
- Auto-pauses on `/quiz/[id]` routes, resumes on leaving
- Default track: `NEXT_PUBLIC_MUSIC_URL` env var (SoundHelix-Song-1.mp3 by default)
- UI: floating button bottom-right via `components/AudioPlayer.tsx`

### Year Auto-Increment
The app name is always `BittsQuiz {new Date().getFullYear()}`.
Never hardcode a year — always use `new Date().getFullYear()`.

---

## Key Files to Know

| File | Purpose |
|------|---------|
| `lib/quizlets-data.ts` | All 55 character definitions |
| `lib/packs-data.ts` | All 13 pack definitions (7 standard + 6 festival) |
| `lib/roll.ts` | Pack opening RNG — edit drop rates here |
| `lib/festivals.ts` | Add/modify festival dates here |
| `lib/utils.ts` | RARITY_COLORS, SELL_VALUES, CATEGORIES |
| `lib/email.ts` | sendEmail() helper — used by auth createUser event (new user alerts); NOT used by feedback |
| `lib/audio-context.tsx` | Background music context + state |
| `app/icon.svg` | App favicon — SVG lightning bolt on purple-to-pink gradient (auto-served by Next.js) |
| `app/globals.css` | Theme CSS variables + font config + light mode Tailwind overrides |
| `components/ThemeProvider.tsx` | next-themes wrapper |
| `components/layout/MobileNav.tsx` | Mobile bottom nav — edit items here |
| `components/layout/OnlinePing.tsx` | Pings /api/user/ping every 2 min |
| `prisma/schema.prisma` | DB schema — run `npm run db:push` after changes |
| `prisma/seed.ts` | Re-run `npm run db:seed` to re-seed |

---

## Development Workflow

### Branches
- AI branches: always use `claude/` prefix
- Never push to `master` without explicit permission

### Commits
- Clear, present-tense commit messages
- Keep commits focused

### Push
```bash
git push -u origin <branch-name>
```

### After Schema Changes
```bash
npm run db:push      # push schema changes to DB
npx prisma generate  # regenerate client types
npm run db:seed      # re-seed data (idempotent)
```

### After Adding New Quizlets/Packs
1. Add to `lib/quizlets-data.ts` or `lib/packs-data.ts`
2. Re-run `npm run db:seed`

---

## AI Assistant Rules

- **Read files before editing** — never assume contents
- **No hardcoded years** — always use `new Date().getFullYear()`
- **No hardcoded dark colors** — use `bg-white/5`, `bg-white/10`, or `var(--surface)` / `var(--background)` CSS variables
- **No over-engineering** — minimal changes, no unnecessary abstractions
- **Security**: no SQL injection, no exposed secrets, validate at API boundaries
- **Prisma**: use `prisma.user.update` with `increment` for coin updates (not read-modify-write); after schema changes run both `db:push` AND `prisma generate`
- **Auth**: all `(main)` routes auto-guard via `app/(main)/layout.tsx`; admin routes additionally check `isAdmin` flag
- **Theming**: structural backgrounds → CSS variables; Tailwind utility overrides already in `globals.css`
- **Email**: `lib/email.ts` is only used for new-user signup alerts now; feedback no longer uses email — do not re-add email to the feedback flow
- **Mobile**: pages should use `p-4 md:p-8` responsive padding; sidebar is desktop-only
- **Fonts**: body = Plus Jakarta Sans (`--font-jakarta`), headings = Space Grotesk (`--font-grotesk`) — do not change font imports in `app/layout.tsx`
- **Confirm before**: deleting files, dropping DB tables, force-pushing
