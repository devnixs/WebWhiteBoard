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
- [X] COLLAB-007: The collaboration model preserves local responsiveness even when remote updates are delayed or bursty.
- [X] COLLAB-008: Board actions are synchronized over WebSockets in a form that can be validated and applied consistently by the backend.
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
