---
area: board-layout-and-panels
owners:
  - frontend
status: active
depends_on:
  - specs/00-foundations.spec.md
  - specs/03-tools-and-drawing.spec.md
  - specs/05-navigation-shortcuts-and-input.spec.md
---

- [X] LAYOUT-001: The board view does not include a fixed page header.
- [X] LAYOUT-002: The board view uses floating UI panels that occupy minimal space and keep the canvas visually dominant.
- [X] LAYOUT-003: A floating share panel is displayed in the top-left area of the board view.
- [X] LAYOUT-004: Triggering the share action copies the current board URL to the clipboard.
- [X] LAYOUT-005: After copying the board URL, the UI clearly informs the user that the link has been copied.
- [X] LAYOUT-006: A floating tools panel is displayed on the left side of the board view.
- [X] LAYOUT-007: A floating bottom-right panel displays the current zoom level.
- [X] LAYOUT-008: The bottom-right panel includes an affordance to open a shortcut reference popup.
- [X] LAYOUT-009: A floating top-right panel shows the current user name, logout control, and live WebSocket latency indicator.
- [X] LAYOUT-010: The floating panels are visually compact and remain usable on both desktop and laptop-sized viewports.
- [X] LAYOUT-011: The panel system is designed so additional controls can be added later without forcing a redesign of the board shell.
- [X] LAYOUT-012: The board canvas displays faint line-based grid lines behind board content to improve spatial orientation without overpowering drawings or UI panels.
- [X] LAYOUT-013: The grid lines remain barely visible during normal board use so the canvas still feels dominant and drawn content remains easy to read.
- [X] LAYOUT-014: The tool settings panel includes a collapse toggle button that lets the user hide the panel contents.
- [X] LAYOUT-015: When collapsed, the tool settings panel shows only a minimal affordance (the toggle itself); all option pickers and labels are hidden.
- [X] LAYOUT-016: Clicking the collapse toggle again expands the panel and restores all tool settings controls.
- [X] LAYOUT-017: The collapsed or expanded state is remembered while the same tool remains active; switching to a different tool resets the panel to its expanded state.
