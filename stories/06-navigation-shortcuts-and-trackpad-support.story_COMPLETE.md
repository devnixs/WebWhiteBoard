# Story 06: Navigation Shortcuts And Trackpad Support

## Goal

Make canvas movement, zooming, shortcut behavior, and laptop trackpad interaction feel correct across platforms without breaking normal browser or text-editing expectations.

## Scope

- [X] Support two-finger board movement on laptop trackpads.
- [X] Support zoom gestures consistent with platform expectations.
- [X] Prevent accidental browser history navigation during board panning.
- [X] Implement Windows/Linux shortcut support and macOS equivalents.
- [X] Add a shortcut reference popup from the bottom-right panel.
- [X] Add any additional convenient shortcuts that fit the board model and do not conflict with native expectations.
- [X] Ensure text-editing flows keep expected native keyboard behavior.

## Relevant Specs

- `specs/05-navigation-shortcuts-and-input.spec.md`

## Acceptance Notes

- Trackpad behavior should feel deliberate and safe, especially around browser back navigation.
- Shortcuts should be discoverable through the in-product popup.
- Canvas commands and text editing must not fight for the same key handling unintentionally.

## Completion Rule

- This story is complete only when the relevant items in `specs/05-navigation-shortcuts-and-input.spec.md` have been checked `- [X]`.
