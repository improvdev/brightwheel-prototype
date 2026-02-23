# Project Template

A reusable repository template with Cursor rules, Speckit workflow, and project structure conventions.

## What's Included

- **Cursor rules** (`.cursor/rules/`) – AI guidance for scripts, features, testing, design, and more
- **Speckit workflow** (`.cursor/commands/`, `templates/`) – Specify → Plan → Tasks → Implement
- **Constitution** (`memory/constitution.md`) – Project principles and governance
- **Documentation structure** (`docs/guides/`, `docs/rules/`)
- **Script organization** (`scripts/analysis|validations|test|utilities|results/`)
- **Feature specs** (`features/`, `specs/`)
- **Design docs** (`Design/`)
- **GitHub** – PR template

## Quick Start

### 1. Create a new repo from this template

**On GitHub:**
1. Click "Use this template" → "Create a new repository"
2. Name your repo and create it

**Or clone locally:**
```bash
git clone <your-template-repo-url> my-new-project
cd my-new-project
rm -rf .git && git init
git remote add origin <your-new-repo-url>
```

### 2. Customize for your project

1. **Update `CLAUDE.md`** – Replace placeholders with your project's architecture, tech stack, and commands
2. **Update `memory/constitution.md`** – Adapt principles to your domain (remove/add principles as needed)
3. **Edit `.cursor/rules/`** – Remove rules that don't apply (e.g., `frontend.mdc` if not multi-platform), or add project-specific ones
4. **Add `.cursorignore`** – Exclude large folders, node_modules, etc.

### 3. Speckit (Spec-Driven Development)

Install Speckit:
```bash
npm install -g @letuscode/spec-kit
```

Create a feature:
```
/speckit.specify Your feature description here
```

See `docs/guides/speckit-integration.md` for the full workflow.

## Directory Structure

```
├── .cursor/
│   ├── rules/           # Cursor AI rules (.mdc)
│   └── commands/        # Speckit commands (specify, plan, tasks, implement)
├── memory/
│   └── constitution.md  # Project principles
├── docs/
│   ├── guides/          # How-to guides
│   └── rules/          # Rule documentation (secrets, etc.)
├── features/           # Feature requirements
├── specs/              # Speckit specs (###-feature-name/)
├── Design/             # Architecture diagrams (Mermaid)
├── scripts/
│   ├── analysis/
│   ├── validations/
│   ├── test/
│   ├── utilities/
│   └── results/
├── templates/          # Spec, plan, tasks templates
├── .github/
│   └── pull_request_template.md
├── CLAUDE.md           # AI context for Claude/Cursor
└── README.md
```

## Making This a GitHub Template

1. Create a new repo (e.g. `your-org/project-template`)
2. Push this structure to it
3. In repo Settings → enable "Template repository"
4. New repos can use "Use this template" to start with this structure
