# CLAUDE.md — AI Assistant Guide for BittsQuiz 2026

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
| Fonts | Nunito (body) + Rubik (headings) via next/font/google (CSS vars: `--font-jakarta`, `--font-grotesk`) |
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

## Schema & Seed Commands

```bash
npm run db:push      # push schema changes to DB
npx prisma generate  # regenerate client types
npm run db:seed      # re-seed data (idempotent)
```

## Environment Variables

```env
DATABASE_URL="postgresql://..."
NEXTAUTH_SECRET="..."
NEXTAUTH_URL="http://localhost:3000"
GOOGLE_CLIENT_ID="..."
GOOGLE_CLIENT_SECRET="..."
ADMIN_USERNAME="admin"
ADMIN_PASSWORD="..."
ADMIN_EMAIL="admin@quizlet.internal"
NEXT_PUBLIC_UPI_ID="merchant@upi"          # shown to users, not secret
NEXT_PUBLIC_UPI_NAME="BittsQuiz"
UPI_ID="merchant@upi"
UPI_NAME="BittsQuiz"
NEXT_PUBLIC_MUSIC_URL="..."                # public MP3 stream URL
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_SECURE="false"
SMTP_USER="..."
SMTP_PASS="..."                            # Gmail App Password
ADMIN_NOTIFY_EMAIL="..."                   # defaults to SMTP_USER if unset
PUSHER_APP_ID="..."
PUSHER_KEY="..."
PUSHER_SECRET="..."
PUSHER_CLUSTER="ap2"                       # India: ap2 recommended
NEXT_PUBLIC_PUSHER_KEY="..."
NEXT_PUBLIC_PUSHER_CLUSTER="ap2"
VAPID_EMAIL="mailto:..."
NEXT_PUBLIC_VAPID_PUBLIC_KEY="..."         # generate: npx web-push generate-vapid-keys
VAPID_PRIVATE_KEY="..."
TEST_USERNAME="..."                        # test login button on /login
TEST_PASSWORD="..."
```

---

## Directory Structure

```
app/
├── layout.tsx  page.tsx  globals.css  login/  certificate/
└── (main)/
    ├── layout.tsx  loading.tsx
    ├── dashboard/  discover/  quiz/[id]/  marketplace/  quizlets/
    ├── quiz-maker/  leaderboard/  profile/[userId]/  feedback/
    ├── game/  notifications/  feed/  trading/  shop/  milestones/
    └── admin/  (quizzes/  quizzes/[id]/edit/  users/  payments/  feedback/  settings/)

components/
├── layout/  (Sidebar, MobileNav, OnlinePing, PushSubscriptionManager, NotificationsProvider, FeedProvider)
├── quiz/  marketplace/  discover/  quizlets/  milestones/  profile/  trading/  game/  icons/
└── ThemeProvider  SplashScreen  IntroOverlay  AudioPlayer

lib/
    auth  db  email  push  pusher  audio-context  profile
    quizlets-data  packs-data  trading  trading-resolve
    festivals  roll  time  game-config  app-settings  utils  milestones-data

prisma/  schema.prisma (27 models)  seed.ts
```

---

## Core Domain Concepts

### Quizlets (Characters)
- 107 total: 9 standard packs + 3 global uniques + 6 festival + 23 mystical
- Rarities: `common | uncommon | rare | epic | legendary | secret | unique | mystical | impossible`
- `isHidden: true` → Secret/Unique/Impossible — "Hidden" section in My Collection only; excluded from All Quizlets dex and pack descriptions
- Mystical: `isHidden: false`, `pack: "mystical"` — visible in dex; never sold in packs

### Rarity Visual System
Defined in `lib/utils.ts → RARITY_COLORS`:
- Common: gray border, no glow | Uncommon: green, soft glow | Rare: blue, medium glow | Epic: purple, strong glow
- Legendary: gold, animated pulse (`legendary-card` CSS class)
- Secret: dark/red | Unique: pink, rainbow animation (`rainbow-card`) | Mystical: teal, shimmer (`mystical-card`) | Impossible: full rainbow animation

### Mystical Quizlets
- Granted by `/api/attempt` only — never from packs
- Category condition: 10+ distinct quizzes in that category → grants `CATEGORY_MYSTICAL_MAP[category]` (brand-logos is unmapped)
- Atypical Choices condition: `quizAttempt.count === 1` after recording (first-ever attempt by any user)
- On grant: creates `UserQuizlet` + `Notification` (type `milestone`); already-owned silently skipped
- To add a new one: add to `lib/quizlets-data.ts` (rarity `mystical`, pack `mystical`) AND `CATEGORY_MYSTICAL_MAP` in `app/api/attempt/route.ts`

### Coin Economy
- Per correct answer by difficulty: 1→3, 2→5, 3→8, 4→12, 5→20
- Multipliers: Regular 1×, Pro 1.5×, Max 2× (applied before daily cap)
- Daily earn limits: Regular 500, Pro 1000, Max 1500 (resets UTC midnight)
- No duplicate coins: `CorrectAnswer` `@@unique([userId, questionId])`; use `createMany({ skipDuplicates: true })`

### Membership Tiers
- Regular: default, 1×, 500/day | Pro: ₹250/mo, 1.5×, 1000/day (`isPro + proExpiresAt`) | Max: ₹500/mo, 2×, 1500/day (`isMax + maxExpiresAt`)
- Check active: `isMax && (!maxExpiresAt || maxExpiresAt > new Date())` — same pattern for Pro; Max > Pro > Regular
- Renewal extends from current expiry date, not today

### Pack Opening (`lib/roll.ts`)
- Guaranteed slots: 2 common, 2 uncommon, 1 rare; 1 bonus roll can hit epic/legendary/secret/unique
- Rainbow pack: 0.001% chance for impossible; already-owned quizlet → refund sell value in coins

### Festival System
- 6 festivals by `MM-DD` in `lib/festivals.ts`; `/api/packs` includes festival pack slug on matching dates — pure date comparison, no DB change

### Quiz Content
- ~193 official quizzes across 20 categories seeded via `prisma/seed.ts`
- Premium categories: grade-6/geography (tier 1), world-travel/gaming (tier 2), memes (tier 3)
- Brand-logos is the only category with no `CATEGORY_MYSTICAL_MAP` entry

### Weekly Offers & Splash Screen
- Stored as `AppSetting` keys: `weeklyOffer_pro`, `weeklyOffer_max`, `weeklyOffer_daily_reset`, `weeklyOffer_coins` — value: `{ discountPercent, weekStart }`
- `lib/app-settings.ts → getWeeklyOffers()` returns only offers matching the current Sun–Sat week (UTC)
- `SplashScreen.tsx` shown once per IST day (`bq_splash_date`); admin sets/clears via `POST /api/admin/weekly-offer`

### Trading Post
- `TradeListing`: sellerId, userQuizletId (unique — no double-listing), quizletId, startingPrice, buyNowPrice?, status (active/sold/expired/cancelled), expiresAt (24h)
- `TradeBid`: listingId, bidderId, amount, isHeld
- 5% seller fee; always use `calculateSellerProceeds()` from `lib/trading.ts`
- Mystical quizlets blocked: `TRADING_CONFIG.BLOCKED_PACKS = ["mystical"]`
- Call `maybeResolveExpired()` from `lib/trading-resolve.ts` at start of every trading read endpoint (30s cooldown)

### Feed & Reactions
- `FeedReaction`: `@@unique([userId, activityId, emoji])`; toggled via `POST /api/feed/[id]/react/`; emojis: 🔥🎉👏😱
- `Nudge`: user-to-user pokes via `POST /api/feed/nudge/[userId]/`
- `ExplanationRead`: `@@unique([userId, questionId])`; written via `POST /api/explanation-read/`

### Game Modes
- HackDev: tech, 60s | DinoRex: elimination, Pusher multiplayer + AI bots | SpeedBlitz: 20q in 30s | Survival: 10s/q, first wrong = over | Daily Challenge: 5 deterministic (date-seeded), 30s each | Classic: links to /discover
- All modes submit to `/api/attempt` for coin awards (multiplier + daily limit apply)

### UPI Payment Flow (`/shop`)
1. User selects purchase → QR + UPI deep link shown
2. User pays, enters UTR → `POST /api/user/submit-payment` → `PaymentRequest` (pending)
3. Admin approves at `/admin/payments` → credits coins / grants Pro+expiry / grants Max+expiry / resets daily limit
- Renewal extends from current expiry; `/buy-coins` and `/upgrade` both redirect to `/shop`

### Feedback
- `POST /api/feedback` → `Feedback` DB table; no email sent
- Admin reply creates `Notification` + push (not email)

### Notifications
- Types: `overtaken | top3_join | feedback_reply | admin_message | milestone | streak_milestone | follow_milestone | follow_streak_milestone`
- **Separate from Feed** — `Notification` = private system messages; `FeedActivity` = public social events; never create `Notification` from feed logic

### Social Feed
- Activity types in `FeedActivity.type`: `quiz_completed | milestone_earned | quizlet_earned | streak_milestone | leaderboard_top3 | user_returned`
- `quizlet_earned.source`: `"pack" | "mystical"`; `user_returned` fires in `POST /api/user/ping` only when `lastSeenAt > 48h ago`
- All feed writes are **fire-and-forget** (`.catch(() => {})`); never `await` in the hot path
- New activity types need a matching renderer in `feed/page.tsx → ActivityBody`
- Likes: `FeedLike` `@@unique([userId, activityId])`; Comments: `FeedComment` (max 280 chars)

### Follow System
- `UserFollow`: `@@unique([followerId, followingId])`, cascade deletes
- Guards: self-follow (400), target non-existent or isAdmin (404); duplicate silently ignored
- `lib/profile.ts → getProfileData()` returns `null` for admins → `notFound()`
- Follow fan-out notifications (`follow_milestone`, `follow_streak_milestone`) created in `/api/attempt`

### Online Status
- `User.lastSeenAt` updated every 5 min by `OnlinePing`; green dot if `lastSeenAt > now - 5 min`
- Leaderboard: ⭐ Pro, 👑 Max (Max takes priority); podium renders only on default sort (coins desc, page 1)
- Leaderboard sort via URL params (`sort`/`dir`/`page`); accuracy is computed, NOT sortable

### School Hours Restriction
- Applies to `@oberoi-is.net` emails; blocks Mon–Fri 08:00–15:00 IST
- Enforced at: `/quiz/[id]` page render AND `/api/attempt` POST
- Global toggle: `AppSetting` key `schoolHoursEnabled`; per-user override: `User.schoolAccessOverride = true`
- Always use `lib/time.ts → isSchoolHours()` + `lib/app-settings.ts → getSchoolHoursEnabled()`; never inline IST math

### Account Locking
- `User.isLocked` — quiz page shows locked UI; `/api/attempt` returns 403
- Admin: PATCH `/api/admin/users/[id]` with `action: "lock" | "unlock"`

### No-Duplicate Coins
- `CorrectAnswer` model: `@@unique([userId, questionId])` — never skip this check; it prevents infinite coin farming
- Insert via `prisma.correctAnswer.createMany({ skipDuplicates: true })`

### Global Settings
- `AppSetting` model: `key` (unique), `value` (string); read via `lib/app-settings.ts`; write via PATCH `/api/admin/settings` or `POST /api/admin/weekly-offer`
- Never hardcode setting keys outside `lib/app-settings.ts`

### Milestone System
- 5 types: `coins | quizzes | answers | categories | streak`; 6 tiers: bronze · silver · gold · platinum · diamond · cosmic
- Coin: 1K–60K (every 1K) + 65K, 70K, 75K, 85K, 100K | Quiz: 10,25,50,100,250,500,1000 | Answer: 50,100,250,500,1000,2500,5000 | Category: 3,5,8,11,16 | Streak badge: 5,10,20,30,50,75,100,150,200,365
- `UserMilestone` unique key: `[userId, milestoneType, threshold]`; always pass `milestoneType`; use `skipDuplicates: true`
- On unlock: `Notification` (type `milestone`) + web push (fire-and-forget)

### Daily Streaks
- IST date comparison via `getISTDateString()` from `lib/time.ts` — never inline IST math
- Gap 1 day → increment; gap >1 day → consume freeze if available, else reset to 1
- Freeze purchase: `streakFreezes: { increment: 1 }` (atomic); 1st = 1K coins, 2nd = 2.5K coins; max 2
- `STREAK_MILESTONES` in `lib/game-config.ts`: 5,10,15,20,25,30,40,50,60,75,90,100,150,200,365

### Mobile Navigation
- Desktop: `Sidebar` (collapsible, `bq_sidebar_collapsed`); Mobile: `MobileNav` (bottom tab bar + "More" drawer)
- `pb-20 md:pb-0` on main content to clear mobile nav bar
- `/marketplace` = "Packs"; `/shop` = "Upgrade" — keep distinct, never link to `/upgrade` or `/buy-coins`

### Theme (Dark Only)
- `forcedTheme="dark"` — no light mode; use `bg-white/5`, `bg-white/10`, or CSS variables
- Never hardcode dark hex colors (`bg-[#0d0a22]`, etc.); never add `.light` overrides to `globals.css`

### DinoRex Multiplayer
- Uses Pusher Channels (not Socket.io); room state in `DinoRexRoom` DB model; types in `lib/pusher.ts`
- AI practice mode is standalone client-only (no Pusher, no DB rooms)

### Web Push
- `public/sw.js` handles push + notificationclick; requires `VAPID_EMAIL`, `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`
- `sendPushToUser()` from `lib/push.ts` is fire-and-forget; auto-deletes expired subscriptions (HTTP 410/404)

### Misc
- New user signup: NextAuth `events.createUser` → `lib/email.ts → sendEmail()` (admin alert only — do not add email elsewhere)
- Quiz completion: Discover page checks `QuizAttempt where score === total` → green ✓ badge
- Question images: `Question.imageUrl String?` — shown above question in QuizPlayer; admin-editable
- Test login: `TEST_USERNAME` + `TEST_PASSWORD` env vars on `/login`; non-admin user
- Admin 2FA: TOTP — setup `POST /api/admin/2fa/setup/`, verify `POST /api/admin/2fa/verify/`
- Background music: `lib/audio-context.tsx`; `bq_music_enabled`/`bq_music_volume` localStorage; auto-pauses on `/quiz/[id]`
- Design system: see `design-system.md` for visual tokens, colors, spacing, component patterns
- Year: always `new Date().getFullYear()` — never hardcode
- Quiz answer shuffling: seeded Fisher-Yates (`shuffleOrder`) in `QuizPlayer.tsx` — do not change this logic

---

## Key Files

| File | Purpose |
|------|---------|
| `lib/profile.ts` | `getProfileData(userId, viewerUserId)` — returns `null` for admins; parallel queries |
| `lib/milestones-data.ts` | All milestone definitions + `ALL_MILESTONES`, `TIER_COLORS` — edit names/tiers here |
| `lib/quizlets-data.ts` | All 107 quizlet definitions |
| `lib/packs-data.ts` | All 15 pack definitions |
| `lib/roll.ts` | Pack opening RNG — edit drop rates here |
| `lib/festivals.ts` | Add/modify festival dates here |
| `lib/utils.ts` | `RARITY_COLORS`, `SELL_VALUES`, `CATEGORIES` (20 total, 4 premium), `CategorySlug` |
| `lib/time.ts` | `isSchoolHours()`, `getISTDateString()`, IST offset helpers |
| `lib/game-config.ts` | Coin earn amounts, daily limits, membership pricing, `STREAK_MILESTONES` |
| `lib/app-settings.ts` | `getSchoolHoursEnabled()`, `getRetakeCoinsEnabled()`, `getWeeklyOffers()` |
| `lib/trading.ts` | `TRADING_CONFIG` + `calculateSellerProceeds()` |
| `lib/trading-resolve.ts` | `maybeResolveExpired()` — call at start of every trading read endpoint |
| `lib/email.ts` | `sendEmail()` — new-user alerts only; NOT used by feedback |
| `lib/push.ts` | `sendPushToUser()` — VAPID web push; fire-and-forget; auto-cleans expired |
| `lib/pusher.ts` | `pusherServer` + DinoRex shared types (DinoRexPlayer, DinoRexQuestion, PusherEvent) |
| `app/globals.css` | Dark-only CSS variables + animation keyframes |
| `prisma/schema.prisma` | DB schema (27 models) — run `db:push` + `prisma generate` after changes |
| `app/(main)/shop/page.tsx` | Pro/Max membership + coin purchase + daily limit reset |
| `app/(main)/feed/page.tsx` | Social feed — `ActivityBody` renderer (add new activity types here) |
| `app/(main)/admin/settings/page.tsx` | Global toggles + weekly discount offers |
| `components/SplashScreen.tsx` | Daily splash — festival pack + weekly offers (once per IST day) |
| `components/layout/NotificationsProvider.tsx` | `useUnreadCount()` — unread count context |
| `components/layout/Sidebar.tsx` | Desktop sidebar — edit nav items here |
| `components/layout/MobileNav.tsx` | Mobile bottom nav — edit items here |
| `public/sw.js` | Service worker — push events + notificationclick |

---

## Development Workflow

- AI branches: always use `claude/` prefix; never push to `master` without explicit permission
- After schema changes: `npm run db:push` → `npx prisma generate` → `npm run db:seed` (if quizlet/pack data changed)
- After adding new quizlets/packs: update `lib/quizlets-data.ts` or `lib/packs-data.ts`, then re-run `npm run db:seed`

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
- **Fonts**: body = Nunito (`--font-jakarta`), headings = Rubik (`--font-grotesk`) — CSS variable names stay as-is; do not change font imports in `app/layout.tsx`
- **Confirm before**: deleting files, dropping DB tables, force-pushing
- **Shop vs Upgrade**: `/shop` replaced `/upgrade` and `/buy-coins` everywhere — do not link to either old route
- **Weekly offers**: managed via `/admin/settings` → `POST /api/admin/weekly-offer`; stored as `AppSetting` keys; read via `getWeeklyOffers()` from `lib/app-settings.ts` — no `lib/promotions.ts` file exists
- **Notifications context**: `useUnreadCount()` from `components/layout/NotificationsProvider.tsx` gives the current unread count client-side; already available everywhere inside `(main)/layout.tsx`
- **isMax**: always check `isMax && (!maxExpiresAt || maxExpiresAt > new Date())` for active Max status, same pattern for Pro
- **CorrectAnswer**: never skip the dedup check in `/api/attempt` — it prevents infinite coin farming
- **Mystical quizlets**: never add them to packs or the pack-opening flow — they're granted exclusively via `CATEGORY_MYSTICAL_MAP` logic in `/api/attempt`; to add a new one, add to `lib/quizlets-data.ts` (rarity `mystical`, pack `mystical`) AND add to `CATEGORY_MYSTICAL_MAP` in `app/api/attempt/route.ts`
- **School hours**: IST = UTC+5:30; use `lib/time.ts → isSchoolHours()` rather than inline time math; check `getSchoolHoursEnabled()` from `lib/app-settings.ts` before enforcing
- **Categories**: CATEGORIES has 20 entries — all are seeded; grade-6/geography (premiumTier 1), world-travel/gaming (premiumTier 2), memes (premiumTier 3) are premium-gated
- **Notifications**: use `Notification` model for in-app messages; use `lib/push.ts → sendPushToUser()` for browser push — these are separate channels
- **Admin users**: actions go through PATCH `/api/admin/users/[id]` with `action` field (`lock`, `unlock`, `reset_daily`, `grant_pro`, `revoke_pro`, `grant_max`, `revoke_max`)
- **AppSetting**: read via `lib/app-settings.ts`; write via PATCH `/api/admin/settings` or `POST /api/admin/weekly-offer`; never hardcode setting keys outside `lib/app-settings.ts`
- **Trading**: mystical quizlets cannot be listed (`BLOCKED_PACKS`); always use `calculateSellerProceeds()` for seller payout (5% fee); call `maybeResolveExpired()` at the start of any trading read endpoint
- **Milestones**: 5 types (coins/quizzes/answers/categories/streak); `UserMilestone` unique key is `[userId, milestoneType, threshold]`; always pass `milestoneType` when inserting; use `skipDuplicates: true`; push is fire-and-forget
- **Streaks**: always use `getISTDateString()` from `lib/time.ts` for IST date comparison — never inline IST math; streak DB write is skipped when `lastDateIST === todayIST`; freeze purchase uses `streakFreezes: { increment: 1 }` (atomic, no read-modify-write)
- **SVG icons**: custom category icons live in `components/icons/` — import from there, not inline SVG
- **Follow system**: `UserFollow` model with cascade deletes; `lib/profile.ts → getProfileData()` returns `null` for admins (→ `notFound()`); leaderboard sort is URL-param-driven (`sort`/`dir`/`page`); accuracy is computed and NOT sortable (no raw query needed)
- **Leaderboard sort**: sort state lives in URL params — always preserve `sort`/`dir` when generating pagination links; podium renders only on default sort (coins desc, page 1)
- **Feed vs Notifications**: these are completely separate systems — `FeedActivity` records public social events (quiz completions, milestones, quizlets, streaks, returns, top-3); `Notification` records private system messages (overtakes, admin replies, follow events). Never merge them or create `Notification` entries from feed logic.
- **Feed activity creation**: always fire-and-forget (`.catch(() => {})`); never `await` feed writes in the hot path; new activity types need a matching card renderer in `app/(main)/feed/page.tsx → ActivityBody`
- **user_returned trigger**: fires in `app/api/user/ping/route.ts` only when `lastSeenAt` was >48 hours ago — the first ping after return sets `lastSeenAt` to now, so subsequent pings won't re-trigger it
