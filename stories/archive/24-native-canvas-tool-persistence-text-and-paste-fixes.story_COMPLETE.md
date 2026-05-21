# Story 24: Native Canvas Tool Persistence, Text Tool, And Image Paste Fixes

## Goal

- [X] Fix three regressions in the native HTML canvas runtime so the pencil and other tools stay active across repeated uses, the text tool actually places editable text, and pasting an image from the clipboard inserts the image onto the board.

## Scope

- [X] Stop auto-switching the active tool back to `select` after a single pencil stroke, shape placement, or other one-shot tool interaction in `frontend/src/components/board/BoardScreen.tsx`. The tool should only change when the user explicitly switches tools.
- [X] Restore the text tool: clicking the canvas with the text tool active must open a focused text editor at the click location, accept typed input, and commit on blur or `Cmd/Ctrl+Enter`. Investigate why the current flow does not produce a usable text item and fix the root cause (pointer capture, focus, blur-before-input, shortcut interception, etc.).
- [X] Restore image paste from the system clipboard: confirm the `paste` event reaches the board screen handler when the body is focused, that `event.clipboardData.items` exposes the image, that the upload completes, and that the resulting image element is appended to the document and rendered on the native canvas. Diagnose and fix the root cause rather than papering over symptoms.

## Relevant Specs

- [X] `specs/03-tools-and-drawing.spec.md`
- [X] `specs/10-board-assets-and-uploads.spec.md`

## Acceptance Notes

- [X] Keep the active tool stable: after a pencil stroke, shape draw, eraser action, or lasso pass, the previously selected tool remains active for the next interaction.
- [X] Pressing `Escape` or selecting another tool from the rail or via keyboard shortcut is still the supported way to switch back to the select tool.
- [X] The text editor must not be dismissed by the click that opened it. Empty commits (blur with no text) should silently close without leaving an empty text element behind.
- [X] Image paste must continue to dedupe (no double-insert) and must surface upload errors through the existing upload notice surface.
- [X] Do not regress the existing pencil color stability across remote document updates or the duplicate-free paste behavior covered by stories 12 and 15.

## Browser Test

- [X] Start the backend and frontend, then open a board in Chrome DevTools at `/board/{guid}`.
- [X] Select the pencil tool. Draw three separate strokes in succession without re-clicking the pencil button — every stroke must be drawn with the pencil and the pencil tool indicator must remain active.
- [X] Repeat the same multi-use check with the shapes tool (drag out three shapes in a row) and the eraser tool (erase several strokes in sequence).
- [X] Select the text tool, click an empty area of the canvas, type a short phrase, and click outside to commit. Confirm the text element appears on the canvas with the chosen font and size. Repeat at a second location without re-selecting the text tool to confirm the tool stays active.
- [X] Copy an image from another source (for example, right-click an image on a webpage and choose Copy Image), focus the board page, and press `Cmd+V` (macOS) or `Ctrl+V` (Windows/Linux). Confirm the image uploads and appears exactly once on the board near the cursor position, and that other connected participants see the same image once the upload completes.
- [X] Confirm `Escape` still returns to the select tool and that pressing `V`, `P`, `T`, `R`, `E`, `L`, and `H` continues to switch tools as documented in the shortcuts modal.

## Completion Rule

- [X] This story is complete only when the relevant items in `specs/03-tools-and-drawing.spec.md` and `specs/10-board-assets-and-uploads.spec.md` have been checked `- [X]` and the manual Chrome DevTools browser test described above has been run successfully.
