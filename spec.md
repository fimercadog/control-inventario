# FidelOS CRM — Especificación de producto y construcción

## 1. Objetivo

FidelOS será un CRM web multiempresa en español para centralizar relaciones con clientes, oportunidades, actividades y ventas. El inventario existente pasa a ser un módulo conectado al proceso comercial: sirve para consultar disponibilidad y registrar movimientos, pero no define el producto.

La beta debe permitir a un equipo comercial captar y calificar prospectos, convertirlos en clientes, gestionar un embudo de ventas, programar y completar seguimientos, automatizar tareas y consultar resultados. Todos los datos estarán aislados por empresa, serán auditables y respetarán permisos por rol.

## 2. Alcance funcional de la beta

### CRM comercial

- **Contactos y empresas cliente:** prospectos, clientes, contactos, etiquetas, origen, responsable, datos de contacto y notas.
- **Embudo de oportunidades:** etapas configurables, valor, probabilidad, fecha estimada de cierre, responsable, productos/servicios y razón de pérdida.
- **Actividades:** llamadas, correos, reuniones, tareas y notas; estados pendiente, completada, vencida y cancelada; recordatorios y asignación.
- **Automatización:** reglas activadas por eventos del CRM que crean actividades, asignan responsables, actualizan etapas o envían notificaciones dentro de la aplicación. Deben ejecutarse en cola, ser idempotentes, tener historial y no duplicar resultados.
- **Dashboard:** cartera, oportunidades por etapa, valor ponderado, conversión, actividades pendientes/vencidas y rendimiento por responsable.
- **Reportes:** embudo, actividad comercial, conversión, clientes, inventario y movimientos, con filtros, exportación y permisos.

### Inventario conectado

Se conserva el catálogo, productos, proveedores, stock y movimientos actuales. En oportunidades y ventas se pueden consultar productos y su disponibilidad. El stock sólo cambia a través de `InventoryService`; una oportunidad no afecta existencias hasta que se confirme explícitamente una venta o despacho.

### Contingencia CRM limitada

El modo de contingencia conserva la operación offline existente de productos y añade sólo el registro **manual** de actividades CRM. Una actividad offline queda en la cola local y se sincroniza explícitamente, una por una, con idempotencia y auditoría. Al sincronizar, el usuario actual queda como creador y responsable.

No se permite offline crear o editar oportunidades, cambiar etapas, reasignar responsables, ejecutar automatizaciones, convertir contactos ni alterar inventario. Estas acciones quedan bloqueadas para evitar conflictos comerciales y duplicados.

### Fuera de alcance de la beta

- Envío real de correo, WhatsApp o SMS sin una integración configurada.
- Facturación electrónica, pagos y contabilidad.
- Captura IA productiva sin proveedor, credenciales, límites de archivos y pruebas de seguridad. La interfaz puede permanecer visible pero bloqueada.

## 3. Arquitectura

| Capa | Decisión |
| --- | --- |
| Backend | Laravel 12, PHP 8.2+, API REST `/api/v1` |
| Datos | SQLite en desarrollo; MySQL/PostgreSQL en producción |
| Autorización | JWT, Spatie Permission, Policies y alcance obligatorio por `empresa_id` |
| Procesamiento | Laravel queues para automatizaciones, recordatorios e importaciones |
| Frontend | Next.js 16, React 19, TypeScript estricto y App Router |
| UI | Tailwind CSS, Base UI, Lucide, React Hook Form y Zod |
| Estado | Redux Toolkit (sesión/UI) y cliente de consultas remotas |
| Calidad | PHPUnit para reglas/API y Playwright para flujos críticos |

La API usa respuestas JSON consistentes y errores normalizados. Las migraciones son la fuente de verdad del esquema. No se versionan secretos, tokens, datos locales ni archivos cargados.

## 4. Modelo de datos

Todas las entidades operativas contienen `empresa_id`. Las consultas y escrituras se limitan por la empresa de la sesión incluso si se manipulan IDs en una petición.

| Dominio | Entidades principales |
| --- | --- |
| Organización | empresas, usuarios, perfiles, invitaciones, roles, permisos |
| CRM | clientes, contactos, etiquetas, cliente_etiqueta, oportunidades, etapas_oportunidad, oportunidad_productos, actividades, notas, fuentes_lead |
| Automatización | reglas_automatizacion, ejecuciones_automatizacion, notificaciones |
| Inventario | categorías, marcas, unidades, proveedores, productos, producto_proveedor, movimientos, lotes opcionales |
| Control | audit_logs, trabajos de captura IA, contingencia y reportes programados |

Reglas de integridad:

1. Un contacto pertenece a un cliente o puede existir como prospecto no convertido; convertirlo crea o vincula un cliente sin perder historial.
2. Toda oportunidad tiene cliente, etapa, responsable y monto no negativo. Sus cambios de etapa se guardan en auditoría.
3. Una actividad tiene responsable, fecha/hora y estado. Al completarse conserva quién y cuándo la completó.
4. Las reglas automáticas se identifican por evento, filtros y acciones. Cada ejecución guarda una clave de idempotencia, resultado y error si existe.
5. Los productos y movimientos preservan las reglas de stock existentes: no negativo, movimientos inmutables y trazabilidad completa.

## 5. Roles y permisos

Roles iniciales: Administrador, Gerente comercial, Vendedor, Bodeguero, Auxiliar y Consulta.

Los permisos son explícitos por recurso y acción: ver, crear, editar, asignar, completar, convertir, deshabilitar, exportar, ajustar inventario y administrar automatizaciones. Un Vendedor sólo accede a los registros que posee o le fueron asignados, salvo un permiso de visión global. Los controles de interfaz complementan, nunca sustituyen, las políticas de API.

## 6. API de la beta

Además de autenticación, perfil, usuarios, roles, auditoría, catálogo e inventario existentes, exponer:

```text
GET|POST        /clientes
GET|PUT|DELETE  /clientes/{id}
GET|POST        /contactos
GET|PUT|DELETE  /contactos/{id}
POST            /contactos/{id}/convertir

GET|POST        /etapas-oportunidad
GET|PUT|DELETE  /etapas-oportunidad/{id}
GET|POST        /oportunidades
GET|PUT         /oportunidades/{id}
POST            /oportunidades/{id}/cambiar-etapa
POST            /oportunidades/{id}/marcar-ganada
POST            /oportunidades/{id}/marcar-perdida

GET|POST        /actividades
GET|PUT|DELETE  /actividades/{id}
POST            /actividades/{id}/completar

GET|POST        /automatizaciones
GET|PUT|DELETE  /automatizaciones/{id}
GET             /automatizaciones/{id}/ejecuciones
GET             /notificaciones
POST            /notificaciones/{id}/leer

GET             /dashboard
GET             /reportes/{clave}
POST            /contingencia/actividades/sincronizar
```

Los listados aceptan búsqueda, filtros, orden y paginación. Las eliminaciones que afecten trazabilidad son deshabilitaciones lógicas.

## 7. Automatizaciones

Implementar primero estas reglas configurables y activables:

| Evento | Acción de la regla |
| --- | --- |
| Contacto creado | asignar responsable y crear tarea de primer contacto |
| Oportunidad creada | crear seguimiento con vencimiento configurable |
| Cambio de etapa | crear actividad, notificar al responsable o reasignar |
| Oportunidad sin actividad reciente | crear recordatorio de seguimiento |
| Oportunidad ganada | notificar y preparar venta/despacho sin tocar stock automáticamente |

Un comando programado detecta tareas vencidas y oportunidades sin seguimiento; su ejecución debe ser segura al repetirse. Si la cola está caída, la interfaz muestra el estado real y permite reintentar trabajos autorizados.

## 8. Frontend

Rutas principales:

| Área | Rutas |
| --- | --- |
| Inicio | `/dashboard` |
| CRM | `/clientes`, `/contactos`, `/oportunidades`, `/actividades`, `/automatizaciones` |
| Inventario | `/productos`, `/stock`, `/movimientos`, catálogos y proveedores |
| Administración | `/usuarios`, `/roles`, `/auditoria`, `/configuracion` |
| Utilidad | `/reportes`, `/perfil`, `/contingencia`, `/captura-ia` |

El tablero prioriza el trabajo diario: tareas vencidas y de hoy, oportunidades propias, valor del embudo, conversiones y alertas de inventario. La vista de oportunidad muestra cronología unificada de cambios, actividades y notas, productos asociados y acciones permitidas.

Las tablas incluyen carga, vacío, error, filtros, paginación, accesibilidad por teclado y acciones condicionadas por permisos. La interfaz debe mantener los temas claro/oscuro actuales, contraste suficiente y mensajes que indiquen con precisión si una automatización se ejecutó, quedó pendiente o falló.

## 9. Calidad, seguridad y datos iniciales

- Probar aislamiento por empresa, permisos, conversión, actividades, transición de etapas, idempotencia de automatizaciones e invariantes de inventario.
- Añadir pruebas E2E para inicio de sesión, crear contacto, convertirlo, crear y avanzar oportunidad, completar actividad y validar una automatización.
- Auditar actor, empresa, recurso, acción, resultado y metadatos relevantes, sin guardar secretos.
- Sembrar una empresa demo y datos coherentes: clientes, contactos, etapas, oportunidades, tareas próximas y productos. Las credenciales locales se documentan sólo en README o `.env.example` sin contraseñas reales de producción.

## 10. Definición de terminado

La beta estará terminada cuando un administrador pueda configurar usuarios, permisos, etapas y automatizaciones; un vendedor pueda captar y convertir prospectos, gestionar sus oportunidades y cumplir sus actividades; el sistema cree y muestre seguimientos automáticos sin duplicarlos; el dashboard y reportes reflejen los datos; e inventario continúe trazable y aislado por empresa. Antes de entregar se ejecutan las pruebas relevantes de Laravel, la compilación del frontend y las pruebas E2E críticas.
