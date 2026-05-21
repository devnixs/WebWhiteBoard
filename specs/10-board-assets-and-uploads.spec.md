---
area: board-assets-and-uploads
owners:
  - frontend
  - backend
status: active
depends_on:
  - specs/00-foundations.spec.md
  - specs/03-tools-and-drawing.spec.md
  - specs/06-collaboration-persistence-and-backend.spec.md
  - specs/09-deployment-and-packaging.spec.md
---

- [X] ASSET-001: Image assets pasted, dropped, or otherwise inserted onto a board are uploaded to the backend and persisted as files in a local upload folder on the server, not as base64 data embedded in the board document.
- [X] ASSET-002: The backend exposes an HTTP endpoint that accepts an uploaded image and returns a stable URL that can be referenced from the board document.
- [X] ASSET-003: Uploaded asset files are served back to clients as static files via the URL returned by the upload endpoint.
- [X] ASSET-004: Each uploaded asset has a unique, non-guessable filename so assets from different boards or sessions cannot collide or accidentally overwrite each other.
- [X] ASSET-005: The upload folder location is configurable via configuration or environment variable and defaults to a sensible path under the backend content root.
- [X] ASSET-006: The upload endpoint accepts the common image content types used by browser clipboard paste (at least PNG, JPEG, GIF, and WebP).
- [X] ASSET-007: The upload endpoint enforces a reasonable maximum file size so the API cannot be used to write arbitrarily large files to disk.
- [X] ASSET-008: The upload endpoint rejects unsupported or non-image content with a clear error response and does not write the rejected payload to disk.
- [X] ASSET-009: Pasted images render for the local user immediately after upload completes, in the same on-canvas position they would have rendered before the change.
- [X] ASSET-010: Pasting an image from the system clipboard onto the board while no input or text editor is focused inserts the image into the board on the native canvas runtime, even when the paste target is the document body rather than the canvas element.
- [X] ASSET-011: Pasted images render correctly for every other connected participant of a collaborative board once the originating client has finished uploading.
- [X] ASSET-012: Pasted images persist correctly across full page reloads, WebSocket reconnects, and backend process restarts, as long as the asset folder is preserved.
- [X] ASSET-013: PostgreSQL board snapshots no longer contain embedded base64 image binaries — they reference uploaded assets by URL only.
- [X] ASSET-014: Existing board snapshots that still contain inline base64 image assets continue to render correctly, so the change is backward compatible for legacy boards already stored in the database.
- [X] ASSET-015: Native-canvas image entities render both backend-hosted asset URLs and legacy inline base64 images without breaking board interaction, pan and zoom behavior, or collaborative visibility.
- [X] ASSET-016: When an asset URL references a file that is missing from the upload folder, the rest of the board continues to render and remain interactive without the missing asset breaking the canvas.
- [X] ASSET-017: Asset upload failures (network error, oversize file, rejected content type) surface visibly to the user instead of silently inserting a broken or empty image shape onto the canvas.
