# Story 09: Board Grid Lines

## Goal

- [X] Replace the board background dot pattern with faint line-based grid lines so users get better spatial orientation without losing the canvas-first feel.

## Scope

- [X] Update the `/board/{guid}` background treatment so the canvas uses subtle line-based grid lines instead of dots.
- [X] Keep the grid barely visible so drawings, text, selections, and floating panels remain easy to read.
- [X] Preserve the existing compact board shell and dominant-canvas layout while adjusting the grid treatment.
- [ ] Update browser-based coverage expectations for the visible grid behavior.

## Relevant Specs

- [X] `specs/02-board-layout-and-panels.spec.md`
- [X] `specs/07-browser-testing-and-qa.spec.md`
- [ ] `specs/08-visual-design-tokens.spec.md`

## Acceptance Notes

- [X] The grid should read as a light orientation aid rather than a primary visual element.
- [X] The line treatment should stay subtle enough that the board does not feel busy or reduce contrast for user-created content.
- [ ] Any automated browser coverage should still run against the real backend and real PostgreSQL setup used by the project.

## Browser Test

- [X] Open the application in a Chrome DevTools browser instance and enter the board route `/board/{guid}` after completing the normal name-entry flow from `/`.
- [X] Confirm faint line-based grid lines are visible across the canvas area before drawing.
- [ ] Draw several strokes and add at least one text or shape element, then confirm the grid stays behind content and does not make the drawn content hard to read.
- [X] Check that the floating share, tools, zoom, shortcuts, and user panels remain clearly legible with the grid visible in the background.

## Completion Rule

- [ ] This story is complete only when the relevant items in `specs/02-board-layout-and-panels.spec.md`, `specs/07-browser-testing-and-qa.spec.md`, and `specs/08-visual-design-tokens.spec.md` have been checked `- [X]` where applicable and the manual Chrome DevTools browser test described above has been run successfully.
