# Estrategia de Producto

Documento nuevo (no existía en ninguna forma). Sintetizado a partir de `Vision.md`, `Roadmap.md` y los principios de arquitectura del master spec (§73).

## El pivote: de ERP amplio a núcleo enfocado

El master spec original (§3, §16) describía un ERP de inventario completo: Productos, Categorías, Inventario, Compras, Proveedores, Ventas, Clientes, Kardex, Reportes, Configuración — todo especificado antes de escribir código.

En la práctica, la estrategia de ejecución fue distinta y deliberadamente más angosta: construir primero una base **correcta y completa** (no un MVP a medias de todo el ERP), y expandir módulo por módulo solo cuando la base sostiene el resto con seguridad.

Esa base es:

1. **Autenticación + RBAC + Aislamiento multi-tenant** — sin esto, ningún otro módulo puede considerarse seguro para múltiples empresas. Es la razón por la que Auth/RBAC se construyó *después* de Captura IA pero *antes* que cualquier otro módulo de negocio nuevo (Compras, Ventas, etc.).
2. **Inventario mínimo** (Productos, Categorías, Movimientos) — el esqueleto de datos que todo lo demás (Compras, Ventas, Kardex, Reportes) necesitará como cimiento, construido ya con las reglas de aislamiento por empresa desde el día uno.
3. **Captura IA** — el diferenciador de producto validado primero, precisamente porque ataca el problema central descrito en `Vision.md` (fricción del registro manual) sin necesitar que el resto del ERP exista todavía.

Esta secuencia invierte el orden "natural" de un ERP tradicional (que suele partir de Compras/Ventas) a propósito: se prioriza la plataforma (seguridad, aislamiento, IA) sobre la amplitud de módulos transaccionales.

## Por qué este orden

- **Seguridad primero, features después.** Construir Compras/Ventas sobre una base sin aislamiento por empresa verificado habría significado rehacer esos módulos más tarde. `AGENTS.md` codifica esto como regla dura: fail-closed tenancy, nunca confiar en `empresa_id` del request.
- **Un módulo bien construido vale más que seis módulos a medias.** El master spec especificaba Compras/Ventas/Proveedores/Clientes/Kardex/Reportes en detalle antes de que existiera ni siquiera login. Ninguno de esos módulos llegó a construirse — la especificación no se tradujo en trabajo priorizado. La estrategia actual invierte eso: no se escribe spec de un módulo nuevo hasta que está próximo a construirse (regla explícita en `AGENTS.md` / `SDD_MIGRATION_PLAN.md`).
- **La IA como eje, no como anexo.** Captura IA no es una funcionalidad adicional al final del roadmap — es, junto con el aislamiento multi-tenant, una de las dos piezas que ya está completa y en producción (RC1). Refleja que reducir la fricción de captura es, para este producto, tan central como el control de acceso.

## Fases de la estrategia (ver `00_VISION/Roadmap.md` para el detalle módulo a módulo)

1. **Completado** — Captura IA (foto/voz) de extremo a extremo.
2. **Completado** — Auth (Módulo 1) y Aislamiento por Empresa (Módulo 2).
3. **En curso / próximo** — Autorización real (RBAC, Módulo 3) y gestión de usuarios/roles (Módulos 4-5), invitaciones (Módulo 6), sesiones activas (Módulo 7), logs de seguridad (Módulo 8), perfil (Módulo 9).
4. **Planeado, no programado todavía** — expansión a Compras, Proveedores, Ventas, Clientes, Kardex y Reportes, una vez la plataforma base (Auth/RBAC completo) esté cerrada. Ningún trabajo de código debe iniciarse en estos módulos sin pasar antes por el flujo completo de `AGENTS.md` (PRD → Spec Funcional → Spec Técnico → Revisión de Arquitectura → Aprobación).

## Qué NO cambia con este pivote

- El objetivo general de negocio (`BusinessGoals.md`) sigue siendo el mismo ERP de inventario completo — el pivote es de **secuencia**, no de ambición.
- El stack y los principios arquitectónicos (§73: Clean Architecture, API First, Stateless Backend, Single Source of Truth, SOLID) se mantienen sin cambios y se han seguido consistentemente en todo lo construido hasta ahora.
- La reutilización como plantilla para futuros productos de Fidel OS sigue siendo un objetivo de diseño explícito: la razón de invertir tanto en Auth/RBAC/Multi-tenant antes de features de negocio es que esa base debe poder sostener no solo este producto, sino los que vengan después.
