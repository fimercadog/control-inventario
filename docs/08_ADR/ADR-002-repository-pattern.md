# ADR-002: Repository Pattern sin interfaz explícita (por ahora)

## Estado
Accepted (Verified) — incluida la justificación de por qué no hay interfaz todavía, que sí está documentada explícitamente (caso poco común en este proyecto: aquí las alternativas SÍ están registradas, ver abajo).

## Fecha
No verificable con fecha exacta (mismo problema de ausencia de historial granular que ADR-001). Proxy verificable: `backend/app/Repositories/ProductRepository.php` y `CapturaIARepository.php` corresponden al módulo Captura IA, cuyas migraciones están fechadas `2026-07-28`.

## Contexto
El acceso a datos de Producto y Captura IA necesita encapsular reglas de consulta no triviales (ej. comparación case-insensitive con manejo de `NULL`) para que los Services no contengan SQL/Eloquent directamente.

## Problema
¿Se debe introducir una interfaz `*RepositoryInterface` para cada Repository desde el inicio, o basta con una clase concreta inyectada directamente?

## Alternativas evaluadas
**Esta es la única de las 13 decisiones donde se encontró una comparación de alternativas explícitamente documentada, no reconstruida.** Fuente: `docs/04_TECHNICAL_SPEC/Backend.md`, línea 62:

> *"Existen dos repositorios reales: `app/Repositories/ProductRepository.php` y `app/Repositories/CapturaIARepository.php`. Ninguno de los dos implementa una interfaz `*RepositoryInterface` todavía — son clases concretas inyectadas directamente (`ProductService` type-hints `ProductRepository`, no una interfaz). Esto es una simplificación real y deliberada para el tamaño actual del proyecto (un solo proveedor de persistencia, MySQL/SQLite vía Eloquent, sin necesidad de sustituir la implementación en tests — los tests reales usan una base SQLite en memoria, no un fake de repositorio)."*

Alternativa implícita descartada (según la misma fuente): definir `ProductRepositoryInterface`/`CapturaIARepositoryInterface` desde el inicio. Se descartó por no haber, hasta ahora, una segunda implementación de persistencia real ni necesidad de mockear el repositorio en tests (los tests usan SQLite real en memoria).

## Decisión
Usar clases Repository concretas, sin interfaz, inyectadas directamente en los Services. Revisar esta decisión cuando surja una segunda implementación de persistencia o la necesidad real de mockear repositorios en tests.

**Fuentes verificadas:**
- `docs/04_TECHNICAL_SPEC/Backend.md`, línea 62–64 (citado arriba, incluye referencia cruzada explícita a esta misma ADR).
- `AGENTS.md` §"Architecture Principles": exige "Repository Pattern" e "interface-first design" como principios generales — no específicamente que cada Repository tenga interfaz desde el día uno.
- Código real: `backend/app/Repositories/ProductRepository.php`, `CapturaIARepository.php` (clases concretas, sin namespace de interfaces asociado).

## Consecuencias
- Sustituir Eloquent/MySQL por otro motor de persistencia, o introducir un segundo proveedor, requerirá primero extraer la interfaz (trabajo diferido, no evitado).
- Los tests dependen de una base de datos real (SQLite en memoria) en vez de un doble de prueba — más lento pero más fiel al comportamiento real.
- Riesgo de que `ProductService` acumule conocimiento implícito de la implementación concreta de `ProductRepository` si no se disciplina el límite de responsabilidad.

## Impacto
Medio — localizado a la capa de acceso a datos; no bloquea a otros módulos, pero establece el patrón que se replicará (o no) en los Repositories de módulos futuros (Compras, Ventas, etc.).

## Referencias
- `docs/04_TECHNICAL_SPEC/Backend.md` §4 "Repository Pattern — estado real vs. aspiracional"
- `AGENTS.md`
- `backend/app/Repositories/ProductRepository.php`, `CapturaIARepository.php`

## Estado de implementación
Implementado y verificado en código para Producto y Captura IA. `AGENTS.md` exige "interface-first design" como principio general para el proyecto — este ADR documenta una excepción deliberada y con condición de revisión explícita, no un incumplimiento silencioso.

## Información Faltante
Ninguna respecto a la decisión y su justificación inmediata — es el caso mejor documentado de los 13. Falta únicamente: quién tomó la decisión y en qué fecha exacta (mismo problema estructural de ausencia de historial granular).
