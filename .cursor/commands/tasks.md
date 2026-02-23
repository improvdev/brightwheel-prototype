---
description: Generate dependency-ordered tasks.md from design artifacts.
scripts:
  sh: scripts/bash/check-prerequisites.sh --json
---

Given the context provided as an argument, do this:

1. Run `{SCRIPT}` from repo root and parse FEATURE_DIR and AVAILABLE_DOCS.
2. Load design documents: plan.md (required), data-model.md, contracts/, research.md, quickstart.md.
3. Generate tasks using `templates/tasks-template.md` as base.
4. Create FEATURE_DIR/tasks.md with numbered tasks (T001, T002), dependencies, and parallel markers [P].

Context: {ARGS}
