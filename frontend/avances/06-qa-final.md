# Fase 6 — QA Final

**Estado: COMPLETA.**

## TypeScript / ESLint / Build

Verificados repetidamente a lo largo de todo el proyecto (no solo al final) — cada módulo de las Fases 2-5 pasó `tsc --noEmit`, `next build` y ESLint antes de continuar al siguiente. Verificación final: los tres, limpios. Un `next build` (Turbopack) corriendo en paralelo con un `next dev` de larga duración sobre el mismo `.next/` causó una desincronización real de tipos de rutas (`.next/dev/types` vs `.next/types`) varias veces durante el proyecto — se resolvió cada vez con un `next build` adicional; no es un defecto de código.

## RBAC — verificado contra el permission-matrix real

`database/seeders/RoleSeeder.php` leído directamente (no asumido) para los 4 roles QA no-administradores. Confirmado en `tests/fase6-qa-final.spec.ts` (8/8 tests): Supervisor/Bodeguero/Vendedor/Auxiliar Contable ven exactamente los módulos que sus permisos reales permiten, nada más — incluyendo la ausencia total de Marcas/Unidades de Medida/Stock/Proveedores/Categorías/Roles en los 4 (ninguno de los 4 tiene esos permisos, confirmado en el seeder). Acceso directo por URL a un módulo no autorizado queda bloqueado por el propio frontend (mensaje "no tienes permiso") además del backend real.

## Multi-tenant

Verificado con la cuenta real `qa-rbac-admin-b@example.com` (Empresa "Distribuidora Andina S.A.S.", empresa_id=2): Productos y Movimientos muestran únicamente datos de su propia empresa. Acceso directo por API a un recurso de la Empresa A (`GET /productos/1`, empresa_id=1, verificado con tinker antes de la prueba) devuelve 403/404 — el aislamiento vive en el backend (`FiltersByEmpresa`/`resolverParaEmpresaActual`), el frontend no depende de ocultar nada por sí solo.

## Responsive

Verificado en viewport móvil (375×812): el sidebar colapsa a un Sheet accesible por el botón "Abrir menú"; sin overflow horizontal en Reportes (catálogo de 13 tarjetas). Cada módulo nuevo, individualmente, ya había verificado su propio comportamiento responsive antes de cerrarse (Fases 2-5).

## Corrección global — Selects de relación (WO adicional durante esta fase)

Encontrada y corregida una categoría real de defecto: los Select de relación (marca/categoría/unidad de medida en Productos; producto/proveedor en Movimientos y formularios relacionados; tipo_reporte y filtros dinámicos en Reportes) mostraban el ID crudo en vez del nombre legible. Corregido con un helper compartido (`lib/utils/select-label.ts`), verificado en vivo contra un producto real, incluyendo dos hallazgos secundarios reales (el placeholder no aparece solo por pasar la prop cuando ya hay una función `children`; una relación real puede no estar en la página actual del picker cuando hay más de 100 registros — Empresa A tiene 247 unidades de medida activas, consistente con la contaminación de datos E2E ya documentada). Ver INC-007/INC-008 en `incidentes/INCIDENTES.md`. Commit `69af795`.

## Regresión completa — resultado definitivo

Primer intento de suite completa: 29 fallos, la mayoría `ERR_CONNECTION_REFUSED` masivo en `proveedores.spec.ts` y fallos aislados en `auth.spec.ts`/`categorias.spec.ts`. Investigado antes de aceptar cualquier resultado (no se asumió regresión real): reproducción aislada de `auth.spec.ts` → 16/16 limpio: confirma que NO era un defecto de código. Causa raíz real identificada: `next dev` llevaba corriendo en background toda la sesión mientras se ejecutaron múltiples `next build` sucesivos sobre el mismo directorio `.next/` — una combinación conocida de causar inestabilidad en Next.js. Reiniciado el dev server limpio (`.next/` borrado, servidor nuevo) y repetida la suite completa:

**123/123 tests PASS (5.4 min), 0 fallos — resultado limpio y definitivo**, incluyendo los 6 spec files: `auth.spec.ts` (16), `categorias.spec.ts` (24), `proveedores.spec.ts` (27), `roles.spec.ts` (24), `usuarios.spec.ts` (23), `fase6-qa-final.spec.ts` (8, nuevo en esta fase — RBAC/multi-tenant/responsive de los módulos nuevos).

## Servidores de desarrollo

Detenidos limpiamente al cierre — PIDs identificados vía `Get-CimInstance Win32_Process`, terminados, y ambos puertos (3000/8000) verificados como realmente libres vía `curl` antes de dar por cerrado el proyecto (no asumir que detener el wrapper mató el proceso real).

## Commits de esta fase

- `69af795 fix(forms): display relation labels instead of raw ids` (incluye `tests/fase6-qa-final.spec.ts`)

Push: CONFIRMED. Origin: SYNCED (verificado `git rev-parse HEAD` == `git rev-parse origin/master`).
