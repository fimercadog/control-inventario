# FidelOS — Plan de construcción desde cero

## 1. Punto de partida y objetivo

Este documento asume que **backend y frontend comienzan en cero**: no hay API, base de datos, páginas, autenticación ni datos cargados. Es la guía ordenada para construir FidelOS hasta su primera versión beta funcional.

FidelOS será un sistema web multiempresa de control de inventario en español. Permitirá administrar catálogos y productos, registrar movimientos trazables, consultar stock, controlar usuarios/roles y preparar una futura captura de inventario por foto o audio.

### Resultado de la beta

- Usuarios autenticados y aislados por empresa.
- Inventario que no permite stock negativo y conserva sus movimientos.
- Dashboard, catálogos, productos, stock, movimientos, terceros, usuarios, roles, auditoría y reportes básicos.
- Temas claro y oscuro, interfaz consistente y aviso de versión beta.
- Captura IA visible, pero bloqueada hasta contar con proveedor/API.

## 2. Decisiones técnicas iniciales

| Capa | Decisión |
| --- | --- |
| Backend | Laravel 12, PHP 8.2+, API REST bajo `/api/v1` |
| Autorización | JWT/Sanctum según configuración, Spatie Permission y Policies |
| Datos | SQLite en desarrollo; MySQL o PostgreSQL en producción |
| Frontend | Next.js 16, React 19, TypeScript estricto |
| Interfaz | Tailwind CSS, Base UI, iconos Lucide |
| Formularios | React Hook Form + Zod |
| Estado | Redux Toolkit para sesión/estado global; TanStack Query para consultas remotas |
| Pruebas | PHPUnit/Pest para backend y Playwright para flujos críticos de frontend |

Estructura objetivo:

```text
control-inventario/
├── backend/                  # Laravel: API, migraciones, seeders y pruebas
├── frontend/                 # Next.js: páginas, componentes y pruebas E2E
├── spec.md                   # Este plan de construcción
└── README.md                 # Arranque local y comandos habituales
```

Nunca versionar `.env`, secretos, tokens, archivos cargados ni bases SQLite con información local.

## 3. Fase 0 — Preparar los dos proyectos vacíos

### Backend

1. Crear proyecto Laravel en `backend/`.
2. Configurar `.env` con SQLite local, correo de desarrollo y `FRONTEND_URL`.
3. Instalar autenticación JWT/Sanctum y Spatie Permission.
4. Crear prefijo de rutas `/api/v1` y respuestas JSON consistentes.
5. Configurar CORS para el frontend local.
6. Añadir pruebas base y una base de datos aislada para testing.

### Frontend

1. Crear proyecto Next.js en `frontend/` con TypeScript, App Router y Tailwind.
2. Definir `NEXT_PUBLIC_API_URL=http://127.0.0.1:8000/api/v1` para desarrollo.
3. Instalar cliente HTTP, Redux Toolkit, TanStack Query, React Hook Form, Zod, Base UI y Lucide.
4. Crear la estructura `app/`, `components/`, `features/`, `hooks/`, `lib/` y `types/`.
5. Crear un proveedor de sesión y un cliente API que maneje token, renovación y errores 401/403.

### Criterio de cierre

La API responde a una ruta de salud y el frontend puede consultar dicha ruta. Ambos proyectos compilan sin errores.

## 4. Fase 1 — Base de datos y aislamiento por empresa

Crear migraciones, modelos, factorías, seeders y políticas para:

| Grupo | Entidades |
| --- | --- |
| Organización | empresas, usuarios, perfiles, invitaciones |
| Acceso | roles, permisos, relación usuario–rol |
| Catálogos | categorías, marcas, unidades de medida, proveedores, clientes |
| Relaciones | marca_proveedor, producto_proveedor |
| Inventario | productos, movimientos de inventario, lotes si se requieren |
| Control | auditorías, trabajos/procesamientos de captura IA, cola de contingencia si se persiste en servidor |

Reglas obligatorias desde el inicio:

- Las entidades operativas tienen `empresa_id`.
- Toda consulta y escritura se restringe a la empresa de la sesión.
- Las migraciones son la fuente de verdad del esquema.
- Cada nuevo campo requiere migración, validación, recurso API, prueba y actualización del cliente que lo consuma.
- Seeders crean datos realistas y legibles; nunca exponen nombres `E2E`, cadenas aleatorias o datos de test al usuario.

### Datos iniciales

Crear una empresa demo, un administrador de desarrollo documentado sólo en el README/local y catálogos coherentes: alimentos, bebidas, limpieza, unidades (unidad, kg, g, L, ml, caja, bolsa, docena), marcas y proveedores con relaciones plausibles.

## 5. Fase 2 — Autenticación, perfiles y permisos

### Backend

Implementar:

- `POST /auth/login`, incluyendo `remember`.
- `POST /auth/refresh` y `POST /auth/logout`.
- `GET /auth/me`.
- Recuperación/actualización de perfil según el alcance de la beta.
- Roles iniciales: Administrador, Bodeguero, Auxiliar y Consulta.
- Permisos explícitos para ver, crear, editar, deshabilitar y ajustar inventario.

### Frontend

Implementar:

- Página `/login`, validación, mensajes de error y casilla **Recordar usuario**.
- Protección de rutas privadas y redirección segura.
- Bootstrap de sesión al recargar la aplicación.
- Cabecera con perfil, rol y cierre de sesión.

### Criterio de cierre

Un administrador puede iniciar/cerrar sesión, la sesión recordada persiste según su configuración y un usuario sin permiso no puede ejecutar acciones ni leer datos de otra empresa.

## 6. Fase 3 — Catálogos y productos

Construir API y páginas para Categorías, Marcas, Unidades de medida, Proveedores, Clientes y Productos.

### Producto

Campos: nombre, código interno, código de barras, categoría, marca, unidad de medida, presentación, descripción, costo, precio, stock mínimo, stock máximo y estado.

La presentación complementa la unidad. Debe permitir expresar, por ejemplo, “bolsa de 15 kg”, “caja de 24 unidades” o “botella de 1 L”; el formulario debe separar cantidad por presentación y contenido/unidad cuando aporte claridad.

### Relaciones

- Una marca puede tener varios proveedores.
- Un producto puede tener varios proveedores y uno puede identificarse como principal.
- La lista de marcas muestra sus proveedores de forma legible.
- Los modales de creación/edición de catálogos mantienen el mismo patrón visual, con bordes, profundidad, secciones y espacio suficiente.

### Endpoints orientativos

```text
GET|POST        /categorias, /marcas, /unidades-medida, /proveedores, /clientes
GET|PUT|DELETE  /{recurso}/{id}
GET|POST        /productos
GET|PUT         /productos/{id}
POST            /productos/{id}/habilitar
POST            /productos/{id}/deshabilitar
```

## 7. Fase 4 — Núcleo de inventario y trazabilidad

Crear un servicio de dominio, por ejemplo `InventoryService`, como **único** punto autorizado para alterar el stock. Los controladores no modifican cantidades directamente.

### Movimientos

Tipos base:

- Ingreso
- Salida
- Ajuste por conteo físico
- Ajuste por ingreso adicional

Todo movimiento conserva producto, cantidad positiva, tipo, fecha, usuario, empresa y observación cuando aplique. Los ingresos admiten proveedor, costo unitario, documento/factura, lote y vencimiento.

### Reglas obligatorias

1. No existe edición directa de `stock_actual`.
2. Una salida o ajuste no puede dejar stock negativo.
3. En Stock existen dos acciones manuales:
   - **Conteo físico:** fija el total contado y crea el diferencial como ajuste.
   - **Agregar stock:** suma unidades y crea un movimiento de ajuste.
4. Un ajuste exige observación de al menos tres caracteres.
5. El stock actual es de sólo lectura al editar producto; allí sólo se cambian umbrales.
6. Stock igual a cero inhabilita automáticamente el producto si estaba activo y fue agotado por el sistema.
7. Un ingreso o ajuste positivo reactiva sólo al producto inhabilitado automáticamente; una inhabilitación manual se respeta.
8. Stock menor o igual al mínimo muestra **Mínimo alcanzado**; por debajo se identifica como stock bajo.
9. Productos agotados e inactivos permanecen visibles en Stock y Movimientos para preservar trazabilidad.
10. Los movimientos confirmados son inmutables; corregir significa crear un movimiento compensatorio.

### Criterio de cierre

Las existencias, dashboard, historial, auditoría y alertas reflejan exactamente los movimientos realizados. Se prueban ingreso, salida, ambos tipos de ajuste, stock cero, reactivación y rechazo de stock negativo.

## 8. Fase 5 — Pantallas operativas

Crear estas rutas y sus acciones permitidas:

| Área | Rutas/pantallas |
| --- | --- |
| Inicio | Dashboard con métricas, movimientos recientes, acciones rápidas y stock bajo |
| Inventario | Productos, Categorías, Marcas, Unidades de medida, Stock y Movimientos |
| Terceros | Proveedores y Clientes |
| Administración | Usuarios, Roles y Auditoría |
| Utilidad | Reportes, Perfil, Configuración y Contingencia |

El dashboard debe mostrar: saludo, productos totales, stock/valor total según definición contable, stock bajo, entradas y salidas de hoy, movimientos recientes, acceso a Captura IA, acciones rápidas y productos con alerta.

Las tablas incluyen encabezados visualmente distintos, filtros, carga, vacío, errores, estados, acciones accesibles y paginación con rango, primer/último y salto a página.

## 9. Fase 6 — Diseño, temas y accesibilidad

### Identidad

- Tema claro: fondo `#F8F9FF`, superficies blancas y acción primaria índigo `#4F46E5`.
- Tema oscuro: gris carbón/negro suave, no azul saturado; acentos índigo/violeta moderados.
- Éxito `#10B981`, alerta `#F59E0B`, error/contingencia `#EF4444`.
- Fuente sans-serif moderna y legible, como Hanken Grotesk.

### Componentes base

Construir primero `Button`, `Input`, `Select`, `Textarea`, `Dialog`, `Table`, `Badge`, `Card`, `Tooltip`, estados vacíos y paginación. Los componentes deben definir foco, teclado, estados deshabilitados y contraste antes de construir cada módulo.

La interfaz usa tarjetas con radio aproximado de 8 px, bordes sutiles, elevación moderada y espaciado consistente. El sidebar contiene identidad FidelOS, navegación por grupos, Modo Contingencia y aviso de versión beta sobrio; el encabezado ofrece el mismo aviso junto al perfil. Configuración permite alternar y persistir tema claro/oscuro.

No deben existir errores de hidratación, bucles por `useSyncExternalStore` ni componentes enlace tratados incorrectamente como botones nativos.

## 10. Fase 7 — Contingencia

Diseñar este modo independiente de Captura IA.

- Indicar estado de conexión, pendientes, alcance y sincronización manual.
- En beta permitir offline sólo acciones explícitamente soportadas; nunca aparentar que una acción bloqueada se guardó.
- Procesar pendientes uno por uno y en orden, con idempotencia y resolución de conflictos.
- La navegación debe continuar disponible aunque esté activo el modo contingencia.

## 11. Fase 8 — Captura IA (preparación y futuro)

### Beta sin API

Construir la pantalla para conocer el flujo, pero dejarla en modo sólo visualización. Al entrar se abre el modal **“Captura IA está en preparación”**; al cerrarlo se puede recorrer la interfaz, pero carga, selección de modo, análisis y confirmación permanecen deshabilitados. No se simula procesamiento ni se guarda inventario.

### Cuando exista proveedor de IA

La meta es aceptar fotos y audios de aproximadamente 40 a 60 minutos, con múltiples productos en un solo archivo.

1. Guardar archivo y crear trabajo asíncrono.
2. Transcribir audio o extraer datos de imagen mediante el proveedor configurado.
3. Normalizar productos, cantidades, unidades, marcas y proveedores contra los catálogos de la empresa.
4. Mostrar propuesta revisable, nivel de confianza y conflictos.
5. Confirmar todos los movimientos en una transacción atómica, idempotente y auditada.
6. Informar progreso, reintentos y errores sin bloquear la interfaz.

La integración requiere variables de entorno, límites de archivo, almacenamiento, cola de trabajos, protección de costos y pruebas con archivos largos antes de habilitar botones al público.

## 12. Fase 9 — Auditoría, reportes y calidad

- Registrar en auditoría actor, empresa, acción, entidad, fecha, resultado y metadatos pertinentes.
- Añadir filtros y paginación a auditoría, evitando exponer datos de prueba.
- Crear reportes básicos de stock, movimientos y alertas con permisos.
- Cubrir reglas de inventario y autorización con pruebas backend.
- Cubrir login, creación de productos, movimiento, ajuste y bloqueo de IA con Playwright.
- Antes de cada entrega ejecutar pruebas relevantes de Laravel, `npm run build` en frontend y revisar consola del navegador.

## 13. Orden de commits y entregas

Mantener commits pequeños, separando backend y frontend cuando sea razonable:

1. `chore`: estructura, configuración y herramientas.
2. `feat(auth)`: migraciones, API, sesión y pantallas de acceso.
3. `feat(catalogos)`: una entidad o relación por entrega.
4. `feat(inventario)`: servicio, migraciones, endpoints y pruebas antes de pantalla.
5. `feat(ui)`: componentes y vistas operativas.
6. `feat(contingencia)` y `feat(captura)`: funciones aisladas.
7. `test` y `docs`: cobertura, manuales y especificación.

Cada entrega se verifica, se confirma con mensaje descriptivo y se sube a la rama remota acordada.

## 14. Definición de terminado de la beta

La beta está lista cuando un administrador puede iniciar sesión, administrar datos de su empresa, registrar movimientos sin stock negativo, ajustar el inventario con trazabilidad, recibir alertas de mínimo/cero, consultar dashboard e historial, gestionar acceso por roles y usar una interfaz consistente en ambos temas. Captura IA queda explícitamente bloqueada hasta completar su integración real.
