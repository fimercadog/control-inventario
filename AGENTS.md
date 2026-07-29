# AGENTS.md

# Fidel OS Development Standard

## Purpose

This repository follows **Specification-Driven Development (SDD)**.

The objective is to build maintainable, scalable and enterprise-grade software.

Every AI agent working in this repository must follow the rules defined in this document and the detailed policies it points to.

This file is the **short constitution**. It states the non-negotiable rules. The detailed, living policy documents live in `docs/` and are the single source of truth for their topic — if this file and a `docs/` policy ever disagree, `docs/` wins and this file should be corrected.

---

# Golden Rule

Never write code before the specification has been approved.

If the specification does not exist:

STOP.

Create the specification first.

---

# Development Workflow

Every feature must follow this exact workflow. Full detail, states, and exceptions: **`docs/10_GOVERNANCE/DevelopmentWorkflow.md`**.

```
Idea → PRD → Functional Specification → Technical Specification →
Architecture Review → Approval → Implementation → Testing → QA →
Acceptance → Release
```

Never skip steps, except the narrow proportionality exception documented in `docs/10_GOVERNANCE/DefinitionOfReady.md`.

---

# Definition of Ready / Definition of Done

Full checklists: **`docs/10_GOVERNANCE/DefinitionOfReady.md`** and **`docs/10_GOVERNANCE/DefinitionOfDone.md`**.

A module cannot start implementation until its Definition of Ready is fully checked. A module is not finished until its Definition of Done is fully checked. If any item is missing: **STOP. Ask questions.**

---

# Architecture Principles

Always follow: Clean Architecture, SOLID, Dependency Injection, Repository Pattern, Service Layer, DTO Pattern, interface-first design, event-driven where appropriate.

Never put business logic inside Controllers, React Components, or Middleware.

When a change touches architecture, follow **`docs/ArchitectureWorkflow.md`** and record the decision as an ADR in `docs/08_ADR/`.

---

# Security Rules

Never trust user input. Always validate. Never expose stack traces or internal exceptions. Always use Policies. Always use Permissions.

Never authorize using role names.

Correct: `$user->can('products.update')`
Incorrect: `$user->hasRole('Admin')`

Full detail: **`docs/04_TECHNICAL_SPEC/Security.md`** and **`docs/02_REQUIREMENTS/SecurityRequirements.md`**.

---

# Multi-Tenant Rules

Every company-owned resource must be isolated. Use TenantScope. Use Policies. Never trust `empresa_id` coming from the request — always derive company context from the authenticated user. Fail Closed: no tenant context must return zero records, never all records.

---

# Coding Rules

Write readable code. Small classes, small methods, meaningful names. Avoid duplication, magic numbers, static state. Prefer composition over inheritance.

Full conventions: **`docs/04_TECHNICAL_SPEC/CodingStandards.md`**.

---

# Frontend Rules

Business logic belongs in services, not components. Components are presentation-first. Loading, empty, and error states are mandatory. Responsive design is mandatory. Accessibility must always be considered (baseline: `docs/02_REQUIREMENTS/AccessibilityRequirements.md`).

Full conventions: **`docs/04_TECHNICAL_SPEC/Frontend.md`**.

---

# Testing Rules

Every feature requires Unit Tests, Integration Tests, Manual Acceptance Tests, and Regression Tests. Critical bugs must be fixed before continuing.

Full strategy and current coverage: **`docs/06_TESTS/MasterTestPlan.md`**.

---

# Documentation Rules

Documentation is part of the product. Every module must update documentation. Never leave documentation outdated. Architecture decisions must be documented using ADR (`docs/08_ADR/`).

Full rules on where things go: **`docs/10_GOVERNANCE/DocumentationWorkflow.md`**.

---

# Release Rules

Never release code that has critical bugs, failed tests, a broken build, or missing documentation.

Full checklist: **`docs/ReleaseWorkflow.md`** and **`docs/07_RELEASE/ReleaseChecklist.md`**.

---

# AI Rules

Never guess requirements. Ask questions. Never invent APIs. Never invent database fields. Never invent business rules.

If information is missing: **STOP. Ask.**

---

# Repository Structure

```
docs/
├── 00_VISION/
├── 01_PRD/
├── 02_REQUIREMENTS/
├── 03_FUNCTIONAL_SPEC/
├── 04_TECHNICAL_SPEC/
├── 05_IMPLEMENTATION/
├── 06_TESTS/
├── 07_RELEASE/
├── 08_ADR/
├── 09_TEMPLATES/
├── 10_GOVERNANCE/
│   ├── GOVERNANCE.md
│   ├── DefinitionOfReady.md
│   ├── DefinitionOfDone.md
│   ├── DevelopmentWorkflow.md
│   ├── DocumentationWorkflow.md
│   └── AI_OPERATING_PROCEDURE.md
├── _ARCHIVE/                 (historical, superseded — never a source of truth)
├── ArchitectureWorkflow.md
├── ReleaseWorkflow.md
└── SDD_MIGRATION_PLAN.md     (audit/history of the migration to this structure)
```

See `docs/10_GOVERNANCE/DocumentationWorkflow.md` for what goes where.

---

# Success Criteria

Success is NOT writing more code. Success is delivering software that is correct, secure, scalable, maintainable, well documented, fully tested, and ready for production.

---

# Final Rule

Think before coding. Specification first. Implementation second. Quality always.
