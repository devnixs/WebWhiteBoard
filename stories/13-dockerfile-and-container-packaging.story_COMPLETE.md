# Story 13: Dockerfile and Container Packaging

## Goal

- [X] Add a multi-stage `Dockerfile` at the repo root that builds both the frontend and backend entirely inside Docker and produces a single self-contained runtime image.

## Scope

- [X] Add `Dockerfile` at repo root with three stages: Node.js frontend build → .NET SDK backend publish → .NET runtime final image.
- [X] Stage 1 (`node-build`): copy `frontend/`, run `npm ci && npm run build`, output lands in `frontend/dist/`.
- [X] Stage 2 (`dotnet-build`): copy `backend/`, run `dotnet publish backend/WebWhiteBoard.Api/WebWhiteBoard.Api.csproj -c Release -o /app/publish`.
- [X] Stage 3 (`runtime`): base on `mcr.microsoft.com/dotnet/aspnet:10.0`; copy `/app/publish` from `dotnet-build` and `frontend/dist` from `node-build` into `wwwroot/`.
- [X] Update `backend/WebWhiteBoard.Api/Program.cs` to call `UseStaticFiles()` and add a catch-all route that serves `index.html` for unrecognised paths, so SPA client-side routing works.
- [X] Expose port `8080` in the Dockerfile (`EXPOSE 8080`) and set `ASPNETCORE_URLS=http://+:8080` so the container listens on a predictable port.
- [X] Add `.dockerignore` at repo root to exclude `**/node_modules`, `**/bin`, `**/obj`, `frontend/dist`, and `.git`.
- [X] Update `docker-compose.yml` to add an `app` service that builds from the `Dockerfile`, depends on `postgres`, and maps host port `8080` to container port `8080`, with `ConnectionStrings__Postgres` wired to the compose postgres service.

## Relevant Specs

- `specs/09-deployment-and-packaging.spec.md`

## Acceptance Notes

- The .NET SDK base image tag must match the project's target framework: `mcr.microsoft.com/dotnet/sdk:10.0` and `mcr.microsoft.com/dotnet/aspnet:10.0`.
- The `wwwroot/` path used by `UseStaticFiles()` in ASP.NET Core is relative to `ContentRootPath`. When publishing, the `wwwroot` folder should be placed alongside the published DLL — the simplest approach is to copy `frontend/dist` into the publish output at `/app/publish/wwwroot`.
- The SPA fallback must only activate for paths that are not `/boards`, `/ws`, or `/health` — those are API routes and must not fall through to `index.html`.
- `ConnectionStrings__Postgres` uses double-underscore notation to map to the `ConnectionStrings:Postgres` config key in ASP.NET Core.
- Do not embed secrets in the image. The postgres password must come from the environment at run time.

## Browser Test

- [X] Build the image locally: `docker build -t wwb4 .` from the repo root — exited with code 0.
- [X] Started stack with `docker compose up -d` — both `app` and `postgres` services came up healthy.
- [X] Navigated to `http://localhost:8080` in Chrome DevTools — login page loaded with "What should we call you?" prompt.
- [X] Entered name "DockerUser" and clicked Continue — home page loaded with "New board" card.
- [X] Clicked Create — navigated to `/board/{guid}`, board canvas loaded with tool panel visible.
- [X] Drew a stroke on the canvas and reloaded — stroke persisted after reload (1 shape before and after reload).
- [X] Navigated directly to `http://localhost:8080/board/00000000-0000-0000-0000-000000000001` — frontend app loaded (SPA fallback active, no 404 error page).

## Completion Rule

- [X] This story is complete only when all items in `specs/09-deployment-and-packaging.spec.md` have been checked `- [X]` and the manual Chrome DevTools browser test described above has been run successfully.
