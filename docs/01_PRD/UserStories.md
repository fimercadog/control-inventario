# Historias de Usuario

El master spec no contenía historias de usuario formales (§9 solo listaba roles). Este documento deriva historias reales a partir de lo construido (Auth, Aislamiento por Empresa, Captura IA, esqueleto de Productos/Categorías/Movimientos) y agrega historias forward para los módulos planeados, cada una etiquetada `[BUILT]` o `[PLANNED]`.

## Autenticación

- **[BUILT]** Como usuario de una empresa cliente, quiero iniciar sesión con mi correo y contraseña para acceder al sistema.
- **[BUILT]** Como usuario, quiero que mi sesión persista tras recargar la página (refresh silencioso) para no tener que loguearme constantemente.
- **[BUILT]** Como usuario, quiero poder marcar "Remember Me" para que mi sesión dure más tiempo (30 días en vez de 7).
- **[BUILT]** Como usuario, quiero recuperar mi contraseña si la olvido, sin exponer si el correo existe o no en el sistema.
- **[BUILT]** Como usuario, quiero cerrar sesión y que mi token quede invalidado de inmediato.
- **[PLANNED]** Como usuario, quiero ver y revocar mis sesiones activas individualmente (Módulo 7 — Active Sessions).
- **[PLANNED]** Como administrador, quiero ver el historial de intentos de login (exitosos y fallidos) de mi empresa (Módulo 8 — Security Logs).

## Aislamiento por empresa (multi-tenant)

- **[BUILT]** Como usuario de la Empresa A, quiero tener la garantía absoluta de que nunca puedo ver ni modificar datos de la Empresa B, sin importar qué IDs intente manipular en las peticiones.
- **[BUILT]** Como sistema, si por algún error no puedo resolver el contexto de empresa de una petición, quiero devolver cero registros en vez de todos los registros (fail-closed).
- **[BUILT]** Como Administrador de Plataforma (Fidel OS), quiero poder operar fuera del aislamiento de una empresa específica, pero seguir necesitando permisos explícitos para cada acción (nunca un bypass total).

## Captura IA

- **[BUILT]** Como operario de bodega, quiero tomar una foto de un producto para que el sistema extraiga automáticamente los datos del movimiento de inventario.
- **[BUILT]** Como operario de bodega, quiero grabar una nota de voz describiendo un movimiento para que el sistema lo transcriba y extraiga la información relevante.
- **[BUILT]** Como operario de bodega, quiero combinar foto y voz en una sola captura para dar más contexto a la IA.
- **[BUILT]** Como supervisor, quiero revisar el detalle que la IA extrajo de una captura antes de que se aplique al inventario, y poder corregirlo si está mal.
- **[BUILT]** Como supervisor, quiero confirmar una captura para que el movimiento de inventario se aplique de forma definitiva.
- **[BUILT]** Como supervisor, quiero poder descartar una captura si no es válida, sin que afecte el stock.
- **[BUILT]** Como sistema, quiero consultar el listado de capturas y el detalle de una captura específica por su identificador externo (`uuid`), sin exponer el ID numérico interno.

## Productos, Categorías y Movimientos (esqueleto)

- **[BUILT]** Como sistema, cada producto capturado vía IA queda asociado a una categoría y a la empresa correspondiente.
- **[BUILT]** Como sistema, todo movimiento de inventario generado (por Captura IA) queda registrado de forma permanente — no existe endpoint para eliminarlo.
- **[PLANNED]** Como supervisor, quiero un formulario manual para crear/editar productos directamente (sin pasar por Captura IA), con todos sus datos (código, código de barras, marca, proveedor principal, costo, precio, IVA).
- **[PLANNED]** Como supervisor, quiero poder duplicar un producto existente para crear variantes rápidamente.
- **[PLANNED]** Como supervisor, quiero importar/exportar productos en lote.
- **[PLANNED]** Como usuario, quiero consultar productos con bajo stock para anticipar quiebres de inventario (RF-018).

## Catálogos (Categorías, Marcas, Unidades de Medida)

- **[PLANNED — en desarrollo, RC1 Fase 1]** Como administrador, quiero gestionar el catálogo de categorías de producto (crear, editar, deshabilitar) desde su propia pantalla, en vez de que solo exista implícitamente como `categoria_id`.
- **[PLANNED — en desarrollo, RC1 Fase 1]** Como administrador, quiero gestionar el catálogo de marcas de producto, para no depender de texto libre inconsistente.
- **[PLANNED — en desarrollo, RC1 Fase 1]** Como administrador, quiero gestionar el catálogo de unidades de medida de producto, por la misma razón.
- **[PLANNED — en desarrollo, RC1 Fase 1]** Como usuario creando o editando un producto, quiero seleccionar categoría/marca/unidad de medida de un catálogo (con opción de crear una nueva al vuelo), en vez de escribir texto libre.

## Dashboard

- **[BUILT — con datos de demostración]** Como usuario, quiero ver un dashboard con indicadores clave (productos, movimientos recientes, etc.) al iniciar sesión. Nota: hoy el dashboard usa datos mock, no datos reales de la empresa — ver `03_FUNCTIONAL_SPEC/Dashboard.md` (propiedad de otro documento) para el detalle exacto de qué está mockeado.

## Gestión de usuarios y roles

- **[PLANNED]** Como administrador, quiero invitar a un nuevo usuario por correo, asignándole un rol ya existente (Módulo 6 — Invitaciones).
- **[PLANNED]** Como administrador, quiero crear y editar roles personalizados de mi empresa, asignándoles permisos del catálogo global (Módulo 5 — Role Management).
- **[PLANNED]** Como administrador, quiero activar/desactivar usuarios de mi empresa sin eliminarlos (Módulo 4 — User Management).
- **[PLANNED]** Como usuario, quiero editar mi perfil (avatar, tema, idioma, zona horaria) (Módulo 9 — User Profile).

## Módulos ERP planeados (no construidos)

- **[PLANNED]** Como usuario de Compras, quiero registrar órdenes de compra y que el stock se actualice automáticamente al recibirlas (RF-011, RF-012).
- **[PLANNED]** Como usuario de Compras, quiero registrar y consultar proveedores (RF-019).
- **[PLANNED]** Como usuario de Ventas, quiero registrar ventas y que el stock se actualice automáticamente (RF-013, RF-014).
- **[PLANNED]** Como usuario de Ventas, quiero registrar y consultar clientes (RF-020).
- **[PLANNED]** Como supervisor, quiero consultar el Kardex (historial completo de movimientos por producto) (RF-016).
- **[PLANNED]** Como CEO/administrador, quiero generar reportes por rango de fechas (RF-017).

Estos módulos siguen siendo parte de la visión de producto (ver `01_PRD/OutOfScope.md`) — no están descartados, solo no priorizados todavía. No se debe iniciar implementación de ninguno sin pasar primero por el flujo completo de `AGENTS.md`.
