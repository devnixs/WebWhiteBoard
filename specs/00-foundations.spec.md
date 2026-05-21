---
area: foundations
owners:
  - frontend
  - backend
status: active
depends_on: []
---

- [X] FOUND-001: The application is built with a React + Vite frontend, an ASP.NET Core 10 backend, PostgreSQL for persistence, and WebSockets for real-time collaboration.
- [X] FOUND-002: The board authoring surface is implemented with an application-owned native HTML canvas renderer and interaction layer rather than an embedded third-party whiteboard SDK.
- [X] FOUND-003: The architecture prioritizes low-latency drawing interactions, with local responsiveness preserved even while collaboration events are synchronizing.
- [X] FOUND-004: The board canvas is the primary interface and must remain visually unobstructed by large fixed chrome or unnecessary layout containers.
- [X] FOUND-005: The UI uses compact floating panels instead of a fixed header.
- [X] FOUND-006: All major board operations are represented as serializable actions whenever practical so they can be persisted, replayed, synchronized, and extended safely.
- [X] FOUND-007: The board document, runtime state, and collaboration payloads are defined by application-owned schemas so the frontend canvas engine, backend validation, and persistence format can evolve together without depending on a third-party editor snapshot model.
- [X] FOUND-008: Active boards live in memory for responsiveness and are persisted to PostgreSQL asynchronously without blocking user interactions.
- [X] FOUND-009: Business logic lives in the back end rather than being duplicated or embedded inconsistently in the frontend.
- [X] FOUND-010: Code is organized for extensibility so new tools, actions, panels, and board entity types can be added without reworking core flows.
- [X] FOUND-011: Frontend React UI code is decomposed into small, focused components and supporting modules across multiple files so route shells do not accumulate unrelated panels, dialogs, icons, and helper logic in one monolithic file.
- [X] FOUND-012: Features must not silently break previously specified board behavior, and changes must preserve compatibility with the current specs unless the specs are intentionally updated first.
- [X] FOUND-013: Every feature change is driven by an explicit update to the spec files in `specs/`, and implementation is expected to reflect the current specs.
- [X] FOUND-014: Existing React components in `design-guidelines/project` are used only as design guidance, with copied application code cleaned up to match project standards and avoid inline CSS.
