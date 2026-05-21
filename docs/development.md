# Development

## Project Contract

- Product behavior lives in `specs/`.
- Implementation slices live in `stories/`.
- Before behavior changes, update the relevant spec items first and keep changed items unchecked until implementation and verification are complete.
- New or changed spec checklist items need stable IDs such as `TOOLS-042`.
- New stories should start from `stories/_template.story_TODO.md`.

## Workflow Commands

- `npm run validate:workflow` - validates spec IDs, spec frontmatter, story naming, story references, and the generated story map.
- `npm run generate:story-map` - regenerates `stories/00-story-map.md` from active and archived story files.

## Frontend

- Install dependencies: `npm --prefix frontend install`
- Run development server: `npm --prefix frontend run dev`
- Build: `npm --prefix frontend run build`
- Lint: `npm --prefix frontend run lint`
- Type-check: `cd frontend && npx tsc -b`

## Backend

- Restore: `dotnet restore WebWhiteBoard.slnx`
- Build: `dotnet build WebWhiteBoard.slnx`
- Test: `dotnet test WebWhiteBoard.slnx`

## Full Stack

- Start stack: `docker compose up -d --wait`
- Stop stack: `docker compose down -v`
- Build app image: `docker compose build app`

## End-To-End Tests

- Install e2e dependencies: `npm --prefix e2e install`
- Install browsers: `npm --prefix e2e exec playwright install --with-deps chromium`
- Run full e2e suite: `cd e2e && ./node_modules/.bin/playwright test`

End-to-end tests are expected to run against the real backend and a real PostgreSQL database. Do not replace PostgreSQL with an in-memory database for feature validation.

## Manual Browser QA

Major frontend behavior changes require manual Chrome DevTools MCP verification on the relevant route.

For board changes, manual QA should exercise real UI interactions on `/board/{guid}`: clicking tools, drawing, typing, selecting, panning, zooming, using context menus, pasting images, and checking collaboration-visible behavior when relevant.

## Story Lifecycle

- New story: `NN-slug.story_TODO.md`
- Started story: `NN-slug.story_IN_PROGRESS.md`
- Finished story: `NN-slug.story_COMPLETE.md`

Completed stories live under `stories/archive/` once they are no longer active. After moving, creating, or renaming stories, run:

```sh
npm run generate:story-map
npm run validate:workflow
```
