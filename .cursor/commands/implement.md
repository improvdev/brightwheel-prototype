---
description: Execute implementation plan from tasks.md.
scripts:
  sh: scripts/bash/check-prerequisites.sh --json --require-tasks --include-tasks
  ps: scripts/powershell/check-prerequisites.ps1 -Json -RequireTasks -IncludeTasks
---

Given the current feature context, do this:

1. Run `{SCRIPT}` from repo root and parse FEATURE_DIR and AVAILABLE_DOCS.
2. Load tasks.md, plan.md, and other design documents.
3. Execute implementation phase-by-phase: Setup → Tests → Core → Integration → Polish.
4. Follow TDD: run test tasks before implementation tasks.
5. Mark completed tasks [X] in tasks.md. Report progress and errors clearly.
