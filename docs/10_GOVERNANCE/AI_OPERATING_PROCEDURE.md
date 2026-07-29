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

# Code Generation Policy

Before generating code verify that:

- Requirements exist.
- Functional Specification exists.
- Technical Specification exists.

If any required specification is missing:

Stop implementation.

Request the missing specification.

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
