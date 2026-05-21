# Story 33: Board Undo Redo Shortcuts

## Goal

- [X] Let users undo and redo local board content actions from the keyboard using standard platform shortcuts.

## Scope

- [X] Add local board document history for completed content-changing actions such as drawing, text creation or edits, shape creation, erasing, selection movement, resizing, rotation, duplication, deletion, reordering, color changes, and paste insertion.
- [X] Implement `Ctrl+Z` on Windows/Linux and `Cmd+Z` on macOS to undo the most recent local content action.
- [X] Implement `Ctrl+Y` on Windows/Linux and `Cmd+Shift+Z` on macOS to redo the most recently undone local content action.
- [X] Clear redo history when the user performs a new local content action after undoing.
- [X] Keep shortcut handling scoped so text editing fields retain native text-entry behavior and remote document updates do not create local undo steps.

## Relevant Specs

- [X] `specs/05-navigation-shortcuts-and-input.spec.md`
  - `NAV-013`
  - `NAV-014`

## Acceptance Notes

- [X] Undo and redo apply to board content, not viewport-only actions such as panning, zooming, opening panels, or changing the active tool.
- [X] A continuous pointer operation, such as moving or resizing a selection, should behave as one undoable action rather than one step per pointermove event.
- [X] Undoing or redoing a content action should update the local selection to remove stale selected IDs and should synchronize the resulting board document to collaborators through the existing realtime document replacement flow.
- [X] Existing shortcuts for select all, copy, paste, duplicate, delete, zoom, and tool switching must continue to work.

## Playwright Test

- [X] Extend `e2e/tests/board.spec.ts` with coverage on `/board/{guid}` that creates a native canvas element, presses `Ctrl+Z`, asserts the element is removed, presses `Ctrl+Y`, and asserts the element returns.
- [X] Cover redo clearing by undoing an element creation, performing a different local content action, pressing `Ctrl+Y`, and asserting the old undone action is not restored.
- [X] Cover redo through the shared modifier handler; the automated browser test verifies the Windows/Linux `Ctrl+Y` path, while the implementation also maps `Cmd+Shift+Z` through the same redo branch for macOS.

## Browser Test

- [X] Using Chrome DevTools MCP, open `/board/{guid}`, draw a pencil stroke, press `Ctrl+Z` or `Cmd+Z`, and confirm the stroke disappears.
- [X] Press `Ctrl+Y` or `Cmd+Shift+Z` and confirm the stroke reappears.
- [X] Undo a content creation, draw a different stroke, press redo, and confirm the undone original content does not return.
- [X] Open a text editor on the canvas and confirm normal text editing is not hijacked by board-level undo/redo shortcuts.

## E2E Regression

- [X] Run `cd e2e && ./node_modules/.bin/playwright test` and require the entire suite to pass with no regressions.

## Completion Rule

- [X] This story is complete only when the referenced spec IDs have been checked `- [X]`, the Playwright coverage described above has been added or extended and passes, the manual Chrome DevTools browser test described below has been run successfully, and the full e2e suite passes with no regressions.
