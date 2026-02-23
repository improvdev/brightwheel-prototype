# Project Constitution

<!-- Customize these principles for your project. Remove or add sections as needed. -->

## Core Principles

### I. Architecture Layering (Backend)
Backend code MUST follow clean architecture with strict layering:
- **infrastructure**: Vendor-specific adapters (DB client, external APIs)
- **repositories**: Data-access APIs returning domain models
- **services**: Business orchestration
- **utils**: Pure stateless helpers
- **routes/controllers**: HTTP glue only

Dependency direction: routes → services → repositories → infrastructure.

### II. Test-First Development
Critical features MUST use TDD: Write tests → Implement → Refactor. Unit tests go in `tests/`.

### III. Feature Documentation Standards
Features MUST be documented in `features/` with specifications and acceptance criteria. Design docs in `Design/` MUST use Mermaid diagrams.

### IV. Script Organization
- `scripts/analysis/` – Data analysis, reporting
- `scripts/validations/` – Data quality checks
- `scripts/test/` – Manual test scripts
- `scripts/utilities/` – Processing, integration tools
- `scripts/results/` – Output files
- Guides in `docs/guides/`

One-time use scripts MUST be cleaned up after completion.

### V. No Company-Specific References
Do NOT name patterns after other companies (e.g. "Pinterest-style"). Use descriptive, generic names.

### VI. No Hardcoded Secrets
NEVER commit API tokens, passwords, or keys. Use environment variables.

## Governance

Amendments require: documentation, justification, version increment, and propagation to dependent docs.

**Version**: 1.0.0 | **Ratified**: [DATE] | **Last Amended**: [DATE]
