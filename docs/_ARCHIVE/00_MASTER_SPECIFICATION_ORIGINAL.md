# 00_MASTER_SPECIFICATION.md

> ⚠️ **DOCUMENTO HISTÓRICO — NO ES LA FUENTE DE VERDAD VIGENTE.**
> Este archivo fue el documento monolítico original del proyecto. Fue auditado, dividido y redistribuido durante la migración a Specification-Driven Development (ver `docs/SDD_MIGRATION_PLAN.md`). La documentación oficial y vigente del proyecto ahora se encuentra distribuida bajo la estructura `docs/00_VISION/` a `docs/09_TEMPLATES/`. Cualquier sección de este archivo que describa funcionalidad como si ya existiera (por ejemplo, Compras, Ventas, Proveedores, Clientes, Kardex, Reportes) debe considerarse desactualizada frente al estado real del código — ver `docs/_ARCHIVE/README.md` para el detalle completo de a dónde fue redistribuido cada bloque de contenido.

# Sistema Inteligente de Control de Inventario

Versión: 1.0

Estado: En Diseño

Proyecto: Fidel OS

Autor: Fidel Mercado

Arquitectura: Laravel + Next.js + MySQL

---

# Tabla de Contenido

1. Introducción

2. Objetivos

3. Alcance

4. Visión del Producto

5. Problema

6. Solución

7. Stakeholders

8. Usuarios

9. Roles

10. Requisitos Funcionales

11. Requisitos No Funcionales

12. Reglas de Negocio

13. Arquitectura

14. Base de Datos

15. API

16. Frontend

17. Dashboard

18. Seguridad

19. Auditoría

20. Reportes

21. KPIs

22. Roadmap

23. Definition of Done

24. Riesgos

25. Versiones Futuras

---

# 1. Introducción

El Sistema Inteligente de Control de Inventario forma parte del ecosistema Fidel OS.

Su objetivo es ofrecer una plataforma moderna para administrar productos, movimientos de inventario, compras, ventas, clientes y proveedores utilizando una arquitectura desacoplada.

Este sistema está diseñado para ser reutilizable en futuros productos desarrollados por Fidel OS.

---

# 2. Objetivos

## Objetivo General

Construir un sistema escalable, desacoplado y reutilizable para controlar el inventario de pequeñas y medianas empresas.

---

## Objetivos Específicos

• Reducir pérdidas por errores de inventario.

• Mantener el stock actualizado en tiempo real.

• Registrar todos los movimientos.

• Gestionar compras y ventas.

• Obtener indicadores de negocio.

• Facilitar auditorías.

• Servir como plantilla para futuros productos.

---

# 3. Alcance

## Incluye

✔ Login

✔ Dashboard

✔ Usuarios

✔ Roles

✔ Permisos

✔ Productos

✔ Categorías

✔ Inventario

✔ Compras

✔ Proveedores

✔ Clientes

✔ Ventas

✔ Reportes

✔ Configuración

---

## No incluye (MVP)

✘ Facturación electrónica

✘ Integración con DIAN

✘ Contabilidad

✘ Nómina

✘ CRM

Estas funcionalidades podrán desarrollarse en futuras versiones.

---

# 4. Visión del Producto

El sistema busca convertirse en el núcleo de administración empresarial de Fidel OS.

Debe permitir controlar todas las entradas y salidas de inventario mediante una interfaz moderna y una arquitectura desacoplada que facilite la integración con otros módulos futuros.

---

# 5. Problema

Muchas empresas aún administran su inventario mediante hojas de cálculo.

Esto provoca:

• Errores de digitación.

• Duplicación de información.

• Pérdida de productos.

• Falta de trazabilidad.

• Reportes poco confiables.

• Procesos manuales.

• Dificultad para auditar movimientos.

---

# 6. Solución

Se propone desarrollar un sistema web que permita:

Registrar productos.

Registrar compras.

Registrar ventas.

Controlar existencias.

Consultar historial.

Generar reportes.

Administrar usuarios.

Administrar permisos.

Gestionar múltiples empresas mediante empresa_id.

---

# 7. Stakeholders

## CEO

Responsable de la estrategia del producto.

---

## Administrador

Administra la configuración general.

---

## Supervisor

Supervisa la operación.

---

## Compras

Gestiona proveedores y órdenes de compra.

---

## Ventas

Gestiona clientes y ventas.

---

## Bodega

Controla entradas y salidas de inventario.

---

## Consulta

Puede visualizar información sin modificarla.

---

# 8. Usuarios

El sistema soportará múltiples usuarios.

Cada usuario pertenece a una empresa.

Cada usuario puede tener uno o varios roles.

Cada usuario tendrá permisos específicos.

---

# 9. Roles

Administrador

Supervisor

Compras

Ventas

Bodega

Consulta

Los permisos serán administrados mediante Roles y Policies de Laravel.

---

# 10. Requisitos Funcionales

## RF-001

El sistema permitirá autenticación mediante JWT.

---

## RF-002

El sistema permitirá recuperar contraseña.

---

## RF-003

El sistema permitirá administrar usuarios.

---

## RF-004

El sistema permitirá administrar roles.

---

## RF-005

El sistema permitirá administrar permisos.

---

## RF-006

El sistema permitirá crear categorías.

---

## RF-007

El sistema permitirá crear productos.

---

## RF-008

El sistema permitirá editar productos.

---

## RF-009

El sistema permitirá eliminar productos.

---

## RF-010

El sistema permitirá consultar productos.

---

## RF-011

El sistema permitirá registrar compras.

---

## RF-012

El sistema actualizará automáticamente el inventario después de una compra.

---

## RF-013

El sistema permitirá registrar ventas.

---

## RF-014

El sistema actualizará automáticamente el inventario después de una venta.

---

## RF-015

El sistema registrará cada movimiento de inventario.

---

## RF-016

El sistema conservará un historial completo de movimientos (Kardex).

---

## RF-017

El sistema permitirá generar reportes por rango de fechas.

---

## RF-018

El sistema permitirá consultar productos con bajo stock.

---

## RF-019

El sistema permitirá registrar proveedores.

---

## RF-020

El sistema permitirá registrar clientes.

---

# 11. Requisitos No Funcionales

## Seguridad

• JWT.

• Policies.

• Middleware.

• Validaciones Backend.

---

## Rendimiento

Tiempo promedio de respuesta inferior a 500 ms en operaciones CRUD.

---

## Escalabilidad

Arquitectura desacoplada.

Frontend independiente del backend.

---

## Disponibilidad

El sistema deberá operar 24/7.

---

## Responsive

Compatible con:

• Celulares.

• Tablets.

• Escritorio.

• Monitores 4K.

---

# 12. Reglas de Negocio

RN-001

No se permitirá vender productos sin existencias suficientes.

RN-002

Todo movimiento debe quedar registrado.

RN-003

No se podrán eliminar movimientos históricos.

RN-004

Cada producto pertenece a una categoría.

RN-005

Cada compra incrementa el stock.

RN-006

Cada venta disminuye el stock.

RN-007

Todo usuario pertenece a una empresa.

RN-008

Toda tabla de negocio debe incluir empresa_id.

RN-009

Los administradores pueden gestionar cualquier módulo de su empresa.

RN-010

Los usuarios solo podrán acceder a los módulos autorizados según su rol.

# 13. Arquitectura General

## Objetivo

La arquitectura del Sistema Inteligente de Control de Inventario debe cumplir los siguientes principios:

- Escalable
- Desacoplada
- Modular
- Reutilizable
- Fácil de mantener
- Fácil de probar
- Segura

La aplicación será desarrollada utilizando una arquitectura desacoplada donde el Frontend y el Backend funcionarán como aplicaciones independientes comunicándose mediante una API REST.

---

## Arquitectura de Alto Nivel

                Usuario

                   │

                   ▼

          Frontend (Next.js)

                   │

                Axios

                   │

                   ▼

         Laravel REST API

                   │

        Services / Business Logic

                   │

             Repositories

                   │

                Eloquent

                   │

                 MySQL

---

## Objetivos de la arquitectura

Separar responsabilidades.

Evitar dependencias entre módulos.

Permitir reemplazar el Frontend sin afectar el Backend.

Permitir consumir la API desde:

- Web
- App móvil
- IA
- WhatsApp
- Telegram
- Sistemas externos

---

## Arquitectura por capas

Presentación

↓

Aplicación

↓

Dominio

↓

Persistencia

↓

Base de Datos

---

# 14. Arquitectura Backend

Framework

Laravel

Arquitectura

REST API

JWT

Repository Pattern

Service Layer

Policies

Middleware

Validation

Events

Jobs

Observers

Resources

---

## Organización

app/

Actions/

DTO/

Enums/

Events/

Exceptions/

Helpers/

Http/

Models/

Observers/

Policies/

Repositories/

Resources/

Services/

Traits/

ValueObjects/

---

## Responsabilidades

Models

Representan entidades.

Nunca contienen lógica compleja.

---

Repositories

Toda consulta compleja deberá implementarse aquí.

Ejemplos

ProductRepository

InventoryRepository

PurchaseRepository

---

Services

Toda regla de negocio irá aquí.

Ejemplo

PurchaseService

InventoryService

SaleService

DashboardService

---

Policies

Administran permisos.

Ejemplo

ProductPolicy

PurchasePolicy

InventoryPolicy

---

Resources

Formatean la respuesta JSON.

Nunca devolver modelos directamente.

---

# 15. Arquitectura Frontend

Framework

Next.js App Router

---

Tecnologías

TypeScript

TailwindCSS

Redux Toolkit

Axios

React Hook Form

Zod

TanStack Table

Recharts

Lucide React

Sonner

Framer Motion

---

## Organización

src/

app/

modules/

components/

hooks/

services/

store/

types/

utils/

config/

assets/

---

## Arquitectura Modular

Cada módulo será independiente.

Ejemplo

modules/

auth/

products/

inventory/

purchases/

sales/

dashboard/

users/

roles/

settings/

---

Cada módulo contendrá

components/

pages/

hooks/

services/

store/

types/

validators/

---

# 16. Modelo del Dominio

El sistema estará compuesto por los siguientes dominios principales.

Empresa

Usuarios

Roles

Productos

Categorías

Inventario

Movimientos

Compras

Ventas

Clientes

Proveedores

Dashboard

Reportes

Configuración

---

## Dominio Empresa

Responsable del aislamiento de información.

Todas las tablas tendrán

empresa_id

---

## Dominio Usuarios

Responsabilidades

Autenticación

Autorización

Permisos

Perfil

---

## Dominio Productos

Responsabilidades

Catálogo

Precio

Costo

Stock

Código

Código de barras

Categoría

Proveedor principal

---

## Dominio Inventario

Responsabilidades

Entradas

Salidas

Transferencias

Ajustes

Kardex

---

## Dominio Compras

Responsabilidades

Órdenes

Recepción

Detalle

Actualización de stock

---

## Dominio Ventas

Responsabilidades

Ventas

Detalle

Descuento

Actualización de inventario

---

# 17. Módulo de Autenticación

Objetivo

Controlar el acceso al sistema.

---

Funcionalidades

Login

Logout

Recuperar contraseña

Cambiar contraseña

Perfil

Renovar Token

Cerrar todas las sesiones

---

Flujo

Usuario

↓

Login

↓

JWT

↓

Middleware

↓

Acceso

---

Permisos

Administrador

Supervisor

Compras

Ventas

Bodega

Consulta

---

Seguridad

Hash de contraseñas

JWT

Middleware

Policies

Rate Limit

Logs

---

# 18. Gestión de Usuarios

Objetivo

Administrar todos los usuarios de la empresa.

---

Funciones

Crear usuario

Editar usuario

Desactivar usuario

Cambiar contraseña

Asignar roles

Consultar historial

---

Datos

Nombre

Correo

Teléfono

Empresa

Estado

Fecha creación

Último acceso

---

Estados

Activo

Suspendido

Eliminado

---

# 19. Gestión de Roles y Permisos

El sistema utilizará RBAC
(Role Based Access Control)

---

Roles iniciales

Administrador

Supervisor

Compras

Ventas

Bodega

Consulta

---

Permisos

Ver

Crear

Editar

Eliminar

Exportar

Importar

Administrar

---

Cada módulo tendrá permisos independientes.

Ejemplo

Productos

productos.ver

productos.crear

productos.editar

productos.eliminar

---

Compras

compras.ver

compras.crear

compras.editar

compras.eliminar

---

Ventas

ventas.ver

ventas.crear

ventas.editar

ventas.eliminar

---

# 20. Dashboard

Objetivo

Mostrar indicadores clave del negocio.

---

Widgets

Ventas del día

Compras del día

Productos

Clientes

Proveedores

Stock total

Productos agotados

Productos con bajo inventario

Últimos movimientos

Ventas mensuales

Compras mensuales

---

Gráficas

Ventas por mes

Compras por mes

Top productos

Inventario por categoría

Rotación de inventario

---

Filtros

Hoy

Semana

Mes

Año

Personalizado

---

Indicadores KPI

Valor del inventario

Costo promedio

Margen estimado

Rotación

Stock mínimo

Stock máximo

Tiempo promedio de reposición

# 21. Módulo Productos

## Objetivo

Administrar el catálogo completo de productos de la empresa.

Este módulo será el núcleo del sistema de inventario.

Todos los movimientos dependerán de los productos registrados.

---

## Funcionalidades

Crear producto

Editar producto

Eliminar producto (lógico)

Consultar producto

Buscar producto

Duplicar producto

Cambiar estado

Importar productos

Exportar productos

---

## Datos del Producto

Código interno

Código de barras

Nombre

Descripción

Categoría

Marca

Proveedor principal

Costo

Precio de venta

IVA

Unidad de medida

Stock actual

Stock mínimo

Stock máximo

Ubicación

Imagen

Estado

Empresa

Fecha creación

Fecha actualización

Usuario creador

Usuario modificación

---

## Estados

Activo

Inactivo

Descontinuado

Agotado

Pendiente

---

## Validaciones

El código no puede repetirse.

El código de barras no puede repetirse.

El precio nunca será negativo.

El costo nunca será negativo.

El stock inicial no puede ser negativo.

Toda categoría debe existir.

Todo proveedor debe existir.

---

## Reglas

No eliminar productos con movimientos.

No modificar empresa_id.

Registrar auditoría.

Guardar historial de cambios.

---

## Búsquedas

Código

Nombre

Código de barras

Proveedor

Categoría

Marca

Estado

Empresa

---

## Acciones Masivas

Importar Excel

Exportar Excel

Exportar CSV

Cambiar estado

Eliminar lógico

Actualizar precios

---

# 22. Módulo Categorías

## Objetivo

Organizar el catálogo de productos.

---

## Funciones

Crear

Editar

Eliminar

Consultar

Activar

Desactivar

---

## Datos

Nombre

Descripción

Color

Icono

Estado

Empresa

---

## Reglas

No eliminar categorías con productos.

Una categoría puede contener miles de productos.

---

# 23. Módulo Inventario

## Objetivo

Mantener el inventario actualizado en tiempo real.

---

## Entradas

Compras

Ajustes positivos

Devoluciones

Transferencias

Producción

---

## Salidas

Ventas

Consumo interno

Ajustes negativos

Pérdidas

Transferencias

---

## Operaciones

Actualizar Stock

Consultar Kardex

Consultar existencia

Consultar histórico

Consultar costo promedio

---

## Métodos de Costeo

Costo Promedio

FIFO (Versión futura)

LIFO (No implementado)

---

## Alertas

Stock mínimo

Stock máximo

Sin movimiento

Inventario negativo

Productos vencidos (futuro)

---

## Dashboard

Valor del inventario

Cantidad de referencias

Valor promedio

Rotación

---

# 24. Módulo Movimientos

## Objetivo

Registrar absolutamente todos los movimientos realizados sobre el inventario.

Este módulo nunca permitirá eliminar registros.

---

## Tipos

Compra

Venta

Ajuste

Transferencia

Producción

Devolución

Consumo

Corrección

---

## Información registrada

Fecha

Hora

Usuario

Producto

Cantidad

Stock anterior

Stock nuevo

Costo

Precio

Documento origen

Empresa

Observaciones

---

## Auditoría

IP

Dispositivo

Navegador

Sistema Operativo

Fecha

Hora

Usuario

---

## Kardex

Cada movimiento actualizará automáticamente el Kardex del producto.

Nunca podrá modificarse manualmente.

---

# 25. Módulo Compras

## Objetivo

Administrar el abastecimiento del inventario.

---

## Flujo

Proveedor

↓

Orden de Compra

↓

Recepción

↓

Ingreso Inventario

↓

Actualización Stock

↓

Auditoría

---

## Estados

Borrador

Pendiente

Aprobada

Recibida

Parcial

Cancelada

---

## Información

Proveedor

Fecha

Número

Observaciones

Subtotal

Impuestos

Descuentos

Total

Usuario

Empresa

---

## Detalle

Producto

Cantidad

Costo

IVA

Subtotal

Total

---

## Reglas

Toda compra incrementa el inventario.

No permitir compras sin detalle.

No permitir cantidades negativas.

Registrar auditoría.

---

# 26. Módulo Proveedores

## Objetivo

Administrar los proveedores.

---

## Datos

NIT

Nombre

Razón Social

Dirección

Ciudad

Departamento

País

Teléfono

Correo

Contacto

Estado

Empresa

---

## Funciones

Crear

Editar

Consultar

Buscar

Inactivar

---

## Reglas

No eliminar proveedores con compras.

Registrar historial.

---

# 27. Módulo Ventas

## Objetivo

Controlar todas las ventas realizadas.

---

## Flujo

Cliente

↓

Venta

↓

Detalle

↓

Salida Inventario

↓

Factura

↓

Dashboard

---

## Estados

Borrador

Pendiente

Facturada

Pagada

Anulada

---

## Datos

Cliente

Fecha

Número

Observaciones

Subtotal

IVA

Descuento

Total

Usuario

Empresa

---

## Reglas

No vender sin stock.

No vender cantidades negativas.

Actualizar inventario automáticamente.

Registrar Kardex.

Registrar auditoría.

---

## Dashboard

Ventas Hoy

Ventas Mes

Ventas Año

Top Clientes

Top Productos

Margen

Ticket Promedio

---

# 28. Módulo Clientes

## Objetivo

Administrar la base de clientes.

---

## Datos

Documento

Tipo Documento

Nombre

Apellido

Empresa

Correo

Teléfono

Dirección

Ciudad

Departamento

País

Fecha Nacimiento

Estado

---

## Funciones

Crear

Editar

Consultar

Buscar

Inactivar

Historial Compras

---

## Clasificación

Cliente Nuevo

Cliente Frecuente

Cliente Premium

Cliente Inactivo

---

## Reportes

Clientes Nuevos

Clientes Activos

Clientes Inactivos

Top Compradores

Ventas por Cliente

Frecuencia de Compra

---

## Integraciones Futuras

CRM

WhatsApp

Correo Electrónico

SMS

Campañas

Automatizaciones IA

# 29. Modelo de Base de Datos

## Objetivo

Diseñar una base de datos normalizada, escalable y preparada para soportar el crecimiento de Fidel OS.

El modelo deberá minimizar redundancias, garantizar la integridad referencial y facilitar el mantenimiento a largo plazo.

---

## Motor

MySQL 8+

Charset

utf8mb4

Collation

utf8mb4_unicode_ci

Storage Engine

InnoDB

---

## Convenciones

Todas las tablas utilizarán:

id BIGINT UNSIGNED AUTO_INCREMENT

created_at

updated_at

deleted_at (Soft Delete cuando aplique)

empresa_id

created_by

updated_by

---

## Convenciones de nombres

Tablas

snake_case

usuarios

productos

movimientos

compras

ventas

---

Columnas

snake_case

precio_venta

stock_actual

stock_minimo

codigo_barras

---

Llaves Foráneas

tabla_id

categoria_id

usuario_id

empresa_id

proveedor_id

---

# 30. Diccionario de Datos

## Tabla: empresas

Descripción

Representa cada empresa registrada en el sistema.

Campos

id

nombre

nit

telefono

correo

direccion

ciudad

pais

estado

created_at

updated_at

---

## Tabla: usuarios

Descripción

Usuarios autenticados del sistema.

Campos

id

empresa_id

rol_id

nombre

apellido

correo

telefono

password

estado

ultimo_login

remember_token

created_at

updated_at

---

## Tabla: roles

Campos

id

nombre

descripcion

empresa_id

created_at

updated_at

---

## Tabla: permisos

Campos

id

nombre

slug

descripcion

created_at

updated_at

---

## Tabla: categorias

Campos

id

empresa_id

nombre

descripcion

color

icono

estado

created_at

updated_at

---

## Tabla: productos

Campos

id

empresa_id

categoria_id

proveedor_id

codigo

codigo_barras

nombre

descripcion

costo

precio

iva

unidad_medida

stock_actual

stock_minimo

stock_maximo

ubicacion

imagen

estado

created_at

updated_at

---

## Tabla: proveedores

id

empresa_id

nit

nombre

telefono

correo

direccion

ciudad

pais

estado

---

## Tabla: clientes

id

empresa_id

documento

nombre

correo

telefono

direccion

ciudad

estado

---

## Tabla: compras

id

empresa_id

proveedor_id

usuario_id

numero

fecha

subtotal

iva

descuento

total

estado

observaciones

---

## Tabla: compras_detalle

id

compra_id

producto_id

cantidad

costo

iva

subtotal

total

---

## Tabla: ventas

id

empresa_id

cliente_id

usuario_id

numero

fecha

subtotal

iva

descuento

total

estado

---

## Tabla: ventas_detalle

id

venta_id

producto_id

cantidad

precio

descuento

iva

subtotal

---

## Tabla: movimientos

id

empresa_id

producto_id

usuario_id

tipo

documento

cantidad

stock_anterior

stock_nuevo

costo

precio

observacion

created_at

---

# 31. Relaciones

Empresa

↓

Usuarios

↓

Roles

↓

Permisos

---

Empresa

↓

Productos

↓

Categorías

↓

Proveedor

---

Producto

↓

Movimientos

---

Compra

↓

Compra Detalle

↓

Producto

↓

Movimiento

---

Venta

↓

Venta Detalle

↓

Producto

↓

Movimiento

---

Cliente

↓

Ventas

---

Proveedor

↓

Compras

---

# 32. Índices

Productos

INDEX(codigo)

INDEX(nombre)

INDEX(categoria_id)

INDEX(empresa_id)

INDEX(codigo_barras)

---

Compras

INDEX(numero)

INDEX(fecha)

INDEX(proveedor_id)

INDEX(empresa_id)

---

Ventas

INDEX(numero)

INDEX(cliente_id)

INDEX(fecha)

INDEX(empresa_id)

---

Movimientos

INDEX(producto_id)

INDEX(tipo)

INDEX(created_at)

INDEX(empresa_id)

---

# 33. Integridad Referencial

No existirán registros huérfanos.

Todas las relaciones utilizarán Foreign Keys.

Ejemplo

producto_id

REFERENCES productos(id)

ON UPDATE CASCADE

ON DELETE RESTRICT

---

# 34. API REST

## Convenciones

Base URL

/api/v1

Todas las respuestas serán JSON.

---

Autenticación

Bearer Token

Authorization

Bearer eyJ...

---

Formato

GET

POST

PUT

PATCH

DELETE

---

# 35. Endpoints de Autenticación

POST

/login

POST

/logout

POST

/refresh

POST

/forgot-password

POST

/reset-password

GET

/profile

PUT

/profile

PUT

/change-password

---

# 36. Endpoints Productos

GET

/products

GET

/products/{id}

POST

/products

PUT

/products/{id}

DELETE

/products/{id}

GET

/products/search

GET

/products/export

POST

/products/import

---

# 37. Endpoints Categorías

GET

/categories

POST

/categories

PUT

/categories/{id}

DELETE

/categories/{id}

---

# 38. Endpoints Compras

GET

/purchases

POST

/purchases

GET

/purchases/{id}

PUT

/purchases/{id}

DELETE

/purchases/{id}

---

# 39. Endpoints Ventas

GET

/sales

POST

/sales

GET

/sales/{id}

PUT

/sales/{id}

DELETE

/sales/{id}

---

# 40. Endpoints Inventario

GET

/inventory

GET

/inventory/kardex

GET

/inventory/low-stock

GET

/inventory/out-of-stock

POST

/inventory/adjust

POST

/inventory/transfer

---

# 41. Formato de Respuesta

Éxito

{
    "success": true,
    "message": "Operación realizada correctamente",
    "data": {}
}

---

Error

{
    "success": false,
    "message": "El producto no existe",
    "errors": []
}

---

Error de Validación

{
    "success": false,
    "errors": {
        "nombre": [
            "El nombre es obligatorio."
        ]
    }
}

---

# 42. Códigos HTTP

200 OK

201 Created

204 No Content

400 Bad Request

401 Unauthorized

403 Forbidden

404 Not Found

409 Conflict

422 Validation Error

500 Internal Server Error

---

# 43. Versionado

Todas las APIs estarán bajo:

/api/v1

En futuras versiones:

/api/v2

/api/v3

Nunca se romperá la compatibilidad de una versión existente.
# 44. Arquitectura del Frontend

## Objetivo

Construir una interfaz moderna, rápida, reutilizable y desacoplada del backend.

El frontend debe ser capaz de consumir cualquier API REST sin depender de Laravel.

---

## Stack Oficial

Framework
Next.js App Router

Lenguaje
TypeScript

Estilos
TailwindCSS

UI
shadcn/ui

Estado Global
Redux Toolkit

Llamadas HTTP
Axios

Formularios
React Hook Form

Validaciones
Zod

Tablas
TanStack Table

Gráficas
Recharts

Notificaciones
Sonner

Iconos
Lucide React

Animaciones
Framer Motion

---

## Arquitectura de Carpetas

src/

app/

components/

modules/

hooks/

layouts/

services/

store/

types/

config/

utils/

assets/

styles/

middleware/

---

## Organización Modular

Cada módulo tendrá independencia.

Ejemplo

modules/

products/

components/

hooks/

pages/

services/

types/

store/

validators/

---

Nunca un módulo accederá directamente al código de otro.

La comunicación se hará mediante servicios compartidos.

---

# 45. Layout General

El sistema utilizará un Dashboard Administrativo.

Distribución

--------------------------------------------------

Navbar Superior

--------------------------------------------------

Sidebar | Contenido Principal

|

|

--------------------------------------------------

Footer

--------------------------------------------------

---

## Navbar

Logo

Buscador

Notificaciones

Usuario

Configuración

Modo Oscuro

---

## Sidebar

Dashboard

Productos

Inventario

Compras

Ventas

Clientes

Proveedores

Usuarios

Reportes

Configuración

Cerrar Sesión

---

## Footer

Versión

Empresa

Copyright

Estado API

---

# 46. Pantalla Login

Objetivo

Permitir autenticación segura.

---

Campos

Correo

Contraseña

Recordarme

Botón Ingresar

Recuperar contraseña

---

Validaciones

Correo obligatorio

Correo válido

Contraseña obligatoria

Contraseña mínima

---

Errores

Usuario no existe

Contraseña incorrecta

Usuario bloqueado

Servidor no disponible

---

# 47. Dashboard

Objetivo

Mostrar el estado del negocio en una sola pantalla.

---

KPIs

Ventas Hoy

Ventas Mes

Compras Mes

Clientes

Productos

Inventario

Valor Inventario

Productos Bajo Stock

---

Widgets

Top Productos

Top Clientes

Compras Recientes

Ventas Recientes

Movimientos

Alertas

---

Gráficas

Ventas Mensuales

Compras Mensuales

Productos por Categoría

Rotación Inventario

---

Filtros

Hoy

Semana

Mes

Año

Personalizado

---

# 48. Pantalla Productos

Objetivo

Administrar productos.

---

Botones

Nuevo

Editar

Eliminar

Exportar

Importar

Duplicar

---

Tabla

Código

Nombre

Categoría

Costo

Precio

Stock

Estado

Acciones

---

Filtros

Nombre

Código

Categoría

Proveedor

Estado

---

Paginación

10

25

50

100

Todos

---

# 49. Formulario Producto

Secciones

Información General

Precios

Inventario

Proveedor

Imagen

Configuración

---

Información General

Código

Código Barras

Nombre

Descripción

Categoría

Marca

---

Precios

Costo

IVA

Precio Venta

Margen

---

Inventario

Stock Inicial

Stock Mínimo

Stock Máximo

Ubicación

---

Proveedor

Proveedor Principal

Proveedor Alterno

---

Imagen

Subir Imagen

Vista previa

Eliminar

---

Validaciones

Nombre obligatorio

Código único

Precio positivo

Costo positivo

Categoría obligatoria

Proveedor válido

---

# 50. Pantalla Compras

Funciones

Nueva Compra

Editar

Consultar

Anular

Exportar

---

Cabecera

Proveedor

Fecha

Número

Observaciones

---

Detalle

Producto

Cantidad

Costo

IVA

Subtotal

---

Resumen

Subtotal

IVA

Descuento

Total

---

Acciones

Guardar

Cancelar

Aprobar

Imprimir

---

# 51. Pantalla Ventas

Cabecera

Cliente

Fecha

Número

Vendedor

---

Detalle

Producto

Cantidad

Precio

IVA

Subtotal

---

Resumen

Subtotal

IVA

Descuento

Total

---

Reglas

No vender sin stock.

Actualizar inventario automáticamente.

Registrar Kardex.

---

# 52. Pantalla Inventario

Objetivo

Consultar existencias.

---

Información

Producto

Categoría

Stock

Costo

Valor

Ubicación

---

Filtros

Categoría

Proveedor

Stock Bajo

Agotados

---

Acciones

Exportar

Imprimir

Consultar Kardex

---

# 53. Kardex

Información

Fecha

Hora

Documento

Movimiento

Entrada

Salida

Saldo

Usuario

Observación

---

Nunca podrá editarse.

Nunca podrá eliminarse.

---

# 54. Pantalla Clientes

Funciones

Crear

Editar

Consultar

Historial

Exportar

---

Información

Documento

Nombre

Correo

Teléfono

Dirección

Ciudad

Estado

---

Historial

Compras

Monto

Frecuencia

Última Compra

---

# 55. Pantalla Proveedores

Funciones

Crear

Editar

Consultar

Compras

Exportar

---

Información

NIT

Nombre

Correo

Teléfono

Ciudad

Estado

---

Indicadores

Compras Totales

Monto Comprado

Última Compra

Productos Suministrados

---

# 56. Reportes

Reportes Disponibles

Ventas

Compras

Inventario

Clientes

Proveedores

Productos

Kardex

Usuarios

---

Exportaciones

Excel

CSV

PDF

Impresión

---

Filtros

Fecha

Empresa

Categoría

Proveedor

Cliente

Usuario

Producto

Estado

---

# 57. Estados de la Interfaz

Loading

Skeleton

Error

Vacío

Éxito

Permiso Denegado

No Encontrado

Servidor No Disponible

---

Todos los módulos deberán implementar estos estados.

---

# 58. Sistema de Componentes

Botones

Inputs

Select

Autocomplete

DatePicker

Modal

Drawer

Dialog

Toast

Cards

Tables

Charts

Tabs

Breadcrumb

Sidebar

Navbar

Footer

Badges

Pagination

SearchBox

Confirm Dialog

Todos reutilizables.

---

# 59. Sistema de Colores

Primario

Secundario

Éxito

Advertencia

Error

Información

Neutral

Modo Claro

Modo Oscuro

No se permitirán colores definidos directamente en componentes.

Todo deberá utilizar Tokens del Design System.

# 60. Seguridad

## Objetivo

Garantizar la confidencialidad, integridad y disponibilidad de la información.

La seguridad será un requisito transversal a todo el sistema.

---

## Principios

• Least Privilege

• Defense in Depth

• Zero Trust

• Secure by Default

• Fail Secure

• Audit Everything

---

## Autenticación

El sistema utilizará JWT.

Características:

- Access Token
- Refresh Token
- Expiración configurable
- Revocación
- Logout global

---

## Autorización

Laravel Policies

Laravel Gates

Middleware

Roles

Permisos

Nunca se validarán permisos únicamente desde el Frontend.

Toda autorización será validada nuevamente en Laravel.

---

## Protección CSRF

Para clientes web se utilizarán mecanismos apropiados según el tipo de autenticación.

Todas las peticiones deberán estar protegidas frente a ataques de falsificación de solicitudes cuando aplique.

---

## Validaciones

Toda entrada será validada.

Backend

Laravel FormRequest

Frontend

Zod

React Hook Form

Nunca confiar en los datos enviados por el navegador.

---

## Contraseñas

Hash

Argon2id

Nunca guardar texto plano.

Nunca enviar contraseñas por correo.

Nunca registrar contraseñas en logs.

---

## Rate Limit

Login

5 intentos

Recuperación

3 intentos

API

Configurable

---

## Headers de Seguridad

Content Security Policy

X-Frame-Options

X-Content-Type-Options

Referrer-Policy

Strict-Transport-Security

---

## Archivos

Validar extensión

Validar MIME

Validar tamaño

Renombrar archivos

Nunca ejecutar archivos subidos.

---

# 61. Auditoría

Toda acción importante será auditada.

---

Eventos

Login

Logout

Crear

Editar

Eliminar

Importar

Exportar

Cambio de permisos

Cambio de contraseña

---

Datos registrados

Usuario

Empresa

Fecha

Hora

IP

Navegador

Sistema Operativo

Acción

Módulo

Registro afectado

Valores anteriores

Valores nuevos

Resultado

---

La auditoría será inmutable.

Nunca podrá modificarse.

Nunca podrá eliminarse.

---

# 62. Logging

El sistema utilizará logs estructurados.

---

Niveles

Emergency

Alert

Critical

Error

Warning

Notice

Info

Debug

---

Eventos críticos

Errores SQL

Errores API

Errores autenticación

Excepciones

Tiempo excesivo

Errores externos

---

Formato

Timestamp

Usuario

Empresa

IP

Nivel

Mensaje

Contexto

---

# 63. Rendimiento

Objetivos

Respuesta CRUD

<500 ms

Dashboard

<2 segundos

Login

<1 segundo

---

Optimización

Lazy Loading

Paginación

Índices

Cache

Consultas optimizadas

Evitar N+1

---

# 64. Escalabilidad

La arquitectura permitirá crecer horizontalmente.

---

Backend

Laravel API

Stateless

---

Frontend

Next.js independiente

---

Base de Datos

Optimizada

Índices

Particionado futuro

Réplicas futuras

---

Cache

Redis (fase futura)

---

Queue

Laravel Queue

Redis

SQS (futuro)

---

# 65. Integraciones

Diseño preparado para integrar:

WhatsApp

Telegram

OpenAI

Claude

Gemini

Google Drive

Google Sheets

Correo

SMS

Webhooks

ERP

CRM

Marketplace

---

Toda integración será desacoplada mediante Services.

Nunca desde Controllers.

---

# 66. Estrategia de Pruebas

## Unitarias

Services

Repositories

Helpers

Value Objects

Policies

---

## Integración

API

JWT

Base de Datos

Colas

Eventos

---

## End to End

Login

Productos

Compras

Ventas

Inventario

Usuarios

---

## Cobertura

Objetivo mínimo

80%

Ideal

90%

---

# 67. CI/CD

Pipeline

↓

Instalar dependencias

↓

Análisis estático

↓

Pruebas

↓

Build

↓

Deploy Staging

↓

QA

↓

Deploy Producción

---

No se desplegará código sin pasar las pruebas.

---

# 68. Convenciones de Desarrollo

## PHP

PSR-12

Type Hinting obligatorio

Strict Types

DTO

Enums

Services

Repositories

Policies

Events

Resources

---

## TypeScript

Strict Mode

Interfaces

Tipos explícitos

No utilizar any salvo justificación documentada.

---

## Git

main

develop

feature/*

fix/*

hotfix/*

release/*

---

Commits

Conventional Commits

feat:

fix:

refactor:

docs:

test:

chore:

---

# 69. Roadmap

## Sprint 1

Infraestructura

Repositorio

Autenticación

Usuarios

Roles

Permisos

---

## Sprint 2

Categorías

Productos

Dashboard

---

## Sprint 3

Compras

Proveedores

Movimientos

Inventario

---

## Sprint 4

Clientes

Ventas

Kardex

---

## Sprint 5

Reportes

Exportaciones

Configuración

---

## Sprint 6

Auditoría

Logs

Performance

QA

Deploy

---

# 70. Definition of Done

Una funcionalidad se considera terminada únicamente cuando:

✓ Cumple la especificación.

✓ Backend implementado.

✓ Frontend implementado.

✓ Validaciones completas.

✓ Pruebas unitarias aprobadas.

✓ Pruebas de integración aprobadas.

✓ Documentación actualizada.

✓ Código revisado.

✓ Sin errores críticos.

✓ Sin vulnerabilidades conocidas.

✓ Aprobación funcional.

---

# 71. Riesgos

## Técnicos

Cambios de alcance.

Dependencias externas.

Errores de integración.

Problemas de rendimiento.

Migraciones.

---

## Negocio

Cambios regulatorios.

Nuevos requerimientos.

Escalabilidad.

Cambios de prioridad.

---

## Mitigación

Arquitectura modular.

Documentación completa.

Pruebas automáticas.

Versionado.

Revisiones continuas.

---

# 72. Anexos

## Glosario

CRUD

Create

Read

Update

Delete

---

JWT

JSON Web Token

---

RBAC

Role Based Access Control

---

DTO

Data Transfer Object

---

KPI

Key Performance Indicator

---

API

Application Programming Interface

---

REST

Representational State Transfer

---

## Referencias

Laravel Documentation

Next.js Documentation

TypeScript Handbook

OWASP Top 10

PSR Standards

MySQL Documentation

RFC 7519 (JWT)

---

# Fin del Documento

Este documento constituye la especificación oficial del Sistema Inteligente de Control de Inventario de Fidel OS.

Ningún desarrollo deberá iniciarse sin que este documento haya sido revisado y aprobado.

Toda modificación funcional deberá reflejarse primero en este documento antes de implementarse en el código fuente.

# 73. Arquitectura Empresarial (Enterprise Architecture)

## Objetivo

Definir la arquitectura oficial de Fidel OS para garantizar que todos los productos desarrollados compartan los mismos principios, componentes y estándares técnicos.

La arquitectura deberá permitir:

- Reutilización de código.
- Escalabilidad.
- Mantenibilidad.
- Modularidad.
- Integración con IA.
- Integración con APIs externas.
- Desarrollo paralelo por múltiples agentes.

---

# Principios Arquitectónicos

Toda decisión técnica deberá cumplir estos principios.

## 1. Single Source of Truth

Toda información tendrá una única fuente oficial.

Ejemplos

Productos

↓

Tabla productos

No se permitirá duplicar información.

---

## 2. API First

Toda funcionalidad deberá existir primero como API.

El Frontend nunca accederá directamente a la Base de Datos.

Toda comunicación será mediante REST.

---

## 3. Stateless Backend

Laravel no almacenará estado del usuario.

Toda autenticación será mediante JWT.

Esto permitirá:

- Escalabilidad horizontal.
- Balanceadores.
- Microservicios futuros.

---

## 4. Modularidad

Cada módulo deberá ser completamente independiente.

Ejemplo

Productos

Compras

Ventas

Inventario

Clientes

Usuarios

Roles

Cada uno tendrá:

Controllers

Services

Repositories

Policies

Resources

Routes

Tests

---

## 5. Separación de Responsabilidades

Controllers

↓

Services

↓

Repositories

↓

Models

Nunca se permitirá lógica de negocio dentro de Controllers.

---

## 6. Bajo Acoplamiento

Un módulo nunca conocerá la implementación interna de otro.

Solo conocerá Interfaces.

Esto facilitará pruebas unitarias.

---

## 7. Alta Cohesión

Cada clase tendrá una única responsabilidad.

Ejemplos

PurchaseService

Solo compras.

InventoryService

Solo inventario.

DashboardService

Solo dashboard.

---

## 8. SOLID

Todo el proyecto deberá cumplir:

S

Single Responsibility

O

Open Closed

L

Liskov

I

Interface Segregation

D

Dependency Inversion

---

## 9. Clean Architecture

La lógica del negocio será independiente de:

Framework

Base de Datos

Frontend

API

Proveedor Cloud

---

# Arquitectura Física

Cliente

↓

Cloudflare

↓

Nginx

↓

Next.js

↓

Laravel API

↓

MySQL

↓

Storage

↓

Backups

---

# Arquitectura Lógica

Presentation

↓

Application

↓

Domain

↓

Infrastructure

↓

Database

---

# Comunicación

Frontend

↓

Axios

↓

Laravel

↓

Services

↓

Repositories

↓

MySQL

---

# Eventos

Compra registrada

↓

Actualizar Inventario

↓

Registrar Kardex

↓

Actualizar Dashboard

↓

Generar Auditoría

↓

Enviar Notificación

Cada evento será desacoplado.

---

# Flujo de Datos

Usuario

↓

Frontend

↓

Validación

↓

API

↓

Service

↓

Repository

↓

Database

↓

Respuesta

↓

Frontend

---

# Gestión de Errores

Todos los errores utilizarán un formato estándar.

Nunca se devolverán excepciones de Laravel directamente.

Todas las excepciones serán transformadas.

Ejemplo

ValidationException

↓

422

BusinessException

↓

409

AuthenticationException

↓

401

AuthorizationException

↓

403

---

# Gestión de Configuración

Toda configuración deberá estar centralizada.

Variables

.env

Configuración

config/

Nunca utilizar valores quemados (hardcoded).

---

# Internacionalización

Preparado para:

Español

Inglés

Portugués

Todos los textos deberán utilizar archivos de idioma.

---

# Zona Horaria

Todos los datos se almacenarán en UTC.

El Frontend convertirá según el usuario.

---

# Moneda

Preparado para múltiples monedas.

COP

USD

EUR

BRL

MXN

---

# Formatos

Fecha

ISO-8601

Moneda

Configurada por empresa.

---

# Escalabilidad

Preparado para:

100 usuarios

↓

1.000 usuarios

↓

10.000 usuarios

↓

100.000 usuarios

Sin cambiar la arquitectura.

---

# Reutilización

Todo componente deberá ser reutilizable.

Ejemplos

Modal

Tabla

Formulario

Buscador

Selector

Toast

Sidebar

Navbar

ConfirmDialog

Nunca duplicar componentes.

---

# Filosofía Fidel OS

Construir una vez.

Reutilizar siempre.

Documentar antes de programar.

Automatizar antes de repetir.

La arquitectura es el producto.

El código es solo la implementación.

---

# 74. Módulo Captura IA (AI Inventory Agent)

## Objetivo

Permitir registrar inventario mediante tres modos de captura:

- Foto
- Voz
- Foto + Voz

La IA analiza la captura y propone Productos y Movimientos.

El usuario confirma antes de escribir en las tablas oficiales (salvo alta confianza, ver "Umbral de confianza").

Este módulo es una capa de entrada adicional sobre los dominios Productos e Inventario ya definidos en las secciones 21, 23 y 24.

No introduce una fuente de datos paralela.

Cumple el principio Single Source of Truth: la IA nunca escribe directamente en `productos` ni en `movimientos`, solo a través de los Services existentes de esos dominios.

---

## Alcance del módulo

Incluye

✔ Captura por foto (uno o varios productos por imagen)

✔ Captura por voz (movimiento hablado en lenguaje natural)

✔ Captura combinada foto + voz

✔ Deduplicación y suma de cantidades para productos iguales

✔ Cola de revisión y confirmación manual cuando la confianza es baja

✔ Historial de capturas (auditoría de lo que la IA propuso vs. lo que el usuario confirmó)

No incluye (MVP)

✘ Reentrenamiento de modelos propios

✘ Reconocimiento facial o biométrico

✘ Procesamiento offline sin conexión a la API de IA

---

## Escenarios de fotografía soportados

Una misma fotografía puede contener cualquiera de estos casos, y el módulo debe resolverlos todos con la misma tubería (`VisionAnalyzerInterface` → `products[]`):

- Un producto único.
- Varios productos iguales (se suman en una sola cantidad, ver "Regla de deduplicación").
- Varios productos diferentes (uno por entrada del arreglo `products`).
- Una estantería completa.
- Un pallet.
- Una bodega.

No existe un límite artificial de productos por imagen: el arreglo `products` puede tener 1 o N entradas.

---

## Principios aplicados

Sigue los mismos principios de la sección 73.

API First — la captura IA es un endpoint más de la API, consumible también desde WhatsApp/Telegram a futuro (sección 65).

Bajo Acoplamiento — Captura IA (Controllers, Services, Strategies) consume un único `AIProviderInterface`. Ninguna clase de Captura IA instancia ni conoce OpenAI, Claude, Gemini, Ollama u OpenRouter directamente — ver "Proveedor de IA (AIProviderInterface)".

Separación de Responsabilidades — Controllers nunca llaman al proveedor de IA directamente; siempre a través de un Service.

Nunca inventar — si la confianza de un producto detectado es menor al umbral, se marca como pendiente de revisión. No se crea ni actualiza stock automáticamente.

Captura IA nunca contiene reglas de negocio — su única responsabilidad es extraer datos estructurados de la IA y delegar en `ProductService` e `InventoryService`. El matching de identidad de producto (nombre + marca + presentación) vive en `ProductService::buscarCoincidencia()`, no en un Action de Captura IA. La dirección de un movimiento (si `entrada` suma o `salida` resta) vive en `InventoryService::registrarMovimiento()`, no en Captura IA. La única regla que sí le pertenece a Captura IA es el umbral de confianza (cuánto confiar en lo que dijo la IA), porque no es una regla de Productos ni de Inventario.

Propiedad exclusiva del stock — `stock_actual` en `productos` **solo** puede ser modificado por `InventoryService`. Ningún componente de Captura IA (`CapturaIAService`, `ApplyInventoryMovementAction`, `ProductService`) escribe stock directamente. `ProductService::crear()` únicamente da de alta el catálogo (nombre, marca, categoría, presentación, unidad) con `stock_actual = 0`; el stock se mueve exclusivamente vía `InventoryService::registrarMovimiento()`, igual que para Compras y Ventas (secciones 25 y 27). Esto evita una segunda fuente de verdad para el stock.

---

## Proveedor de IA (AIProviderInterface)

Toda la captura IA depende de una única interfaz, `App\Contracts\AI\AIProviderInterface`, con tres métodos: `analyzeImage()`, `transcribeAudio()`, `extractStructured()`, más `name()` para trazabilidad. Ninguna `CaptureStrategy` conoce OpenAI ni ningún otro proveedor: solo esta interfaz. Sustituir OpenAI por Claude, Gemini, Ollama u OpenRouter es cambiar un binding en `AppServiceProvider` (`AIProviderInterface::class => ClaudeProvider::class`), sin tocar Strategies, Controllers ni Actions.

`OpenAIProvider` es la implementación actual: compone tres colaboradores internos (`VisionAnalyzerInterface`, `SpeechTranscriberInterface`, `StructuredExtractorInterface`, cada uno detrás de su propia interfaz por si en el futuro conviene mezclar proveedores a ese nivel), mide el tiempo de cada llamada, y devuelve siempre un `AIExtractionResultDTO`.

`analyzeImage()` y `extractStructured()` devuelven `AIExtractionResultDTO { data: StructuredExtractionDTO, provider: string, processingTimeMs: int }`. `StructuredExtractionDTO` es la forma provider-agnostic del contrato `{ products: DetectedProductDTO[], movement: string, transcript: ?string }` — cualquier proveedor futuro debe devolver esta misma forma; ningún Service ni Strategy conoce el formato crudo específico de un proveedor. `transcribeAudio()` solo devuelve el texto transcrito (no hay esquema que forzar ahí).

El esquema JSON forzado en las llamadas a OpenAI (`CaptureJsonSchema`) es un detalle interno de `Services/AI/*`, nunca hardcodeado dentro de una `CaptureStrategy`.

---

## Contrato de respuesta del proveedor de IA

La IA (Vision, Speech y Responses API) responde **siempre** con este esquema, sin importar si detecta uno o varios productos. Nunca texto libre, nunca un objeto plano fuera de `products`.

```json
{
  "products": [
    {
      "name": "Dog Chow Adultos",
      "brand": "Purina",
      "presentation": "20 kg",
      "category": "Alimento",
      "quantity": 5,
      "unit": "Bolsa",
      "confidence": 0.96
    }
  ],
  "movement": "entrada"
}
```

Reglas del contrato:

`products` es siempre un arreglo, incluso con un solo elemento. `StructuredExtractionDTO::fromArray()` nunca deserializa un objeto suelto; si el proveedor devolviera un objeto en vez de arreglo, se envuelve en uno de un elemento antes de continuar (ver tests de `StructuredExtractionDTO`).

`movement` es uno de: `entrada`, `salida`, `ajuste`, `conteo`, `transferencia`. Por defecto `entrada` cuando el modo es solo foto (no hay verbo de movimiento que inferir).

El esquema se fuerza vía structured outputs / function calling del proveedor (`StructuredExtractorInterface`/`VisionAnalyzerInterface`, colaboradores internos de `OpenAIProvider`), no por parsing de texto libre. Si el proveedor no puede cumplir el esquema, se trata como error 502 (`AIProviderException`) y la captura queda en `pendiente_revision`.

Este mismo esquema (`name`, `brand`, `presentation`, `category`, `quantity`, `unit`, `confidence`) es el que usa `DetectedProductDTO` internamente y el que expone la API REST (ver "Formato de respuesta"), para no mantener dos vocabularios distintos entre el contrato de IA y el contrato HTTP. Las columnas de base de datos siguen la convención en español del resto del sistema (ver "Modelo de Base de Datos"); el mapeo DTO ↔ columna es 1 a 1 y vive únicamente en `CapturaIARepository`.

---

## Arquitectura del flujo

```
Usuario
  │
  ├─ Foto ──────────────┐
  ├─ Voz ───────────────┤
  └─ Foto + Voz ────────┘
         │
         ▼
  CapturaIAController (Http)
    (valida, guarda el archivo ORIGINAL vía CapturaArchivoStorage, arma CaptureInputDTO)
         │
         ▼
  CapturaIAService (orquestador — sin reglas de negocio)
         │
         ▼
  CaptureStrategyResolver → CaptureStrategyInterface
    (Photo/Voice/Combined; cada una solo conoce AIProviderInterface)
         │
         ▼
  AIProviderInterface (OpenAIProvider u otro)
    devuelve siempre AIExtractionResultDTO { data: StructuredExtractionDTO, provider, processingTimeMs }
         │
         ▼
  MergeDuplicateDetectionsAction
    (funde duplicados de la propia extracción: mismo name+brand+presentation → suma quantity)
         │
         ▼
  ApplyInventoryMovementAction (por cada detección fusionada)
    │
    ├─► ProductService::buscarCoincidencia()   (delegación — regla de Productos)
    ├─► ProductService::crear()                (si no existe — solo catálogo, stock_actual = 0)
    └─► InventoryService::registrarMovimiento() (delegación — única vía de escritura de stock)
         │
         ▼
  CapturaIARepository
    (persiste capturas_ia + capturas_ia_detalle; uuid, archivo_path original, proveedor, tiempo_procesamiento_ms)
         │
         ▼
  AuditLogger::registrarCapturaIA()
    (un AuditLog por captura: tipo, proveedor, confianza, tiempo, usuario, empresa, resultado)
         │
         ▼
  CapturaIAResource → Respuesta JSON estructurada
```

Toda integración con el proveedor de IA vive en `app/Services/AI/`, nunca en Controllers, conforme a la sección 65 (Integraciones).

---

## Organización backend (extiende la sección 14)

```
app/
  Contracts/
    AI/
      AIProviderInterface.php        # único contrato que ve una CaptureStrategy
      VisionAnalyzerInterface.php    # colaborador interno de OpenAIProvider
      SpeechTranscriberInterface.php # colaborador interno de OpenAIProvider
      StructuredExtractorInterface.php # colaborador interno de OpenAIProvider
      # Reservado para futuras fuentes de captura (ver "Extensibilidad futura").
      # No implementar en esta fase, solo dejar el contrato si se requiere referenciarlo.
      BarcodeDecoderInterface.php
      QRDecoderInterface.php
      OCRExtractorInterface.php
      DocumentParserInterface.php
      VideoFrameExtractorInterface.php
    CapturaIA/
      CaptureStrategyInterface.php
  Services/
    AI/
      OpenAIProvider.php              # implementa AIProviderInterface
      OpenAIVisionService.php
      OpenAISpeechService.php
      OpenAIResponsesService.php
      Support/CaptureJsonSchema.php
    CapturaIA/
      CapturaIAService.php
      CaptureStrategyResolver.php
      CapturaArchivoStorage.php        # guarda imagen/audio ORIGINALES (punto 4)
      Strategies/
        PhotoCaptureStrategy.php
        VoiceCaptureStrategy.php
        CombinedCaptureStrategy.php
        # Futuras: BarcodeCaptureStrategy, QRCaptureStrategy,
        # InvoiceOcrCaptureStrategy, PdfCaptureStrategy, VideoCaptureStrategy.
    Audit/
      AuditLogger.php                 # un AuditLog por captura (punto 5)
  Actions/
    CapturaIA/
      MergeDuplicateDetectionsAction.php
      ApplyInventoryMovementAction.php  # única puerta a ProductService/InventoryService
  DTO/
    AI/
      DetectedProductDTO.php
      StructuredExtractionDTO.php
      AIExtractionResultDTO.php
    CapturaIA/
      CaptureInputDTO.php
      AppliedDetectionResultDTO.php
  Enums/
    TipoMovimiento.php
    CapturaIA/
      TipoCaptura.php
      EstadoCaptura.php
      EstadoCapturaDetalle.php
  Jobs/
    ProcesarCapturaIAJob.php          # queueable, preparado para async (punto 8)
  Repositories/
    ProductRepository.php
    CapturaIARepository.php
  Models/
    Empresa.php, Categoria.php, Producto.php, Movimiento.php
    CapturaIA.php, CapturaIADetalle.php
    AuditLog.php
  Http/
    Controllers/Api/CapturaIAController.php
    Requests/CapturaIA/StoreFotoRequest.php
    Requests/CapturaIA/StoreVozRequest.php
    Requests/CapturaIA/StoreFotoVozRequest.php
    Requests/CapturaIA/UpdateDetalleRequest.php
    Resources/CapturaIA/CapturaIAResource.php
    Resources/CapturaIA/CapturaIADetalleResource.php
    Support/ApiResponse.php           # envoltorio único de respuesta (sección 41)
```

Responsabilidades (igual que sección 14):

`Contracts/AI/AIProviderInterface` — el único contrato que una `CaptureStrategy` puede usar para hablar con la IA (punto 2). `VisionAnalyzerInterface`/`SpeechTranscriberInterface`/`StructuredExtractorInterface` son detalle interno de `OpenAIProvider`, no se inyectan en Strategies.

`Services/AI/*` — únicamente traducen la respuesta del proveedor externo a DTOs internos (`products[]` → `DetectedProductDTO[]`). No conocen `productos` ni `movimientos`.

`Services/CapturaIA/CaptureStrategyResolver` — decide qué `Strategy` ejecutar según `tipo`, sin que `CapturaIAController` ni `CapturaIAService` conozcan la lista completa de tipos soportados (Open/Closed: agregar un tipo nuevo es agregar una clase, no modificar un switch).

`Services/CapturaIA/Strategies/*` — cada estrategia solo depende de `AIProviderInterface` y siempre produce un `AIExtractionResultDTO` con `products[]`.

`Services/CapturaIA/CapturaArchivoStorage` — persiste el archivo original (imagen/audio) en el disco privado `local` antes de cualquier procesamiento, para auditoría.

`Services/Audit/AuditLogger` — escribe el `AuditLog` inmutable de cada captura.

`Actions/CapturaIA/*` — `MergeDuplicateDetectionsAction` (dedup de la propia extracción) y `ApplyInventoryMovementAction` (única puerta de Captura IA hacia `ProductService`/`InventoryService`; no reimplementa matching ni dirección de movimiento).

`Repositories/CapturaIARepository` — persistencia de la captura y su detalle, y el mapeo DTO (inglés) ↔ columnas (español), para trazabilidad y reentrenamiento futuro.

`Jobs/ProcesarCapturaIAJob` — mismo trabajo que `CapturaIAService::procesar()`, listo para encolarse (punto 8); hoy el Controller lo sigue llamando de forma síncrona.

---

## Regla de deduplicación y suma

Si `products[]` contiene N entradas del mismo producto (mismo `name` + `brand` + `presentation`) dentro de una misma captura:

Crear o actualizar un único registro en `productos` (vía `ProductService`, sin stock).

Sumar la cantidad detectada en un único movimiento vía `InventoryService::registrarMovimiento()`.

Nunca crear un registro de producto o movimiento por unidad física detectada.

Si `products[]` contiene productos distintos:

Generar un registro en `capturas_ia_detalle` por cada entrada distinta del arreglo.

Cada uno genera su propio movimiento en `movimientos` al aplicarse, siempre a través de `InventoryService`.

---

## Umbral de confianza

`confidence >= 0.85` → se guarda automáticamente: `ProductService`/`InventoryService` aplican el producto y su movimiento sin intervención humana.

`confidence < 0.85` → se envía a revisión: el detalle queda en `capturas_ia_detalle` con `estado = pendiente_revision` y la captura completa en `capturas_ia` con `estado = pendiente_revision`. No se toca `productos` ni `movimientos` hasta que el usuario confirme o corrija desde la cola de revisión.

El umbral (0.85) es configurable por empresa (tabla `configuraciones`, no hardcoded, conforme a "Gestión de Configuración" sección 73), pero el valor por defecto y el comportamiento binario (aplicar vs. revisar) son los descritos arriba.

Una misma captura con varios productos puede quedar parcialmente aplicada: los elementos con `confidence >= 0.85` se guardan, los demás quedan pendientes — el estado de la captura (`capturas_ia.estado`) refleja el peor caso (`pendiente_revision` si al menos un detalle quedó pendiente).

---

## Modelo de Base de Datos (extiende sección 30)

Sigue las convenciones de la sección 29: `id BIGINT UNSIGNED`, `empresa_id`, `created_by`, `updated_by`, `created_at`, `updated_at`, `deleted_at` cuando aplique, nombres en snake_case.

`tipo` y `estado` se validan a nivel de aplicación con enums de PHP (`App\Enums\CapturaIA\TipoCaptura`, `App\Enums\CapturaIA\EstadoCaptura`) sobre una columna `VARCHAR`, no con `ENUM` de MySQL. Así, agregar un tipo de captura futuro (código de barras, QR, OCR, PDF, video) es un cambio de código (nuevo caso del enum), no una migración de esquema — ver "Extensibilidad futura".

### Tabla: capturas_ia

id

uuid (identificador externo estable — apps móviles e integraciones lo usan en vez del id numérico, punto 6; es también la route key de `GET/PATCH/POST .../captura-ia/{uuid}/...`)

empresa_id

usuario_id

tipo (string, valores actuales: `foto`, `voz`, `foto_voz`; reservados para futuro: `codigo_barras`, `qr`, `ocr_factura`, `pdf`, `video`)

archivo_path (ruta del archivo ORIGINAL principal — imagen en Foto/Foto+Voz, audio en Voz — nunca solo el dato ya extraído, punto 4)

archivo_secundario_path (nullable — el audio original en modo `foto_voz`)

archivo_mime (nullable)

transcripcion (nullable, texto de la voz cuando aplica)

respuesta_ia_json (json crudo devuelto por el proveedor — siempre el contrato `{products, movement}` — para auditoría)

proveedor_ia (openai, claude, gemini, ollama, openrouter — viene de `AIProviderInterface::name()`, punto 2)

tiempo_procesamiento_ms (entero — de `AIExtractionResultDTO::processingTimeMs`, también queda en el AuditLog, punto 5)

movimiento_tipo (entrada, salida, ajuste, conteo, transferencia — viene del campo `movement` del contrato de IA)

confianza_promedio

estado (string, valores: `procesando`, `pendiente_revision`, `aplicado`, `parcial`, `descartado` — `procesando` es transitorio para cuando el pipeline corra en cola, punto 8; hoy el pipeline síncrono nunca lo deja en ese estado)

created_at

updated_at

---

### Tabla: capturas_ia_detalle

id

captura_id

producto_id (nullable — se llena solo si hizo match o si se creó el producto)

nombre_detectado (`products[].name`)

marca_detectado (`products[].brand`)

categoria_detectado (`products[].category`)

presentacion_detectado (`products[].presentation`)

unidad_detectado (`products[].unit`)

cantidad_detectada (`products[].quantity`)

confianza (`products[].confidence`)

es_producto_nuevo (boolean)

movimiento_id (nullable — FK a `movimientos`, solo una vez aplicado por `InventoryService`)

estado (pendiente_revision, aplicado, corregido, descartado)

created_at

updated_at

---

### Tabla: audit_logs

Genérica desde el diseño (sección 61): no es exclusiva de Captura IA, cualquier módulo futuro puede escribir aquí sus propios eventos.

id

uuid

empresa_id

usuario_id (nullable)

modulo (ej. `captura_ia`)

accion (ej. `captura_ia.procesar`)

auditable_type / auditable_id (referencia polimórfica — hoy siempre `CapturaIA`)

valores_anteriores (json, nullable — sin uso todavía en Captura IA, reservado para módulos con edición)

valores_nuevos (json — para Captura IA: `tipo`, `proveedor`, `confianza_promedio`, `tiempo_procesamiento_ms`)

resultado (string — el `estado` final de la captura)

ip (nullable)

user_agent (nullable)

created_at (sin `updated_at`: inmutable, sección 61 — el modelo bloquea `update()`/`delete()`)

---

### Relaciones

```
capturas_ia
   │
   ├──< capturas_ia_detalle
   │        │
   │        ├──> productos (0..1)
   │        └──> movimientos (0..1)
   │
   ├──< audit_logs (auditable)
   │
   └──> usuarios (usuario_id)
```

### Índices

INDEX(empresa_id)

INDEX(estado)

INDEX(tipo)

INDEX(captura_id) en `capturas_ia_detalle`

INDEX(producto_id) en `capturas_ia_detalle`

INDEX(empresa_id), INDEX(modulo, accion) en `audit_logs`

---

## API REST (extiende sección 34)

Prefijo: `/api/v1/captura-ia`. Todos los endpoints del módulo viven aquí — nunca se expone un endpoint por proveedor de IA (punto 7); el proveedor es un detalle interno resuelto vía `AIProviderInterface`.

**Autenticación:** el módulo Auth/JWT (sección 35, secciones 17-19) todavía no está construido en este backend — es un módulo aparte que no formaba parte de este alcance. Estos endpoints hoy **no** exigen JWT y reciben `empresa_id` como campo explícito del request; `usuario_id` se toma de `$request->user()?->id` (hoy siempre `null`). Cuando se construya el módulo Auth, `empresa_id`/`usuario_id` pasan a inferirse del contexto autenticado sin tocar Services, Actions ni Repositories — solo el Controller y los FormRequests cambian. **Esto debe resolverse antes de exponer el backend fuera de una red de confianza.**

```
POST   /api/v1/captura-ia/foto
POST   /api/v1/captura-ia/voz
POST   /api/v1/captura-ia/foto-voz
GET    /api/v1/captura-ia
GET    /api/v1/captura-ia/{uuid}
PATCH  /api/v1/captura-ia/{uuid}/detalle/{detalleId}
POST   /api/v1/captura-ia/{uuid}/confirmar
POST   /api/v1/captura-ia/{uuid}/descartar
```

El `{uuid}` en la URL es el identificador externo de la captura (punto 6); el id numérico interno nunca se expone. El binding de ruta lo resuelve automáticamente (`CapturaIA::getRouteKeyName() === 'uuid'`).

`POST .../foto` — multipart, campo `imagen` + `empresa_id`. Guarda la imagen ORIGINAL (punto 4) antes de procesar. Devuelve la captura propuesta (uno o varios productos, ver "Escenarios de fotografía soportados").

`POST .../voz` — multipart, campo `audio` + `empresa_id`. Guarda el audio ORIGINAL antes de procesar. Devuelve transcripción + movimiento propuesto.

`POST .../foto-voz` — multipart, campos `imagen`, `audio` y `empresa_id`. Guarda ambos archivos ORIGINALES. Devuelve la combinación fusionada.

`GET .../` — lista paginada de capturas de una `empresa_id` (query param requerido).

`GET .../{uuid}` — detalle de una captura y su resultado.

`PATCH .../{uuid}/detalle/{detalleId}` — corrección manual antes de confirmar (nombre, marca, categoría, presentación, unidad, cantidad). Solo válido si el detalle sigue `pendiente_revision` o `corregido`; si no, 409.

`POST .../{uuid}/confirmar` — aplica, vía `ProductService`/`InventoryService`, todo lo que seguía pendiente o corregido — sin volver a evaluar el umbral de confianza, porque un humano ya lo revisó.

`POST .../{uuid}/descartar` — descarta lo pendiente/corregido de la captura. Lo que ya se había aplicado automáticamente antes de descartar permanece (no hace rollback de movimientos).

### Formato de respuesta (sigue sección 41)

Envoltorio único (`success`/`message`/`data`), igual para todo Controller futuro (`App\Http\Support\ApiResponse`). Dentro de `data`, mismo vocabulario que el contrato de IA (`products`, `name`, `brand`, `presentation`, `category`, `quantity`, `unit`, `confidence`), más los metadatos del ciclo de vida de la captura. `id` es el `uuid`, nunca el id numérico.

```json
{
  "success": true,
  "message": "Captura procesada correctamente",
  "data": {
    "id": "e2ae97ff-17eb-4458-a7e7-68fd9638c114",
    "tipo": "foto",
    "estado": "aplicado",
    "movement": "entrada",
    "proveedor": "openai",
    "tiempo_procesamiento_ms": 842,
    "confianza_promedio": 0.98,
    "transcripcion": null,
    "products": [
      {
        "id": 45,
        "name": "Dog Chow Adultos",
        "brand": "Purina",
        "presentation": "20 kg",
        "category": "Alimento",
        "quantity": 5,
        "unit": "Bolsa",
        "confidence": 0.98,
        "es_producto_nuevo": false,
        "producto_id": 45,
        "movimiento_id": 981,
        "estado": "aplicado"
      }
    ],
    "created_at": "2026-07-28T02:31:02+00:00"
  }
}
```

Si algún elemento de `products` cae bajo el umbral, ese elemento devuelve `"estado": "pendiente_revision"` y `producto_id`/`movimiento_id` en `null`, sin bloquear los demás elementos de la misma captura; el `estado` de la captura completa queda en `parcial`.

Errores (`AIProviderException` → 502, `StockInsuficienteException`/`CapturaIAEstadoInvalidoException` → 409, validación → 422) siguen el formato de error de la sección 41, registrado centralmente en `bootstrap/app.php` — ningún Controller construye el JSON de error a mano.

---

## Auditoría de capturas (AuditLog)

Cada llamada a `CapturaIAService::procesar()` termina escribiendo exactamente un `AuditLog` (tabla genérica `audit_logs`, sección 61), vía `App\Services\Audit\AuditLogger`. Campos registrados: tipo de captura, proveedor, confianza promedio, tiempo de procesamiento, usuario, empresa, IP, user agent y resultado (estado final de la captura). `AuditLog` es inmutable: el modelo bloquea `update()` y `delete()` lanzando una excepción — igual que exige la sección 61 para toda la auditoría del sistema, no solo Captura IA.

Esta tabla no es exclusiva del módulo: `modulo`/`accion` son genéricos a propósito para que Compras, Ventas, Usuarios, etc. puedan escribir aquí sus propios eventos cuando se construyan, sin una tabla de auditoría por módulo.

---

## Procesamiento asíncrono (preparado, no activo)

Hoy el pipeline es síncrono: el Controller llama a `CapturaIAService::procesar()` directamente y la respuesta HTTP ya trae el resultado final. Para imágenes grandes o video (a futuro) esto no escala dentro de una sola request.

`App\Jobs\ProcesarCapturaIAJob implements ShouldQueue` ya existe y hace exactamente el mismo trabajo (`CapturaIAService::procesar()`) de forma queueable. Pasar a asíncrono real es:

1. Cambiar la llamada directa en el Controller por `ProcesarCapturaIAJob::dispatch($input, $ip, $userAgent)`.
2. Tener un worker corriendo (`php artisan queue:work`) y `QUEUE_CONNECTION` apuntando a un driver real (no `sync`).
3. El Controller responde de inmediato con la captura en estado `procesando` (`EstadoCaptura::Procesando`, ya modelado) en vez del resultado final.
4. El cliente hace poll a `GET .../{uuid}` hasta que el estado deje de ser `procesando`.

El contrato de la API no cambia: `GET .../{uuid}` ya devuelve `estado`, y `procesando` es solo un valor más de ese mismo campo. Ningún endpoint nuevo, ninguna ruta nueva, ningún campo nuevo en la respuesta.

---

## Idempotencia

Un reintento de red, de navegador o de app móvil no debe volver a tocar inventario. Protección: header `Idempotency-Key` (opcional) en `POST .../foto`, `.../voz` y `.../foto-voz`.

Flujo: el Controller busca primero una `capturas_ia` existente con la misma `(empresa_id, idempotency_key)` — si existe, la devuelve tal cual (`200`, no `201`), **sin volver a guardar archivos ni llamar a la IA**. `CapturaIAService::procesar()` repite el mismo chequeo antes de invocar al proveedor (defensa en profundidad si algo llama al Service sin pasar por el Controller). La columna `idempotency_key` en `capturas_ia` tiene un índice único `(empresa_id, idempotency_key)`; si dos requests con la misma clave llegan a la vez, la segunda falla ese índice, hace rollback completo de lo que alcanzó a escribir en su intento (ver "Transacciones"), y `CapturaIAService` recupera y devuelve la captura que sí ganó la carrera (`IdempotencyConflictException`, capturada internamente — nunca llega al cliente como error salvo en el caso extremo de que ni siquiera la recuperación encuentre el registro).

Sin `Idempotency-Key`, la request se procesa siempre sin protección (comportamiento anterior sin cambios) — es opt-in; un cliente mobile/web debe generar una clave por acción lógica del usuario (ej. un UUID por toque de "Guardar") y reenviar la misma en sus reintentos.

`confirmar()`/`descartar()` no necesitan esta protección: ya son idempotentes por diseño (el bucle solo toca detalles en estado `pendiente_revision`/`corregido`; repetir la llamada sobre una captura ya `aplicada`/`descartada` es un no-op).

---

## Transacciones de base de datos

Todo el pipeline de escritura de una captura corre dentro de una única transacción (`DB::transaction()` en `CapturaIAService::procesar()`): creación de producto, creación de movimiento, actualización de `stock_actual`, persistencia de `capturas_ia`/`capturas_ia_detalle`, y el `AuditLog`. Si cualquiera falla — incluida una `StockInsuficienteException` a mitad de una captura con varios productos — **todo** se revierte: ningún producto ni movimiento de esa captura queda a medias. La llamada al proveedor de IA (`estrategia->capturar($input)`) queda deliberadamente FUERA de la transacción: es una llamada de red y no debe retener locks de base de datos mientras dura.

`InventoryService::registrarMovimiento()` sigue abriendo su propia `DB::transaction()` (con `lockForUpdate()`); al ejecutarse dentro de la transacción exterior, Laravel la trata como un savepoint anidado — mismo comportamiento atómico, sin cambios en el Service.

`CapturaIAService::confirmar()` sigue la misma regla: aplicar los detalles pendientes de una captura (que crean producto/movimiento) corre en su propia transacción única.

---

## Eventos de dominio

Después de que la transacción completa hace commit, se disparan eventos — nunca antes, y nunca si hubo rollback:

- `App\Events\ProductCreated` — disparado por `ProductService::crear()`.
- `App\Events\StockUpdated` — disparado por `InventoryService::registrarMovimiento()`, con `stockAnterior`/`stockNuevo`.
- `App\Events\InventoryMovementRegistered` — disparado por `InventoryService::registrarMovimiento()`.
- `App\Events\AICaptureCompleted` — disparado por `CapturaIAService::procesar()` al terminar con éxito.

Mecanismo: cada Service llama a `DB::afterCommit(fn () => event(new Xxx(...)))` en vez de `event()` directo. Como `registrarMovimiento()`/`crear()` normalmente corren DENTRO de la transacción exterior de `procesar()`, Laravel difiere automáticamente esos `afterCommit()` hasta que la transacción MÁS externa hace commit — así que si la captura completa falla, ninguno de estos eventos se dispara, ni siquiera los de detecciones que sí se habían "aplicado" antes del fallo.

**Sin listeners todavía** (a propósito, sección 74 punto 6): solo la arquitectura de eventos queda lista. Casos de uso futuros obvios: alertas de stock mínimo/máximo (`StockUpdated`), notificaciones en tiempo real al frontend (`AICaptureCompleted`), sincronización con sistemas externos (`InventoryMovementRegistered`).

---

## Revisión final de arquitectura (pre-Fase 4)

Verificación puntual antes de iniciar el frontend, con hallazgos:

1. **Catálogo vs. Inventario** — confirmado por inspección: `stock_actual` se escribe en un único lugar de todo `app/` (`InventoryService.php`); `Producto` lo excluye de `$fillable`; `ProductService` nunca lo toca.
2. **Independencia de IA** — confirmado por inspección: ninguna clase concreta `App\Services\AI\OpenAI*` se referencia fuera de `AppServiceProvider` (el binding). Application/Domain solo ven `AIProviderInterface`, `StructuredExtractionDTO`, `AIExtractionResultDTO`.
3. **Pipeline de captura sin atajos** — confirmado releyendo `CapturaIAService::procesar()`: Strategy → `AIProviderInterface` → `StructuredExtractionDTO` → `CapturaIAService` → `ApplyInventoryMovementAction` (→ `ProductService` → `InventoryService`) → `CapturaIARepository` → `AuditLogger` → Resource. Ningún Controller ni Strategy llama a `ProductService`/`InventoryService` directamente.
4. **Idempotencia** — implementada (ver arriba). Probada con reintento HTTP real (`Idempotency-Key`) y con dos llamadas directas a `CapturaIAService::procesar()`.
5. **Transacciones** — implementada (ver arriba). Probada forzando un fallo a mitad de una captura de dos productos y verificando que el primero (ya "aplicado" con éxito) también se revierte.
6. **Eventos de dominio** — implementados (ver arriba), sin listeners. Probado que se disparan tras éxito y que NO se disparan tras un rollback.
7. **Multi-proveedor de IA a futuro** — confirmado: los tests ya vinculan `AIProviderInterface` a una implementación completamente distinta (`FakeAIProvider`, ni siquiera relacionada con OpenAI) sin tocar Strategies, Controllers ni Services. Agregar `ClaudeProvider`/`GeminiProvider`/`OllamaProvider`/`OpenRouterProvider` real es la misma operación.
8. **Versionado de API** — confirmado: `grep` de `"v1"` en `app/Services` no arroja resultados; el prefijo vive únicamente en `routes/api.php`. Introducir `/api/v2/captura-ia` es agregar rutas + Controllers/Resources nuevos que reutilizan los mismos Services, Actions y Repositories.

41 tests pasando (26 unitarios + 15 de integración/arquitectura). Backend considerado completo para este alcance — se procede a Fase 4 (Frontend) a solicitud del usuario.

---

## Frontend (extiende secciones 15 y 44)

```
src/modules/captura-ia/
  components/
    CaptureLauncher.tsx        (botón grande: Foto | Voz | Foto + Voz)
    CameraCapture.tsx
    AudioRecorder.tsx
    DetectionReviewList.tsx
    DetectionReviewCard.tsx
    ConfidenceBadge.tsx
    ConfirmationSheet.tsx
  pages/
    captura/page.tsx           (captura en vivo, mobile/tablet first)
    captura/historial/page.tsx (historial de capturas)
  hooks/
    useCameraCapture.ts
    useAudioRecorder.ts
    useCapturaIA.ts
  services/
    capturaIAService.ts        (Axios: foto, voz, foto-voz, confirmar, descartar)
  store/
    capturaIASlice.ts          (Redux Toolkit: captura en curso, cola de revisión)
  types/
    capturaIA.types.ts
  validators/
    capturaIA.schema.ts        (Zod: corrección manual antes de confirmar)
```

### Experiencia de usuario

Sin formularios largos: un botón grande de Foto, uno de Voz, uno de Foto + Voz.

Mientras la IA procesa: estado de carga tipo "Analizando inventario…".

Resultado: una tarjeta por cada elemento de `products[]` (uno o varios), con imagen recortada cuando aplica, nombre, cantidad editable y badge de confianza (verde ≥0.85 = ya aplicado, rojo <0.85 = pendiente de revisión).

Confirmar todo con un solo toque, o corregir un producto puntual antes de confirmar.

Optimizado para tablet y celular (cámara y micrófono nativos vía `MediaDevices` API).

---

## Extensibilidad futura (no implementar en esta fase)

La arquitectura debe quedar preparada para agregar, sin romper lo existente, estas fuentes de captura:

- Código de barras
- QR
- OCR de facturas
- PDF
- Video

Cómo queda preparado:

`tipo` es un enum de aplicación sobre `VARCHAR`, no un `ENUM` de MySQL — agregar un valor nuevo no requiere migración (ver "Modelo de Base de Datos").

`archivo_path` / `archivo_secundario_path` / `archivo_mime` son genéricos — sirven igual para una foto, un PDF o un video, sin columnas nuevas por tipo.

`CaptureStrategyResolver` + `Services/CapturaIA/Strategies/*` siguen Open/Closed: cada fuente nueva es una clase `XxxCaptureStrategy` que implementa la misma interfaz de estrategia y se registra en el resolver — `CapturaIAController` y `CapturaIAService` no cambian.

Los contratos futuros (`BarcodeDecoderInterface`, `QRDecoderInterface`, `OCRExtractorInterface`, `DocumentParserInterface`, `VideoFrameExtractorInterface`) quedan listados en `app/Contracts/AI/` como referencia de diseño; no se crean sus archivos ni implementaciones hasta que se apruebe esa fase.

Toda fuente futura, sin excepción, debe seguir produciendo el mismo contrato `{ "products": [...], "movement": "..." }` (empaquetado en `AIExtractionResultDTO`) y pasar por `ApplyInventoryMovementAction` → `ProductService`/`InventoryService`. Ninguna fuente nueva obtiene un atajo para escribir `productos` o `movimientos` directamente, ni para reimplementar matching o dirección de movimiento dentro de Captura IA.

Igual de importante: un proveedor de IA futuro (Claude, Gemini, Ollama, OpenRouter) solo necesita una clase que implemente `AIProviderInterface` y un cambio de binding en `AppServiceProvider` — cero cambios en Strategies, Controllers o Actions (punto 2).

---

## Fases de desarrollo del módulo

No avanzar a la siguiente fase sin cerrar la anterior (sección 8 del flujo general).

**Fase 1 — Diseño (esta sección).** Arquitectura, modelo de datos, contratos de API, wireframe funcional del frontend. Aprobada.

**Fase 2 — Backend núcleo. Completada.** Migraciones `capturas_ia` y `capturas_ia_detalle`, más el mínimo de `empresas`, `categorias`, `productos` y `movimientos` del que Captura IA depende (aún no existía ningún módulo previo en el repo). Enums `TipoCaptura`/`EstadoCaptura`/`EstadoCapturaDetalle`/`TipoMovimiento`. Contratos `VisionAnalyzerInterface`, `SpeechTranscriberInterface`, `StructuredExtractorInterface` con implementación OpenAI (Responses API + structured outputs, Speech to Text) y bindings en `AppServiceProvider`. `CaptureStrategyResolver` + `PhotoCaptureStrategy`/`VoiceCaptureStrategy`/`CombinedCaptureStrategy`. `ProductService` (catálogo, nunca stock) e `InventoryService` (única vía de escritura de `stock_actual`, con `lockForUpdate` y `StockInsuficienteException`). `ProductMatcherAction`, `MergeDuplicateDetectionsAction`, `ApplyInventoryMovementAction` con el umbral de confianza en `config/captura_ia.php`. `CapturaIARepository` + `CapturaIAService` orquestador. 25 tests unitarios pasando (dedup/suma, matching por empresa, stock, umbral binario, foto con productos iguales/diferentes/mixtos, voz, foto+voz). Sin Controllers/rutas todavía — eso es Fase 3.

**Fase 3 — Backend API. Completada.** Antes de construirla se incorporaron 8 ajustes arquitectónicos: (1) Captura IA sin reglas de negocio — matching movido a `ProductService::buscarCoincidencia()`, dirección de movimiento movida a `InventoryService::registrarMovimiento()`; (2) `AIProviderInterface` único, `OpenAIProvider` como implementación, Strategies ya no conocen OpenAI directamente; (3) `StructuredExtractionDTO`/`AIExtractionResultDTO` reutilizables por cualquier proveedor, esquema JSON fuera de las Strategies; (4) `CapturaArchivoStorage` guarda el archivo original (imagen/audio) antes de procesar; (5) `AuditLogger` escribe un `AuditLog` inmutable por captura; (6) `uuid` en `capturas_ia`, usado como route key; (7) todos los endpoints bajo `/api/v1/captura-ia`; (8) `ProcesarCapturaIAJob` queueable, listo para async sin cambiar el contrato. Luego: `CapturaIAController` (foto/voz/foto-voz/index/show/confirmar/descartar/actualizarDetalle), FormRequests, `CapturaIAResource`/`CapturaIADetalleResource`, `ApiResponse` (envoltorio único), rutas registradas en `routes/api.php`, manejo centralizado de excepciones en `bootstrap/app.php`. Sin Policies (el módulo Usuarios/Roles no existe todavía) y **sin JWT** (módulo Auth no construido — ver nota de seguridad en "API REST"). 35 tests pasando (23 unitarios + 12 de integración HTTP).

**Fase 4 — Frontend captura.** `CameraCapture`, `AudioRecorder`, `CaptureLauncher`, estados de carga.

**Fase 5 — Frontend revisión y confirmación.** `DetectionReviewList/Card`, corrección manual, confirmar/descartar conectado a la API.

**Fase 6 — QA integración.** Casos: foto con un producto; foto con varios productos iguales (suma); foto con varios productos diferentes; foto de estantería/pallet/bodega; foto → producto nuevo; foto → producto existente (suma stock vía InventoryService); voz → movimiento; foto + voz combinada; confianza ≥0.85 → aplicado automático; confianza <0.85 → cola de revisión; producto duplicado en una misma imagen.

**Fase 7 — Documentar.** Actualizar `docs/05_DATABASE.md`, `docs/06_API.md`, `docs/07_FRONTEND.md`, `docs/08_ROADMAP.md`.

**Fase 8 — Deploy.** Variables `.env` para credenciales del proveedor de IA, límites de tamaño de archivo (imagen/audio), almacenamiento de evidencias (Storage Local, sección de Stack).

---

Estado de este módulo: **Backend completo y revisado (Fases 1-3 + revisión final de arquitectura: idempotencia, transacciones, eventos de dominio). Iniciando Fase 4 (Frontend) a solicitud explícita del usuario.** Pendiente conocido antes de producción: módulo Auth/JWT (sección 35) no existe todavía, estos endpoints no deben exponerse fuera de una red de confianza.



### Regla de Negocio — Movimientos de Inventario

Los movimientos de inventario representan el libro contable (ledger) del inventario.

Por razones de auditoría, trazabilidad y consistencia:

- Un movimiento nunca podrá editarse.
- Un movimiento nunca podrá eliminarse.
- Un movimiento nunca podrá desactivarse.
- Un movimiento nunca podrá restaurarse.

Si existe un error, el sistema deberá generar un nuevo movimiento compensatorio (Ajuste o Corrección), preservando el historial completo.

Esta regla es obligatoria para todos los módulos presentes y futuros del sistema.


### Regla de Negocio — Autorización (RBAC)

Aprobado 2026-08-02 como arquitectura oficial del sistema (Fase 4.5 — Authorization Alignment, ver `docs/security/ROLES_MATRIX.md` para el detalle completo).

- Todo módulo de negocio de Fidel OS debe validar autorización en dos capas combinadas con AND, nunca una sola: pertenencia a la empresa del usuario, y el permiso específico que la acción requiere.
- Los permisos se otorgan exclusivamente a través de roles. No existen asignaciones de permiso directas a un usuario individual, y no se introducirán sin una revisión de arquitectura explícita.
- Ningún Policy, Controller ni middleware verifica el nombre de un rol (`hasRole('Admin')`). Los roles son un empaquetado administrativo de permisos para la UI de gestión de cada empresa — el motor de autorización real solo conoce permisos.
- Un rol nunca se elimina físicamente. Solo se activa o desactiva. Un rol con usuarios asignados no puede desactivarse hasta que esos usuarios sean reasignados a otro rol.
- Esta regla se aplicó en Fase 4.5 a Categorías, Marcas, Unidades de Medida, Stock, Proveedores y Producto↔Proveedor. Productos, Movimientos y Captura IA quedan pendientes de la misma alineación, como decisión explícita separada — no un olvido.

Esta regla es obligatoria para todos los módulos presentes y futuros del sistema.
