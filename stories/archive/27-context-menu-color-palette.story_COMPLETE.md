# Story 27: Context Menu Color Palette

## Goal

- [X] Replace the context-menu shape color action that currently picks a color implicitly with an explicit palette so users can choose the exact color they want.

## Scope

- [X] Update the board selection/context-menu specs to describe palette-based color selection instead of random or sequential recoloring.
- [X] Replace the native board context-menu `Change color` action with a palette of board color swatches.
- [X] Keep the palette constrained to supported board colors for shapes, strokes, and text while leaving unsupported element types unchanged.
- [X] Preserve the rest of the selection context-menu actions and layout behavior.
- [X] Add browser coverage for opening the palette and applying a specific swatch.

## Relevant Specs

- [X] `specs/04-selection-editing-and-ordering.spec.md`
- [X] `specs/07-browser-testing-and-qa.spec.md`

## Acceptance Notes

- [X] The context menu should stay compact and usable near the pointer location.
- [X] The palette should visibly indicate the current color when the selected editable items already share one.
- [X] Choosing a swatch should update the current selection to that exact board color without randomization.

## Playwright Test

- [X] Extend `e2e/tests/board.spec.ts` with a case that loads a board containing a colorable native shape, opens the context menu on `/board/{guid}`, exposes the color palette, clicks a specific swatch, and asserts that the document element color updates to that exact value.

## Browser Test

- [X] Using Chrome DevTools MCP, open `/board/{guid}`, create or load a colorable item, right-click it, choose a specific swatch from the context-menu palette, and confirm the item redraws in the chosen color while the rest of the context-menu actions still work.

## E2E Regression

- [X] Run the full end-to-end suite with `cd e2e && ./node_modules/.bin/playwright test` and require it to pass with no regressions.

## Completion Rule

- [X] This story is complete only when the relevant items in `specs/04-selection-editing-and-ordering.spec.md` and `specs/07-browser-testing-and-qa.spec.md` have been checked `- [X]`, the new Playwright test described above has been added and passes, the manual Chrome DevTools browser test described above has been run successfully, and the full end-to-end test suite passes with no regressions.
