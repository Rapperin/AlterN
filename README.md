# AlterN

AlterN is a coding challenge platform inspired by Project Euler.
It now includes a Spring Boot backend plus a simple built-in frontend where you can browse problems, write code, and submit solutions.

## Features

- Built-in web interface at `/`
- JWT auth with register/login flow
- Seeded `demo` and `admin` accounts for local development
- Admin authoring console in the built-in web UI
- Flyway-managed schema migrations
- List coding problems
- Get problem by id
- Create new problems (`ADMIN`)
- Update and delete problems (`ADMIN`)
- Problem statements now support `constraints`, `tags`, and structured `examples`
- Problem statements now support `inputFormat`, `outputFormat`, and per-language `starterCodes`
- Problem statements now support locked `editorial` / solution notes
- Problem statements now support staged guidance with `hint` then `editorial`
- Problem-level execution time limits
- Per-user problem progress tracking (`viewerStatus`, solved/attempted state)
- Authenticated user dashboard with global progress, language mix, and recent solved list
- Dashboard continue flow with recent attempted problems and suggested next problem
- Per-problem local draft autosave with language-aware restore inside the built-in editor
- Public global leaderboard plus problem-level best accepted run rankings
- Sidebar problem scope filters for `all / remaining / attempted / solved`
- Sidebar discovery facets for difficulty and tags
- Authenticated problem workspace summary with attempt history and last accepted snapshot
- Workspace restore flow for loading the latest or accepted submission back into the editor
- Visible testcase failure diagnostics for the latest failed submission
- Custom input replay flow for running the current editor code without creating a submission
- Submission baseline compare flow for diffing the current editor code against an older submission
- Bulk problem import for admin authoring
- Problem import payloads can include nested visible/hidden testcase sets
- Create submissions (`USER` / `ADMIN`)
- List your own submissions (`ADMIN` can inspect all)
- Get your own submission by id (`ADMIN` can inspect all)
- Real local Java compile/run flow
- Real local Python script execution
- Real local C++ compile/run flow
- Compile error, runtime error, and time limit exceeded verdicts
- Public vs hidden testcase handling
- Admin-only full testcase visibility endpoint
- Admin testcase update/delete and bulk import flow
- Basic online judge flow with metrics
- Sample data seeding for first run
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

### Web UI
- `GET /`

### Auth
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `GET /api/dashboard`
- `GET /api/leaderboard`

### Problems
- `GET /api/problems`
- `GET /api/problems/{id}`
- `GET /api/problems/{id}/leaderboard`
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

## Current Runner State

- `JAVA`: real local compile/run pipeline
- `PYTHON`: real local script execution via stdin/stdout
- `CPP`: real local compile/run pipeline
- Timeouts now surface as `TIME_LIMIT_EXCEEDED`
- Problems can define their own `timeLimitMs`; omitted values default to `5000`
- The built-in seed catalog now includes multiple starter problems with visible and hidden testcase sets
- Editorial content is visible to `ADMIN` immediately and unlocks for users after `ACCEPTED`
- Hint content is visible to `ADMIN` immediately and unlocks for users after their first submission
- Problem list and detail responses now include per-user progress when authenticated
- Built-in sidebar now includes a per-user dashboard with solved counts, language mix, and recent accepted problems
- Dashboard now surfaces where you left off, recent unsolved attempts, and a suggested next problem
- Problem cards and the built-in editor now expose local per-problem drafts so unfinished work survives problem switches
- Built-in UI now also exposes a public hall of fame plus a per-problem accepted-run leaderboard
- Problem list can now be narrowed quickly with per-user scope filters and recent solved shortcuts
- Problem discovery can also be narrowed with difficulty and tag facets directly in the sidebar
- Problem workspace endpoint exposes attempt count, failure breakdown, latest submission identity, and latest accepted metrics
- Authenticated users can reload a previous submission into the built-in editor from the workspace panel
- Latest failed submission now exposes visible-case input/expected/actual previews without leaking hidden testcase content
- Built-in editor now supports one-off custom input replay with optional expected-output comparison
- Built-in editor can also compare the current code against a selected older submission on the same input

## Database Notes

- Production/dev schema is managed by Flyway migrations under [src/main/resources/db/migration](/Users/rapperin/Desktop/AlterN/altern/src/main/resources/db/migration)
- Tests run against in-memory H2 with the same migration set
