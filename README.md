# Quizlet 2026

A full-stack quiz webapp with collectible Quizlet characters, a coin economy, multiplayer game modes, festival events, and a completion certificate.

## Features

- 🔐 **Google OAuth** sign-in via NextAuth.js
- 📊 **Dashboard** with stats, coins, and collection progress
- 🔍 **Discover** — browse 50 official quizzes across 10 categories + community quizzes
- ✏️ **Quiz Maker** — create and publish your own quizzes
- 🛒 **Marketplace** — spend coins on packs to collect Quizlet characters
- 🎴 **Quizlets** — view, filter, and sell your character collection
- ℹ️ **Info** — full character directory with rarity guide
- 🎮 **Game Modes** — HackDev (speed run), DinoRex (elimination), Speed Blitz
- 🎆 **Festival packs** — special limited-time packs on 6 festivals per year
- 🏆 **Certificate** — awarded when you collect every Quizlet

## Quick Start

```bash
npm install
cp .env.example .env   # Fill in DATABASE_URL, NEXTAUTH_SECRET, GOOGLE_CLIENT_ID/SECRET
npm run db:push        # Push Prisma schema to Neon PostgreSQL
npm run db:seed        # Seed 50 official quizzes + all Quizlets + packs
npm run dev            # Start at http://localhost:3000
```

See [CLAUDE.md](./CLAUDE.md) for full technical documentation.
