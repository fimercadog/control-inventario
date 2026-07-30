---

# FASE 4A — Mandatory Module Implementation Rules

## Objetivo

Definir las reglas obligatorias que todo módulo debe cumplir para considerarse implementado.

Estas reglas aplican a cualquier desarrollo nuevo, ampliación o refactorización.

---

## 1. Complete Module Rule

Cuando se solicita un módulo, siempre significa un módulo completamente terminado.

No existen módulos "solo backend" o "solo frontend".

Todo módulo debe entregarse end-to-end.

Debe incluir como mínimo:

### Backend

- Migraciones
- SQLite compatible
- Modelos
- Relaciones
- Servicios
- Controllers
- Form Requests
- Policies
- API
- Validaciones
- Reglas de negocio
- Tests

### Frontend

- Sidebar
- Página
- Tabla
- Buscador
- Filtros
- Paginación
- Crear
- Editar
- Ver
- Estado
- Eliminación lógica (excepto Usuarios)
- Notificaciones
- Manejo de errores
- Loading
- Browser tests

Un módulo no puede marcarse como terminado si cualquiera de estos elementos falta.

---

## 2. Official RC1 Sidebar

El sidebar oficial de FidelOS RC1 es:

- Dashboard
- Captura IA
- Productos
- Categorías
- Marcas
- Unidades de Medida
- Stock
- Movimientos
- Proveedores
- Clientes
- Usuarios
- Roles
- Auditoría
- Configuración

Todo módulo aprobado debe aparecer en el menú.

No existen módulos ocultos o parcialmente implementados.

---

## 3. Global CRUD Standard

Todo módulo administrativo debe implementar:

- Listar
- Ver
- Crear
- Editar
- Estado
- Eliminación lógica

La única excepción es Usuarios.

Usuarios debe implementar:

- Listar
- Ver
- Crear
- Editar
- Activar
- Desactivar
- Restablecer contraseña

Nunca debe existir la opción Eliminar Usuario.

---

## 4. Automatic Refresh Rule

Después de una operación exitosa de:

- Crear
- Editar
- Eliminar
- Activar
- Desactivar

el sistema debe:

1. Mostrar notificación.
2. Cerrar automáticamente el popup.
3. Refrescar automáticamente la tabla.
4. Mantener filtros.
5. Mantener paginación.
6. Mantener ordenamiento.

Nunca debe requerirse actualizar el navegador manualmente.

---

## 5. SQLite Development Rule

Durante todo RC1:

SQLite es la base de datos oficial.

Todo desarrollo debe funcionar correctamente sobre SQLite.

No se implementarán características específicas para MySQL.

Cuando RC1 sea aprobado se realizará la migración oficial a MySQL.

---

## 6. Module Completion Rule

Un módulo solamente puede marcarse como completado cuando:

Un módulo solamente puede marcarse como completado cuando:

✔ Backend terminado

✔ Frontend terminado

✔ CRUD funcionando

✔ API funcionando

✔ Base de datos funcionando

✔ Datos demo generados

✔ Tests aprobados

✔ Browser Tests aprobados

✔ Auditoría funcional realizada

✔ Documentación actualizada

✔ Commit realizado

✔ Push realizado

✔ Informe generado

✔ Estado Aprobado
No se permite continuar con otro módulo dejando el anterior incompleto.

---

## 7. Git Rule

Cada módulo completo debe generar un commit independiente.

Nunca hacer commits de módulos parcialmente implementados.

El mensaje del commit debe indicar claramente el módulo desarrollado.

Ejemplo:

feat(products): complete products module

feat(stock): complete stock module

feat(users): complete users module

==================================================
CONTROL DE VERSIONES (OBLIGATORIO)
==================================================

Durante el desarrollo debes utilizar Git como mecanismo obligatorio de control de versiones.

No acumules grandes cantidades de cambios sin realizar commits.

Realiza commits periódicos cuando, como mínimo:

- Finalices una funcionalidad importante.
- Corrijas un bug importante.
- Completes una refactorización relevante.
- Completes una integración.
- Finalices una sesión de trabajo con cambios estables.
- Completes un módulo.

No realizar commits con:

- Código que no compile.
- Tests fallando.
- Conflictos sin resolver.
- Errores críticos conocidos.

Utiliza mensajes descriptivos siguiendo Conventional Commits.

Ejemplos:

feat(products): implement product detail page

feat(stock): complete stock module

fix(auth): refresh JWT expiration handling

refactor(products): simplify service layer

docs(workflow): update mandatory development workflow

test(products): add browser tests

Si el repositorio remoto está disponible, ejecutar también:

git push

==================================================
INFORME FINAL (OBLIGATORIO)
==================================================

Antes de dar la tarea por terminada debes informar:

- Resumen del trabajo realizado.
- Archivos creados.
- Archivos modificados.
- Archivos eliminados.
- Tests ejecutados y resultado.
- Browser tests ejecutados y resultado.
- Problemas encontrados.
- Problemas pendientes.
- Commits realizados.
- Hash de cada commit.
- Mensaje de cada commit.
- Rama utilizada.
- Confirmación de si el push fue ejecutado correctamente.
- Recomendaciones para la siguiente tarea.

No des una tarea por finalizada mientras existan cambios importantes sin commit o sin documentar.


---

Ningún módulo podrá considerarse terminado hasta que exista un informe de auditoría funcional (SystemFunctionalAudit.md) que evidencie que todas sus funcionalidades fueron verificadas satisfactoriamente.


---

Toda tabla perteneciente a un módulo implementado debe contar con datos de prueba suficientes y coherentes. No se aceptan módulos con tablas vacías, salvo aquellas cuya naturaleza requiera permanecer vacías inicialmente. Los datos de prueba deben permitir validar búsquedas, filtros, paginación, relaciones, integridad referencial, rendimiento y pruebas de usuario. Debe existir un proceso reproducible para reconstruir el entorno completo mediante un único comando (por ejemplo, migrate:fresh --seed).



# Regla de Cierre de Funcionalidades y Módulos

## Objetivo

Toda funcionalidad o módulo debe completarse completamente antes de iniciar el siguiente.

No se permite acumular funcionalidades parcialmente terminadas.

---

## Flujo Obligatorio

Para cada funcionalidad o módulo se debe seguir obligatoriamente el siguiente ciclo:

Especificación

↓

Desarrollo

↓

Documentación

↓

Datos Demo

↓

Pruebas

↓

Correcciones

↓

Git

↓

Informe

↓

Aprobación

↓

Siguiente funcionalidad

No se puede pasar al siguiente punto mientras el anterior no esté finalizado.

---

## Documentación

Al terminar una funcionalidad se debe actualizar toda la documentación afectada.

Como mínimo:

- Functional Specification
- Technical Specification
- API Specification
- Test Report
- Changelog

La documentación debe reflejar exactamente el estado real del sistema.

---

## Datos de prueba

Antes de ejecutar las pruebas:

- Poblar todas las tablas relacionadas.
- Verificar relaciones.
- Verificar integridad.

Nunca probar únicamente con datos mínimos.

---

## Pruebas

Ejecutar como mínimo:

- Unit Tests
- Feature Tests
- Browser Tests
- CRUD completo
- Validaciones
- Permisos
- Integración
- Rendimiento básico

Todos los errores encontrados deben corregirse antes de continuar.

---

## Control de versiones

Una vez todas las pruebas sean satisfactorias:

Realizar:

- Commit
- Push

Utilizando mensajes descriptivos.

Nunca comenzar otra funcionalidad sin haber registrado correctamente el trabajo realizado.

---

## Informe Final

Al finalizar debe entregarse un informe.

El informe debe contener como mínimo:

### Información General

- Funcionalidad o módulo
- Fecha
- Responsable
- Rama
- Commit
- Hash

### Desarrollo

- Archivos creados
- Archivos modificados
- Archivos eliminados

### Base de Datos

- Migraciones
- Tablas afectadas

### Backend

- APIs creadas
- Servicios
- Validaciones

### Frontend

- Pantallas
- Componentes
- Formularios

### Pruebas

- Tests ejecutados
- Resultado
- Evidencias
- Cobertura

### Problemas

- Errores encontrados
- Correcciones realizadas
- Pendientes

### Git

- Commits realizados
- Hash
- Push realizado

### Estado

☐ Pendiente

☐ Requiere correcciones

☐ Aprobado

---

## Aprobación

La funcionalidad o módulo NO podrá marcarse como terminado hasta que el propietario del proyecto apruebe el informe.

Solamente cuando el estado sea:

✔ Aprobado

podrá iniciarse la siguiente funcionalidad o módulo.

Hasta ese momento el desarrollo queda bloqueado.

---

## Regla Permanente

Cada funcionalidad y cada módulo constituyen una unidad independiente de trabajo.

Cada unidad debe seguir este ciclo completo:

Especificación

↓

Desarrollo

↓

Documentación

↓

Datos de prueba

↓

Pruebas

↓

Correcciones

↓

Commit

↓

Push

↓

Informe

↓

Aprobación

↓

Siguiente funcionalidad


## Stop Rule

El agente de IA debe detener inmediatamente el desarrollo cuando ocurra cualquiera de las siguientes situaciones:

- Falta una especificación.
- Existe una ambigüedad funcional.
- Existen conflictos entre documentos.
- Una prueba obligatoria falla.
- La documentación no coincide con el código.
- No puede generar el informe final.
- No puede realizar el commit.
- No puede ejecutar el push.

En cualquiera de estos casos deberá presentar un informe explicando el motivo y esperar aprobación antes de continuar.

Nunca debe asumir, inventar o continuar ignorando estos bloqueos.


## Definición de Funcionalidad

Una funcionalidad es una unidad mínima de trabajo que agrega, modifica o corrige un comportamiento del sistema.

Ejemplos:

- Crear Producto
- Editar Producto
- Eliminar Producto
- Cambiar Estado
- Buscar Productos

Cada funcionalidad debe completar el mismo ciclo de calidad que un módulo:

- Desarrollo
- Documentación
- Datos Demo
- Pruebas
- Commit
- Push
- Informe
- Aprobación

No podrá iniciarse otra funcionalidad hasta cerrar la anterior.
