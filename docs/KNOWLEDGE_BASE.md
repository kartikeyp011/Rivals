# Rivals — Project Knowledge Base & Implementation Changelog

**Document purpose:** Persistent project knowledge base for Rivals.  
**Coverage:** Steps 1–6 completed before Step 7.  
**Project root:** `C:\rivals_2`  
**Status:** Step 6 implementation reported complete and tests passing. Ready for review/commit before Step 7.

---

# 1. Project Architecture

Rivals is structured around:

```text
Mobile App (Expo)
       ↓
FastAPI Backend
       ↓
Supabase
 ├── Auth
 ├── PostgreSQL
 ├── Row Level Security (RLS)
 └── Realtime
```

The backend is responsible for the application/API boundary and server-side game enforcement.

The approved layering is:

```text
Routers
   ↓
Services
   ↓
Repositories
   ↓
PostgreSQL / Supabase
```

The important rule is that routers do not contain database SQL or core business logic, while repositories do not own application/game business rules.

---

# 2. Implementation Order

The project was intentionally divided into these stages:

1. Architecture & requirements document
2. Backend repository structure
3. Supabase project + CLI + migrations
4. Database schema + RLS + seed data
5. Backend API architecture
6. Live multiplayer Arena backend / game loop
7. Custom Arena configuration
8. Arena frontend integration
9. Friends/lobby/invites flow
10. Scoring, timers & unlimited-attempt logic
11. Coins, wagers & other backend systems
12. End-to-end testing & security review
13. Deployment
14. Final documentation / handoff

Steps 1–6 have now been implemented/validated according to the Antigravity work reports.

---

# 3. Step 1 — Architecture & Requirements

## Status

**PASS**

## Final architectural decisions

- Mobile client uses Expo.
- FastAPI is the backend API layer.
- Supabase provides Auth, PostgreSQL, RLS and Realtime.
- The backend validates Supabase JWTs.
- PostgreSQL/RLS remains the authoritative database security boundary.
- Arena and Custom Arena are first-class concepts.
- Game logic is kept server-side rather than trusting the client.
- Realtime is used for multiplayer state propagation.
- The backend architecture must remain separated into routers, services and repositories.

## Security model

The approved model includes:

- Supabase authentication.
- JWT verification in FastAPI.
- PostgreSQL RLS for database-level access control.
- `is_arena_participant()` as a security-definer helper for participant access.
- Safe question access through `questions_safe`.
- Clients must not receive `correct_option` before it is appropriate.

---

# 4. Step 2 — Backend Repository Structure

## Status

**PASS**

The backend structure was established around these components:

```text
backend/
└── app/
    ├── core/
    ├── routers/
    ├── schemas/
    ├── services/
    ├── repositories/
    └── ...
```

## Dependency direction

```text
routers → services → repositories → PostgreSQL
```

This keeps API handling, business logic and persistence separated.

## Important implementation pieces

Core infrastructure includes:

- `config.py` — environment/configuration handling
- `db.py` — async PostgreSQL connection/pooling
- `security.py` — JWT/security handling
- `errors.py` — domain/API error handling
- `idempotency.py` — idempotent request processing

Domain components include Arena, Invite, Participant, Round and Attempt schemas/services/repositories.

---

# 5. Step 3 — Supabase + CLI + Migrations

## Status

**PASS**

Supabase local development was configured through the CLI.

The project configuration contains:

```text
project_id = "rivals_2"
```

The migration sequence was established as deterministic, with migrations covering:

```text
001 enums
002 utility functions
003 questions
004 arenas
005 arena rounds
006 arena scores
007 social
008 coins
009 wagers
010 streaks
011 leaderboards
012 views
013 RLS
014 grants
015 realtime
016 idempotency
```

The exact filenames use timestamp-style migration names in the repository.

## Important migration work

### RLS recursion fix

The Step 3C validation process identified and fixed the RLS recursion issue in the participant access path.

### Realtime

Realtime support was explicitly added for the arena system.

### Idempotency

An idempotency table/migration was added for safe repeated API requests.

Migration:

```text
20260909210016_idempotency.sql
```

---

# 6. Step 4 — Database Schema + RLS + Seed Data

## Status

**PASS**

The database foundation includes these major tables:

```text
questions
arenas
arena_invites
arena_participants
arena_rounds
arena_attempts
arena_scores
arena_results
profiles
friends
coin_ledger
wagers
wager_participants
streaks
leaderboards
```

The database also includes supporting views/functions/triggers and constraints.

## Security

RLS is enabled across the relevant application tables.

The intended model is:

```text
Authenticated user
        ↓
Postgres RLS
        ↓
Only rows allowed by policy
```

There are no broad authenticated write policies intended to bypass the server-controlled game flow.

## Question security

A safe question view was established:

```text
questions_safe
```

It prevents `correct_option` from being exposed through normal question/round responses.

This is critical because sending the answer to the client before submission would allow the client to cheat.

## Arena data model

The arena system separates:

- Arena
- Participants
- Rounds
- Attempts
- Scores
- Results
- Invites

This allows the game state to be represented explicitly in the database.

## Seed data

The seed setup contains two questions for local testing.

Test auth users are not inserted directly through SQL because Supabase Auth owns the `auth.users` table.

---

# 7. Step 3C — RLS & Security Regression Validation

## Status

**PASS**

A dedicated validation suite was added under:

```text
test_rls/
```

The regression validation confirmed:

- RLS helper behavior
- Protected question data
- Unauthorized request rejection
- Host authorization
- No answer leakage
- Arena participant visibility
- Realtime behavior

The validation test suite later used by Step 5 contained:

```text
7/7 tests passing
```

---

# 8. Step 5 — Backend API Architecture

## Status

**PASS**

Step 5 implemented the FastAPI backend API layer.

## Core infrastructure

Implemented:

```text
app/core/config.py
app/core/db.py
app/core/security.py
app/core/errors.py
app/core/idempotency.py
```

## API domains

Implemented API handling for:

```text
arenas
invites
participants
rounds
attempts
```

with corresponding schemas, services and repositories.

## Arena API

The Arena API enforces server-side rules such as:

- Arena existence
- Host validation
- Arena state validation
- Participant access
- Safe round/question data
- Closed-arena protection

## Attempt API

The attempt layer validates game-state boundaries rather than trusting the client.

## Idempotency

Requests can use:

```text
Idempotency-Key
```

The server stores/caches the response for repeated requests.

The implementation also checks that a previously used idempotency key is not reused with a different payload.

That condition results in the specified conflict behavior rather than silently accepting a different operation.

## Important Step 5 validation fixes

### Timestamp handling

An incorrect literal:

```text
"now()"
```

was replaced with a Python UTC datetime:

```text
datetime.now(timezone.utc)
```

so PostgreSQL receives the correct timestamp value.

### JSONB handling

`question_options` returned from PostgreSQL through `asyncpg` was explicitly deserialized so API responses contain structured JSON rather than a string representation.

### Answer leakage

`correct_option` is stripped from the externally exposed round/question response.

## Step 5 test result

The validation suite finished at:

```text
7/7 passed
```

---

# 9. Step 6 — Live Multiplayer Arena Game Loop

## Status

**IMPLEMENTED — REPORTED VERIFIED**

Antigravity implemented the initial game-loop/scoring layer.

## Main additions

Created:

```text
score.py
result.py
score_repository.py
result_repository.py
scoring_service.py
results.py
```

and updated:

```text
attempt.py
attempt_repository.py
attempt_service.py
round.py
round_repository.py
arena_service.py
arenas.py
attempts.py
invites.py
main.py
```

---

# 10. Step 6 — Attempt Model

The attempt API/schema was aligned to the database terminology.

The important field is now:

```text
selected_option
```

rather than the earlier:

```text
submitted_answer
```

The attempt also carries:

```text
response_ms
```

The change removes the earlier naming mismatch between API and database.

---

# 11. Step 6 — Scoring Logic

The implemented scoring logic reported by Antigravity is:

## Base score

A correct answer receives:

```text
100 base points
```

## Speed bonus

An additional speed bonus of up to:

```text
50 points
```

is calculated based on elapsed time.

The elapsed time is determined from server-side timestamps rather than trusting a client-provided clock.

Therefore the intended maximum for a correct answer is:

```text
150 points
```

before any later scoring-system modifications.

## Wrong answers

Wrong submissions do not receive the correct-answer score.

The exact final scoring behavior for every possible attempt state should remain documented here if Step 7+ changes it.

---

# 12. Step 6 — Round Advancement

The game loop now includes round advancement logic.

A round can advance when:

1. All participants have reached a terminal submission state, OR
2. The round timer expires.

A background timeout mechanism was added:

```text
schedule_round_timeout
```

The purpose is to prevent the game from becoming permanently stuck when participants do not submit.

---

# 13. Step 6 — Arena Completion

The implementation includes automatic progression toward arena completion and result grading.

The intended lifecycle is approximately:

```text
Create Arena
    ↓
Invite participants
    ↓
Accept invitations
    ↓
Arena becomes active
    ↓
Round starts
    ↓
Participants submit attempts
    ↓
Score attempts
    ↓
Advance round
    ↓
Complete final round
    ↓
Complete arena
    ↓
Generate/fetch results
```

---

# 14. Step 6 — Unlimited Attempts

The attempt repository was changed to support repeated attempts without creating unnecessary database rows.

The implementation uses:

```sql
ON CONFLICT (round_id, user_id) DO UPDATE
```

for the pre-created/in-progress attempt model.

This supports the unlimited-attempt requirement while avoiding uncontrolled database row creation for every retry.

The final scoring/attempt semantics should continue to be treated as server-authoritative.

---

# 15. Step 6 — Idempotency Fix

During Step 6 testing, a serialization error was encountered:

```text
TypeError: Object of type UUID is not JSON serializable
```

This was fixed by serializing Pydantic models in JSON mode before passing them to the idempotency manager.

The important implementation principle is:

```text
Pydantic model
    ↓
JSON-compatible representation
    ↓
Idempotency storage/comparison
```

---

# 16. Step 6 — End-to-End Game Loop Test

A new test file was created:

```text
backend/tests/test_game_loop.py
```

It exercises the multiplayer lifecycle including:

```text
creation
→ invite
→ accept
→ active
→ wrong attempt
→ right attempt
→ advance
→ results
```

Combined with the previous validation suite, Antigravity reported:

```text
8/8 tests passing
```

at the end of Step 6.

The earlier Step 5 validation suite had:

```text
7/7 tests passing
```

The 8/8 result refers to the combined Step 5 + Step 6 test run as reported by Antigravity.

---

# 17. Git / Repository Checkpoints

Important commits reported during the work:

```text
7de7802
feat: Implemented Backend API Architecture
```

and:

```text
26f6b13
docs: add source-of-truth docs and Step 3C RLS validation test suite
```

The accidental file:

```text
docs/New Tab.html
```

was removed from disk.

It was never tracked by Git, so no deletion commit was necessary.

The following mobile files intentionally remained as pre-existing unrelated changes:

```text
mobile/.gitignore
mobile/package-lock.json
mobile/package.json
```

They were not included in the Step 5 cleanup.

---

# 18. Current Known Issues / Decisions to Preserve

## Previously identified Step 5 issues

These were:

1. `AttemptResponse.points_awarded` existed while the DB did not have a corresponding column.
2. `submitted_answer` did not match the DB's `selected_option`.

The second issue was explicitly fixed in Step 6.

The first should be checked against the current Step 6 implementation before treating it as fully resolved.

## Important architectural rule

Do not move authoritative game logic into the Expo client.

The client should request/receive state; the server should decide whether an action is legal and what result it produces.

---

# 19. Current Project State

At the end of Step 6, the project has reported completion of:

```text
Step 1  Architecture & requirements        PASS
Step 2  Backend repository structure       PASS
Step 3  Supabase + migrations              PASS
Step 4  Schema + RLS + seed                 PASS
Step 3C Security regression                PASS
Step 5  Backend API architecture           PASS
Step 6  Live Arena game loop               PASS / IMPLEMENTED
```

The next planned stage is:

```text
Step 7 — Custom Arena configuration
```

However, this knowledge-base document should be saved and committed before proceeding so the project has a durable record of the decisions and changes made.

---

# 20. Verification Checklist Before Step 7

Before moving forward, verify:

- [ ] This document is saved under `C:\rivals_2\docs\`
- [ ] The current Step 6 implementation is committed to Git
- [ ] `git status` is understood and unrelated mobile changes remain untouched
- [ ] `tests/test_validation.py` passes
- [ ] `tests/test_game_loop.py` passes
- [ ] Step 5/6 scoring rules are explicitly preserved
- [ ] Unlimited-attempt behavior is explicitly preserved
- [ ] Round timeout behavior is explicitly preserved
- [ ] Correct-answer leakage remains impossible
- [ ] Idempotency behavior remains intact
- [ ] No Step 1–5 regression has been introduced

Only after these checks should Step 7 begin.

---

# 21. Change Log

## Step 1
- Finalized overall Rivals architecture.
- Defined Arena/Custom Arena concepts.
- Established Supabase + FastAPI + Expo responsibilities.
- Defined server-authoritative security/game boundaries.

## Step 2
- Established backend directory/layer structure.
- Added core, router, service, repository and schema separation.

## Step 3
- Configured Supabase CLI/local project.
- Added ordered migrations.
- Added Realtime support.
- Added idempotency storage.
- Fixed the RLS recursion issue discovered during validation.

## Step 4
- Implemented Arena database schema.
- Implemented social/friends schema.
- Implemented coins/wagers/streaks/leaderboards foundation.
- Added RLS policies.
- Added safe question view.
- Added seed data.
- Added security validation.

## Step 5
- Implemented FastAPI architecture.
- Added configuration/database/security/error infrastructure.
- Added idempotency manager.
- Added Arena/Invite/Participant/Round/Attempt APIs.
- Added repositories and services.
- Fixed timestamp handling.
- Fixed JSONB response handling.
- Fixed idempotency payload enforcement.
- Verified no answer leakage.

## Step 6
- Added scoring/result models and repositories.
- Added scoring service.
- Added game-loop advancement.
- Added round timeout handling.
- Added unlimited-attempt repository behavior.
- Renamed attempt input to `selected_option`.
- Added `response_ms`.
- Fixed UUID JSON serialization for idempotency.
- Added end-to-end multiplayer game-loop tests.
- Verified combined tests at 8/8 passing according to Antigravity.

---

# 22. Knowledge-Base Rule Going Forward

For every future implementation step, update this document with:

1. **What was changed**
2. **Why it was changed**
3. **Exact business logic finalized**
4. **Database/schema changes**
5. **API changes**
6. **Security/RLS implications**
7. **Tests added**
8. **Test results**
9. **Known issues**
10. **Git commit/hash**
11. **Any decision that must not be changed accidentally later**

This document is intended to become the long-term human-readable project history and handoff reference for Rivals.

---

## Step 7 — Custom Arena Configuration

### 1. What Was Implemented
Implemented the Custom Arena Configuration feature (Step 7). The core database foundation (`arenas` table) and schema bindings were already established in Steps 3-6. This step focused on exposing configuration options to the frontend and tightening input validation via Pydantic to ensure robustness.

### 2. Files Changed/Created
- **Modified:** `backend/app/schemas/arena.py` - Added Pydantic `Field` bounds to `ArenaBase` to match the PostgreSQL `CHECK` constraints.
- **Created:** `backend/app/schemas/config.py` - Defined the `ArenaConfigOptions` schema to serve frontend lobby UI limit constraints.
- **Modified:** `backend/app/services/arena_service.py` - Added `get_config_options` method to dynamically query available categories from the database.
- **Modified:** `backend/app/routers/arenas.py` - Added the `GET /api/v1/arenas/config/options` endpoint.
- **Created:** `backend/tests/test_custom_arena.py` - Implemented specific tests to verify Custom Arena creation, limits, and out-of-bound errors.

### 3. Finalized Custom Arena Logic & Rules
- Users can create a custom arena with explicit limits: `max_rounds`, `max_participants`, `time_limit_seconds`, `difficulty`, and `category`.
- If an invalid limit is passed, FastAPI rejects the request with a clean `422 Unprocessable Entity` rather than letting it hit the database and return a `500 Internal Server Error`.
- The database enforces that questions must exist to satisfy the requested configuration. If there are not enough questions for the requested category/difficulty, the server returns a `409 Conflict`.

### 4. Validation Bounds
The following bounds are strictly enforced at the Pydantic API layer and the PostgreSQL schema level:
- **max_participants:** Minimum 2, Maximum 8
- **max_rounds:** Minimum 1, Maximum 20
- **time_limit_seconds:** Minimum 5, Maximum 300
- **difficulty:** 'easy', 'medium', 'hard', 'expert' (Optional)
- **category:** Any active category existing in the `questions` table (Optional)

### 5. API Changes
**New Endpoint:** `GET /api/v1/arenas/config/options`
- **Purpose:** Exposes allowed limits and dynamically fetches available categories.
- **Response Format:**
  ```json
  {
    "max_participants_min": 2,
    "max_participants_max": 8,
    "max_rounds_min": 1,
    "max_rounds_max": 20,
    "time_limit_seconds_min": 5,
    "time_limit_seconds_max": 300,
    "difficulties": ["easy", "medium", "hard", "expert"],
    "categories": ["Science", "History", "..."]
  }
  ```

### 6. Database / Schema Usage
- **NO schema changes were made.** The existing `SUPABASE_DATABASE_FOUNDATION.md` schema is perfectly equipped.
- **Query added:** `SELECT DISTINCT category FROM questions WHERE is_active = true` to populate the `/config/options` categories payload dynamically without hardcoding values in the app logic.

### 7. Security / RLS Considerations
- The new `/config/options` endpoint requires standard `Depends(get_current_user)` authentication.
- No direct user access to the `questions` table is given. The service layer executes the distinct category fetch via a service role query.

### 8. Tests Added and Exact Results
The `backend/tests/test_custom_arena.py` suite was added and verified:
- `test_get_config_options`: PASSED (Returns correct structure and categories array).
- `test_create_custom_arena_valid`: PASSED (Correctly creates custom arenas for valid limits matching available seed data).
- `test_create_custom_arena_invalid_bounds`: PASSED (Returns 422 correctly when limits are exceeded).

**Full regression results:**
- 11/11 tests passed across `test_validation.py`, `test_game_loop.py`, and `test_custom_arena.py`.

### 9. Decisions Made
- **Avoided Database Modification:** Adhered to the `SUPABASE_DATABASE_FOUNDATION.md` constraints exactly as written. Pydantic is now successfully operating as the gatekeeper for these `CHECK` constraints.

### 10. Known Issues / Preservations for Future
- Ensure that the frontend UI actually hits `GET /api/v1/arenas/config/options` before rendering the limits and sliders in the Lobby UI to prevent stale hardcoded values.
- Future steps MUST NOT bypass the `ArenaCreate` Pydantic bounds for internal generation logic unless a separate service-layer method is explicitly written.
