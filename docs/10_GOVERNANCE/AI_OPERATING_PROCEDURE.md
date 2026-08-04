# AI Operating Procedure

## Purpose

This document defines the operating rules that every AI assistant must follow when working on this repository.

These rules apply regardless of the AI provider or coding assistant being used.

The objective is to guarantee consistency, traceability, maintainability and Specification-Driven Development (SDD) compliance.

---

# Core Principles

Every AI assistant must follow these principles.

1. Specification before implementation.
2. Documentation is part of the product.
3. Architecture decisions must be traceable.
4. Never invent information.
5. Preserve project history.
6. Keep documentation synchronized with the implementation.

---

# Specification-Driven Development

Implementation must never start without an approved specification.

Development order:

Idea

↓

Vision

↓

PRD

↓

Requirements

↓

Functional Specification

↓

Technical Specification

↓

Architecture Review

↓

Approval

↓

Implementation

↓

Testing

↓

Release

---

# Mandatory Reading Order

Added 2026-08-03. This section is about sequence — which folders to read and in what order before touching code. It does not replace `docs/10_GOVERNANCE/DefinitionOfReady.md`, which is the authoritative checklist of what must exist and be approved before implementation starts; read that document for the full gate. This section exists because `DefinitionOfReady.md` predates `docs/11_DESIGN_SYSTEM/` and does not sequence the reading order on its own.

Before implementing any feature, read in this order:

1. `docs/00_VISION/` — why this exists.
2. `docs/01_PRD/` — what must be built.
3. `docs/03_FUNCTIONAL_SPEC/` — how the module must behave.
4. `docs/04_TECHNICAL_SPEC/` — how it is implemented technically.
5. `docs/11_DESIGN_SYSTEM/` — how the UI must look and behave (see "Design System Compliance" below for the full pre-module checklist).
6. `docs/10_GOVERNANCE/` — the rules governing how the work itself is done (this document and its siblings).

Only then start implementation.

---

# Documentation Policy

Whenever code changes affect the project documentation:

- Update only the affected documents.
- Preserve existing documentation.
- Never duplicate information.
- Never remove historical information.

Documentation is considered part of the source code.

---

# Architecture Decisions

Every architectural decision must be documented through an ADR.

Rules:

- Never overwrite an existing ADR.
- Create a new ADR when architecture changes.
- Reference previous ADRs using:

Supersedes: ADR-XXX

Historical decisions must remain available.

---

# Evidence Policy

Every factual statement must be supported by one of the following:

- Source code
- Existing documentation
- Explicit user decision

If no evidence exists:

Status: Pending Validation

Do not infer missing historical decisions.

Do not invent reasoning.

---

# Audit Discipline

Added 2026-08-03, generalizing the pattern established across the `docs/11_DESIGN_SYSTEM/` audits and `ADR-014`.

When asked to audit code, documentation, or a bug report:

- Verify against the real code (`grep`, direct reads, running tests) before writing any conclusion. Cite exact counts and file:line references — never "approximately" or "most modules."
- Do not assume a claim is true because it was reported as a bug or as fact. Verify it first; if it is false, say so with evidence before proposing any fix.
- When a real inconsistency or defect is found, fix it immediately only if the fix is small, contained, and does not change behavior visible to the user (e.g., removing a duplicated local component in favor of an already-shared one). State clearly in the report: "found and fixed."
- When a real inconsistency or defect is found and the fix has a wide blast radius (affects visual appearance across many screens, changes an established behavior, requires touching many files) — do not fix it. Document it explicitly (what, where, how many sites, with evidence) and wait for explicit approval before touching code. Never silently leave it undocumented either.
- Distinguish, in every audit report: what is Verified (confirmed against real code, consistent), what is Partial (confirmed against real code, but with a real documented inconsistency or bug not yet fixed), and what is Planned (not built yet). Never mark something Verified to make a report look more complete than it is.

---

# Release Cadence

Added 2026-08-03. Once a module or cross-cutting concern (like the Design System) reaches a stable baseline, do not keep mixing unrelated scopes into the same unit of work — group work into named Release Candidates, one focus area per RC, so risk stays contained and the change history stays legible.

Established sequence at the time of this update (see `docs/11_DESIGN_SYSTEM/CHANGELOG.md` and `docs/11_DESIGN_SYSTEM/README.md` for the live status of each Design System item referenced below):

- **RC1-RC3**: business modules (Roles, Auditoría, Reportes, Perfil, etc.) and the Design System consolidation (Component Reuse, Modal Sizes, Tables/Forms/Typography/Colors/Iconography/Responsive audits, Typography bug fix, Quality Checklist).
- **RC4 — Color System**: reconcile the 3 status-badge color patterns documented in `docs/11_DESIGN_SYSTEM/COLORS.md` into one. Scope: the whole application, not a single badge or button.
- **RC5 — Tables**: reconcile pagination, server-vs-client search, and debounce inconsistencies documented in `docs/11_DESIGN_SYSTEM/TABLES.md`. Scope: every list/table screen, not a single module.
- **RC6 — Forms**: reconcile the two dialog families (CrudModal vs. independent dialogs) and the Proveedor/Cliente grid divergence documented in `docs/11_DESIGN_SYSTEM/FORMS.md`. Scope: every form, not a single module.
- **RC7 — Performance**: backend, frontend, Redux, and query performance — not yet scoped in detail.
- **RC8 — Accessibility**: not yet scoped in detail.
- **RC9 — Production Ready**: not yet scoped in detail.

This list is a sequencing decision, not a specification — each RC still needs its own Functional/Technical Spec and, where it changes existing behavior, its own ADR before implementation starts, per the Specification-Driven Development order above.

---

# Code Generation Policy

Before generating code verify that:

- Requirements exist.
- Functional Specification exists.
- Technical Specification exists.

If any required specification is missing:

Stop implementation.

Request the missing specification.

---

# Design System Compliance

Added 2026-08-03, after `docs/11_DESIGN_SYSTEM/` was consolidated into the single official source for UI/UX (see its own `README.md` for how it is organized and its Verified/Partial/Planned status legend).

Before implementing any new module or screen:

1. Read `docs/11_DESIGN_SYSTEM/README.md` for the current state of every section.
2. Read `docs/11_DESIGN_SYSTEM/QUALITY_CHECKLIST.md`.
3. Read `docs/11_DESIGN_SYSTEM/COMPONENT_INVENTORY.md`.
4. Reuse existing components — Component Reuse is Mandatory (`docs/11_DESIGN_SYSTEM/DESIGN_SYSTEM.md` §1.1): reuse first, extend second, create new only when no reusable solution exists.
5. Only create a new component if the Golden Rule (`DESIGN_SYSTEM.md`) is satisfied and justified in the module's implementation report.
6. State explicitly, in the module's implementation report, which existing components were reused and which (if any) new component was created and why.

Do not start coding before completing this review.

A module is not considered done without passing `QUALITY_CHECKLIST.md` — see `docs/10_GOVERNANCE/DefinitionOfDone.md` for how this checklist relates to the general Definition of Done.

No local Design System definitions (modal sizes, colors, spacing, etc.) are allowed without an ADR justifying the exception — same rule already stated in `docs/11_DESIGN_SYSTEM/README.md` and demonstrated in `docs/08_ADR/ADR-014-modal-sizing-unification.md`.

---

# Documentation Update Policy

After a completed milestone:

Review whether the following documents require updates:

- Vision
- PRD
- Requirements
- Functional Specifications
- Technical Specifications
- Implementation Documents
- ADR
- Tests
- Roadmap
- Changelog
- Development Log
- Gaps

Update only documents actually affected.

---

# Testing Policy

Every implementation should include verification.

Possible verification includes:

- Unit Tests
- Integration Tests
- Manual Tests
- Browser Tests
- Acceptance Tests

Never claim test coverage that does not exist.

---

# Historical Integrity

Never delete:

- ADR
- Changelog
- Development Log
- Release Notes

History is immutable.

Corrections are made through new documents, not by erasing history.

---

# Roadmap Policy

Every feature must have one status:

- Planned
- In Progress
- Completed
- Archived

Never mark a feature as Completed without implementation evidence.

Never mark a feature as Archived unless explicitly cancelled.

---

# Milestone Policy

When a milestone satisfies the Definition of Done:

Execute the Milestone Workflow.

Do not execute it for intermediate work.

---

# Git Policy

The AI may:

- Propose commit messages.
- Suggest tags.
- Suggest release notes.

The AI must not:

- Execute git commit.
- Execute git push.
- Rewrite Git history.
- Delete branches.

Unless explicitly instructed by the user.

---

# Security Policy

Never expose:

- API Keys
- Passwords
- Tokens
- Secrets
- Credentials

Sensitive values must never be written into documentation.

---

# Project Consistency

The AI should always verify consistency between:

- Code
- Specifications
- Architecture
- Documentation
- Tests
- Roadmap

If inconsistencies are detected they must be reported.

Do not silently ignore them.

---

# Communication Style

Reports should be:

- Objective
- Concise
- Evidence-based
- Actionable

Avoid assumptions.

Avoid speculative recommendations.

Clearly distinguish:

Verified

Partially Verified

Pending Validation

---

# End of Work

When a milestone is completed the AI should provide:

## Summary

- Work completed
- Files modified
- Documentation updated
- ADR created
- Tests affected
- Risks
- Remaining gaps
- Recommended next milestone

Finally propose a Conventional Commit message.

Do not execute Git operations.

Leave the repository ready for review.
