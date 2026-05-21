# Story 22: Native HTML Canvas Tools And Selection

## Goal

- [X] Rebuild the core authoring and editing interactions on top of the native HTML canvas runtime so users retain the current toolset and selection capabilities after `tldraw` is removed.

## Scope

- [X] Implement native-canvas support for select, pencil, text, shapes, eraser, and lasso interactions.
- [X] Rebuild selection bounds, resize handles, rotate controls, and multi-select visuals so they stay aligned while the board is panned and zoomed.
- [X] Preserve keyboard shortcuts, clipboard flows, context-menu editing actions, and tool-settings behavior for the native runtime.
- [X] Ensure the selected pencil color, size, text settings, and shape settings remain stable across local edits and incoming collaboration updates.
- [X] Preserve duplicate-free image paste behavior and native rendering of pasted assets inside the new board engine.
- [X] Add desktop select-tool marquee selection on primary-button drag without requiring the dedicated lasso tool.
- [X] Add desktop secondary-button drag panning that matches the existing hand-tool and middle-click camera movement.
- [X] Reduce desktop `Ctrl` + mouse wheel zoom step size to 10% per wheel step.

## Relevant Specs

- [X] `specs/03-tools-and-drawing.spec.md`
  - `TOOLS-020`
  - `TOOLS-023`
  - `TOOLS-028`
  - `TOOLS-041`
- [X] `specs/04-selection-editing-and-ordering.spec.md`
  - `SELECT-007`
- [X] `specs/05-navigation-shortcuts-and-input.spec.md`
  - `NAV-004`
  - `NAV-011`
  - `NAV-012`
- [X] `specs/10-board-assets-and-uploads.spec.md`
  - `ASSET-010`
  - `ASSET-015`

## Acceptance Notes

- [X] The user-facing tool inventory should remain the same unless the specs are explicitly changed again.
- [X] Text editing must retain predictable native input behavior and should not let canvas-level shortcuts interfere while a text item is being edited.
- [X] Selection, resize, and rotate behavior should be geometry-correct for both single-select and multi-select cases rather than approximated loosely.
- [X] Workflow cleanup review confirmed this story is now `_COMPLETE` because referenced spec IDs are implemented and the required Playwright, manual browser, and full e2e verification items are complete.

## Playwright Test

- [X] Add or extend Playwright coverage for the native canvas tool and selection flows, including drawing, text creation, shape placement, selection editing, asset rendering, and persisted reload behavior on `/board/{guid}`.
- [X] Ensure the coverage runs against the real backend and PostgreSQL-backed e2e environment.

## Browser Test

- [X] Open a board in Chrome DevTools and exercise each primary tool: select, pencil, text, shapes, eraser, and lasso.
- [X] Draw freehand strokes, hold `Shift` to constrain a stroke, create text, place multiple shapes, and paste an image with `Cmd+V` or `Ctrl+V`; confirm each item renders once on the native canvas.
- [X] Select single and multiple items, then resize, rotate, duplicate, recolor, reorder, and delete them using both visible controls and the context menu where applicable.
- [X] Verify keyboard shortcuts, trackpad interactions, and text-editing focus behavior still feel correct while using the native canvas runtime.
- [X] With the select tool active, drag on empty board space to box-select multiple elements, then drag with the secondary mouse button to pan the camera and confirm the behavior matches the hand tool feel.
- [X] Hold `Ctrl` and rotate the mouse wheel on desktop hardware; confirm each wheel step zooms by about 10% and stays centered on the pointer location.

## E2E Regression

- [X] Run `cd e2e && ./node_modules/.bin/playwright test` and require the entire suite to pass with no regressions.

## Completion Rule

- [X] This story is complete only when the referenced spec IDs have been checked `- [X]`, the Playwright coverage described above has been added or extended and passes, the manual Chrome DevTools browser test described above has been run successfully, and the full e2e suite passes with no regressions.
