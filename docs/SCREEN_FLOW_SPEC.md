# Rivals — Screen & User Flow Specification

**Version:** MVP  
**Status:** Ready for UI/UX planning and frontend implementation  
**Source of Truth:** `PRODUCT_VISION.md` and `PRD.md`

---

# 1. Purpose

This document defines:

- The app navigation structure
- The screens required for the MVP
- The purpose of each screen
- Key information and actions on each screen
- Where users go after each action
- Important UI states
- Main end-to-end user flows

This document does not define:

- Visual design style
- Color system
- Detailed component specifications
- Database schema
- API contracts
- Backend implementation

---

# 2. App Navigation Structure

The primary authenticated app structure is:

```text
Home
├── Daily Arena
│   ├── Word Duel
│   ├── Cipher Break
│   ├── Number Rush
│   └── Arena Results
│
├── Leaderboards
│   ├── Friends
│   └── Global
│
├── Friends
│   ├── Friend List
│   ├── Friend Requests
│   └── Add Friend
│
├── Challenges
│   ├── Incoming Challenges
│   ├── Outgoing Challenges
│   ├── Create 1v1 Challenge
│   ├── Create Multi-Friend Challenge
│   └── Challenge Details
│
└── Profile
    ├── Coin Activity
    ├── Streak
    ├── Rivalss+
    └── Settings
````

Recommended primary bottom navigation:

```text
[ Home ] [ Leaderboards ] [ Friends ] [ Profile ]
```

Challenges should be accessible from:

* Home
* Daily Arena
* Friends
* Notifications or challenge indicators

Challenges do not require their own permanent bottom-navigation tab.

---

# 3. Screen Inventory

## Authentication and Onboarding

1. Welcome
2. Sign Up / Sign In
3. Authentication Method
4. Profile Setup
5. Starting Coins
6. Tutorial Arena
7. Add Friends Prompt

---

## Core Gameplay

8. Home
9. Arena Pre-Start
10. Word Duel
11. Cipher Break
12. Number Rush
13. Round Transition
14. Arena Results

---

## Social Competition

15. Leaderboards Hub
16. Friends Leaderboard
17. Global Leaderboard

---

## Friends

18. Friends List
19. Friend Requests
20. Add Friend
21. Friend Profile / Comparison

---

## Wagering

22. Challenge Entry
23. Challenge Type Selection
24. Stake Selection
25. Friend Selection
26. Challenge Confirmation
27. Incoming Challenge
28. Challenge Details
29. Challenge Result

---

## Progression and Economy

30. Coin Activity
31. Streak
32. Streak Recovery

---

## Monetization

33. Rivalss+ Paywall

---

## Settings

34. Profile and Settings

---

## Internal Admin

35. Puzzle QA Queue
36. Puzzle Review

---

# 4. Authentication and Onboarding Screens

## 4.1 Welcome

### Purpose

Introduce Rivals and direct the user into authentication.

### Must Show

* Rivals branding
* Short explanation of the Daily Arena
* Primary action to get started
* Sign-in option for existing users

### Actions

```text
Get Started → Sign Up / Sign In
Sign In → Sign Up / Sign In
```

---

## 4.2 Sign Up / Sign In

### Purpose

Allow account creation or login.

### Authentication Methods

* Email
* Apple
* Google

### Actions

```text
Email → Email authentication flow
Apple → Apple authentication
Google → Google authentication
Successful authentication → Profile Setup or Home
```

---

## 4.3 Profile Setup

### Purpose

Collect the minimum profile information required before entering the app.

### Fields

* Display name
* Avatar

### Actions

```text
Continue → Starting Coins
```

---

## 4.4 Starting Coins

### Purpose

Inform new users about their initial virtual coin balance.

### Must Show

* 100 starting coins
* Brief explanation that coins are virtual
* Coins cannot be withdrawn

### Actions

```text
Continue → Tutorial Arena
```

---

## 4.5 Tutorial Arena

### Purpose

Teach the core gameplay loop without affecting competitive rankings or wagers.

### Flow

```text
Tutorial Start
→ Word Duel Sample
→ Cipher Break Sample
→ Number Rush Sample
→ Tutorial Complete
```

### Rules

* Does not affect leaderboards
* Does not affect streaks
* Does not use coins
* Does not create wagers

### Actions

```text
Finish Tutorial → Add Friends Prompt
```

---

## 4.6 Add Friends Prompt

### Purpose

Introduce the social layer without blocking onboarding.

### Actions

```text
Add Friends → Add Friend
Skip → Home
```

Skipping must always be allowed.

---

# 5. Home Screen

## Purpose

The Home screen is the primary daily destination.

It should make the next important action obvious.

---

## Must Show

### Daily Arena

* Current Arena status
* Play or Continue button
* Arena availability status

### User Progress

* Current streak
* Coin balance

### Social Competition

* Quick Friends ranking preview
* Quick Global ranking preview if opted in

### Challenges

* Pending incoming challenges
* Active challenges
* Relevant challenge status

---

## Primary Actions

```text
Play Daily Arena → Arena Pre-Start or current round
Continue Arena → Resume gameplay
View Friends Ranking → Friends Leaderboard
View Global Ranking → Global Leaderboard
View Challenge → Challenge Details
View Coins → Coin Activity
View Streak → Streak Screen
```

---

# 6. Daily Arena Flow

## 6.1 Arena Pre-Start

### Purpose

Prepare the user before gameplay begins.

### Must Show

* Daily Arena identity
* Three-round structure
* Current date or Arena period
* Progress indicator

### Actions

```text
Start Arena → Word Duel
```

If the user already has an unfinished Arena:

```text
Continue Arena → Current unfinished round
```

---

## 6.2 Word Duel

### Purpose

Present and complete the Word Duel puzzle.

### Must Show

* Puzzle
* Answer input or interaction
* Submission action
* Relevant progress state

### Actions

```text
Submit Answer → Server validation → Round Transition
```

---

## 6.3 Cipher Break

### Purpose

Present and complete the Cipher Break puzzle.

### Must Show

* Cipher puzzle
* Required interaction
* Submission action

### Difficulty

The configured Daily Arena difficulty may be:

* Easy
* Medium
* Hard

### Actions

```text
Submit Answer → Server validation → Round Transition
```

---

## 6.4 Number Rush

### Purpose

Present and complete the Number Rush puzzle.

### Must Show

* Number-based puzzle
* Required interaction
* Submission action

### Actions

```text
Submit Answer → Server validation → Round Transition
```

---

## 6.5 Round Transition

### Purpose

Provide a short transition between completed rounds.

### Must Show

* Completed round confirmation
* Next round preview
* Arena progress

### Actions

```text
Continue → Next Round
```

---

## 6.6 Arena Results

### Purpose

Provide the main reward moment after Daily Arena completion.

### Must Show

* Combined validated Arena Score
* Round performance summary
* Current Daily ranking information
* Streak update
* Relevant wager result or active wager status

### Actions

```text
View Friends Ranking → Friends Leaderboard
View Global Ranking → Global Leaderboard
View Challenge Result → Challenge Details
Return Home → Home
```

---

# 7. Leaderboards

## 7.1 Leaderboards Hub

### Purpose

Allow the user to choose between:

* Friends
* Global

### Actions

```text
Friends → Friends Leaderboard
Global → Global Leaderboard
```

---

## 7.2 Friends Leaderboard

### Must Support

* Daily view
* All-Time view

### Must Show

* User's current rank
* Friend rankings
* Score or ranking information
* Empty state when user has no friends

### Actions

```text
Switch Daily / All-Time
Add Friends → Add Friend
Select Friend → Friend Profile / Comparison
```

---

## 7.3 Global Leaderboard

### Must Support

* Daily view
* All-Time view

### Must Show

* User's Global rank if eligible
* Ranked users
* Opt-in status

### States

#### Opted In

Show normal rankings.

#### Not Opted In

Explain that opting in is required to appear publicly.

### Actions

```text
Opt In → Confirm opt-in → Global rankings
Opt Out → Confirm opt-out
Switch Daily / All-Time
```

---

# 8. Friends System

## 8.1 Friends List

### Must Show

* Accepted friends
* Pending request indicator
* Add Friend action

### Actions

```text
Select Friend → Friend Profile / Comparison
Add Friend → Add Friend Screen
Requests → Friend Requests
Challenge Friend → Challenge Entry
```

---

## 8.2 Friend Requests

### Must Show

* Incoming requests
* Relevant requester information

### Actions

```text
Accept → Friendship active
Reject → Request removed
```

---

## 8.3 Add Friend

### Purpose

Allow users to find and send requests to other users.

The exact friend discovery mechanism is not defined in this document.

### Actions

```text
Select User → Send Friend Request
```

---

## 8.4 Friend Profile / Comparison

### Purpose

Provide a focused comparison between the user and an accepted friend.

### May Show

* Current Daily comparison
* All-Time comparison
* Relevant competitive statistics

### Actions

```text
Challenge Friend → Challenge Entry
Back → Previous Screen
```

---

# 9. Wager and Challenge Flow

## 9.1 Challenge Entry

Accessible from:

* Daily Arena
* Friends List
* Friend Profile
* Home if an active challenge shortcut exists

### Action

```text
Challenge Friends → Challenge Type Selection
```

---

## 9.2 Challenge Type Selection

Users choose:

```text
1v1 Challenge
Multi-Friend Challenge
```

### Actions

```text
1v1 → Stake Selection
Multi-Friend → Stake Selection
```

---

## 9.3 Stake Selection

Available options:

* 10 coins
* 25 coins
* 50 coins

The user's available balance must be visible.

### Actions

```text
Select Stake → Friend Selection
```

If the user does not have enough coins:

```text
Show insufficient balance state
```

---

## 9.4 Friend Selection

### 1v1

User selects exactly one accepted friend.

### Multi-Friend

User selects multiple accepted friends.

Only accepted friends may be selected.

### Actions

```text
Continue → Challenge Confirmation
```

---

## 9.5 Challenge Confirmation

### Must Show

* Challenge type
* Selected participant(s)
* Stake per participant
* Expected pool structure
* Daily Arena associated with the challenge

### Actions

```text
Send Challenge → Challenge created
Cancel → Return
```

Creating a challenge does not automatically deduct coins from invitees.

---

## 9.6 Incoming Challenge

The invited user sees:

* Challenger
* Challenge type
* Stake
* Other participants if applicable
* Associated Daily Arena

### Actions

```text
Accept → Stake locks → Active challenge
Decline → No coins deducted
```

---

## 9.7 Challenge Details

### Must Show

* Participants
* Acceptance status
* Stake
* Challenge status
* Completion status
* Resolution status

### Possible States

```text
Pending Invitations
Active
Waiting for Completion
Resolved
Refunded
Expired
```

---

## 9.8 Challenge Result

### Must Show

* Final placement
* Arena Score comparison
* Coins won, lost, returned, or refunded
* Final challenge outcome

### Actions

```text
Return Home → Home
View Leaderboard → Relevant Leaderboard
```

---

# 10. Coin Activity

## Purpose

Show the user how their virtual coin balance changed.

### Must Show

* Current balance
* Relevant transaction history

### Transaction Types

* Initial allocation
* Earning
* Wager
* Purchase
* Payout
* Refund

### Actions

```text
Back → Profile or previous screen
```

---

# 11. Streak Screens

## 11.1 Streak

### Must Show

* Current streak
* Relevant completion status
* Recovery availability

### Actions

```text
Use Recovery → Streak Recovery
```

Only show recovery when eligible.

---

## 11.2 Streak Recovery

### Purpose

Allow an eligible user to restore a streak after missing a Daily Arena.

### Must Show

* Recovery eligibility
* Result of using recovery

### Actions

```text
Use Recovery → Server validation → Updated streak
Cancel → Return
```

---

# 12. Rivalss+ Paywall

## Purpose

Present subscription benefits and purchasing actions.

### Must Show

* Rivalss+ benefits
* Available subscription options
* Restore purchase action

### MVP Benefits

* Additional streak recovery benefits
* Extra stats/history
* Ad-free experience if ads are introduced

### Actions

```text
Subscribe → Store purchase flow
Restore Purchases → RevenueCat restore flow
Close → Previous screen
```

---

# 13. Profile and Settings

## Must Show

* Display name
* Avatar
* Coin balance shortcut
* Streak shortcut
* Rivalss+ status

## Settings Must Support

* Edit display name
* Edit avatar
* Global leaderboard opt-in/out
* Account-related settings
* Sign out

### Actions

```text
Coins → Coin Activity
Streak → Streak Screen
Rivalss+ → Paywall
Global Privacy → Leaderboard visibility setting
Sign Out → Authentication
```

---

# 14. Internal Puzzle QA Screens

## 14.1 Puzzle QA Queue

Restricted to authorized reviewers.

### Must Show

* Pending puzzles
* Puzzle status
* Review priority or relevant queue information

### Actions

```text
Select Puzzle → Puzzle Review
```

---

## 14.2 Puzzle Review

### Must Allow

* View puzzle
* Test puzzle
* Verify answer
* Approve
* Reject
* Add rejection note

### Actions

```text
Approve → Approved state
Reject → Rejection note → Rejected state
```

Only approved puzzles become eligible for Daily Arena publication.

---

# 15. Important UI States

Every relevant screen should support the following states where applicable.

## Loading

Examples:

* Loading Arena
* Loading leaderboard
* Loading friends
* Processing wager
* Validating score

---

## Empty

Examples:

* No friends
* No friend requests
* No active challenges
* No coin transactions
* No Global ranking data available

Each empty state should provide a useful next action where possible.

---

## Error

Examples:

* Network failure
* Score validation failure
* Wager creation failure
* Coin transaction failure
* Friend request failure

Errors should:

* Clearly explain that the requested action did not complete
* Avoid claiming a transaction succeeded if confirmation is missing
* Provide retry where appropriate

---

## Locked or Unavailable

Examples:

* Daily Arena not yet unlocked
* Daily Arena already closed
* Insufficient coins
* Streak recovery unavailable
* Challenge unavailable because the Arena is closed

---

## Completed

Examples:

* Daily Arena completed
* Friend request accepted
* Wager resolved
* Puzzle approved

Completed states should clearly show the resulting outcome.

---

# 16. Main End-to-End Flows

## Flow A — New User to Daily Habit

```text
Welcome
→ Authentication
→ Profile Setup
→ 100 Starting Coins
→ Tutorial Arena
→ Optional Add Friends
→ Home
→ Daily Arena
→ Arena Results
→ Rankings
→ Return Tomorrow
```

---

## Flow B — Daily Gameplay

```text
Home
→ Start Daily Arena
→ Word Duel
→ Round Transition
→ Cipher Break
→ Round Transition
→ Number Rush
→ Score Validation
→ Arena Results
→ Friends / Global Ranking
→ Home
```

---

## Flow C — Social Competition

```text
Home
→ Friends
→ Add Friend
→ Friend Request
→ Accepted
→ Friends Leaderboard
→ Compare Rankings
```

---

## Flow D — 1v1 Wager

```text
Daily Arena or Friend Profile
→ Challenge Friend
→ Select 1v1
→ Select Stake
→ Select Friend
→ Confirm
→ Friend Accepts
→ Stakes Lock
→ Both Complete Arena
→ Server Validates Scores
→ Wager Resolves
→ Result
```

---

## Flow E — Multi-Friend Wager

```text
Daily Arena
→ Challenge Friends
→ Select Multi-Friend
→ Select Stake
→ Select Friends
→ Confirm
→ Invitations Sent
→ Friends Accept
→ Accepted Stakes Lock
→ Participants Complete Arena
→ All Complete or Arena Closes
→ Server Resolves Wager
→ Results
```

---

## Flow F — Streak Recovery

```text
Miss Daily Arena
→ Streak Breaks
→ Recovery Available
→ Use Recovery
→ Server Validation
→ Streak Restored
```

---

## Flow G — Puzzle Publication

```text
AI Generates Puzzle
→ Draft
→ QA Queue
→ Reviewer Tests
→ Approve or Reject
→ Approved
→ Eligible for Daily Arena Publication
```

---

# 17. Frontend Implementation Priorities

The frontend should be built in this order:

## Phase 1 — App Shell

* Authentication screens
* Onboarding
* Primary navigation
* Home
* Profile

---

## Phase 2 — Core Gameplay

* Daily Arena
* Word Duel
* Cipher Break
* Number Rush
* Round transitions
* Arena Results

---

## Phase 3 — Social

* Friends
* Friend requests
* Friends leaderboard
* Global leaderboard

---

## Phase 4 — Wagering

* Challenge creation
* Stake selection
* Friend selection
* Incoming challenges
* Challenge details
* Challenge results

---

## Phase 5 — Progression and Monetization

* Coin activity
* Streak
* Recovery
* Rivalss+ paywall

---

## Phase 6 — Polish

* Loading states
* Empty states
* Error states
* Locked states
* Animations
* Responsive mobile behavior
* Final UX refinement

---

# 18. Final Navigation Summary

```text
AUTHENTICATION
Welcome
└── Sign Up / Sign In

ONBOARDING
Profile Setup
└── Starting Coins
    └── Tutorial Arena
        └── Add Friends Prompt
            └── HOME

MAIN APP
Home
├── Daily Arena
│   ├── Word Duel
│   ├── Cipher Break
│   ├── Number Rush
│   └── Arena Results
│
├── Leaderboards
│   ├── Friends
│   └── Global
│
├── Friends
│   ├── Friend List
│   ├── Requests
│   ├── Add Friend
│   └── Friend Comparison
│
├── Challenges
│   ├── Create
│   ├── Incoming
│   ├── Active
│   └── Results
│
└── Profile
    ├── Coins
    ├── Streak
    ├── Rivalss+
    └── Settings
```

---

**End of Screen & User Flow Specification**

This gives you the next permanent project document. After this, the next step should be the **Technical Implementation Spec**, where we define exactly how the frontend, Supabase, FastAPI, and game logic connect—without yet writing the actual code.