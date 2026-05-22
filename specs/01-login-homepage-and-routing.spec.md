---
area: login-homepage-and-routing
owners:
  - frontend
  - backend
status: active
depends_on:
  - specs/00-foundations.spec.md
  - specs/06-collaboration-persistence-and-backend.spec.md
---

- [X] ROUTE-001: When a user loads the app for the first time, the app prompts for the user name before entering the main experience.
- [X] ROUTE-002: The chosen user name is stored in local storage and reused across sessions until the user logs out.
- [X] ROUTE-003: Logging in preselects a random cursor color, lets the user choose a different color before continuing, and persists the chosen color for the current local session identity.
- [X] ROUTE-004: The stored local identity is used as the session identity for collaboration features.
- [X] ROUTE-005: If a user opens a board through a shareable `/board/{guid}` link and has not yet entered a name, the login flow completes first and then joins that board immediately.
- [X] ROUTE-006: If a user reaches `/` directly, the homepage allows the user to create a new board or open an existing known board.
- [X] ROUTE-007: The homepage lists only boards that the user has previously connected to.
- [X] ROUTE-008: When a user creates a board, that board is added to the user’s locally stored known board list.
- [X] ROUTE-009: When a user joins a board, that board is added to the user’s locally stored known board list.
- [X] ROUTE-010: Returning to `/` shows previously known boards from local storage without exposing boards the user has never connected to.
- [X] ROUTE-011: The application exposes only two user-facing routes: `/` for the homepage and `/board/{guid}` for the board view.
- [X] ROUTE-012: Attempting to navigate to an unknown route is handled in a way that preserves the two-route model and guides the user back into a valid flow.
- [X] ROUTE-013: The browser tab title is `WebWhiteBoard` on both the homepage and board route.
- [X] ROUTE-014: The visible application branding uses `WebWhiteBoard` consistently across the authenticated and unauthenticated flows.
- [X] ROUTE-015: The current user name is displayed in the top-right floating panel while authenticated.
- [X] ROUTE-016: The top-right floating panel includes a logout action that clears the local identity and returns the user to the unauthenticated flow.
