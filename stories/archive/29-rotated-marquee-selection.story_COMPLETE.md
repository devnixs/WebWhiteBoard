# Story 29: Rotated Marquee Selection Reliability

## Goal

- [X] Make rectangle marquee selection remain reliable for rotated board elements so users can reselect rotated content based on what is visibly enclosed on the canvas.

## Scope

- [X] Update the selection spec to describe reliable rectangle marquee behavior for rotated elements.
- [X] Replace the current marquee hit heuristic for rotated elements with geometry that matches the visible rotated element footprint instead of a few sampled points from an axis-aligned bounds proxy.
- [X] Preserve existing marquee and lasso selection behavior for unrotated elements, strokes, and arrows while improving rotated-element selection.
- [X] Add browser coverage for rotating an element and reselecting it via marquee.

## Relevant Specs

- [X] `specs/04-selection-editing-and-ordering.spec.md`
- [X] `specs/07-browser-testing-and-qa.spec.md`

## Acceptance Notes

- [X] A marquee rectangle that visibly overlaps or encloses a rotated rectangle, ellipse, diamond, star, text block, or image should select it consistently.
- [X] The fix should use the native canvas geometry model rather than a DOM overlay or a larger invisible click target.
- [X] The change should not make arrow or stroke marquee selection less predictable than it is today.

## Playwright Test

- [X] Extend `e2e/tests/board.spec.ts` with a case that loads a board containing a selectable shape, rotates it through the native canvas rotate handle on `/board/{guid}`, clears the selection, box-selects around the visible rotated shape, and asserts that the rotated element becomes selected again.

## Browser Test

- [X] Using Chrome DevTools MCP, open `/board/{guid}`, create a shape, rotate it visibly, click empty space to clear selection, then drag a rectangle marquee around the visible rotated shape and confirm the item is reselected without needing to cover an off-angle bounding-box corner.

## E2E Regression

- [X] Run the full end-to-end suite with `cd e2e && ./node_modules/.bin/playwright test` and require it to pass with no regressions.

## Completion Rule

- [X] This story is complete only when the relevant items in `specs/04-selection-editing-and-ordering.spec.md` and `specs/07-browser-testing-and-qa.spec.md` have been checked `- [X]`, the new Playwright test described above has been added and passes, the manual Chrome DevTools browser test described above has been run successfully, and the full end-to-end test suite passes with no regressions.
