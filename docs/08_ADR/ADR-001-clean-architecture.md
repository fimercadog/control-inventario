# ADR-001: Clean Architecture como principio estructural del backend

## Estado
Accepted (Verified) — la decisión de adoptar el principio está verificada; las alternativas evaluadas NO están documentadas (ver "Información Faltante").

## Fecha
No verificable con fecha exacta. El repositorio tiene un único commit (`057c3e2`, 2026-07-25, "commit inicial"), que corresponde solo al scaffold base — el código de aplicación real (Actions, Services, Repositories, etc.) nunca fue commiteado y por tanto no tiene fecha de commit asociada. El principio aparece declarado sin fecha en `docs/_ARCHIVE/00_MASTER_SPECIFICATION_ORIGINAL.md`. Proxy más cercano verificable: las migraciones del primer módulo construido (Captura IA) están fechadas `2026-07-28` (`backend/database/migrations/2026_07_28_015311_*` a `2026_07_28_015314_*`).

## Contexto
El proyecto necesita que la lógica de negocio (matching de productos, dirección de movimientos de inventario, orquestación de Captura IA) no quede acoplada a un framework, proveedor de IA o motor de base de datos específico, para poder evolucionar cada módulo sin reescribir los ya existentes.

## Problema
¿Cómo estructurar un backend Laravel de forma que la lógica de negocio no dependa directamente de Eloquent, de los Controllers HTTP, ni de un proveedor de IA concreto?

## Alternativas evaluadas
No documentadas. No se encontró en `AGENTS.md`, en `docs/`, en el código, ni en el único commit del repositorio, ningún registro de que se hayan evaluado y descartado alternativas concretas (por ejemplo, MVC estándar de Laravel con lógica en Controllers/Models, o Hexagonal/Ports & Adapters con namespaces `Domain`/`Application` explícitos). El principio se declara directamente como mandato, no como resultado de una comparación registrada.

## Decisión
Adoptar Clean Architecture como principio estructural: la lógica de negocio vive en Services/Actions, no en Controllers ni en componentes de React; el acceso a datos pasa por Repositories; los colaboradores externos (proveedor de IA) se consumen a través de Contracts/Interfaces, nunca de forma directa.

**Fuentes verificadas:**
- `AGENTS.md` §"Architecture Principles": *"Always follow: Clean Architecture, SOLID, Dependency Injection, Repository Pattern, Service Layer, DTO Pattern, interface-first design, event-driven where appropriate."* y *"Never put business logic inside: Controllers, React Components, Middleware."*
- `docs/_ARCHIVE/00_MASTER_SPECIFICATION_ORIGINAL.md`, línea 4548, §73 "Arquitectura Empresarial (Enterprise Architecture)", principio 9 "Clean Architecture": *"La lógica del negocio será independiente de: Framework, Base de Datos, Frontend, API, Proveedor Cloud."* y principio 5 "Separación de Responsabilidades": *"Controllers → Services → Repositories → Models. Nunca se permitirá lógica de negocio dentro de Controllers."*
- `docs/_ARCHIVE/00_MASTER_SPECIFICATION_ORIGINAL.md`, línea 5125: *"Separación de Responsabilidades — Controllers nunca llaman al proveedor de IA directamente; siempre a través de un Service."*
- Código real (estructura de carpetas verificada): `backend/app/{Actions,Contracts,DTO,Services,Repositories,Policies}` existen como directorios separados de `Http/Controllers`.

## Consecuencias
- Toda nueva feature debe ubicar su lógica de negocio en un Service/Action, no en el Controller — criterio de revisión de código, no preferencia.
- Costo: una capa adicional de indirección para cambios simples. Beneficio verificado: el proveedor de IA ya fue sustituido en tests (`FakeAIProvider`) sin tocar Controllers ni Strategies (ver ADR-005).
- Cualquier desviación (lógica de negocio en un Controller) debe tratarse como deuda técnica, no como excepción aceptable.

## Impacto
Alto y transversal — afecta la estructura de carpetas de todo el backend y el criterio de revisión de cada feature futura.

## Referencias
- `AGENTS.md` (raíz del repo)
- `docs/_ARCHIVE/00_MASTER_SPECIFICATION_ORIGINAL.md` §73 (líneas 4548–4680 aprox.)
- `docs/04_TECHNICAL_SPEC/Backend.md`
- `docs/04_TECHNICAL_SPEC/Architecture.md`

## Estado de implementación
Implementado y verificado en código para el módulo Captura IA (el único módulo de negocio completo). Los módulos Auth/RBAC (Fase 5) declaran seguir el mismo principio en `docs/04_TECHNICAL_SPEC/Architecture.md`, pero varios de sus submódulos (3–9) todavía no están construidos — ver `docs/00_VISION/Roadmap.md`.

## Información Faltante
No existe registro de qué alternativas arquitectónicas se evaluaron antes de adoptar este principio, ni quién tomó la decisión, ni en qué fecha exacta. El principio aparece ya decidido en la primera versión legible del master spec, sin historial de discusión previo disponible en este repositorio (no hay commits granulares ni actas de decisión).
