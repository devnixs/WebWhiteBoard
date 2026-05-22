# Story 37: Action-Based Collaboration Backend

## Goal

- [X] Replace the full-document last-writer-wins WebSocket protocol on the backend with a per-element action protocol that merges concurrent edits from multiple participants by element id, so collaborative editing no longer rolls back, blinks, or silently drops committed shapes.

## Scope

- [X] Define the realtime wire contracts for `shape.added`, `shape.updated`, `shape.deleted`, and any reorder action used by the frontend, including stable element ids and the originating actor id, in `backend/WebWhiteBoard.Api/Contracts`.
- [X] Extend `BoardRealtimeSessionCoordinator` to accept and route the new per-element client messages alongside the existing `session.join`, `cursor.updated`, and `ping` messages.
- [X] Extend `BoardCommandService` (and `BoardAggregate` if needed) to apply each per-element action into the authoritative in-memory document by element id without replacing the rest of the document, reusing the existing `BoardShapeAddedAction`, `BoardShapeUpdatedAction`, and `BoardShapeDeletedAction` types in `backend/WebWhiteBoard.Domain/Boards/BoardAction.cs`.
- [X] Assign a server-side monotonic sequence number to every accepted action so concurrent edits to the same element are resolved deterministically (last-writer-wins per element) and so clients can ignore their own echoes and apply remote actions in order.
- [X] Broadcast each accepted action to all connected participants in that board room, including the originating actor id and the server-assigned sequence number, and have the broadcast carry the action itself rather than a full-document snapshot.
- [X] Keep `board.document.replace` available as a bulk-replacement path for initial session sync, undo/redo restoration, and bulk import, but stop using it as the ordinary transport for per-element edits originating from the frontend write path.
- [X] Persist updated snapshots asynchronously through the existing `IBoardPersistenceScheduler` after each accepted action so reload behavior continues to satisfy `COLLAB-013`.
- [X] Reject and surface `board.sync.rejected` for invalid actions (unknown element on update/delete, malformed payload, mismatched board id, mismatched actor) without dropping the connection, so existing validation semantics from `COLLAB-010` still hold.

## Relevant Specs

- [X] `specs/06-collaboration-persistence-and-backend.spec.md`
  - `COLLAB-007`
  - `COLLAB-008`
  - `COLLAB-021`
  - `COLLAB-022`
  - `COLLAB-023`
  - `COLLAB-024`
  - `COLLAB-026`
  - `COLLAB-028`

## Acceptance Notes

- [X] The new action transport must coexist with the existing `board.document.replace` path during this story so the frontend can keep using full-document replace until story 38 lands. Both paths must converge on the same in-memory document and the same persisted snapshot.
- [X] Server-assigned action sequence numbers must be monotonic per board and must survive process restarts well enough that a reconnecting client can detect missed updates; if the implementation chooses to reset sequence numbers on cold start, that decision must be documented in code comments next to the sequence source.
- [X] When the action targets an element id that does not exist (e.g., a `shape.updated` arrives after a remote `shape.deleted`), the backend must drop the action silently rather than resurrecting the element, to satisfy `COLLAB-023`.
- [X] Cursor presence behavior (`COLLAB-002`–`COLLAB-006`, `COLLAB-014`) must remain unchanged.

## Playwright Test

- [X] Extend `e2e/tests/` with a backend-driven coverage path that drives the realtime WebSocket directly (no UI) and confirms that two simulated participants can each send `shape.added` actions for distinct element ids concurrently and observe both shapes in the resulting broadcast stream and in a fresh `GET` of the board snapshot.
- [X] If the e2e harness cannot drive raw WebSocket clients, add equivalent coverage to the backend integration test suite under `backend/WebWhiteBoard.Api.IntegrationTests` and reference it from this story instead, so `COLLAB-028` is met by integration tests against a real PostgreSQL instance.

## Browser Test

- [X] Using Chrome DevTools MCP, open two browser windows on `/board/{guid}` for the same board with two different participant names.
- [X] In window A draw a pencil stroke; in window B draw a different pencil stroke at approximately the same time.
- [X] Confirm that both strokes remain present in both windows after the edits commit and that neither window briefly flashes to the other window's document.
- [X] Reload window A and confirm both strokes are still present, demonstrating that the persisted snapshot received both committed actions.

## E2E Regression

- [X] Run `cd e2e && ./node_modules/.bin/playwright test` and require the entire suite to pass with no regressions.
- [X] Run the backend integration test suite (the `dotnet test` invocation already used in this repository for `WebWhiteBoard.Api.IntegrationTests`) and require it to pass with no regressions.

## Completion Rule

- [X] This story is complete only when the referenced spec IDs (`COLLAB-007`, `COLLAB-008`, `COLLAB-021`, `COLLAB-022`, `COLLAB-023`, `COLLAB-024`, `COLLAB-026`, `COLLAB-028`) have been checked `- [X]`, the Playwright or backend-integration coverage described above has been added or extended and passes, the manual Chrome DevTools browser test described above has been run successfully, and the full e2e and backend integration suites pass with no regressions.
