---
name: feature-spec-story-workflow
description: Prepare feature work by updating or creating the relevant product specs first and then drafting one or more implementation stories that point back to those specs. Use when Codex is asked to create a feature, modify existing feature behavior, plan a feature change, or bring implementation planning in line with spec-driven workflows that use `specs/` and `stories/` directories.
---

# Feature Spec Story Workflow

Follow this workflow whenever the task is feature creation or feature modification in a repo that treats specs as the product contract.

## Inspect The Existing Contract

- Read the repo instructions first if files such as `AGENTS.md`, `CLAUDE.md`, or similar guidance exist.
- Inspect the existing `specs/` and `stories/` directories before making assumptions about naming, formatting, or completion rules.
- Identify which existing spec files describe the affected behavior.
- Identify whether the change fits an existing story or requires a new story. Prefer a new story when the work is a distinct feature slice or when the change is large enough to deserve isolated tracking.

## Update Specs First

- Update the relevant spec files before proposing implementation work.
- Add new spec files if the feature introduces a new major behavior area that does not fit the current split.
- Write specs as checklist items using `- [ ]` and `- [X]`.
- If you modify an existing spec item because behavior is changing, convert that item back to `- [ ]`.
- If you add new spec items, add them as `- [ ]`.
- If you create a new spec file, all checklist items in that file must start as `- [ ]`.
- Do not mark changed or new spec items complete during planning. They remain pending until the feature is implemented and verified.
- Keep spec wording behavior-focused. Describe observable product behavior, not implementation details unless the repository's specs already mix both intentionally.

## Create Implementation Stories

- After the specs are updated, create the implementation story or stories.
- Split into multiple stories when the change is too large for one coherent delivery slice, spans multiple subsystems, or would benefit from independent testing and sequencing.
- Store stories in the repository's established `stories/` location unless the repo uses a different convention.
- Match the local story format if one already exists. Reuse local headings and tone instead of inventing a new template.
- Each story must reference the exact spec file or files that were updated for that slice.
- Each story must explicitly say that completion requires checking the referenced spec items from `- [ ]` to `- [X]` when the work is actually done.
- Each story must mention all three verification activities that need to be performed for that feature: the new Playwright test, the manual Chrome DevTools browser test, and the full e2e regression run.
- All implementation items inside a story file must be written as `- [ ]` checkboxes. They start unchecked and are checked off (`- [X]`) as each item is completed during implementation.
- Story filenames must end with a status suffix: `_TODO` when first created, `_IN_PROGRESS` once work has begun, and `_COMPLETE` when all items are checked and verification has passed. Rename the file as the status changes.

## Require Three Verification Activities

Every story must require all three of the following before it can be considered complete. None of them is optional polish.

### 1. New Playwright Test

- Each story must add at least one new Playwright test that covers the new feature or bugfix.
- Place the test in the repository's established Playwright location (for example `e2e/tests/`) and follow local naming and structure conventions.
- The test must exercise the actual user-visible behavior described in the spec items the story references, not just internal implementation details.
- The story must describe what the new Playwright test should cover in concrete terms (route, setup, actions, assertions).
- The new Playwright test must pass before the story is marked complete.

### 2. Manual Chrome DevTools Browser Test

- The required manual browser test must be described inside each story in concrete terms. Name the route, user actions, and expected outcome.
- The manual browser test must be performed using the Chrome DevTools MCP browser instance, not just by reading code or relying on automated tests.
- A story is not complete until that manual browser verification has been executed and the feature behaves as expected.

### 3. Full E2E Regression Run

- Each story must require running the full end-to-end test suite (not just the new test) to confirm that the change has not introduced a regression in any existing feature.
- The story must name the exact command used to run the full e2e suite in this repository.
- All e2e tests must pass before the story is marked complete. If any existing test fails, the story is not done until the regression is fixed or the test is intentionally and justifiably updated.
- If the repository already has an end-to-end or QA spec, update or reference it when the new feature changes required browser coverage.

## Story Content Checklist

Each story should cover:

- Goal
- Scope
- Relevant specs
- Acceptance notes or implementation constraints when needed
- Playwright test plan: which file is added or extended, what it covers, what assertions it makes
- Browser test instructions with concrete manual steps using Chrome DevTools MCP
- Full e2e regression instructions: exact command to run the full suite
- Completion rule stating all four conditions:
  1. referenced spec items are checked to `- [X]`
  2. the new Playwright test has been added and passes
  3. the Chrome DevTools manual browser test has been run and passed
  4. the full e2e test suite has been run and all tests pass

## Suggested Wording Patterns

Use wording like:

- `Relevant Specs`: list exact `specs/...` paths
- `Playwright Test`: describe the new test file/case, the user flow it drives, and the assertions it makes
- `Browser Test`: describe the route, setup, clicks, typing, gestures, collaboration steps, and expected visible result
- `E2E Regression`: name the command (e.g. `npx playwright test`) and require the entire suite to pass
- `Completion Rule`: `This story is complete only when the relevant items in ... have been checked - [X], the new Playwright test described below has been added and passes, the manual Chrome DevTools browser test described below has been run successfully, and the full e2e test suite passes with no regressions.`

## Output Expectations

When using this skill for a real task:

- Produce the spec edits first.
- Produce the story file or files second.
- Keep changed specs unchecked until implementation and verification are done.
- Keep the story explicit about which spec items should be checked after completion.
- If the feature is large, explain the story split briefly so sequencing is clear.
- All items inside the story file are `- [ ]` checkboxes; check them off as work is done.
- Name new story files with the `_TODO` suffix. Rename to `_IN_PROGRESS` when implementation starts and to `_COMPLETE` when all checks pass.
