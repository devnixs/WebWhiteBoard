- [X] The project can be packaged into a single Docker image that contains both the compiled frontend and the running backend.
- [X] The Docker image is built entirely from within the container using a multi-stage build — no pre-built artifacts from the host are required.
- [X] The frontend is built inside a Node.js build stage using `npm ci` and `npm run build`.
- [X] The backend is compiled and published inside a .NET SDK build stage using `dotnet publish`.
- [X] The final runtime image is based on the .NET runtime base image only — the Node.js and .NET SDK stages are not included in the shipped image.
- [X] The frontend static assets produced by the Vite build are copied from the Node build stage into the backend's `wwwroot/` directory in the final image.
- [X] The backend serves the frontend static files and falls back to `index.html` for any unrecognised route, supporting client-side SPA routing.
- [X] The PostgreSQL connection string can be supplied at container start-up via the `ConnectionStrings__Postgres` environment variable, overriding the built-in default.
- [X] The container exposes a single HTTP port that serves both the API and the frontend.
- [X] A `.dockerignore` file exists to exclude `node_modules`, build output directories, and other host artefacts from the Docker build context.

## CI / GitHub Actions

- [X] A GitHub Actions workflow file exists at `.github/workflows/ci.yml` and is triggered on every push and pull request to `main`.
- [X] The CI workflow runs a frontend check job that installs dependencies with `npm ci`, verifies TypeScript compilation with `tsc -b`, and runs the linter with `npm run lint` inside the `frontend/` directory.
- [X] The CI workflow runs a backend check job that restores and builds the solution with `dotnet build` and executes `dotnet test` against the solution.
- [X] The CI workflow runs an end-to-end test job that starts the full stack (app + postgres) using `docker compose`, waits for the app to be healthy, installs Playwright browsers, and runs the Playwright suite from the `e2e/` directory.
- [X] The CI workflow builds the Docker image using the repo `Dockerfile` (multi-stage build, no pre-built host artifacts).
- [X] On a push to `main` only, the CI workflow authenticates to the GitHub Container Registry (`ghcr.io`) and pushes the built image tagged with both `latest` and the commit SHA.
- [X] The image name in the registry follows the pattern `ghcr.io/<owner>/<repo>:<tag>` and is derived automatically from `github.repository`.
- [X] The workflow uses `GITHUB_TOKEN` for registry authentication — no additional secrets are required for the push step.
- [X] The push step is skipped (or the job is conditioned) on pull requests so that unmerged branches do not pollute the registry.
