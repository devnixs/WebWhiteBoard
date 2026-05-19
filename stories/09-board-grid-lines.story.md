# Story 09: Board Grid Lines

## Goal

Add faint grid lines to the board UI so users get better spatial orientation without losing the canvas-first feel.

## Scope

- Add a subtle grid treatment behind board content in the `/board/{guid}` view.
- Keep the grid visually faint so drawings, text, selections, and floating panels remain easy to read.
- Preserve the existing compact board shell and dominant-canvas layout while introducing the grid.
- Add or update browser-based coverage for the visible grid behavior as needed.

## Relevant Specs

- `specs/02-board-layout-and-panels.spec.md`
- `specs/07-browser-testing-and-qa.spec.md`

## Acceptance Notes

- The grid should read as a light orientation aid rather than a primary visual element.
- The feature should not make the board feel busy or reduce contrast for user-created content.
- Any automated browser coverage should still run against the real backend and real PostgreSQL setup used by the project.

## Browser Test

- Open the application in a Chrome DevTools browser instance and enter the board route `/board/{guid}` after completing the normal name-entry flow from `/`.
- Confirm faint grid lines are visible across the canvas area before drawing.
- Draw several strokes and add at least one text or shape element, then confirm the grid stays behind content and does not make the drawn content hard to read.
- Check that the floating share, tools, zoom, shortcuts, and user panels remain clearly legible with the grid visible in the background.

## Completion Rule

- This story is complete only when the relevant items in `specs/02-board-layout-and-panels.spec.md` and `specs/07-browser-testing-and-qa.spec.md` have been checked `- [X]` and the manual Chrome DevTools browser test described above has been run successfully.
