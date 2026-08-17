# Fase 2 — Maestros

**Estado: COMPLETA** (Empresa diferido a Fase 5, ver nota).

| Módulo | Estado | Notas |
|---|---|---|
| Categorías | Ya existía (WO anterior) | Sin cambios — ya funciona, con export CSV/PDF |
| Proveedores | Ya existía (WO anterior) | Sin cambios — ya funciona, con export CSV/PDF |
| **Marcas** | **Construido esta fase** | Patrón idéntico a Categorías sin `descripcion`. Búsqueda solo por nombre (confirmado en `MarcaController::index`). Página 100/página. Sin exportación (INC-003 — sin endpoint backend). Tab Productos (`productos()`, con setRelation en vez de doble query). |
| **Unidades de Medida** | **Construido esta fase** | Igual que Marcas + campo `abreviatura` (opcional). Búsqueda por nombre O abreviatura. Página 100/página. Sin exportación (INC-003). |
| **Clientes** | **Construido esta fase** | Mismo shape que Proveedores (NIT/email Identity, inmutables tras creación) pero SIN tab Productos (no existe endpoint) y SIN exportación (INC-003). Página **20**/página (no 50/100 — verificado contra `ClienteService::listar`, no asumido). Confirmado contra `ClienteDTO`: un campo vaciado en edición se guarda como `null` real, no se omite — el formulario envía `campo \|\| null` explícitamente, nunca omite la clave. |
| Empresa | Diferido | Sin `EmpresaController` ni rutas propias. El manual confirma que los campos de "Empresa" en Configuración son solo informativos, no editables. Se construye junto con Configuración en Fase 5, no como módulo separado (ver INC-005). |

**Archivos nuevos:** `types/{marca,unidad-medida,cliente}.ts`, `lib/api/{marcas,unidades-medida,clientes}.ts`, `hooks/use-{marca,unidad-medida,cliente}-detail.ts`, `components/forms/{marca,unidad-medida,cliente}-form.tsx`, `app/marcas/*`, `app/unidades/*`, `app/clientes/*`.

**Cambio adicional (Fase 1, aplicado aquí por necesidad práctica):** Sidebar agrupado visualmente en 4 grupos (General/Inventario/Terceros/Administración) per manual.html sección 5 — cambio aditivo en `nav-items.ts` (campo `group` opcional) y `sidebar-nav.tsx` (renderiza encabezados de grupo), sin romper ningún item existente sin grupo. No es una reconstrucción del Sidebar, solo agrupación visual de los mismos links.

**Verificación:** `npx tsc --noEmit` limpio. Smoke test real contra backend (login QA real, navegación a las 3 páginas nuevas): datos reales cargados (100/100/20 filas, coincidiendo con los defaults reales de cada backend), 0 errores de consola, sidebar agrupado confirmado visualmente. Un 401 transitorio de `/auth/refresh` apareció en un primer intento con navegación muy rápida sin esperar `networkidle` — no se reprodujo en un segundo intento ni ocurre en páginas ya existentes (Categorías/Proveedores/Usuarios/Roles) con el mismo patrón de navegación; tratado como flake de timing del test, no un defecto real (mismo patrón ya documentado de este proyecto con `php artisan serve`).

**Pendiente para Fase 6:** cobertura Playwright completa (RBAC, multi-tenant, responsive) para estos 3 módulos nuevos — la verificación de esta fase fue un smoke test dirigido, no la suite exhaustiva, siguiendo el propio orden de `spec.md` (que reserva "Playwright, regresión completa" para la Fase 6, no por módulo).
