# Story 16: Application Title And Branding

## Goal

- [X] Update the user-facing application name so the browser title and relevant visible branding consistently use `WebWhiteBoard`.

## Scope

- [X] Update the browser `<title>` tag for the SPA entry point so the app loads with the `WebWhiteBoard` title.
- [X] Update any runtime title handling or browser tests that still assume an old or placeholder application title.
- [X] Review the homepage and board UI for relevant user-facing application-name references and align them to `WebWhiteBoard` without changing unrelated copy.

## Relevant Specs

- `specs/01-login-homepage-and-routing.spec.md`
- `specs/07-browser-testing-and-qa.spec.md`

## Acceptance Notes

- [X] Treat placeholder scaffolding names such as `frontend` as incorrect user-facing copy and replace them where they affect the running app experience.
- [X] Do not change internal solution, project, namespace, or repository identifiers unless they are part of the user-facing application name.

## Browser Test

- [X] Start the application and open `/` in Chrome DevTools. Confirm the browser tab title shows `WebWhiteBoard` and that the visible app branding on the homepage uses `WebWhiteBoard`.
- [X] Create or open a board so the app navigates to `/board/{guid}`. Confirm the browser tab title still shows `WebWhiteBoard` and the visible board branding remains `WebWhiteBoard`.

## Completion Rule

- [X] This story is complete only when the relevant items in `specs/01-login-homepage-and-routing.spec.md` and `specs/07-browser-testing-and-qa.spec.md` have been checked `- [X]` and the manual Chrome DevTools browser test described above has been run successfully.
