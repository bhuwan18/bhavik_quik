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
| Theming | next-themes (dark-only, `forcedTheme="dark"`) |
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

# Seed with ~178 official quizzes + all quizlets + packs
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
├── globals.css                   CSS variables (dark-only) + animation keyframes + Tailwind overrides
├── (main)/                       Auth-guarded area (sidebar layout + AudioProvider)
│   ├── layout.tsx                Auth guard + Sidebar (desktop) + MobileNav + OnlinePing + AudioPlayer + PushSubscriptionManager + SplashScreen + NotificationsProvider
│   ├── loading.tsx               App-level loading screen with rotating game facts
│   ├── dashboard/page.tsx        Play-first hero + IntroOverlay + category quick-play + stats
│   ├── discover/page.tsx         Browse quizzes — shows ✓ Completed badge on perfect-score quizzes
│   ├── quiz/[id]/page.tsx        Quiz player — checks isLocked + school hours before rendering
│   ├── marketplace/page.tsx      Buy packs with coins
│   ├── quizlets/page.tsx         View/sell owned Quizlets (My Collection) + full dex view (All Quizlets) with toggle
│   ├── quiz-maker/page.tsx       Create and publish custom quizzes
│   ├── leaderboard/page.tsx      Top 50 players — sortable columns, follower count, Pro/Max badges, green online dot; podium on default sort only
│   ├── profile/[userId]/page.tsx Public profile — avatar, online dot, tier badge, stats, follow button, follower/following counts, recent quizlets
│   ├── feedback/page.tsx         User feedback form → saves to DB (no email)
│   ├── info/page.tsx             Redirects to /quizlets (deprecated)
│   ├── game/page.tsx             Game mode selection hub
│   ├── notifications/page.tsx    View in-app notifications (feedback replies, leaderboard events, milestones, follow events)
│   ├── feed/page.tsx             Social feed — own activity + followed users' activity; likes + comments
│   ├── buy-coins/page.tsx        Redirects to /shop
│   ├── shop/page.tsx             Buy Pro (₹250/mo) or Max (₹500/mo) via UPI + coin purchase + daily reset + streak freeze (coin-based)
│   ├── milestones/page.tsx       Multi-type milestone badges (coins/quizzes/answers/categories/streak) — earned grid + progress to next
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
    ├── attempt/                  POST quiz attempt — awards coins with multiplier, daily cap, dedup; auto-grants milestones; updates streak; grants mystical quizlets on category/rarity conditions
    ├── milestones/               GET user's earned milestones
    ├── packs/                    GET active packs (incl. festival packs)
    ├── packs/open/               POST open pack, roll characters
    ├── quizlets/                 GET owned quizlets
    ├── quizlets/sell/            POST sell a quizlet for coins
    ├── user/stats/               GET dashboard stats
    ├── user/ping/                POST update lastSeenAt — called every 2 min by OnlinePing
    ├── user/follow/[userId]/     POST follow a user; DELETE unfollow — auth + self-follow + admin guards
    ├── user/[userId]/follow-list/ GET followers or following list for a user (admin + own profile only; ?type=followers|following)
    ├── user/buy-streak-freeze/   GET streak info; POST purchase streak freeze with coins (1K or 2.5K coins, max 2)
    ├── user/submit-payment/      POST submit UTR number for UPI payment (coins/pro/max/reset)
    ├── push/subscribe/           POST/DELETE web push subscription (VAPID endpoint + keys)
    ├── notifications/            GET user in-app notifications
    ├── feed/                     GET paginated social feed (own + followed users' FeedActivity, 20/page)
    ├── feed/[id]/like/           POST toggle like on a feed activity
    ├── feed/[id]/comments/       GET comments; POST new comment (max 280 chars)
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
    ├── admin/grant-milestones/   POST backfill milestones for all existing users (admin only)
    └── admin/settings/           PATCH global settings (e.g. schoolHoursEnabled toggle)

components/
├── icons/
│   ├── SoccerBallIcon.tsx        SVG soccer ball (Football category)
│   ├── CricketWicketIcon.tsx     SVG cricket wicket (Cricket category)
│   └── AvengersIcon.tsx          SVG Avengers logo (Avengers category)
├── layout/Sidebar.tsx            Collapsible desktop sidebar — admin nav; collapse stored in localStorage `bq_sidebar_collapsed`
├── layout/MobileNav.tsx          Bottom tab bar (mobile only, md:hidden) — 5 tabs + "More" drawer
├── layout/OnlinePing.tsx         Client component — silently POSTs /api/user/ping every 2 min
├── layout/PushSubscriptionManager.tsx  Registers sw.js, shows push opt-in banner, saves subscription
├── layout/NotificationsProvider.tsx    React context — fetches unread notification count on every route change; exposes useUnreadCount()
├── ThemeProvider.tsx             next-themes wrapper (class-based, default: dark)
├── SplashScreen.tsx              Daily splash shown once per IST day (localStorage key bq_splash_date) — active promotions, festival pack, Pro/Max pitch; 10s auto-dismiss
├── IntroOverlay.tsx              First-visit onboarding overlay (5 steps, localStorage key bq_intro_seen_v1)
├── AudioPlayer.tsx               Floating music player (bottom-right) — volume + on/off
├── quiz/QuizPlayer.tsx           Interactive quiz — answers shuffled randomly each session
├── quiz/QuizMakerForm.tsx        Quiz creation form
├── marketplace/
│   ├── MarketplaceClient.tsx     Pack browsing + purchase
│   └── PackOpeningModal.tsx      Animated pack reveal (tap cards)
├── discover/DiscoverGrid.tsx     Quiz grid component used by the Discover page
├── quizlets/QuizletsClient.tsx   Toggle: "My Collection" (owned, sell, Hidden section) + "All Quizlets" dex view (all non-hidden, owned highlighted)
├── milestones/MilestonesClient.tsx  Milestone grid — earned badges with tier colors + progress bar to next unlock; tapping a locked badge opens a ProgressModal showing current stat, % bar, and remaining count
├── profile/
│   ├── FollowButton.tsx          Optimistic follow/unfollow toggle — POST/DELETE /api/user/follow/[id]; rollback on failure
│   └── FollowListModal.tsx       Modal to browse followers/following — fetches /api/user/[id]/follow-list; admin + own profile only
└── game/
    ├── GameModesClient.tsx       Mode selection (HackDev, DinoRex, SpeedBlitz, Survival, Daily, Classic)
    ├── HackDevGame.tsx           60-second tech quiz sprint
    ├── DinoRexLobby.tsx          Elimination game — real multiplayer (Pusher + DB rooms) + AI practice mode
    ├── SpeedBlitzGame.tsx        20 questions in 30 seconds
    ├── SurvivalGame.tsx          One wrong answer = game over, 10s timer per question
    └── DailyChallengeGame.tsx    5 deterministic questions per day (date-seeded), 30s per question

lib/
├── milestones-data.ts            Multi-type milestones: coins (1K–100K), quizzes, answers, categories, streak — 6 tiers: bronze→silver→gold→platinum→diamond→cosmic
├── auth.ts                       NextAuth config — Google + admin credentials + test user + isMax in session
├── db.ts                         Prisma client singleton
├── email.ts                      Nodemailer helper — sendEmail() + ADMIN_EMAIL constant
├── push.ts                       Web Push helper — sendPushToUser(userId, title, body, url)
├── pusher.ts                     Pusher server instance + DinoRex shared types (DinoRexPlayer, etc.)
├── audio-context.tsx             React context for background music state + controls
├── quizlets-data.ts              All 103 quizlet definitions (9 standard packs + 3 global uniques + 6 festival + 19 mystical)
├── packs-data.ts                 All 15 pack definitions (9 standard + 6 festival)
├── promotions.ts                 Time-limited promotions (PROMOTIONS array + getActivePromotions() — returns promos active on today's IST date)
├── festivals.ts                  Festival calendar (6 festivals)
├── roll.ts                       Pack opening RNG logic
├── time.ts                       Time utilities — isSchoolHours(), getISTDateString(), IST offset helpers
├── game-config.ts                Game timing constants, coin economy values, membership pricing, streak config (STREAK_MILESTONES, freeze costs)
├── app-settings.ts               AppSetting model helpers — getSchoolHoursEnabled(), etc.
└── utils.ts                      cn(), CATEGORIES (20 total), RARITY_COLORS, SELL_VALUES, CategorySlug

prisma/
├── schema.prisma                 Full DB schema — 22 models incl. PushSubscription, DinoRexRoom, AppSetting, Notification, UserMilestone, UserFollow, FeedActivity, FeedLike, FeedComment
└── seed.ts                       ~178 official quizzes across 20 categories + all quizlets + packs
```

---

## Core Domain Concepts

### Quizlets (Characters)
- Called "Quizlets" in-game (not "characters")
- **103 total**: 9 standard packs (Tech/Sports/Magic/Hero/Music/Science × 9, Math × 8, English × 8, Rainbow × 5) + 3 global uniques + 6 festival pack quizlets + 19 mystical achievement quizlets
- Each has: name, rarity, pack, icon (emoji), color gradient, description
- Rarities: `common` | `uncommon` | `rare` | `epic` | `legendary` | `secret` | `unique` | `mystical` | `impossible`
- Secret/Unique/Impossible have `isHidden: true` — shown in a separate "Hidden" section in the Quizlets tab (My Collection view only), not in the All Quizlets dex view or pack descriptions
- Mystical quizlets have `isHidden: false` and `pack: "mystical"` — visible in the dex view; granted automatically via `/api/attempt`, never sold in packs

### Rarity Visual System
Defined in `lib/utils.ts → RARITY_COLORS`:
- Common: gray border, no glow
- Uncommon: green border, soft glow
- Rare: blue border, medium glow
- Epic: purple border, strong glow
- Legendary: gold border, animated pulse (`legendary-card` CSS class)
- Secret: dark/red border
- Unique: pink border, rainbow animation (`rainbow-card`)
- Mystical: teal border, shimmer animation (`mystical-card` CSS class) — achievement-only
- Impossible: full rainbow animation

### Mystical Quizlets (Achievement-Based)
- 19 mystical quizlets exist — **not obtainable from packs**; granted automatically by `/api/attempt` when conditions are met
- `CATEGORY_MYSTICAL_MAP` in `app/api/attempt/route.ts` maps 18 categories → a quizlet name (world-languages + brand-logos are the only unmapped categories)
- **Category condition**: complete 10+ distinct quizzes (`distinct: ["quizId"]`) in that category → grants the mapped mystical quizlet
- **Atypical Choices**: granted when the user completes the single least-attempted official quiz (lowest `quiz.attempts` count)
- On grant: creates a `UserQuizlet` record + an in-app `Notification` (type `milestone`)
- Already-owned quizlets are silently skipped (no duplicate check needed — `userQuizlet.findUnique` guards it)
- Sell value: 500 coins each (same as `SELL_VALUES.mystical`)
- `lib/quizlets-data.ts` is the source of truth for all 19 definitions (`pack: "mystical"`, `isHidden: false`)

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
All 20 categories are seeded via `prisma/seed.ts` — approximately 178 official quizzes total.
Seeded categories: football, cricket, harry-potter, technology, avengers, artists, musicians, math, science, physics, world-languages, flags, brand-logos, animals, anime, grade-6, geography, world-travel, gaming, memes.
Category quiz counts vary: technology (22), science/math/football/cricket/avengers (12 each), harry-potter (15), physics/musicians/gaming/artists/world-travel (7 each), grade-6 (10+), flags (6), others (5 each).
Premium categories (`premiumTier` field on `CATEGORIES`): grade-6 (tier 1), geography (tier 1), world-travel (tier 2), gaming (tier 2), memes (tier 3).

### Promotions & Splash Screen
- `lib/promotions.ts` — `PROMOTIONS` array of time-limited offers; `getActivePromotions()` returns offers whose `startDate`/`endDate` (YYYY-MM-DD IST) bracket today
- `components/SplashScreen.tsx` — full-screen overlay shown once per IST day (localStorage key `bq_splash_date`); displays active promotions, today's festival pack (if any), and a Pro/Max pitch; auto-dismisses after 5 seconds
- To run a sale: add an entry to `PROMOTIONS` in `lib/promotions.ts` with the desired date range and link — no code changes elsewhere needed

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

### Online Status (Leaderboard + Profile)
- `User.lastSeenAt DateTime?` field updated every 2 minutes by `OnlinePing` client component
- Leaderboard and profile page show green dot on avatar if `lastSeenAt > now - 5 minutes`
- Leaderboard shows ⭐ badge for Pro users, 👑 badge for Max users (Max takes priority)
- Leaderboard columns: rank, player, coins, correct answers, accuracy %, followers, quizlets owned, quiz attempts — all except accuracy are sortable via URL params (`?sort=coins&dir=desc&page=1`)
- Podium (top-3 cards) only renders when `sort === "coins" && dir === "desc"` on page 1 — hidden during non-default sort to avoid confusion
- Admin sees extra column: email + join date
- `POST /api/user/ping` handles the update

### Follow System
- `UserFollow` model: `id`, `followerId`, `followingId`, `createdAt` — `@@unique([followerId, followingId])`; cascade deletes
- `POST /api/user/follow/[userId]` — follow a user; guards: auth, self-follow (400), target non-existent or isAdmin (404); duplicate silently ignored
- `DELETE /api/user/follow/[userId]` — unfollow
- `components/profile/FollowButton.tsx` — client component with optimistic toggle and rollback on non-2xx
- Profile pages hidden for admin users (`lib/profile.ts` returns `null` if `isAdmin === true` → Next.js `notFound()`)
- Follower notifications fan out in `/api/attempt`: `follow_milestone` when followed user crosses a coin milestone; `follow_streak_milestone` when they hit a streak milestone
- **No notification on "user comes online"** — the 2-min ping would be unacceptably noisy; online status is display-only on the profile page

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
- `Notification` model: `id`, `userId`, `type`, `message`, `isRead`, `createdAt`
- Notification types: `overtaken` | `top3_join` | `feedback_reply` | `admin_message` | `milestone` | `streak_milestone` | `follow_milestone` | `follow_streak_milestone`
- `/notifications` page shows all of a user's notifications; `TYPE_META` in the page maps each type to icon + label + color
- `GET /api/notifications` returns unread count + list
- Created by: admin feedback reply, admin direct message (admin/users), leaderboard overtake/top3 events, milestone unlock, streak milestone, follow fan-out (follow_milestone, follow_streak_milestone)
- MobileNav "More" drawer shows red dot on Notifications if unread count > 0

### Social Feed
- `/feed` page — Duolingo-style social feed; replaces Notifications as the primary nav entry (Notifications still accessible)
- Shows **own** activity + activity of **followed users**, newest first, paginated (20/page)
- **Activity types** stored in `FeedActivity` model (`type` + `data` JSON):
  - `quiz_completed` — `{ quizTitle, category, score, total, coinsEarned }` — created in `/api/attempt` on every quiz submission
  - `milestone_earned` — `{ milestoneName, milestoneType, threshold, tier }` — created in `/api/attempt` when coin or non-coin milestone crossed
  - `quizlet_earned` — `{ quizletName, rarity, icon, colorFrom, colorTo, source }` (`source: "pack" | "mystical"`) — created in `/api/packs/open` (new pack quizlets) and `/api/attempt` (mystical grants)
  - `streak_milestone` — `{ days }` — created in `/api/attempt` when streak milestone crossed
  - `leaderboard_top3` — `{ rank }` — created in `/api/attempt` when user first enters top 3
  - `user_returned` — `{ daysMissed }` — created in `/api/user/ping` when `lastSeenAt` was >48 hours ago (fires once per return)
- **Likes**: `FeedLike` model — `@@unique([userId, activityId])`; `POST /api/feed/[id]/like` toggles like and returns `{ liked, likeCount }`
- **Comments**: `FeedComment` model; `GET /api/feed/[id]/comments` returns all; `POST` adds one (max 280 chars)
- All feed activity creation is **fire-and-forget** (`.catch(() => {})`) — never blocks the main API response
- Feed is **not a notification channel** — feed events do not create `Notification` records; they are separate systems

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

### Milestone System
- **5 milestone types**: `coins` | `quizzes` | `answers` | `categories` | `streak`
- **6 tiers**: bronze · silver · gold · platinum · diamond · **cosmic** (new highest tier)
- Coin milestones: 1K–60K (every 1K) + 65K, 70K, 75K, 85K, 100K (`MILESTONE_THRESHOLDS`)
- Quiz milestones: 10, 25, 50, 100, 250, 500, 1000 quizzes played
- Answer milestones: 50, 100, 250, 500, 1000, 2500, 5000 unique correct answers
- Category milestones: 3, 5, 8, 11, 16 categories explored
- Streak badge milestones: 5, 10, 20, 30, 50, 75, 100, 150, 200, 365 days
- Defined in `lib/milestones-data.ts` — `ALL_MILESTONES`, `MILESTONES` (coins), `QUIZ_MILESTONES`, `ANSWER_MILESTONES`, `CATEGORY_MILESTONES`, `STREAK_BADGE_MILESTONES`, `TIER_COLORS`
- Gold/diamond/cosmic milestones have CSS animation classes (`legendary-card`, `rainbow-card`)
- Auto-granted in `/api/attempt` when a quiz completion crosses a threshold
- Stored in `UserMilestone` model: `@@unique([userId, milestoneType, threshold])` (milestoneType added)
- On unlock: creates an in-app `Notification` (type `milestone`) + fires a web push
- Existing users can be backfilled via `POST /api/admin/grant-milestones` (admin only)
- `/milestones` page shows earned badges by type + progress bar toward next unlock
- Dashboard shows the user's latest earned milestone badge and links to `/milestones`

### Daily Streaks
- Tracked on `User` model: `currentStreak`, `longestStreak`, `lastStreakDate` (UTC DateTime), `streakFreezes` (0–2)
- Streak increments each IST calendar day a user completes at least one quiz
- Date comparison uses `getISTDateString()` from `lib/time.ts` (IST = UTC+5:30)
- Gap of exactly 1 day → streak increments; gap >1 day → freeze auto-consumed if available, else streak resets to 1
- Streak milestone thresholds: `STREAK_MILESTONES` in `lib/game-config.ts` — [5,10,15,20,25,30,40,50,60,75,90,100,150,200,365] days
- On crossing a streak milestone: creates `Notification` (type `streak_milestone`) + fire-and-forget push
- Streak update only writes to DB when the IST date has changed (skips same-day plays)
- Dashboard shows 🔥 streak card with progress bar to next milestone and freeze count
- Streak freezes are coin-purchased (not UPI): 1st freeze = 1,000 coins, 2nd freeze = 2,500 coins, max 2 owned
- Purchase endpoint: `GET/POST /api/user/buy-streak-freeze`; shop has a "🧊 Streak Freeze" tab

### New User Email Notification
- NextAuth `events.createUser` fires when a brand-new Google account signs up
- Sends admin notification email via `lib/email.ts → sendEmail()`

### Quiz Completion Tracking
- Discover page fetches user's `QuizAttempt` records where `score === total` (perfect score)
- Those quiz cards show a green **✓ Completed** badge and green border

### Mobile Navigation
- Desktop: full `Sidebar` — collapsible (state in localStorage `bq_sidebar_collapsed`); Feed is listed between Milestones and Game Modes
- Mobile: `MobileNav` — bottom tab bar (Home, Discover, Packs, Quizlets, More) + "More" drawer with (Leaderboard, Milestones, Game Modes, Feedback, Upgrade/Shop, **Feed**, Notifications)
- `/marketplace` is labelled "Packs"; `/shop` (Pro/Max) is labelled "Upgrade" — keep these distinct to avoid confusion
- Main content has `pb-20 md:pb-0` to clear the mobile nav bar

### Theme (Dark Only)
- App is **dark-only** — `ThemeProvider` uses `forcedTheme="dark"`, no light mode toggle exists
- CSS custom properties in `globals.css` define `--background`, `--surface`, `--main-bg`, `--sidebar-*`, `--text-base` (all dark values on `:root, .dark`)
- Structural elements use `style={{ background: "var(--main-bg)" }}` etc.
- **Do not use hardcoded dark colors** (`bg-[#0d0a22]`, `bg-gray-900`, `bg-[#070511]`) — use `bg-white/5` or CSS variables instead
- No `.light` overrides exist in `globals.css` — do not add any

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
- Currently triggered by: admin feedback reply (`/api/admin/feedback`), leaderboard overtake (`/api/attempt`), milestone unlock (`/api/attempt`), streak milestone (`/api/attempt`)
- Requires `VAPID_EMAIL`, `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY` env vars
- Generate VAPID keys: `npx web-push generate-vapid-keys`
- Expired/revoked subscriptions (HTTP 410/404) are auto-deleted from DB on send

### Remotion Video Composition
- `remotion/` directory contains a standalone video composition (not part of the web app)
- Files: `BittsQuizReel.tsx`, `BittsQuizVideo.tsx`, `Root.tsx`, `index.ts`, `tokens.ts`
- Used to generate promotional/social media video reels for BittsQuiz
- Does not affect the Next.js app or DB — edit independently

### Design System
- `design-system.md` documents the visual design tokens, colors, spacing, and component patterns
- Reference this when adding new UI components to stay consistent

### Year Auto-Increment
The app name is always `BittsQuiz {new Date().getFullYear()}`.
Never hardcode a year — always use `new Date().getFullYear()`.

---

## Key Files to Know

| File | Purpose |
|------|---------|
| `lib/profile.ts` | Server-only profile data fetcher — `getProfileData(userId, viewerUserId)` — returns `null` for admins; parallel queries via `Promise.all` |
| `lib/milestones-data.ts` | Multi-type milestone definitions + `ALL_MILESTONES` + `TIER_COLORS` (6 tiers incl. cosmic) — edit names/tiers here |
| `lib/quizlets-data.ts` | All 103 quizlet definitions (9 standard packs + 3 global uniques + 6 festival + 19 mystical) |
| `lib/packs-data.ts` | All 15 pack definitions (9 standard + 6 festival) |
| `lib/roll.ts` | Pack opening RNG — edit drop rates here |
| `lib/festivals.ts` | Add/modify festival dates here |
| `lib/utils.ts` | RARITY_COLORS, SELL_VALUES, CATEGORIES (20 total, 4 with premiumTier), CategorySlug type |
| `lib/time.ts` | isSchoolHours() + getISTDateString() + IST offset helpers |
| `lib/game-config.ts` | Game timing constants, coin earn amounts, membership pricing, daily limits, streak constants |
| `lib/app-settings.ts` | getSchoolHoursEnabled() — reads AppSetting from DB |
| `lib/email.ts` | sendEmail() helper — used by auth createUser event (new user alerts); NOT used by feedback |
| `lib/push.ts` | sendPushToUser() — sends VAPID web push to all of a user's subscriptions; auto-cleans expired |
| `lib/pusher.ts` | pusherServer instance + DinoRex shared types (DinoRexPlayer, DinoRexQuestion, PusherEvent) |
| `lib/promotions.ts` | Time-limited promotions — add entries here to run sales; `getActivePromotions()` is used by SplashScreen |
| `lib/audio-context.tsx` | Background music context + state |
| `public/sw.js` | Service worker — receives push events and shows browser notifications |
| `app/icon.svg` | App favicon — SVG lightning bolt on purple-to-pink gradient (auto-served by Next.js) |
| `app/globals.css` | Dark-only theme CSS variables + font config + animation keyframes |
| `app/(main)/loading.tsx` | App-level loading screen — rotating game facts, shown during route transitions |
| `app/(main)/shop/page.tsx` | Pro/Max membership + coin purchase + daily limit reset (replaces old /upgrade and /buy-coins) |
| `app/(main)/notifications/page.tsx` | In-app notifications list |
| `app/(main)/feed/page.tsx` | Social feed — paginated activity cards with likes + inline comments |
| `app/api/feed/route.ts` | GET paginated feed (own + followed users' FeedActivity) |
| `app/api/feed/[id]/like/route.ts` | POST toggle like — returns `{ liked, likeCount }` |
| `app/api/feed/[id]/comments/route.ts` | GET + POST comments on a feed activity |
| `app/(main)/admin/users/page.tsx` | User manager — lock/unlock, reset daily, grant/revoke tiers, send push |
| `app/(main)/admin/settings/page.tsx` | Global admin settings — school hours toggle |
| `components/SplashScreen.tsx` | Daily splash screen — edit/add promotions in `lib/promotions.ts`, not here |
| `components/profile/FollowListModal.tsx` | Follower/following list modal on profile pages |
| `components/layout/NotificationsProvider.tsx` | Unread notification count context — read via `useUnreadCount()` |
| `components/ThemeProvider.tsx` | next-themes wrapper |
| `components/IntroOverlay.tsx` | First-visit onboarding (5 steps, shown once via localStorage) |
| `components/layout/Sidebar.tsx` | Desktop collapsible sidebar — edit nav items here |
| `components/layout/MobileNav.tsx` | Mobile bottom nav — edit items here |
| `components/layout/OnlinePing.tsx` | Pings /api/user/ping every 2 min |
| `components/game/SurvivalGame.tsx` | Survival mode — streak until first wrong answer |
| `components/game/DailyChallengeGame.tsx` | Daily challenge — 5 deterministic questions per day |
| `prisma/schema.prisma` | DB schema — run `npm run db:push` after changes |
| `prisma/seed.ts` | Re-run `npm run db:seed` to re-seed (~178 quizzes, all 20 categories) |

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
- **Theming**: app is dark-only (`forcedTheme="dark"`); structural backgrounds → CSS variables; do NOT add `.light` overrides or a theme toggle
- **Email**: `lib/email.ts` is only used for new-user signup alerts; feedback replies use push notifications via `lib/push.ts` — do not re-add email to the feedback flow
- **DinoRex multiplayer**: uses Pusher Channels (not Socket.io); room state in `DinoRexRoom` DB model; types in `lib/pusher.ts`
- **Web Push**: `sendPushToUser()` is fire-and-forget (errors logged, never thrown); requires VAPID env vars set
- **Tests**: `npm run test` runs Vitest unit tests — run after touching `lib/` files; E2E via `npm run test:e2e`
- **Mobile**: pages should use `p-4 md:p-8` responsive padding; sidebar is desktop-only
- **Fonts**: body = Plus Jakarta Sans (`--font-jakarta`), headings = Space Grotesk (`--font-grotesk`) — do not change font imports in `app/layout.tsx`
- **Confirm before**: deleting files, dropping DB tables, force-pushing
- **Shop vs Upgrade**: `/shop` replaced `/upgrade` and `/buy-coins` everywhere — do not link to either old route
- **Promotions**: add time-limited offers in `lib/promotions.ts → PROMOTIONS`; `SplashScreen` picks them up automatically — no code changes to the component needed
- **Notifications context**: `useUnreadCount()` from `components/layout/NotificationsProvider.tsx` gives the current unread count client-side; already available everywhere inside `(main)/layout.tsx`
- **isMax**: always check `isMax && (!maxExpiresAt || maxExpiresAt > new Date())` for active Max status, same pattern for Pro
- **CorrectAnswer**: never skip the dedup check in `/api/attempt` — it prevents infinite coin farming
- **Mystical quizlets**: never add them to packs or the pack-opening flow — they're granted exclusively via `CATEGORY_MYSTICAL_MAP` logic in `/api/attempt`; to add a new one, add to `lib/quizlets-data.ts` (rarity `mystical`, pack `mystical`) AND add to `CATEGORY_MYSTICAL_MAP` in `app/api/attempt/route.ts`
- **School hours**: IST = UTC+5:30; use `lib/time.ts → isSchoolHours()` rather than inline time math; check `getSchoolHoursEnabled()` from `lib/app-settings.ts` before enforcing
- **Categories**: CATEGORIES has 20 entries — all are seeded; grade-6/geography (premiumTier 1), world-travel/gaming (premiumTier 2), memes (premiumTier 3) are premium-gated
- **Notifications**: use `Notification` model for in-app messages; use `lib/push.ts → sendPushToUser()` for browser push — these are separate channels
- **Admin users**: actions go through PATCH `/api/admin/users/[id]` with `action` field (`lock`, `unlock`, `reset_daily`, `grant_pro`, `revoke_pro`, `grant_max`, `revoke_max`)
- **AppSetting**: read via `lib/app-settings.ts`; write via PATCH `/api/admin/settings`; never hardcode setting keys outside those two files
- **Milestones**: 5 types (coins/quizzes/answers/categories/streak); `UserMilestone` unique key is `[userId, milestoneType, threshold]`; always pass `milestoneType` when inserting; use `skipDuplicates: true`; push is fire-and-forget
- **Streaks**: always use `getISTDateString()` from `lib/time.ts` for IST date comparison — never inline IST math; streak DB write is skipped when `lastDateIST === todayIST`; freeze purchase uses `streakFreezes: { increment: 1 }` (atomic, no read-modify-write)
- **SVG icons**: custom category icons live in `components/icons/` — import from there, not inline SVG
- **Follow system**: `UserFollow` model with cascade deletes; `lib/profile.ts → getProfileData()` returns `null` for admins (→ `notFound()`); leaderboard sort is URL-param-driven (`sort`/`dir`/`page`); accuracy is computed and NOT sortable (no raw query needed)
- **Leaderboard sort**: sort state lives in URL params — always preserve `sort`/`dir` when generating pagination links; podium renders only on default sort (coins desc, page 1)
- **Feed vs Notifications**: these are completely separate systems — `FeedActivity` records public social events (quiz completions, milestones, quizlets, streaks, returns, top-3); `Notification` records private system messages (overtakes, admin replies, follow events). Never merge them or create `Notification` entries from feed logic.
- **Feed activity creation**: always fire-and-forget (`.catch(() => {})`); never `await` feed writes in the hot path; new activity types need a matching card renderer in `app/(main)/feed/page.tsx → ActivityBody`
- **user_returned trigger**: fires in `app/api/user/ping/route.ts` only when `lastSeenAt` was >48 hours ago — the first ping after return sets `lastSeenAt` to now, so subsequent pings won't re-trigger it
