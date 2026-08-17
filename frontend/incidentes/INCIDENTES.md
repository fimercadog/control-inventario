# Incidentes registrados

## INC-001 — Ruta del manual en spec.md no coincide con la ruta real

**Tipo:** A (resoluble).
**Fuente:** spec.md, sección 2/Fuente 3, apunta a `...\proyectos\manuales\manual-pdf-control`.
**Hallazgo:** esa carpeta no existe. La carpeta real es `...\proyectos\manuales\manual-pdf-control de inventario\` (con " de inventario" al final), y contiene `manual.html`, `FidelOS_Manual_de_Usuario.pdf`, `FidelOS_Manual_de_Usuario.pdf.bak`, `INFORME_ACTUALIZACION_QA.md` y `qa-pages/`.
**Resolución:** localizada y leída la carpeta real (`manual.html` completo, 1071 líneas, más `INFORME_ACTUALIZACION_QA.md`). Sin impacto en el resto del proyecto.

---

## INC-002 — Marca-Proveedor (spec.md ítem 15) no tiene endpoint backend

**Tipo:** C (bloqueo externo).
**Auditoría:** `routes/api.php` no expone ningún grupo `v1/marca-proveedor` ni controlador `MarcaProveedorController`. Solo existe la relación Eloquent `Marca::proveedores()` / `Proveedor::marcas()` (tabla `marca_proveedor`, modelo `MarcaProveedor`), añadida en un Work Order de modelo de datos anterior, sin capa de API.
**Regla aplicable:** spec.md sección 1 — prohíbe crear nuevas rutas API.
**Resolución:** no se construye un módulo/página para Marca-Proveedor. Sin backend expuesto, no hay contrato contra el cual construir un frontend real (spec.md sección 3: "no inventar información"). Queda registrado en `pendientes.md`.

---

## INC-003 — Sin infraestructura de exportación CSV/PDF para Marcas, Unidades de Medida, Clientes, Productos y Stock

**Tipo:** C (bloqueo externo), acotado.
**Contexto:** existía una Work Order interrumpida pidiendo exportación CSV/PDF para Unidades de Medida, bajo la premisa "el módulo actual YA FUNCIONA". Auditoría confirmó que esa premisa era incorrecta — el módulo no existía en el frontend (`unidades/` solo tenía `.gitkeep`).
**Auditoría backend:** `UnidadMedidaController`, `MarcaController`, `ClienteController` y `StockController` no tienen métodos `exportarCsv`/`exportarPdf`, y `routes/api.php` no declara `export/csv`/`export/pdf` bajo `v1/unidades-medida`, `v1/marcas`, `v1/clientes` ni `v1/stock` (a diferencia de `v1/usuarios`, `v1/roles`, `v1/categorias` y `v1/proveedores`, que sí las tienen de Work Orders anteriores).
**Regla aplicable:** spec.md sección 1 — prohíbe crear nuevas rutas API y modificar Controllers.
**Resolución:** estos cuatro módulos se construyen completos (listar/buscar/filtrar/crear/ver/editar/deshabilitar-habilitar) sin botones de exportación. No se agrega infraestructura nueva de exportación. Queda registrado en `pendientes.md` como mejora futura que requeriría una Work Order de backend explícita.

---

## INC-004 — Alcance real de "editar" en Movimientos (duda funcional, resuelta)

**Tipo:** B (duda funcional) → resuelta antes de construir.
**Duda:** el backend expone `PATCH /v1/movimientos/{movimiento}` — a primera vista, esto parecía chocar con la regla ya confirmada del proyecto de que Movimientos es append-only (memoria: "Movimientos is now append-only by confirmed architectural rule").
**Resolución vía manual:** sección 6.6 confirma explícitamente: "los campos contables (cantidad, tipo, producto, stock antes/después) son de solo lectura; solo se puede editar la metadata (notas)". No hay contradicción — el endpoint existe pero su alcance real es metadata únicamente.
**Verificación pendiente antes de construir:** confirmar contra `UpdateMovimientoRequest` real que el único campo aceptado es `notas` (o equivalente), antes de construir el formulario de edición. Si el Request acepta más que eso, se re-evalúa como Tipo C y se detiene esa parte específica sin bloquear el resto del módulo.

---

## INC-006 — `/auth/refresh` puede devolver 401 transitorio bajo navegación rápida repetida

**Tipo:** B (duda funcional) → investigada y caracterizada, no es un defecto de los módulos nuevos.
**Hallazgo:** en dos smoke tests distintos (Fase 2: Marcas/Unidades/Clientes; Fase 4: Productos), una secuencia rápida de varias navegaciones de página completa (`page.goto()`) produjo un único `POST /api/v1/auth/refresh` → 401 en algún punto de la secuencia, sin que ninguna acción funcional real fallara (los reintentos posteriores tuvieron éxito).
**Causa raíz identificada** (leído `use-bootstrap-session.ts` + `lib/api/client.ts`): `useBootstrapSession` llama a `/auth/refresh` en cada montaje de página completa (cada `page.goto()`, no solo una vez por sesión de navegador), y el interceptor de axios también dispara `/auth/refresh` reactivamente ante cualquier 401. Si dos llamadas a `/auth/refresh` coinciden en el tiempo y el backend rota el refresh token en cada éxito, la segunda llamada (con el token ya rotado) puede recibir un 401 legítimo — una carrera clásica de rotación de refresh token, agravada por el patrón de navegación del test (recargas de página completa seguidas), más agresivo que la navegación real por `<Link>` (que no vuelve a montar el layout ni dispara `useBootstrapSession` de nuevo).
**Resolución:** no es un defecto de Marcas/Unidades/Clientes/Productos — es un comportamiento preexistente de la capa de sesión (Fase 1, ya cerrada, spec.md prohíbe tocarla sin una razón real). No se modifica `use-bootstrap-session.ts`/`client.ts` en este proyecto. Registrado para que la Fase 6 (regresión completa) lo tenga presente si reaparece bajo Playwright con navegación real por `<Link>` — ahí sí sería una señal más fuerte de que amerita una Work Order de backend/frontend dedicada.

---

## INC-005 — "Empresa" (Fase 2) y "Configuración" (Fase 5) no tienen backend de edición

**Tipo:** aclaración documentada, no una inconsistencia.
**Auditoría backend:** no existe `EmpresaController` ni `ConfiguracionController`/rutas equivalentes en `routes/api.php`.
**Confirmación por el manual:** sección "Tabla final de funciones", nota explícita: "Los campos de 'Empresa' en Configuración (Nombre, Zona horaria) y el umbral de Captura IA se muestran solo como información — no son editables desde esa pantalla en la versión actual del sistema. Este manual no describe una capacidad de edición que no existe."
**Resolución:** "Empresa" y "Configuración" se tratan como una sola pantalla de solo lectura (no dos módulos separados), poblada únicamente con datos que ya vienen de un endpoint existente (a confirmar cuál — candidato: `GET /auth/me`). Si no hay ningún dato real disponible para mostrar, se degrada a Tipo C y se omite la pantalla en vez de inventar contenido.
