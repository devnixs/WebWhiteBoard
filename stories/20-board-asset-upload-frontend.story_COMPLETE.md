# Story 20: Board Asset Upload Frontend Integration

## Goal

- [X] Wire the tldraw editor on the frontend to upload pasted image assets to the new backend upload endpoint (Story 19) instead of embedding them as base64 inside the board document, so PostgreSQL board snapshots no longer carry binary image data while end-user paste behavior remains visually identical.

## Scope

- [X] Add a small frontend module (e.g. `frontend/src/app/assetStore.ts`) that exposes an `assets` store compatible with tldraw's `<Tldraw assets={...}>` (or `assetStore`) API, performing `upload(asset, file)` by POSTing the file to the backend upload endpoint and returning the absolute URL provided by the response.
- [X] Wire that asset store into `<Tldraw>` in `frontend/src/components/board/BoardScreen.tsx` so clipboard-pasted images, file drops, and any other tldraw asset insertion path go through the upload flow instead of producing base64 data URLs.
- [X] Confirm `resolve(asset)` returns the stored URL unchanged so existing assets render via plain HTTP GET against the configured static path.
- [X] Ensure the board document JSON now produced by the editor contains only the asset URL reference, not base64 binary content — verify by inspecting `editor.getSnapshot().document` after a paste.
- [X] Surface upload failures to the user via a small, non-blocking inline indicator (toast, status overlay, or reuse of `BoardStatusOverlay` patterns) instead of silently inserting a broken image shape.
- [X] Preserve the existing "pasted image appears exactly once" invariant from `specs/03-tools-and-drawing.spec.md` — re-verify under the new asset store wiring.
- [X] Confirm legacy boards whose stored snapshot still contains inline base64 image assets continue to render correctly after this change (backward compatibility for already-persisted data).
- [X] Update any frontend types in `frontend/src/app/types.ts` if a new client-side message or response shape is introduced.

## Relevant Specs

- `specs/10-board-assets-and-uploads.spec.md`
- `specs/03-tools-and-drawing.spec.md`
- `specs/07-browser-testing-and-qa.spec.md`

## Acceptance Notes

- [X] Use tldraw's documented `assets` / `assetStore` integration point — do not reimplement clipboard handling on `window`. The custom `paste` listener was already removed in Story 12 and must not be reintroduced.
- [X] The asset URL returned by the backend should be inserted verbatim into the tldraw asset record's `src` field. Do not rewrite or wrap it in a `data:` URL.
- [X] When developing against `vite` on a different port than the backend, the upload `fetch` must point at the backend origin (reuse the same helper that builds `getBoardSocketUrl` if applicable) so the dev environment behaves like production.
- [X] If an upload fails, the failed asset must not be left as a half-inserted shape pointing at an unreachable URL — either remove the shape or replace it with an error state that the user can dismiss.
- [X] Re-run the existing image-paste end-to-end coverage from Story 12 against the new flow to confirm no regression in the "exactly one paste" invariant.

## Browser Test

- [X] Start the full stack with `docker compose up -d` so backend, frontend, and PostgreSQL are all running against the asset upload endpoint introduced in Story 19.
- [X] Open a Chrome DevTools browser instance at `http://localhost:8080`, log in as `PasteAlice`, and create a new board.
- [X] Paste an image from the clipboard onto the canvas using `Cmd+V` / `Ctrl+V` and confirm exactly one image appears at the paste location.
- [X] In DevTools, inspect the live tldraw document via `window.__wwbEditor.getSnapshot().document` and confirm the inserted asset's `src` is an `/assets/...` URL (or configured public prefix), not a `data:` URL.
- [X] In the DevTools Network panel, confirm a POST to the upload endpoint was made and a subsequent GET to the returned asset URL succeeded with status 200 and the correct image content type.
- [X] Open a second Chrome DevTools session as `PasteBob`, join the same `/board/{guid}` URL, and confirm the pasted image is visible at the same position on Bob's canvas, loaded via the public asset URL.
- [X] Reload Alice's session and confirm the pasted image is still visible after the board document is restored from PostgreSQL.
- [X] Open an existing legacy board that still has a base64-embedded image in its stored snapshot and confirm that image still renders correctly (backward compatibility).
- [X] Simulate an upload failure (for example by temporarily pointing the upload endpoint at a 4xx route via DevTools request interception or a network condition) and confirm the user sees a visible failure indication rather than a silently broken image.

## Completion Rule

- [X] This story is complete only when the relevant items in `specs/10-board-assets-and-uploads.spec.md`, `specs/03-tools-and-drawing.spec.md`, and `specs/07-browser-testing-and-qa.spec.md` describing client-side upload routing, pasted-image rendering, multi-participant visibility, reload persistence, backward compatibility with legacy base64 snapshots, and visible upload-failure handling have been checked `- [X]`, and the manual Chrome DevTools browser test described above has been run successfully.

## Current Status

- [X] Implementation and automated verification are complete.
- [X] Manual Chrome DevTools verification completed: PasteAlice paste produced exactly one image with `/assets/...` src (no data: URL), POST `/assets` 200 + GET asset 200 (`image/png`), PasteBob saw the image via the public URL in an isolated browser context, Alice reload restored the image from PostgreSQL, a legacy `data:` base64 asset round-tripped through persistence and still rendered, and a forced 503 on `/assets` surfaced the dismissable "Paste failed" upload notice.
