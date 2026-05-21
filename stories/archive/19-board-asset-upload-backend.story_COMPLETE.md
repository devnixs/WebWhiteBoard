# Story 19: Board Asset Upload Backend

## Goal

- [X] Add a backend image-asset upload endpoint that stores uploaded files in a configurable local folder and serves them back as static files, so binary board assets no longer have to be embedded in the PostgreSQL board snapshot.

## Scope

- [X] Add a backend endpoint (for example `POST /assets` or `POST /boards/{boardId}/assets`) that accepts a single image upload as `multipart/form-data` and returns a JSON response containing the stable public URL of the stored asset.
- [X] Implement an `IAssetStorage` (or equivalent) abstraction in `WebWhiteBoard.Application` with a filesystem implementation in `WebWhiteBoard.Infrastructure` that writes the upload to disk under the configured upload folder.
- [X] Generate a unique, non-guessable filename per upload (for example a GUID combined with the original extension derived from the content type) so different boards and sessions cannot collide.
- [X] Restrict accepted content types to common browser-paste image types (PNG, JPEG, GIF, WebP) and reject anything else with a 4xx response without writing it to disk.
- [X] Enforce a configurable maximum upload size and reject oversize payloads with a 4xx response.
- [X] Add configuration for the upload folder path (default under the backend content root, e.g. `wwwroot/uploads/` or a dedicated `assets/` folder) and a configurable public URL prefix used when constructing the returned URL.
- [X] Wire the backend to serve the upload folder as static files at the public URL prefix, ensuring uploaded files are reachable for every connected client via plain HTTP GET.
- [X] Update `Program.cs` so `UseStaticFiles()` (or an additional `UseStaticFiles` call with a `PhysicalFileProvider`) maps the upload folder to the public URL prefix.
- [X] Add backend integration tests in `WebWhiteBoard.Api.IntegrationTests` that POST a real image to the upload endpoint, assert the returned URL is reachable via HTTP GET, assert the file appears on disk under the configured folder, and assert oversize / wrong-content-type uploads are rejected.
- [X] Update the `Dockerfile` and `docker-compose.yml` so the asset upload folder exists in the container, is writable, is exposed via the configured environment variable, and is mounted on a named volume in compose so uploads survive container restarts.
- [X] Document the new environment variable (upload folder path and public URL prefix) alongside the existing `ConnectionStrings__Postgres` deployment notes.

## Relevant Specs

- `specs/10-board-assets-and-uploads.spec.md`
- `specs/06-collaboration-persistence-and-backend.spec.md`
- `specs/09-deployment-and-packaging.spec.md`
- `specs/07-browser-testing-and-qa.spec.md`

## Acceptance Notes

- [X] The upload folder must not be inside `wwwroot/` if doing so would conflict with the SPA fallback in `Program.cs`. Prefer a sibling folder (for example `assets/`) mapped via `UseStaticFiles(new StaticFileOptions { FileProvider = new PhysicalFileProvider(...), RequestPath = "/assets" })`.
- [X] The endpoint must not return a relative URL that breaks when the frontend is hosted on a different origin in development — return an absolute path (e.g. `/assets/{filename}`) and let the browser resolve it against the current origin.
- [X] Existing board snapshots in PostgreSQL that still embed base64 image data must keep loading without errors — this story only adds the new path; it does not remove or migrate legacy embedded assets.
- [X] Do not commit any uploaded test fixtures to the repo. Tests should write to a temporary folder.

## Browser Test

- [X] Start the full stack with `docker compose up -d` and confirm the `app` container's asset folder is mounted on a named volume.
- [X] Open a Chrome DevTools browser instance at `http://localhost:8080`, log in as `UploadTester`, and open any `/board/{guid}`.
- [X] In the DevTools console, build a small PNG `Blob`, `POST` it as `multipart/form-data` to the new upload endpoint via `fetch`, and confirm the response contains an HTTP-200 status and a JSON body with an asset URL.
- [X] Open the returned asset URL directly in a new tab and confirm the uploaded image renders.
- [X] Stop and restart the `app` container with `docker compose restart app`, reload the asset URL, and confirm the image is still served (volume persistence works).
- [X] From a shell inside the `app` container, list the upload folder and confirm the uploaded filename matches the one referenced by the asset URL.

## Completion Rule

- [X] This story is complete only when the relevant items in `specs/10-board-assets-and-uploads.spec.md`, `specs/06-collaboration-persistence-and-backend.spec.md`, `specs/09-deployment-and-packaging.spec.md`, and `specs/07-browser-testing-and-qa.spec.md` that describe backend upload, storage, static serving, configurable folder, persistent volume, and rejection of bad uploads have been checked `- [X]`, and the manual Chrome DevTools browser test described above has been run successfully.
