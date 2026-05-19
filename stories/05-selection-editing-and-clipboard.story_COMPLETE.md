# Story 05: Selection Editing And Clipboard

## Goal

Implement rich object manipulation for selecting, resizing, rotating, multi-selecting, reordering, editing, duplicating, deleting, and copy-pasting board items.

## Scope

- [X] Support click-to-select for board items.
- [X] Show per-item selection bounds and rotate handles.
- [X] Support resize and rotate interactions.
- [X] Support additive multi-select with `Ctrl` on Windows/Linux and `Cmd` on macOS.
- [X] Show both item-level bounds and combined bounds for multi-selection.
- [X] Add right-click context-menu actions for front/back ordering, duplicate, delete, color changes, text-size changes, draw-size changes, and font-family changes where relevant.
- [X] Support keyboard delete behavior for the current selection.
- [X] Support copy and paste of selected items while preserving editable properties.

## Relevant Specs

- `specs/04-selection-editing-and-ordering.spec.md`

## Acceptance Notes

- Editing actions should respect item capabilities instead of showing irrelevant options indiscriminately.
- Clipboard flows should preserve enough item data to make pasted results truly editable.
- Selection affordances should remain clear even for multiple selected items.

## Completion Rule

- This story is complete only when the relevant items in `specs/04-selection-editing-and-ordering.spec.md` have been checked `- [X]`.
