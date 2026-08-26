# Rivals

## Daily Puzzles & Wagers

**Rivals** is a daily competitive puzzle app where players complete a fast three-round puzzle arena, compete with friends, wager virtual coins, and climb the leaderboards.

> **Daily 3-round puzzle arena. Duel friends, wager coins, and climb the leaderboard!**

---

## 🎮 Core Gameplay Loop

```text
Daily Arena
    ↓
3 Puzzle Rounds
    ↓
Word Duel
Cipher Break
Number Rush
    ↓
Combined Arena Score
    ↓
Compete with Friends
    ↓
Wager Virtual Coins
    ↓
Climb the Leaderboards
```

The target experience is a competitive daily session that can be completed in **under 5 minutes**.

---

## ✨ MVP Features

* Daily server-timed puzzle Arena
* Three puzzle rounds:

  * Word Duel
  * Cipher Break
  * Number Rush
* Combined Arena Score
* Virtual coin economy
* 100 starting coins for new users
* Friend system
* Friend requests and friend list
* Daily and All-Time Friends Leaderboards
* Opt-in Global Leaderboard
* Daily and All-Time Global Rankings
* Friend challenges and virtual coin wagers
* Streak tracking and recovery rules
* RevenueCat subscription support
* AI-assisted puzzle generation with human QA
* Internal puzzle review and approval workflow

---

## 🏗️ Planned Architecture

```text
React Native App
        │
        ▼
FastAPI Backend
        │
        ├── Game Logic
        ├── Score Validation
        ├── Coin Economy
        ├── Wagers
        ├── Leaderboards
        └── Anti-Cheat
        │
        ▼
Supabase
        ├── Authentication
        ├── PostgreSQL Database
        ├── Realtime
        ├── Storage
        └── Row-Level Security

Additional Services:
- RevenueCat → Subscriptions and in-app purchases
- LLM API → Puzzle generation pipeline
```

---

## 📁 Project Structure

```text
Rivals/
│
├── mobile/
│   └── React Native mobile application
│
├── backend/
│   └── FastAPI backend
│
├── docs/
│   ├── Hackathon_Details.pdf
│   ├── PRODUCT_VISION.md
│   ├── PRD.md
│   ├── SCREEN_FLOW_SPEC.md
│   └── TECHNICAL_SPEC.md
│
├── .gitignore
└── README.md
```

---

## 📚 Project Documentation

The following documents are the primary source of truth for the project:

### `PRODUCT_VISION.md`

Defines the product vision, core concept, and locked product decisions.

### `PRD.md`

Defines the MVP requirements and what the first version of Rivals must do.

### `SCREEN_FLOW_SPEC.md`

Defines app screens, navigation, user flows, and important UI states.

### `TECHNICAL_SPEC.md`

Defines the planned architecture, backend responsibilities, database structure, API boundaries, security rules, and implementation approach.

---

## 🤖 Instructions for AI Coding Tools

Before making major product, architectural, or feature decisions, AI coding tools should read:

```text
docs/PRODUCT_VISION.md
docs/PRD.md
docs/SCREEN_FLOW_SPEC.md
docs/TECHNICAL_SPEC.md
```

### Rules

* Treat these documents as the project's source of truth.
* Do not contradict locked decisions without explicitly identifying the conflict.
* Do not introduce major features outside the documented MVP scope.
* Do not change the architecture without explaining why.
* Keep client-side code non-authoritative for competitive game state.
* Scores, coin balances, wagers, and payouts must remain server-authoritative.
* Update the relevant documentation if a major project decision changes.

---

## 🚧 Current Status

**Planning complete.**

Implementation has not yet started.

The project will be built incrementally, beginning with a small complete vertical slice:

```text
Authentication
    ↓
User receives 100 starting coins
    ↓
Home Screen
    ↓
Start Daily Arena
    ↓
Play Word Duel
    ↓
Server-side score validation
    ↓
Arena Results
```

Additional gameplay, social features, wagers, monetization, and the puzzle pipeline will be added incrementally after the core loop works end-to-end.

---

## 🏆 Hackathon

Rivals is being built for the **RevenueCat Shipaton 2026** hackathon.

See:

```text
docs/Hackathon_Details.pdf
```

for the complete hackathon details and rules.

---

## 🔒 Core Principles

1. The client is not authoritative for competitive game state.
2. Scores are validated server-side.
3. Virtual coin balances are server-authoritative.
4. Wager resolution and payouts are server-authoritative.
5. Only approved puzzles can enter the Daily Arena.
6. Critical coin operations must be protected against duplicate execution.
7. The MVP should remain focused and small enough to ship reliably.
8. Build and validate one complete vertical slice before expanding the app.

---

**App Name:** Rivals
**Subtitle:** Daily Puzzles & Wagers