# Story 07: Realtime Collaboration And Persistence

## Goal

Implement authoritative real-time multi-user board collaboration, remote cursor presence, live latency visibility, in-memory active boards, and asynchronous PostgreSQL persistence.

## Scope

- Allow multiple users to connect to the same board in real time.
- Synchronize board actions over WebSockets.
- Show remote participant cursors, names, and colors.
- Show current WebSocket latency in the top-right panel.
- Validate incoming board mutations on the backend before they are accepted into authoritative state.
- Keep active board state in memory for responsiveness.
- Persist board state asynchronously to PostgreSQL.
- Restore persisted board state after reconnects or process restarts.

## Relevant Specs

- `specs/06-collaboration-persistence-and-backend.spec.md`

## Acceptance Notes

- Local responsiveness must be preserved even during network delay or persistence lag.
- Collaboration and persistence code should not duplicate domain logic in separate layers.
- Recovery and reconnect behavior should faithfully restore board content.

## Completion Rule

- This story is complete only when the relevant items in `specs/06-collaboration-persistence-and-backend.spec.md` have been checked `- [X]`.
