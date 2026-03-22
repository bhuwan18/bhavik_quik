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
| Real-time | Pusher Channels (DinoRex multiplayer; socket.io installed but unused for game logic) |
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

# Seed with 55 official quizzes + all quizlets + packs
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

# Email / SMTP (for new user registration alerts)
# Gmail: use App Password from Google Account → Security → App Passwords
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_SECURE="false"
SMTP_USER="your-gmail@gmail.com"
SMTP_PASS="your-app-password"
ADMIN_NOTIFY_EMAIL="your-gmail@gmail.com"   # defaults to SMTP_USER if unset

# Pusher Channels (DinoRex real-time multiplayer)
# Create free app at pusher.com → Channels; recommended cluster for India: ap2
PUSHER_APP_ID="..."
PUSHER_KEY="..."
PUSHER_SECRET="..."
PUSHER_CLUSTER="ap2"
NEXT_PUBLIC_PUSHER_KEY="..."
NEXT_PUBLIC_PUSHER_CLUSTER="ap2"

# Web Push / VAPID (browser push notifications)
# Generate keys: npx web-push generate-vapid-keys
VAPID_EMAIL="mailto:your@email.com"
NEXT_PUBLIC_VAPID_PUBLIC_KEY="..."
VAPID_PRIVATE_KEY="..."
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
│   ├── layout.tsx                Auth guard + Sidebar (desktop) + MobileNav + OnlinePing + AudioPlayer + PushSubscriptionManager
│   ├── loading.tsx               App-level loading screen with rotating game facts
│   ├── dashboard/page.tsx        Play-first hero + IntroOverlay + category quick-play + stats
│   ├── discover/page.tsx         Browse quizzes — shows ✓ Completed badge on perfect-score quizzes
│   ├── quiz/[id]/page.tsx        Quiz player — checks isLocked + school hours before rendering
│   ├── marketplace/page.tsx      Buy packs with coins
│   ├── quizlets/page.tsx         View/sell owned Quizlets (My Collection) + full dex view (All Quizlets) with toggle
│   ├── quiz-maker/page.tsx       Create and publish custom quizzes
│   ├── leaderboard/page.tsx      Top 50 players — Pro/Max badges, green online dot, quizlet/attempt counts
│   ├── feedback/page.tsx         User feedback form → saves to DB (no email)
│   ├── info/page.tsx             Redirects to /quizlets (deprecated)
│   ├── game/page.tsx             Game mode selection hub
│   ├── notifications/page.tsx    View in-app notifications (feedback replies, leaderboard events)
│   ├── buy-coins/page.tsx        Redirects to /shop
│   ├── shop/page.tsx             Buy Pro (₹250/mo) or Max (₹500/mo) via UPI + coin purchase + daily reset
│   └── admin/
│       ├── layout.tsx            Admin auth guard
│       ├── quizzes/page.tsx      List all quizzes with Edit links
│       ├── quizzes/[id]/edit/    Edit quiz title/description/category/difficulty/questions (incl. imageUrl)
│       ├── users/page.tsx        User manager — lock/unlock, reset daily limit, grant/revoke Pro/Max, send push
│       ├── payments/page.tsx     Approve/reject pending UPI payment requests (coins/pro/max/reset)
│       ├── feedback/page.tsx     View all user feedback — filter by type, mark read/unread
│       └── settings/page.tsx     Global toggles — school hours restriction on/off
└── api/
    ├── auth/[...nextauth]/       NextAuth handler
    ├── feedback/                 POST — saves feedback to DB (Feedback model)
    ├── quizzes/                  GET quizzes list, POST create quiz
    ├── quizzes/[id]/             GET single quiz; PATCH (admin) update quiz + questions
    ├── attempt/                  POST quiz attempt — awards coins with multiplier, daily cap, dedup
    ├── packs/                    GET active packs (incl. festival packs)
    ├── packs/open/               POST open pack, roll characters
    ├── quizlets/                 GET owned quizlets
    ├── quizlets/sell/            POST sell a quizlet for coins
    ├── user/stats/               GET dashboard stats
    ├── user/ping/                POST update lastSeenAt — called every 2 min by OnlinePing
    ├── user/submit-payment/      POST submit UTR number for UPI payment (coins/pro/max/reset)
    ├── push/subscribe/           POST/DELETE web push subscription (VAPID endpoint + keys)
    ├── notifications/            GET user in-app notifications
    ├── leaderboard/              GET top 50 leaderboard data
    ├── dinorex/                  DinoRex multiplayer: create, join, start, answer, reveal, [code] (GET/DELETE)
    ├── admin/payments/
    │   ├── route.ts              GET list payment requests
    │   └── [id]/route.ts         PATCH approve/reject → credit coins, grant Pro, grant Max, or reset daily limit
    ├── admin/feedback/
    │   └── route.ts              GET all feedback; PATCH mark isRead or reply (creates Notification + push)
    ├── admin/users/
    │   ├── route.ts              GET paginated + searchable user list
    │   └── [id]/route.ts         PATCH user actions: lock, unlock, reset_daily, grant/revoke Pro/Max
    ├── admin/users/[id]/notify/  POST send push notification to a specific user (admin only)
    └── admin/settings/           PATCH global settings (e.g. schoolHoursEnabled toggle)

components/
├── icons/
│   ├── SoccerBallIcon.tsx        SVG soccer ball (Football category)
│   ├── CricketWicketIcon.tsx     SVG cricket wicket (Cricket category)
│   └── AvengersIcon.tsx          SVG Avengers logo (Avengers category)
├── layout/Sidebar.tsx            Collapsible desktop sidebar — theme toggle + admin nav; collapse stored in localStorage `bq_sidebar_collapsed`
├── layout/MobileNav.tsx          Bottom tab bar (mobile only, md:hidden) — 5 tabs + "More" drawer
├── layout/OnlinePing.tsx         Client component — silently POSTs /api/user/ping every 2 min
├── layout/PushSubscriptionManager.tsx  Registers sw.js, shows push opt-in banner, saves subscription
├── ThemeProvider.tsx             next-themes wrapper (class-based, default: dark)
├── IntroOverlay.tsx              First-visit onboarding overlay (5 steps, localStorage key bq_intro_seen_v1)
├── AudioPlayer.tsx               Floating music player (bottom-right) — volume + on/off
├── quiz/QuizPlayer.tsx           Interactive quiz — answers shuffled randomly each session
├── quiz/QuizMakerForm.tsx        Quiz creation form
├── marketplace/
│   ├── MarketplaceClient.tsx     Pack browsing + purchase
│   └── PackOpeningModal.tsx      Animated pack reveal (tap cards)
├── quizlets/QuizletsClient.tsx   Toggle: "My Collection" (owned, sell, Hidden section) + "All Quizlets" dex view (all non-hidden, owned highlighted)
└── game/
    ├── GameModesClient.tsx       Mode selection (HackDev, DinoRex, SpeedBlitz, Survival, Daily, Classic)
    ├── HackDevGame.tsx           60-second tech quiz sprint
    ├── DinoRexLobby.tsx          Elimination game — real multiplayer (Pusher + DB rooms) + AI practice mode
    ├── SpeedBlitzGame.tsx        20 questions in 30 seconds
    ├── SurvivalGame.tsx          One wrong answer = game over, 10s timer per question
    └── DailyChallengeGame.tsx    5 deterministic questions per day (date-seeded), 30s per question

lib/
├── auth.ts                       NextAuth config — Google + admin credentials + test user + isMax in session
├── db.ts                         Prisma client singleton
├── email.ts                      Nodemailer helper — sendEmail() + ADMIN_EMAIL constant
├── push.ts                       Web Push helper — sendPushToUser(userId, title, body, url)
├── pusher.ts                     Pusher server instance + DinoRex shared types (DinoRexPlayer, etc.)
├── audio-context.tsx             React context for background music state + controls
├── quizlets-data.ts              All 99 quizlet definitions (7 standard packs + 3 global uniques + 6 festival)
├── packs-data.ts                 All 13 pack definitions (7 standard + 6 festival)
├── festivals.ts                  Festival calendar (6 festivals)
├── roll.ts                       Pack opening RNG logic
├── time.ts                       Time utilities — isSchoolHours(), IST offset helpers
├── game-config.ts                Game timing constants, coin economy values, membership pricing
├── app-settings.ts               AppSetting model helpers — getSchoolHoursEnabled(), etc.
└── utils.ts                      cn(), CATEGORIES (16 total), RARITY_COLORS, SELL_VALUES, CategorySlug

prisma/
├── schema.prisma                 Full DB schema — 17 models incl. PushSubscription, DinoRexRoom, AppSetting, Notification
└── seed.ts                       55 official quizzes (11 categories × 5) + all quizlets + packs
```

---

## Core Domain Concepts

### Quizlets (Characters)
- Called "Quizlets" in-game (not "characters")
- **99 total**: 7 standard packs (9 each, except Rainbow with 5) + 3 global uniques + 6 festival pack quizlets
- Each has: name, rarity, pack, icon (emoji), color gradient, description
- Rarities: `common` | `uncommon` | `rare` | `epic` | `legendary` | `secret` | `unique` | `impossible`
- Secret/Unique/Impossible have `isHidden: true` — shown in a separate "Hidden" section in the Quizlets tab (My Collection view only), not in the All Quizlets dex view or pack descriptions

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
- Coins per correct answer vary by difficulty: 1→3, 2→5, 3→8, 4→12, 5→20 (defined in `lib/game-config.ts`)
- Multipliers: Regular 1×, Pro 1.5×, Max 2× (applied before daily cap)
- Daily earn limits: Regular 500, Pro 1000, Max 1500 coins/day (resets UTC midnight)
- No duplicate coins: each question can only earn coins once per user (`CorrectAnswer` table)
- Selling a quizlet returns `sellValue` coins (defined in `SELL_VALUES` in utils.ts)
- Pack costs: 20–125 coins standard, 40–65 festival
- Coins can also be purchased via UPI (1 coin = ₹1)
- Daily coin limit can be reset for ₹100 via UPI (PaymentRequest type `reset`); admin approves

### Membership Tiers
- **Regular**: default, 1× multiplier, 500 coins/day limit
- **Pro**: ₹250/month via UPI, 1.5× multiplier, 1000 coins/day limit — `isPro + proExpiresAt`
- **Max**: ₹500/month via UPI, 2× multiplier, 1500 coins/day limit — `isMax + maxExpiresAt`
- Tiers stack from highest active: Max > Pro > Regular
- Expiry is checked at request time (not cached); renewal extends from current expiry date
- Shop page at `/shop` — replaces old `/upgrade`

### Pack Opening (`lib/roll.ts`)
When a pack is opened, guaranteed slots: 2 common, 2 uncommon, 1 rare.
One bonus roll can hit epic/legendary/secret/unique.
Rainbow pack: tiny chance (0.001%) for the impossible character.
If user already owns a quizlet: refund coins equal to its sell value.

### Festival System (`lib/festivals.ts`)
6 festivals hardcoded by `MM-DD` date. On festival days, `GET /api/packs` includes
the festival pack slug. No DB change needed — pure date comparison at request time.

### Pre-made Quiz Content
11 categories × 5 quizzes (difficulty 1–5) = **55 official quizzes** seeded via `prisma/seed.ts`.
Seeded categories: football, cricket, harry-potter, technology, avengers, artists, musicians, math, science, physics, world-languages.
Additional categories (flags, brand-logos, animals, anime, grade-6) exist in `CATEGORIES` and are selectable in the quiz maker but have no seeded quizzes by default.

### Quiz Answer Shuffling
QuizPlayer shuffles answer options on every session using a seeded Fisher-Yates shuffle (`shuffleOrder` in `components/quiz/QuizPlayer.tsx`). The correct answer mapping is preserved — do not change this logic.

### Game Modes
- **HackDev**: Single player, tech questions, 60-second timer
- **DinoRex**: Elimination mode — real multiplayer via Pusher Channels (DB-backed rooms, 6 API routes) + AI practice mode vs bots
- **Speed Blitz**: 20 questions in 30 seconds, all categories
- **Survival**: Any category, 10s per question — first wrong answer ends the game, score = streak
- **Daily Challenge**: 5 questions, same for all users on a given day (date-seeded selection), 30s per question
- **Classic**: Links to `/discover` for standard quiz browsing
- All modes submit to `/api/attempt` for coin awards (multiplier + daily limit apply)

### UPI Payment Flow
1. User selects amount on `/shop` (coins, Pro/Max membership, or daily limit reset)
2. QR code + UPI deep link shown (`upi://pay?pa=...`)
3. User pays in GPay/PhonePe/etc., enters UTR number
4. `POST /api/user/submit-payment` → creates `PaymentRequest` with type `coins`, `pro`, `max`, or `reset` (status: pending)
5. Admin sees it at `/admin/payments` → clicks Approve or Reject
6. On approve: coins credited OR `isPro=true` with `proExpiresAt` set OR `isMax=true` with `maxExpiresAt` set OR `dailyCoinsReset` reset
7. Renewal stacks: if already active, extends from current expiry date rather than today
- `/buy-coins` now redirects to `/shop`

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
- Leaderboard shows ⭐ badge for Pro users, 👑 badge for Max users (Max takes priority)
- Columns: rank, player, coins, correct answers, accuracy %, quizlets owned, quiz attempts
- Admin sees extra column: email + join date
- `POST /api/user/ping` handles the update

### School Hours Restriction
- Applies to users whose email ends in `@oberoi-is.net`
- Blocked Mon–Fri 08:00–15:00 IST (UTC+5:30 offset applied server-side)
- Enforced at two layers: `/quiz/[id]` page render AND `/api/attempt` POST
- Shows friendly "school hours" UI message when blocked
- **Global toggle**: Admin can enable/disable restriction at `/admin/settings` (stored in `AppSetting` key `schoolHoursEnabled`)
- **Per-user override**: Admin can set `schoolAccessOverride = true` on any user in `/admin/users` to bypass regardless of global setting
- Time logic extracted to `lib/time.ts` → `isSchoolHours()`

### Account Locking
- `User.isLocked Boolean` — when true, user cannot play quiz or earn coins
- Quiz page shows a locked account UI before rendering the quiz
- `/api/attempt` returns 403 if `isLocked`
- Admin can lock/unlock at `/admin/users` via PATCH `/api/admin/users/[id]` with action `lock` / `unlock`

### Question Images
- `Question.imageUrl String?` — optional image shown above question text in QuizPlayer
- Supported in admin quiz editor (`/admin/quizzes/[id]/edit`) — enter any public image URL
- QuizPlayer renders `<img>` if `imageUrl` is set; null/empty = no image shown

### Test User Login
- Login page (`/app/login/page.tsx`) has a "Test login" button for QA/demo purposes
- Credentials checked against `TEST_USERNAME` + `TEST_PASSWORD` env vars
- Creates or retrieves a test user with a dynamic email (timestamp-based)
- Test user is non-admin; school hours and account locks still apply

### Notifications
- `Notification` model: `id`, `userId`, `type` (`overtaken` | `top3_join` | `feedback_reply` | `admin`), `message`, `isRead`, `createdAt`
- `/notifications` page shows all of a user's notifications
- `GET /api/notifications` returns unread count + list
- Currently created by: admin feedback reply, admin direct message (admin/users), leaderboard events
- MobileNav "More" drawer shows red dot on Notifications if unread count > 0

### Global Settings (AppSetting)
- `AppSetting` DB model: `key` (unique), `value` (string), `updatedAt`
- Admin UI at `/admin/settings` — currently exposes: `schoolHoursEnabled` (true/false)
- `lib/app-settings.ts` exposes `getSchoolHoursEnabled()` for server-side reads
- PATCH `/api/admin/settings` updates any key/value pair

### No-Duplicate Coins
- `CorrectAnswer` model tracks every (userId, questionId) pair a user answered correctly
- `@@unique([userId, questionId])` prevents double-recording
- `/api/attempt` only awards coins for questions NOT already in this table
- New correct answers are inserted via `prisma.correctAnswer.createMany({ skipDuplicates: true })`

### New User Email Notification
- NextAuth `events.createUser` fires when a brand-new Google account signs up
- Sends admin notification email via `lib/email.ts → sendEmail()`

### Quiz Completion Tracking
- Discover page fetches user's `QuizAttempt` records where `score === total` (perfect score)
- Those quiz cards show a green **✓ Completed** badge and green border

### Mobile Navigation
- Desktop: full `Sidebar` — collapsible (state in localStorage `bq_sidebar_collapsed`)
- Mobile: `MobileNav` — bottom tab bar (Home, Discover, Packs, Quizlets, More) + "More" drawer with (Leaderboard, Game Modes, Feedback, Upgrade/Shop, Notifications)
- `/marketplace` is labelled "Packs"; `/shop` (Pro/Max) is labelled "Upgrade" — keep these distinct to avoid confusion
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

### DinoRex Real-Time Multiplayer
- Real-time events delivered via **Pusher Channels** (not Socket.io)
- Room state persisted in `DinoRexRoom` DB model; each API call updates DB then triggers Pusher
- Client subscribes to `dinorex-{code}` channel; types defined in `lib/pusher.ts`
- AI practice mode bypasses all of this — standalone client-only component
- Room lifecycle: `create → join → start → answer (×N) → reveal → game-ended`

### Web Push Notifications (VAPID)
- Service worker at `public/sw.js` — handles `push` and `notificationclick` browser events
- `PushSubscriptionManager` (rendered in main layout) registers the SW and shows opt-in banner
- Banner is suppressed if dismissed (`bq_push_dismissed` localStorage key) or permission denied
- Subscriptions stored in `PushSubscription` DB table; `sendPushToUser()` in `lib/push.ts`
- Currently triggered by: admin feedback reply (`/api/admin/feedback`) — more triggers can be added
- Requires `VAPID_EMAIL`, `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY` env vars
- Generate VAPID keys: `npx web-push generate-vapid-keys`
- Expired/revoked subscriptions (HTTP 410/404) are auto-deleted from DB on send

### Year Auto-Increment
The app name is always `BittsQuiz {new Date().getFullYear()}`.
Never hardcode a year — always use `new Date().getFullYear()`.

---

## Key Files to Know

| File | Purpose |
|------|---------|
| `lib/quizlets-data.ts` | All 99 quizlet definitions (7 standard packs + 3 global uniques + 6 festival) |
| `lib/packs-data.ts` | All 13 pack definitions (7 standard + 6 festival) — prices at ~25% of original |
| `lib/roll.ts` | Pack opening RNG — edit drop rates here |
| `lib/festivals.ts` | Add/modify festival dates here |
| `lib/utils.ts` | RARITY_COLORS, SELL_VALUES, CATEGORIES (16 total), CategorySlug type |
| `lib/time.ts` | isSchoolHours() + IST offset helpers — used by school hours enforcement |
| `lib/game-config.ts` | Game timing constants, coin earn amounts, membership pricing, daily limits |
| `lib/app-settings.ts` | getSchoolHoursEnabled() — reads AppSetting from DB |
| `lib/email.ts` | sendEmail() helper — used by auth createUser event (new user alerts); NOT used by feedback |
| `lib/push.ts` | sendPushToUser() — sends VAPID web push to all of a user's subscriptions; auto-cleans expired |
| `lib/pusher.ts` | pusherServer instance + DinoRex shared types (DinoRexPlayer, DinoRexQuestion, PusherEvent) |
| `lib/audio-context.tsx` | Background music context + state |
| `public/sw.js` | Service worker — receives push events and shows browser notifications |
| `app/icon.svg` | App favicon — SVG lightning bolt on purple-to-pink gradient (auto-served by Next.js) |
| `app/globals.css` | Theme CSS variables + font config + light mode Tailwind overrides |
| `app/(main)/loading.tsx` | App-level loading screen — rotating game facts, shown during route transitions |
| `app/(main)/shop/page.tsx` | Pro/Max membership + coin purchase + daily limit reset (replaces old /upgrade and /buy-coins) |
| `app/(main)/notifications/page.tsx` | In-app notifications list |
| `app/(main)/admin/users/page.tsx` | User manager — lock/unlock, reset daily, grant/revoke tiers, send push |
| `app/(main)/admin/settings/page.tsx` | Global admin settings — school hours toggle |
| `components/ThemeProvider.tsx` | next-themes wrapper |
| `components/IntroOverlay.tsx` | First-visit onboarding (5 steps, shown once via localStorage) |
| `components/layout/Sidebar.tsx` | Desktop collapsible sidebar — edit nav items here |
| `components/layout/MobileNav.tsx` | Mobile bottom nav — edit items here |
| `components/layout/OnlinePing.tsx` | Pings /api/user/ping every 2 min |
| `components/game/SurvivalGame.tsx` | Survival mode — streak until first wrong answer |
| `components/game/DailyChallengeGame.tsx` | Daily challenge — 5 deterministic questions per day |
| `prisma/schema.prisma` | DB schema — run `npm run db:push` after changes |
| `prisma/seed.ts` | Re-run `npm run db:seed` to re-seed (55 quizzes, 11 seeded categories) |

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
- **Email**: `lib/email.ts` is only used for new-user signup alerts; feedback replies use push notifications via `lib/push.ts` — do not re-add email to the feedback flow
- **DinoRex multiplayer**: uses Pusher Channels (not Socket.io); room state in `DinoRexRoom` DB model; types in `lib/pusher.ts`
- **Web Push**: `sendPushToUser()` is fire-and-forget (errors logged, never thrown); requires VAPID env vars set
- **Tests**: `npm run test` runs Vitest unit tests — run after touching `lib/` files; E2E via `npm run test:e2e`
- **Mobile**: pages should use `p-4 md:p-8` responsive padding; sidebar is desktop-only
- **Fonts**: body = Plus Jakarta Sans (`--font-jakarta`), headings = Space Grotesk (`--font-grotesk`) — do not change font imports in `app/layout.tsx`
- **Confirm before**: deleting files, dropping DB tables, force-pushing
- **Shop vs Upgrade**: `/shop` replaced `/upgrade` and `/buy-coins` everywhere — do not link to either old route
- **isMax**: always check `isMax && (!maxExpiresAt || maxExpiresAt > new Date())` for active Max status, same pattern for Pro
- **CorrectAnswer**: never skip the dedup check in `/api/attempt` — it prevents infinite coin farming
- **School hours**: IST = UTC+5:30; use `lib/time.ts → isSchoolHours()` rather than inline time math; check `getSchoolHoursEnabled()` from `lib/app-settings.ts` before enforcing
- **Categories**: CATEGORIES has 16 entries; seeded quizzes only cover 11 — the 5 extra categories (flags, brand-logos, animals, anime, grade-6) are quiz-maker-only until seeded
- **Notifications**: use `Notification` model for in-app messages; use `lib/push.ts → sendPushToUser()` for browser push — these are separate channels
- **Admin users**: actions go through PATCH `/api/admin/users/[id]` with `action` field (`lock`, `unlock`, `reset_daily`, `grant_pro`, `revoke_pro`, `grant_max`, `revoke_max`)
- **AppSetting**: read via `lib/app-settings.ts`; write via PATCH `/api/admin/settings`; never hardcode setting keys outside those two files
- **SVG icons**: custom category icons live in `components/icons/` — import from there, not inline SVG
