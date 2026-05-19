# Story 01: Foundation And Architecture

## Goal

Establish the project structure and core architectural rules for a React + Vite frontend, an ASP.NET Core 10 backend, PostgreSQL persistence, WebSocket collaboration, and an extensible serializable board action model.

## Scope

- Set up the frontend and backend project layout.
- Establish shared architectural patterns for board actions, backend-owned business logic, persistence boundaries, and in-memory active board handling.
- Set up the baseline for asynchronous persistence and future collaboration flows.
- Ensure copied design-guideline code is cleaned up for production use and does not rely on inline CSS.

## Relevant Specs

- `specs/00-foundations.spec.md`

## Acceptance Notes

- The solution structure should make later stories additive rather than requiring architectural rework.
- The backend should be positioned as the source of truth for business rules.
- The codebase should make it clear where serializable board actions are defined and how they move through the system.

## Completion Rule

- This story is complete only when the relevant items in `specs/00-foundations.spec.md` have been checked `- [X]`.
