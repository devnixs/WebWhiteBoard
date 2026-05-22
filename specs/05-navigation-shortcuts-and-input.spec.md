---
area: navigation-shortcuts-and-input
owners:
  - frontend
status: active
depends_on:
  - specs/00-foundations.spec.md
  - specs/02-board-layout-and-panels.spec.md
  - specs/03-tools-and-drawing.spec.md
  - specs/04-selection-editing-and-ordering.spec.md
---

- [X] NAV-001: On laptop trackpads, moving around the infinite board is supported with a two-finger gesture.
- [X] NAV-002: Zooming is supported with trackpad pinch gestures or the platform-appropriate pan and zoom gestures expected by users.
- [X] NAV-003: Trackpad interactions are configured so attempting to pan left with two fingers does not trigger browser history navigation away from the board.
- [X] NAV-004: The native canvas camera supports smooth pointer, wheel, and trackpad pan-and-zoom behavior across supported desktop browsers without desynchronizing board content, selection overlays, or remote cursors.
- [X] NAV-005: Keyboard shortcuts support both Windows/Linux conventions and macOS equivalents, replacing `Ctrl` with `Cmd` where appropriate.
- [X] NAV-006: The shortcuts popup documents the supported shortcuts for all major board operations.
- [X] NAV-007: The application includes convenient standard shortcuts beyond the explicitly requested ones when they fit the product model and do not conflict with browser behavior.
- [X] NAV-008: Pressing `A` with no `Ctrl` or `Cmd` modifier selects the arrow tool.
- [X] NAV-009: Shortcut handling is scoped carefully so text editing flows do not lose expected native input behavior.
- [X] NAV-010: Canvas navigation and manipulation shortcuts are implemented in a way that preserves accessibility and predictable focus behavior.
- [X] NAV-011: On desktop browsers, holding `Ctrl` while rotating the mouse wheel zooms the board in 10% increments per wheel step instead of using large jumps.
- [X] NAV-012: On desktop browsers, holding the secondary mouse button while moving the pointer pans the board using the same camera behavior as the hand tool and existing middle-click pan interaction.
- [X] NAV-013: Pressing `Ctrl+Z` on Windows/Linux or `Cmd+Z` on macOS while the board has focus undoes only the current user's most recent local board content action, preserving unrelated actions that collaborators committed before or after that local action.
- [X] NAV-014: Pressing `Ctrl+Y` on Windows/Linux or `Cmd+Shift+Z` on macOS while the board has focus redoes the most recently undone local board content action, unless a new local content action has cleared the redo stack.
