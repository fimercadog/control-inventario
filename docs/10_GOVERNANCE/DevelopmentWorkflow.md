# Development Workflow

Flujo obligatorio para toda feature nueva, según `AGENTS.md`:

```
Idea
 ↓
PRD                        (01_PRD/)
 ↓
Functional Specification   (03_FUNCTIONAL_SPEC/)
 ↓
Technical Specification    (04_TECHNICAL_SPEC/ + 05_IMPLEMENTATION/<Modulo>.md)
 ↓
Architecture Review        (ver ArchitectureWorkflow.md)
 ↓
Approval                   (ver estado Draft→Approved más abajo)
 ↓
Implementation
 ↓
Testing                    (06_TESTS/)
 ↓
QA
 ↓
Acceptance
 ↓
Release                    (07_RELEASE/, ver ReleaseWorkflow.md)
```

**Prohibido saltarse pasos.** Ver `DefinitionOfReady.md` para el checklist previo a Implementation y `DefinitionOfDone.md` para el checklist de cierre.

## Estados de un módulo

```
Draft → Review → Changes Requested → Approved → Implementation → Testing → Released
```

Cada documento de `03_FUNCTIONAL_SPEC/` y `05_IMPLEMENTATION/` debe declarar su estado actual en la primera línea (ya se usa la convención `Status: Built` / `Status: Planned` — al pasar a desarrollo activo, agregar el estado del ciclo Draft→Released).

## Quién puede saltarse el ciclo completo

Nadie, salvo la excepción de proporcionalidad descrita en `DefinitionOfReady.md` (fixes triviales sin impacto en dominio/API/seguridad/UX).

## Rol del agente de IA

Cualquier agente (Claude u otro) que trabaje en este repositorio debe seguir este flujo sin excepción, incluida la Golden Rule de `AGENTS.md`: nunca escribir código antes de que la especificación esté aprobada. Si falta información, el agente debe **detenerse y preguntar**, nunca inventar reglas de negocio, endpoints o campos de base de datos.
