# Quality Gates

Este documento define **únicamente reglas de bloqueo**: en qué punto un desarrollo NO puede continuar. Es independiente del flujo de trabajo — el *cómo* y *en qué orden* se hacen las cosas vive en `docs/10_GOVERNANCE/MandatoryDevelopmentWorkflow.md`; este documento define *qué detiene el avance* en cualquier punto de ese flujo. No duplica el detalle de `DefinitionOfReady.md` ni `DefinitionOfDone.md` — cita el criterio y remite al documento que lo desarrolla en detalle.

## Gates de inicio (antes de escribir código)

```
Sin PRD / User Story
↓
No comenzar Fase 0 (Especificación y Aprobación)
```

```
Sin Functional Specification aprobada
↓
No pasar a Fase 1 (Comprensión)
```

```
Sin Technical Specification aprobada
↓
No desarrollar (no iniciar Fase 4, Implementación)
```

Criterio completo de qué debe existir y aprobarse antes de este punto: `docs/10_GOVERNANCE/DefinitionOfReady.md`. Excepción única: el fix trivial de proporcionalidad ya documentado ahí (sin impacto en dominio/API/seguridad/UX).

## Gates de calidad (durante el desarrollo)

```
Plan Técnico incompleto (Fase 3)
↓
No iniciar Implementación (Fase 4)
```

```
Desviación del Plan Técnico no documentada
↓
No continuar — volver a Fase 0 para la parte desviada, no improvisar hacia adelante
```

```
Lógica de negocio dentro de un Controller o componente React
↓
No aprobar el cambio (viola AGENTS.md, Architecture Principles)
```

```
Autorización por nombre de rol ($user->hasRole()) en vez de permiso ($user->can())
↓
No aprobar el cambio (viola AGENTS.md, Security Rules)
```

## Gates de pruebas

```
Sin pruebas (unitarias + funcionales + integración según aplique)
↓
No aprobar (no pasar a Fase 12, Aprobación Final)
```

```
Errores críticos abiertos
↓
No aprobar, bajo ninguna circunstancia
```

```
Errores de severidad alta sin corregir
↓
No marcar "Aprobado" — como máximo "Aprobado con observaciones", citando explícitamente el error pendiente
```

```
Informe de pruebas no generado (Template_TestReport.md)
↓
No cerrar el desarrollo, aunque el código funcione
```

## Gates de capacidades no construidas (Auditoría / Exportaciones)

Dos criterios de aprobación dependen de capacidades que **hoy no existen** en el sistema: exportaciones (`docs/03_FUNCTIONAL_SPEC/FUTURE/Export.md`) y auditoría genérica (`docs/03_FUNCTIONAL_SPEC/FUTURE/Auditoria.md`, con la única excepción real de Captura IA, que sí audita — ver `08_ADR/ADR-011`, `ADR-012`).

```
Módulo requiere exportación y FUTURE/Export.md sigue Status: Planned
↓
No puede marcarse "Aprobado" citando ese criterio como cumplido
↓
Puede marcarse "Aprobado con observaciones", citando la dependencia explícitamente
```

```
Módulo requiere auditoría genérica y FUTURE/Auditoria.md sigue Status: Planned
↓
Mismo tratamiento: "Aprobado con observaciones" con la dependencia citada, nunca "Aprobado" sin más
```

Este gate no bloquea el desarrollo indefinidamente — evita que se declare cumplido un criterio que en realidad depende de un módulo que no existe todavía. Es honestidad documental, no un obstáculo artificial.

## Gates de documentación

```
Sin documentación actualizada (Functional Spec, Technical Spec, 05_IMPLEMENTATION/<Modulo>.md)
↓
No cerrar (no completar Fase 10, Actualización de Documentación)
```

```
Decisión arquitectónica sin ADR
↓
No cerrar — crear el ADR antes de cerrar, nunca retroactivamente "cuando haya tiempo"
```

```
CHANGELOG.md sin entrada para este cambio
↓
No cerrar
```

## Gate de cierre final

```
Cualquiera de los puntos anteriores incumplido
↓
El desarrollo NO puede marcarse Completado / Released
```

Criterio completo de "cuándo está terminado" (una vez que ningún gate de este documento está bloqueando): `docs/10_GOVERNANCE/DefinitionOfDone.md`.

## Quién puede levantar un gate

Nadie de forma unilateral. Un gate solo se considera satisfecho cuando la evidencia citada (documento aprobado, test en verde, informe generado) existe y es verificable — nunca porque alguien lo declare verbalmente cumplido. La única autoridad para aceptar una excepción explícita a este documento es el propietario del proyecto (mismo principio que `MandatoryDevelopmentWorkflow.md`, "Regla Permanente").
