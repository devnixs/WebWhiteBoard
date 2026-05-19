# Story 15: Pencil Color Reset on Remote Sync

## Goal

- [ ] Fix the bug where the active pencil color reverts to black after receiving a remote document update, even though the tool panel still shows the user's chosen color.

## Scope

- [ ] Identify the reset path: `applyRemoteDocument` → `editor.loadSnapshot({ document })` → `loadSessionStateSnapshotIntoStore` recreates the `TLInstance` record with default `stylesForNextShape: {}`, discarding the current color/size selection.
- [ ] Add a `reapplyStyles` callback (via `useEffectEvent`) that reads the current `drawColor`, `drawSize`, `textFont`, `textSize`, and `shapeChoice` React state and re-applies them with `editor.setStyleForNextShapes` for whichever tool is active.
- [ ] Call `reapplyStyles` immediately after each of the three `applyRemoteDocument(...)` call sites in the WebSocket message handler (`session.ready`, `board.document.updated`, `board.sync.rejected`).
- [ ] Confirm the tool switch in the initialization `useEffect` (lines 602–612) is also correct: that effect should only run when the editor first mounts, not every time a style preference changes. Consider splitting it into a mount-only effect and separate style-sync effects to avoid spurious `setCurrentTool('select')` calls.

## Relevant Specs

- `specs/03-tools-and-drawing.spec.md`

## Acceptance Notes

- The root cause is in tldraw internals: `loadSessionStateSnapshotIntoStore` calls `store.schema.types.instance.create({ ...preservedPreferences })`, which applies default values for any keys not in `preservedPreferences`. Because `stylesForNextShape` is deliberately excluded from the preserved set (it is marked `false` in `shouldKeyBePreservedBetweenSessions`), the fresh `TLInstance` always has `stylesForNextShape: {}`. Tldraw then falls back to its hardcoded default of 'black' for the next stroke.
- The fix does NOT need to change tldraw internals. Re-calling `editor.setStyleForNextShapes` after each remote load is the correct integration pattern.
- Use `useEffectEvent` for `reapplyStyles` so it captures the current values of `drawColor`, `drawSize`, etc. without being listed as an effect dependency (avoids stale-closure issues).

## Browser Test

- [ ] Open the application in a Chrome DevTools browser instance and navigate to a `/board/{guid}` route.
- [ ] Activate the pencil tool and select blue from the color picker in the settings panel.
- [ ] Draw one stroke — confirm it appears in blue.
- [ ] Simulate a remote document update by dispatching a synthetic `board.document.updated` WebSocket message from the browser console: `__wwbEditor` is exposed on `window` and the board's WebSocket can be intercepted via `__wwbEditor.store`.  
  Alternatively: open the same board URL in a second browser tab, make a drawing stroke there, and observe the first tab receive the update.
- [ ] Immediately draw another stroke in the first tab — confirm it still appears in blue, not black.
- [ ] Repeat the test for `session.ready` (reload the page while the second tab keeps the board alive) — confirm the color persists on reconnect.
- [ ] Confirm the tool settings panel still shows blue as the selected color throughout.

## Completion Rule

- [ ] This story is complete only when the relevant item in `specs/03-tools-and-drawing.spec.md` (pencil color preserved after remote sync) has been checked `- [X]` and the manual Chrome DevTools browser test described above has been run successfully.
