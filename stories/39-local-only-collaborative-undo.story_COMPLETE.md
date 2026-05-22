# Story 39: Local Only Collaborative Undo

## Goal

- [X] Ensure board undo and redo only affect the current user's own local action history, so one participant cannot undo another participant's work with `Ctrl+Z`.

## Scope

- [X] Replace whole-document undo restoration with local action history that can apply an undo or redo without removing unrelated remote elements.
- [X] Preserve existing single-user undo/redo behavior for drawing, shapes, text, deletion, duplication, resizing, rotation, ordering, erasing, paste, and selection-related edits.
- [X] Keep text editing fields scoped so native text-entry undo remains separate from board-level undo.

## Relevant Specs

- [X] `specs/05-navigation-shortcuts-and-input.spec.md`
  - `NAV-013`
- [X] `specs/06-collaboration-persistence-and-backend.spec.md`
  - `COLLAB-026`
  - `COLLAB-029`

## Acceptance Notes

- [X] If Alice draws a stroke, Bob draws a separate stroke, and Alice presses `Ctrl+Z`, only Alice's stroke disappears from both clients.
- [X] If a remote participant changes the same element after the local action, undo must not blindly overwrite that newer remote state.
- [X] Redo must follow the same ownership rule and must not restore over unrelated collaborator changes.
- [X] Remote actions must not create undo steps in the local user's history.

## Playwright Test

- [X] Extend `e2e/tests/concurrent-collaboration.spec.ts` with a two-participant `/board/{guid}` test that has Alice and Bob each draw separate strokes, presses `Ctrl+Z` in Alice's page, and asserts both pages keep Bob's stroke while Alice's stroke is removed.
- [X] The test must also press `Ctrl+Y` in Alice's page and assert Alice's stroke returns without duplicating or deleting Bob's stroke.

## Browser Test

- [X] Using Chrome DevTools MCP, open `/board/{guid}` as Alice, join the same board in a second browser context as Bob, draw one visible stroke from each participant, press `Ctrl+Z` in Alice's page, and confirm Bob's stroke remains visible on both pages while Alice's stroke disappears.
- [X] Press `Ctrl+Y` in Alice's page and confirm Alice's stroke returns while Bob's stroke remains unchanged.

## E2E Regression

- [X] Run `cd e2e && ./node_modules/.bin/playwright test` and require the entire suite to pass with no regressions.

## Completion Rule

- [X] This story is complete only when the referenced spec IDs have been checked `- [X]`, the Playwright coverage described above has been added or extended and passes, the manual Chrome DevTools browser test has been run successfully, and the full e2e suite passes with no regressions.
