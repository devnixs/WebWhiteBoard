---
name: legacy-spec-bootstrap
description: Bootstrap a spec-driven workflow for an existing legacy codebase by inventorying implemented behavior, drafting behavior-focused specs with stable IDs and confidence/source notes, creating implementation stories for gaps, and adding validation without treating every implementation detail as desired product truth.
---

# Legacy Spec Bootstrap

Use this skill when applying the `specs/` + `stories/` project system to an existing legacy application.

The goal is to create a reviewed product contract from observed behavior, not to blindly document every implementation detail as desired behavior.

## Core Rules

- Do not rewrite the codebase during bootstrap unless explicitly asked.
- Do not infer product intent from code without marking the confidence level.
- Separate current behavior, desired behavior, deprecated behavior, and unclear behavior.
- Prefer behavior-focused specs over implementation-shaped specs.
- Keep source references close to discovered requirements so humans can verify them.
- Create stories for missing tests, ambiguous behavior, and implementation/spec alignment work.

## Phase 1: Inventory First

Create an inventory report before writing specs unless the user explicitly asks to skip it.

Inspect:

- repo instructions such as `AGENTS.md`, `CLAUDE.md`, `README.md`, or existing docs
- app routes, screens, pages, commands, jobs, and entrypoints
- controllers, API endpoints, handlers, events, queues, integrations, and permissions
- database models, migrations, persistence schemas, seed data, and config
- frontend state, user flows, forms, validation, and error states
- automated tests, manual QA notes, CI, packaging, and deployment files

Use `references/inventory-template.md` for the report shape.

## Phase 2: Draft Spec Areas

After inventory, create or update:

- `specs/index.md`
- `specs/00-foundations.spec.md`
- domain-specific spec files such as routing, auth, core workflows, data, integrations, QA, and deployment

Every spec file should have YAML frontmatter:

```yaml
---
area: core-domain
owners:
  - frontend
  - backend
status: active
depends_on:
  - specs/00-foundations.spec.md
---
```

Every checklist item should have a stable ID:

```md
- [X] AUTH-001: Users can request a password reset email. Source: `src/Auth/PasswordResetController.cs`. Confidence: high.
- [ ] AUTH-002: Password reset tokens expire after 30 minutes. Source: inferred from `appsettings.json`. Confidence: medium. Review needed.
```

Use:

- `[X]` for observed implemented behavior that should remain part of the product contract.
- `[ ]` for desired, unclear, unverified, deprecated-but-not-yet-removed, or implementation-gap behavior.

## Phase 3: Classify Confidence

Add source and confidence to legacy-discovered items:

- `Confidence: high` when confirmed by tests, UI behavior, or clear code paths.
- `Confidence: medium` when inferred from code/config but not observed end to end.
- `Confidence: low` when based on naming, dead-looking code, comments, or incomplete paths.
- `Review needed` when a human/product owner must decide whether behavior is desired.

Avoid checking off low-confidence behavior unless it has been verified or accepted.

## Phase 4: Create Stories

Create stories only after the initial spec baseline exists.

Use stories for:

- missing test coverage for important discovered behavior
- ambiguous behavior requiring product decisions
- mismatches between current implementation and desired specs
- risky refactors needed before future feature work
- migration from legacy architecture into the spec-driven workflow

If the target repo has a story template, use it. Each story should reference exact spec IDs, not broad files.

## Phase 5: Add Validation

If the target repo does not already have validation, add lightweight tooling equivalent to:

- stable spec ID validation
- spec frontmatter validation
- story filename/status validation
- generated story-map validation
- CI workflow validation

Keep validation tolerant during first bootstrap if the repo has many legacy specs, then tighten it after the baseline is clean.

## Output Expectations

For a real legacy bootstrap task, produce:

1. An inventory report.
2. Initial spec files with frontmatter, stable IDs, source references, and confidence notes.
3. A story template or initial cleanup stories.
4. A generated story map if the repo uses stories.
5. Validation commands and CI wiring when appropriate.
6. A short summary of unclear behaviors that need human review.

If the codebase is large, work in slices. Start with routing, auth, and one core workflow before trying to cover the whole system.
