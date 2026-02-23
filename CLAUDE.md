# CLAUDE.md

This file provides guidance to Claude Code when working with code in this repository.

## Architecture Overview

<!-- Replace with your project's architecture -->

[PROJECT_NAME] is a [brief description].

- **[Component 1]** – [description]
- **[Component 2]** – [description]
- **Design/** – C4 architecture diagrams and system documentation
- **features/** – Feature specifications and requirements

## Tech Stack

<!-- Replace with your stack -->

- **Backend**: [e.g. Python/Flask, Node/Express]
- **Frontend**: [e.g. React, React Native, Swift]
- **Infrastructure**: [e.g. Docker, GCP, GitHub Actions]

## Development Commands

### Initial Setup
```bash
# Add your setup commands
```

### Development
```bash
# Add your dev commands
```

### Testing
```bash
# Add your test commands
```

### Deployment
```bash
# Add your deploy commands
```

## Specification-Driven Development

This project uses **Speckit** for structured feature development:

- **Commands**: `/speckit.specify`, `/speckit.plan`, `/speckit.tasks`, `/speckit.implement`
- **Workflow**: Specify → Plan → Tasks → Implement
- **Constitution**: Plans check compliance with `memory/constitution.md`

See [docs/guides/speckit-integration.md](./docs/guides/speckit-integration.md).

## Key Development Rules

### Script Organization
- `scripts/analysis/` – Data analysis, reporting
- `scripts/validations/` – Validators, data quality
- `scripts/test/` – Manual test scripts
- `scripts/utilities/` – Processing, integration tools
- `docs/guides/` – Documentation and guides

### No Hardcoded Secrets
- Use environment variables for all secrets
- See `docs/rules/no-hardcoded-secrets.md`

### Testing
- Never remove tests without explicit direction
- Fix tests within intended behavior
- See `.cursor/rules/testing.mdc`
