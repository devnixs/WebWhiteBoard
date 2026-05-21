# Story 21: Native HTML Canvas Runtime

## Goal

- [X] Replace the embedded `tldraw` board surface with an application-owned native HTML canvas runtime while preserving the existing `/board/{guid}` shell and canvas-first layout.

## Scope

- [X] Introduce the application-owned board document, viewport, and render-state model needed to drive a native HTML canvas board.
- [X] Replace the current `tldraw` mount in the board screen with a native canvas renderer plus any required overlay layers for UI affordances.
- [X] Preserve the existing floating share, tools, tool-settings, identity, latency, and zoom panels around the new canvas runtime.
- [X] Remove the `tldraw` frontend dependency and any runtime integration code that only exists to host the third-party editor.
- [X] Provide a project-owned debugging surface or test hook, if needed, for browser QA and end-to-end tests that can no longer rely on `window.__wwbEditor`.

## Relevant Specs

- [X] `specs/00-foundations.spec.md`
- [X] `specs/02-board-layout-and-panels.spec.md`
- [X] `specs/03-tools-and-drawing.spec.md`
- [X] `specs/05-navigation-shortcuts-and-input.spec.md`

## Acceptance Notes

- [X] The migration should not reintroduce a fixed header or allow board chrome to crowd out the canvas.
- [X] The new runtime should keep ownership of rendering, hit-testing, and viewport transforms inside the application codebase rather than wrapping another whiteboard SDK.
- [X] The board should remain visually stable during the migration so later stories can focus on interaction parity rather than shell regressions.

## Browser Test

- [X] Start the full stack with backend, frontend, and PostgreSQL running together.
- [X] Open `http://localhost:8080`, log in, create a board, and confirm `/board/{guid}` loads with the existing floating panels and a native canvas surface.
- [X] Use Chrome DevTools to confirm the shipped frontend no longer loads `tldraw` assets or exposes the previous `window.__wwbEditor` integration point unless a deliberate replacement debug hook was added.
- [X] Pan and zoom the board and confirm the canvas remains visually aligned with the grid/background treatment and surrounding board chrome.

## Completion Rule

- [X] This story is complete only when the relevant items in `specs/00-foundations.spec.md`, `specs/02-board-layout-and-panels.spec.md`, `specs/03-tools-and-drawing.spec.md`, and `specs/05-navigation-shortcuts-and-input.spec.md` have been checked `- [X]` and the manual Chrome DevTools browser test described above has been run successfully.
