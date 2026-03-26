# BittsQuiz — Architecture Documentation

> **Last Updated:** 2026-03-26 (rev 4)
> **Project:** BittsQuiz (auto-increments year via `new Date().getFullYear()`)
> **Repository:** `d:\VS_WS\bhavik_quik`
> **Primary Contact / Team:** Bhavik Lodha, G5MB

---

## Table of Contents

1. [Project Structure](#1-project-structure)
2. [High-Level System Diagram](#2-high-level-system-diagram)
3. [Core Components](#3-core-components)
4. [Data Stores](#4-data-stores)
5. [External Integrations](#5-external-integrations)
6. [Deployment & Infrastructure](#6-deployment--infrastructure)
7. [Security Considerations](#7-security-considerations)
8. [Development & Testing](#8-development--testing)
9. [Future Considerations](#9-future-considerations)
10. [Glossary](#10-glossary)
11. [Project Identification](#11-project-identification)

---

## 1. Project Structure

```
bhavik_quik/
├── app/                                   # Next.js App Router root
│   ├── layout.tsx                         # Root layout — ThemeProvider + SessionProvider + Analytics
│   ├── page.tsx                           # Entry redirect (→ /dashboard or /login)
│   ├── globals.css                        # CSS variables (dark/light theme) + Tailwind overrides
│   ├── icon.svg                           # App favicon (purple-pink lightning bolt)
│   │
│   ├── login/
│   │   └── page.tsx                       # Google OAuth sign-in screen
│   │
│   ├── certificate/
│   │   └── page.tsx                       # Completion certificate (all quizlets owned)
│   │
│   └── (main)/                            # Auth-guarded layout group
│       ├── layout.tsx                     # Auth guard + Sidebar + MobileNav + AudioPlayer
│       ├── loading.tsx                    # App-level loading screen (rotating facts)
│       │
│       ├── dashboard/page.tsx             # Play-first hero + stats + category quick-play
│       ├── discover/page.tsx              # Browse quizzes (✓ Completed badge on perfect scores)
│       ├── quiz/[id]/page.tsx             # Quiz player (isLocked + school hours check)
│       ├── marketplace/page.tsx           # Buy packs with coins
│       ├── quizlets/page.tsx              # My Collection + All Quizlets dex toggle
│       ├── quiz-maker/page.tsx            # Create & publish custom quizzes
│       ├── leaderboard/page.tsx           # Top 50 players — badges, online dot, stats
│       ├── feedback/page.tsx              # User feedback form → DB
│       ├── game/page.tsx                  # Game mode selection hub
│       ├── buy-coins/page.tsx             # Redirects to /shop
│       ├── shop/page.tsx                  # Pro/Max membership + coin purchase + daily limit reset (UPI)
│       ├── milestones/page.tsx            # Coin milestone badges — earned milestones + progress to next
│       ├── notifications/page.tsx         # In-app notifications (overtaken, feedback replies)
│       ├── info/page.tsx                  # Deprecated → redirects to /quizlets
│       │
│       └── admin/                         # Admin-only area (isAdmin check)
│           ├── layout.tsx                 # Admin guard
│           ├── quizzes/page.tsx           # List all quizzes
│           ├── quizzes/[id]/edit/         # Edit quiz + questions
│           ├── payments/page.tsx          # Approve/reject UPI payment requests
│           ├── feedback/page.tsx          # View + filter user feedback (with admin reply)
│           ├── users/page.tsx             # Manage users (lock/unlock, admin toggle, notify)
│           └── settings/page.tsx          # App-level settings (key/value store)
│
├── api/                                   # Next.js API Routes (all under app/api/)
│   ├── auth/[...nextauth]/route.ts        # NextAuth handler
│   ├── attempt/route.ts                   # POST quiz attempt → coins + daily cap
│   ├── feedback/route.ts                  # POST feedback → DB
│   ├── leaderboard/route.ts               # GET top 50 players
│   ├── notifications/route.ts             # GET user notifications
│   ├── quizzes/route.ts                   # GET list / POST create quiz
│   ├── quizzes/[id]/route.ts              # GET single / PATCH update quiz
│   ├── packs/route.ts                     # GET active packs (+ festival packs)
│   ├── packs/open/route.ts                # POST open pack → RNG roll
│   ├── quizlets/route.ts                  # GET owned quizlets
│   ├── quizlets/sell/route.ts             # POST sell quizlet for coins
│   ├── push/
│   │   └── subscribe/route.ts             # POST/DELETE web push subscription (VAPID)
│   ├── dinorex/
│   │   ├── create/route.ts                # POST create DinoRex room → returns room code
│   │   ├── join/route.ts                  # POST join room by code
│   │   ├── start/route.ts                 # POST start game (host only)
│   │   ├── answer/route.ts                # POST submit answer + advance round via Pusher
│   │   ├── reveal/route.ts                # POST force-reveal round (timeout fallback)
│   │   └── [code]/route.ts                # GET room state / DELETE leave room
│   ├── milestones/route.ts                # GET user's earned milestones
│   ├── user/
│   │   ├── ping/route.ts                  # POST update lastSeenAt (every 2 min)
│   │   ├── stats/route.ts                 # GET dashboard stats
│   │   └── submit-payment/route.ts        # POST UTR number for UPI payment
│   └── admin/
│       ├── payments/route.ts              # GET payment requests list
│       ├── payments/[id]/route.ts         # PATCH approve/reject payment
│       ├── feedback/route.ts              # GET all feedback / PATCH mark read or reply
│       ├── users/route.ts                 # GET users list
│       ├── users/[id]/route.ts            # PATCH user (lock, isAdmin, override)
│       ├── users/[id]/notify/route.ts     # POST send push notification to a user (admin)
│       ├── grant-milestones/route.ts      # POST backfill milestones for all existing users (admin)
│       ├── settings/route.ts              # GET/POST AppSetting key-value store
│       └── test-email/route.ts            # POST send test email
│
├── components/                            # Reusable React components
│   ├── layout/
│   │   ├── Sidebar.tsx                    # Collapsible desktop nav + theme toggle + admin links (state in localStorage `bq_sidebar_collapsed`)
│   │   ├── MobileNav.tsx                  # Bottom tab bar (mobile only, md:hidden)
│   │   ├── OnlinePing.tsx                 # Client component — POSTs /api/user/ping every 2 min
│   │   └── PushSubscriptionManager.tsx    # Registers service worker; shows push opt-in banner
│   ├── ThemeProvider.tsx                  # next-themes wrapper (class-based)
│   ├── IntroOverlay.tsx                   # First-visit onboarding (5 steps, localStorage)
│   ├── AudioPlayer.tsx                    # Floating background music player (bottom-right)
│   ├── quiz/
│   │   ├── QuizPlayer.tsx                 # Interactive quiz UI + shuffled answers
│   │   └── QuizMakerForm.tsx              # Quiz creation form
│   ├── marketplace/
│   │   ├── MarketplaceClient.tsx          # Pack browsing + purchase
│   │   └── PackOpeningModal.tsx           # Animated pack reveal (tap cards)
│   ├── quizlets/
│   │   └── QuizletsClient.tsx             # My Collection / All Quizlets toggle
│   ├── milestones/
│   │   └── MilestonesClient.tsx           # Milestone grid — earned badges + progress bar to next tier
│   └── game/
│       ├── GameModesClient.tsx            # Mode selection grid
│       ├── HackDevGame.tsx                # 60-second tech quiz sprint
│       ├── DinoRexLobby.tsx               # Elimination mode — real multiplayer (Pusher) + AI practice
│       ├── SpeedBlitzGame.tsx             # 20 questions in 30 seconds
│       ├── SurvivalGame.tsx               # Streak until first wrong answer
│       └── DailyChallengeGame.tsx         # 5 deterministic questions per day
│
├── lib/                                   # Shared server/client utilities
│   ├── auth.ts                            # NextAuth config (Google + admin credentials + test user)
│   ├── db.ts                              # Prisma client singleton
│   ├── email.ts                           # Nodemailer helper — sendEmail() + ADMIN_EMAIL
│   ├── push.ts                            # Web Push helper — sendPushToUser() via VAPID
│   ├── pusher.ts                          # Pusher server instance + DinoRex shared types/events
│   ├── audio-context.tsx                  # React context for background music state
│   ├── quizlets-data.ts                   # All 99 quizlet character definitions
│   ├── packs-data.ts                      # All 13 pack definitions (7 std + 6 festival)
│   ├── festivals.ts                       # Festival calendar (6 festivals by MM-DD)
│   ├── roll.ts                            # Pack opening RNG — drop rates live here
│   ├── utils.ts                           # cn(), CATEGORIES (16), RARITY_COLORS, SELL_VALUES
│   ├── app-settings.ts                    # AppSetting DB read/write helpers
│   ├── game-config.ts                     # Game mode configuration constants
│   ├── milestones-data.ts                 # 50 milestone definitions (bronze→diamond, 1K–50K coins)
│   └── time.ts                            # IST timezone helpers
│
├── prisma/
│   ├── schema.prisma                      # Full DB schema (18 models)
│   ├── seed.ts                            # Seeds 55 quizzes + all quizlets + packs
│   └── seed-explanations.ts              # Secondary script — generates question explanations
│
├── tests/
│   ├── unit/                              # Vitest unit tests (44 tests, 5 files)
│   │   ├── utils.test.ts                  # CATEGORIES, RARITY_COLORS, SELL_VALUES, cn()
│   │   ├── roll.test.ts                   # Pack opening RNG (6 tests)
│   │   ├── festivals.test.ts              # Festival date detection (9 tests)
│   │   ├── time.test.ts                   # IST helpers, school hours (8 tests)
│   │   └── game-config.test.ts            # Game constants (12 tests)
│   └── e2e/
│       └── auth.spec.ts                   # Playwright E2E auth flows
│
├── types/
│   └── next-auth.d.ts                     # NextAuth session type augmentation
│
├── public/
│   └── sw.js                              # Service worker — handles Web Push notification display
│
├── package.json                           # Dependencies & npm scripts
├── next.config.ts                         # Next.js config (Turbopack, image domains, web-push external)
├── vitest.config.ts                       # Vitest unit test config
├── playwright.config.ts                   # Playwright E2E test config
├── tsconfig.json                          # TypeScript config
├── tsconfig.seed.json                     # Separate TS config for Prisma seed scripts
├── prisma.config.ts                       # Prisma driver adapter config
├── postcss.config.mjs                     # PostCSS config (Tailwind v4)
├── eslint.config.mjs                      # ESLint config
├── CLAUDE.md                              # AI assistant guide (authoritative project rules)
└── README.md                              # Project README
```

---

## 2. High-Level System Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                          USERS                                  │
│   Browser (Desktop + Mobile)  ·  PWA-capable via Next.js       │
└───────────────────────┬─────────────────────────────────────────┘
                        │ HTTPS
┌───────────────────────▼─────────────────────────────────────────┐
│                     VERCEL EDGE NETWORK                         │
│           CDN + Edge Functions + Analytics Middleware           │
└───────────────────────┬─────────────────────────────────────────┘
                        │
┌───────────────────────▼─────────────────────────────────────────┐
│                  NEXT.JS APPLICATION (SSR + CSR)                │
│                                                                 │
│  ┌─────────────────────┐    ┌────────────────────────────────┐  │
│  │   APP ROUTER PAGES  │    │      API ROUTE HANDLERS        │  │
│  │                     │    │                                │  │
│  │  /dashboard         │    │  /api/attempt                  │  │
│  │  /discover          │    │  /api/quizzes                  │  │
│  │  /quiz/[id]         │    │  /api/packs/open               │  │
│  │  /marketplace       │◄──►│  /api/quizlets/sell            │  │
│  │  /quizlets          │    │  /api/user/ping                │  │
│  │  /game              │    │  /api/user/submit-payment      │  │
│  │  /leaderboard       │    │  /api/admin/**                 │  │
│  │  /shop              │    │  /api/auth/[...nextauth]       │  │
│  │  /admin/**          │    │                                │  │
│  └─────────────────────┘    └────────────────────────────────┘  │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │              SHARED LIBRARIES (lib/)                     │   │
│  │  auth · db (Prisma) · email · quizlets-data · packs-data │   │
│  │  roll (RNG) · festivals · utils · audio-context · time   │   │
│  │  milestones-data                                         │   │
│  └──────────────────────────────────────────────────────────┘   │
└───────────┬───────────────────────────────────┬─────────────────┘
            │                                   │
┌───────────▼──────────┐          ┌─────────────▼────────────────┐
│   NEON POSTGRESQL    │          │        EXTERNAL SERVICES      │
│                      │          │                               │
│  via Prisma v7 ORM   │          │  Google OAuth 2.0             │
│  + @prisma/adapter-pg│          │  Gmail SMTP (Nodemailer)      │
│                      │          │  UPI Payment Gateway          │
│  18 Models:          │          │  (manual UTR verification)    │
│  User, Quiz,         │          │  Vercel Analytics             │
│  Question,           │          │  Vercel Speed Insights        │
│  QuizAttempt,        │          │  SoundHelix (default music)   │
│  Quizlet,            │          │  Pusher Channels (DinoRex)    │
│  UserQuizlet,        │          │  Web Push / VAPID             │
│  Pack, AppSetting,   │          │                               │
│  PaymentRequest,     │          └───────────────────────────────┘
│  Feedback,           │
│  CorrectAnswer,      │
│  Notification,       │
│  PushSubscription,   │
│  UserMilestone,      │
│  DinoRexRoom,        │
│  Account, Session,   │
│  VerificationToken   │
└──────────────────────┘
```

---

## 3. Core Components

### 3.1 Frontend (Next.js App Router)

**Purpose:** Renders all user-facing UI — quizzes, game modes, leaderboard, marketplace, admin panel.

**Technologies:**
- Next.js 16 (App Router) + React 19 + TypeScript
- Tailwind CSS v4 + CSS custom properties for dark/light theming
- Framer Motion for animations (pack reveals, modal transitions)
- next-themes for class-based dark/light toggle
- Radix UI primitives (`@radix-ui/react-dialog`, `react-tabs`, `react-progress`, `react-slot`)
- Lucide React for icons
- Plus Jakarta Sans (body) + Space Grotesk (headings) via `next/font/google`

**Layout Architecture:**
```
app/layout.tsx              ← ThemeProvider + SessionProvider + Vercel Analytics
└── app/(main)/layout.tsx   ← Auth guard + AudioProvider + Sidebar + MobileNav + OnlinePing
    └── page routes         ← Individual pages (all auto-protected)
```

**Responsive Strategy:**
- Desktop: `Sidebar` (vertical nav, `hidden md:flex`)
- Mobile: `MobileNav` (bottom tab bar, `md:hidden`) + "More" drawer
- Content padding: `p-4 md:p-8`, bottom clearance: `pb-20 md:pb-0`

**Deployment:** Vercel (serverless, auto-deployed on push)

---

### 3.2 Backend — API Routes

**Purpose:** Handle all data mutations and reads — quiz attempts, pack opening, coin economy, payments, admin operations.

**Technologies:**
- Next.js API Routes (App Router `route.ts` handlers)
- NextAuth.js v5 for session validation on every protected endpoint
- Prisma v7 as the sole DB access layer
- Pure server-side execution (no separate backend process)

**Key API Boundaries:**

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/attempt` | POST | Record quiz attempt; award coins with multiplier + daily cap; dedup via CorrectAnswer; auto-grant milestones |
| `/api/milestones` | GET | Return user's earned `UserMilestone` records |
| `/api/admin/grant-milestones` | POST | Backfill milestones for all existing users based on `totalCoinsEarned` (admin only) |
| `/api/packs/open` | POST | RNG pack roll (`lib/roll.ts`); refund duplicates |
| `/api/quizlets/sell` | POST | Sell a quizlet back for coins (`SELL_VALUES`) |
| `/api/user/submit-payment` | POST | Create pending `PaymentRequest` with UTR |
| `/api/admin/payments/[id]` | PATCH | Approve/reject → credit coins, grant Pro/Max, or reset daily limit |
| `/api/user/ping` | POST | Heartbeat — updates `lastSeenAt` for online status |
| `/api/auth/[...nextauth]` | GET/POST | NextAuth handlers (session, callback, signout) |

**Deployment:** Co-deployed with the frontend as Vercel serverless functions.

---

### 3.3 Real-Time Component (Pusher Channels — DinoRex Game Mode)

**Purpose:** Power the multiplayer elimination game mode with live player events.

**Technologies:** Pusher Channels (`pusher` server SDK + `pusher-js` client SDK); room state persisted in the `DinoRexRoom` DB table.

**Architecture:**
- Room state (players, questions, answers, status) stored in `DinoRexRoom` Prisma model
- Each answer submission updates DB state, then triggers a Pusher event to all room subscribers
- Client subscribes to `dinorex-{code}` Pusher channel for real-time events
- Events: `player-joined`, `player-left`, `game-started`, `player-answered`, `round-ended`, `game-ended`
- AI practice mode is still available alongside real multiplayer (no Pusher required for that path)

**Current Status:** Real multiplayer fully implemented and production-ready via Pusher Channels. AI practice mode remains for solo play.

---

### 3.4 Admin Panel

**Purpose:** Manage the full platform — approve payments, moderate feedback, manage users, edit quizzes, configure app settings.

**Access control:** `isAdmin` flag on `User` model; checked in `app/(main)/admin/layout.tsx` and all `/api/admin/**` routes.

**Admin capabilities:**
- Approve/reject UPI payment requests (coins, Pro, Max memberships)
- Lock/unlock user accounts
- Toggle `isAdmin` and `schoolAccessOverride` flags
- Grant/revoke Pro and Max membership tiers (30-day increments)
- Reset a user's daily coin limit counter
- Send web push notifications to individual users
- Edit any quiz's title, description, category, difficulty, and questions (incl. `imageUrl`)
- View and filter all user feedback; mark as read/unread; send admin replies
- Configure global app settings via key-value `AppSetting` store (e.g. school hours toggle)
- Send test emails

---

## 4. Data Stores

### 4.1 Primary Database — PostgreSQL (Neon)

**Type:** Managed PostgreSQL (Neon serverless)
**ORM:** Prisma v7 with `@prisma/adapter-pg` (connection pooling)
**Connection:** `DATABASE_URL` env var (Neon connection string)

**Schema — All 18 Models:**

| Model | Purpose | Key Fields |
|-------|---------|------------|
| `User` | Player accounts | `coins`, `totalCoinsEarned`, `totalCorrect`, `isPro`, `isMax`, `isAdmin`, `isLocked`, `dailyCoinsEarned`, `lastSeenAt`, `schoolAccessOverride` |
| `Account` | OAuth provider links (NextAuth) | `provider`, `providerAccountId` |
| `Session` | Active JWT sessions (NextAuth) | `sessionToken`, `expires` |
| `VerificationToken` | Email verification tokens | `identifier`, `token`, `expires` |
| `Quiz` | Quiz definitions | `title`, `category`, `difficulty`, `isOfficial`, `isNew`, `authorId` |
| `Question` | Individual questions | `text`, `options` (JSON), `correctIndex`, `points`, `order`, `explanation`, `imageUrl` |
| `QuizAttempt` | Per-quiz completion records | `score`, `total`, `coinsEarned`, `completedAt` |
| `Quizlet` | Collectible character definitions | `name`, `rarity`, `pack`, `icon`, `colorFrom/To`, `isHidden`, `sellValue` |
| `UserQuizlet` | Player ↔ quizlet ownership | `@@unique([userId, quizletId])` |
| `Pack` | Pack definitions | `name`, `cost`, `slug`, `isFestival`, `festivalDate`, `isActive` |
| `CorrectAnswer` | Dedup coin-earning per question | `@@unique([userId, questionId])` |
| `PaymentRequest` | UPI payment submissions | `type` (coins/pro/max/reset), `amountInr`, `utrNumber`, `status` |
| `Feedback` | User-submitted feedback | `type`, `message`, `isRead` |
| `Notification` | In-app notifications | `type` (overtaken/top3_join/feedback_reply/admin/milestone), `message`, `isRead` |
| `AppSetting` | Admin-controlled key-value config | `key` (PK), `value` |
| `PushSubscription` | Browser push subscriptions (VAPID) | `endpoint` (unique), `p256dh`, `auth`, `userId` |
| `UserMilestone` | Coin milestone badges earned by users | `@@unique([userId, threshold])`, `threshold` (1K–50K in 1K steps) |
| `DinoRexRoom` | Live multiplayer game rooms | `code` (unique), `hostId`, `status`, `players` (JSON), `questions` (JSON), `currentQ`, `currentAnswers` (JSON), `winner` |

**Indexes:**
- `User`: `totalCoinsEarned`, `lastSeenAt`, `createdAt`
- `Quiz`: `category`, `authorId`, `isOfficial`
- `QuizAttempt`: `userId`, `quizId`, `completedAt`
- `UserQuizlet`: `userId`
- `PaymentRequest`: `userId`, `status`, `createdAt`
- `CorrectAnswer`: unique on `(userId, questionId)`
- `Notification`: `userId`, `isRead`, `createdAt`

---

### 4.2 Client-Side Persistence (localStorage)

| Key | Purpose |
|-----|---------|
| `bq_intro_seen_v1` | Tracks whether the first-visit onboarding overlay has been shown |
| `bq_music_enabled` | User's background music toggle preference |
| `bq_music_volume` | User's saved volume level (0–1) |
| `bq_push_dismissed` | Set when user dismisses the push notification opt-in banner |
| `bq_sidebar_collapsed` | Sidebar collapsed/expanded state (desktop) |

---

## 5. External Integrations

### 5.1 Google OAuth 2.0

**Purpose:** Primary authentication method for all players.
**Integration:** NextAuth.js `GoogleProvider` via `lib/auth.ts`
**Config:** `GOOGLE_CLIENT_ID` + `GOOGLE_CLIENT_SECRET` env vars
**Flow:** OAuth Authorization Code flow → NextAuth creates/updates `User` + `Account` rows via `PrismaAdapter`

---

### 5.2 Gmail SMTP (Nodemailer)

**Purpose:** Send admin alert emails when a new user registers.
**Integration:** `lib/email.ts` → `sendEmail()` helper called by NextAuth `createUser` event
**Config:** `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`, `ADMIN_NOTIFY_EMAIL`
**Note:** Feedback form does NOT use email — feedback is DB-stored only.

---

### 5.3 UPI Payment Gateway (Manual Verification)

**Purpose:** Accept payments for coin top-ups and Pro/Max memberships.
**Integration:** Custom manual flow — no third-party payment SDK
**Flow:**
1. Frontend shows QR code (`qrcode.react`) + UPI deep link (`upi://pay?pa=...`)
2. User pays in GPay/PhonePe/etc., submits UTR number via `/api/user/submit-payment`
3. Admin reviews at `/admin/payments` and approves/rejects via `/api/admin/payments/[id]`
4. On approval: coins credited OR `isPro`/`isMax` set with expiry date
**Config:** `NEXT_PUBLIC_UPI_ID`, `NEXT_PUBLIC_UPI_NAME` (public, safe to expose)

---

### 5.4 Vercel Analytics + Speed Insights

**Purpose:** Page view analytics and Core Web Vitals monitoring.
**Integration:** `@vercel/analytics` + `@vercel/speed-insights` injected in `app/layout.tsx`
**Config:** Automatic on Vercel deployment — no additional env vars required.

---

### 5.5 Pusher Channels (DinoRex Real-Time Multiplayer)

**Purpose:** Deliver real-time game events (player join/leave, answers, round results, game end) for DinoRex multiplayer rooms.
**Integration:** `pusher` server SDK in API routes; `pusher-js` client in `DinoRexLobby.tsx`; shared types in `lib/pusher.ts`
**Config:** `PUSHER_APP_ID`, `PUSHER_KEY`, `PUSHER_SECRET`, `PUSHER_CLUSTER` (server); `NEXT_PUBLIC_PUSHER_KEY`, `NEXT_PUBLIC_PUSHER_CLUSTER` (client)
**Channel naming:** `dinorex-{roomCode}` per room
**Compatible with Vercel serverless** — no persistent process required; Pusher handles WebSocket delivery.

---

### 5.6 Web Push Notifications (VAPID)

**Purpose:** Browser push notifications — notifies users when overtaken on leaderboard or when admin replies to their feedback.
**Integration:** `web-push` library (`lib/push.ts`) on the server; `PushSubscriptionManager.tsx` registers the service worker and stores subscriptions; `public/sw.js` handles notification display.
**Flow:**
1. `PushSubscriptionManager` shows opt-in banner; on grant calls `/api/push/subscribe` to save endpoint+keys to `PushSubscription` table
2. Server calls `sendPushToUser(userId, title, body)` from `/api/admin/feedback` (reply), leaderboard overtake logic, or milestone unlock
3. `sw.js` service worker receives the push event and shows the browser notification
4. Clicking notification navigates to `/notifications`
5. Expired subscriptions (HTTP 410/404) are automatically cleaned from DB
**Config:** `VAPID_EMAIL`, `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY` — generate with `npx web-push generate-vapid-keys`

---

### 5.7 Background Music Stream

**Purpose:** Optional ambient music during gameplay.
**Integration:** `lib/audio-context.tsx` + `components/AudioPlayer.tsx`
**Config:** `NEXT_PUBLIC_MUSIC_URL` env var (defaults to SoundHelix-Song-1.mp3)
**State:** Persisted in localStorage; auto-pauses on `/quiz/[id]` routes.

---

## 6. Deployment & Infrastructure

### 6.1 Cloud Provider

**Platform:** Vercel
**Region:** Auto-assigned by Vercel Edge Network (global CDN)

### 6.2 Key Services

| Service | Provider | Purpose |
|---------|----------|---------|
| Hosting + SSR | Vercel Serverless Functions | Next.js page rendering + API routes |
| CDN | Vercel Edge Network | Static asset delivery + edge caching |
| Database | Neon (Serverless PostgreSQL) | Primary data store |
| Email | Gmail SMTP via Nodemailer | Admin new-user notifications |
| Analytics | Vercel Analytics | Page view tracking |
| Performance | Vercel Speed Insights | Core Web Vitals monitoring |

### 6.3 Build & Deployment

```bash
# Production build
next build        # compiles App Router, generates static pages, bundles API routes

# Database schema deploy
npm run db:push   # prisma db push → applies schema to Neon
npx prisma generate  # regenerate Prisma client types

# Data seeding
npm run db:seed   # seeds 55 quizzes + all quizlets + packs (idempotent)
```

**Deployment trigger:** Push to the configured Vercel branch (typically `main`). Vercel auto-builds and deploys.

### 6.4 CI/CD Pipeline

No automated CI pipeline is currently configured. Deployment is triggered manually or via Vercel's Git integration on push.

### 6.5 Monitoring

- **Vercel Analytics:** Page views, unique visitors, geographic breakdown
- **Vercel Speed Insights:** LCP, FID, CLS, TTFB per route
- **Error visibility:** Console errors surface in Vercel Function Logs

---

## 7. Security Considerations

### 7.1 Authentication

**Method:** NextAuth.js v5 with JWT session strategy
**Providers:**
- **Google OAuth 2.0** — all regular players
- **Credentials (admin-credentials)** — admin-only, username/password from env vars
**Session propagation:** JWT token; `isAdmin`, `isPro`, `isMax`, `isLocked` flags embedded in token and refreshed from DB on `trigger === "update"` or when flags are missing.

### 7.2 Authorization Model

| Level | Check | Enforcement |
|-------|-------|-------------|
| Authenticated user | Valid NextAuth session | `app/(main)/layout.tsx` server-side redirect |
| Admin | `session.user.isAdmin === true` | `app/(main)/admin/layout.tsx` + all `/api/admin/**` routes |
| Non-locked user | `session.user.isLocked === false` | `/quiz/[id]` page render + `/api/attempt` (403) |
| School hours | Email ends in `@oberoi-is.net` + Mon–Fri 08:00–15:00 IST | `/quiz/[id]` + `/api/attempt` (server-side IST calculation) |
| No coin farming | `CorrectAnswer @@unique([userId, questionId])` | `/api/attempt` — `skipDuplicates: true` insert |

### 7.3 Data Integrity

- **Coin updates** use Prisma `increment` — no read-modify-write race conditions
- **Duplicate coin prevention** via `CorrectAnswer` unique constraint — enforced at DB level
- **Membership expiry** checked at request time (`isMax && (!maxExpiresAt || maxExpiresAt > new Date())`) — not cached
- **School hours** calculated server-side using UTC offset (`UTC+5:30`) — not trusting client clock

### 7.4 Input Validation

- API routes validate session presence before processing any mutation
- Admin routes additionally verify `isAdmin` flag from the JWT
- UTR number submitted by users is stored as-is; approval is manual by admin (human review)
- Quiz answer correctness evaluated against `correctIndex` stored server-side — not sent to the client

### 7.5 Secret Management

- All secrets stored in `.env` (not committed)
- Public UPI info uses `NEXT_PUBLIC_` prefix (safe to expose to client)
- `NEXTAUTH_SECRET` used for JWT signing
- Admin credentials stored only in env vars — never in DB during normal operation

### 7.6 Transport Security

- All production traffic over HTTPS via Vercel's TLS termination
- Database connection via Neon's TLS-encrypted connection string

---

## 8. Development & Testing

### 8.1 Prerequisites

- Node.js 18+
- PostgreSQL database (Neon: https://neon.tech)
- Google OAuth app (https://console.cloud.google.com)

### 8.2 Local Setup

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env
# Fill in: DATABASE_URL, NEXTAUTH_SECRET, NEXTAUTH_URL,
#          GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET,
#          ADMIN_USERNAME, ADMIN_PASSWORD, ADMIN_EMAIL,
#          SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS

# 3. Push DB schema
npm run db:push

# 4. Seed data (55 quizzes + quizlets + packs)
npm run db:seed

# 5. Start dev server
npm run dev         # runs at http://localhost:3000
```

### 8.3 Available Scripts

| Script | Purpose |
|--------|---------|
| `npm run dev` | Start Next.js development server (Turbopack) |
| `npm run build` | Production build |
| `npm run start` | Start production server locally |
| `npm run lint` | Run ESLint |
| `npm run test` | Run Vitest unit tests (44 tests) |
| `npm run test:watch` | Vitest watch mode |
| `npm run test:coverage` | Vitest with v8 coverage report |
| `npm run test:e2e` | Run Playwright E2E tests |
| `npm run test:e2e:ui` | Playwright interactive UI |
| `npm run db:push` | Push Prisma schema changes to DB |
| `npm run db:seed` | Seed quizzes, quizlets, and packs (idempotent) |
| `npm run db:studio` | Open Prisma Studio (visual DB browser) |
| `npm run db:explain` | Generate question explanations (secondary seed script) |

### 8.4 After Schema Changes

```bash
npm run db:push      # apply schema to DB
npx prisma generate  # regenerate Prisma client (also runs via postinstall)
npm run db:seed      # re-seed if new quizlets/packs added
```

### 8.5 Code Quality Tools

| Tool | Config File | Purpose |
|------|-------------|---------|
| TypeScript 5 | `tsconfig.json` | Static type checking across all app code |
| ESLint 9 | `eslint.config.mjs` | Code linting (Next.js config) |
| Tailwind CSS v4 | `postcss.config.mjs` | Utility-class CSS with PostCSS pipeline |

### 8.6 Testing

| Script | Tool | Scope |
|--------|------|-------|
| `npm run test` | Vitest 2 | 44 unit tests across 5 files — `lib/utils`, `lib/roll`, `lib/festivals`, `lib/time`, `lib/game-config` |
| `npm run test:watch` | Vitest | Watch mode (development) |
| `npm run test:coverage` | Vitest + v8 | Coverage report for `lib/**` (excl. db/email/auth) |
| `npm run test:e2e` | Playwright | E2E auth flows |
| `npm run test:e2e:ui` | Playwright UI | Interactive E2E runner |

**Unit test config:** `vitest.config.ts` — node environment, forks pool, `@` alias mapped to project root.
**E2E test config:** `playwright.config.ts` — targets the running dev/prod server.

---

## 9. Future Considerations

### 9.1 Known Technical Debt

- **`/info/page.tsx`:** Deprecated page (redirects to `/quizlets`); can be removed.
- **Manual UPI verification:** Payment approval is entirely manual. Scaling will require webhook-based payment verification (Razorpay, PhonePe Business API, etc.).
- **E2E test coverage:** Playwright is set up but only auth flows are covered. Critical user paths (quiz attempt, pack opening, DinoRex game) need E2E tests.
- **DinoRexRoom cleanup:** Handled via piggyback deletion — `POST /api/dinorex/create` deletes all rooms older than 2 hours on every room creation. No separate cron needed; games are short-lived so this keeps the table clean in practice.

### 9.2 Planned Migrations / Improvements

- **Automated payment verification:** Integrate a real UPI payment gateway with webhooks to eliminate manual UTR review.
- **CI/CD pipeline:** Add GitHub Actions for lint checks, type-checks, Prisma schema validation, and unit tests on PRs.
- **Category expansion:** `CATEGORIES` array has 16 entries (including flags, brand-logos, animals, anime, grade-6) — corresponding quiz content and seeds need to be added for the 5 extra categories.
- **DinoRex room TTL:** Add a scheduled cleanup (or createdAt-based filter) for ended/abandoned DinoRex rooms.

### 9.3 Scalability Notes

- Neon serverless PostgreSQL scales automatically but daily coin cap resets (`dailyCoinsReset`) are per-row — a UTC midnight cron job or on-demand check (current approach) is sufficient at low scale.
- Vercel serverless functions have cold-start overhead; Prisma connection pooling via `@prisma/adapter-pg` mitigates repeated connection setup.

---

## 10. Glossary

| Term | Definition |
|------|-----------|
| **Quizlet** | A collectible character in BittsQuiz; 99 total across 8 rarity tiers |
| **Pack** | A bundle of random Quizlets purchasable with coins; 7 standard + 6 festival packs |
| **Rarity** | Tier system for Quizlets: Common → Uncommon → Rare → Epic → Legendary → Secret → Unique → Impossible |
| **Coins** | In-game currency earned by answering questions correctly; used to buy packs |
| **Daily Cap** | Maximum coins earnable per UTC day: 500 (Regular), 1000 (Pro), 1500 (Max) |
| **Multiplier** | Coin earn rate modifier: 1× (Regular), 1.5× (Pro), 2× (Max) |
| **Pro** | Paid membership tier (₹250/month); 1.5× multiplier, 1000 coins/day cap |
| **Max** | Premium membership tier (₹500/month); 2× multiplier, 1500 coins/day cap |
| **CorrectAnswer** | DB record tracking every (user, question) pair that has earned coins; prevents farming |
| **UTR** | Unique Transaction Reference — the UPI payment ID users submit for manual verification |
| **UPI** | Unified Payments Interface — India's real-time payment system (GPay, PhonePe, etc.) |
| **IST** | Indian Standard Time — UTC+5:30; used for school hours restriction |
| **School Hours** | Restriction blocking quiz play Mon–Fri 08:00–15:00 IST for `@oberoi-is.net` emails |
| **Festival Pack** | Time-limited pack available only on specific calendar dates (6 festivals defined) |
| **AppSetting** | Admin-managed key-value configuration stored in DB; configurable without code deploy |
| **isHidden** | Flag on Quizlet marking it as Secret/Unique/Impossible — shown only in "Hidden" section, not in public dex |
| **DinoRex** | Elimination game mode; real multiplayer via Pusher Channels + AI practice mode |
| **HackDev** | 60-second tech-question sprint game mode |
| **SpeedBlitz** | 20 questions in 30 seconds game mode |
| **Survival** | One-wrong-answer-ends-game mode with 10-second per-question timer |
| **Daily Challenge** | 5 date-seeded (deterministic) questions per day, same for all users |
| **Seed** | The `prisma/seed.ts` script that populates the DB with 55 official quizzes, all quizlets, and all packs |
| **RNG** | Random Number Generator — `lib/roll.ts` controls Quizlet drop rates when opening a pack |
| **cn()** | Utility function combining `clsx` + `tailwind-merge` for conditional class names |
| **Turbopack** | Next.js's Rust-based bundler used in development (`next dev`) |
| **G5MB** | Creator's class/group identifier (Bhavik Lodha, G5MB) |

---

## 11. Project Identification

| Field | Value |
|-------|-------|
| **Project Name** | BittsQuiz (displayed as `BittsQuiz {new Date().getFullYear()}`) |
| **Repository** | `d:\VS_WS\bhavik_quik` |
| **Primary Creator** | Bhavik Lodha, G5MB |
| **Framework** | Next.js 16 (App Router) |
| **Runtime** | Node.js 18+ |
| **Database** | Neon PostgreSQL (Serverless) |
| **Deployment** | Vercel |
| **Document Date** | 2026-03-22 |
| **AI Guide** | See `CLAUDE.md` for AI assistant rules and project conventions |
