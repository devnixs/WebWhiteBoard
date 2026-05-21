---
area: deployment-and-packaging
owners:
  - backend
  - frontend
status: active
depends_on:
  - specs/00-foundations.spec.md
  - specs/06-collaboration-persistence-and-backend.spec.md
  - specs/10-board-assets-and-uploads.spec.md
---

- [X] DEPLOY-001: The project can be packaged into a single Docker image that contains both the compiled frontend and the running backend.
- [X] DEPLOY-002: The Docker image is built entirely from within the container using a multi-stage build — no pre-built artifacts from the host are required.
- [X] DEPLOY-003: The frontend is built inside a Node.js build stage using `npm ci` and `npm run build`.
- [X] DEPLOY-004: The backend is compiled and published inside a .NET SDK build stage using `dotnet publish`.
- [X] DEPLOY-005: The final runtime image is based on the .NET runtime base image only — the Node.js and .NET SDK stages are not included in the shipped image.
- [X] DEPLOY-006: The frontend static assets produced by the Vite build are copied from the Node build stage into the backend's `wwwroot/` directory in the final image.
- [X] DEPLOY-007: The backend serves the frontend static files and falls back to `index.html` for any unrecognised route, supporting client-side SPA routing.
- [X] DEPLOY-008: The PostgreSQL connection string can be supplied at container start-up via the `ConnectionStrings__Postgres` environment variable, overriding the built-in default.
- [X] DEPLOY-009: The container exposes a single HTTP port that serves both the API and the frontend.
- [X] DEPLOY-010: A `.dockerignore` file exists to exclude `node_modules`, build output directories, and other host artefacts from the Docker build context.
- [X] DEPLOY-011: The container deployment includes a writable upload folder for board image assets, and the folder location is configurable at container start-up via an environment variable so operators can mount it on a persistent volume.
- [X] DEPLOY-012: The container deployment documents the `Assets__UploadFolderPath` and `Assets__PublicUrlPrefix` environment variables alongside `ConnectionStrings__Postgres` so operators know how uploaded board assets are stored and served.
- [X] DEPLOY-013: The default `docker-compose.yml` mounts the asset upload folder onto a named volume so uploaded images survive container restarts and image rebuilds.

## CI / GitHub Actions

- [X] DEPLOY-014: A GitHub Actions workflow file exists at `.github/workflows/ci.yml` and is triggered on every push and pull request to `main`.
- [X] DEPLOY-015: The CI workflow runs a frontend check job that installs dependencies with `npm ci`, verifies TypeScript compilation with `tsc -b`, and runs the linter with `npm run lint` inside the `frontend/` directory.
- [X] DEPLOY-016: The CI workflow runs a backend check job that restores and builds the solution with `dotnet build` and executes `dotnet test` against the solution.
- [X] DEPLOY-017: The CI workflow executes the backend integration test suite in an environment that provides a real PostgreSQL database.
- [X] DEPLOY-018: The CI workflow runs an end-to-end test job that starts the full stack (app + postgres) using `docker compose`, waits for the app to be healthy, installs Playwright browsers, and runs the Playwright suite from the `e2e/` directory.
- [X] DEPLOY-019: The CI workflow builds the Docker image using the repo `Dockerfile` (multi-stage build, no pre-built host artifacts).
- [X] DEPLOY-020: On a push to `main` only, the CI workflow authenticates to the GitHub Container Registry (`ghcr.io`) and pushes the built image tagged with both `latest` and the commit SHA.
- [X] DEPLOY-021: The image name in the registry follows the pattern `ghcr.io/<owner>/<repo>:<tag>` and is derived automatically from `github.repository`.
- [X] DEPLOY-022: The workflow uses `GITHUB_TOKEN` for registry authentication — no additional secrets are required for the push step.
- [X] DEPLOY-023: The push step is skipped (or the job is conditioned) on pull requests so that unmerged branches do not pollute the registry.
