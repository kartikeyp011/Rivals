# Rivals — Project Context

# 1. Project Identity

**App Name:** Rivals  
**Subtitle:** Daily Puzzles & Wagers  
**Platform:** iOS + Android  
**Current Frontend:** React Native + Expo SDK 56  
**Hackathon:** RevenueCat Shipaton 2026

Rivals is a competitive daily puzzle app where players complete a fast three-round puzzle arena, compete with friends, wager virtual coins, and climb Friends and Global leaderboards.

**Core loop:**

Daily Arena  
→ 3 puzzle rounds  
→ Combined Arena Score  
→ Compete with friends  
→ Wager virtual coins  
→ Climb leaderboards

Target session length: **under 5 minutes**.

---

# 2. Project Source of Truth

Before making major product, feature, architecture, database, backend, navigation, or UI decisions, read the relevant documents in:

```text
docs/
```

Primary documents:

```text
docs/PRODUCT_VISION.md
docs/PRD.md
docs/SCREEN_FLOW_SPEC.md
docs/TECHNICAL_SPEC.md
```

Use these documents as the project's authoritative source of truth.

Do not invent major requirements when the existing documentation already defines the decision.

If documentation conflicts:

1. Identify the conflict.
2. Do not silently choose one interpretation.
3. Ask the user or explicitly propose the smallest necessary resolution.

---

# 3. Current Repository Structure

```text
Rivals/
│
├── mobile/
│   └── React Native + Expo mobile application
│
├── backend/
│   └── FastAPI backend
│
├── docs/
│   ├── Hackathon_Details.pdf
│   ├── PRODUCT_VISION.md
│   ├── PRD.md
│   ├── PROJECT_CONTEXT.md
│   ├── SCREEN_FLOW_SPEC.md
│   └── TECHNICAL_SPEC.md
│
├── README.md
└── .gitignore
```

---

# 4. Current Implementation Status

## Planning

Planning documentation is complete.

The product vision, MVP requirements, screen flows, and technical direction have already been defined.

## Frontend

A clean Expo project has been created successfully.

Current frontend stack:

* Expo SDK 56
* React Native
* TypeScript
* Expo Router
* React 19

The Android development environment is working.

The Android emulator has successfully launched the Expo project.

The current mobile app is still the default Expo starter project.

No real Rivals UI or gameplay implementation has started yet.

## Backend

The `backend/` directory structure, FastAPI skeleton, Dockerfile, and initial requirements have been established and validated.

Functional endpoints and game logic have not yet been implemented.

## Git

The Expo baseline has been committed and pushed successfully.

Current rule:

**Do not make large uncontrolled changes. Work in small, testable increments and commit known-working checkpoints.**

---

# 5. Locked Product Direction

Rivals is a daily competitive puzzle experience.

The MVP includes:

* User authentication
* Display name
* Avatar
* Daily Arena
* Three puzzle rounds
* Word Duel
* Cipher Break
* Number Rush
* Combined Arena Score
* 100 starting virtual coins
* Coin economy
* Friend requests
* Friend list
* Daily Friends leaderboard
* All-Time Friends leaderboard
* Opt-in Global leaderboard
* Daily Global rankings
* All-Time Global rankings
* Friend challenges
* Virtual coin wagers
* Streak tracking
* Streak recovery rules
* RevenueCat monetization
* Puzzle QA workflow
* Internal admin puzzle review tool

Do not add major features outside the documented MVP without approval.

---

# 6. Core Gameplay Rules

The Daily Arena contains three rounds:

1. Word Duel
2. Cipher Break
3. Number Rush

The player's validated performance is combined into one Arena Score.

That score is used consistently for competitive ranking.

Competitive scoring must not be trusted from the client.

The server is authoritative for:

* Puzzle validation
* Score calculation
* Arena completion validation
* Coin balances
* Wagers
* Payouts
* Leaderboard-relevant results
* Critical streak logic

---

# 7. Virtual Coin Rules

Coins are virtual only.

Coins:

* Have no cash value.
* Cannot be withdrawn.
* Are not redeemable for real money.

Every new user receives:

**100 starting coins**

Available wager stakes:

* 10 coins
* 25 coins
* 50 coins

All participants in the same wager use the same stake.

For a 2-player wager:

* Winner receives the full pool.
* Loser loses their stake.

For a 3+ player wager:

* First place receives the remaining pool.
* Second place receives their original stake back.
* Players below second place lose their stake.

Tie handling must follow the documented rules.

If payout resolution becomes ambiguous, affected participants must be refunded safely.

Critical coin operations must be protected against duplicate execution.

---

# 8. Social Competition

Rivals supports:

## Friends

Users can:

* Send friend requests
* Accept requests
* Reject requests
* Manage accepted friends

Only accepted friends participate in Friends rankings and friend challenges.

## Friends Leaderboard

Supports:

* Daily rankings
* All-Time rankings

## Global Leaderboard

Supports:

* Daily rankings
* All-Time rankings

Global participation is opt-in.

Users must be able to opt out of appearing publicly.

The same validated Arena Score should be used consistently across competitive ranking systems.

Private groups are not part of the MVP.

---

# 9. Challenges and Wagers

Challenges are social competition features.

Users can create:

* 1v1 challenges
* Multi-friend challenges

Challenges may involve a virtual coin stake.

Challenge flows and screens must follow:

```text
docs/SCREEN_FLOW_SPEC.md
```

Do not deduct invitee coins before the invited participant accepts according to the documented challenge rules.

Wager and payout operations must always be server-authoritative.

---

# 10. Streak Rules

Completing the full Daily Arena contributes toward the user's streak.

Missing a day breaks the active streak.

Every new user receives:

**1 free streak recovery**

Free users do not receive additional free recoveries after using the initial recovery.

PulsePlay+/Rivals+ recovery benefits must follow the final product documentation.

Recovery eligibility and limits must be enforced server-side.

Do not create complex streak systems outside the MVP.

---

# 11. Puzzle Rules

The Daily Arena uses three puzzle types:

* Word Duel
* Cipher Break
* Number Rush

Cipher Break uses predefined difficulty tiers:

* Easy
* Medium
* Hard

Difficulty is configured for the Daily Arena.

Do not implement per-user adaptive difficulty for the MVP.

AI-generated puzzles must pass QA before publication.

Only approved puzzles may enter a live Daily Arena.

---

# 12. Technical Architecture Direction

The intended architecture is:

```text
React Native / Expo App
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
        │
        ├── Authentication
        ├── PostgreSQL Database
        ├── Realtime
        ├── Storage
        └── Row-Level Security
```

Additional services:

* RevenueCat for subscriptions and in-app purchases
* LLM API for puzzle generation

The detailed technical implementation must follow:

```text
docs/TECHNICAL_SPEC.md
```

Do not redesign the architecture without explaining the reason and getting approval for major changes.

---

# 13. Frontend Rules

Frontend code lives in:

```text
mobile/
```

The current project uses Expo Router.

Treat:

```text
mobile/src/app/
```

as the application routing/screens area.

Use reusable components where appropriate.

Do not leave large amounts of duplicated UI logic across screens.

Do not mix server-authoritative competitive logic into the client.

The frontend may:

* Display game state
* Collect user input
* Request actions
* Display loading states
* Display results returned by trusted backend services

The frontend must not be the final authority for:

* Scores
* Coin balances
* Wager outcomes
* Payouts
* Competitive ranking results

---

# 14. Backend Rules

Backend code belongs in:

```text
backend/
```

Use FastAPI according to the technical specification.

Backend responsibilities include:

* Authentication-related trusted operations where required
* Puzzle/game logic
* Answer validation
* Score calculation
* Coin transactions
* Wager lifecycle
* Payout resolution
* Leaderboard calculations
* Anti-cheat validation
* Puzzle publishing controls

Avoid building the entire backend at once.

Build and test small vertical slices.

---

# 15. Database and Security Rules

Supabase handles:

* Authentication
* PostgreSQL
* Realtime where appropriate
* Storage
* Row-Level Security

Follow the technical specification for schema design and security boundaries.

Important principles:

1. Never trust client-submitted scores blindly.
2. Never allow direct client manipulation of coin balances.
3. Protect financial-like virtual currency operations against duplicate execution.
4. Validate authorization on sensitive operations.
5. Keep sensitive server logic outside the client.
6. Use Row-Level Security appropriately.
7. Do not expose service-role credentials in the mobile app.

---

# 16. RevenueCat Rules

RevenueCat will manage:

* Subscription entitlements
* In-app purchases
* Cross-platform purchase state where applicable

The core gameplay loop must remain available without requiring payment.

Do not hard-code monetization assumptions that contradict the product documentation.

RevenueCat implementation should be added after the core gameplay flow is working unless the current task explicitly requires it.

---

# 17. Build Strategy

Do not attempt to build the entire Rivals app in one step.

Build incrementally.

Preferred order:

```text
1. Clean frontend structure
        ↓
2. Authentication
        ↓
3. User profile + 100 starting coins
        ↓
4. Home screen
        ↓
5. Daily Arena
        ↓
6. Word Duel
        ↓
7. Backend answer validation
        ↓
8. Score calculation
        ↓
9. Arena Results
```

Only after this first vertical slice works should the project expand into:

* Cipher Break
* Number Rush
* Leaderboards
* Friends
* Challenges
* Wagers
* Streak systems
* RevenueCat
* Puzzle pipeline
* QA tooling

---

# 18. AI Coding Rules

When working on this project:

1. Read the relevant source-of-truth documents before major changes.
2. Inspect existing code before replacing it.
3. Do not rewrite unrelated working code.
4. Prefer small, focused changes.
5. Explain what files will be changed before large changes.
6. Do not silently change locked product decisions.
7. Test after implementation.
8. Fix errors before moving to the next major feature.
9. Keep the project runnable after each milestone.
10. Update documentation only when a real project decision changes.

Before implementing a feature:

* Identify the relevant requirements.
* Identify affected files.
* Check whether backend changes are required.
* Check whether security implications exist.
* Implement the smallest complete version.

---

# 19. Handoff Protocol Between AI Tools

When continuing work in a new AI tool:

1. Open this file first:

```text
docs/PROJECT_CONTEXT.md
```

2. Read the relevant project documents:

```text
docs/PRODUCT_VISION.md
docs/PRD.md
docs/SCREEN_FLOW_SPEC.md
docs/TECHNICAL_SPEC.md
```

3. Inspect the current code before changing anything.

4. Check Git status.

5. Understand the current implementation milestone.

6. Continue only from the current working state.

Do not assume the project is at an earlier or later stage than the code actually shows.

If previous AI instructions conflict with current code or documentation, identify the conflict explicitly.

---

# 20. Required Workflow for Each Implementation Step

For each meaningful feature:

```text
Plan
↓
Inspect existing code
↓
Identify affected files
↓
Implement smallest working version
↓
Run the app
↓
Test the feature
↓
Fix errors
↓
Check git diff
↓
Commit working checkpoint
↓
Push to GitHub
```

Never blindly commit generated or temporary files.

Before committing, check:

```cmd
git status
git diff
```

After committing:

```cmd
git status
```

The working tree should ideally be clean.

---

# 21. Current Development Milestone

**Milestone: Environment and project baseline complete**

Completed:

* Product planning
* PRD
* Screen flow specification
* Technical specification
* Git repository setup
* Android development environment
* Android emulator
* Expo SDK 56 project
* Expo app successfully launched
* Baseline committed and pushed
* Backend repository structure established and validated

Current state:

```text
Default Expo starter app
+
FastAPI backend skeleton
+
Planning documents
+
Working Android development environment
```

Next major milestone:

**Replace the default Expo starter structure with the initial Rivals application foundation, then begin implementing the first complete vertical slice.**

---

# 22. Important Principle

This is the user's first app-development project.

Prefer:

* Clear explanations
* Small steps
* Explicit commands for Windows CMD
* Safe incremental changes
* Working checkpoints
* Minimal unnecessary complexity

Avoid:

* Huge uncontrolled code generation
* Large rewrites without testing
* Unnecessary infrastructure
* Premature optimization
* Overengineering
* Assuming the user understands unexplained development terminology

The goal is not just to produce code.

The goal is to build a working, shippable Rivals app while keeping the project understandable and recoverable across different AI tools.