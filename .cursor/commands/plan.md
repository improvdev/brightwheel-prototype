---
description: Execute the implementation planning workflow using the plan template.
scripts:
  sh: scripts/bash/setup-plan.sh --json
  ps: scripts/powershell/setup-plan.ps1 -Json
---

Given the implementation details provided as an argument, do this:

1. Run `{SCRIPT}` from repo root and parse JSON for FEATURE_SPEC, IMPL_PLAN, SPECS_DIR, BRANCH.
2. Read the feature specification and constitution at `memory/constitution.md`.
3. Load `templates/plan-template.md` and execute the implementation plan workflow.
4. Generate artifacts in $SPECS_DIR: research.md (Phase 0), data-model.md, contracts/, quickstart.md (Phase 1), tasks.md (Phase 2).
5. Report results with branch name, file paths, and generated artifacts.
