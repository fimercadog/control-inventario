# Pendientes — requieren backend (fuera de alcance de este proyecto)

Estos puntos no se pueden resolver solo con frontend. Quedan documentados para una Work Order de backend futura y explícita — no se actúa sobre ellos aquí.

1. **Marca-Proveedor sin API** (INC-002). Requeriría: `MarcaProveedorController`, rutas `v1/marca-proveedor` o anidadas bajo `v1/marcas/{marca}/proveedores`, Resource, FormRequest, Policy. La capa de modelo (Eloquent) ya existe.

2. **Exportación CSV/PDF para Marcas, Unidades de Medida, Clientes y Stock** (INC-003). Requeriría replicar el patrón ya usado en Usuarios/Roles/Categorías/Proveedores: método `exportarCsv`/`exportarPdf` en cada Controller reutilizando `ReporteExportService`, más las rutas `export/csv`/`export/pdf` (declaradas antes del wildcard `{id}` correspondiente).

3. **Edición real de Empresa/Configuración** (INC-005). Si en el futuro se requiere que "Nombre de empresa" o "Zona horaria" sean editables desde Configuración (hoy son solo informativos, confirmado por el manual), requeriría un `EmpresaController`/endpoint dedicado — hoy no existe.
