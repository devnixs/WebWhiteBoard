# Story 03: Board Layout And Floating Panels

## Goal

Build the board shell so the canvas remains dominant and all controls live in compact floating panels rather than a fixed header.

## Scope

- Remove any fixed-header assumption from the board layout.
- Add the top-left share panel and clipboard-copy confirmation.
- Add the left tools panel container.
- Add the bottom-right zoom and shortcuts entry panel.
- Add the top-right user and WebSocket latency panel.
- Ensure the shell works on desktop and laptop-sized screens without crowding the board.

## Relevant Specs

- `specs/02-board-layout-and-panels.spec.md`

## Acceptance Notes

- The board canvas should remain the clear primary interface.
- Panels should be compact and extensible for later controls.
- Sharing must copy the current board URL rather than generating a separate link model.

## Completion Rule

- This story is complete only when the relevant items in `specs/02-board-layout-and-panels.spec.md` have been checked `- [X]`.
