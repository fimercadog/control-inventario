/** Matches ProductoProveedorResource — the "Proveedores" tab of the Ficha de Producto.
 * Own permission namespace `producto-proveedor.*`, distinct from `proveedores.*` (this is the
 * association, not the supplier itself). */
export interface ProductoProveedorAsociacion {
  id: number;
  producto_id: number;
  proveedor_id: number;
  proveedor_nombre: string | null;
  producto_nombre: string | null;
  es_principal: boolean;
  precio_compra: number | null;
  codigo_proveedor: string | null;
  estado: string;
  created_at: string;
}

/** Matches StoreProductoProveedorRequest. */
export interface CreateAsociacionPayload {
  proveedor_id: number;
  es_principal?: boolean;
  precio_compra?: number | null;
  codigo_proveedor?: string | null;
}

/** Matches UpdateProductoProveedorRequest — proveedor_id is not editable once created (only
 * reachable by disabling and creating a new association). */
export interface UpdateAsociacionPayload {
  es_principal?: boolean;
  precio_compra?: number | null;
  codigo_proveedor?: string | null;
}
