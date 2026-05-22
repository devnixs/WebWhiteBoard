# Story 36: Shift Aspect Ratio Resize

## Goal

- [X] Let users hold `Shift` while resizing selected board items so the item keeps its original aspect ratio, especially for images.

## Scope

- [X] Update native canvas selection resizing so `Shift` constrains corner-handle resize gestures to the selected item's starting width-to-height ratio.
- [X] Preserve the current unconstrained resize behavior when `Shift` is not held.
- [X] Ensure the constrained resize behavior works for pasted or uploaded image items and does not break selection movement, rotation, multi-select visuals, text editing, panning, zooming, or existing keyboard shortcuts.

## Relevant Specs

- [X] `specs/04-selection-editing-and-ordering.spec.md`
  - `SELECT-027`

## Acceptance Notes

- [X] The aspect ratio is based on the selected item's bounds at the start of the resize gesture.
- [X] Dragging any resize corner with `Shift` held should preserve the original ratio while respecting the dragged corner and its opposite anchor.
- [X] If multiple items are selected, the combined selection should preserve the selection's starting aspect ratio rather than each item choosing an independent ratio.
- [X] Degenerate zero-width or zero-height selections should keep the existing minimum-size behavior without throwing or corrupting the board document.

## Playwright Test

- [X] Extend `e2e/tests/board.spec.ts` with coverage on `/board/{guid}` that creates an image item, selects it, holds `Shift` while dragging a resize handle, and asserts the committed image bounds preserve the original aspect ratio.
- [X] Include an unconstrained resize check showing the same selected item can still be resized to a different ratio when `Shift` is not held.

## Browser Test

- [X] Using Chrome DevTools MCP, open `/board/{guid}`, insert or paste an image, select it, hold `Shift`, drag a corner resize handle, and confirm the final image keeps its original ratio.
- [X] Repeat one regular resize without `Shift` and confirm it remains unconstrained.

## E2E Regression

- [X] Run `cd e2e && ./node_modules/.bin/playwright test` and require the entire suite to pass with no regressions.

## Completion Rule

- [X] This story is complete only when the referenced spec IDs have been checked `- [X]`, the Playwright coverage described above has been added or extended and passes, the manual Chrome DevTools browser test described below has been run successfully, and the full e2e suite passes with no regressions.
