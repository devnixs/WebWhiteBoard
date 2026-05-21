# Minimal Greenfield Structure

Use this when the target repo is empty or nearly empty.

```text
.
├── docs/
│   └── development.md
├── scripts/
│   ├── generate-story-map.js
│   └── validate-workflow.js
├── specs/
│   ├── index.md
│   ├── 00-foundations.spec.md
│   ├── 01-routing-and-navigation.spec.md
│   ├── 02-auth-and-identity.spec.md
│   ├── 03-core-workflows.spec.md
│   ├── 04-data-and-persistence.spec.md
│   ├── 05-integrations.spec.md
│   ├── 06-testing-and-qa.spec.md
│   ├── 07-deployment-and-ops.spec.md
│   └── 08-visual-design.spec.md
└── stories/
    ├── 00-story-map.md
    ├── _template.story_TODO.md
    └── archive/
        └── README.md
```

Adjust spec areas to the product. Do not keep unused areas just because they are in this template.

## Suggested Owner Values

- `frontend`: UI, client runtime, browser input, client state, styling.
- `backend`: APIs, jobs, domain validation, persistence, realtime transport.
- `qa`: test plans, e2e, manual QA, regression gates.
- `devops`: CI, packaging, deployment, configuration, infrastructure.
- `product`: user flows, acceptance criteria, cross-feature semantics.
