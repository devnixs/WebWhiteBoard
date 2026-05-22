# Story 35: Login Cursor Color Selection

## Goal

- [X] Let users choose their cursor color during login while keeping a random color preselected by default.

## Scope

- [X] Update the login form so the color swatches are interactive, keyboard-accessible choices instead of a passive preview.
- [X] Persist the selected color in the existing local identity so homepage identity chips, board identity chips, participants, and remote cursors use the chosen color.
- [X] Preserve the current behavior where first-time login still works with only a name because a random color is already selected.

## Relevant Specs

- [X] `specs/01-login-homepage-and-routing.spec.md`
  - `ROUTE-003`

## Acceptance Notes

- [X] The login screen should present the available app cursor colors as a compact swatch picker.
- [X] Selecting a swatch should visibly mark that swatch as selected before submitting.
- [X] The selected color should be stored in `wwb.identity.color` and shown in the authenticated identity avatar immediately after login.
- [X] The random color assignment remains the initial selected value for users who do not choose manually.

## Playwright Test

- [X] Extend `e2e/tests/login-and-routing.spec.ts` with coverage on `/` that selects a non-default color swatch, submits the login form, and asserts the persisted local identity plus visible identity avatar use the chosen color.
- [X] Keep existing login, returning user, logout, direct board link, and unknown-route assertions passing.

## Browser Test

- [X] Using Chrome DevTools MCP, open `/`, type a name, choose a color swatch different from the default, submit the form, and confirm the homepage top-right identity avatar uses that chosen color.
- [X] Logout and repeat login without changing the preselected swatch; confirm the form still submits and persists the preselected color.

## E2E Regression

- [X] Run `cd e2e && ./node_modules/.bin/playwright test` and require the entire suite to pass with no regressions.

## Completion Rule

- [X] This story is complete only when the referenced spec IDs have been checked `- [X]`, the Playwright coverage described above has been added or extended and passes, the manual Chrome DevTools browser test described below has been run successfully, and the full e2e suite passes with no regressions.
