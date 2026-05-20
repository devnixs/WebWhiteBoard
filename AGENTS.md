# AGENTS.md

## Purpose

This repository builds an online collaborative whiteboard where users can draw, write, and interact together in real time.

Agents working in this repo must treat the spec files in `specs/` as the source of truth for product behavior. Implementation changes are expected to follow spec changes, not bypass them.

## Product Summary

- The app has two user-facing routes only:
- `/` for login and homepage flows.
- `/board/{guid}` for the board view.
- Users identify themselves by entering a name on first load.
- The name is stored in local storage and used as the local session identity.
- Users are assigned a random color at login.
- Boards are collaborative, real-time, and shareable by URL.
- The board canvas is the primary UI and should remain visually dominant.

## Required Stack

- Frontend: React + Vite.
- Board runtime: native HTML canvas.
- Backend: ASP.NET Core 10.
- Database: PostgreSQL.
- Real-time transport: WebSockets.

## Architecture Rules

- Prioritize low-latency drawing and local responsiveness above secondary concerns.
- Active boards should live in memory for fast interaction.
- Board state should be persisted to PostgreSQL asynchronously.
- Persistence must not block drawing interactions.
- Business logic belongs in the backend.
- Do not duplicate domain logic across frontend, backend handlers, and persistence code.
- Board operations should be represented as serializable actions whenever practical.
- Design for extensibility so tools, actions, shapes, and collaboration features can grow without reworking core flows.
- Features must not silently break previously specified behavior.

## Spec Workflow

- Before implementing a major feature or behavior change, update the relevant file in `specs/`.
- Keep specs split by major feature area.
- Spec checklist items use `- [ ]` for pending work and `- [X]` for implemented work.
- If behavior changes, reflect it in the specs in the same change set.
- Treat `specs/` as a maintained contract, not a one-time planning artifact.

## Current Spec Files

- `specs/00-foundations.spec.md`
- `specs/01-login-homepage-and-routing.spec.md`
- `specs/02-board-layout-and-panels.spec.md`
- `specs/03-tools-and-drawing.spec.md`
- `specs/04-selection-editing-and-ordering.spec.md`
- `specs/05-navigation-shortcuts-and-input.spec.md`
- `specs/06-collaboration-persistence-and-backend.spec.md`
- `specs/07-browser-testing-and-qa.spec.md`
- `specs/08-visual-design-tokens.spec.md`
- `specs/09-deployment-and-packaging.spec.md`
- `specs/10-board-assets-and-uploads.spec.md`

## Frontend Guidance

- Do not add a fixed header.
- Use compact floating panels and keep them as small as practical.
- Avoid obstructing the canvas unnecessarily.
- The top-left area contains sharing controls.
- The left side contains tools and tool-specific option panels.
- The bottom-right area contains zoom information and shortcut help.
- The top-right area contains user identity, logout, and WebSocket latency.
- The board should feel natural on desktop and laptop trackpads.
- Prevent accidental browser back navigation during two-finger canvas movement.
- Support Windows/Linux shortcuts and macOS equivalents.

## Tooling and Behavior Expectations

- The select tool is the default board tool.
- Planned tools include select, pencil, text, shapes, eraser, and lasso.
- Image paste via clipboard must be supported.
- Selection flows must support resize, rotate, multi-select, and context-menu editing actions.
- Collaboration must show remote cursors with participant names and colors.

## Chrome DevTools MCP Recovery

- Codex uses `chrome-devtools-mcp` through a live stdio transport. If an agent kills `chrome-devtools-mcp` directly with commands like `pkill -f chrome-devtools-mcp`, the MCP transport for the current Codex session is severed and later browser tool calls fail with `Transport closed`.
- The Chrome DevTools MCP server also uses a shared profile at `~/.cache/chrome-devtools-mcp/chrome-profile`. When that browser instance exits badly, Chrome singleton files such as `SingletonLock`, `SingletonSocket`, and `SingletonCookie` may remain and the next browser launch can fail with `The browser is already running for ... chrome-profile`.
- Do not try to recover by rebooting the computer. A full reboot is unnecessary for this failure mode.
- Recovery step 1: Do not kill `chrome-devtools-mcp` from inside the active Codex session unless you are intentionally giving up on browser tools for that session.
- Recovery step 2: If you see `The browser is already running for ... chrome-profile`, inspect for lingering Chrome processes using that profile and stop those Chrome helper processes first.
- Recovery step 3: If no Chrome process is still using the profile, remove the stale singleton entries from `~/.cache/chrome-devtools-mcp/chrome-profile`: `SingletonLock`, `SingletonSocket`, `SingletonCookie`, and `RunningChromeVersion`.
- Recovery step 4: If browser tool calls already fail with `Transport closed`, restart Codex or start a fresh Codex session so the MCP server is relaunched and the stdio connection is re-established. Restarting the app/session is the required fix; restarting macOS is not.
- Recovery step 5: After restarting Codex, retry the browser action before falling back to other tooling.

## Design Guidance

- Existing React components in `design-guidelines/project` are reference material only.
- Do not depend directly on those files at runtime.
- If patterns or components are copied from that area, clean them up for production use.
- Avoid inline CSS in final application code unless there is a compelling reason.
- Preserve a compact, intentional UI with the canvas as the primary focus.

## Testing Requirements

- Every major feature requires end-to-end browser coverage.
- End-to-end tests must run against a real backend.
- End-to-end tests must run against a real PostgreSQL database.
- Do not replace PostgreSQL with an in-memory database for feature validation.
- Major features must also be manually exercised in a browser after implementation.
- Manual testing should include real UI interactions such as clicking, typing, sharing links, drawing, selecting, and collaboration flows.
- Regressions against existing spec behavior should block completion.

## Agent Working Style

- Prefer small, coherent changes that map clearly to spec items.
- Keep code quality high; do not take shortcuts that weaken maintainability.
- Avoid duplicating code when a shared abstraction belongs in the backend or common layers.
- When adding functionality, think through future extension points.
- If implementation and spec diverge, fix the spec or the code explicitly rather than leaving them inconsistent.
