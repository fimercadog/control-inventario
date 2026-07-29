# Specification-Driven Development — Migration Plan

Status: **Proposal — awaiting approval**. Nothing in `docs/`, `backend/`, or `frontend/` has been moved, split, or deleted yet. This document is the audit + plan; execution is a separate, explicitly-approved step.

Scope: the `control-inventario` repository only (backend, frontend, docs, root-level markdown). The wider `claude-obsidian` vault is a separate tool and out of scope.

---

## 0. Key finding before anything else

**`AGENTS.md` (repo root) already declares this exact target structure** (`docs/00_VISION` … `09_TEMPLATES`) and this exact philosophy (spec before code, Definition of Ready/Done, fail-closed tenancy, `$user->can()` not `$user->hasRole()`). It was added at some point as a statement of intent, but `docs/` was never actually reorganized to match it — it's still nine flat files (`00_MASTER_SPECIFICATION.md` … `08_ROADMAP.md`) plus four empty subfolders (`assets/`, `decisions/`, `diagrams/`, `meeting-notes/`).

This migration closes that gap. It does not introduce a new philosophy — it executes one the repo already committed to on paper.

---

## 1. Audit of everything that currently exists

### 1.1 `docs/00_MASTER_SPECIFICATION.md` (78 KB, 74 numbered sections)

This is the single biggest source of both value and risk in the repo. It is **two documents wearing one file**:

- **Sections 1–72**: a full aspirational ERP specification — Empresas, Usuarios, Productos, Categorías, Inventario, Movimientos, **Compras, Proveedores, Ventas, Clientes**, Kardex, Reportes, plus generic frontend/security/testing/CI/roadmap sections. Written before implementation started.
- **Section 73**: Enterprise Architecture principles (Clean Architecture, SOLID, API First, Stateless Backend, Single Source of Truth, etc.) — generic, evergreen, and actually followed.
- **Section 74**: Módulo Captura IA — written and kept in sync *during* implementation. The most accurate section in the file.

**The problem this audit must surface**: of everything in sections 1–72, only a thin slice was ever built — a minimal Producto/Categoría/Movimiento skeleton (built ad hoc to support Captura IA, not as its own module) plus Login/Dashboard/Products-table/Movements-timeline screens with **mock data**. Compras, Proveedores, Ventas, Clientes, Kardex, Reportes, and the Productos CRUD form **do not exist anywhere in the codebase**. Splitting sections 1–72 verbatim into `03_FUNCTIONAL_SPEC/` would document features that were never built as if they were current specs — exactly the kind of drift SDD exists to prevent.

Also: **section 74 has no counterpart for Phase 5 (Auth/RBAC/Company Isolation)**. That entire, very real, very recent body of work (JWT, Teams-based RBAC, TenantScope, Policies) lives only in `04_ARCHITECTURE.md`/`05_DATABASE.md`/`06_API.md`, never folded back into the master spec. The master spec was effectively frozen after Captura IA.

| Content | Action | Destination | Why |
|---|---|---|---|
| §2–3 Objetivos, Alcance | Split | `00_VISION/BusinessGoals.md`, `01_PRD/OutOfScope.md` | Still accurate at the goal level |
| §4–6 Visión, Problema, Solución | Move | `00_VISION/Vision.md` | Accurate, evergreen |
| §7–9 Stakeholders, Usuarios, Roles | Split + Rewrite | `01_PRD/TargetUsers.md`, `01_PRD/UserPersonas.md` | Real stakeholders exist; personas were never actually written (just role names) — needs real authorship, not a copy |
| §10 Requisitos Funcionales (RF-001…020) | Rewrite | `02_REQUIREMENTS/FunctionalRequirements.md` | Written pre-implementation; several RFs describe modules never built. Must be reconciled against what exists before it's trustworthy |
| §11 Requisitos No Funcionales | Split | `02_REQUIREMENTS/NonFunctionalRequirements.md`, `SecurityRequirements.md`, `PerformanceRequirements.md` | Mostly still valid, just needs separating by concern |
| §12 Reglas de Negocio | Move | `01_PRD/BusinessRules.md` | Accurate for what exists |
| §13–16 Arquitectura General/Backend/Frontend/Dominio | Merge | `04_TECHNICAL_SPEC/Architecture.md`, `DomainModel.md` | Merge with the already-current `docs/04_ARCHITECTURE.md`; **current doc wins on any conflict** |
| §17–19 Auth, Gestión Usuarios, Roles y Permisos | **Archive**, then Rewrite | `03_FUNCTIONAL_SPEC/Authentication.md`, `Users.md`, `Roles.md` | This is the pre-implementation draft. The real thing was built in Phase 5 with different decisions (Teams, TenantScope, Platform Super Admin, invite-only) than this draft assumed. Archive as history; author the real spec from what's built |
| §20 Dashboard | Rewrite | `03_FUNCTIONAL_SPEC/Dashboard.md` | Dashboard was built in Phase 4, but with mock data and a specific card layout not in this draft |
| §21–24 Productos, Categorías, Inventario, Movimientos | Rewrite | `03_FUNCTIONAL_SPEC/Products.md`, `Inventory.md`, `Movements.md` | Partially built (thin backend skeleton + mock-data frontend table). Spec must describe *that*, not the fuller CRUD/reports described here |
| §25–28 Compras, Proveedores, Ventas, Clientes | **Archive** | `_ARCHIVE/pre-pivot-erp-scope.md` | Never built, not on the current roadmap. Kept for historical/future reference only, clearly labeled as such |
| §29–33 Modelo BD, Diccionario, Relaciones, Índices | Merge | `04_TECHNICAL_SPEC/Database.md` | Merge with current `docs/05_DATABASE.md` (wins on conflict); archive the tables for modules that don't exist (proveedores, clientes, compras, ventas) |
| §34, 41–43 Convenciones API, formato respuesta, códigos HTTP, versionado | Move | `04_TECHNICAL_SPEC/API.md` | Evergreen, actually followed (`ApiResponse` helper matches this exactly) |
| §35–40 Endpoints Auth/Productos/Categorías/Compras/Ventas/Inventario | **Archive**, then Merge | `04_TECHNICAL_SPEC/API.md` | Merge with current `docs/06_API.md` for what's real (Auth, Captura IA); archive endpoint specs for modules that don't exist |
| §44 Arquitectura Frontend | Move | `04_TECHNICAL_SPEC/Frontend.md` | Accurate, evergreen conventions |
| §45–46, 47, 48, 57–59 Layout, Login, Dashboard, Productos-table, Estados, Componentes, Colores | Rewrite | `03_FUNCTIONAL_SPEC/*.md` per screen | Screens were built in Phase 4/RC1 — spec should describe the shipped UI (verified this session), not the original draft |
| §49–56 Formulario Producto, Compras, Ventas, Inventario-screen, Kardex, Clientes, Proveedores, Reportes | **Archive** | `_ARCHIVE/` | None of these screens exist |
| §60–65 Seguridad, Auditoría, Logging, Rendimiento, Escalabilidad, Integraciones | Split | `02_REQUIREMENTS/SecurityRequirements.md`, `04_TECHNICAL_SPEC/Security.md`, `Integrations.md` | Mostly evergreen; Auditoría should be reconciled with the real, working `AuditLog` implementation |
| §66–67 Estrategia de Pruebas, CI/CD | Rewrite | `06_TESTS/MasterTestPlan.md` | The real backend test suite (94 tests) exists and looks nothing like this generic draft. CI/CD **does not exist** — no pipeline was ever set up; flag as a gap, don't pretend a plan is a pipeline |
| §68 Convenciones de Desarrollo | Move | `04_TECHNICAL_SPEC/CodingStandards.md` | Accurate, still followed |
| §69 Roadmap (Sprint 1–6) | **Archive** | `_ARCHIVE/` | Superseded entirely by the real, phase-based history in `docs/08_ROADMAP.md` |
| §70 Definition of Done | Merge | `DefinitionOfDone.md` | Merge with `AGENTS.md`'s version (more current); reconcile once, don't keep two |
| §71 Riesgos | Move | `00_VISION/` (own section or `RiskLog.md`) | Still relevant as a living list |
| §72 Anexos (Glosario, Referencias) | Move | `04_TECHNICAL_SPEC/Glossary.md` | Low priority, evergreen |
| §73 Enterprise Architecture principles | Split | `08_ADR/ADR-001` … `ADR-004` | Each principle here is exactly one ADR (Clean Architecture, Repository Pattern, Service Layer, DTO Pattern) — this section is effectively un-formatted ADR content |
| §74 Módulo Captura IA | Split | `03_FUNCTIONAL_SPEC/AI_Capture.md` (business) + already-current `04_ARCHITECTURE/DATABASE/API.md` (technical) + `08_ADR/ADR-005, ADR-011` and others (idempotency, domain events, multi-provider abstraction) | The most accurate section in the file — splitting it by audience is the only change needed, not a rewrite |

### 1.2 `docs/01_PRODUCT_VISION.md`, `02_REQUIREMENTS.md`, `03_USER_STORIES.md`

Read in full: all three are **empty scaffolds** (a heading and a bullet list of section names to fill in later — "RF-001", "US-001" as literal placeholder text). They were never populated.

**Action: Archive/delete.** Their intended purpose is fulfilled by real content authored fresh into `01_PRD/` and `02_REQUIREMENTS/` (see §1.1 and §4 below). Keeping empty placeholders alongside real docs would just be confusing.

### 1.3 `docs/04_ARCHITECTURE.md`, `05_DATABASE.md`, `06_API.md`

These three are **the most reliable documents in the repo** — I wrote and kept them in sync through every phase this session (Captura IA, then Auth/RBAC/Company Isolation). They are accurate as of the last completed module (Module 2).

**Action: Move, don't rewrite.** `04_ARCHITECTURE.md` → `04_TECHNICAL_SPEC/Architecture.md`, `05_DATABASE.md` → `04_TECHNICAL_SPEC/Database.md`, `06_API.md` → `04_TECHNICAL_SPEC/API.md`. Their "Módulo X" subsections should additionally be **split**: the business-facing parts (what a user does, what states exist) feed `03_FUNCTIONAL_SPEC/`, the already-decided architectural choices (JWT, Teams, TenantScope, idempotency, domain events) feed `08_ADR/`, and the technical detail stays in `04_TECHNICAL_SPEC/`. Same content, three audiences — no rewriting of anything that's actually correct.

### 1.4 `docs/07_FRONTEND.md`

Read in full: 19 lines. A bullet list of screen names, a pointer to §74 of the master spec, and empty "Componentes"/"Navegación"/"Responsive" headings. Never fleshed out.

**Action: Rewrite.** This one small file needs to become the seed for one technical doc (`04_TECHNICAL_SPEC/Frontend.md` — folder structure, state management, component conventions, all of which I *can* describe accurately from the actual `frontend/` tree) plus individual `03_FUNCTIONAL_SPEC/*.md` entries per screen, describing what actually shipped (verified hands-on during the RC1 QA pass this session).

### 1.5 `docs/08_ROADMAP.md`

Accurate and current — the real phase history (Captura IA complete; Auth Modules 0–2 complete, 3–9 pending) plus notes on the two real bugs found and fixed in Module 1 and Module 2.

**Action: Move.** → `00_VISION/Roadmap.md`, unchanged in substance.

### 1.6 Root `README.md`

Minimal (stack + folder list + an 8-step flow: Documentación → Arquitectura → Base de datos → API → Backend → Frontend → QA → Deploy).

**Action: Keep, small update.** Add a pointer to the new `docs/` structure and to `AGENTS.md`'s more precise workflow, so a newcomer isn't following two slightly different process descriptions.

### 1.7 Root `AGENTS.md`

Already declares the target folder structure, the SDD workflow, Definition of Ready/Done, security rules (`$user->can()` not `hasRole()`), multi-tenant rules (fail-closed, never trust `empresa_id` from the request) — all of which this session's actual implementation independently arrived at and matches almost exactly.

**Action: Keep as the short "constitution," extract the detail.** Right now `AGENTS.md` contains the *full text* of what should live in `DefinitionOfReady.md`, `DefinitionOfDone.md`, `SecurityRequirements.md`, etc. Left as-is, there would be two sources of truth that will drift. Extract the detailed content into the dedicated files the target structure calls for; leave `AGENTS.md` as a short pointer document ("this repo follows SDD — see `docs/09_TEMPLATES/`, `docs/DefinitionOfReady.md`, `docs/DefinitionOfDone.md`").

### 1.8 Root `DEMO.md`

A real, useful, already-correct document (system requirements, startup steps, demo credentials, 5-minute demo script, known limitations) — written during the RC1 pass this session and still accurate.

**Action: Keep at root, cross-link.** This serves a distinct audience (sales/demo) from formal release engineering docs. Don't force it into `07_RELEASE/` wholesale. Instead: merge its "known limitations" section into `07_RELEASE/KnownIssues.md` by reference, and leave the demo script itself where it is.

### 1.9 `backend/CLAUDE.md`, `frontend/CLAUDE.md`

Both are inert scaffold stubs (literally a directory listing, no real content) — auto-generated placeholders that were never filled in.

**Action: Out of scope for this migration.** Not documentation, not part of the SDD tree. Flag for separate cleanup (delete or populate) — don't let them block this plan.

### 1.10 `frontend/AGENTS.md`

A Next.js-version-specific tooling warning injected by scaffolding, unrelated to SDD.

**Action: Leave untouched.**

### 1.11 Root `CLAUDE.md` (project-level, "Arquitecto Principal de Fidel OS")

Real, actively-referenced content (stack, rules, flow) — this is the file that has actually governed how work got done this session.

**Action: Keep, small update.** Its "Flujo" section (Analizar → Diseñar → Aprobar → Backend → Frontend → QA → Documentar → Deploy) should be aligned to reference `AGENTS.md`'s more precise SDD flow (PRD → Functional Spec → Technical Spec → Architecture Review → Approval → Implementation → QA → Acceptance → Release) so the two don't quietly disagree.

### 1.12 Backend tests (`backend/tests/**`, 19 files, 94 tests, all passing)

Real, valuable, comprehensive — Feature and Unit suites covering Auth, Captura IA, and the Module 2 Company Isolation adversarial suite.

**Action: Keep every file exactly as-is. Zero code changes.** Author `06_TESTS/AutomatedTests.md` as an **index/description** of what exists (file → what it covers → pass status) — documentation *about* the tests, never a replacement for them.

### 1.13 Frontend tests

**None exist.** Every frontend verification this session (RC1 walkthrough, responsive review, real-login browser verification) was performed ad hoc via the `agent-browser` tool and never captured as a reusable, written test case.

**Action: Gap — author fresh.** Reconstruct the scenarios actually exercised this session into `06_TESTS/ManualTestCases.md` using the ID/Objective/Preconditions/Steps/Expected/Actual/Status format. This is genuinely new writing, not a move.

### 1.14 `docs/assets/`, `decisions/`, `diagrams/`, `meeting-notes/`

Empty since the repo was created. No content to migrate.

**Action: Remove** (or repurpose — `decisions/` and `diagrams/` could become homes for ADR diagrams; not required for this migration).

---

## 2. New folder structure

```text
docs/
├── 00_VISION/
│   ├── Vision.md
│   ├── BusinessGoals.md
│   ├── ProductStrategy.md
│   └── Roadmap.md
├── 01_PRD/
│   ├── ProductRequirements.md
│   ├── ProblemStatement.md
│   ├── TargetUsers.md
│   ├── UserPersonas.md
│   ├── UserStories.md
│   ├── BusinessRules.md
│   ├── SuccessMetrics.md
│   └── OutOfScope.md
├── 02_REQUIREMENTS/
│   ├── FunctionalRequirements.md
│   ├── NonFunctionalRequirements.md
│   ├── SecurityRequirements.md
│   ├── PerformanceRequirements.md
│   └── AccessibilityRequirements.md
├── 03_FUNCTIONAL_SPEC/
│   ├── Authentication.md
│   ├── Dashboard.md
│   ├── AI_Capture.md
│   ├── Products.md
│   ├── Inventory.md
│   ├── Movements.md
│   ├── Users.md
│   ├── Roles.md
│   └── Settings.md
├── 04_TECHNICAL_SPEC/
│   ├── Architecture.md
│   ├── DomainModel.md
│   ├── Database.md
│   ├── API.md
│   ├── Frontend.md
│   ├── Backend.md
│   ├── Security.md
│   ├── Integrations.md
│   ├── Deployment.md
│   ├── CodingStandards.md
│   └── Glossary.md
├── 05_IMPLEMENTATION/
│   ├── AI_Capture.md
│   ├── Auth_Module0_Foundations.md
│   ├── Auth_Module1_Authentication.md
│   ├── Auth_Module2_CompanyIsolation.md
│   └── (one per future module, created before that module starts)
├── 06_TESTS/
│   ├── MasterTestPlan.md
│   ├── AcceptanceCriteria.md
│   ├── RegressionPlan.md
│   ├── PerformanceTests.md
│   ├── SecurityTests.md
│   ├── ManualTestCases.md
│   └── AutomatedTests.md
├── 07_RELEASE/
│   ├── ReleaseChecklist.md
│   ├── ReleaseCandidate.md
│   ├── ReleaseNotes.md
│   ├── KnownIssues.md
│   ├── DeploymentGuide.md
│   └── RollbackPlan.md
├── 08_ADR/
│   ├── ADR-001-clean-architecture.md
│   ├── ADR-002-repository-pattern.md
│   ├── ADR-003-service-layer.md
│   ├── ADR-004-dto-pattern.md
│   ├── ADR-005-openai-provider-abstraction.md
│   ├── ADR-006-jwt-authentication.md
│   ├── ADR-007-refresh-tokens.md
│   ├── ADR-008-multi-tenant-isolation.md
│   ├── ADR-009-tenantscope.md
│   ├── ADR-010-rbac-teams.md
│   ├── ADR-011-ai-capture-pipeline.md
│   ├── ADR-012-idempotency.md
│   └── ADR-013-domain-events.md
├── 09_TEMPLATES/
│   ├── Template_PRD.md
│   ├── Template_FunctionalSpec.md
│   ├── Template_TechnicalSpec.md
│   ├── Template_Module.md
│   ├── Template_TestCase.md
│   ├── Template_ADR.md
│   └── Template_Release.md
├── _ARCHIVE/
│   └── pre-pivot-erp-scope.md   (Compras, Proveedores, Ventas, Clientes, Kardex, Reportes, Sprint plan — never built, kept for history only)
├── DefinitionOfReady.md
└── DefinitionOfDone.md
```

Files that stay exactly where they are: `README.md`, `AGENTS.md`, `CLAUDE.md`, `DEMO.md` (root); `backend/tests/**`, `frontend/`, `backend/` (all code — untouched).

---

## 3. Document mapping table (condensed — see §1 for the detailed reasoning per section)

| Current document | Destination | Action | Reason |
|---|---|---|---|
| `docs/00_MASTER_SPECIFICATION.md` §1–12 | `00_VISION/*`, `01_PRD/*`, `02_REQUIREMENTS/*` | Split | Still-valid product framing, needs separating by audience |
| `docs/00_MASTER_SPECIFICATION.md` §13–16 | `04_TECHNICAL_SPEC/Architecture.md`, `DomainModel.md` | Merge (current docs win) | Superseded in part by `04_ARCHITECTURE.md` |
| `docs/00_MASTER_SPECIFICATION.md` §17–20 | `03_FUNCTIONAL_SPEC/Authentication.md`, `Users.md`, `Roles.md`, `Dashboard.md` | Archive original, Rewrite fresh | Pre-implementation draft; real thing was built differently |
| `docs/00_MASTER_SPECIFICATION.md` §21–24 | `03_FUNCTIONAL_SPEC/Products.md`, `Inventory.md`, `Movements.md` | Rewrite | Only a thin slice was actually built |
| `docs/00_MASTER_SPECIFICATION.md` §25–28, 49–56, 69 | `_ARCHIVE/pre-pivot-erp-scope.md` | Archive | Never built, not on the current roadmap |
| `docs/00_MASTER_SPECIFICATION.md` §29–43 | `04_TECHNICAL_SPEC/Database.md`, `API.md` | Merge (current docs win) | Superseded in part by `05_DATABASE.md`/`06_API.md` |
| `docs/00_MASTER_SPECIFICATION.md` §44–48, 57–59 | `03_FUNCTIONAL_SPEC/*` per screen, `04_TECHNICAL_SPEC/Frontend.md` | Rewrite | Describe the screens as shipped, verified this session |
| `docs/00_MASTER_SPECIFICATION.md` §60–68 | `02_REQUIREMENTS/*`, `04_TECHNICAL_SPEC/*`, `06_TESTS/MasterTestPlan.md` | Split + Rewrite (testing/CI) | Mostly evergreen; testing section doesn't match the real suite; CI/CD doesn't exist |
| `docs/00_MASTER_SPECIFICATION.md` §70–72 | `DefinitionOfDone.md`, `00_VISION/`, `04_TECHNICAL_SPEC/Glossary.md` | Merge / Move | Reconcile DoD with `AGENTS.md`'s version once |
| `docs/00_MASTER_SPECIFICATION.md` §73 | `08_ADR/ADR-001…004` | Split | Un-formatted ADR content |
| `docs/00_MASTER_SPECIFICATION.md` §74 | `03_FUNCTIONAL_SPEC/AI_Capture.md`, `08_ADR/*` | Split | Accurate; just needs distributing by audience |
| `docs/01_PRODUCT_VISION.md`, `02_REQUIREMENTS.md`, `03_USER_STORIES.md` | — | **Archive/Delete** | Empty scaffolds, never populated |
| `docs/04_ARCHITECTURE.md` | `04_TECHNICAL_SPEC/Architecture.md` (+ split into FUNCTIONAL_SPEC/ADR) | Move + Split | Accurate, current |
| `docs/05_DATABASE.md` | `04_TECHNICAL_SPEC/Database.md` | Move | Accurate, current |
| `docs/06_API.md` | `04_TECHNICAL_SPEC/API.md` | Move | Accurate, current |
| `docs/07_FRONTEND.md` | `04_TECHNICAL_SPEC/Frontend.md` + `03_FUNCTIONAL_SPEC/*` | Rewrite | Never fleshed out |
| `docs/08_ROADMAP.md` | `00_VISION/Roadmap.md` | Move | Accurate, current |
| `README.md` | (stays at root) | Keep, small update | Add pointer to new structure |
| `AGENTS.md` | (stays at root) | Keep, extract detail | Avoid duplicating DoR/DoD content that will drift |
| `DEMO.md` | (stays at root) | Keep, cross-link | Distinct audience (demo/sales), already correct |
| `CLAUDE.md` (root) | (stays at root) | Keep, small update | Align "Flujo" with `AGENTS.md`'s SDD flow |
| `backend/CLAUDE.md`, `frontend/CLAUDE.md` | — | Out of scope | Inert stubs, not documentation |
| `backend/tests/**` | (stays in code tree) | Keep, unchanged | 94 passing tests — zero code changes; indexed by `06_TESTS/AutomatedTests.md` |
| Frontend manual QA (undocumented) | `06_TESTS/ManualTestCases.md` | **New** | Never captured as written test cases |
| `docs/assets/decisions/diagrams/meeting-notes` (empty) | — | Remove | No content |

---

## 4. Missing documents (nothing to migrate — must be authored fresh)

- **All of `01_PRD/`** except what can be assembled from the master spec's §7–12 — `UserPersonas.md` and `SuccessMetrics.md` in particular don't exist in any form (roles were named, never turned into personas; no KPI/success metric was ever defined for this product).
- **`02_REQUIREMENTS/AccessibilityRequirements.md`** — no accessibility requirement or dedicated audit exists anywhere in the project. A real gap, not just a filing exercise.
- **All 9 files in `03_FUNCTIONAL_SPEC/`** in the target format — either reconstructed from aspirational draft text (needs rewriting against reality) or, for `Users.md`/`Roles.md`, describing modules that don't exist yet (Auth Modules 4–5, not yet built) — these should be written as **forward specs**, gating those modules' start under the new rules.
- **All of `05_IMPLEMENTATION/`** — this document type has never existed. Can be reconstructed retroactively for Captura IA and Auth Modules 0–2 (I have full detail from this session); must be authored *prospectively*, before code, for every module from here forward (Module 3 onward).
- **Most of `06_TESTS/`** — `MasterTestPlan.md`, `AcceptanceCriteria.md`, `RegressionPlan.md`, `PerformanceTests.md` don't exist. `SecurityTests.md` can be substantially seeded from the Module 2 adversarial test list (already written, already proven).
- **Most of `07_RELEASE/`** — `DEMO.md` covers part of this ground informally; `ReleaseChecklist.md`, `ReleaseNotes.md`, `RollbackPlan.md` don't exist. `ReleaseCandidate.md` can be reconstructed from the RC1 pass done earlier this session.
- **All of `08_ADR/`** — zero ADRs exist in proper Context/Problem/Alternatives/Decision/Consequences format anywhere. The reasoning exists (narratively, in `04_ARCHITECTURE.md` and in this conversation), but has never been extracted into discrete, citable records.
- **All of `09_TEMPLATES/`** — straightforward once the real doc formats above are finalized.
- **`DefinitionOfReady.md`, `DefinitionOfDone.md`** as dedicated files — content exists inline in `AGENTS.md`, not yet extracted.
- **`CHANGELOG.md`** — referenced by `AGENTS.md`'s own Definition of Done ("Changelog updated") but the file has never existed. Should be created at the repo root.

---

## 5. Documentation priority

1. **Unblock Module 3 (Authorization/RBAC) immediately.** Under the rule just adopted ("no code before spec approved"), Module 3 cannot start without `03_FUNCTIONAL_SPEC/Roles.md` (partial), `04_TECHNICAL_SPEC` additions for the permission-checking middleware, and a `05_IMPLEMENTATION/Auth_Module3_Authorization.md`. This is the one piece of missing documentation with an actual deadline — everything else is retroactive.
2. **Retroactively document what's built** (Captura IA, Auth Modules 0–2) into the new structure. This preserves completed work, and — just as importantly — gives the *first real examples* of each new doc type, which every future module will pattern-match against. Doing this before writing `09_TEMPLATES/` means the templates are extracted from real, working examples instead of invented in the abstract.
3. **Extract the 8 ADRs this session already has the reasoning for** (Teams vs. custom RBAC, JWT vs. Sanctum, httpOnly cookies vs. localStorage, invite-only provisioning, TenantScope's fail-closed design, idempotency, domain events, OpenAI provider abstraction) while that reasoning is still fresh. This is explicitly time-sensitive: the *why* behind these decisions currently exists only in this conversation's history, and gets harder to reconstruct accurately the longer it waits.
4. **Migrate the mechanically-safe moves** (`04_ARCHITECTURE.md` → `04_TECHNICAL_SPEC/Architecture.md`, etc.) — low risk, low effort, immediate structural payoff.
5. **Archive the non-built ERP scope** clearly, so it stops being ambiguous about what's actually in progress.
6. **Everything else** (templates, remaining ADRs, formal test-plan documents, accessibility requirements, release docs) — valuable, not blocking.

---

## 6. Estimated effort

Given honestly, as relative sizing rather than fabricated hour estimates — this is a documentation-authorship effort, and I have no reliable basis to promise calendar time:

| Work item | Size | Notes |
|---|---|---|
| Create folder skeleton + move the 3 already-accurate docs (Architecture/Database/API) | **Small** | Mechanical, low risk |
| Archive empty scaffolds + the non-built ERP scope | **Small** | Mostly deletion/relocation |
| Extract `08_ADR` entries (8–13 records) | **Medium** | I have the reasoning; needs structuring per record |
| Author `05_IMPLEMENTATION/` for Modules 0–2 (retroactive) | **Medium** | Reconstructable in full from this session |
| Author `05_IMPLEMENTATION` + `03_FUNCTIONAL_SPEC` additions for Module 3 (prospective, blocking) | **Medium** | Needs your input on Module 3's exact permission-middleware shape before I can write it — not purely mechanical |
| Rewrite `03_FUNCTIONAL_SPEC/*` for built screens (Login, Dashboard, Products, Movements, AI Capture, Authentication) | **Medium–Large** | 6 documents, each needs the full Purpose/Flow/Screens/Validation/Permissions/States/Acceptance-Criteria template filled in accurately |
| Author `06_TESTS/ManualTestCases.md` from this session's actual QA scenarios | **Medium** | Real content exists in this conversation, needs formalizing |
| Author `01_PRD/` fresh content (personas, success metrics, out-of-scope) | **Medium** | Needs your input — personas and success metrics were never defined, I can't invent them |
| `09_TEMPLATES/` (7 files) | **Small** | Fast once real examples exist |
| `07_RELEASE/` remaining docs | **Small–Medium** | `ReleaseCandidate.md` reconstructable from the earlier RC1 pass; others are new |
| `02_REQUIREMENTS/AccessibilityRequirements.md` | **Small to author, unknown to fulfill** | Writing the doc is quick; it will likely reveal that no real accessibility audit has ever been done |

---

## 7. Risk analysis

- **Process overhead outweighing value.** This is presently a solo-developer-plus-AI project. A full PRD → FunctionalSpec → TechnicalSpec → Architecture Review → Approval chain for every small change risks becoming bureaucratic theater rather than a real safeguard. Mitigation: keep specs proportionate to the change's blast radius — a new screen needs a real Functional Spec; a one-line bugfix does not, and `AGENTS.md`/this plan should say so explicitly rather than implying every commit needs the full ceremony.
- **The archived ERP scope being mistaken for a live roadmap.** Compras/Ventas/Clientes/Proveedores read, in the original document, like committed features. If archived without a loud disclaimer, a future reader (or a future AI session with less context) could treat them as real backlog. Mitigation: the archive file's own heading must say, unambiguously, "not built, not currently planned, historical reference only."
- **Documentation drift resuming with no enforcement.** Nothing currently stops a future change from shipping without updating docs (it already happened once — the master spec was updated for Captura IA and then never touched again for Auth/RBAC). Mitigation: the Definition of Done already says "documentation updated," but there's no mechanical check. Worth considering a lightweight pre-commit or PR-template reminder, even without full CI.
- **Losing the reasoning behind recent decisions.** The *why* behind Teams-based RBAC, httpOnly cookies, invite-only provisioning, and the TenantScope fail-closed design exists right now only in this conversation. Once this context compacts or the session ends, reconstructing accurate ADRs becomes guesswork. This is the single most time-sensitive risk in this whole plan.
- **Over-templating.** Seven template files for a project this size risk becoming ceremony nobody follows. Mitigation: derive them from the first 2–3 real documents actually written, not from the abstract list — a template nobody has used yet is a guess.
- **Rewriting vs. archiving judgment calls being wrong.** I made real editorial calls above (e.g., archiving §25–28 entirely rather than lightly editing them). If Compras/Ventas are actually still intended for a later phase, archiving them as "pre-pivot scope" would be the wrong call — worth confirming before executing.

---

## 8. Recommendations

1. **Approve or amend this plan before any file moves.** In particular, confirm: (a) is the ERP scope (Compras/Ventas/Clientes/Proveedores) truly out of scope going forward, or deferred-but-planned? That single answer changes whether §25–28 get archived or turned into real forward-looking `03_FUNCTIONAL_SPEC` placeholders. (b) Should `AGENTS.md` stay at the root as the short constitution, or would you rather it move into `09_TEMPLATES/` or `00_VISION/` as part of the formal tree?
2. **Do the ADR extraction before anything else time-sensitive.** Everything else in this plan can be reconstructed later from working code and existing docs; the *reasoning* behind recent decisions cannot.
3. **Don't retrofit `03_FUNCTIONAL_SPEC`/`05_IMPLEMENTATION` for Compras/Ventas/etc.** — author them only when/if those modules actually get scheduled. Writing specs for things that aren't happening is the inverse of the problem SDD solves.
4. **Treat Module 3 (Authorization/RBAC) as the live test of the new process.** It's the first module that will go through PRD → Functional Spec → Technical Spec → Architecture Review → Approval for real, under the new rules, rather than retroactively. If the process feels too heavy or too light there, adjust before applying it to Modules 4–9.
5. **Keep `DEMO.md` where it is.** It already does its job well; forcing it into `07_RELEASE/` for structural purity would cost more than it gains.
6. **I have not moved, deleted, or rewritten anything yet.** This entire document is the proposal. Tell me which parts to execute, and in what order — I'd suggest: (1) folder skeleton + mechanical moves, (2) ADR extraction, (3) retroactive Module 0–2 implementation docs, (4) everything else.
