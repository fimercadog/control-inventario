# Personas de Usuario

Documento nuevo — no existía en ninguna forma. El master spec (§7-9) nombraba roles (Administrador, Supervisor, Compras, Ventas, Bodega, Consulta) pero nunca los convirtió en personas reales. Estas personas se construyen a partir de lo que **realmente existe** en el sistema: el catálogo de permisos de `backend/database/seeders/PermissionSeeder.php` y las decisiones de arquitectura de `04_TECHNICAL_SPEC/Architecture.md` (Platform Super Admin, Teams por empresa).

Nota de alcance: como el Módulo 5 (Role Management) todavía no está construido, hoy no existen "roles" instanciados en el sistema — solo el catálogo fijo de permisos. Estas personas describen **para qué conjunto de permisos** cada tipo de usuario necesitaría, no un rol ya configurado.

---

## Persona 1 — Operario de Bodega ("Camila")

**Quién es**: encargada de recibir mercancía y hacer conteos en la bodega de una PyME cliente. No es técnica, usa el celular más que el computador.

**Objetivo principal**: registrar entradas y salidas de inventario lo más rápido posible, sin tener que llenar formularios largos.

**Permisos relevantes (catálogo real)**: `captura-ia.usar`, `movimientos.ver`.

**Cómo usa el sistema hoy**: toma una foto del producto o graba una nota de voz ("recibí 20 cajas de tornillos"), y Captura IA extrae y propone el movimiento de inventario. Camila revisa lo que la IA entendió antes de que quede confirmado (aunque la confirmación final típicamente la hace un Supervisor — ver permiso `captura-ia.confirmar`).

**Frustración principal que el producto resuelve**: antes de Captura IA, cada movimiento significaba abrir una hoja de cálculo o un formulario en el computador de la oficina — algo que en la práctica no se hacía consistentemente, rompiendo la trazabilidad (ver `01_PRD/ProblemStatement.md`).

**Qué NO puede hacer**: no gestiona usuarios, roles, ni ve auditoría. No tiene permiso `captura-ia.confirmar` ni `captura-ia.revisar` en este ejemplo — su alcance es capturar, no dar por buena la captura.

---

## Persona 2 — Supervisor de Inventario ("Julián")

**Quién es**: responsable de validar que los movimientos de inventario capturados (por Camila u otros) sean correctos antes de que impacten el stock oficial. También gestiona el catálogo de productos y categorías.

**Objetivo principal**: mantener el inventario confiable — revisar lo que la IA extrajo, corregir errores de interpretación, y confirmar movimientos.

**Permisos relevantes (catálogo real)**: `captura-ia.revisar`, `captura-ia.confirmar`, `productos.ver`, `productos.crear`, `productos.editar`, `productos.eliminar`, `movimientos.ver`, `movimientos.crear`.

**Cómo usa el sistema hoy**: entra a la pantalla de revisión de Captura IA, ve las capturas pendientes, corrige el detalle si la IA extrajo mal un dato (ej. cantidad o nombre de producto), y confirma — momento en el que el movimiento se aplica de verdad al stock.

**Frustración principal que el producto resuelve**: sin este flujo de revisión, confiar ciegamente en la extracción de IA sería arriesgado. El diseño de permisos separados (`usar` vs. `revisar`/`confirmar`) existe específicamente para que haya una verificación humana antes de que un movimiento generado por IA sea definitivo.

**Qué NO puede hacer todavía**: no gestiona usuarios ni roles (eso requiere `usuarios.*`/`roles.*`, típicamente reservado a un Administrador).

---

## Persona 3 — Administrador de Empresa ("Marcela")

**Quién es**: dueña o gerente general de la PyME cliente. Es quien configuró la cuenta de la empresa y a quien Fidel OS trata como punto de contacto principal.

**Objetivo principal**: tener control total sobre quién tiene acceso al sistema de su empresa y qué puede hacer cada quien, además de poder auditar qué pasó cuando algo no cuadra.

**Permisos relevantes (catálogo real)**: `usuarios.ver`, `usuarios.editar`, `usuarios.invitar`, `roles.ver`, `roles.gestionar`, `auditoria.ver`, más — típicamente — todos los permisos operativos (`productos.*`, `movimientos.*`, `captura-ia.*`) ya que en la práctica un Administrador de PyME chica suele ser también quien opera el sistema.

**Cómo usa el sistema hoy**: hoy puede autenticarse y su empresa queda completamente aislada de otras (Módulo 2). La invitación de nuevos usuarios (Módulo 6) y la gestión de roles (Módulo 5) todavía no están construidas — hoy, dar de alta un segundo usuario en su empresa requiere intervención manual fuera del producto.

**Frustración esperada (gap conocido)**: hasta que los Módulos 3-6 estén completos, Marcela no puede autoservirse para invitar a Camila o Julián, ni definir qué puede hacer cada uno — depende de que Fidel OS lo haga por ella. Este es un gap de producto activo, no un supuesto.

---

## Persona 4 — Administrador de Plataforma / Soporte Fidel OS ("equipo interno")

**Quién es**: no es un cliente — es el equipo interno de Fidel OS que opera la plataforma para todos los clientes (soporte, resolución de incidentes, alta de empresas nuevas).

**Objetivo principal**: poder ver y diagnosticar problemas a través de las empresas cuando un cliente reporta un incidente, sin tener acceso "de fábrica" a los datos operativos de cada empresa (ver la regla de "nunca `Gate::before()` que apruebe todo" en `04_TECHNICAL_SPEC/Architecture.md`).

**Permisos relevantes (catálogo real)**: namespace `plataforma.*` — `plataforma.empresas.ver`, `plataforma.usuarios.ver`. Exclusivo de usuarios con `is_platform_admin = true`; nunca asignable a un rol de empresa.

**Cómo usa el sistema hoy**: es un actor real en el modelo de datos (`empresa_id = null`, `is_platform_admin = true`) y en la arquitectura de aislamiento (`TenantScope` se desactiva solo para este usuario, pero sigue pasando por chequeo de permisos como cualquier otro). Las pantallas de plataforma (`GET /plataforma/empresas`, etc.) existen a nivel de API design mínimo pero no tienen todavía una superficie de UI dedicada construida.

---

## Roles del master spec original no reflejados arriba

Los roles "Compras" y "Ventas" del master spec (§7, §9) no tienen contraparte en el catálogo de permisos real porque esos módulos no están construidos (ver `01_PRD/OutOfScope.md`). Cuando se construyan, deberán generar sus propios permisos (`compras.*`, `ventas.*`) y, potencialmente, sus propias personas — no se inventan aquí para evitar describir un sistema que no existe.
