# Rivals — Backend Integration Contract

**Status:** Locked before backend implementation
**Purpose:** Define the boundary between the existing mobile frontend and the real Supabase + FastAPI backend.

---

# 1. Purpose

The Rivals frontend was built first using local mock state.

The backend must now replace mock data without requiring unnecessary UI rewrites.

This document defines:

* Which frontend data shapes must be supported
* Which systems own each type of data
* Which frontend actions require backend operations
* Which actions must be server-authoritative
* How mock state will be replaced incrementally

The backend architecture is:

```text
React Native / Expo Mobile App
          │
          ├───────────────► Supabase
          │                 - Auth
          │                 - PostgreSQL
          │                 - Realtime
          │
          └───────────────► FastAPI
                            - Game logic
                            - Puzzle validation
                            - Score calculation
                            - Coin logic
                            - Streak logic
                            - Wager resolution
```

---

# 2. Core Integration Rules

## Rule 1 — Frontend screens do not own trusted game state

The mobile app may display:

* Puzzle data
* Scores
* Coin balances
* Streaks
* Wagers

However, the client is not authoritative for:

* Correct answers
* Score calculation
* Coin rewards
* Coin spending
* Streak recovery
* Wager outcomes
* Payouts
* Refunds

These must be validated and finalized server-side.

---

## Rule 2 — All persistent user IDs are UUID strings

The frontend currently represents IDs as:

```typescript
id: string
```

The production backend will use UUID values represented as strings in API responses.

Example:

```text
550e8400-e29b-41d4-a716-446655440000
```

The frontend must not depend on numeric or hardcoded mock IDs such as:

```text
"1"
"2"
"5"
```

---

## Rule 3 — Dates cross the network as ISO strings

Frontend mock state currently uses JavaScript `Date` objects in some places.

Backend responses will return ISO 8601 strings.

Example:

```text
2026-08-27T10:30:00Z
```

The frontend converts strings to `Date` objects only when needed for display.

---

## Rule 4 — Screens should not directly own backend logic

The intended structure is:

```text
Screen
  ↓
Service
  ↓
Supabase or FastAPI
```

Not:

```text
Screen
  ↓
Random database/API calls
```

The service layer will isolate backend implementation from UI components.

---

# 3. Data Ownership

| Domain                    | Source of Truth                 |
| ------------------------- | ------------------------------- |
| Authentication            | Supabase Auth                   |
| User Profile              | Supabase PostgreSQL             |
| Friends                   | Supabase PostgreSQL             |
| Friend Requests           | Supabase PostgreSQL             |
| Global Leaderboard Opt-In | Supabase PostgreSQL             |
| Arena Metadata            | Supabase PostgreSQL             |
| Published Puzzle Content  | FastAPI delivery layer          |
| Puzzle Answers            | FastAPI only                    |
| Answer Validation         | FastAPI                         |
| Score Calculation         | FastAPI                         |
| Puzzle Attempts           | PostgreSQL via FastAPI          |
| Arena Completion          | FastAPI                         |
| Coin Balance              | PostgreSQL                      |
| Coin Transactions         | PostgreSQL ledger               |
| Streak State              | PostgreSQL                      |
| Streak Recovery           | FastAPI                         |
| Leaderboards              | Database-derived/server queried |
| Wager Creation            | FastAPI                         |
| Wager Acceptance          | FastAPI                         |
| Coin Locking              | FastAPI + database transaction  |
| Wager Resolution          | FastAPI                         |
| Payouts/Refunds           | FastAPI + database transaction  |
| Realtime Updates          | Supabase Realtime               |

---

# 4. Frontend Entity Contracts

## 4.1 Searchable User

Current frontend shape:

```typescript
{
  id: string;
  name: string;
  avatar: string;
}
```

Production meaning:

```typescript
interface SearchableUser {
  id: string;
  name: string;
  avatar: string;
}
```

This shape is used for:

* User search
* Adding friends
* Selecting wager participants

---

## 4.2 Friend

Current frontend contract:

```typescript
interface Friend {
  id: string;
  name: string;
  avatar: string;
  status: 'pending' | 'accepted';
}
```

Backend note:

The frontend-facing contract may remain simple, while the database stores the underlying friendship relationship separately.

---

## 4.3 Friend Request

Current frontend contract:

```typescript
interface FriendRequest {
  id: string;
  from: string;
  fromName: string;
  fromAvatar: string;
  status: 'pending' | 'accepted' | 'rejected';
}
```

The backend must support:

```text
pending
accepted
rejected
```

The request ID must be stable and uniquely identify the friendship request.

---

# 5. Arena Contracts

## 5.1 Round Status

```typescript
type RoundStatus =
  | 'pending'
  | 'active'
  | 'completed';
```

---

## 5.2 Round Score

```typescript
interface RoundScore {
  status: RoundStatus;
  points: number;
  isCorrect: boolean;
}
```

---

## 5.3 Arena State

```typescript
interface ArenaState {
  word: RoundScore;
  cipher: RoundScore;
  number: RoundScore;
}
```

The frontend currently expects exactly three rounds:

```text
Word Duel
Cipher Break
Number Rush
```

---

## 5.4 Word Duel

Current frontend mock data includes:

```typescript
correctAnswer: string
scrambled: string
```

The production backend must never expose the authoritative correct answer before submission.

The client receives only safe puzzle content.

Example conceptual payload:

```text
Puzzle ID
Round type
Puzzle content
Display data
Timing/scoring configuration if needed
```

The authoritative answer remains server-side.

---

## 5.5 Cipher Break

Current frontend mock data includes:

```typescript
correctAnswer: string
cipherText: string
```

The production backend must return puzzle content but not the authoritative answer.

---

## 5.6 Number Rush

Current frontend mock data includes:

```typescript
correctAnswer: string
sumTarget: number
productTarget: number
```

The production backend must return:

```text
Puzzle ID
Sum target
Product target
Allowed puzzle data
```

The authoritative answer remains server-side.

---

# 6. Puzzle Submission Contract

The frontend should eventually submit:

```text
Authenticated user
Arena ID
Puzzle/Round ID
Submitted answer
Client timing metadata if required
```

FastAPI will:

```text
Authenticate request
Validate Arena availability
Validate round state
Validate answer
Calculate points
Record attempt
Return official result
```

The frontend must not calculate the final trusted score.

---

# 7. Arena Result Contract

The current results screen receives URL parameters as strings:

```typescript
wordPoints: string
cipherPoints: string
numberPoints: string
wordCorrect: string
cipherCorrect: string
numberCorrect: string
```

Production integration should move toward a single official Arena result object returned by the backend.

Conceptually:

```typescript
{
  arenaId: string;
  wordPoints: number;
  cipherPoints: number;
  numberPoints: number;
  wordCorrect: boolean;
  cipherCorrect: boolean;
  numberCorrect: boolean;
  totalScore: number;
  correctCount: number;
}
```

The frontend may adapt this object into navigation parameters if required by the existing routing structure.

---

# 8. Leaderboard Contracts

## 8.1 Leaderboard Entry

Current frontend contract:

```typescript
interface LeaderboardEntry {
  id: string;
  name: string;
  avatar: string;
  score: number;
  rank: number;
  isFriend: boolean;
  isUser: boolean;
}
```

The backend must provide data sufficient for:

* Daily leaderboard
* All-Time leaderboard
* Friends leaderboard
* Global leaderboard
* Current user's rank

---

## 8.2 Leaderboard Data

Current frontend structure:

```typescript
interface LeaderboardData {
  daily: LeaderboardEntry[];
  allTime: LeaderboardEntry[];
}
```

Supported timeframes:

```text
daily
allTime
```

---

# 9. Coin Contracts

## 9.1 Coin Transaction

Current frontend contract:

```typescript
interface CoinTransaction {
  id: string;
  type:
    | 'initial'
    | 'earn'
    | 'wager'
    | 'payout'
    | 'refund';
  amount: number;
  description: string;
  date: Date;
}
```

Production API representation:

```typescript
interface CoinTransaction {
  id: string;
  type:
    | 'initial'
    | 'earn'
    | 'wager'
    | 'payout'
    | 'refund';
  amount: number;
  description: string;
  date: string;
}
```

`date` will use an ISO timestamp.

---

## 9.2 Coin State

Current frontend contract:

```typescript
interface CoinState {
  balance: number;
  transactions: CoinTransaction[];
}
```

The backend is authoritative for the balance.

The frontend must never independently calculate the permanent balance from local state.

---

## 9.3 Starting Coins

New users receive:

```text
100 starting coins
```

This must be created server-side as an initial transaction.

Example ledger event:

```text
Type: initial
Amount: +100
```

---

# 10. Streak Contract

Current frontend contract:

```typescript
interface StreakState {
  currentStreak: number;
  longestStreak: number;
  lastCompletedDate: string | null;
  freeRecoveryAvailable: boolean;
}
```

The backend is authoritative for:

* Arena completion date
* Current streak
* Longest streak
* Recovery availability
* Recovery consumption

The frontend may display streak data but must not permanently mutate it locally as the source of truth.

---

# 11. Wager Contracts

## 11.1 Wager Participant

Current frontend contract:

```typescript
interface WagerParticipant {
  userId: string;
  name: string;
  avatar: string;
  status:
    | 'invited'
    | 'accepted'
    | 'declined'
    | 'completed'
    | 'forfeited';
  score?: number;
  stakeLocked: boolean;
}
```

---

## 11.2 Wager

Current frontend contract:

```typescript
interface Wager {
  id: string;
  creatorId: string;
  type: '1v1' | 'multi';
  stake: 10 | 25 | 50;
  participants: WagerParticipant[];
  status:
    | 'pending'
    | 'active'
    | 'resolving'
    | 'resolved'
    | 'expired';
  createdAt: Date;
  resolvedAt?: Date;
  winnerId?: string;
}
```

Production network representation uses ISO strings:

```text
createdAt: string
resolvedAt?: string
```

---

## 11.3 Wager Stake Rules

Supported stakes:

```text
10
25
50
```

All participants in a wager use the same stake.

Coin locking and wager resolution must occur server-side.

---

# 12. Required Read Operations

The frontend currently requires these future reads:

## User

```text
Current authenticated user
Current profile
Searchable users
```

## Friends

```text
Friend list
Pending incoming friend requests
Available/searchable users
```

## Arena

```text
Current Daily Arena
Current round
Safe puzzle payload
Current Arena progress
Official Arena result
```

## Leaderboards

```text
Friends Daily
Friends All-Time
Global Daily
Global All-Time
Current user rank
```

## Coins

```text
Current balance
Transaction history
```

## Streak

```text
Current streak
Longest streak
Last completion date
Recovery availability
```

## Wagers

```text
Incoming wagers
Active wagers
Completed wagers
Wager details
```

---

# 13. Required Write Operations

## Authentication

```text
Sign up
Sign in
Sign out
Session restore
```

---

## Profile

```text
Create profile
Update display name
Update avatar
```

---

## Friends

```text
Send friend request
Accept request
Reject request
Remove friend
```

---

## Arena

```text
Start Arena
Start round
Submit answer
Complete Arena
Retrieve official result
```

---

## Coins

The client must request server-side operations rather than directly mutating balance.

Examples:

```text
Award Arena reward
Lock wager stake
Settle payout
Issue refund
```

---

## Streak

```text
Update after official Arena completion
Use recovery
```

Recovery must be validated server-side.

---

## Wagers

```text
Create wager
Accept wager
Decline wager
Forfeit if supported
Resolve wager
```

The frontend must never submit the winner as a trusted result.

---

# 14. Required Realtime Events

The frontend may eventually subscribe to:

```text
Incoming friend request
Friend request accepted
Incoming wager
Wager accepted
Wager declined
Wager resolved
Coin balance changed
Leaderboard relevant score updates
```

Realtime events must update UI state after server/database changes.

---

# 15. Current Mock State Replacement Map

| Current State File    | Real Replacement                                 |
| --------------------- | ------------------------------------------------ |
| `arenaState.ts`       | FastAPI Arena/Game service                       |
| `coinState.ts`        | Supabase data + FastAPI trusted mutations        |
| `friendState.ts`      | Supabase PostgreSQL                              |
| `leaderboardState.ts` | Supabase database queries/RPC or backend service |
| `streakState.ts`      | FastAPI trusted logic + PostgreSQL               |
| `wagerState.ts`       | FastAPI + PostgreSQL                             |

---

# 16. Current Mock Functions and Future Ownership

## Arena

Current functions:

```text
getArenaState()
setRoundCompleted()
resetArenaState()
getTotalScore()
getCorrectCount()
```

Future ownership:

```text
Frontend:
- temporary UI progress

FastAPI:
- trusted completion
- answer validation
- official score
```

---

## Coins

Current functions:

```text
getCoinState()
addCoins()
spendCoins()
rewardArenaCoins()
```

Future ownership:

```text
Backend:
- all permanent balance changes
- transaction creation
- reward calculation
```

---

## Friends

Current functions:

```text
getFriends()
getFriendRequests()
getPendingRequests()
getAcceptedFriends()
getAvailableUsers()
sendFriendRequest()
acceptFriendRequest()
rejectFriendRequest()
removeFriend()
```

Future ownership:

```text
Supabase PostgreSQL
```

---

## Leaderboards

Current functions:

```text
getLeaderboardData()
getFriendsLeaderboard()
getGlobalLeaderboard()
getUserRank()
refreshLeaderboards()
```

Future ownership:

```text
Database-derived leaderboard queries
```

---

## Streaks

Current functions:

```text
getStreakState()
updateStreak()
getRecoveryAvailable()
useRecovery()
```

Future ownership:

```text
FastAPI + PostgreSQL
```

---

## Wagers

Current functions:

```text
getWagers()
getIncomingWagers()
getActiveWagers()
getCompletedWagers()
createWager()
acceptWager()
declineWager()
resolveWager()
mockResolveWager()
```

Future ownership:

```text
FastAPI + transactional PostgreSQL operations
```

---

# 17. Backend Security Boundaries

The following must never be trusted from the mobile app:

```text
Correct puzzle answers
Points awarded
Arena total score
Coin balance
Coin reward amount
Coin deduction amount
Streak eligibility
Recovery eligibility
Wager winner
Wager payout
Refund decision
```

The client may send requests.

The server decides the official result.

---

# 18. Integration Sequence

Mock state will be replaced gradually.

## Milestone 1

```text
Supabase Auth
+
Profiles
```

## Milestone 2

```text
Friends
+
Friend requests
```

## Milestone 3

```text
FastAPI
+
Daily Arena delivery
```

## Milestone 4

```text
Puzzle submission
+
Server validation
+
Official scoring
```

## Milestone 5

```text
Arena completion
+
Coins
+
Streaks
```

## Milestone 6

```text
Leaderboards
```

## Milestone 7

```text
Wagers
+
Realtime
```

## Milestone 8

```text
RevenueCat
```

---

# 19. Definition of Integration Success

A feature is considered integrated only when:

1. Mock data is no longer the source of truth.
2. Data survives app restart.
3. Another user can see relevant shared changes.
4. Unauthorized users cannot modify protected data.
5. Sensitive calculations occur server-side.
6. UI loading and error states are handled.
7. Existing frontend functionality continues to work.

---

# 20. Final Architecture Principle

```text
UI displays state.

Services request state.

Supabase stores identity and relational data.

FastAPI decides trusted game outcomes.

The mobile client never becomes the authority
for scores, coins, streaks, or wager results.
```