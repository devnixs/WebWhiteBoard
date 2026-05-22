# Story 38: Action-Based Collaboration Frontend

## Goal

- [X] Switch the frontend collaboration write and apply path from full-document `board.document.replace` to the per-element action transport delivered by story 37, so concurrent edits between participants no longer roll back, blink, or drop committed shapes on either screen.

## Scope

- [X] Emit per-element actions (`shape.added`, `shape.updated`, `shape.deleted`, plus any reorder action used by selection editing) from the frontend write path in `frontend/src/components/board/BoardScreen.tsx` and supporting modules instead of the current 120 ms debounced full-document broadcast in `queueDocumentBroadcast`.
- [X] Apply incoming remote actions into the local document by element id without replacing `documentRef.current` wholesale, so unrelated local edits (including in-progress drag, resize, rotate, and text-edit gestures) remain intact while remote actions arrive.
- [X] Ignore the client's own action echoes using the originating actor id and the server-assigned action sequence number, so a participant never overwrites its own committed state with its own echo.
- [X] Keep `board.document.replace` only for the bulk paths it is genuinely needed for (initial `session.ready` document seed, undo/redo restoration that rebuilds many elements at once, and explicit bulk import flows), and route all ordinary per-element edits through the action transport.
- [X] Maintain the current local-first responsiveness: local edits remain visible immediately and never wait on a server round-trip, while remote actions integrate without flicker.
- [X] Preserve the existing undo/redo, selection, text editor, eraser, lasso, and image-paste behaviors; only the network transport for committed mutations is changing.

## Relevant Specs

- [X] `specs/06-collaboration-persistence-and-backend.spec.md`
  - `COLLAB-007`
  - `COLLAB-008`
  - `COLLAB-021`
  - `COLLAB-024`
  - `COLLAB-025`
  - `COLLAB-026`
  - `COLLAB-027`

## Acceptance Notes

- [X] When a local edit modifies multiple elements at once (multi-select translate, resize, rotate, or duplicate), the frontend must emit one action per affected element (or a batched action message that the backend already accepts from story 37) so the server can merge per element.
- [X] When a remote `shape.updated` arrives for an element the local user is actively dragging, the local in-progress gesture must continue to take precedence on the local screen; the remote update must be applied to other elements but must not yank the actively manipulated element out from under the local pointer.
- [X] When a remote `shape.deleted` arrives for an element that is part of the local selection, the element is removed from the document and from the selection without crashing the selection UI.
- [X] If the WebSocket disconnects and reconnects, the frontend must accept a fresh `session.ready` document seed via the bulk path and discard any locally buffered but un-acknowledged actions whose ids no longer exist on the server, rather than re-sending them blindly.
- [X] Cursor presence behavior, latency display, participants list, and remote-cursor camera anchoring must remain unchanged.

## Playwright Test

- [X] Add a new Playwright test in `e2e/tests/` that opens two browser contexts against the same `/board/{guid}` (two participants), has both contexts draw distinct shapes at approximately the same time, and asserts that after a short settle window both shapes are visible in both contexts and remain visible after one of the contexts reloads.
- [X] Add a second assertion path in the same test (or a sibling test) that has participant A draw shape X and then immediately delete it while participant B draws shape Y at the same time, and asserts that after settle X is gone and Y is present in both contexts.
- [X] Include an unconstrained baseline check that a single participant editing alone still produces a board that survives reload, so the bulk session-ready path is exercised.

## Browser Test

- [X] Using Chrome DevTools MCP, open two browser windows on `/board/{guid}` for the same board with two different participant names and colors.
- [X] Have window A draw several pencil strokes and a shape while window B draws and moves a different shape concurrently; confirm nothing in either window flashes back to a previous state and that every committed stroke and shape remains visible in both windows.
- [X] In window B, select a shape created by window A and resize it; confirm window A sees the resize without losing any of its own concurrent edits.
- [X] Reload window A and confirm every element committed by either participant is still present.

## E2E Regression

- [X] Run `cd e2e && ./node_modules/.bin/playwright test` and require the entire suite to pass with no regressions.

## Completion Rule

- [X] This story is complete only when the referenced spec IDs (`COLLAB-007`, `COLLAB-008`, `COLLAB-021`, `COLLAB-024`, `COLLAB-025`, `COLLAB-026`, `COLLAB-027`) have been checked `- [X]`, the Playwright coverage described above has been added or extended and passes, the manual Chrome DevTools browser test described above has been run successfully, and the full e2e suite passes with no regressions.
