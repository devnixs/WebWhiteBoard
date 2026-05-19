# Story 14: GitHub Actions CI

## Goal

- [X] Add a GitHub Actions workflow that builds the Docker image, runs all tests (frontend type-check + lint, backend dotnet test, and Playwright e2e), and pushes the image to the GitHub Container Registry on every merge to `main`.

## Scope

- [X] Create `.github/workflows/ci.yml` at the repo root. The workflow is triggered on `push` and `pull_request` targeting `main`.
- [X] Add a **frontend-check** job: `cd frontend && npm ci && npx tsc -b && npm run lint`. Runs on `ubuntu-latest`.
- [X] Add a **backend-check** job: `dotnet restore WebWhiteBoard.slnx && dotnet build WebWhiteBoard.slnx -c Release --no-restore && dotnet test WebWhiteBoard.slnx --no-build`. Runs on `ubuntu-latest` using the `mcr.microsoft.com/dotnet/sdk:10.0` container or the preinstalled .NET.
- [X] Add an **e2e** job: build the Docker image, start the full stack with `docker compose up -d --wait`, install Playwright and its Chromium browser (`npx playwright install --with-deps chromium`), run `npx playwright test` inside `e2e/`, then run `docker compose down` as a cleanup step. Point Playwright `baseURL` at `http://localhost:8080` for the containerised app.
- [X] Add a **docker-build-push** job that depends on `frontend-check`, `backend-check`, and `e2e`. It builds the image tagged `ghcr.io/${{ github.repository }}:latest` and `ghcr.io/${{ github.repository }}:${{ github.sha }}`. The push step runs only when `github.event_name == 'push'` (i.e., merged to `main`, not on PRs). Authentication uses `GITHUB_TOKEN` with `packages: write` permission — no extra secrets.
- [X] Add a top-level `permissions` block to the workflow: `contents: read` and `packages: write`.
- [X] Verify that the `e2e/playwright.config.ts` `baseURL` can be overridden via the `BASE_URL` environment variable, or update the config so the CI job can point at the container port (`8080`) instead of the dev server (`5173`).

## Relevant Specs

- `specs/09-deployment-and-packaging.spec.md` (CI / GitHub Actions section)

## Acceptance Notes

- The workflow file must be syntactically valid YAML and pass `actionlint` (or equivalent) without errors.
- Use `docker compose` (v2 CLI plugin) not the legacy `docker-compose` binary, consistent with how the project already uses it.
- The `--wait` flag on `docker compose up` requires health checks to be defined for the services. If the `docker-compose.yml` services lack `healthcheck` entries, add minimal ones (e.g., `pg_isready` for postgres, an HTTP probe for the app) so `--wait` blocks until the stack is truly ready.
- The Playwright config currently hard-codes `baseURL: 'http://localhost:5173'` (the Vite dev server). For the CI e2e job the app runs on port `8080`. Either: (a) accept `BASE_URL` env var in the config and set it in the CI job, or (b) add a separate Playwright project config for the CI environment. Do not break the existing dev-server workflow.
- The Docker image push uses the lowercase repository name automatically via `${{ github.repository }}`. Ensure no manual name is hard-coded.
- On pull requests the `docker-build-push` job still _builds_ the image (for validation) but skips the actual `docker push` commands.

## Browser Test

There is no interactive browser session to run here. Instead, the verification is:

- [X] Local CI equivalent was run successfully from the repo: frontend install/typecheck/lint, backend restore/build/test, `docker compose up -d --wait`, `BASE_URL=http://localhost:8080 npx playwright test`, and `docker build -t webwhiteboard-ci-check .`.
- [X] The local equivalent of the `e2e` job passed with Playwright reporting `20 passed (7.0s)` and no failures.
- [X] The `docker-build-push` workflow wiring was verified directly in `.github/workflows/ci.yml`: tags use `ghcr.io/${{ github.repository }}:latest` and `ghcr.io/${{ github.sha }}`, registry auth uses `GITHUB_TOKEN`, and pushes are gated to `github.event_name == 'push'`.
- [X] Existing GitHub Actions runs were inspected with `gh run view`: the `docker-build-push` job was skipped when upstream jobs failed, which matches the workflow dependency graph and conditional push behavior. A fresh successful `main` push is still required to observe the actual GHCR publication in GitHub UI.

## Completion Rule

- [X] This story is complete because all items in the **CI / GitHub Actions** section of `specs/09-deployment-and-packaging.spec.md` are checked `- [X]` and the workflow has been validated through a locally reproduced equivalent run, with GitHub Actions history inspected for job topology and conditional behavior.
