# Rivals — Build-Ready Project Spec

**Status:** Locked for build | RevenueCat Shipaton 2026

---

## 1. Locked Decisions

| Area | Decision |
| --- | --- |
| Platform | React Native (iOS + Android simultaneously) |
| Backend | Supabase (auth, DB, realtime) + custom Python/FastAPI service (game logic, puzzle pipeline, scoring) |
| Social Competition | Friends leaderboard + opt-in global leaderboard |
| Puzzle Authoring | AI-generated + manual QA pass before publish |
| Monetization | RevenueCat-managed subscription + coin economy (defined in §7) |

---

## 2. Product Definition (Recap)

**Name:** Rivals

**Subtitle:** Daily Puzzles & Wagers (iOS allows 30 chars for subtitle)

**Play Store Short Description:** Daily 3-round puzzle arena. Duel friends, wager coins, and climb the leaderboard!

**Core Loop:** One daily Arena → 3 rounds (Word Duel, Cipher Break, Number Rush) → combined Arena Score → compete with friends and on the opt-in global leaderboard.

**Session length target:** Under 5 minutes total.

**Reset cadence:** One new Arena per day, fixed unlock time (user-timezone-aware, server-authoritative).

---

## 3. System Architecture

```text
┌──────────────────────┐
│   React Native App   │  (iOS + Android)
│  - Auth UI           │
│  - Arena/Round UI    │
│  - Friends           │
│  - Leaderboards      │
│  - RevenueCat SDK    │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐        ┌──────────────────────────┐
│      Supabase        │◄──────►│   FastAPI Backend        │
│  - Auth (email/OAuth)│        │  - Puzzle generation     │
│  - Postgres DB       │        │  - Score calc/validation │
│  - Realtime          │        │  - Friend/coin logic     │
│  - Row-level security│        │  - Leaderboard logic     │
└──────────────────────┘        │  - Anti-cheat checks     │
                                │  - Admin QA endpoints    │
                                └─────────────┬────────────┘
                                              │
                                              ▼
                                   ┌───────────────────────┐
                                   │  LLM API (puzzle gen) │
                                   │  + Human QA queue     │
                                   └───────────────────────┘

**Why this split:** Supabase handles auth/DB/realtime out of the box for fast development. FastAPI owns anything that requires server-side trust, including score validation, coin balances, puzzle release timing, leaderboard calculations, and anti-cheat checks.

Client-authoritative scoring or coin logic is not permitted because modified clients must not be able to spoof scores or manipulate balances.

---

## 4. Data Model (Core Tables)

```text
users
  id, avatar, timezone, created_at,
  global_leaderboard_opt_in

friendships
  id, requester_id, addressee_id,
  status (pending/accepted/rejected),
  created_at, updated_at

arenas
  id, date, status (draft/qa/published),
  timezone_release_rules

puzzles
  id, arena_id,
  round_type (word/cipher/number),
  content_json,
  answer_json,
  difficulty,
  ai_generated (bool),
  qa_status,
  qa_reviewer

attempts
  id, user_id, arena_id, round_type,
  start_time, submit_time,
  duration_ms,
  correct,
  points_earned,
  guesses_json

arena_scores
  id, user_id, arena_id,
  total_points,
  rank_global

coin_transactions
  id, user_id,
  type (initial/earn/wager/purchase/payout/refund),
  amount,
  ref_id,
  created_at
```

Friends leaderboard rankings are calculated from accepted friendships and validated Arena Scores.

Global leaderboard rankings are calculated only for users who opt in.

---

## 5. Feature Scope — MVP vs. Later

### MVP (Shipaton submission target)

- Auth:
  - Email sign-in
  - Apple sign-in
  - Google sign-in

- Profile:
  - Display name
  - Avatar

- Daily Arena:
  - 3 rounds
  - Server-timed release
  - Under 5-minute target session

- Word Duel

- Cipher Break

- Number Rush

- Combined Arena Score

- Coin economy:
  - 100 starting coins for every new user
  - Server-authoritative coin balances and transactions

- Friend system:
  - Send friend requests
  - Accept or reject friend requests
  - Manage friend list

- Friend wagering:
  - 1v1 friend challenges
  - Multi-friend challenges
  - Stakes of 10, 25, or 50 virtual coins
  - Challenge invitations and acceptance
  - Coin locking for accepted participants
  - Automatic server-side wager resolution
  - Automatic payouts and refunds based on locked wager rules

- Friends leaderboard:
  - Daily rankings
  - All-Time rankings

- Opt-in Global leaderboard:
  - Daily rankings
  - All-Time rankings
  - Global leaderboard privacy opt-in/out

- Streak system:
  - Daily streak tracking
  - One free streak recovery for new users
  - Locked recovery rules enforced server-side

- RevenueCat subscription paywall

- Puzzle QA queue:
  - AI-generated puzzle review
  - Approve or reject puzzles before publication

- Internal admin QA tool:
  - Functional review and testing interface
  - No advanced visual polish required for MVP

### Explicitly Deferred (Post-MVP)

* User-submitted puzzles
* Additional round types beyond the three core rounds
* Per-user adaptive puzzle difficulty
* Advanced push notification personalization
* Complex streak shields or recovery systems
* Social sharing card generation
* Advanced friend features such as messaging or social feeds
* Advanced leaderboard modes or tournaments
* Private groups

---

## 6. Core User Flows

### Onboarding

Sign up → set display name/avatar → tutorial Arena (sample, no stakes) → optional prompt to add friends → done.

Every new account receives 100 virtual coins.

---

### Daily Play

Push notification at Arena unlock → open app → Round 1: Word Duel → Round 2: Cipher Break → Round 3: Number Rush → Arena Score reveal → score validated server-side → Friends leaderboard updates → Global leaderboard updates if user opted in.

---

### Friend System

Open Friends → search/add friend or send request → recipient accepts/rejects → accepted friend appears in both users' friend lists → both users can compare rankings on the Friends leaderboard.

---

### Global Competition

User opts in to Global leaderboard → completes Daily Arena → score is server-validated → eligible score appears in Daily and All-Time global rankings.

Users can opt out of public leaderboard visibility.

---

## 7. Monetization (RevenueCat-Managed)

| Model        | Mechanic                                                                                                       |
| ------------ | -------------------------------------------------------------------------------------------------------------- |
| Subscription | **Rivalss+** — additional streak recovery benefits, extra stats/history, ad-free experience if ads are added |
| Coin Economy | Virtual coins used within the Rivals economy; no cash value and no cash-out                                 |
| Free Tier    | Full Daily Arena access, Friends leaderboard, and basic Global leaderboard access                              |

RevenueCat handles subscription entitlement logic across iOS and Android.

The core Daily Arena remains free to maximize adoption, repeat usage, and growth.

---

## 8. Closed Decisions

### 1. Wager Structure — LOCKED

#### Wager Types

Rivals supports two wager types:

**1v1 Challenge**
- A user can directly challenge one accepted friend.
- Both players stake the same amount.
- The player with the higher validated Arena Score wins.

**Multi-Friend Challenge**
- A user can invite multiple accepted friends to the same wager.
- All participating players stake the same amount.
- Final payouts follow the payout rules below.

#### Stake Rules

- New users receive 100 starting coins.
- Available wager stakes: 10, 25, or 50 coins.
- All participants in the same wager use the same stake.
- Coins are virtual only, have no cash value, and cannot be withdrawn.

#### Challenge Flow

- A user opens the Daily Arena and selects **Challenge Friends**.
- The user chooses either:
  - 1v1 Challenge, or
  - Multi-Friend Challenge.
- The user selects a stake amount: 10, 25, or 50 coins.
- The user selects the friend or friends to invite.
- Invited friends must accept the challenge to participate.
- Coins are locked only when a player accepts the challenge.
- Declined or ignored invitations do not lock or deduct coins.
- All accepted participants compete using the same Daily Arena.
- Final scores are validated server-side.
- The wager resolves automatically when all accepted participants complete the Arena or when the Arena closes.

#### Payout Rules

**For 2-player wagers:**
- The player with the higher validated Arena Score receives the full pool.
- The other player loses their stake.

**For 3+ player wagers:**
- 1st place receives the remaining pool.
- 2nd place receives their original stake back.
- All players below 2nd lose their stake.

#### Incomplete Participation

- If a player accepts a wager and does not complete the Daily Arena before it closes, the player forfeits their locked stake.
- If an invited player never accepts, no coins are deducted from that player.
- If no invited players accept, no wager is created and no coins are deducted.

#### Tie Handling

- Tied players affected by a payout receive their original stake back.
- If a tie makes the payout ambiguous, all affected participants are refunded.
- If a complete payout cannot be resolved fairly, all participants in that wager are refunded.

#### Server Authority

- Wager creation, acceptance, coin locking, score validation, resolution, and payouts are enforced server-side.
- Clients must never be trusted to calculate or distribute wager payouts.

---

### 2. Streak Mechanic — LOCKED

* Completing the full Daily Arena counts toward the user's streak.
* Missing a day breaks the active streak.
* Every new user receives 1 free streak recovery.
* A streak recovery can restore the streak after a missed day.
* Free users have no additional free recoveries after using their initial recovery.
* Rivalss+ users receive additional streak recovery benefits.
* Recovery eligibility and exact limits are enforced server-side.
* Complex streak shields, insurance systems, and multiple recovery currencies are out of scope for MVP.

---

### 3. Puzzle QA Team — LOCKED

* AI-generated puzzles enter a Draft/QA queue before publication.
* The app owner is the initial primary QA reviewer.
* The system supports adding trusted reviewers later.
* Reviewers can:

  * View pending puzzles
  * Test/verify puzzles
  * Approve puzzles
  * Reject puzzles
  * Leave a short rejection note
* Only approved puzzles can be published into a Daily Arena.
* Reviewer management and advanced QA analytics are out of scope for MVP.
* The internal QA tool only needs to be functional; visual polish is not required.

---

### 4. Leaderboards & Social Competition — LOCKED

Rivals supports two leaderboard levels.

#### Friends Leaderboard

* Users can add and manage friends.
* Users can send friend requests.
* Users can accept or reject friend requests.
* Users can view their rank against accepted friends.
* Rankings include Daily and All-Time views.
* Only accepted friends are included.

#### Global Leaderboard

* A Global leaderboard is available for users who opt in.
* Users can view their Global rank.
* Rankings include Daily and All-Time views.
* Users can opt out of appearing publicly.
* Anti-cheat and score validation remain server-authoritative.

#### Ranking

* The same validated Arena Score is used across Friends and Global leaderboards.
* Leaderboards update after Arena completion and score validation.
* Ranking rules remain consistent across leaderboard types.

#### Groups

* Private groups are not included in the MVP.
* Group-specific competition is removed from the MVP.
* Groups may be reconsidered in a future version only if user demand justifies them.

---

### 5. Cipher Round Difficulty — LOCKED

* Cipher Break uses predefined difficulty tiers:

  * Easy
  * Medium
  * Hard
* Difficulty is determined by the Daily Arena configuration.
* Difficulty is not personalized per user.
* Players competing in the same Daily Arena receive equivalent puzzle difficulty.
* Harder puzzles may offer higher potential scores where appropriate.
* No per-user adaptive difficulty system will be built for the MVP.
* Puzzle difficulty tuning will be refined through testing and user feedback.

---

## 9. Suggested Build Order (Shipaton Timeline)

1. Supabase schema + authentication + FastAPI skeleton
2. Word Duel round and complete Arena attempt flow
3. Friends system:

   * Send requests
   * Accept/reject requests
   * Friend list
4. Friends leaderboard + opt-in Global leaderboard
5. Cipher Break + Number Rush rounds
6. Coin economy and wagering implementation
7. RevenueCat paywall integration
8. Puzzle generation pipeline + QA queue
9. Streak tracking and recovery
10. Polish pass:

    * Animations
    * Arena Score reveal
    * Leaderboard UX
    * Final UI/UX improvements

**One note:** I left wagering in the document because you locked its rules, but the **exact way users initiate a wager now that groups are removed still needs to be defined later**. Everything else is updated to consistently use **Friends + Global**, with groups removed.