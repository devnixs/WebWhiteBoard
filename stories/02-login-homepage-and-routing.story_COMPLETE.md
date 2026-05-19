# Story 02: Login Homepage And Routing

## Goal

Implement the first-load login flow, local identity storage, known-board homepage flow, board creation and re-entry, and the two-route application model.

## Scope

- Prompt for user name on first load.
- Store the user name in local storage and assign a random color.
- Support direct board-link entry with login-first behavior.
- Implement the homepage at `/` with create-board and known-board re-entry flows.
- Persist the locally known board list and show only previously connected boards.
- Show the current user name and provide logout behavior.

## Relevant Specs

- `specs/01-login-homepage-and-routing.spec.md`

## Acceptance Notes

- The route model must stay limited to `/` and `/board/{guid}`.
- Logging out should reset the local identity flow cleanly without leaving stale UI state behind.
- Board creation and board join behavior should both update the local known-board history.

## Completion Rule

- This story is complete only when the relevant items in `specs/01-login-homepage-and-routing.spec.md` have been checked `- [X]`.
