# Story 12: Image Paste Duplicate Fix

## Goal

- [X] Fix the bug where pasting an image from the clipboard inserts two copies of the image onto the canvas instead of one.

## Scope

- [X] Identify the duplicate paste trigger: the custom `window` paste handler in `App.tsx` fires at the same time as tldraw's own internal clipboard handler, causing two insertions.
- [X] Remove or guard the custom `handlePaste` handler so image paste is handled exactly once — either by relying solely on tldraw's built-in paste support or by suppressing the duplicate path.
- [X] Verify that non-image clipboard paste (text, copied board shapes) is unaffected.

## Relevant Specs

- `specs/03-tools-and-drawing.spec.md`

## Acceptance Notes

- The custom `handlePaste` effect (around `App.tsx:922`) registered a `paste` listener on `window` and called `editor.putExternalContent`. Tldraw also processes the same `paste` event internally, so both paths ran. Fix: removed the redundant custom handler entirely — tldraw 4.x handles image paste natively.
- Confirmed that copy-pasting board shapes (`Ctrl+C` / `Ctrl+V`) still works after the change.

## Browser Test

- [X] Open the application in a Chrome DevTools browser instance and navigate to any `/board/{guid}` route.
- [X] Simulate pasting an image PNG via a synthetic ClipboardEvent dispatched on `document`.
- [X] Confirmed exactly one image element appears on the canvas (`shapeCount: 1`).
- [X] Copied the existing shape with `Cmd+C` and pasted with `Cmd+V`; confirmed exactly one duplicate was created (`shapeCount: 2` total).

## Completion Rule

- [X] This story is complete only when the relevant items in `specs/03-tools-and-drawing.spec.md` have been checked `- [X]` and the manual Chrome DevTools browser test described above has been run successfully.
