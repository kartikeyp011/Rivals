# Rivals — Technical Implementation Specification

**Version:** MVP
**Status:** Build-ready
**Purpose:** Final technical source of truth for implementation across Lovable, Claude, Cursor, Antigravity, or other AI coding tools.

**Companion documents:**

```text
PRODUCT_VISION.md       → Product decisions and locked rules
PRD.md                  → MVP requirements
SCREEN_FLOW_SPEC.md     → Screens, navigation, and user flows
TECHNICAL_SPEC.md       → Technical implementation
```

This document does not replace the previous documents. If implementation details conflict with a locked product rule, the locked product rule takes priority.

---

# 1. System Architecture

Rivals uses four main layers:

```text
┌─────────────────────────────────────────────┐
│              React Native App               │
│                                             │
│  UI • Navigation • Local State • Gameplay   │
│  Auth Session • RevenueCat SDK               │
└──────────────────────┬──────────────────────┘
                       │
                       │ HTTPS
                       ▼
┌─────────────────────────────────────────────┐
│               FastAPI Backend               │
│                                             │
│  Game Logic                                  │
│  Score Validation                            │
│  Wagers                                      │
│  Coins                                       │
│  Leaderboards                                │
│  Anti-Cheat                                  │
│  Arena Lifecycle                             │
└───────────────┬─────────────────┬───────────┘
                │                 │
                ▼                 ▼
┌────────────────────────┐  ┌──────────────────┐
│        Supabase        │  │      LLM API     │
│                        │  │                  │
│ Auth                   │  │ Puzzle Generation│
│ PostgreSQL             │  │                  │
│ Realtime               │  └──────────────────┘
│ Row Level Security     │
│ Storage                │
└────────────────────────┘
```

## Responsibility split

### React Native

Responsible for:

* Rendering UI
* Navigation
* Collecting user input
* Displaying gameplay
* Managing authenticated sessions
* Calling backend APIs
* Displaying realtime updates
* RevenueCat client integration

React Native must **not** be trusted for:

* Final score calculation
* Coin balances
* Wager payouts
* Leaderboard placement
* Daily Arena availability
* Subscription entitlement authority

---

### Supabase

Responsible for:

* Authentication
* PostgreSQL database
* Realtime subscriptions
* Row Level Security
* Storage where required
* Persistent application data

Supabase is the primary database.

---

### FastAPI

FastAPI is the authoritative game backend.

Responsible for:

* Arena access validation
* Puzzle delivery authorization
* Attempt validation
* Score calculation
* Anti-cheat checks
* Coin transactions
* Wager lifecycle
* Leaderboard calculations
* Streak processing
* Puzzle pipeline orchestration
* Admin QA actions
* RevenueCat server-side integration where required

---

### LLM API

Responsible only for generating candidate puzzles.

Generated puzzles must never be published directly.

All puzzles follow:

```text
Generation
→ Draft
→ QA Review
→ Approved
→ Published
```

---

# 2. Frontend Architecture

The frontend is a React Native application targeting:

* iOS
* Android

The frontend should be structured by feature rather than by large global component folders.

Recommended structure:

```text
mobile/
│
├── src/
│   ├── app/
│   │   ├── navigation/
│   │   └── providers/
│   │
│   ├── features/
│   │   ├── auth/
│   │   ├── onboarding/
│   │   ├── arena/
│   │   ├── word-duel/
│   │   ├── cipher-break/
│   │   ├── number-rush/
│   │   ├── friends/
│   │   ├── leaderboards/
│   │   ├── challenges/
│   │   ├── coins/
│   │   ├── streaks/
│   │   ├── profile/
│   │   └── subscription/
│   │
│   ├── components/
│   │   ├── ui/
│   │   └── shared/
│   │
│   ├── services/
│   │   ├── api/
│   │   ├── supabase/
│   │   └── revenuecat/
│   │
│   ├── hooks/
│   ├── state/
│   ├── types/
│   ├── utils/
│   └── constants/
│
├── assets/
└── app configuration files
```

## Frontend communication rules

The app communicates with:

### Supabase directly

For:

* Authentication
* Session management
* Realtime subscriptions where permitted

### FastAPI

For all authoritative game operations:

```text
Arena access
Round submission
Score validation
Coin operations
Wager operations
Leaderboard queries
Streak operations
Admin operations
```

The frontend must not directly write sensitive game data.

---

# 3. Authentication Architecture

Supabase Auth is the authentication provider.

Supported MVP providers:

* Email
* Apple
* Google

## Authentication flow

```text
User
↓
Supabase Auth
↓
Session / Access Token
↓
React Native stores authenticated session
↓
FastAPI receives Bearer token
↓
FastAPI validates token
↓
Authenticated user context established
```

FastAPI endpoints requiring authentication must:

1. Require an access token.
2. Validate the token.
3. Resolve the authenticated user ID.
4. Never trust a user ID supplied separately in the request body.

The authenticated token identity is the source of truth.

---

# 4. Database Architecture

PostgreSQL through Supabase is the primary persistent datastore.

## 4.1 Users

```text
users
```

Fields:

```text
id                  UUID PK
avatar_url          TEXT NULL
timezone            TEXT
global_opt_in       BOOLEAN
created_at          TIMESTAMP
updated_at          TIMESTAMP
```

`id` maps to the authenticated Supabase user.

---

## 4.2 Friendships

```text
friendships
```

Fields:

```text
id                  UUID PK
requester_id        UUID FK users
addressee_id        UUID FK users
status              pending | accepted | rejected
created_at          TIMESTAMP
updated_at          TIMESTAMP
```

Rules:

* A user cannot friend themselves.
* Duplicate active friendships must be prevented.
* Wager eligibility requires accepted friendship.
* Friend leaderboard calculations use accepted friendships only.

---

## 4.3 Arenas

```text
arenas
```

Fields:

```text
id                  UUID PK
arena_date          DATE
status              draft | qa | published | active | closed
unlock_at           TIMESTAMP
close_at            TIMESTAMP
created_at          TIMESTAMP
updated_at          TIMESTAMP
```

There must be one published Daily Arena for each valid arena date.

---

## 4.4 Puzzles

```text
puzzles
```

Fields:

```text
id                  UUID PK
arena_id            UUID FK arenas
round_type          word | cipher | number
content_json        JSONB
answer_json         JSONB
difficulty          easy | medium | hard
ai_generated        BOOLEAN
qa_status           draft | pending | approved | rejected
qa_reviewer_id      UUID NULL
rejection_note      TEXT NULL
created_at          TIMESTAMP
updated_at          TIMESTAMP
```

Puzzle answers must never be unnecessarily exposed to the client.

---

## 4.5 Attempts

```text
attempts
```

Fields:

```text
id                  UUID PK
user_id             UUID FK users
arena_id            UUID FK arenas
round_type          word | cipher | number
started_at          TIMESTAMP
submitted_at        TIMESTAMP NULL
duration_ms         INTEGER
submission_json     JSONB
is_correct          BOOLEAN
points_earned       INTEGER
validation_status   pending | valid | invalid
created_at          TIMESTAMP
```

A user should have only one authoritative completed attempt per round per Arena unless a future rule explicitly allows otherwise.

---

## 4.6 Arena Scores

```text
arena_scores
```

Fields:

```text
id                  UUID PK
user_id             UUID FK users
arena_id            UUID FK arenas
total_points        INTEGER
completed_at        TIMESTAMP
validated_at        TIMESTAMP
created_at          TIMESTAMP
```

Constraints:

```text
UNIQUE(user_id, arena_id)
```

This is the authoritative score used by:

* Friends leaderboards
* Global leaderboards
* Wagers

---

## 4.7 Coin Balances

Recommended model:

```text
coin_balances
```

Fields:

```text
user_id             UUID PK FK users
balance             INTEGER
updated_at          TIMESTAMP
```

Balance must never become negative.

---

## 4.8 Coin Transactions

```text
coin_transactions
```

Fields:

```text
id                  UUID PK
user_id             UUID FK users
type                initial
                    earn
                    wager_lock
                    purchase
                    payout
                    refund
amount              INTEGER
reference_type      TEXT
reference_id        UUID NULL
created_at          TIMESTAMP
```

Coin transactions should be append-only.

Do not modify historical transaction records.

---

## 4.9 Wagers

```text
wagers
```

Fields:

```text
id                  UUID PK
creator_id          UUID FK users
arena_id            UUID FK arenas
type                one_vs_one | multi_friend
stake_amount        INTEGER
status              pending
                    active
                    resolving
                    resolved
                    refunded
                    expired
created_at          TIMESTAMP
resolved_at         TIMESTAMP NULL
```

---

## 4.10 Wager Participants

```text
wager_participants
```

Fields:

```text
id                  UUID PK
wager_id            UUID FK wagers
user_id             UUID FK users
status              invited
                    accepted
                    declined
                    forfeited
                    completed
stake_locked         BOOLEAN
final_score          INTEGER NULL
placement            INTEGER NULL
created_at           TIMESTAMP
updated_at           TIMESTAMP
```

Constraints:

```text
UNIQUE(wager_id, user_id)
```

---

## 4.11 Streaks

```text
user_streaks
```

Fields:

```text
user_id                     UUID PK FK users
current_streak              INTEGER
longest_streak              INTEGER
last_completed_arena_date   DATE NULL
free_recovery_available     BOOLEAN
updated_at                  TIMESTAMP
```

---

## 4.12 Subscription State

RevenueCat remains the primary subscription source.

A local cache may be maintained if necessary:

```text
user_entitlements
```

Fields:

```text
user_id             UUID PK FK users
rivalss_plus       BOOLEAN
expires_at           TIMESTAMP NULL
updated_at           TIMESTAMP
```

The local record must not independently grant entitlement without validated subscription information.

---

# 5. Row Level Security

Supabase RLS must protect user-owned data.

Minimum principles:

## Users

Users can update only their own profile.

## Friendships

Users can access friendships where they are:

* Requester
* Addressee

## Attempts

Users can access only their own attempts.

Sensitive answer data must not be exposed.

## Coin balances

Users can read only their own balance.

Clients cannot directly update balances.

## Coin transactions

Users can read only their own transactions.

Clients cannot insert arbitrary transactions.

## Wagers

Users can access wagers in which they are participants.

Clients cannot directly resolve wagers.

## Admin QA

QA actions require server-side authorization.

---

# 6. FastAPI Service Structure

Recommended structure:

```text
backend/
│
├── app/
│   ├── main.py
│   │
│   ├── api/
│   │   ├── auth.py
│   │   ├── arenas.py
│   │   ├── attempts.py
│   │   ├── friends.py
│   │   ├── leaderboards.py
│   │   ├── wagers.py
│   │   ├── coins.py
│   │   ├── streaks.py
│   │   ├── subscriptions.py
│   │   └── admin.py
│   │
│   ├── services/
│   │   ├── arena_service.py
│   │   ├── scoring_service.py
│   │   ├── wager_service.py
│   │   ├── coin_service.py
│   │   ├── leaderboard_service.py
│   │   ├── streak_service.py
│   │   ├── puzzle_service.py
│   │   └── qa_service.py
│   │
│   ├── models/
│   ├── schemas/
│   ├── core/
│   └── dependencies/
│
└── tests/
```

Business logic should live primarily in services, not API route files.

---

# 7. API Contract Principles

All API requests and responses should use structured schemas.

Rules:

* Version the API from the beginning.
* Use `/api/v1/`.
* Return predictable error structures.
* Do not expose internal database models directly.
* Validate all input.
* Use authenticated user identity from the access token.
* Critical write operations must be idempotent where possible.

Base format:

```text
/api/v1/...
```

---

# 8. Core API Endpoints

## 8.1 User

```text
GET    /api/v1/me
PATCH  /api/v1/me
```

---

## 8.2 Daily Arena

```text
GET /api/v1/arena/current
GET /api/v1/arena/current/status
POST /api/v1/arena/current/start
GET /api/v1/arena/current/rounds/{round_type}
POST /api/v1/arena/current/rounds/{round_type}/submit
GET /api/v1/arena/current/results
```

The backend determines:

* Whether the Arena is unlocked
* Whether the user may start
* Whether the user already completed a round
* Whether the Arena is closed

---

## 8.3 Friends

```text
GET    /api/v1/friends
GET    /api/v1/friends/requests
POST   /api/v1/friends/requests
POST   /api/v1/friends/requests/{id}/accept
POST   /api/v1/friends/requests/{id}/reject
DELETE /api/v1/friends/{user_id}
```

---

## 8.4 Leaderboards

```text
GET /api/v1/leaderboards/friends/daily
GET /api/v1/leaderboards/friends/all-time

GET /api/v1/leaderboards/global/daily
GET /api/v1/leaderboards/global/all-time
```

---

## 8.5 Coins

```text
GET /api/v1/coins/balance
GET /api/v1/coins/transactions
```

Clients should not receive generic endpoints for directly changing balances.

---

## 8.6 Wagers

```text
POST /api/v1/wagers
GET  /api/v1/wagers
GET  /api/v1/wagers/{id}

POST /api/v1/wagers/{id}/accept
POST /api/v1/wagers/{id}/decline
```

The client does not control:

* Resolution
* Payout
* Refund calculation

---

## 8.7 Streaks

```text
GET  /api/v1/streak
POST /api/v1/streak/recover
```

---

## 8.8 Subscription

```text
GET /api/v1/subscription/status
```

---

## 8.9 Admin QA

```text
GET  /api/v1/admin/puzzles
GET  /api/v1/admin/puzzles/{id}
POST /api/v1/admin/puzzles/{id}/approve
POST /api/v1/admin/puzzles/{id}/reject
POST /api/v1/admin/puzzles/{id}/test
```

All admin endpoints require reviewer authorization.

---

# 9. Daily Arena Lifecycle

Arena lifecycle:

```text
DRAFT
↓
QA
↓
PUBLISHED
↓
ACTIVE
↓
CLOSED
```

## Draft

Puzzle content exists but is not ready for review.

## QA

Puzzles are awaiting review or correction.

## Published

The Arena is approved and scheduled.

## Active

The Arena is available to users.

## Closed

The Arena can no longer accept gameplay submissions.

---

## Arena access

The backend determines:

```text
Current server time
+
User timezone
+
Arena release rules
=
Arena availability
```

The client must not determine final unlock or closing authority.

---

# 10. Puzzle Generation and QA Pipeline

## Generation

A backend/admin process requests candidate puzzles from the LLM.

The generated puzzle is stored as:

```text
qa_status = draft
```

## Review

A reviewer:

* Views the puzzle
* Tests the puzzle
* Verifies the answer
* Approves or rejects it

## Approval

Approved puzzle:

```text
qa_status = approved
```

Only approved puzzles may be attached to a published Arena.

## Rejection

Rejected puzzle:

```text
qa_status = rejected
```

A short rejection note may be stored.

---

# 11. Gameplay and Score Validation

The server is authoritative.

## Client responsibilities

The client sends:

* User interaction/submission data
* Submission timing
* Relevant attempt information

## Server responsibilities

The server:

1. Validates Arena availability.
2. Validates round state.
3. Validates the submission.
4. Calculates points.
5. Stores the authoritative result.
6. Prevents duplicate completion.
7. Updates the Arena Score after all required rounds complete.

---

## Score flow

```text
User submits answer
↓
FastAPI validates request
↓
Puzzle answer evaluated
↓
Points calculated
↓
Attempt stored
↓
All rounds complete?
├── No → Next round
└── Yes
     ↓
     Combined Arena Score calculated
     ↓
     Arena Score stored
     ↓
     Leaderboards updated
     ↓
     Wager participant score updated
```

---

# 12. Anti-Cheat Rules

The MVP should implement practical server-side protections.

The backend must:

* Validate authenticated identity.
* Validate Arena state.
* Validate round order.
* Prevent arbitrary score submission.
* Prevent duplicate round completion.
* Validate submission timing.
* Reject attempts after Arena closure.
* Calculate authoritative scores server-side.
* Calculate wager outcomes server-side.
* Calculate coin balances server-side.

Suspicious activity may be logged for later review.

Advanced anti-cheat detection is not required for MVP.

---

# 13. Coin Economy

## Initial allocation

On successful account creation:

```text
User created
↓
Coin balance initialized
↓
100 coins allocated
↓
Initial transaction recorded
```

The allocation must be idempotent.

A user must never receive the initial 100 coins multiple times due to retries.

---

## Transaction model

All sensitive coin operations occur server-side.

Examples:

```text
Wager accepted
↓
Verify sufficient balance
↓
Lock/deduct stake
↓
Create transaction record
```

For payout:

```text
Wager resolved
↓
Calculate outcome
↓
Apply payout/refund
↓
Create transaction records
```

Coin balance and transaction history must remain consistent.

---

# 14. Wager Lifecycle

## 14.1 Creation

```text
User selects wager type
↓
Selects stake
↓
Selects accepted friend(s)
↓
Server validates request
↓
Wager created
↓
Participants invited
```

Valid stakes:

```text
10
25
50
```

---

## 14.2 Invitation

Participant status:

```text
invited
```

Invited users have no coins locked yet.

---

## 14.3 Acceptance

```text
Participant accepts
↓
Verify sufficient balance
↓
Lock participant stake
↓
Create wager transaction
↓
Participant status = accepted
```

Declining:

```text
status = declined
```

No coins are deducted.

---

## 14.4 Active wager

A wager becomes active when it has enough accepted participants to satisfy its type.

### 1v1

Requires:

```text
2 accepted participants
```

### Multi-friend

Requires:

```text
3 or more accepted participants
```

If insufficient participants accept before the Arena closes, accepted participants must be refunded and the wager expires.

---

## 14.5 Completion

A participant completing the Arena receives:

```text
final_score = validated Arena Score
status = completed
```

If the Arena closes before an accepted participant completes:

```text
status = forfeited
```

Their locked stake remains part of the wager outcome.

---

## 14.6 Resolution

Resolve when:

```text
All accepted participants have completed
```

OR:

```text
Arena closes
```

Resolution must be idempotent.

Running resolution twice must not issue duplicate payouts.

---

## 14.7 Two-player payout

For two participants:

```text
Total pool = stake × 2
```

Higher validated score:

```text
Receives full pool
```

Lower score:

```text
Receives nothing
```

---

## 14.8 Three-or-more-player payout

For three or more accepted participants:

```text
Total Pool = stake × participant count
```

Second place:

```text
Receives original stake back
```

First place:

```text
Receives remaining pool
```

All lower placements:

```text
Receive nothing
```

---

## 14.9 Tie handling

If a tie affects payout resolution:

* Apply the locked refund rules.
* Refund affected participants where possible.
* If a fair deterministic payout cannot be determined, refund all wager participants.

Tie resolution logic must be deterministic.

---

# 15. Leaderboards

## Friends leaderboard

Data source:

```text
Accepted friendships
+
Validated Arena Scores
```

Required views:

```text
Daily
All-Time
```

The authenticated user's accepted friends define the comparison pool.

---

## Global leaderboard

Data source:

```text
Users with global_opt_in = true
+
Validated Arena Scores
```

Required views:

```text
Daily
All-Time
```

Users who opt out must not appear publicly.

---

## Ranking

Ranking must use consistent server-side rules.

The exact tie ranking behavior must be deterministic.

Examples of possible approaches:

```text
Shared rank
```

or:

```text
Secondary deterministic ordering
```

The implementation must select one consistent rule and apply it everywhere.

---

# 16. Streak Processing

A streak updates only when the full Daily Arena is completed.

Flow:

```text
Arena completed
↓
Determine arena date
↓
Compare with last completed arena date
↓
Update streak
```

Rules:

* Consecutive completion increments streak.
* Missing a day breaks the streak.
* New users receive one free recovery.
* Recovery eligibility is server-authoritative.

---

## Streak recovery

```text
User requests recovery
↓
Server checks eligibility
↓
Recovery available?
├── No → Reject
└── Yes
     ↓
     Restore streak according to locked rule
     ↓
     Mark recovery used
```

---

# 17. Realtime Events

Supabase Realtime may be used for user-visible updates.

Potential MVP subscriptions:

```text
Friend request received
Friend request accepted
Challenge received
Challenge accepted
Challenge resolved
Wager refunded
```

Leaderboard updates do not require realtime if periodic refresh is sufficient.

Realtime should improve responsiveness but must not become the authoritative source of game state.

The API/database remains authoritative.

---

# 18. RevenueCat Integration

RevenueCat handles subscription purchases and entitlement management across:

* iOS
* Android

## Client

The React Native app:

* Initializes RevenueCat
* Displays available offerings
* Starts purchase flow
* Supports restore purchases

## Backend

Backend-protected premium features should verify entitlement state rather than trusting a manually set client boolean.

Relevant MVP benefits:

* Additional streak recovery benefits
* Extra stats/history
* Ad-free entitlement if ads are later introduced

---

# 19. Environment Variables

## Mobile

Example:

```text
SUPABASE_URL
SUPABASE_ANON_KEY

API_BASE_URL

REVENUECAT_IOS_API_KEY
REVENUECAT_ANDROID_API_KEY
```

---

## Backend

Example:

```text
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY

SUPABASE_JWT_SECRET_OR_VALIDATION_CONFIG

LLM_API_KEY

REVENUECAT_SECRET_KEY

ENVIRONMENT
LOG_LEVEL
```

Secrets must never be committed to Git.

Use environment files locally and platform secret management in deployment.

---

# 20. Error Handling

All backend errors should follow a consistent structure.

Example:

```json
{
  "error": {
    "code": "INSUFFICIENT_COINS",
    "message": "You do not have enough coins for this wager."
  }
}
```

Useful error categories include:

```text
UNAUTHORIZED
FORBIDDEN
NOT_FOUND
INVALID_REQUEST
ARENA_NOT_AVAILABLE
ARENA_CLOSED
ROUND_ALREADY_COMPLETED
INVALID_SUBMISSION
INSUFFICIENT_COINS
WAGER_NOT_ELIGIBLE
WAGER_ALREADY_RESOLVED
STREAK_RECOVERY_UNAVAILABLE
SUBSCRIPTION_REQUIRED
```

Frontend behavior should map known backend errors to understandable user messages.

---

# 21. Idempotency Requirements

Critical operations must safely handle retries.

At minimum:

* Initial coin allocation
* Round submission
* Wager acceptance
* Coin locking
* Wager resolution
* Payouts
* Refunds
* Streak recovery

A repeated request must not accidentally:

* Duplicate coins
* Duplicate payouts
* Duplicate attempts
* Duplicate recoveries

---

# 22. Testing Requirements

## Backend

Test:

* Authentication validation
* Arena availability
* Score calculation
* Duplicate attempt prevention
* Coin balance integrity
* Wager creation
* Wager acceptance
* Insufficient balance
* Wager resolution
* Incomplete participants
* Tie handling
* Refunds
* Streak recovery
* Leaderboard eligibility

---

## Frontend

Test:

* Authentication flow
* Onboarding
* Navigation
* Daily Arena flow
* Interrupted gameplay
* Friend requests
* Leaderboards
* Challenge creation
* Challenge acceptance
* Results
* Empty states
* Loading states
* Error states

---

## End-to-End Critical Flows

Must work completely:

```text
Sign Up
→ Receive 100 Coins
→ Complete Daily Arena
→ Receive Validated Score
→ Appear on Friends Rankings
```

```text
Add Friend
→ Friend Accepts
→ Both Complete Arena
→ Rankings Compare Correctly
```

```text
Create Wager
→ Participant Accepts
→ Stakes Lock
→ Arena Completed
→ Wager Resolves
→ Correct Payout
```

```text
Miss Arena
→ Streak Breaks
→ Eligible Recovery
→ Recovery Used
→ Streak Restored
```

---

# 23. Repository Strategy

Recommended structure:

```text
rivalss/
│
├── mobile/
│   └── React Native application
│
├── backend/
│   └── FastAPI application
│
├── docs/
│   ├── PRODUCT_VISION.md
│   ├── PRD.md
│   ├── SCREEN_FLOW_SPEC.md
│   └── TECHNICAL_SPEC.md
│
└── README.md
```

The four planning documents should remain in the repository.

Any future AI coding tool should be instructed to read:

```text
docs/PRODUCT_VISION.md
docs/PRD.md
docs/SCREEN_FLOW_SPEC.md
docs/TECHNICAL_SPEC.md
```

before making major architectural changes.

---

# 24. Implementation Order

## Phase 1 — Foundation

```text
Supabase project
↓
Authentication
↓
Database schema
↓
FastAPI skeleton
↓
Authenticated API communication
```

---

## Phase 2 — Core Gameplay

```text
Arena lifecycle
↓
Word Duel
↓
Attempt validation
↓
Score calculation
↓
Arena Results
```

Build one complete working vertical slice before adding complexity.

---

## Phase 3 — Remaining Rounds

```text
Cipher Break
↓
Number Rush
↓
Combined Arena Score
```

---

## Phase 4 — Social

```text
Friend requests
↓
Friend list
↓
Friends leaderboard
↓
Global leaderboard
```

---

## Phase 5 — Economy and Wagers

```text
Coin balances
↓
Transactions
↓
Challenge creation
↓
Acceptance
↓
Stake locking
↓
Resolution
↓
Payouts / refunds
```

---

## Phase 6 — Retention and Monetization

```text
Streaks
↓
Streak recovery
↓
RevenueCat
↓
Rivalss+
```

---

## Phase 7 — Content Pipeline

```text
Puzzle generation
↓
QA queue
↓
Approval workflow
↓
Arena publication
```

---

## Phase 8 — Final Polish

```text
Loading states
Empty states
Error states
Animations
Realtime updates
Performance optimization
Store readiness
```

---

# 25. Final Build Principles

All implementation tools and developers must follow these principles:

1. **The client is not authoritative for competitive state.**
2. **Scores are validated server-side.**
3. **Coins are server-authoritative.**
4. **Wager resolution is server-authoritative.**
5. **RevenueCat controls subscription entitlement.**
6. **Only approved puzzles may be published.**
7. **All critical financial-style virtual coin operations must be idempotent.**
8. **The four project documents are the source of truth before implementation.**
9. **Do not add major features without updating the appropriate project document.**
10. **Build the smallest complete working vertical slice before expanding scope.**

---

# 26. Final Project Document Set

```text
docs/
│
├── PRODUCT_VISION.md
│   What Rivals is and the locked product decisions.
│
├── PRD.md
│   What the MVP must do.
│
├── SCREEN_FLOW_SPEC.md
│   Screens, navigation, states, and user journeys.
│
└── TECHNICAL_SPEC.md
    Architecture and implementation rules.
```