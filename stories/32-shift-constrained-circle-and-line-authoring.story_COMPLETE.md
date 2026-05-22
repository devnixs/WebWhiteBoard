# Story 32: Shift-Constrained Circle And Line Authoring

## Goal

- [X] Let users hold `Shift` while authoring circles and lines so circles become perfectly round and lines snap to 45-degree angle increments.

## Scope

- [X] Update native canvas authoring for the circle shape so `Shift` constrains the transient preview and committed element to equal width and height.
- [X] Update native canvas authoring for line-style tools so `Shift` snaps the transient preview and committed line endpoint to the nearest 45-degree increment from the drag origin.
- [X] Preserve existing unconstrained circle and line behavior when `Shift` is not held.
- [X] Keep the modifier behavior local to active authoring gestures so it does not interfere with selection, text editing, panning, zooming, or existing keyboard shortcuts.

## Relevant Specs

- [X] `specs/03-tools-and-drawing.spec.md`
  - `TOOLS-042`
  - `TOOLS-043`

## Acceptance Notes

- [X] A constrained circle should remain round regardless of drag direction; dragging up-left, up-right, down-left, or down-right should preserve the expected origin-to-pointer quadrant.
- [X] The line behavior applies to the product's line-authoring surface. If the implementation currently represents this through the arrow tool or a line shape rather than a separate visible line tool, the user-visible behavior still needs to satisfy `TOOLS-043`.
- [X] Snapping should choose the nearest 45-degree increment, including horizontal, vertical, and diagonal directions.
- [X] Existing `Shift` pencil snapping from `TOOLS-027` must continue to work.

## Playwright Test

- [X] Extend `e2e/tests/board.spec.ts` with coverage on `/board/{guid}` that selects the circle shape, holds `Shift` during a drag, and asserts the committed native canvas shape has equal visual width and height.
- [X] Extend `e2e/tests/board.spec.ts` with coverage on `/board/{guid}` that selects the line-authoring tool, holds `Shift` during a non-cardinal drag, and asserts the committed line endpoint is snapped to the nearest 45-degree angle.
- [X] Include an unconstrained drag check so circles and lines remain freeform when `Shift` is not held.

## Browser Test

- [X] Using Chrome DevTools MCP, open `/board/{guid}`, select the shapes tool, choose the circle shape, hold `Shift`, and drag in at least two directions; confirm the preview and final shape are perfect circles.
- [X] Using Chrome DevTools MCP, open `/board/{guid}`, select the line-authoring tool, hold `Shift`, and drag near horizontal, vertical, and diagonal directions; confirm the preview and final line snap to 45-degree increments.
- [X] Repeat one pencil `Shift` stroke and one text edit to confirm the new modifier handling has not broken existing input behavior.

## E2E Regression

- [X] Run `cd e2e && ./node_modules/.bin/playwright test` and require the entire suite to pass with no regressions.

## Completion Rule

- [X] This story is complete only when the referenced spec IDs have been checked `- [X]`, the Playwright coverage described above has been added or extended and passes, the manual Chrome DevTools browser test described below has been run successfully, and the full e2e suite passes with no regressions.
