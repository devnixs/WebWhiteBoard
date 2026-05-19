# Story 17: Frontend Component Decomposition

## Goal

- [ ] Break the frontend React UI into smaller, easier-to-manage components and supporting modules across multiple files instead of continuing to grow `frontend/src/App.tsx` as a single monolithic route and UI container.

## Scope

- [ ] Extract the home/login route UI from `frontend/src/App.tsx` into focused components with clear responsibilities and local prop surfaces.
- [ ] Extract the board route UI from `frontend/src/App.tsx` into focused components for shell chrome, floating panels, dialogs, overlays, and context-menu behavior without changing the user-facing behavior defined in the existing board specs.
- [ ] Move shared presentational pieces such as panel primitives, pickers, modal chrome, and icon components out of `frontend/src/App.tsx` into dedicated files grouped by concern.
- [ ] Move reusable non-visual helpers and frontend-only types out of `frontend/src/App.tsx` where that reduces coupling and makes route/container code easier to scan.
- [ ] Preserve the current two-route application model (`/` and `/board/{guid}`) while reducing the size and responsibility count of `frontend/src/App.tsx`.
- [ ] Keep the refactor behavior-preserving: no intentional UX, visual, routing, or collaboration changes are part of this story unless a separate spec update explicitly adds them.

## Relevant Specs

- `specs/00-foundations.spec.md`
- `specs/07-browser-testing-and-qa.spec.md`

## Acceptance Notes

- The main requirement is maintainable decomposition, not file churn for its own sake. Split by responsibility, not arbitrarily.
- Route-level containers may still coordinate state and effects, but presentational panels, dialogs, icon sets, and isolated helpers should not remain piled into one file without a clear reason.
- Prefer file and folder names that make the board shell structure obvious to future contributors.
- Existing behavior remains the source of truth; this refactor should not silently alter tool behavior, keyboard support, panel placement, or collaboration flows.

## Browser Test

- [ ] Open the application in a Chrome DevTools browser instance on `/`.
- [ ] Verify the login/homepage flow still works: enter a name, create a board, and confirm navigation into `/board/{guid}` succeeds.
- [ ] On `/board/{guid}`, verify the top-left share panel, left tool rail, top-right identity/latency panel, and bottom-right zoom/shortcut panel all render in their expected positions.
- [ ] Draw with the pencil tool, place text, create a shape, and confirm the extracted components preserve the existing visible tool settings behavior.
- [ ] Use selection, context-menu actions, and share-link copying to confirm the refactor did not break interactive panel wiring.
- [ ] If collaboration test setup is available during the refactor, open the same board in a second tab and confirm remote cursors and document updates still appear in the first tab.

## Completion Rule

- [ ] This story is complete only when the relevant items in `specs/00-foundations.spec.md` and `specs/07-browser-testing-and-qa.spec.md` have been checked `- [X]` and the manual Chrome DevTools browser test described above has been run successfully.
