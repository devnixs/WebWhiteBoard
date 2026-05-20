# Story 28: Arrow Tool

## Goal

- [X] Add a dedicated arrow authoring tool so users can create directional connectors without routing through the generic shapes preset picker.

## Scope

- [X] Add an `Arrow` entry to the board tool rail with a keyboard shortcut and compact tool settings panel.
- [X] Implement native canvas authoring and rendering for arrow elements, including visible arrowheads that point from the drag origin toward the drag endpoint.
- [X] Keep arrow elements inside the existing native board document model so selection, duplication, collaboration sync, and persisted reload continue to work without special-case backend behavior.
- [X] Add browser coverage for arrow authoring, shortcut activation, and persisted reload behavior.

## Relevant Specs

- [X] `specs/03-tools-and-drawing.spec.md`
- [X] `specs/05-navigation-shortcuts-and-input.spec.md`
- [X] `specs/07-browser-testing-and-qa.spec.md`

## Acceptance Notes

- [X] The arrow tool should behave like a first-class board tool rather than a hidden shapes preset.
- [X] Arrow color and stroke size should follow the same board draw settings model already used for pencil and shapes so context-menu editing and future extensions stay consistent.
- [X] The implementation should avoid introducing backend-specific schema work unless the persisted document contract actually requires it.

## Playwright Test

- [X] Extend `e2e/tests/board.spec.ts` with a new arrow-tool case that activates the arrow tool from both the tool rail and the `A` shortcut, drags an arrow onto `/board/{guid}`, and asserts that an arrow element with the expected shape, color, and size exists in the native runtime document before and after reload.

## Browser Test

- [X] Open `/board/{guid}` in Chrome DevTools MCP, activate `Arrow`, draw arrows left-to-right, right-to-left, and diagonally, then confirm the arrowheads point toward the drag endpoints.
- [X] Select an arrow, duplicate it, change its color or draw size through the existing editing flows, reload the board, and confirm both arrows remain visible and correctly oriented.

## E2E Regression

- [X] Run `cd e2e && ./node_modules/.bin/playwright test` and require the entire suite to pass with no regressions.

## Completion Rule

- [X] This story is complete only when the relevant items in `specs/03-tools-and-drawing.spec.md`, `specs/05-navigation-shortcuts-and-input.spec.md`, and `specs/07-browser-testing-and-qa.spec.md` have been checked `- [X]`, the new Playwright test described above has been added and passes, the manual Chrome DevTools browser test described above has been run successfully, and the full end-to-end test suite passes with no regressions.
