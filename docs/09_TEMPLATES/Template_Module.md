# Implementación — [Nombre del Módulo]

> Plantilla extraída de los documentos reales en `docs/05_IMPLEMENTATION/` (`AI_Capture.md`, `Auth_Module0_Foundations.md`, `Auth_Module1_Authentication.md`, `Auth_Module2_CompanyIsolation.md`). Para módulos nuevos (Módulo 3 en adelante), este documento debe escribirse **antes** del código, no retroactivamente — es el gate de `AGENTS.md` ("no code before spec approved").

## Estado

[Planeado / En diseño / En desarrollo / Completo — con una frase de contexto y qué falta, si aplica]

## Goal

[Una a tres frases: qué problema resuelve este módulo, para quién, y por qué ahora.]

## Scope

[Lista con viñetas de lo que este módulo SÍ incluye, en términos concretos y verificables — no aspiraciones.]

## Out of Scope

[Lista con viñetas de lo que explícitamente NO incluye, incluyendo lo que podría confundirse con parte del alcance.]

## Dependencies

[Qué debe existir antes de que este módulo pueda empezar — otros módulos, paquetes, decisiones pendientes.]

## Database Changes

[Migraciones nuevas o modificadas, con nombre de archivo si ya existen. Tablas/columnas afectadas. Índices y FKs relevantes.]

## API Changes

[Endpoints nuevos o modificados, con método + ruta. Middleware requerido. Contratos de request/response relevantes o referencia a `docs/04_TECHNICAL_SPEC/API.md`. Códigos de error específicos del módulo.]

## Frontend Changes

[Pantallas, componentes, rutas, estado (Redux slice), servicios nuevos o modificados.]

## Security

[Reglas de `AGENTS.md` aplicadas específicamente aquí: validación de input, Policies, aislamiento multi-tenant, manejo de secretos, cualquier vector de ataque considerado y su mitigación.]

## Permissions

[Qué permisos del catálogo aplica o introduce este módulo; quién puede hacer qué.]

## Events

[Eventos de dominio disparados por este módulo, y si tienen listeners o quedan preparados sin consumidor.]

## Tests

[Lista de archivos de test (reales, con ruta) que cubren este módulo, con una frase de qué prueba cada uno. Si el módulo es prospectivo (no escrito aún), listar qué tests se planean.]

## Risks

[Riesgos técnicos o de producto identificados, con su mitigación si existe, o marcados explícitamente como sin mitigar.]

## Checklist

- [ ] [Ítems concretos y verificables, en el orden en que se completan — usar checkboxes reales, no solo prosa]

## Definition of Done

[Confirmar contra la Definition of Done de `AGENTS.md`: código, unit tests, integration tests, QA, lint limpio, type check limpio, build exitoso, documentación actualizada, changelog actualizado, release notes actualizadas, sin bugs críticos. Ser honesto sobre qué de esto NO se cumple, si aplica — no marcar completo lo que no lo está.]
