# AlterN

AlterN is a coding challenge platform inspired by Project Euler.
It now includes a Spring Boot backend plus a built-in frontend split into four clear surfaces: a landing page, a dedicated arena workspace, a separate continuum surface for journey/community flows, and a dedicated sanctum for admin authoring.

## Features

- Built-in landing page at `/`
- Dedicated solve workspace at `/arena.html`
- Separate journey/community surface at `/continuum.html`
- Dedicated admin authoring surface at `/sanctum.html`
- JWT auth with register/login flow
- Seeded `demo` and `admin` accounts for local development
- Admin authoring console in the built-in Sanctum UI
- Flyway-managed schema migrations
- List coding problems
- Get problem by id
- Create new problems (`ADMIN`)
- Update and delete problems (`ADMIN`)
- Problem statements now support `constraints`, `tags`, and structured `examples`
- Problem statements now support `inputFormat`, `outputFormat`, and per-language `starterCodes`
- Problem statements now support locked `editorial` / solution notes
- Problem statements now support staged guidance with `hint` then `editorial`
- Problem-level execution time and memory limits
- Per-user problem progress tracking (`viewerStatus`, solved/attempted state)
- Save-for-later bookmarks with a personal problem queue
- Authenticated user dashboard with global progress, language mix, and recent solved list
- Dashboard now also surfaces pending submission queue state for async judging
- Dashboard momentum view with active-day and accepted-streak rhythm
- Computed achievement badges on dashboard and public profiles
- Journey/level track with next milestone goals
- Dashboard continue flow with recent attempted problems and suggested next problem
- Per-problem local draft autosave with language-aware restore inside the built-in editor
- Public global leaderboard plus problem-level best accepted run rankings
- Public user profiles with rank, streak, language mix, and recent solved history
- Problem detail community snapshot with acceptance rate, solver count, and language mix
- Archive-side problem scope filters for `all / remaining / attempted / solved / saved`
- Sidebar discovery facets for difficulty and tags
- Admin catalog health overview plus curation filters for spotting thin problems and weak testcase depth
- Admin authoring priorities card with one-click jumps into examples, hint, editorial, and testcase editors
- Admin authoring priorities now also suggest scaffold snippets and the next weak problem to fix
- Authenticated problem workspace summary with attempt history and last accepted snapshot
- Workspace restore flow for loading the latest or accepted submission back into the editor
- Visible testcase failure diagnostics for the latest failed submission
- Custom input replay flow for running the current editor code without creating a submission
- Submission baseline compare flow for diffing the current editor code against an older submission
- Bulk problem import for admin authoring
- Problem import payloads can include nested visible/hidden testcase sets
- Create submissions (`USER` / `ADMIN`)
- Resubmit an accessible past submission without copy-pasting its code again
- List your own submissions (`ADMIN` can inspect all)
- Get your own submission by id (`ADMIN` can inspect all)
- Real local Java compile/run flow
- Real local Python script execution
- Real local C++ compile/run flow
- Optional Docker sandbox execution path with safe local fallback
- Health endpoint and built-in UI now expose the active runner mode and Docker availability
- Optional async judge mode with queued `PENDING` submissions and client-side polling
- Health endpoint now also exposes judge queue backlog and oldest pending age
- Compile error, runtime error, and time limit exceeded verdicts
- Public vs hidden testcase handling
- Admin-only full testcase visibility endpoint
- Admin testcase update/delete and bulk import flow
- Basic online judge flow with metrics
- Sample data seeding for first run
- Seed catalog is now data-driven from a classpath JSON content pack
- Starter problems now ship with deeper visible/hidden testcase packs instead of minimal single-sample sets, and the built-in pack currently carries 20 problems / 129 testcase rows
- Validation support
- Global exception handling
- Swagger / OpenAPI documentation
- DTO-based API design
- MapStruct-based object mapping

## Tech Stack

- Java 17
- Spring Boot
- Maven
- Lombok
- MapStruct
- Spring Validation
- Spring Security
- JWT (JJWT)
- Springdoc OpenAPI
- H2 for tests

## API Endpoints

### Health
- `GET /api/health`
- `GET /api/health?refresh=true`

### Web UI
- `GET /`
- `GET /arena.html`
- `GET /continuum.html`
- `GET /sanctum.html`

### Auth
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `GET /api/dashboard`
- `GET /api/leaderboard`
- `GET /api/users/{username}/profile`
- `GET /api/admin/catalog/health` (`ADMIN`)

### Problems
- `GET /api/problems`
- `GET /api/problems/{id}`
- `GET /api/problems/{id}/stats`
- `GET /api/problems/{id}/leaderboard`
- `POST /api/problems/{id}/bookmark` (auth required)
- `DELETE /api/problems/{id}/bookmark` (auth required)
- `POST /api/problems` (`ADMIN`)
- `POST /api/problems/bulk` (`ADMIN`)
- `PUT /api/problems/{id}` (`ADMIN`)
- `DELETE /api/problems/{id}` (`ADMIN`)
- `GET /api/problems/{id}/submissions`
- `GET /api/problems/{id}/testcases`

### Submissions
- `GET /api/submissions` (auth required)
- `GET /api/submissions/{id}` (auth required)
- `POST /api/submissions` (auth required)
- `POST /api/submissions/{id}/resubmit` (auth required)
- `GET /api/workspace/problems/{problemId}` (auth required)
- `POST /api/workspace/problems/{problemId}/replay` (auth required)
- `POST /api/workspace/problems/{problemId}/compare` (auth required)

### Test Cases
- `POST /api/problems/{problemId}/testcases` (`ADMIN`)
- `POST /api/problems/{problemId}/testcases/bulk` (`ADMIN`)
- `PUT /api/problems/{problemId}/testcases/{testCaseId}` (`ADMIN`)
- `DELETE /api/problems/{problemId}/testcases/{testCaseId}` (`ADMIN`)
- `GET /api/problems/{problemId}/testcases/admin` (`ADMIN`)

## Swagger

Swagger UI:
```text
http://localhost:8081/swagger
```

Web UI:
```text
http://localhost:8081/
```

Arena:
```text
http://localhost:8081/arena.html
```

Continuum:
```text
http://localhost:8081/continuum.html
```

Sanctum:
```text
http://localhost:8081/sanctum.html
```

Default local accounts:
```text
demo / demo123
admin / admin123
```

Admin web flow:
- Log in as `admin`
- Create a problem from the authoring console
- Fill statement metadata like constraints, input/output format, tags, examples, and starter code payloads
- Add editorial title/content that unlocks after an accepted submission
- Add hint title/content that unlocks after the first submission
- Bulk import multiple problems from JSON, including nested testcase arrays
- Update or delete the selected problem
- Add visible or hidden test cases to the selected problem
- Edit, delete, or bulk import test cases from the same panel
- Inspect the full testcase set from the same panel
- Use the built-in catalog health card to spot problems that still need more hidden cases, examples, hints, or editorials
- Jump from an attention item straight into the matching authoring input without leaving the admin console
- Seed examples, hints, editorials, or testcase batches from scaffold buttons instead of starting every authoring pass from an empty textarea

## Current Runner State

- `JAVA`: real local compile/run pipeline
- `PYTHON`: real local script execution via stdin/stdout
- `CPP`: real local compile/run pipeline
- Docker sandbox path is now available behind `altern.runner.docker.enabled=true`
- Runtime profiles now default to `dev`, and `docker` profile can be used to request sandbox mode without changing base config
- Docker mode now falls back to local runners automatically if the daemon is unavailable
- `/api/health` and the built-in `Execution Runtime` card show whether Docker sandboxing is active or unavailable
- `Execution Runtime` can force a fresh probe and shows when the last runtime check was performed
- Health output now also shows the active/default Spring profile plus requested vs effective runner mode
- Health output now also shows whether judge execution is running in `SYNC` or `ASYNC` mode
- Health output now also includes queue pressure (`IDLE / ACTIVE / BACKLOGGED`) plus oldest pending submission age
- Health output now also lists local language toolchain readiness (`JAVA`, `PYTHON`, `CPP`)
- Submission and replay requests now fail fast with `503` if the selected language runtime is unavailable
- Health output now also summarizes runner readiness as `READY / DEGRADED / BLOCKED`
- Application startup now logs a one-line runner preflight summary with readiness and next action
- Default Docker images are `eclipse-temurin:17-jdk`, `python:3.11-alpine`, and `gcc:13`
- Problems can now define `memoryLimitMb`; Docker mode enforces that runtime memory ceiling when enabled
- Timeouts now surface as `TIME_LIMIT_EXCEEDED`
- Problems can define their own `timeLimitMs`; omitted values default to `5000`
- Problem memory limits default to `256 MB` when omitted
- The built-in seed catalog now includes 20 starter problems with visible and hidden testcase sets
- The starter catalog is loaded from [src/main/resources/catalog/seed-problems.json](/Users/rapperin/Desktop/AlterN/altern/src/main/resources/catalog/seed-problems.json) so expanding content is now a data task instead of a code-only task
- Catalog quality is now guarded by test coverage so each seed problem keeps at least two public and two hidden testcases
- Editorial content is visible to `ADMIN` immediately and unlocks for users after `ACCEPTED`
- Hint content is visible to `ADMIN` immediately and unlocks for users after their first submission
- Problem list and detail responses now include per-user progress when authenticated
- Continuum now carries the per-user dashboard with solved counts, language mix, and recent accepted problems
- Dashboard now surfaces where you left off, recent unsolved attempts, and a suggested next problem
- Dashboard now also shows recent daily activity plus current/best accepted streak
- Problem cards and the built-in editor now expose local per-problem drafts so unfinished work survives problem switches
- Continuum now exposes the public Hall of Fame while the arena still keeps per-problem accepted-run leaderboards
- Hall of Fame and problem leaderboard rows now open a public solver profile inside Continuum
- Dashboard and public profiles now surface computed achievement badges from submission history
- Dashboard and public profiles now also show a computed journey tier plus nearest milestone goals
- Dashboard now adds a journey-focused problem recommendation tied to the current top milestone
- Journey-focused recommendations can also switch the built-in editor to a suggested language for polyglot progress
- Journey-focused recommendations also preload the first public sample into replay when opening a new focus problem
- Several core catalog problems now ship with deeper boundary/stress packs, especially around factorization, triplets, Collatz, triangle divisors, and multiline path sums
- Warm-up, prime-sum, coin-change, and double-base palindrome problems now also include stronger boundary and stress-style testcase coverage
- Problem detail now also shows a community snapshot with public submission and language stats
- Problems can now be saved into a personal queue and revisited from dashboard suggestions or the saved filter
- Problem list can now be narrowed quickly with per-user scope filters and recent solved shortcuts
- Problem discovery can also be narrowed with difficulty and tag facets directly in the sidebar
- Problem workspace endpoint exposes attempt count, failure breakdown, latest submission identity, and latest accepted metrics
- Authenticated users can reload a previous submission into the built-in editor from the workspace panel
- Latest failed submission now exposes visible-case input/expected/actual previews without leaking hidden testcase content
- Built-in editor now supports one-off custom input replay with optional expected-output comparison
- Built-in editor can also compare the current code against a selected older submission on the same input
- When async judge mode is enabled, the built-in UI now keeps the initial `PENDING` submission visible and polls until the final verdict lands
- Dashboard also auto-refreshes while the current user still has queued `PENDING` submissions
- Submission cards can now clone a past run back into the judge with a one-click resubmit action

## Database Notes

- Production/dev schema is managed by Flyway migrations under [src/main/resources/db/migration](/Users/rapperin/Desktop/AlterN/altern/src/main/resources/db/migration)
- Tests run against in-memory H2 with the same migration set

## Runner Profiles

- Default app boot now uses the `dev` profile
- To prefer Docker sandboxing at runtime, start with `--spring.profiles.active=docker`
- If Docker is requested but the daemon is unavailable, AlterN falls back to local runners and reports that downgrade through `/api/health`
- To queue submissions in-process instead of judging inline, set `altern.judge.async.enabled=true`
- The `Execution Runtime` card now also shows whether the local Java, Python, and C++ toolchains are ready
- Missing runtimes now include built-in setup hints and a suggested install command in the runtime card and editor note
- Runtime fixes can be copied from the UI and rechecked immediately with the runtime card refresh action
- The editor surface now mirrors runtime guidance with quick actions like switching to a ready language, copying a fix command, and refreshing runtime health
- The editor now also shows a problem-aware recommended language based on your latest attempts, journey focus, and available runtimes
- If the selected problem already has a saved local draft in a ready language, the editor recommendation now prioritizes resuming that draft
- Language recommendation now also blends selected-problem community stats with your own accepted-language trend
- If a runtime is missing, the built-in editor disables that language and prevents submission/replay before work is sent
- The landing hero now shows a runtime preflight banner so environment issues are visible before solving starts
