# Story NN: Title

## Goal

- [ ] Describe the user-visible outcome this story delivers.

## Scope

- [ ] Describe the implementation slice.
- [ ] Keep the slice small enough to verify independently.

## Relevant Specs

- [ ] `specs/00-example.spec.md`
  - `EXAMPLE-001`

## Acceptance Notes

- [ ] Capture constraints, edge cases, and non-goals that affect implementation.

## Playwright Test

- [ ] Add or extend Playwright coverage for the behavior on the real route, using the real backend and PostgreSQL where applicable.
- [ ] State the user actions and assertions the test must perform.

## Browser Test

- [ ] Manually verify the behavior in Chrome DevTools MCP.
- [ ] State the route, setup, clicks, typing, gestures, collaboration steps, and expected visible result.

## E2E Regression

- [ ] Run the full e2e suite with the repository command and require it to pass with no regressions.

## Completion Rule

- [ ] This story is complete only when the referenced spec IDs have been checked `- [X]`, the Playwright coverage described above has been added or extended and passes, the manual Chrome DevTools browser test has been run successfully, and the full e2e suite passes with no regressions.
