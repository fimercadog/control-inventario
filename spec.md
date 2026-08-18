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

- **Fase 1 - Foundation:** Auditorías, dependencias, theme, layout (sidebar/header), API Client, Auth (JWT, refresh, logout, rutas protegidas), Login, Recuperación, Dashboard.
- **Fase 2 - Maestros:** Empresa, Categorías, Marcas, U. Medida, Proveedores, Clientes.
- **Fase 3 - Seguridad:** Permissions, Roles, Usuarios (usar módulo Usuarios actual como plantilla base).
- **Fase 4 - Inventario:** Productos, Prod-Prov, Marca-Prov, Stock, Movimientos.
- **Fase 5 - Especiales:** Captura IA, Reportes, Auditoría, Perfil, Configuración.
- **Fase 6 - QA Final:** TS, ESLint, Build, pruebas (Playwright, regresión), RBAC, multiempresa, responsive, revisión final, commit/push.

## 3. CONTINUIDAD AUTOMÁTICA (CRÍTICA)

**PROHIBIDO DETENERSE O PREGUNTAR.** Al terminar un módulo: probar, corregir, registrar avance y pasar al siguiente automáticamente. No esperar instrucciones para continuar.

## 4. MANEJO DE INCIDENTES

Nunca detener el proyecto general.

- **Tipo A (Resoluble):** Solucionar ajustando UI/código frontend.
- **Tipo B (Duda Funcional):** Resolver consultando manual, backend, frontend actual o tests.
- **Tipo C (Bloqueo Externo):** Si exige modificar backend/BD, NO tocar backend. Documentar en `frontend/incidentes/` y saltar a otra tarea posible.

## 5. ESTRUCTURA DE SEGUIMIENTO

Crear la siguiente estructura en el repositorio:

- `frontend/avances/`: `README.md`, `01-foundation.md`, `02-maestros.md`, `03-seguridad.md`, `04-inventario.md`, `05-especiales.md`, `06-qa-final.md`.
- `frontend/incidentes/`: `README.md`, `INCIDENTES.md`, `pendientes.md`.
- `frontend/spec.md`

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

## CORRECCIÓN GLOBAL — SELECTS DE RELACIONES Y PRESENTACIÓN

Se detectó un error de UX y mapeo de datos en los formularios.

### PROBLEMA 1 — SELECTS MOSTRANDO IDs

Actualmente algunos Select muestran valores internos como:

Marca: 17
Categoría: 5
Unidad de medida: 3

Esto es INCORRECTO.

El usuario nunca debe ver IDs internos cuando existe una relación con una entidad de catálogo.

Debe mostrarse el valor legible real.

Ejemplos:

Marca:
Purina

Categoría:
Alimentos

Unidad de medida:
Kilogramo (kg)

El ID debe seguir utilizándose internamente como `value` para enviar al backend.

Ejemplo conceptual:

value = 17
label = "Purina"

NO mostrar:

17

MOSTRAR:

Purina

---

### ALCANCE GLOBAL

Auditar TODOS los formularios y filtros del frontend que utilicen relaciones por ID.

Buscar campos como:

- marca_id
- categoria_id
- unidad_medida_id
- proveedor_id
- role_id
- empresa_id
- producto_id
- cliente_id
- cualquier otro FK usado en Select

Regla global:

`value` = ID real requerido por backend

`label` = nombre/descripcion legible para el usuario

Nunca mostrar el ID como texto visible si existe nombre asociado.

---

### PROBLEMA 2 — PRESENTACIÓN

Auditar el campo `presentacion` del Producto.

Actualmente aparece como Input libre:

"Ej. Bolsa 15kg"

Verificar backend REAL, BD REAL y manual.

Determinar exactamente qué significa `presentacion`.

#### Si `presentacion` realmente debe derivarse de Unidad de Medida

reemplazar el input libre por un Select que cargue las Unidades de Medida reales desde:

GET /unidades-medida

o el endpoint real correspondiente.

Mostrar:

nombre + abreviatura

Ejemplos:

Unidad (und)
Kilogramo (kg)
Gramo (g)
Litro (L)
Mililitro (ml)
Caja
Docena

Guardar el ID/campo correcto según contrato backend.

#### Si `presentacion` es un campo independiente REAL

NO eliminarlo sin verificar.

En ese caso determinar si el modelo correcto es:

Presentación:
"Bolsa"

Unidad de medida:
"kg"

Cantidad/peso:
15

y asi con cuaLquier lista desplegable que se use

CORRECCIÓN GLOBAL DE SELECTS

Aplicar esta regla a TODOS los Select/listas desplegables del frontend FidelOS.

1. Cuando todavía no exista un valor seleccionado, el Select debe mostrar
   un placeholder descriptivo según el campo.

Ejemplos:

Rol:
"Seleccione un rol"

Categoría:
"Seleccione una categoría"

Marca:
"Seleccione una marca"

Unidad de medida:
"Seleccione una unidad de medida"

Proveedor:
"Seleccione un proveedor"

Producto:
"Seleccione un producto"

Estado:
"Seleccione un estado"

Tipo de movimiento:
"Seleccione un tipo de movimiento"

2. El placeholder NO debe ser una opción válida enviada al backend.

3. Después de seleccionar un elemento:
    - mostrar el NOMBRE legible;
    - conservar internamente el ID requerido por backend.

Ejemplo:

VISIBLE:
Purina

VALUE:
17

4. En formularios de EDICIÓN:
    - cargar automáticamente el valor actual;
    - mostrar su nombre, nunca su ID.

5. Auditar TODOS los Select del frontend, no solamente Usuarios o Productos.

6. No modificar backend ni BD.

7. REUSE → EXTEND → CREATE.
   Si existe un componente/helper compartido para Select, solucionar allí
   el comportamiento común en vez de parchear cada pantalla por separado,
   siempre que no provoque regresiones.

8. Verificar especialmente:
   Roles
   Categorías
   Marcas
   Unidades de Medida
   Proveedores
   Clientes
   Usuarios
   Productos
   Movimientos
   Stock
   Reportes
   Captura IA
   Perfil
   Configuración
   y cualquier otro Select encontrado durante la auditoría.

9. Probar:
    - placeholder inicial;
    - apertura del Select;
    - selección;
    - label visible correcto;
    - ID correcto enviado al backend;
    - formulario de edición;
    - mobile;
    - teclado;
    - ausencia de errores de consola.

10. No detener el proyecto.
    Corregir, probar, commit, push y continuar.

o el esquema real existente.

NO inventar estructura nueva.

La fuente de verdad es:

1. backend
2. BD
3. manual

---

### REGLA IMPORTANTE

No modificar backend ni BD.

Adaptar únicamente el frontend al contrato real existente.

Si backend/BD no permiten representar correctamente la presentación:

registrar incidente.

NO detener el proyecto.

---

### PONYTAIL

Antes de crear nada:

REUSE
→ EXTEND
→ CREATE

Buscar si ya existe:

- catálogo de marcas
- catálogo de categorías
- catálogo de unidades
- hook de catálogos
- Select reusable
- helper label/value

NO crear un fetch distinto para cada formulario si ya existe infraestructura compartida.

---

### RESULTADO ESPERADO

ANTES:

Marca: 17
Categoría: 5
Unidad: 3

DESPUÉS:

Marca: Purina
Categoría: Alimentos húmedos
Unidad de medida: Kilogramo (kg)

El backend continúa recibiendo:

marca_id: 17
categoria_id: 5
unidad_medida_id: 3

---

### PRUEBAS

Verificar al menos:

1. Crear Producto
2. Editar Producto
3. Select Marca muestra nombres
4. Select Categoría muestra nombres
5. Select Unidad de medida muestra nombres
6. El valor enviado sigue siendo el ID correcto
7. Persistencia real
8. Al reabrir Editar aparece seleccionado el nombre correcto
9. Filtros relacionados también muestran labels, no IDs
10. Mobile
11. No hay errores de consola

Auditar además otros módulos para detectar el mismo defecto.

Si se encuentra el mismo patrón:

corregirlo usando la misma solución compartida.

No hacer refactorización general fuera de esta corrección.

---

### GIT

Después de corregir:

tests
→ TypeScript
→ build
→ commit
→ push
→ continuar automáticamente

Ejemplo:

fix(forms): display relation labels instead of raw ids

No detener el proyecto después del push.

# 31. MODO CONTINGENCIA — OBLIGATORIO

El rediseño visual de FidelOS DEBE conservar e integrar completamente
el Modo Contingencia existente.

NO eliminarlo.
NO ocultarlo.
NO convertirlo en una función secundaria.
NO reconstruir su lógica sin antes auditar la implementación actual.

El Manual de Usuario es fuente funcional para esta característica,
pero antes de modificarla se debe revisar:

1. frontend actual;
2. servicios/API utilizados;
3. almacenamiento local utilizado;
4. lógica de sincronización;
5. guards/bloqueos globales;
6. permisos;
7. pruebas existentes.

REGLA:

REUSE → EXTEND → REBUILD únicamente si fuera estrictamente necesario.

El objetivo principal de este Work Order es REDISEÑO VISUAL.
Si la funcionalidad de Contingencia ya funciona correctamente,
se conserva su lógica y solamente se adapta al nuevo sistema visual.

---

## 31.1 UBICACIÓN DEL BOTÓN

Debe existir un botón claramente visible:

"Modo Contingencia"

Ubicación:

PARTE SUPERIOR DEL SIDEBAR.

Debe quedar visualmente separado de la navegación ordinaria porque
no representa un módulo normal sino un modo especial de operación.

Orden conceptual:

FidelOS [BETA]

[ Información Beta ]

[ Modo Contingencia ]

---

GENERAL
Dashboard
Reportes
Captura IA

INVENTARIO
Productos
Categorías
...

El botón debe conservarse también en:

- desktop;
- tablet;
- sidebar colapsado;
- drawer móvil.

---

## 31.2 APARIENCIA

Cuando NO está activo:

[ ⚠ Modo Contingencia ]

Debe utilizar un tratamiento visual de advertencia.

Puede utilizar:

TriangleAlert
o icono equivalente de Lucide.

NO utilizar un diseño excesivamente agresivo que parezca un error
del sistema.

Debe comunicar:

"función especial / emergencia / pérdida de conexión".

---

## 31.3 PERMISOS

El Modo Contingencia requiere:

productos.crear

O

productos.editar

NO mostrar/habilitar la operación para usuarios que no tengan
los permisos reales correspondientes.

No inventar permisos nuevos.

Verificar el comportamiento contra el sistema actual antes de tocarlo.

---

## 31.4 ACTIVACIÓN

Al pulsar:

"Modo Contingencia"

NO activar inmediatamente.

Abrir primero un Dialog de confirmación.

Título:

"Activar Modo Contingencia"

Explicar claramente:

"El Modo Contingencia permite continuar trabajando con Productos
cuando la conexión con el servidor no está disponible o es inestable.

Mientras permanezca activo, las operaciones normales de escritura
del resto del sistema estarán bloqueadas."

Acciones:

[ Cancelar ]

[ Activar Contingencia ]

El botón de confirmación debe tener tratamiento visual de advertencia.

---

## 31.5 ESTADO ACTIVO

Después de activar:

el botón debe cambiar visualmente a:

"Contingencia activa"

Debe resultar imposible confundir el estado normal con el estado
de Contingencia.

Además debe aparecer un BANNER GLOBAL en la parte superior del
contenido de FidelOS.

Ejemplo conceptual:

┌──────────────────────────────────────────────────────────┐
│ ⚠ Modo Contingencia activo │
│ Las operaciones normales de escritura están bloqueadas. │
└──────────────────────────────────────────────────────────┘

El banner debe permanecer visible aunque el usuario navegue entre
módulos.

NO limitar el aviso únicamente a la pantalla de Contingencia.

---

## 31.6 FUNCIONALIDAD PERMITIDA

Durante Contingencia solamente están permitidas dos operaciones:

CREAR PRODUCTO

EDITAR PRODUCTO

Ambas exclusivamente mediante texto.

NO permitir durante Contingencia:

- Captura IA;
- fotografía;
- cámara;
- voz;
- Foto + Voz;
- eliminación;
- escrituras normales en otros módulos.

"Actualizar producto" NO constituye una tercera operación.

Actualizar = EDITAR.

---

## 31.7 TRABAJO OFFLINE

Las operaciones realizadas durante Contingencia NO deben enviarse
inmediatamente al servidor.

Cada operación:

CREAR
o
EDITAR

debe quedar almacenada localmente en:

"Operaciones pendientes"

Auditar y reutilizar la implementación existente.

NO sustituir arbitrariamente el mecanismo de persistencia actual.

La interfaz debe mostrar claramente:

- tipo de operación;
- producto;
- fecha/hora si existe;
- estado;
- conflicto si existe;
- acciones disponibles.

---

## 31.8 ESTADO DE CONEXIÓN

Mostrar claramente:

● Conectado

o

● Sin conexión

IMPORTANTE:

Este indicador es únicamente informativo.

Detectar nuevamente conexión NO debe iniciar automáticamente una
sincronización.

La sincronización debe continuar siendo una decisión explícita
del usuario.

---

## 31.9 SINCRONIZACIÓN

Debe existir un botón:

"Sincronizar ahora"

Al pulsarlo:

1. comprobar realmente disponibilidad del servidor;
2. procesar operaciones pendientes;
3. hacerlo una por una;
4. respetar su orden;
5. actualizar visualmente el resultado;
6. manejar errores;
7. detectar conflictos.

No asumir que navigator.onLine significa que el backend está disponible.

Utilizar la lógica existente si ya está implementada.

---

## 31.10 CONFLICTOS Y DUPLICADOS

La interfaz debe manejar visualmente los conflictos existentes.

CREAR:

si en el servidor ya existe un producto equivalente según las reglas
reales del sistema, NO crear automáticamente un duplicado.

EDITAR:

si el producto del servidor cambió mientras el usuario estaba offline,
NO sobrescribirlo automáticamente.

Mostrar:

VERSIÓN LOCAL

vs.

VERSIÓN DEL SERVIDOR

El usuario debe poder revisar el conflicto.

Nunca resolver automáticamente un conflicto destruyendo información.

La acción de descartar una operación pendiente elimina únicamente
esa operación local.

NO debe eliminar ni modificar el producto real del servidor.

## 31.11 SALIR DE CONTINGENCIA

Debe existir:

"Salir de Contingencia"

Si NO existen operaciones pendientes:

permitir salir normalmente.

Si existen operaciones pendientes:

NO descartarlas automáticamente.

Mostrar Dialog:

"Hay operaciones pendientes"

Explicar que todavía existen cambios locales sin sincronizar.

Ofrecer únicamente las opciones compatibles con la implementación
real existente, incluyendo mantener las operaciones para sincronizarlas
posteriormente o descartarlas cuando corresponda.

Nunca perder operaciones silenciosamente.

---

## 31.12 BLOQUEO GLOBAL

Mientras Contingencia esté activa:

TODOS los módulos normales deben respetar el bloqueo de escritura
definido por el sistema.

Ejemplos:

Categorías → lectura permitida / escritura bloqueada
Marcas → lectura permitida / escritura bloqueada
Unidades → lectura permitida / escritura bloqueada
Proveedores → lectura permitida / escritura bloqueada
Clientes → lectura permitida / escritura bloqueada
Usuarios → escritura bloqueada
Roles → escritura bloqueada
Movimientos → escritura bloqueada
Captura IA → bloqueada para nuevas operaciones

NO basta con ocultar botones.

Reutilizar los guards/bloqueos globales existentes.

---

## 31.13 RELACIÓN CON EL NUEVO DISEÑO

El rediseño visual NO puede romper Contingencia.

Debe adaptarse al nuevo estilo general de FidelOS:

- sidebar moderno;
- cards;
- tipografía;
- espaciados;
- bordes;
- sombras;
- estados;
- responsive;
- Dialog;
- Tooltip;
- Badge;
- Alert.

Pero conservar la semántica de advertencia.

Contingencia debe destacar más que una navegación ordinaria,
pero no convertir toda la interfaz permanentemente en rojo.

Rojo/advertencia debe reservarse principalmente para:

- botón Modo Contingencia;
- estado activo;
- banner global;
- advertencias importantes.

---

## 31.14 RELACIÓN BETA + CONTINGENCIA

NO confundir:

BETA = estado de madurez de FidelOS.

CONTINGENCIA = modo operativo para trabajar ante problemas de conexión.

Deben existir simultáneamente y ser visualmente diferentes.

Ejemplo:

FidelOS [BETA]

ⓘ Información Beta

⚠ Modo Contingencia

---

GENERAL
Dashboard
Reportes
Captura IA
...

El usuario debe comprender inmediatamente que son conceptos diferentes.

---

## 31.15 PLAYWRIGHT — CONTINGENCIA OBLIGATORIA

Agregar Contingencia a la prueba general del sistema.

Probar como mínimo:

1. botón visible para usuario autorizado;
2. permisos correctos;
3. apertura del Dialog;
4. cancelar activación;
5. activar Contingencia;
6. cambio visual a "Contingencia activa";
7. banner global visible;
8. navegar a otro módulo y comprobar que el banner continúa;
9. comprobar bloqueo de escritura normal;
10. Crear Producto offline;
11. Editar Producto offline;
12. operación aparece en pendientes;
13. persistencia después de navegar;
14. persistencia después de recargar cuando corresponda;
15. Captura IA no utilizable en Contingencia;
16. eliminación no disponible;
17. estado Conectado/Sin conexión;
18. recuperar conexión NO sincroniza automáticamente;
19. botón "Sincronizar ahora";
20. sincronización en orden;
21. conflicto de creación;
22. conflicto de edición;
23. comparación local/servidor;
24. descartar conflicto sin alterar producto servidor;
25. salir sin pendientes;
26. salir con pendientes;
27. comprobar que ninguna operación pendiente se pierde accidentalmente;
28. responsive desktop;
29. responsive tablet;
30. responsive mobile;
31. TypeScript;
32. ESLint;
33. build;
34. errores de consola.

Las pruebas deben utilizar la funcionalidad REAL existente.

NO mocks salvo que exista una razón técnica documentada.

Si simular pérdida de conexión mediante Playwright requiere interceptar
red, hacerlo exclusivamente para reproducir el escenario offline,
no para falsificar las respuestas funcionales del backend.

Registrar cualquier imposibilidad real en:

frontend/incidentes/

pero NO detener el resto del Work Order.

## 32. CIERRE OBLIGATORIO — REGRESIÓN PLAYWRIGHT COMPLETA

Al finalizar TODO el desarrollo, antes de declarar el proyecto como terminado,
se deben ejecutar pruebas Playwright de regresión para TODOS los módulos y
funcionalidades reales del frontend.

La validación final debe cubrir, como mínimo:

- autenticación, cierre de sesión y recuperación de contraseña;
- dashboard;
- categorías, marcas, unidades de medida, proveedores y clientes;
- roles, permisos, usuarios e invitaciones;
- productos, asociaciones producto-proveedor, stock y movimientos;
- Captura IA en todos los flujos disponibles;
- reportes, exportaciones, historial y reportes programados;
- auditoría, perfil y configuración;
- Modo Contingencia completo;
- RBAC, aislamiento multiempresa, responsive desktop/tablet/móvil;
- estados de carga, errores, formularios, selects, navegación y errores de consola.

Las pruebas deben usar el backend real y las cuentas/fixtures reales disponibles.
No se debe declarar el desarrollo finalizado si la suite Playwright completa no
ha sido ejecutada, sus fallos investigados y los resultados documentados en
`frontend/avances/06-qa-final.md`.
