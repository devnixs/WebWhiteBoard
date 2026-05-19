# Story 10: Design Reference Parity

## Goal

Bring the application's real UI into visual parity with the reference design bundle in `design-guidelines/project/` and the screenshots in `design-guidelines/Screenshots/`. The design-guidelines files remain reference material only — nothing links to them at runtime — but the production app should reproduce the same tokens, iconography, buttons, floating panels, homepage cards, and screenshot states closely enough to read as the same UI.

## Scope

- [X] Introduce or complete a `:root` CSS token block in `frontend/src/index.css` that defines the properties below, taken directly from the design-guidelines THEME object:
  - `--bg: #f7f8fa`
  - `--bg-soft: #f1f3f6`
  - `--panel: #ffffff`
  - `--canvas: #fafbfc`
  - `--ink: #0f172a`
  - `--muted: #64748b`
  - `--border: #e4e7ec`
  - `--border-strong: #cbd2dc`
  - `--accent: oklch(0.58 0.16 254)`
  - `--accent-on: #ffffff`
  - `--accent-tint: oklch(0.95 0.04 254)`
  - `--grid: rgba(15, 23, 42, 0.12)`
  - `--grid-faint: rgba(15, 23, 42, 0.04)`
  - `--panel-shadow: 0 1px 2px rgba(15, 23, 42, 0.04), 0 4px 14px rgba(15, 23, 42, 0.05)`
  - `--panel-shadow-strong: 0 8px 30px rgba(15, 23, 42, 0.12), 0 2px 6px rgba(15, 23, 42, 0.04)`
- [X] Update the production CSS and component styles to consume those tokens via `var()` throughout. Every hardcoded design-guideline value that has a token equivalent should be replaced so the values are defined once.
- [X] Recreate the shared reference primitives from `design-guidelines/project/board-chrome.jsx` and `design-guidelines/project/screens.jsx` inside the production app: panel shells, pill buttons, primary buttons, tool buttons, search chip, avatar stack, modal chrome, flyout chrome, and divider treatments.
- [X] Recreate the reference icon set from `design-guidelines/project/icons.jsx` in the production app so the rendered strokes and shapes are visually identical, while keeping the implementation local to the real frontend codebase.
- [ ] Align the `/` unauthenticated screen to `design-guidelines/Screenshots/Screenshot1 - Login.png`.
- [ ] Align the `/` authenticated returning-user screen to `design-guidelines/Screenshots/Screenshot2 - Board selector.png`.
- [ ] Align the default `/board/{guid}` chrome state to `design-guidelines/Screenshots/Screenshot3 - Full board view.png`.
- [ ] Align the active-pencil + shortcuts state to `design-guidelines/Screenshots/Screenshot4 - Keyboard Shortcut Menu.png`.
- [ ] If exact screenshot recreation requires deterministic example content or a QA-only seed path, add that support in a way that does not change normal user-facing product behavior.

## Relevant Specs

- `specs/08-visual-design-tokens.spec.md`
- `specs/07-browser-testing-and-qa.spec.md`

## Acceptance Notes

- Do not link to or import from `design-guidelines/project/` at runtime. Copy values, do not reference files.
- Preserve the product behavior defined in the existing specs while changing the visuals. If the reference mockups imply a behavior change, update the relevant spec explicitly rather than slipping it in as styling work.
- Do not add inline styles as the production solution for the app shell. Tokens and reusable component styling should live in the real frontend codebase.
- `oklch()` colors are supported in all modern browsers (Chrome 111+, Firefox 113+, Safari 15.4+). No fallback is needed unless a browser compatibility requirement is later specified.
- The design bundle’s `WebWhiteBoard.html` and its imported JSX files are the visual source of truth for this story, with the PNG screenshots used as the acceptance snapshots.
- “Pixel perfect” here means matching the reference layout, icon shapes, spacing, type scale, border radii, border color, shadow strength, and visible states closely enough that a side-by-side Chrome DevTools review does not reveal material deviations.

## Browser Test

Open the app locally in Chrome DevTools against the real frontend/backend stack and keep the matching reference screenshot open beside it during each step:

- [ ] **Login screen parity** — navigate to `/` in a first-visit state and compare against `design-guidelines/Screenshots/Screenshot1 - Login.png`. Verify the brand mark, welcome card proportions, heading/copy spacing, focused input treatment, color palette row, primary button, and helper copy placement match the reference.
- [ ] **Returning homepage parity** — log in and compare `/` against `design-guidelines/Screenshots/Screenshot2 - Board selector.png`. Verify the top-right identity pill, returning-user heading block, dashed new-board card, board-list shell, search affordance, selected row background, metadata alignment, and avatar stack match the reference.
- [ ] **Default board parity** — open `/board/{guid}` in the reference default state and compare against `design-guidelines/Screenshots/Screenshot3 - Full board view.png`. Verify the share pill, latency pill, collaborators pill, identity pill, left tool rail, zoom cluster, dot-grid canvas treatment, and overall floating-panel spacing/placement match the reference. If seeded fixture content is used, verify the board content arrangement needed for the screenshot is reproduced as expected.
- [ ] **Pencil + shortcuts parity** — activate the pencil tool, trigger the copied-link state, and open the shortcuts modal so the board matches `design-guidelines/Screenshots/Screenshot4 - Keyboard Shortcut Menu.png`. Verify the active tool state, pencil flyout, dimmed overlay, modal shell, headings, shortcut keycaps, and close affordance match the reference.
- [ ] **Iconography spot check** — across homepage and board states, confirm the rendered icons match the reference `design-guidelines/project/icons.jsx` shapes for tools, share, keyboard, logout, zoom, and board-row actions.

## Completion Rule

This story is complete only when the relevant items in `specs/08-visual-design-tokens.spec.md` and `specs/07-browser-testing-and-qa.spec.md` have been checked `- [X]` and the manual Chrome DevTools browser test described above has been run successfully.
