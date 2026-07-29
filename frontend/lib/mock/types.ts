/**
 * Datos de demostracion. Screens 2 (Dashboard), 8 (Productos) y 9
 * (Movimientos) todavia no tienen endpoint REST en el backend (solo
 * existen como dependencias internas de Captura IA, sin Controllers ni
 * rutas) — decision registrada explicitamente para la Fase 4. Los
 * screens de captura (3-7) sí usan la API real.
 */
export interface MockProduct {
  id: number;
  nombre: string;
  marca: string;
  categoria: string;
  presentacion: string;
  unidad_medida: string;
  stock_actual: number;
  stock_minimo: number;
  precio: number;
  estado: "activo" | "inactivo";
  imagenColor: string;
}

export type { MovementType } from "@/lib/types";
import type { MovementType } from "@/lib/types";

export interface MockMovement {
  id: number;
  producto: string;
  productoImagenColor: string;
  tipo: MovementType;
  cantidad: number;
  fecha: string; // ISO
  usuario: string;
  origen: "Captura IA" | "Manual";
  observacion?: string;
}
