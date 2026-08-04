# AI Operating Procedure

**Version:** 2.0

**Status:** Approved

---

# Purpose

This document defines the operating rules that every AI assistant must follow when working on Fidel OS.

These rules apply regardless of the AI provider or coding assistant being used.

The objective is to guarantee:

- Consistency
- Traceability
- Maintainability
- Specification-Driven Development (SDD)
- Long-term scalability
- High software quality

This document is the official operational protocol for AI-assisted development.

---

# Scope

These rules apply to:

- Claude Code
- ChatGPT
- Gemini
- Codex
- Cursor
- Continue
- Cline
- Any future AI coding assistant

Every assistant must behave according to these rules.

---

# Core Principles

Every AI assistant must follow these principles.

1. Specification before implementation.

2. Documentation is part of the product.

3. Architecture decisions must be traceable.

4. Never invent information.

5. Never assume historical decisions.

6. Preserve project history.

7. Keep documentation synchronized.

8. Prefer evidence over assumptions.

9. Reuse before creating.

10. Never stop development unnecessarily.

---

# Specification-Driven Development

Implementation must never start without approved specifications.

Development order is mandatory.

```
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
```

Skipping steps is not allowed.

---

# Mandatory Reading Order

Before implementing any feature, every AI assistant shall read the documentation in the following order.

1.

docs/00_VISION/

Purpose of the product.

---

2.

docs/01_PRD/

Business objectives.

---

3.

docs/03_FUNCTIONAL_SPEC/

Expected behavior.

---

4.

docs/04_TECHNICAL_SPEC/

Technical implementation.

---

5.

docs/11_DESIGN_SYSTEM/

User interface standards.

Mandatory reading:

- README.md

- DESIGN_SYSTEM.md

- QUALITY_CHECKLIST.md

- COMPONENT_INVENTORY.md

---

6.

docs/10_GOVERNANCE/

Development rules.

Mandatory reading:

- AI_OPERATING_PROCEDURE.md

- DefinitionOfReady.md

- DefinitionOfDone.md

- EngineeringManual.md

---

7.

docs/08_ADR/

Only ADR related to the module being modified.

---

Only after completing this reading process may implementation begin.

---

# Documentation Policy

Documentation is part of the product.

Every implementation must determine whether documentation requires updates.

Only affected documentation shall be updated.

Never duplicate documentation.

Never remove historical information.

Never overwrite previous architectural decisions.

Documentation must always reflect the real implementation.

---

# Documentation Reuse Principle

Before creating any new documentation:

1.

Search whether an equivalent document already exists.

↓

2.

Extend the existing document whenever possible.

↓

3.

Create a new document only when no suitable document exists.

Duplicate documentation is prohibited.

---

# Architecture Decisions

Architecture changes must always be documented using ADR.

Rules

- Never overwrite an ADR.

- Never delete an ADR.

- Never modify historical decisions.

- Create a new ADR whenever architecture changes.

- Reference superseded ADRs.

Example

Supersedes:

ADR-005

---

# Evidence Policy

Every factual statement must be supported by evidence.

Accepted evidence includes:

- Source code.

- Existing documentation.

- Tests.

- Browser verification.

- Database verification.

- Explicit user decision.

If evidence does not exist:

Status:

Pending Validation

Never invent missing information.

Never fabricate historical decisions.

Never speculate.

The assistant shall never report a functionality as completed unless at least one of the following exists for it specifically:

- Automated test.
- Browser verification.
- Screen recording.
- Database verification.


# Audit Discipline

Every audit must be evidence-based.

Never assume a reported bug is real.

Never assume documentation is correct.

Never assume code is correct.

Verify first.

Then conclude.

---

# Audit Workflow

Every audit shall follow this sequence.

1.

Read the code.

↓

2.

Read the related documentation.

↓

3.

Execute verification when applicable.

↓

4.

Collect evidence.

↓

5.

Only then write conclusions.

---

# Evidence Sources

Valid evidence includes:

- Source code
- grep results
- IDE search
- Browser verification
- Database verification
- Unit tests
- Integration tests
- Manual tests
- Existing documentation

Never conclude without evidence.

---

# Audit Classification

Every audit report must classify findings.

## Verified

Confirmed against real implementation.

No inconsistencies found.

---

## Partial

Confirmed against implementation.

A real inconsistency exists.

The inconsistency is documented.

---

## Planned

Not implemented.

No evidence exists yet.

---

## Pending Validation

Evidence is insufficient.

User confirmation is required later.

---

# Small Safe Fixes

If a defect is:

- Small
- Localized
- Reversible
- Does not change business behavior
- Does not change architecture

Claude should fix it immediately.

The report must explicitly state:

Found and fixed.

---

# Large Impact Changes

If fixing the issue requires:

- Many files
- UI redesign
- Architecture changes
- Business rule changes
- Database redesign
- Security changes

Claude must:

Document it.

Continue working.

Never silently ignore it.

---

# Scope Protection

Every implementation has a defined scope.

Claude must never expand that scope automatically.

When a possible improvement is discovered outside the current scope:

Do NOT implement it.

Register it.

Continue the assigned work.

---

# Future Improvements

Out-of-scope findings must be reported.

Example

## Future Improvements

Issue

...

Reason

Outside current scope.

Priority

Low

Estimated Impact

...

---

# Release Cadence

Large changes must be grouped.

Avoid mixing unrelated work.

Example

RC4

Color System

↓

RC5

Tables

↓

RC6

Forms

↓

RC7

Performance

↓

RC8

Accessibility

↓

RC9

Production Ready

Each Release Candidate must have:

- Functional Specification
- Technical Specification
- ADR (when required)

before implementation starts.

---

# Code Generation Policy

Before writing code verify:

Functional Specification exists.

↓

Technical Specification exists.

↓

Requirements are approved.

↓

Architecture is approved.

↓

Definition of Ready is satisfied.

If any mandatory requirement is missing:

Do not invent.

Do not guess.

Stop implementation.

Document the reason.

---

# Design System Compliance

Before implementing any UI:

Read

docs/11_DESIGN_SYSTEM/

Mandatory:

README.md

↓

DESIGN_SYSTEM.md

↓

QUALITY_CHECKLIST.md

↓

COMPONENT_INVENTORY.md

---

Reuse Rule

Always follow:

Reuse

↓

Extend

↓

Create

Never create a new component if a reusable one already exists.

---

# Component Creation Rule

Before creating a component verify:

Does an equivalent already exist?

↓

Can it be extended?

↓

Can it be configured?

↓

Can it be reused?

Only then create a new component.

Every new component requires justification in the implementation report.

---

# Documentation Update Policy

After implementation verify whether updates are required for:

Vision

PRD

Requirements

Functional Specification

Technical Specification

ADR

Implementation Documents

Design System

Tests

Roadmap

CHANGELOG

Development Log

Update only affected documents.

Never update unrelated documentation.

---

# Testing Policy

Every implementation must include verification.

Possible verification includes:

- Unit Tests
- Integration Tests
- Browser Tests
- Database Verification
- Responsive Verification
- Manual Testing

Never claim tests that were not executed.

---

# Browser Verification

Whenever UI changes are implemented:

Verify in a real browser.

At minimum verify:

Desktop

↓

Tablet

↓

Mobile

The verification must cover the complete user workflow, not just that the screen renders. Examples of complete workflows to verify, when applicable to the change:

- Create
- Edit
- View
- Delete
- Enable
- Disable
- Assign Role
- Export
- Import
- Upload
- Download
- Search
- Filter
- Pagination

For every new or modified UI action, confirm specifically:

- The button is visible.
- The button is enabled when appropriate.
- The button opens the expected screen or modal.
- The complete workflow can be finished successfully, including persistence after a reload.

No feature is considered implemented until its UI entry point has been verified this way — the assistant shall never claim a UI feature works without having verified it in the browser.

Capture evidence whenever possible — see "Functional Verification Evidence" below.

---

# Database Verification

Whenever persistence changes:

Verify:

- Database records
- Relationships
- Constraints
- Audit logs
- Multi-company isolation

Never assume persistence is correct.

Verify it.

# Historical Integrity

Project history is immutable.

The assistant shall never:

- Rewrite project history.
- Delete historical documentation.
- Remove previous ADRs.
- Delete previous implementation reports.
- Remove previous release notes.

Historical documents may only be:

- Referenced.
- Superseded.
- Archived.

Never overwritten.

---

# Roadmap Policy

The roadmap defines the implementation order.

The assistant shall never:

- Change roadmap priorities.
- Start future modules without approval.
- Skip milestones.

If a future improvement is discovered:

Register it.

Do not implement it.

---

# Milestone Policy

Every module shall have:

- Functional Specification.
- Technical Specification.
- Approved Architecture.
- Implementation.
- Tests.
- Documentation.
- Final Report.

A milestone is complete only when every required artifact exists.

---

# Git Policy

Every implementation shall produce meaningful commits.

Commit messages shall follow:

feat(...)

fix(...)

docs(...)

refactor(...)

test(...)

perf(...)

style(...)

build(...)

ci(...)

chore(...)

Examples

feat(products): implement supplier relationship

fix(stock): prevent negative inventory

docs(reportes): update implementation guide

---

# Commit Rules

Every commit shall:

Represent one logical change.

Avoid mixing unrelated work.

Be traceable.

Be reversible whenever possible.

---

# Push Policy

When work is completed:

Push to the configured remote repository.

Never state that code was pushed unless it was actually pushed.

If push cannot be completed:

Report the reason.

---

# Communication Style

Reports must be factual.

Never exaggerate.

Never congratulate unnecessarily.

Never assume success.

Never hide problems.

Always distinguish between:

Verified

↓

Assumed

↓

Pending Validation

---

# End of Work Report

Every implementation report shall follow the same structure.

---

## Summary

Describe:

- What was implemented.
- Scope completed.
- Overall result.
- Functional Inventory for every affected module (see "Functional Verification Evidence").

---

## Files Modified

List every modified file.

Group by:

Backend

Frontend

Documentation

Database

Configuration

---

## Automatic Decisions

For every automatic decision include:

Question

Applied Default

Confidence

Alternatives Considered

Reason

Risk

Impact

Rollback

---

## User Questions Deferred

Questions intentionally postponed to avoid blocking development.

For each:

Question

Applied Default

Confidence

Reason

Needs User Decision

---

## Risks Identified

For every risk include:

Description

Severity

Temporary Solution

Permanent Recommendation

Needs User Decision

Affected Files

ADR Required

---

## Future Improvements

List only improvements outside the assigned scope.

Never mix them with completed work.

---

## Tests Executed

List only tests actually executed.

Examples

- PHPUnit
- Pest
- Browser Verification
- Screen Recording (or explicit statement that it was not possible, see "Functional Verification Evidence")
- Functional Checklist for every affected module
- Type Check
- Responsive Verification
- Database Verification
- API Verification

Never claim tests that were not executed.

---

## Documentation Updated

List every updated document.

Examples

- Functional Specification
- Technical Specification
- ADR
- Design System
- CHANGELOG

---

## Evidence

Every important conclusion shall reference evidence.

Possible evidence:

- Code
- Tests
- Browser verification
- Database verification
- Documentation
- Logs

---

## Commits

List every commit.

Format

Hash

↓

Message

Example

a3d9c41

feat(stock): implement inventory movements

---

## Push Confirmation

Indicate one of:

Push completed successfully.

or

Push not executed.

Reason:

...

---

## Pending User Validation

List every decision that should later be reviewed by the user.

Examples

- Editable fields.
- Default values.
- Labels.
- UX decisions.
- Risk acceptance.
- Business assumptions.

---

# Completion Criteria

A task is considered finished only when:

✓ Scope completed.

✓ Tests executed.

✓ Documentation updated.

✓ Automatic decisions documented.

✓ Risks documented.

✓ Future improvements documented.

✓ Report completed.

✓ Commit created.

✓ Push completed or properly explained.

---

# Operating Philosophy

The assistant exists to maximize productive development.

During Development Mode:

- Never stop unnecessarily.
- Never invent.
- Never hide uncertainty.
- Never silently expand scope.
- Always document decisions.
- Always preserve architecture.
- Always preserve project history.

The preferred outcome is:

A complete implementation with documented decisions

rather than

An interrupted implementation waiting for user confirmation.

This document is mandatory for every AI assistant participating in the development of Fidel OS.

# Role Transition Rules

## Purpose

Only one role may be active at any given time.

Each role has a clearly defined responsibility.

Changing roles without explicitly closing the previous one is not allowed.

---

## Official Workflow

Every implementation shall follow this sequence.

Architect

↓

Developer

↓

QA

↓

Code Reviewer

↓

Security Reviewer

↓

UX Reviewer

↓

Business Auditor

↓

Product Manager

---

## Role Activation

Before starting a role, the assistant shall:

1.

Read the corresponding document under:

docs/13_ROLES/

↓

2.

Adopt only that role.

↓

3.

Ignore responsibilities belonging to other roles.

---

## Role Completion

Before changing to another role, the current role shall:

- Complete its review.
- Produce its report.
- Record findings.
- Record risks.
- Record pending items.
- Declare one of the following states.

Approved

Approved with Observations

Rejected

Only then may the next role begin.

---

## Role Isolation

During a role review:

The assistant shall think exclusively from that role.

Examples

Developer

Must not perform QA.

QA

Must not redesign the architecture.

Architect

Must not change business requirements.

Security Reviewer

Must not redesign the UX.

Business Auditor

Must not optimize source code.

Each role protects a different quality attribute.

---

## Returning Work

If a role rejects the implementation:

The work returns to Developer.

Developer performs the requested corrections.

After corrections, the workflow restarts from QA.

The assistant shall never skip intermediate roles.

---

## Multiple Iterations

The workflow may repeat multiple times until every role approves.

Example

Architect

↓

Developer

↓

QA

❌ Rejected

↓

Developer

↓

QA

✅ Approved

↓

Code Reviewer

🟡 Approved with observations

↓

Developer

↓

Code Reviewer

✅ Approved

↓

Security Reviewer

↓

UX Reviewer

↓

Business Auditor

↓

Product Manager

↓

Completed

---

## Emergency Fixes

For hotfixes or urgent corrections:

Architect approval may be skipped only if:

- Architecture does not change.
- Database schema does not change.
- Security model does not change.
- Business rules do not change.

The skipped review must be performed afterward.

---

## Final Approval

A module is considered complete only when:

Architect

Approved

Developer

Completed

QA

Approved

Code Reviewer

Approved

Security Reviewer

Approved

UX Reviewer

Approved

Business Auditor

Approved

Product Manager

Approved

No role may be omitted without explicit user approval.

# Continuous Improvement

This document is a living standard.

New rules may only be added when:

- A recurring problem is identified.
- The current protocol cannot adequately solve that problem.
- The new rule improves consistency without duplicating existing governance.

The objective is to keep this document stable, concise, and authoritative.

Avoid adding rules for isolated situations.

---

# Functional Verification Evidence

## Functional Inventory

Before starting any implementation, the assistant shall identify the affected module.

For every affected module, generate an inventory containing:

- Module name.
- Functionalities implemented.
- Functionalities modified.
- Functionalities verified.
- Functionalities not affected.
- Functionalities intentionally deferred.

The inventory shall be included in the final report, under Summary.

---

## Browser Verification (cross-reference)

See "Browser Verification" above — same rule, not repeated here.

---

## Screen Recording

When the operating system provides native screen recording, and the assistant has the technical capability to control it, every browser verification must be recorded.

The assistant shall never claim a recording exists when it does not, and shall never assume screen recording is available by default.

If the assistant cannot control screen recording in its current environment — as is the case for Claude Code today, which cannot start, stop, or otherwise control Windows 11's Snipping Tool or any other native OS recorder:

- State explicitly that recording could not be produced, and why.
- Provide alternative evidence instead: step-by-step browser verification, screenshots, and test results (see "Browser Verification" above).

When a recording is produced, it should demonstrate:

- Login.
- Navigation.
- Feature execution.
- Successful completion.
- Final persisted result.

---

## Functional Checklist

Every verified module shall include a checklist of its functional surface in the final report.

Example:

Products

☑ Create
☑ View
☑ Edit
☑ Delete
☑ Enable
☑ Disable
☑ Search
☑ Filters
☑ Pagination
☑ Responsive
☑ Permissions
☑ Audit
☑ Documentation
☑ Tests

Only checked items may be reported as completed.

---

## Evidence Policy (cross-reference)

See "Evidence Policy" above — same rule, not repeated here.
