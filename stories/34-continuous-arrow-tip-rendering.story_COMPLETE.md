# Story 34: Continuous Arrow Tip Rendering

## Goal

- [X] Make arrows render like a continuous `->` connector where the shaft reaches the actual arrow tip instead of looking like a separated `- >` shape.

## Scope

- [X] Update native canvas arrow rendering so the main shaft is connected to the arrow tip for authored, duplicated, synchronized, and reloaded arrows.
- [X] Keep existing arrow authoring, selection, hit testing, color, stroke size, shortcut activation, and persistence behavior intact.
- [X] Avoid backend schema changes unless the existing persisted board document shape cannot represent the corrected visual geometry.

## Relevant Specs

- [X] `specs/03-tools-and-drawing.spec.md`
  - `TOOLS-044`

## Acceptance Notes

- [X] The arrow line must visually terminate at the exact arrowhead tip, not at the base of the head.
- [X] The arrowhead side strokes should remain visible and directional after the shaft is extended to the tip.
- [X] The fix should apply consistently for horizontal, vertical, diagonal, left-to-right, and right-to-left arrows at supported stroke sizes.

## Playwright Test

- [X] Extend `e2e/tests/board.spec.ts` on `/board/{guid}` to create an arrow with the Arrow tool and assert the runtime document still stores the expected arrow element.
- [X] Add a user-visible canvas assertion that samples or otherwise verifies the rendered arrow shaft remains continuous into the arrow tip instead of leaving a gap before the head.

## Browser Test

- [X] Using Chrome DevTools MCP, open `/board/{guid}`, activate `Arrow`, draw left-to-right, right-to-left, and diagonal arrows, and visually confirm each arrow looks like `->` with the shaft connected to the tip.
- [X] Reload the board and confirm the persisted arrows still render with a connected shaft and correctly oriented arrowheads.

## E2E Regression

- [X] Run the full e2e suite with `cd e2e && ./node_modules/.bin/playwright test` and require it to pass with no regressions.

## Completion Rule

- [X] This story is complete only when `TOOLS-044` has been checked `- [X]`, the Playwright coverage described above has been added or extended and passes, the manual Chrome DevTools browser test described below has been run successfully, and the full e2e suite passes with no regressions.
