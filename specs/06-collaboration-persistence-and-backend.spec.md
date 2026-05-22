---
area: collaboration-persistence-and-backend
owners:
  - frontend
  - backend
status: active
depends_on:
  - specs/00-foundations.spec.md
  - specs/01-login-homepage-and-routing.spec.md
  - specs/03-tools-and-drawing.spec.md
  - specs/10-board-assets-and-uploads.spec.md
---

- [X] COLLAB-001: Multiple users can connect to the same board and collaborate in real time.
- [X] COLLAB-002: A participant can see other participants’ cursors moving in real time.
- [X] COLLAB-003: Each remote cursor displays the participant’s name.
- [X] COLLAB-004: Each remote cursor displays the participant’s assigned color.
- [X] COLLAB-005: Remote cursors stay anchored to their board positions when the local participant pans or zooms the camera.
- [X] COLLAB-006: The top-right panel includes an indicator for current WebSocket latency to the server.
- [ ] COLLAB-007: The collaboration model preserves local responsiveness even when remote updates are delayed or bursty, and concurrent remote updates never roll back, blink, or discard already-committed local edits.
- [ ] COLLAB-008: Board mutations are synchronized over WebSockets as per-element actions (add, update, delete, reorder) carrying enough information for the backend to validate and apply each action independently, rather than as full-document replacements during ordinary editing.
- [X] COLLAB-009: Real-time board mutations, viewport transforms, and persisted board snapshots use application-owned document and action schemas instead of third-party editor snapshot payloads.
- [X] COLLAB-010: Backend validation prevents invalid or inconsistent board mutations from being accepted into the authoritative board state.
- [X] COLLAB-011: Active board state is served from memory for low-latency collaboration.
- [X] COLLAB-012: Board state is persisted asynchronously to PostgreSQL without requiring users to manually save.
- [X] COLLAB-013: Persisted board state can be reloaded accurately after process restarts or reconnects.
- [X] COLLAB-014: Remote cursor projection and incoming board updates remain visually anchored to the correct board positions after the native canvas runtime replaces the existing editor integration.
- [X] COLLAB-015: Known-board metadata needed for homepage re-entry is preserved consistently with the user’s local board history model.
- [X] COLLAB-016: Backend and persistence design avoid duplicating domain logic between transport handlers, persistence code, and controller endpoints.
- [X] COLLAB-017: The backend has an automated integration test suite that exercises the real HTTP API and WebSocket collaboration endpoints against a real PostgreSQL database.
- [X] COLLAB-018: Backend integration coverage includes board creation/loading, collaborative document synchronization, remote cursor broadcasting, and persisted board reload after application restart.
- [X] COLLAB-019: The backend exposes an HTTP image-asset upload endpoint backed by server-side file storage, and stored asset files are served back over stable HTTP URLs without requiring PostgreSQL to hold the binary payload.
- [X] COLLAB-020: Persisted board snapshots in PostgreSQL contain only board structure and asset references — image binaries are stored on the server filesystem and addressed by URL, never embedded as base64 inside the snapshot JSON.
- [ ] COLLAB-021: Real-time board edits are transmitted from the client as per-element actions (`shape.added`, `shape.updated`, `shape.deleted`, and any reorder action) identifying the affected element by stable id, rather than as full-document replacements.
- [ ] COLLAB-022: The backend applies incoming per-element actions into the authoritative in-memory document by element id, so concurrent edits to different elements never overwrite or discard one another.
- [ ] COLLAB-023: When two participants edit the same element concurrently, the backend resolves the conflict deterministically using a server-assigned monotonic ordering (last-writer-wins per element) and never resurrects an element that has already been deleted by a later action.
- [ ] COLLAB-024: Action broadcasts include the originating actor id and a server-assigned action sequence number so each client can ignore its own echoes and apply remote actions in order without rolling back unrelated local changes.
- [ ] COLLAB-025: Local edits remain visible without flicker, rollback, or rebroadcast races while remote actions arrive, including during in-progress drag, resize, rotate, and text-edit gestures.
- [ ] COLLAB-026: Full-document replacement remains available for bulk operations that need it (initial session sync, undo/redo restoration, bulk import) but is not used as the ordinary transport for per-element edits.
- [ ] COLLAB-027: Concurrent collaborative editing across two or more participants never silently drops committed shapes, never loses stroke or text commits, and never rolls a recently created element back to a pre-creation state.
- [ ] COLLAB-028: Backend integration coverage exercises concurrent action streams from multiple simulated participants and verifies that every committed action survives in the broadcast stream and in the persisted snapshot.
