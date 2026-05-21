---
area: browser-testing-and-qa
owners:
  - frontend
  - backend
status: active
depends_on:
  - specs/00-foundations.spec.md
---

- [X] QA-001: Every major feature is covered by an end-to-end browser test plan against a real backend and a real PostgreSQL database.
- [X] QA-002: End-to-end tests do not mock the backend.
- [X] QA-003: End-to-end tests do not use an in-memory database as a substitute for PostgreSQL.
- [X] QA-004: After each major feature is implemented, the application is manually tested in a running browser before the feature is considered complete.
- [X] QA-005: Manual browser testing includes clicking buttons, typing into text fields, and validating visible UI feedback for the implemented feature.
- [X] QA-006: Manual browser testing for major visual work includes side-by-side comparison against the relevant files in `design-guidelines/Screenshots/` and the prototype source in `design-guidelines/project/`, using Chrome DevTools to verify that spacing, sizing, iconography, colors, borders, shadows, and layout states match the reference closely enough to be considered pixel-accurate.
- [X] QA-007: Manual testing covers first-time login, returning-user login, logout, homepage board creation, homepage board re-entry, and direct shared-link entry into a board.
- [X] QA-008: Manual testing confirms the browser tab title is `WebWhiteBoard` on `/` and remains `WebWhiteBoard` after entering `/board/{guid}`.
- [X] QA-009: Manual testing covers share-link copying and visible copy confirmation.
- [X] QA-010: Manual testing covers the board grid overlay to confirm faint line-based grid lines are visible behind content without reducing readability of drawings or floating panels.
- [X] QA-011: Manual testing covers each primary tool, including select, pencil, text, shapes, eraser, and lasso.
- [X] QA-012: Manual testing covers the dedicated arrow tool, including creating arrows in multiple directions and confirming the arrowhead orientation remains correct after selection, duplication, and reload.
- [X] QA-013: Manual testing covers infinite canvas navigation, trackpad panning, zooming, and protection against accidental browser back navigation.
- [ ] QA-014: Manual Chrome DevTools verification of the native canvas runtime covers drawing, text, shapes, image paste, selection handles, resize, rotate, duplication, lasso, pan, zoom, and shortcut flows on `/board/{guid}`.
- [X] QA-015: Manual Chrome DevTools testing on `/board/{guid}` verifies that the select tool can box-select with a primary-button drag, that secondary-button drag pans like the hand tool, and that `Ctrl` + mouse wheel zoom changes occur in 10% steps.
- [X] QA-016: Manual testing covers image paste behavior using platform-appropriate clipboard input.
- [X] QA-017: Manual testing of image paste confirms that the pasted image is uploaded to the backend, stored as a file in the asset upload folder, served back to the canvas via a static URL, visible to a second connected participant, and still visible after a full page reload.
- [X] QA-018: End-to-end coverage for image paste verifies that the pasted image uploads through the backend asset endpoint, appears exactly once, persists as an asset URL instead of inline base64, remains visible to a second participant, preserves legacy base64 board rendering, and surfaces a visible failure notice when an upload is rejected.
- [X] QA-019: Manual testing covers single selection, multi-selection, resize, rotate, duplication, deletion, ordering changes, and context-menu editing actions, including selecting an exact color from the context-menu palette.
- [X] QA-020: End-to-end coverage verifies that a rotated board element can still be selected with the select tool's rectangle marquee using the visible rotated geometry.
- [X] QA-021: End-to-end coverage verifies that rotating an already-rotated element again does not make it orbit away from its original center.
- [X] QA-022: End-to-end coverage verifies that right-clicking a colorable board item opens the context menu palette and applies the exact color swatch the user chooses.
- [X] QA-023: Manual testing covers keyboard shortcuts on both Windows/Linux conventions and macOS equivalents as applicable to the implementation environment.
- [X] QA-024: Manual testing covers multi-user collaboration with visible remote cursors, names, colors, and low-latency update behavior.
- [X] QA-025: Manual testing covers local camera pan and zoom during multi-user collaboration to confirm remote cursors remain anchored to the same board content.
- [X] QA-026: End-to-end coverage for the native canvas migration verifies board creation, drawing, selection editing, collaboration, asset rendering, and persisted reload behavior without `tldraw` present in the shipped frontend dependency graph.
- [X] QA-027: Manual testing covers reconnect or reload scenarios to confirm persisted board state is restored correctly.
- [X] QA-028: After any major frontend component decomposition or file-structure refactor, manual Chrome DevTools regression testing covers both `/` and `/board/{guid}` to confirm the extracted components preserve the existing login, board creation, drawing, sharing, selection, and collaboration-visible UI behavior.
- [X] QA-029: The browser test suite is structured so each major feature area has at least one meaningful end-to-end flow that exercises the real system through the UI.
- [X] QA-030: End-to-end coverage verifies that the arrow tool can be activated from the tool rail and keyboard shortcut, that dragging creates an arrow element with persisted color and size settings, and that the arrow remains present after reload.
- [X] QA-031: Visual browser QA for the design-guidelines alignment work reproduces the four reference screens from `design-guidelines/Screenshots/` in Chrome DevTools and records whether each one matches the intended route and UI state before the related story can be closed.
- [X] QA-032: The backend has a non-unit integration test suite that exercises the deployed API contract directly through HTTP requests and WebSocket messages.
- [X] QA-033: Backend integration tests run against a real PostgreSQL instance and cover at least one meaningful flow for board creation, collaboration updates, cursor presence, and persisted reload behavior.
- [X] QA-034: Manual browser testing of the backend asset upload flow confirms that a test image `POST`ed from Chrome DevTools to the upload endpoint returns an asset URL, the URL serves the uploaded image over HTTP, and the same image remains reachable after restarting the app container with its asset volume mounted.
