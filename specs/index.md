# Specs Index

Use this index to find the product contract files that matter for a change before reading the full `specs/` directory.

## Spec Areas

- `specs/00-foundations.spec.md` - foundational architecture and product constraints. ID prefix: `FOUND`.
- `specs/01-login-homepage-and-routing.spec.md` - login, homepage, board creation, and route behavior. ID prefix: `ROUTE`.
- `specs/02-board-layout-and-panels.spec.md` - board layout, floating controls, and panel placement. ID prefix: `LAYOUT`.
- `specs/03-tools-and-drawing.spec.md` - tool inventory, drawing behavior, native canvas rendering, and authoring flows. ID prefix: `TOOLS`.
- `specs/04-selection-editing-and-ordering.spec.md` - selection, resize, rotation, clipboard editing, context menus, and ordering. ID prefix: `SELECT`.
- `specs/05-navigation-shortcuts-and-input.spec.md` - panning, zooming, keyboard shortcuts, and input handling. ID prefix: `NAV`.
- `specs/06-collaboration-persistence-and-backend.spec.md` - collaboration, WebSocket behavior, persistence, and backend ownership. ID prefix: `COLLAB`.
- `specs/07-browser-testing-and-qa.spec.md` - browser, e2e, manual QA, and integration validation requirements. ID prefix: `QA`.
- `specs/08-visual-design-tokens.spec.md` - visual tokens and design consistency. ID prefix: `DESIGN`.
- `specs/09-deployment-and-packaging.spec.md` - Docker, CI, deployment, and packaging behavior. ID prefix: `DEPLOY`.
- `specs/10-board-assets-and-uploads.spec.md` - image paste, board assets, upload behavior, and asset persistence. ID prefix: `ASSET`.

## Stable Requirement IDs

- New and changed checklist items should include a stable ID in the form `PREFIX-001`.
- Keep IDs stable when wording changes; create a new ID only when the behavior is a new requirement.
- Stories should reference exact IDs under `Relevant Specs`, not only spec file paths.
- Existing checklist items without IDs are legacy items. Add IDs when a story touches them.

## Frontmatter

Every spec file starts with YAML frontmatter:

- `area`: stable feature-area slug used for routing and discovery.
- `owners`: one or more responsible domains.
- `status`: one of `active`, `draft`, `deprecated`, or `archived`.
- `depends_on`: related spec paths that should be reviewed for cross-cutting changes, or `[]`.

## Owner Values

- `frontend`: React, Vite, native canvas runtime, styling, browser input, and user-visible board behavior.
- `backend`: ASP.NET Core APIs, WebSockets, domain validation, persistence, and server-side asset handling.
- `qa`: Playwright, manual browser verification, test plans, and regression coverage.
- `devops`: Docker, CI, packaging, deployment, and runtime configuration.
- `product`: product semantics, user flows, acceptance criteria, and cross-feature behavior decisions.
