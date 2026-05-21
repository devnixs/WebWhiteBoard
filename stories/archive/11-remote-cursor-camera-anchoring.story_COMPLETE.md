# Story 11: Remote Cursor Camera Anchoring

## Goal

- [X] Keep remote participant cursors visually anchored to the same board position while the local participant pans or zooms the board camera.

## Scope

- [X] Update the `/board/{guid}` collaboration view so remote cursor overlays recompute their screen position during local camera movement.
- [X] Preserve the existing remote cursor name and color treatment while fixing the camera-relative positioning behavior.
- [X] Update collaboration QA expectations for cursor anchoring during multi-user navigation.

## Relevant Specs

- [X] `specs/06-collaboration-persistence-and-backend.spec.md`
- [X] `specs/07-browser-testing-and-qa.spec.md`

## Acceptance Notes

- [X] Remote cursor coordinates remain stored in board space and should only be transformed into screen space at render time.
- [X] Local camera changes must not require a new remote cursor network event before the overlay moves into the correct on-screen position.

## Browser Test

- [X] Open the application in a Chrome DevTools browser instance with two sessions connected to the same `/board/{guid}` route.
- [X] In one session, leave the pointer still over a visible piece of board content so the remote cursor position is easy to track.
- [X] In the other session, pan the board left, right, up, and down, then zoom in and out.
- [X] Confirm the remote cursor stays attached to the same board location relative to nearby shapes or strokes instead of drifting with the local camera.

## Completion Rule

- [X] This story is complete only when the relevant items in `specs/06-collaboration-persistence-and-backend.spec.md` and `specs/07-browser-testing-and-qa.spec.md` have been checked `- [X]` and the manual Chrome DevTools browser test described below has been run successfully.
