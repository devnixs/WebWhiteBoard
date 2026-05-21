---
area: selection-editing-and-ordering
owners:
  - frontend
  - backend
status: active
depends_on:
  - specs/00-foundations.spec.md
  - specs/03-tools-and-drawing.spec.md
  - specs/05-navigation-shortcuts-and-input.spec.md
---

- [X] SELECT-001: Any selectable board item can be selected by clicking it.
- [X] SELECT-002: A selected item displays a visible bounding box.
- [X] SELECT-003: The bounding box supports resizing the selected item.
- [X] SELECT-004: The bounding box supports rotation of the selected item.
- [X] SELECT-005: Repeated rotation gestures keep each selected text block, shape, and image anchored around its own visual center instead of drifting around an expanded rotated bounding box.
- [X] SELECT-006: A visible rotate handle or icon is shown around the selection bounds.
- [ ] SELECT-007: Selection bounds, resize handles, rotate controls, and multi-select visuals are rendered by the application's native canvas interaction layer and remain aligned while the board is panned or zoomed.
- [X] SELECT-008: Multiple items can be added to the current selection by using `Ctrl` on Windows/Linux or `Cmd` on macOS while selecting.
- [X] SELECT-009: When multiple items are selected, each item’s own bounds remain visible.
- [X] SELECT-010: When multiple items are selected, a combined bounding box for the whole selection is also shown.
- [X] SELECT-011: Rectangle marquee selection remains reliable after an item has been rotated, selecting visibly enclosed rotated elements without requiring the user to hunt for an unrotated bounding box corner or center point.
- [X] SELECT-012: Right-clicking a supported item opens a context menu near the interaction point.
- [X] SELECT-013: The context menu supports moving an item to the front.
- [X] SELECT-014: The context menu supports moving an item to the back.
- [X] SELECT-015: The context menu supports duplicating an item.
- [X] SELECT-016: The context menu supports deleting an item.
- [X] SELECT-017: The context menu displays a color palette when the selected item type supports color changes.
- [X] SELECT-018: The context menu color palette shows the available board colors as direct choices instead of applying a random or implicit next color.
- [X] SELECT-019: Choosing a color from the context menu palette updates the selected items to that exact color.
- [X] SELECT-020: The context menu supports increasing font size when the selected item supports text sizing.
- [X] SELECT-021: The context menu supports increasing draw size when the selected item supports stroke sizing.
- [X] SELECT-022: The context menu supports changing font family when the selected item supports font changes.
- [X] SELECT-023: Pressing `Delete` on Windows/Linux or the platform-appropriate delete key on macOS removes the current selection.
- [X] SELECT-024: Copying the current selection with `Ctrl+C` on Windows/Linux or `Cmd+C` on macOS stores a portable representation that can be pasted back into the board.
- [X] SELECT-025: Pasting a copied selection with `Ctrl+V` on Windows/Linux or `Cmd+V` on macOS creates duplicated board items with preserved editable properties.
- [X] SELECT-026: Double-clicking an existing text element with the select/cursor tool enters inline edit mode for that element, placing a blinking editable caret inside the existing text so the user can modify it without switching to the text tool.
