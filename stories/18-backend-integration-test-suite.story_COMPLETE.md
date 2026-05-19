# Story 18: Backend Integration Test Suite

## Goal

- [X] Add a backend integration test suite that exercises the production API and WebSocket collaboration flows against a real PostgreSQL database.

## Scope

- [X] Create a dedicated backend test project that starts the real ASP.NET Core API and points it at a real PostgreSQL instance for test execution.
- [X] Cover main backend flows through integration tests: board creation and loading over HTTP, collaborative WebSocket join and document synchronization, remote cursor broadcasting, and persisted board reload after application restart.
- [X] Ensure the tests call the API and send real WebSocket messages rather than exercising only application services directly.
- [X] Add the integration test project to the solution and make sure the standard backend test command runs it.
- [X] Update CI if needed so pull requests and pushes to `main` execute the backend integration suite in an environment with real PostgreSQL available.

## Relevant Specs

- [X] `specs/06-collaboration-persistence-and-backend.spec.md`
- [X] `specs/07-browser-testing-and-qa.spec.md`
- [X] `specs/09-deployment-and-packaging.spec.md`

## Acceptance Notes

- [X] The database used by this suite must be a real PostgreSQL instance, not an in-memory substitute.
- [X] The tests should assert observable behavior from the API and WebSocket contract, not internal implementation details.
- [X] Persistence assertions must account for asynchronous snapshot saving so the suite waits for durable state before verifying reload behavior.

## Browser Test

- [X] Route: `/board/{guid}` using a running app backed by PostgreSQL.
- [X] Open two browser sessions with different participant names, join the same board, draw or edit content in one session, and confirm the second session receives the visible board update and remote cursor movement.
- [X] Reload one session after the update and confirm the board document is restored from persisted state.
- [X] Record the browser result alongside the automated integration test run before closing the story.

## Completion Rule

- [X] This story is complete only when the relevant items in `specs/06-collaboration-persistence-and-backend.spec.md`, `specs/07-browser-testing-and-qa.spec.md`, and `specs/09-deployment-and-packaging.spec.md` have been checked `- [X]` and the manual Chrome DevTools browser test described above has been run successfully.
