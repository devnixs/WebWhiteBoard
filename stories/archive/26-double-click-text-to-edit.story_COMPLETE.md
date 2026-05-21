# Story 26: Double-Click Text Element To Edit

## Goal

- [X] Double-clicking an existing text element while the select/cursor tool is active enters inline edit mode for that element, placing a blinking caret inside the existing text so the user can modify it in place without switching to the text tool.

## Scope

- [X] Detect a double-click (`dblclick`) on a text element during select-tool pointer handling in `frontend/src/app/canvasRuntime.ts` (and/or `frontend/src/components/board/NativeBoardCanvas.tsx`).
- [X] On double-click, open the existing text-editing input pre-populated with the element's current text content, with the caret placed at the click position within the text.
- [X] While the element is in edit mode, render it in the same inline-edit style used by the text tool (blinking caret, live character updates) so the experience is consistent.
- [X] Committing the edit (blur or `Cmd/Ctrl+Enter`) replaces the element's text with the edited value and exits edit mode; the select tool remains active.
- [X] Pressing `Escape` during editing restores the original text (no change is committed) and exits edit mode; the select tool remains active.
- [X] Ensure the selection bounding box is hidden while the element is in edit mode and reappears after commit or cancel.
- [X] Do not regress single-click selection, drag-to-move, or any other select-tool interaction for text or non-text elements.
- [X] Do not regress the text-tool flow (click to create new text, blinking caret on empty canvas, Escape to cancel, immediate typing) introduced by stories 24 and 25.

## Relevant Specs

- [X] `specs/04-selection-editing-and-ordering.spec.md`

The specifically affected spec item is:

> Double-clicking an existing text element with the select/cursor tool enters inline edit mode for that element, placing a blinking editable caret inside the existing text so the user can modify it without switching to the text tool.

## Acceptance Notes

- [X] A single click on a text element with the select tool must still only select the element (showing the bounding box); it must not trigger edit mode.
- [X] Double-clicking must not create a new text element at the click location; it must edit the existing one.
- [X] After committing an edit the element's new text must be broadcast over the collaboration WebSocket so remote peers see the updated content.
- [X] The editing flow must respect the current font size and font family already set on the element.

## Browser Test

- [X] Start the backend and frontend, then open a board in Chrome DevTools at `/board/{guid}`.
- [X] With the select tool active, place a text element on the board using the text tool (switch to text tool, click, type "Hello", commit).
- [X] Switch back to the select tool. Single-click the text element. Confirm it is selected (bounding box visible) but no edit mode opens.
- [X] Double-click the same text element. Confirm the bounding box is replaced by an inline edit input pre-filled with "Hello" and a blinking caret is visible inside the text.
- [X] Edit the text — delete "Hello" and type "World". Confirm characters update in real time on the canvas.
- [X] Click outside the element to commit. Confirm the element now reads "World" on the canvas, the bounding box reappears (element still selected), and the select tool is still active.
- [X] Double-click "World" again to re-enter edit mode. Make some changes, then press `Escape`. Confirm the element still reads "World" (original value restored) and edit mode exits cleanly with the select tool still active.
- [X] Open a second browser tab on the same board URL. In tab 1, double-click a text element and edit it, then commit. Confirm the updated text appears in tab 2 without a page reload.
- [X] Confirm that non-text elements (pencil stroke, shape, image) are not affected by double-click — double-clicking them with the select tool should not open any edit input.

## Completion Rule

- [X] This story is complete only when the relevant item in `specs/04-selection-editing-and-ordering.spec.md` has been checked `- [X]` and the manual Chrome DevTools browser test described above has been run successfully.
