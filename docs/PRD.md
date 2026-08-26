# Rivals — Product Requirements Document (PRD)

**Version:** MVP
**Status:** Ready for design and implementation
**Source of Truth:** `PRODUCT_VISION.md`

---

# 1. App Overview

**Rivals** is a daily competitive puzzle game built around one short Daily Arena.

**Subtitle:** Daily Puzzles & Wagers (iOS allows 30 chars for subtitle)

**Play Store Short Description:** Daily 3-round puzzle arena. Duel friends, wager coins, and climb the leaderboard!

Each day, users complete three rounds:

1. **Word Duel**
2. **Cipher Break**
3. **Number Rush**

The user's performance across all three rounds produces a combined **Arena Score**.

Users can then:

* Compare scores with friends
* Compete on an opt-in Global leaderboard
* Build a daily streak
* Use virtual coins
* Challenge friends through coin-based wagers

The target experience is quick, repeatable, competitive, and social.

**Target session length:** Under 5 minutes.

**Core loop:**

```text
New Daily Arena
      ↓
Complete 3 rounds
      ↓
Receive validated Arena Score
      ↓
See rank and results
      ↓
Compete with friends / Global leaderboard
      ↓
Maintain streak
      ↓
Return for tomorrow's Arena
```

---

# 2. Target Users

The MVP is designed for users who:

* Enjoy short daily games and puzzles
* Want a competitive experience without long gaming sessions
* Like comparing performance with friends
* Are motivated by rankings, streaks, and progression
* Want a game they can return to every day
* Prefer quick challenges that can be completed in a few minutes

---

# 3. Core User Problem

Many puzzle and casual game experiences are either:

* Too long for a quick daily habit
* Single-player with limited social competition
* Focused only on one puzzle type
* Missing a strong reason to return every day

Rivals combines multiple short puzzle challenges into one daily competitive experience.

The core problem it solves is:

> Give users a fast, repeatable daily challenge that combines puzzle-solving, competition, friends, rankings, streaks, and virtual stakes.

---

# 4. Core User Journey

## First-Time User

```text
Open Rivals
      ↓
Create account
      ↓
Set display name and avatar
      ↓
Receive 100 starting coins
      ↓
Complete tutorial/sample Arena
      ↓
Optional: add friends
      ↓
Enter Daily Arena
```

---

## Daily User

```text
Daily Arena unlocks
      ↓
Open Rivals
      ↓
Play Word Duel
      ↓
Play Cipher Break
      ↓
Play Number Rush
      ↓
Arena Score calculated and validated
      ↓
Results revealed
      ↓
Friends rank updates
      ↓
Global rank updates if opted in
      ↓
Optional wager resolves
      ↓
Streak progresses
      ↓
Return the next day
```

---

## Social Competition User

```text
Open Friends
      ↓
Send friend request
      ↓
Friend accepts
      ↓
Compare Daily rankings
      ↓
Compare All-Time rankings
      ↓
Optionally challenge friend(s) with coins
```

---

# 5. MVP Features

## 5.1 Authentication

Users must be able to:

* Sign up
* Sign in
* Sign out

Supported methods:

* Email sign-in
* Apple sign-in
* Google sign-in

---

## 5.2 User Profile

Each user has:

* Display name
* Avatar
* Timezone
* Global leaderboard visibility preference

The user must be able to manage their profile.

---

## 5.3 Daily Arena

The Daily Arena is the main product experience.

Requirements:

* One Arena is available per day.
* Each Arena contains three rounds.
* Arena release timing is server-authoritative.
* The system is timezone-aware.
* The target total completion time is under 5 minutes.
* Users receive one combined Arena Score after completing all rounds.

The three MVP rounds are:

* Word Duel
* Cipher Break
* Number Rush

---

## 5.4 Word Duel

Word Duel is one of the three Daily Arena rounds.

Requirements:

* Users receive a puzzle.
* Users submit an answer.
* Performance contributes to the Arena Score.
* The attempt and score are validated server-side.

The exact puzzle implementation and scoring logic are defined during technical implementation.

---

## 5.5 Cipher Break

Cipher Break is one of the three Daily Arena rounds.

Requirements:

* Uses predefined difficulty tiers:

  * Easy
  * Medium
  * Hard
* Difficulty is configured at the Daily Arena level.
* Difficulty is not personalized per user.
* Users competing in the same Arena receive equivalent difficulty.
* Harder puzzles may offer higher potential scores where appropriate.
* Performance contributes to the Arena Score.

---

## 5.6 Number Rush

Number Rush is one of the three Daily Arena rounds.

Requirements:

* Users complete the number-based puzzle.
* Performance contributes to the Arena Score.
* Attempts and scoring are validated server-side.

---

## 5.7 Arena Score

After completing all three rounds:

* Scores are combined into one Arena Score.
* The score is validated server-side.
* The client must not be trusted as the final authority for scoring.
* The validated score is used for Friends and Global rankings.
* The result is revealed to the user after completion.

---

## 5.8 Coin Economy

Each new user receives:

* **100 starting virtual coins**

Coins:

* Are virtual only.
* Have no cash value.
* Cannot be withdrawn.
* Are controlled through server-authoritative balances and transactions.

Coin transaction types include:

* Initial allocation
* Earning
* Wager
* Purchase
* Payout
* Refund

---

## 5.9 Friend System

Users must be able to:

* Send friend requests
* Receive friend requests
* Accept requests
* Reject requests
* Manage their friend list

Only accepted friendships are used for Friends leaderboard rankings and friend wagering.

---

## 5.10 Friend Wagering

Rivals supports two wager types.

### 1v1 Challenge

A user can:

* Select one accepted friend
* Select a stake amount
* Send a challenge

Both participants:

* Stake the same amount
* Compete using the same Daily Arena
* Have scores validated server-side

The higher validated Arena Score wins.

---

### Multi-Friend Challenge

A user can:

* Select multiple accepted friends
* Choose a stake
* Send invitations

Only users who accept become participants.

All participants:

* Use the same stake
* Compete using the same Daily Arena
* Have scores validated server-side

---

### Available Stakes

Users can choose:

* 10 coins
* 25 coins
* 50 coins

All participants in the same wager must use the same stake.

---

### Wager Acceptance

* Invited friends must accept to participate.
* Coins are locked only when a player accepts.
* Declined invitations do not deduct coins.
* Ignored invitations do not deduct coins.
* If nobody accepts, no wager is created.

---

### Wager Resolution

A wager resolves automatically when:

* All accepted participants complete the Daily Arena, or
* The Daily Arena closes

The server is responsible for:

* Validating scores
* Locking coins
* Resolving wagers
* Calculating payouts
* Issuing refunds

---

### Two-Player Payout

For a 1v1 wager:

* The higher validated Arena Score wins.
* The winner receives the full pool.
* The losing player loses their stake.

---

### Three-or-More Player Payout

For a multi-friend wager with three or more participants:

* 1st place receives the remaining pool.
* 2nd place receives their original stake back.
* All players below 2nd lose their stake.

---

### Incomplete Participation

If a player:

* Accepts the wager
* Has their stake locked
* Does not complete the Daily Arena before it closes

They forfeit their stake.

---

### Tie Handling

* Affected tied players receive their original stake back.
* If payout resolution is ambiguous, affected participants are refunded.
* If a complete fair payout cannot be determined, all wager participants are refunded.

---

## 5.11 Friends Leaderboard

The Friends leaderboard shows the user's ranking against accepted friends.

It includes:

### Daily Ranking

Rank users based on their validated score for the current Daily Arena.

### All-Time Ranking

Rank users using the product's consistent All-Time ranking rules.

Only accepted friends are included.

---

## 5.12 Global Leaderboard

The Global leaderboard is available to users who opt in.

Requirements:

* Users can opt in.
* Users can opt out.
* Only eligible opted-in users appear publicly.
* Scores must be server-validated.
* The system must support Daily rankings.
* The system must support All-Time rankings.

Users who opt out should not appear publicly.

---

## 5.13 Streak System

A user's streak represents consecutive Daily Arenas completed.

Rules:

* Completing the full Daily Arena counts toward the streak.
* Missing a day breaks the active streak.
* Every new user receives one free streak recovery.
* A recovery can restore a streak after a missed day.
* Free users receive no additional free recoveries after using the initial one.
* Recovery eligibility is enforced server-side.

Complex streak systems are not part of the MVP.

---

## 5.14 RevenueCat Subscription

Rivals includes a subscription managed through RevenueCat.

The subscription is called:

**Rivalss+**

MVP benefits include:

* Additional streak recovery benefits
* Extra stats/history
* Ad-free experience if ads are introduced

Subscription entitlement logic must be managed consistently across iOS and Android.

---

## 5.15 Puzzle Generation and QA

Puzzles are:

* AI-generated
* Reviewed before publication

Puzzle lifecycle:

```text
AI Generation
      ↓
Draft
      ↓
QA Review
      ↓
Approved or Rejected
      ↓
Published into Daily Arena
```

Only approved puzzles may be published.

---

## 5.16 Internal QA Tool

The internal tool must allow authorized reviewers to:

* View pending puzzles
* Test puzzles
* Verify puzzles
* Approve puzzles
* Reject puzzles
* Leave a short rejection note

The initial primary reviewer is the app owner.

The system should support trusted reviewers later.

Visual polish is not required for the MVP.

---

# 6. Features Explicitly Not Included in MVP

The MVP does not include:

* User-submitted puzzles
* Additional round types
* Per-user adaptive puzzle difficulty
* Advanced push notification personalization
* Complex streak shields
* Multiple recovery currencies
* Streak insurance systems
* Social messaging
* Social feeds
* Advanced friend features
* Advanced leaderboard modes
* Tournaments
* Private groups
* Social sharing card generation

These features must not delay the MVP.

---

# 7. Key Screens

The MVP requires the following screens.

## 1. Authentication

* Sign in
* Sign up
* Email authentication
* Apple authentication
* Google authentication

---

## 2. Onboarding

* Display name setup
* Avatar setup
* Initial coin allocation information
* Tutorial/sample Arena
* Optional add-friends prompt

---

## 3. Home

Primary daily destination.

Should show:

* Current Daily Arena status
* Play/continue button
* Streak status
* Coin balance
* Quick access to rankings

---

## 4. Daily Arena

Shows:

* Current round
* Progress through three rounds
* Relevant puzzle interface
* Submission state

---

## 5. Round Screens

Separate gameplay interfaces for:

* Word Duel
* Cipher Break
* Number Rush

---

## 6. Arena Results

Shows:

* Combined Arena Score
* Round performance
* Daily rank information
* Wager result if applicable
* Updated streak

---

## 7. Friends

Allows users to:

* View friend list
* Send friend requests
* Review incoming requests
* Accept or reject requests

---

## 8. Friends Leaderboard

Shows:

* Daily ranking
* All-Time ranking
* User position relative to friends

---

## 9. Global Leaderboard

Shows:

* Daily ranking
* All-Time ranking
* User's Global position
* Opt-in/out controls

---

## 10. Challenge / Wager

Allows users to:

* Choose 1v1 or multi-friend challenge
* Select friends
* Select stake
* Send challenge
* View pending invitations
* Accept challenges
* View challenge status
* View final resolution

---

## 11. Coin Activity

Shows:

* Current coin balance
* Relevant coin transactions

---

## 12. Streak

Shows:

* Current streak
* Streak status
* Recovery availability

---

## 13. Subscription / Paywall

Shows:

* Rivalss+
* Available subscription benefits
* Purchase/restore actions

---

## 14. Settings / Profile

Allows users to manage:

* Display name
* Avatar
* Timezone-related preferences if exposed
* Global leaderboard opt-in/out
* Account settings

---

## 15. Internal Puzzle QA

Restricted to authorized reviewers.

Allows:

* Puzzle review
* Puzzle testing
* Approval
* Rejection
* Rejection notes

---

# 8. Main User Flows

## Flow 1 — First-Time User

```text
Launch app
→ Sign up
→ Set display name
→ Set avatar
→ Receive 100 coins
→ Tutorial Arena
→ Optional friend prompt
→ Home
```

---

## Flow 2 — Daily Arena

```text
Home
→ Start Daily Arena
→ Word Duel
→ Cipher Break
→ Number Rush
→ Score validation
→ Arena Results
→ Rankings updated
→ Return to Home
```

---

## Flow 3 — Add Friend

```text
Friends
→ Send request
→ Friend receives request
→ Accept
→ Friendship becomes active
→ Rankings become comparable
```

---

## Flow 4 — 1v1 Wager

```text
Daily Arena
→ Challenge Friends
→ Select 1v1
→ Select friend
→ Choose stake
→ Send challenge
→ Friend accepts
→ Both stakes lock
→ Both complete Arena
→ Scores validated
→ Wager resolves
→ Payout issued
```

---

## Flow 5 — Multi-Friend Wager

```text
Daily Arena
→ Challenge Friends
→ Select Multi-Friend
→ Select friends
→ Choose stake
→ Send invitations
→ Friends accept
→ Accepted participants lock stakes
→ Participants complete Arena
→ Wager resolves
→ Payout/refund issued
```

---

## Flow 6 — Global Leaderboard

```text
Leaderboard
→ Choose Global
→ Opt in
→ Complete Arena
→ Score validated
→ Eligible score appears publicly
```

---

## Flow 7 — Streak Recovery

```text
Miss Daily Arena
→ Streak breaks
→ Recovery available?
      ↓
Yes → Use recovery → Streak restored
No → Streak remains broken
```

---

# 9. Functional Requirements

## FR-1: Authentication

The system must support:

* Email authentication
* Apple authentication
* Google authentication

---

## FR-2: Daily Arena Access

The system must:

* Publish one Daily Arena per day.
* Control release timing server-side.
* Prevent clients from independently controlling release availability.

---

## FR-3: Round Completion

Each round must:

* Record user interaction/attempt data.
* Record completion timing where applicable.
* Produce validated performance results.

---

## FR-4: Score Validation

The system must:

* Calculate or validate scores server-side.
* Prevent clients from submitting arbitrary final scores.
* Use validated scores for rankings and wagers.

---

## FR-5: Leaderboards

The system must support:

* Friends Daily rankings
* Friends All-Time rankings
* Global Daily rankings
* Global All-Time rankings

Only opted-in users may appear publicly on the Global leaderboard.

---

## FR-6: Friendships

The system must:

* Support pending friendship requests.
* Require acceptance before friendship becomes active.
* Use only accepted friendships for Friends rankings and wagers.

---

## FR-7: Coin Integrity

The system must:

* Maintain server-authoritative balances.
* Prevent negative balances.
* Prevent clients from directly modifying balances.
* Record relevant transactions.

---

## FR-8: Wagers

The system must:

* Support 1v1 wagers.
* Support multi-friend wagers.
* Support 10, 25, and 50 coin stakes.
* Require participant acceptance.
* Lock coins after acceptance.
* Resolve automatically.
* Handle incomplete participation.
* Handle ties.
* Handle refunds.

---

## FR-9: Streaks

The system must:

* Track consecutive completed Daily Arenas.
* Break streaks after missed days.
* Support one initial free recovery.
* Enforce recovery eligibility server-side.

---

## FR-10: Puzzle Publication

The system must:

* Prevent unapproved puzzles from being published.
* Require QA approval before publication.
* Track approval/rejection state.

---

## FR-11: Subscription

The system must:

* Recognize Rivalss+ entitlements.
* Apply eligible premium benefits.
* Support consistent entitlement handling across iOS and Android.

---

# 10. Important Edge Cases and States

## Daily Arena

* User opens app before Arena unlock.
* User opens app after completing the Arena.
* User leaves during a round.
* App closes during gameplay.
* Network connection is lost.
* Arena closes before a user completes it.

---

## Friend Requests

* User sends duplicate request.
* User receives request from existing friend.
* User attempts to challenge someone who is not an accepted friend.

---

## Wagers

* Invited user declines.
* Invited user ignores challenge.
* No invitee accepts.
* User accepts but does not complete Arena.
* User lacks sufficient coins when accepting.
* All participants finish.
* Arena closes before all participants finish.
* Scores tie.
* Payout cannot be resolved fairly.
* Duplicate payout must be prevented.

---

## Leaderboards

* User opts out after previously appearing globally.
* User has no friends.
* Friend has not completed the Daily Arena.
* Multiple users have identical scores.
* Leaderboard data is temporarily unavailable.

---

## Streaks

* User misses one day.
* User has recovery available.
* User has already used free recovery.
* User attempts recovery outside allowed eligibility.
* User completes Arena around the daily reset boundary.

---

## Coins

* User attempts wager without enough coins.
* Coin transaction fails midway.
* Duplicate transaction request occurs.
* Refund is required after an ambiguous wager result.

---

## Puzzle QA

* Puzzle is rejected.
* Puzzle answer is invalid.
* Puzzle is approved but not yet published.
* No approved puzzle is available for an upcoming Arena.

---

# 11. MVP Success Criteria

The MVP is considered successful when:

### Core Gameplay

* A user can complete all three rounds successfully.
* A valid combined Arena Score is produced.
* Scores cannot be trusted solely from the client.
* Daily Arena release works reliably.

### Social Competition

* Users can add friends.
* Friends can compare Daily and All-Time rankings.
* Opted-in users can appear on the Global leaderboard.
* Users can opt out of public visibility.

### Wagering

* Users can create 1v1 challenges.
* Users can create multi-friend challenges.
* Accepted stakes lock correctly.
* Wagers resolve automatically.
* Payouts and refunds follow locked rules.

### Retention

* Daily streaks work correctly.
* One initial free recovery works correctly.
* Users have a clear reason to return for the next Daily Arena.

### Content Pipeline

* AI-generated puzzles enter QA.
* Reviewers can approve or reject puzzles.
* Only approved puzzles reach publication.

### Monetization

* RevenueCat entitlement logic works across iOS and Android.
* Rivalss+ benefits are applied correctly.

### MVP Readiness

The app should provide a complete end-to-end experience:

```text
Sign Up
→ Onboarding
→ Daily Arena
→ Score Validation
→ Friends / Global Competition
→ Wagering
→ Streak Progression
→ Return Tomorrow
```

The PRD is based on the locked platform, product loop, MVP scope, social competition, wagering, streak, and QA decisions in your Product Vision.