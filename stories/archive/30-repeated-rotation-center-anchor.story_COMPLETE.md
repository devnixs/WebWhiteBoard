# Story 30: Repeated Rotation Center Anchor

## Goal

- [X] Keep repeated rotation gestures anchored to each selected element's own visual center so already-rotated content does not drift when rotated again.

## Scope

- [X] Update the selection/rotation spec to require center-anchored repeated rotations.
- [X] Replace rotation math that derives element centers from rotated bounding boxes with intrinsic element-center geometry for text, shapes, and images.
- [X] Preserve the existing stroke rotation behavior and multi-selection rotation behavior while removing single-element drift after prior rotations.
- [X] Add browser coverage for rotating the same element multiple times and confirming its center stays stable.

## Relevant Specs

- [X] `specs/04-selection-editing-and-ordering.spec.md`
- [X] `specs/07-browser-testing-and-qa.spec.md`

## Acceptance Notes

- [X] Rotating a selected text block, shape, or image that already has a non-zero rotation should keep the item visually anchored instead of making it orbit or slide.
- [X] Single-selection and multi-selection rotation should still use the shared selection center for the group transform while preserving each element's local center within that transform.
- [X] The fix should use the native canvas geometry model rather than compensating in the UI layer.

## Playwright Test

- [X] Extend `e2e/tests/board.spec.ts` with a case that loads a selectable native element on `/board/{guid}`, rotates it once, records its center, rotates it again, and asserts that the element center remains effectively unchanged while the rotation value increases.

## Browser Test

- [X] Using Chrome DevTools MCP, open `/board/{guid}`, create or load a text block or shape, rotate it, then rotate it again and confirm it spins in place around its own center instead of drifting as shown in the reported screenshot.

## E2E Regression

- [X] Run the full end-to-end suite with `cd e2e && ./node_modules/.bin/playwright test` and require it to pass with no regressions.

## Completion Rule

- [X] This story is complete only when the relevant items in `specs/04-selection-editing-and-ordering.spec.md` and `specs/07-browser-testing-and-qa.spec.md` have been checked `- [X]`, the new Playwright test described above has been added and passes, the manual Chrome DevTools browser test described above has been run successfully, and the full end-to-end test suite passes with no regressions.
