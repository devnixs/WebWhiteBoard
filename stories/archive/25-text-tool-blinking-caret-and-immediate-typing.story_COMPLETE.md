# Story 25: Text Tool Blinking Caret And Immediate Typing

## Goal

- [X] Make the text tool behave like a standard text-editor insertion point: with the text tool active, a single click on the canvas places a visible blinking caret (`|`) at the click location, and the user can begin typing immediately on the keyboard without any extra click, focus step, or modal interaction.

## Scope

- [X] Diagnose the current text-tool flow in `frontend/src/components/board/BoardScreen.tsx` (and any related native-canvas code in `frontend/src/components/board/NativeBoardCanvas.tsx` / `frontend/src/app/canvasRuntime.ts`) and identify why typing after clicking with the text tool does not currently work end-to-end for the user. Treat this as a real regression, not a perception issue.
- [X] On a text-tool click, place the keyboard focus on the text input target synchronously with the click so that the very next keystroke is captured, with no race between click handlers, blur handlers, pointer-capture release, or canvas-level keyboard shortcuts.
- [X] Render a visible blinking caret at the click location while the input is empty so the user has a clear visual cue that the position is active. The caret should match the configured text size and color so it looks like a real insertion point, not a fixed-size overlay.
- [X] Ensure that the canvas-level keyboard shortcut layer does not swallow letter keys, space, punctuation, or other printable characters while a text input is the active target — only when the text input is active.
- [X] Ensure that clicking on a fresh empty location while the text input is already open commits or cancels the current empty input cleanly (per existing rule: empty input closes without leaving an empty element behind) and then opens a new caret at the new location, keeping the text tool active.
- [X] Pressing `Escape` while the caret is active and the input is empty must close the input without creating an empty text element and without leaving a residual caret artifact on the canvas.

## Relevant Specs

- [X] `specs/03-tools-and-drawing.spec.md`

The specifically affected spec items in `specs/03-tools-and-drawing.spec.md` are the ones describing:

- Clicking the canvas with the text tool active opens an editable text input at the click location.
- A blinking text caret (`|`) appears at the click location.
- The user can start typing immediately without any further click or focus step.
- The caret blinks while the input is empty.
- `Escape` closes an empty input cleanly.
- Committing text renders the text element and removes the caret indicator.

## Acceptance Notes

- [X] The flow must be: select text tool → click canvas → see blinking caret → start typing → see characters appear at the caret position. No intermediate clicks or focus steps are allowed in that flow.
- [X] Do not regress the existing rule from story 24 that the text tool stays active across multiple uses — placing one text item must not silently switch the active tool back to select.
- [X] Do not regress the existing rule that empty commits do not leave an empty text element behind.
- [X] Do not regress the existing rule that the pencil color, text settings, and shape settings stay stable across local edits and incoming collaboration updates.
- [X] Do not regress duplicate-free image paste behavior covered by stories 12 and 24.
- [X] If the fix requires changes to keyboard-shortcut handling so that shortcut keys are ignored while a text input is active, scope those changes narrowly so other tool shortcuts continue to work when no text input is active.

## Browser Test

- [X] Start the backend and frontend, then open a board in Chrome DevTools at `/board/{guid}`.
- [X] Select the text tool from the left tool rail.
- [X] Click an empty area of the canvas. Confirm a blinking `|` caret appears at the click location at the configured text size and color.
- [X] Without clicking anywhere else, type a short phrase on the keyboard. Confirm the characters appear at the caret position in real time as you type.
- [X] Click outside the text input to commit. Confirm the text element renders as a permanent element on the canvas with the chosen font and size, and that the blinking caret indicator disappears.
- [X] With the text tool still active (no re-selection from the rail), click a second empty location, confirm a new blinking caret appears, type, and commit again. Confirm the text tool remained active across both placements.
- [X] Repeat once more, but this time press `Escape` immediately after the caret appears, without typing anything. Confirm the caret disappears, no empty text element is created on the canvas, and the text tool remains active.
- [X] While a caret is active and empty, press a letter key (for example `p`). Confirm the letter is typed into the text input and does not switch tools via the keyboard shortcut layer.
- [X] Confirm that with no text caret active, the keyboard shortcuts `V`, `P`, `T`, `R`, `E`, `L`, and `H` still switch tools as documented in the shortcuts modal.

## Completion Rule

- [X] This story is complete only when the relevant items in `specs/03-tools-and-drawing.spec.md` have been checked `- [X]` and the manual Chrome DevTools browser test described above has been run successfully.
