# Story 31: Collapsible Tool Settings Panel

## Goal

Make the tool settings panel on the left collapsible so users can reclaim canvas real estate without switching away from their current tool. Each tool that has a settings panel (pencil, text, shapes, eraser, lasso) gets a collapse/expand toggle. Closing the panel hides all option controls; reopening it restores them. The collapsed state resets whenever a different tool is selected.

## Scope

- Add a collapse toggle button to `ToolSettingsPanel` in `frontend/src/App.tsx`.
- Track `isCollapsed` state inside `ToolSettingsPanel` (or at the `BoardScreen` level if the reset-on-tool-switch rule is easier to implement there).
- When `isCollapsed` is true, render only the narrow panel shell + the toggle button; suppress all `PanelHeader`, `ColorPicker`, `SizePicker`, and `OptionPicker` children.
- Reset collapsed state to `false` whenever `activeTool` changes.
- Style the collapsed panel so it is compact but visually consistent with the rest of the panel system (same border-radius, background, shadow).
- No new dependencies required.

## Relevant Specs

- `specs/02-board-layout-and-panels.spec.md` — four new items added at the bottom
- `specs/03-tools-and-drawing.spec.md` — one new item added at the bottom

## Acceptance Notes

- The tool remains active while the settings panel is collapsed; drawing/typing still uses the last-selected options.
- The toggle button must be accessible (`aria-label="Collapse tool settings"` / `"Expand tool settings"`).
- The panel must not collapse when `activeTool` is `select`, `hand`, or `lasso` with no settings — the panel is already absent for those cases; no toggle is needed.
- Collapsed state is in-memory only; it does not need to survive page refresh.

## Implementation Checklist

- [X] Add `isSettingsPanelCollapsed` state to `BoardScreen` (or as local state inside `ToolSettingsPanel`), defaulting to `false`.
- [X] Reset `isSettingsPanelCollapsed` to `false` in a `useEffect` that depends on `activeTool`.
- [X] Add a collapse toggle button (chevron icon) to `ToolSettingsPanel` that flips the collapsed state.
- [X] Conditionally render the panel contents (`PanelHeader` + pickers) only when not collapsed.
- [X] Style the collapsed state in `App.css` — keep the panel visible but narrow/minimal.
- [X] Verify that drawing behavior is unchanged while the panel is collapsed.
- [X] Check the referenced spec items in `specs/02-board-layout-and-panels.spec.md` (four new items) and `specs/03-tools-and-drawing.spec.md` (one new item) from `- [ ]` to `- [X]`.

## Browser Test

**Route:** `/board/{any-guid}` — log in if prompted.

1. Open a board in Chrome.
2. Click the **Pencil** tool in the left rail. Confirm the settings panel opens showing color and stroke size pickers.
3. Click the collapse toggle (chevron) on the settings panel. Confirm the panel collapses to a minimal strip and the pickers disappear.
4. Draw a stroke on the canvas. Confirm drawing still works with the previously selected color and size.
5. Click the collapse toggle again. Confirm the panel expands and all pickers reappear.
6. Switch to the **Text** tool. Confirm the text settings panel opens fully expanded (collapsed state reset).
7. Collapse the text panel, then switch to **Shapes**. Confirm the shapes panel opens fully expanded.
8. Repeat collapse/expand check for **Eraser** and **Lasso** panels.
9. Switch to **Select** or **Hand** — confirm no collapse toggle appears (those tools have no settings panel).

## Completion Rule

This story is complete only when:
1. All checklist items above are checked `- [X]`.
2. The four new items in `specs/02-board-layout-and-panels.spec.md` and the one new item in `specs/03-tools-and-drawing.spec.md` have been checked `- [X]`.
3. The Chrome DevTools manual browser test described above has been run and all steps pass.
