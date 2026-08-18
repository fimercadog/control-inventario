# FidelOS — Especificación de producto y reconstrucción

## 1. Propósito

FidelOS es una aplicación web de control de inventario para pequeñas y medianas empresas. Debe permitir mantener catálogos, registrar movimientos, consultar existencias y conservar una trazabilidad completa por empresa.

La aplicación se construye en español, con una interfaz de administración clara, moderna y apta para escritorio y móvil. Todo dato mostrado al usuario debe ser realista: nunca se deben exponer nombres de pruebas, prefijos `E2E` ni identificadores técnicos como contenido de demostración.

### Principios funcionales

- Cada usuario opera únicamente dentro de su empresa.
- El stock no se edita directamente: siempre cambia por un movimiento auditable.
- Un movimiento confirmado es inmutable; una corrección genera otro movimiento compensatorio.
- El stock nunca puede ser negativo.
- Un producto sin existencias se inhabilita automáticamente si fue agotado por el sistema; al recibir stock se reactiva automáticamente.
- La deshabilitación manual prevalece sobre la reactivación automática.

## 2. Arquitectura técnica

### Frontend

- Next.js 16, React 19 y TypeScript estricto.
- Tailwind CSS y componentes Base UI reutilizables.
- Redux Toolkit para sesión y estado compartido.
- React Hook Form y Zod para formularios y validación.
- Axios para API y TanStack Query cuando se requiera caché o invalidación de consultas.
- Playwright para pruebas de interfaz.

### Backend

- Laravel 12 sobre PHP 8.2 o superior.
- API REST bajo `/api/v1`.
- Laravel Sanctum/JWT según la configuración vigente; tokens de acceso y actualización para sesión persistente.
- Spatie Permission para roles y permisos.
- SQLite para desarrollo local; base de datos relacional compatible con MySQL/PostgreSQL para producción.
- PHPUnit/Pest para pruebas de dominio y endpoints.

### Estructura esperada

```text
backend/       API Laravel, migraciones, seeders, pruebas y servicios de dominio
frontend/      Aplicación Next.js, componentes, páginas, hooks y pruebas E2E
spec.md        Este contrato funcional y técnico
```

No se versionan `.env`, claves, tokens, audios cargados ni `database.sqlite` con datos locales.

## 3. Inicio local desde cero

1. Crear `backend/.env` a partir de `.env.example` y configurar SQLite/local.
2. Ejecutar en `backend`: `composer install`, `php artisan key:generate`, configurar el secreto de JWT si aplica y ejecutar `php artisan migrate --seed`.
3. Iniciar la API con `php artisan serve --host=127.0.0.1 --port=8000`.
4. Crear `frontend/.env.local` a partir del ejemplo, apuntando `NEXT_PUBLIC_API_URL` a `http://127.0.0.1:8000/api/v1`.
5. Ejecutar en `frontend`: `npm install` y `npm run dev`.

Las credenciales de desarrollo deben provenir del seeder documentado o de variables locales; nunca se incluyen secretos ni contraseñas reales en esta especificación.

## 4. Seguridad, sesión y aislamiento

- Todas las consultas, políticas y escrituras se filtran por `empresa_id`.
- La API exige autenticación en rutas privadas y autorización por permiso para cada acción sensible.
- El inicio de sesión admite la opción **Recordar usuario**, que prolonga de manera segura la sesión mediante refresh token/cookie según la estrategia configurada.
- El cierre de sesión revoca o invalida la sesión correspondiente.
- Los errores de autenticación o permisos no deben revelar datos de otra empresa.
- Auditoría registra quién hizo qué, sobre qué entidad, cuándo, desde dónde y con qué resultado.

## 5. Modelo de dominio

### Administración

- Empresa
- Usuario, perfil, invitación, rol y permiso
- Auditoría

### Catálogos

- Categoría
- Marca
- Unidad de medida
- Proveedor
- Cliente
- Relación marca–proveedor
- Relación producto–proveedor, incluyendo proveedor principal cuando aplique

### Producto

Campos principales: nombre, código interno, código de barras, categoría, marca, unidad de medida, presentación, descripción, costo, precio, stock mínimo, stock máximo, estado y bandera de inhabilitación automática por agotamiento.

La presentación es complementaria a la unidad de medida, no un duplicado. Debe poder expresar, por ejemplo, “bolsa de 15 kg”, “caja de 24 unidades” o “botella de 1 L”, indicando cantidad y contenido/unidad cuando corresponda.

### Movimiento de inventario

Cada movimiento debe incluir producto, tipo, cantidad positiva, fecha, usuario y observación cuando sea necesaria. Los tipos base son:

- Ingreso
- Salida
- Ajuste por conteo físico
- Ajuste por ingreso adicional

El ingreso puede guardar proveedor, costo unitario, documento/factura, lote y vencimiento. Estos datos son opcionales salvo que una regla de negocio posterior establezca lo contrario.

## 6. Reglas de inventario y trazabilidad

1. `InventoryService` es el único punto de dominio autorizado para cambiar existencias.
2. Una salida o ajuste no puede dejar el stock por debajo de cero.
3. El formulario de Stock permite dos acciones explícitas:
   - **Conteo físico:** fija el stock contado y crea el ajuste diferencial.
   - **Agregar stock:** suma una cantidad y crea un movimiento de ajuste.
4. Los ajustes requieren observación de al menos tres caracteres.
5. El stock actual en formularios de configuración es de solo lectura; allí únicamente se editan los umbrales mínimo y máximo.
6. Al llegar a cero, el producto se marca agotado y se inhabilita solo si estaba activo y el sistema lo agotó.
7. Al registrar un ingreso o ajuste positivo, se reactiva únicamente el producto inhabilitado automáticamente por agotamiento.
8. Cuando el stock es menor o igual al mínimo configurado, el sistema muestra una advertencia de seguridad: **Mínimo alcanzado**. Si está por debajo, se identifica también como stock bajo.
9. Productos agotados o inactivos siguen siendo visibles en Stock y Movimientos para conservar trazabilidad.

## 7. Módulos de la aplicación

### Dashboard

Muestra saludo, métricas de productos, valor/stock total, stock bajo, entradas y salidas del día; movimientos recientes; accesos a Captura IA, acciones rápidas y listado de productos con stock bajo.

### Inventario

- Productos: crear, editar, consultar y habilitar/deshabilitar según permisos.
- Categorías, marcas, unidades de medida y proveedores: CRUD con relaciones coherentes.
- Stock: consulta de existencias, filtros, umbrales y acceso a los dos ajustes manuales.
- Movimientos: historial filtrable y registro de ingresos/salidas autorizados.

### Terceros y administración

- Proveedores y clientes.
- Usuarios, roles y permisos.
- Auditoría paginada con fechas, usuario, acción, entidad, resultado y filtros.
- Reportes de inventario y actividad conforme a permisos.

## 8. Captura IA

El objetivo final es procesar fotos y audios para crear una propuesta de movimientos de inventario. Un audio de 40 a 60 minutos puede contener múltiples productos; por ello el flujo definitivo debe ser asíncrono, tolerante a reintentos, idempotente y mostrar avance/errores al usuario.

El procesamiento deberá:

1. Guardar el archivo y crear un trabajo de procesamiento.
2. Transcribir o extraer productos mediante el proveedor configurado.
3. Normalizar unidades, cantidades, marcas y proveedores contra catálogos de la empresa.
4. Exponer una revisión humana con nivel de confianza y conflictos.
5. Confirmar todos los movimientos en una transacción atómica y auditable.

### Estado actual: vista previa bloqueada

Mientras no exista una API de IA configurada, Captura IA es una interfaz de solo visualización. Al entrar se muestra el modal **“Captura IA está en preparación”**. La persona puede cerrarlo para recorrer la pantalla, pero carga de archivos, selección de modos y análisis permanecen deshabilitados. No se debe simular procesamiento ni guardar movimientos desde esta sección hasta habilitar el proveedor y sus credenciales.

## 9. Modo contingencia

El modo contingencia es distinto de la vista previa de IA. Permite trabajar temporalmente sin conectividad sólo en las operaciones expresamente soportadas, usando una cola local de pendientes.

- Debe mostrar estado de conexión, cantidad de pendientes, explicación y sincronización manual.
- Las operaciones se sincronizan una por una, en orden, con detección de conflictos.
- Las acciones bloqueadas se comunican claramente y no aparentan haberse guardado.
- La navegación general no puede quedar bloqueada por el estado de contingencia.

## 10. Diseño e interacción

### Tema

- Tema claro: fondo blanco azulado sutil (`#F8F9FF`), superficies blancas, índigo como acción primaria (`#4F46E5`).
- Tema oscuro: gris carbón/negro suave, no azul saturado; superficies con contraste suficiente y acentos índigo/violeta moderados.
- Estados semánticos: éxito `#10B981`, alerta `#F59E0B`, error/contingencia `#EF4444`.
- La preferencia de tema se persiste y puede alternarse desde Configuración.

### Lenguaje visual

- Tipografía sans-serif moderna y legible, preferentemente Hanken Grotesk o equivalente.
- Tarjetas con radio aproximado de 8 px, borde suave, elevación discreta y espaciado consistente.
- Sidebar con identidad FidelOS, navegación por grupos, modo contingencia y aviso de versión beta visible pero sobrio.
- El encabezado también ofrece acceso al aviso de versión beta junto al perfil.
- Tablas con encabezados visualmente diferenciados, filtros, estados legibles, acciones accesibles y paginación con rango, primer/último y salto a página.
- Modales reutilizan una misma superficie elevada, ancho apropiado, espacio lateral suficiente, títulos, descripciones y secciones claramente separadas.
- Formularios agrupan campos relacionados en bloques; las etiquetas siempre se muestran y los selectores conservan la misma apariencia que los controles de categoría.

## 11. Datos de demostración y migraciones

- Seeders deben crear una empresa de demostración, usuario administrador documentado localmente, catálogos y productos plausibles para un control de inventario.
- Marcas, proveedores, unidades y productos deben tener nombres comerciales o genéricos legibles, no datos generados de pruebas.
- Las relaciones marca–proveedor y producto–proveedor deben incluir ejemplos reales de uso.
- Las migraciones son la fuente de verdad del esquema; los cambios de modelo incluyen migración, validación, recurso API, política, pruebas y actualización del frontend cuando aplique.
- Las pruebas usan una base de datos aislada para no contaminar datos de demostración.

## 12. Calidad, accesibilidad y entrega

- No usar ramas de renderizado que causen discrepancias de hidratación entre servidor y cliente.
- Las suscripciones con `useSyncExternalStore` deben devolver snapshots estables/cacheados.
- Los componentes que se comportan como botones deben renderizar un `<button>` nativo o declarar correctamente `nativeButton={false}` si son enlaces.
- Estados de carga, vacío, error, éxito y controles deshabilitados deben ser accesibles por teclado y lector de pantalla.
- Antes de integrar cambios: ejecutar pruebas relevantes de Laravel, `npm run build` para frontend y corregir errores de consola.
- Un cambio funcional se entrega en commits pequeños y temáticos; cada commit aprobado se sube a la rama remota correspondiente.

## 13. Criterios de aceptación de la primera versión

- Un administrador puede iniciar sesión, recordar su sesión, navegar y cambiar tema.
- Puede administrar catálogos, productos, marcas/proveedores y umbrales dentro de su empresa.
- Puede registrar ingresos, salidas y ajustes sin generar stock negativo, dejando auditoría y trazabilidad.
- Cero existencias inhabilita automáticamente el producto; una entrada posterior lo reactiva si la inhabilitación fue automática.
- El dashboard, Stock, Movimientos y Reportes reflejan los cambios de inventario.
- La aplicación avisa stock mínimo y permite identificar productos agotados.
- Captura IA se visualiza pero no permite acciones hasta configurar la integración.
- Modo contingencia comunica sus límites y nunca impide salir a otras secciones.
- El diseño mantiene contraste, profundidad moderada y consistencia en temas claro y oscuro.
