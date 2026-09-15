# Production Readiness Audit & Mock Data Inventory

## Executive Summary

Rivals has successfully transitioned core identity features (Auth, Profiles, Leaderboards, Friends) to a production-ready state backed by Supabase and FastAPI. However, **core gameplay economy and progression systems are completely simulated on the client**. The backend possesses robust implementations for Coins, Streaks, and Wagers, but the Expo frontend is completely decoupled from them, relying instead on volatile local memory state (`state/*.ts`). Furthermore, the "Daily Arena" featured on the Home screen is a facade that routes to Custom Arenas.

Total mock/placeholder findings: **7**
Production-critical blockers: **4**

---

## 1. Feature-by-Feature Status

| Feature | Status | Notes |
| :--- | :--- | :--- |
| Authentication | **REAL** | Google and Apple are real. |
| Profile | **REAL** | Fully integrated with DB and RLS. |
| Leaderboards | **REAL** | Fully integrated. Mock data was removed. |
| Friends | **REAL** | Fully integrated. |
| Custom Arena | **REAL** | Uses real backend endpoints (`arenas.py`, `attempts.py`). |
| Puzzles/Questions | **REAL** (Incomplete) | Backend pulls from real 300+ DB question bank, but only accessible via Custom Arena. |
| Coins | **LOCAL-ONLY** | Purely local `coinState.ts`. Backend `coins.py` exists but is ignored. |
| Wagers | **LOCAL-ONLY** | Purely local `wagerState.ts`. Uses `Math.random()`. Backend `wagers.py` ignored. |
| Streaks | **LOCAL-ONLY** | Purely local `streakState.ts`. Backend `streaks.py` ignored. |
| Daily Arena | **PLACEHOLDER UI** | Home screen "Play Now" routes to Custom Arenas. Mock UI `word-duel.tsx` etc. exist but are orphaned. |
| Notifications | **PLACEHOLDER UI** | Local polling for invites. No push integration. |
| RevenueCat | **MISSING** | No subscription logic exists. |

---

## 2. Mock Data Inventory & Data Source Trace

| Feature / UI element | File | Exact mock behavior | Current Source | Production Replacement Needed | Risk |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Coins (Balance)** | `coinState.ts`, `(tabs)/index.tsx` | Balance is stored in an in-memory variable initialized to 100. Disappears on app restart. | Local JS memory | Call `GET /coins/balance` | **P0** |
| **Streaks** | `streakState.ts`, `(tabs)/index.tsx` | Increments based on local device date string. Lost on restart. | Local JS memory | Call `GET /api/v1/streaks/me` | **P0** |
| **Wagers** | `wagerState.ts`, `wagers/*.tsx` | Wagers created and escrowed locally. Outcome decided by `mockResolveWager` (`Math.random()`). | Local JS memory | Replace with calls to `POST /wagers` etc. | **P0** |
| **Daily Arena Button** | `(tabs)/index.tsx` | Hardcoded text "Word Duel • Cipher Break...". Routes to `/arena` (Custom Arenas list). | Hardcoded UI | Implement actual Daily Arena flow. | **P1** |
| **Apple Login** | `useAppleAuth.ts` | Real OAuth via Supabase ASWebAuthenticationSession. | Supabase Auth | Implemented via Supabase Option A. | **Resolved** |
| **Rank Badges (Home)**| `(tabs)/index.tsx` | Displays `--` for Friends Rank and Global Rank. | Hardcoded string | Fetch rank from `getUserRank` equivalent. | **P2** |
| **My Arenas API URL** | `arena/index.tsx` | `API_BASE_URL` hardcoded to `http://127.0.0.1:8000`. | Local static string| Use `process.env.EXPO_PUBLIC_API_URL`. | **P0** |

---

## 3. Client-Authority Security Audit

Currently, the client holds absolute authority over **the entire game economy**.

1. **Coins:** The client mints coins (`rewardArenaCoins`) and spends them locally. **Fix:** Frontend must exclusively read from `/coins/balance` and rely on backend endpoints (like Wagers and Arena completion) to mutate the DB ledgers securely.
2. **Wagers:** The client escrows coins and resolves outcomes. **Fix:** Use the existing robust `wager_service.py` which uses Postgres `FOR UPDATE` row locks, correct tie-breaker logic, and transactional ledgers.
3. **Streaks:** The client decides if a user played today. **Fix:** Use the backend `update_streak` logic tied to server timestamps.
4. **Arena Puzzles:** Secure! The backend correctly verifies answers in `submitAttempt`. The correct answers are NOT sent to the client ahead of time.

---

## 4. Database & Backend Audit

- **Database:** `production_import.sql` successfully seeds 300+ legitimate questions. `seed.sql` only contains 2 dummy questions for local dev, which is safe.
- **Backend (FastAPI):** Surprisingly, the backend is **ahead of the frontend**. The FastAPI routers for `coins.py`, `streaks.py`, and `wagers.py` are fully implemented, secure, and ready for production. 
- **Disconnect:** The React Native frontend is simply ignoring the backend and falling back to its prototyping state files.

---

## 5. Documentation Cross-Check
- `docs/KNOWLEDGE_BASE.md` claims: "Frontend UI for coins, wagers, and balances is completely deferred to a future step to maintain focus on the backend foundation." This is true—the backend foundation *is* built, but the frontend mock state files were never deleted, leading to confusing local-only behavior.

---

## 6. Implementation Plan & Phases

The goal is to sever all ties to local `state/*.ts` files and wire the frontend to the existing backend API, ensuring a server-authoritative production app.

### Phase 1: Client Connectivity & Cleanup (P0 Blockers)
- **Target Files:** `mobile/src/app/arena/index.tsx`, `mobile/src/app/(tabs)/index.tsx`, `auth/index.tsx`
- **Actions:**
  - Remove `127.0.0.1` hardcode in `arena/index.tsx` and use `process.env.EXPO_PUBLIC_API_URL`.
  - Remove `handleAppleMock` or hide Apple Sign-in until natively configured.
  - Delete `mobile/src/app/arena/word-duel.tsx`, `number-rush.tsx`, `cipher-break.tsx` (orphaned prototypes).

### Phase 2: Economy & Progression Integration (Server Authority)
- **Target Files:** `mobile/src/lib/api.ts`, `mobile/src/app/wagers/*.tsx`, `mobile/src/app/(tabs)/index.tsx`, `mobile/src/app/coins/*.tsx`
- **Actions:**
  - Add backend wrappers in `api.ts` for `/coins/balance`, `/api/v1/streaks/me`, and `/wagers`.
  - Delete `mobile/src/state/coinState.ts`, `streakState.ts`, and `wagerState.ts`, plus `arenaState.ts`.
  - Wire Home screen (`index.tsx`) to pull live coins and streaks.
  - Wire Wagers UI (`create.tsx`, `details.tsx`, `index.tsx`) to use the FastAPI endpoints.

### Phase 3: Home Dashboard & Daily Arena UX (P1/P2)
- **Target Files:** `mobile/src/app/(tabs)/index.tsx`
- **Actions:**
  - Update Home screen rank badges to pull the user's actual rank from the new Leaderboards API.
  - Re-label "Today's Arena" to "Custom Arenas" temporarily, OR implement a true Daily Arena endpoint that fetches a global daily UUID.

**Build Requirements:** Phases 1 & 2 require a new EAS APK because they alter core React Native source code and delete local state logic. Proceeding with this plan is necessary before public launch.
