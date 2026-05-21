# Story 23: Native HTML Canvas Collaboration, Assets, And QA

## Goal

- [X] Preserve real-time collaboration, persisted reload fidelity, and asset handling after the board runtime moves from `tldraw` to an application-owned native HTML canvas engine.

## Scope

- [X] Replace any remaining `tldraw`-specific collaboration or persistence payloads with application-owned board document and action schemas.
- [X] Preserve remote cursor broadcasting, camera anchoring, low-latency update behavior, and backend validation for the native canvas model.
- [X] Ensure persisted boards reload accurately from PostgreSQL after reconnects and process restarts under the new document format.
- [X] Preserve backend-hosted asset upload behavior plus legacy base64-image rendering compatibility inside the native canvas runtime.
- [X] Update end-to-end coverage and manual QA guidance so the board can be validated without `tldraw`-specific browser hooks or dependency assumptions.

## Relevant Specs

- [X] `specs/00-foundations.spec.md`
- [X] `specs/06-collaboration-persistence-and-backend.spec.md`
- [X] `specs/07-browser-testing-and-qa.spec.md`
- [X] `specs/10-board-assets-and-uploads.spec.md`

## Acceptance Notes

- [X] Backend validation should remain the source of truth for incoming board mutations even if the frontend canvas engine becomes more sophisticated.
- [X] Legacy boards already stored in PostgreSQL must remain viewable and editable or a deliberate migration path must be added to the specs before implementation is considered complete.
- [X] The new automated coverage should verify shipped behavior through the UI and network contract rather than reaching into `tldraw` internals that will no longer exist.

## Browser Test

- [X] Start the full stack and open the same board in two Chrome DevTools browser contexts with different user names.
- [X] Draw, edit, pan, zoom, and paste an image as the first user; confirm the second user sees matching board updates, remote cursors, and image placement on the native canvas.
- [X] Reload both sessions and confirm the board restores accurately from PostgreSQL with the same assets, ordering, and editability intact.
- [X] Verify at least one legacy board that still contains inline base64 image data continues to render correctly after the native canvas migration.

## Completion Rule

- [X] This story is complete only when the relevant items in `specs/00-foundations.spec.md`, `specs/06-collaboration-persistence-and-backend.spec.md`, `specs/07-browser-testing-and-qa.spec.md`, and `specs/10-board-assets-and-uploads.spec.md` have been checked `- [X]` and the manual Chrome DevTools browser test described above has been run successfully.
