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
- Each story must mention the browser test that needs to be performed for that feature.
- All implementation items inside a story file must be written as `- [ ]` checkboxes. They start unchecked and are checked off (`- [X]`) as each item is completed during implementation.
- Story filenames must end with a status suffix: `_TODO` when first created, `_IN_PROGRESS` once work has begun, and `_COMPLETE` when all items are checked and verification has passed. Rename the file as the status changes.

## Require Manual Browser Verification

- Treat manual browser verification as mandatory, not optional polish.
- The required manual browser test must be described inside each story in concrete terms. Name the route, user actions, and expected outcome.
- The manual browser test must be performed using a Chrome DevTools browser instance, not just by reading code or relying on automated tests.
- A story is not complete until that manual browser verification has been executed and the feature behaves as expected.
- If the repository already has an end-to-end or QA spec, update or reference it when the new feature changes required browser coverage.

## Story Content Checklist

Each story should cover:

- Goal
- Scope
- Relevant specs
- Acceptance notes or implementation constraints when needed
- Browser test instructions with concrete manual steps
- Completion rule stating both conditions:
  1. referenced spec items are checked to `- [X]`
  2. the Chrome DevTools manual browser test has been run and passed

## Suggested Wording Patterns

Use wording like:

- `Relevant Specs`: list exact `specs/...` paths
- `Completion Rule`: `This story is complete only when the relevant items in ... have been checked - [X] and the manual Chrome DevTools browser test described below has been run successfully.`
- `Browser Test`: describe the route, setup, clicks, typing, gestures, collaboration steps, and expected visible result

## Output Expectations

When using this skill for a real task:

- Produce the spec edits first.
- Produce the story file or files second.
- Keep changed specs unchecked until implementation and verification are done.
- Keep the story explicit about which spec items should be checked after completion.
- If the feature is large, explain the story split briefly so sequencing is clear.
- All items inside the story file are `- [ ]` checkboxes; check them off as work is done.
- Name new story files with the `_TODO` suffix. Rename to `_IN_PROGRESS` when implementation starts and to `_COMPLETE` when all checks pass.
