# Rivals — Live Multiplayer & Custom Arena Implementation Plan

## 1. Current Architecture
The current Rivals architecture is divided into four main layers:
- **React Native Frontend:** Handles UI, navigation, local state, and gameplay rendering (Expo SDK 56, Expo Router, TypeScript).
- **FastAPI Backend:** The authoritative game backend responsible for logic, score validation, anti-cheat, and authoritative operations.
- **Supabase:** The primary database handling PostgreSQL, Authentication, Row Level Security (RLS), and Realtime subscriptions.
- **LLM API:** Generates puzzles which are stored in the database after QA.

## 2. Current Arena Architecture
Currently, the Arena consists of sequential screens: `index.tsx`, `word-duel.tsx`, `cipher-break.tsx`, `number-rush.tsx`, and `results.tsx` located in `mobile/src/app/arena/`.
The state is local and in-memory (`mobile/src/state/arenaState.ts`), using hardcoded puzzle data. There is currently no multiplayer synchronization or server-authoritative logic enforced in the client-side gameplay loop.

## 3. Proposed Architecture
The proposed architecture introduces real-time multiplayer functionality and custom matchmaking:
- **FastAPI** will manage match creation, configuration validation, puzzle allocation, attempt validation, and final score calculations.
- **Supabase Realtime** will be used for low-latency synchronization of player presence, progress, and live scores during the match.
- **React Native** will manage the lobby UI, rendering the gameplay, providing a visual timer synced to server timestamps, and publishing/subscribing to Realtime channels.

## 4. Proposed User Flows
**Flow 1: Creating a Custom Arena**
1. User navigates to "Custom Arena" / "Play with Friends".
2. User configures the match (number of rounds, difficulty).
3. User creates the match lobby and invites friends.
4. Friends accept invites and join the lobby.
5. Creator starts the match.
6. Players are transitioned to the gameplay screen.

**Flow 2: Gameplay**
1. Players see a global timer counting down.
2. Players solve puzzles independently.
3. Players can make unlimited attempts; incorrect attempts are rejected, correct attempts progress them to the next round.
4. Real-time updates show opponent progress (e.g., "Friend is on Round 2", live score).
5. Once the time limit is reached or all puzzles are solved, the match concludes.
6. Players are transitioned to the Results screen.

## 5. Proposed Arena State Model
The frontend state will shift from being entirely local/in-memory to being a local reflection of the server's authoritative state.
- **Match State:** Lobby, Starting, InProgress, Completed.
- **Participant State:** Joined, Ready, Playing, Finished.
- **Round State:** Current round index, locked/unlocked status.
State updates (like score increments or round progressions) will be fetched via FastAPI and optimistic UI updates can be broadcasted via Supabase Realtime.

## 6. Proposed Database Entities and Relationships
*(Note: Exact schema definitions are an open decision, but the concepts are required)*
- **`friend_matches`**: `id`, `creator_id`, `difficulty`, `num_rounds`, `status` (lobby, active, completed), `start_time`, `end_time`.
- **`friend_match_participants`**: `match_id`, `user_id`, `status`, `final_score`.
- **`friend_match_puzzles`**: Maps specific puzzles to a `match_id` so all players get the exact same sequence.
- **`friend_match_attempts`**: Logs each attempt (correct/incorrect) with timestamps.

## 7. Proposed Backend Responsibilities
- Validate custom match configurations.
- Allocate and securely bind specific puzzles to a match.
- Authoritatively set the `start_time` and `end_time` for the time limit.
- Validate incoming attempts (preventing client-side cheating).
- Calculate scores dynamically based on the time elapsed.
- Transition match state from `active` to `completed`.

## 8. Proposed Frontend Responsibilities
- Provide UI for configuring and creating the lobby.
- Display a visually smooth timer based on the server's `end_time`.
- Handle unlimited attempt submissions without UI blocking (debouncing where necessary).
- Subscribe to Supabase Realtime channels to display opponents' live progress.
- Handle reconnection states by querying the backend for the current match state on app resume.

## 9. Real-time Synchronization Requirements
- **Presence:** Show who is currently in the lobby or active in the match.
- **Progress:** Broadcast when a user successfully completes a round or their score updates.
- **Granularity:** (Open Decision) Whether to broadcast every keystroke or just round completions.

## 10. Match Lifecycle/State Transitions
1. **Lobby:** Creator configures and invites; participants join.
2. **Starting:** Countdown to match start.
3. **In Progress:** Puzzles are unlocked, timer is ticking, attempts are accepted.
4. **Completed:** Timer expires or all players finish. No more attempts accepted. Final scores locked.

## 11. Scoring Model
- Points are awarded for correct answers only.
- The formula will likely consist of `Base Points + Time Bonus`.
- *Open Decision:* Exact formula for time bonus (e.g., linear decay vs tiered points) and whether incorrect attempts deduct points or just consume time.

## 12. Timer Model
- **Server Authoritative:** FastAPI sets `start_time` and `end_time` in the database.
- **Client Visual:** React Native calculates `remaining_time = end_time - current_device_time` (adjusted for server-client clock drift if necessary).
- **Enforcement:** FastAPI rejects any correct answer submitted where `submission_time > end_time + buffer`.

## 13. Unlimited-Attempt Behavior
- Users can submit answers continuously.
- Incorrect answers will return a failure response from FastAPI but will not end the game.
- The user can try again immediately.
- Only a valid response from FastAPI moves the player to the next puzzle.

## 14. Custom Round/Difficulty Configuration
- The lobby UI will provide inputs for `num_rounds` and `difficulty` (Easy, Medium, Hard).
- FastAPI will select puzzles matching the requested difficulty from the `puzzles` table and associate them with the `friend_matches` record.

## 15. Anti-Cheat/Server-Authority Requirements
- The client must never receive the correct answers to the puzzles in the API payload.
- All submissions must be sent to FastAPI for validation.
- FastAPI must strictly enforce the time limit.
- Payouts (if any) or leaderboard updates must rely purely on FastAPI's final score calculation.

## 16. Error/Disconnect/Reconnect Handling
- If a user disconnects and reconnects, the frontend will query FastAPI for active matches.
- If the match is `In Progress`, the frontend will seamlessly resume at the user's current puzzle.
- Supabase Presence will automatically reflect the user as offline/online to other players.

## 17. Which parts belong in React Native
- Custom Arena Lobby UI.
- Configuration selection (rounds, difficulty).
- Realtime pub/sub logic.
- Visual countdown timer.
- Game rendering and local submission debouncing.

## 18. Which parts belong in the backend (FastAPI)
- `POST /api/v1/matches/custom` (Create)
- `POST /api/v1/matches/custom/{id}/join`
- `POST /api/v1/matches/custom/{id}/start`
- `POST /api/v1/matches/custom/{id}/submit`
- Matchmaking validation, puzzle allocation, scoring logic, and authoritative state transitions.

## 19. Which parts belong in Supabase/PostgreSQL
- Persistent schema for custom matches, participants, and attempts.
- RLS policies ensuring users can only submit attempts for matches they are part of.
- Realtime channels tied to the `match_id`.

## 20. Migration Strategy
- Add new tables (`friend_matches`, `friend_match_participants`, `friend_match_puzzles`) without modifying the existing `arenas` table to avoid breaking the existing Daily Arena architecture.
- Deprecate the old local-only `arenaState.ts` incrementally, testing the server-authoritative model in Custom Arenas first before potentially migrating Daily Arenas.

## 21. Recommended Implementation Order
1. **Database:** Create the new tables and RLS policies for custom matches.
2. **Backend:** Implement FastAPI endpoints for match creation, joining, and configuration.
3. **Frontend (Lobby):** Implement UI for creating/joining custom matches.
4. **Backend (Gameplay):** Implement attempt validation, scoring, and timer enforcement.
5. **Frontend (Gameplay):** Connect gameplay screens to FastAPI submission endpoints.
6. **Realtime:** Integrate Supabase Realtime for live opponent progress.

## 22. Files/Modules that will likely need to be created or modified
- `mobile/src/features/arena/` (New structured feature folder)
- `mobile/src/app/arena/...` (Refactor to use new state)
- `mobile/src/services/api/matchApi.ts` (New API client)
- `backend/app/api/custom_matches.py` (New routes)
- `backend/app/services/custom_match_service.py` (New logic)
- `backend/app/models/...` (New DB models)
- `backend/app/schemas/custom_match.py` (New schemas)

## 23. Explicitly identify anything that is currently unknown and should NOT be assumed
- **Scoring Formula:** How exactly are points calculated based on speed?
- **Penalty Logic:** Is there a penalty for wrong answers (e.g., point deduction or temporary lockout)?
- **Realtime Granularity:** Should we broadcast every keystroke, or just when a round is completed?
- **Maximum Configurations:** What is the maximum number of rounds allowed? What are the exact constraints for difficulty balancing?
- **Tie-breaker:** How are ties handled if final scores are identical?
- **Time Limits:** Is the time limit fixed per round, or is there a global time limit for the entire Arena?

---

### OPEN ARCHITECTURAL DECISIONS

1. **Scoring Formula:** Define the exact formula for base points and the time-based bonus.
2. **Incorrect Attempt Penalty:** Decide if wrong answers apply a time penalty, point penalty, or simply consume the clock.
3. **Time Limit Structure:** Decide if the time limit applies per-puzzle or globally to the entire Arena match.
4. **Realtime Granularity:** Decide what specific actions trigger a broadcast to opponents (e.g., typing vs. submitting vs. solving).
5. **Configuration Limits:** Define the min/max limits for custom round quantities.
6. **Puzzle Depletion:** Decide what happens if the backend does not have enough unused QA-approved puzzles of the requested difficulty to fulfill the custom arena request.
7. **Daily vs Custom Separation:** Confirm if Daily Arenas and Custom Arenas should share the exact same underlying DB tables (`arenas` vs `friend_matches`), or remain separated.
8. **Tie-Breaking:** Define how ties are resolved (e.g., who finished faster overall).
