Aquí tienes una versión altamente optimizada. Al consolidar listas verticales en texto continuo y eliminar redundancias, se reduce drásticamente el consumo de tokens manteniendo el 100% de las reglas y la rigurosidad técnica.

---

# FidelOS — Especificación Maestra Frontend

## 0. PROPÓSITO Y REGLA ABSOLUTA

Desarrollar el frontend completo de FidelOS (funcional, seguro, responsive y probado).
**PROHIBIDO MODIFICAR BACKEND O BASE DE DATOS.** Backend (Laravel) y BD (MySQL/SQLite) son INMUTABLES. No alterar controladores, modelos, rutas, permisos, migraciones ni estructura. El frontend se adapta al backend real. Ante inconsistencias: NO tocar el backend, registrar el incidente y continuar.

## 1. FUENTES DE VERDAD (En Orden)

1. **Backend Real:** Define endpoints, campos, validaciones, relaciones, permisos y respuestas. Auditar directamente. No asumir.
2. **BD Real:** Solo lectura para entender estructuras y relaciones.
3. **Manual (`...\manual-pdf-control`):** Define reglas y flujos. Si contradice al backend, prevalece el backend (registrar discrepancia).
4. **Frontend Existente:** Evaluar cada componente: **REUSE** (si funciona) → **EXTEND** (si falta lógica) → **REBUILD** (solo si es incompatible). Cero refactorizaciones innecesarias.

## 2. ALCANCE Y ORDEN DE IMPLEMENTACIÓN

Implementar TODAS las funcionalidades reales cruzando Manual + Backend + Frontend. Seguir este orden estricto:

* **Fase 1 - Foundation:** Auditorías, dependencias, theme, layout (sidebar/header), API Client, Auth (JWT, refresh, logout, rutas protegidas), Login, Recuperación, Dashboard.
* **Fase 2 - Maestros:** Empresa, Categorías, Marcas, U. Medida, Proveedores, Clientes.
* **Fase 3 - Seguridad:** Permissions, Roles, Usuarios (usar módulo Usuarios actual como plantilla base).
* **Fase 4 - Inventario:** Productos, Prod-Prov, Marca-Prov, Stock, Movimientos.
* **Fase 5 - Especiales:** Captura IA, Reportes, Auditoría, Perfil, Configuración.
* **Fase 6 - QA Final:** TS, ESLint, Build, pruebas (Playwright, regresión), RBAC, multiempresa, responsive, revisión final, commit/push.

## 3. CONTINUIDAD AUTOMÁTICA (CRÍTICA)

**PROHIBIDO DETENERSE O PREGUNTAR.** Al terminar un módulo: probar, corregir, registrar avance y pasar al siguiente automáticamente. No esperar instrucciones para continuar.

## 4. MANEJO DE INCIDENTES

Nunca detener el proyecto general.

* **Tipo A (Resoluble):** Solucionar ajustando UI/código frontend.
* **Tipo B (Duda Funcional):** Resolver consultando manual, backend, frontend actual o tests.
* **Tipo C (Bloqueo Externo):** Si exige modificar backend/BD, NO tocar backend. Documentar en `frontend/incidentes/` y saltar a otra tarea posible.

## 5. ESTRUCTURA DE SEGUIMIENTO

Crear la siguiente estructura en el repositorio:

* `frontend/avances/`: `README.md`, `01-foundation.md`, `02-maestros.md`, `03-seguridad.md`, `04-inventario.md`, `05-especiales.md`, `06-qa-final.md`.
* `frontend/incidentes/`: `README.md`, `INCIDENTES.md`, `pendientes.md`.
* `frontend/spec.md`


## 3.1 GIT POR CADA MÓDULO — OBLIGATORIO

Cada módulo terminado debe cerrarse individualmente con:

1. Implementación completada.
2. Tests del módulo ejecutados.
3. TypeScript limpio.
4. ESLint limpio en archivos modificados.
5. Build válido cuando corresponda.
6. Regresión mínima de módulos relacionados.
7. Actualización de `frontend/avances/`.
8. Revisión de `git diff`.
9. Commit con Conventional Commits.
10. `git push`.
11. Verificación de que el commit quedó en `origin`.
12. Continuar AUTOMÁTICAMENTE con el siguiente módulo.

NO esperar hasta el final del proyecto para hacer commits o push.

NO acumular múltiples módulos sin commit.

NO preguntar al propietario si debe hacer commit.

NO preguntar si debe continuar después del push.

El ciclo obligatorio es:

IMPLEMENTAR MÓDULO
→ PROBAR
→ CORREGIR
→ REGISTRAR AVANCE
→ COMMIT
→ PUSH
→ VERIFICAR PUSH
→ SIGUIENTE MÓDULO

### Regla de commit

Utilizar Conventional Commits.

Ejemplos:

`feat(categories): complete categories frontend`

`feat(brands): complete brands frontend`

`feat(units): complete units frontend`

`feat(suppliers): complete suppliers frontend`

`feat(products): complete products frontend`

`test(products): add products coverage`

`fix(stock): correct stock frontend behavior`

Puede haber más de un commit por módulo cuando existan bloques lógicos claros.

NO hacer commits con:

- TypeScript roto;
- tests atribuibles fallando;
- conflictos;
- código incompleto;
- archivos ajenos a la unidad;
- secretos;
- `.env`.

### Regla de push

Después del último commit de CADA módulo ejecutar:

`git push`

Después verificar:

`git status --short --branch`

y/o:

`git rev-parse HEAD`
`git rev-parse origin/<rama>`

El módulo solamente puede marcarse como cerrado cuando:

`LOCAL == ORIGIN`

Si el push falla:

1. investigar;
2. corregir;
3. volver a ejecutar;
4. NO detener el proyecto por un fallo de push temporal;
5. registrar incidente únicamente si no puede resolverse;
6. continuar cuando sea seguro hacerlo.

### Avances

En `frontend/avances/` registrar por módulo:

- Estado
- Tests
- Commit(s)
- Hash(es)
- Push confirmado
- Fecha

Ejemplo:

## Categorías

Estado: COMPLETE

Tests: 19/19 PASS

Commits:
- `abc1234 feat(categories): complete categories frontend`
- `def5678 test(categories): add categories coverage`

Push:
CONFIRMED

Origin:
SYNCED
