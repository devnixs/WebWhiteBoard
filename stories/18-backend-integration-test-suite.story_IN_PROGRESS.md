# Story 18: Backend Integration Test Suite

## Goal

- [ ] Add a backend integration test suite that exercises the production API and WebSocket collaboration flows against a real PostgreSQL database.

## Scope

- [ ] Create a dedicated backend test project that starts the real ASP.NET Core API and points it at a real PostgreSQL instance for test execution.
- [ ] Cover main backend flows through integration tests: board creation and loading over HTTP, collaborative WebSocket join and document synchronization, remote cursor broadcasting, and persisted board reload after application restart.
- [ ] Ensure the tests call the API and send real WebSocket messages rather than exercising only application services directly.
- [ ] Add the integration test project to the solution and make sure the standard backend test command runs it.
- [ ] Update CI if needed so pull requests and pushes to `main` execute the backend integration suite in an environment with real PostgreSQL available.

## Relevant Specs

- [ ] `specs/06-collaboration-persistence-and-backend.spec.md`
- [ ] `specs/07-browser-testing-and-qa.spec.md`
- [ ] `specs/09-deployment-and-packaging.spec.md`

## Acceptance Notes

- [ ] The database used by this suite must be a real PostgreSQL instance, not an in-memory substitute.
- [ ] The tests should assert observable behavior from the API and WebSocket contract, not internal implementation details.
- [ ] Persistence assertions must account for asynchronous snapshot saving so the suite waits for durable state before verifying reload behavior.

## Browser Test

- [ ] Route: `/board/{guid}` using a running app backed by PostgreSQL.
- [ ] Open two browser sessions with different participant names, join the same board, draw or edit content in one session, and confirm the second session receives the visible board update and remote cursor movement.
- [ ] Reload one session after the update and confirm the board document is restored from persisted state.
- [ ] Record the browser result alongside the automated integration test run before closing the story.

## Completion Rule

- [ ] This story is complete only when the relevant items in `specs/06-collaboration-persistence-and-backend.spec.md`, `specs/07-browser-testing-and-qa.spec.md`, and `specs/09-deployment-and-packaging.spec.md` have been checked `- [X]` and the manual Chrome DevTools browser test described above has been run successfully.
