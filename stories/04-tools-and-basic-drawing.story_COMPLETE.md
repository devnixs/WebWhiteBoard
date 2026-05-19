# Story 04: Tools And Basic Drawing

## Goal

Implement the core toolset and basic board authoring behaviors for drawing, text, shapes, erasing, lasso selection entry, image paste, and infinite-canvas work.

## Scope

- Make select the default active tool.
- Add pencil, text, shapes, eraser, and lasso tools to the left tool panel.
- Add tool-specific floating settings panels for pencil, text, and eraser behavior.
- Support shape selection within the shapes tool.
- Support infinite canvas authoring.
- Support image paste using `Ctrl+V` on Windows/Linux and `Cmd+V` on macOS.
- Support shift-constrained straight-line pencil drawing with orthogonal snapping.

## Relevant Specs

- `specs/03-tools-and-drawing.spec.md`

## Acceptance Notes

- Drawing interactions must remain responsive during background sync and persistence work.
- Tool settings should stay compact and consistent with the floating-panel design.
- Infinite canvas behavior should feel native rather than artificially bounded.

## Completion Rule

- This story is complete only when the relevant items in `specs/03-tools-and-drawing.spec.md` have been checked `- [X]`.
