---
name: greenfield-spec-bootstrap
description: Set up a spec-driven project structure for an empty or brand-new codebase before implementation starts, including specs, stories, stable requirement IDs, spec frontmatter, story templates, generated story maps, validation scripts, CI hooks, and development documentation.
---

# Greenfield Spec Bootstrap

Use this skill when starting a new project from scratch and the user wants a spec-first project structure before code is built.

The goal is to establish the product contract, delivery workflow, and validation guardrails early so implementation work starts from explicit behavior rather than ad hoc decisions.

## Core Rules

- Set up the workflow before implementing product features.
- Keep specs behavior-focused. Do not fill specs with implementation tasks unless the repo convention intentionally mixes them.
- Use stable requirement IDs from the beginning.
- Use spec frontmatter from the beginning.
- Create stories only after the initial spec skeleton exists.
- Keep generated files generated; do not hand-edit story maps when a generator exists.
- Add validation early and make it cheap enough to run in CI.

## Phase 1: Gather Project Intent

If the user has not provided enough context, ask concise questions about:

- product purpose and target users
- expected platforms, routes, screens, or commands
- required stack and major constraints
- core user workflows
- persistence, integrations, auth, deployment, and testing expectations
- whether specs should track MVP progress with checkboxes

Do not over-design. Capture enough structure to start safely.

## Phase 2: Create Baseline Structure

Create these directories when absent:

```text
specs/
stories/
stories/archive/
scripts/
docs/
```

Create or update:

- `specs/index.md`
- `stories/00-story-map.md` through a generator when possible
- `stories/_template.story_TODO.md`
- `stories/archive/README.md`
- `scripts/validate-workflow.js` or equivalent
- `scripts/generate-story-map.js` or equivalent
- `docs/development.md`
- root package/task entrypoints for validation commands
- CI workflow validation when the project has CI

## Phase 3: Define Spec Areas

Start with a small, explicit spec set. Adapt names to the product, but a good default is:

- `specs/00-foundations.spec.md`
- `specs/01-routing-and-navigation.spec.md`
- `specs/02-auth-and-identity.spec.md`
- `specs/03-core-workflows.spec.md`
- `specs/04-data-and-persistence.spec.md`
- `specs/05-integrations.spec.md`
- `specs/06-testing-and-qa.spec.md`
- `specs/07-deployment-and-ops.spec.md`
- `specs/08-visual-design.spec.md` when the project has UI

Each spec file must start with frontmatter:

```yaml
---
area: core-workflows
owners:
  - frontend
  - backend
status: draft
depends_on:
  - specs/00-foundations.spec.md
---
```

Use `status: draft` until the user accepts the baseline, then `active`.

## Phase 4: Add Stable Requirement IDs

Assign each spec area a prefix in `specs/index.md`, such as:

- `FOUND`
- `ROUTE`
- `AUTH`
- `CORE`
- `DATA`
- `INT`
- `QA`
- `DEPLOY`
- `DESIGN`

Write checklist items like:

```md
- [ ] CORE-001: Users can create a new project from the primary workspace screen.
- [ ] DATA-001: Project records persist across browser reloads and backend restarts.
```

For greenfield work, new items normally start unchecked. Mark items checked only when the behavior has already been implemented and verified.

## Phase 5: Create Initial Stories

Create stories that slice the first implementation work. Each story should:

- use `NN-slug.story_TODO.md`
- start from `stories/_template.story_TODO.md`
- reference exact spec IDs
- describe Playwright or equivalent end-to-end coverage for user-facing behavior
- describe manual browser or runtime verification when applicable
- name the full regression command once the project has one

Do not create a huge “build the whole app” story. Split by independently verifiable user outcomes.

## Phase 6: Add Validation

Add a lightweight validator that checks:

- spec frontmatter exists and has valid `area`, `owners`, `status`, and `depends_on`
- spec checklist items have stable IDs
- IDs are unique
- stories follow `NN-slug.story_STATUS.md`
- active stories have required sections
- stories reference existing spec IDs
- completed stories have no unchecked checklist items
- generated story map matches actual story files

Add commands such as:

```json
{
  "scripts": {
    "generate:story-map": "node scripts/generate-story-map.js",
    "validate:workflow": "node scripts/validate-workflow.js"
  }
}
```

## Phase 7: Document The Workflow

Add `docs/development.md` with:

- common setup commands
- build/test commands
- validation commands
- story lifecycle
- QA expectations
- how to regenerate the story map

If the repo has `AGENTS.md` or similar, mention that specs are the product contract.

## Output Expectations

For a real greenfield bootstrap task, produce:

1. Spec directory with `index.md`, frontmatter, prefixes, and initial unchecked behavior requirements.
2. Story directory with template, archive README, and generated story map.
3. Initial implementation stories referencing exact spec IDs.
4. Workflow validation and story-map generation scripts.
5. CI validation if CI exists or is being created.
6. Development docs with commands and lifecycle rules.
7. A short summary of assumptions and open product questions.

If the user asks to also start implementation, finish the bootstrap first, validate it, then begin the first story.
