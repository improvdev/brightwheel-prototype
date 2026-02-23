# Speckit Integration Guide

## Overview

This project uses [Speckit](https://github.com/github/spec-kit) (Spec-Driven Development toolkit) to structure feature development through a four-phase workflow:

1. **Specify** - Define detailed feature specifications
2. **Plan** - Create technical implementation plans
3. **Tasks** - Break down plans into actionable tasks
4. **Implement** - Execute tasks using AI-assisted coding

## Installation

Speckit has been installed globally via npm:

```bash
npm install -g @letuscode/spec-kit
```

Verify installation:
```bash
speckit check
```

## Project Structure

Speckit files are organized as follows:

```
project-root/
├── .cursor/commands/          # Cursor AI command templates
│   ├── constitution.md        # Constitution update command
│   ├── specify.md            # Feature specification command
│   ├── plan.md               # Implementation planning command
│   ├── tasks.md              # Task breakdown command
│   └── implement.md          # Implementation execution command
├── memory/
│   └── constitution.md       # Project constitution (core principles)
├── templates/
│   ├── spec-template.md      # Feature specification template
│   ├── plan-template.md      # Implementation plan template
│   └── tasks-template.md     # Task breakdown template
└── scripts/
    ├── bash/                 # Bash scripts for Speckit workflow
    └── powershell/           # PowerShell scripts for Speckit workflow
```

## Workflow

### 1. Specify Phase: Create Feature Specifications

Use the `/speckit.specify` command in Cursor (or via CLI) to create a new feature specification:

**In Cursor:**
- Type `/speckit.specify` followed by your feature description
- Example: `/speckit.specify User profile photo upload with cropping and filters`

**Command Behavior:**
- Creates a new feature branch
- Generates `specs/[feature-name]/spec.md` using the specification template
- Includes user stories, requirements, success criteria, and acceptance scenarios

**Template Structure:**
- User Scenarios & Testing (mandatory, prioritized)
- Requirements (functional and non-functional)
- Key Entities (if data involved)
- Success Criteria (measurable outcomes)

### 2. Plan Phase: Create Implementation Plans

Use the `/speckit.plan` command to generate a technical implementation plan:

**In Cursor:**
- Type `/speckit.plan` to create a plan for the current feature

**Command Behavior:**
- Reads the feature specification
- Checks constitution compliance
- Generates implementation artifacts:
  - `research.md` - Technical research and decisions
  - `data-model.md` - Data entities and relationships
  - `quickstart.md` - Integration test scenarios
  - `contracts/` - API endpoint specifications
  - `plan.md` - Complete implementation plan

**Plan Output Includes:**
- Technical context (language, dependencies, storage, testing)
- Constitution check (ensures compliance with project principles)
- Project structure (where files should be created)
- Architecture decisions
- Implementation phases

### 3. Tasks Phase: Generate Actionable Tasks

Use the `/speckit.tasks` command to break down the plan into executable tasks:

**In Cursor:**
- Type `/speckit.tasks` to generate tasks for the current feature

**Command Behavior:**
- Reads the implementation plan and design artifacts
- Generates `tasks.md` with numbered tasks (T001, T002, etc.)
- Organizes tasks by phase: Setup, Tests, Core, Integration, Polish
- Marks parallel tasks with `[P]` indicator
- Includes dependency ordering

**Task Organization:**
- **Setup tasks**: Project initialization, dependencies, configuration
- **Test tasks [P]**: Contract tests, integration tests (can run in parallel)
- **Core tasks**: Entity models, services, endpoints (sequential if same files)
- **Integration tasks**: DB connections, middleware, logging
- **Polish tasks [P]**: Unit tests, performance, documentation

### 4. Implement Phase: Execute Tasks

Use the `/speckit.implement` command to execute the task list:

**In Cursor:**
- Type `/speckit.implement` to start implementation

**Command Behavior:**
- Reads `tasks.md` for the feature
- Executes tasks phase-by-phase respecting dependencies
- For parallel tasks `[P]`, can execute multiple simultaneously
- Marks completed tasks in the tasks file
- Reports progress after each task

**Implementation Rules:**
- Setup tasks execute first
- Test tasks before implementation (TDD approach)
- Core development follows (models → services → endpoints)
- Integration work connects components
- Polish tasks finalize (unit tests, docs, optimization)

## Integration with Existing Workflow

### Feature Documentation

Speckit specifications integrate with the existing `features/` directory:

- **New features**: Use `/speckit.specify` to create structured specs in `specs/[feature-name]/`
- **Existing features**: Can be migrated to Speckit format by creating specs using the template
- **Feature requirements**: Speckit specs complement existing feature markdown files

### Design Documentation

Speckit plans integrate with `Design/` directory:

- **Architecture changes**: Update C4 diagrams when plans indicate architecture changes
- **Data models**: `data-model.md` from Speckit should align with existing data models
- **Flows**: Sequence diagrams in `Design/Flows/` complement Speckit quickstart scenarios

### Development Process

Speckit workflow enhances the existing feature development process:

1. **Before**: Define requirements in `/features` → Implement → Test
2. **With Speckit**: Specify → Plan → Tasks → Implement (more structured)

Both approaches can coexist:
- Use Speckit for complex, new features requiring detailed planning
- Use traditional `/features` docs for simpler features or quick iterations

## Constitution Compliance

All Speckit-generated plans automatically check compliance with `memory/constitution.md`, which includes:

- Multi-platform parity requirements
- Shared library first principle
- Architecture layering (backend)
- Terminology standards
- Test-first development
- Feature documentation standards
- Script organization rules

If a plan violates constitution principles, the planning phase will flag it and require justification.

## Examples

### Example 1: New Feature Specification

```
/speckit.specify User profile photo upload with cropping, filters, and compression
```

This creates:
- Branch: `feature/user-profile-photo-upload`
- Spec file: `specs/user-profile-photo-upload/spec.md`
- Includes user stories, requirements for photo upload, cropping, filters, compression

### Example 2: Implementation Planning

After specification is created:
```
/speckit.plan
```

This generates:
- `specs/user-profile-photo-upload/plan.md`
- `specs/user-profile-photo-upload/research.md` (image processing libraries)
- `specs/user-profile-photo-upload/data-model.md` (User profile updates)
- `specs/user-profile-photo-upload/contracts/upload-photo.yaml` (API spec)
- `specs/user-profile-photo-upload/quickstart.md` (test scenarios)

### Example 3: Task Breakdown

After planning is complete:
```
/speckit.tasks
```

This generates:
- `specs/user-profile-photo-upload/tasks.md` with tasks like:
  - T001: Setup - Add image processing dependencies
  - T002: [P] Test - Contract test for photo upload endpoint
  - T003: [P] Test - Integration test for photo cropping
  - T004: Core - Implement photo upload service
  - T005: Core - Implement cropping functionality
  - etc.

## Best Practices

1. **Start with Clear Specifications**: The more detailed the specification, the better the plan and tasks
2. **Review Plans Before Tasks**: Ensure the technical approach aligns with project standards
3. **Follow Task Dependencies**: Respect the order in tasks.md, especially for sequential tasks
4. **Mark Tasks Complete**: Update tasks.md as you complete items during implementation
5. **Constitution Compliance**: Address any constitution violations flagged during planning
6. **Update Existing Docs**: When Speckit generates new artifacts, update related docs in `Design/` and `features/`

## Troubleshooting

### Command Not Found
If `/speckit.*` commands don't work in Cursor:
- Verify Speckit is installed: `speckit check`
- Check `.cursor/commands/` directory exists
- Restart Cursor to reload command templates

### Missing Templates
If templates are missing:
- Templates should be in `templates/` directory
- Scripts should be in `scripts/bash/` and `scripts/powershell/`
- If missing, re-copy from the official spec-kit repository

### Constitution Violations
If planning flags constitution violations:
- Review `memory/constitution.md` for requirements
- Either adjust the plan to comply, or document justification
- Update constitution if principles need to change (with version bump)

## Resources

- [Official Speckit Documentation](https://github.github.com/spec-kit/)
- [Speckit GitHub Repository](https://github.com/github/spec-kit)
- [Project Constitution](./memory/constitution.md)
- [Feature Specifications](../features/)
- [Design Documentation](../../Design/)
