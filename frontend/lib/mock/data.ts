import type { MockMovement, MockProduct } from "@/lib/mock/types";

function hoursAgo(hours: number): string {
  const d = new Date();
  d.setHours(d.getHours() - hours);
  return d.toISOString();
}

export const MOCK_PRODUCTS: MockProduct[] = [
  { id: 1, nombre: "Dog Chow Adultos", marca: "Purina", categoria: "Alimento", presentacion: "20 kg", unidad_medida: "Bolsa", stock_actual: 42, stock_minimo: 15, precio: 185000, estado: "activo", imagenColor: "oklch(0.72 0.15 60)" },
  { id: 2, nombre: "Royal Canin Mini", marca: "Royal Canin", categoria: "Alimento", presentacion: "3 kg", unidad_medida: "Bolsa", stock_actual: 8, stock_minimo: 10, precio: 92000, estado: "activo", imagenColor: "oklch(0.68 0.17 40)" },
  { id: 3, nombre: "NexGard", marca: "Boehringer", categoria: "Medicamento", presentacion: "Caja x3", unidad_medida: "Caja", stock_actual: 27, stock_minimo: 5, precio: 65000, estado: "activo", imagenColor: "oklch(0.62 0.2 25)" },
  { id: 4, nombre: "Amoxicilina 500mg", marca: "Genfar", categoria: "Medicamento", presentacion: "500 mg", unidad_medida: "Caja", stock_actual: 3, stock_minimo: 8, precio: 18500, estado: "activo", imagenColor: "oklch(0.65 0.18 300)" },
  { id: 5, nombre: "Coca Cola", marca: "Coca-Cola", categoria: "Bebida", presentacion: "350 ml", unidad_medida: "Lata", stock_actual: 156, stock_minimo: 50, precio: 2800, estado: "activo", imagenColor: "oklch(0.55 0.22 25)" },
  { id: 6, nombre: "Pepsi", marca: "PepsiCo", categoria: "Bebida", presentacion: "350 ml", unidad_medida: "Lata", stock_actual: 98, stock_minimo: 40, precio: 2700, estado: "activo", imagenColor: "oklch(0.5 0.2 260)" },
  { id: 7, nombre: "Agua Cristal", marca: "Postobón", categoria: "Bebida", presentacion: "600 ml", unidad_medida: "Botella", stock_actual: 210, stock_minimo: 60, precio: 2200, estado: "activo", imagenColor: "oklch(0.75 0.08 220)" },
  { id: 8, nombre: "Detergente en Polvo", marca: "Fab", categoria: "Limpieza", presentacion: "3 kg", unidad_medida: "Bolsa", stock_actual: 19, stock_minimo: 10, precio: 24500, estado: "activo", imagenColor: "oklch(0.7 0.14 200)" },
  { id: 9, nombre: "Jabón Líquido", marca: "Fabuloso", categoria: "Limpieza", presentacion: "1 L", unidad_medida: "Botella", stock_actual: 6, stock_minimo: 12, precio: 8900, estado: "activo", imagenColor: "oklch(0.68 0.18 145)" },
  { id: 10, nombre: "Cloro", marca: "Clorox", categoria: "Limpieza", presentacion: "1 L", unidad_medida: "Botella", stock_actual: 34, stock_minimo: 15, precio: 6500, estado: "activo", imagenColor: "oklch(0.85 0.02 200)" },
  { id: 11, nombre: "Sprite", marca: "Coca-Cola", categoria: "Bebida", presentacion: "350 ml", unidad_medida: "Lata", stock_actual: 71, stock_minimo: 40, precio: 2800, estado: "activo", imagenColor: "oklch(0.75 0.18 140)" },
  { id: 12, nombre: "Whiskas Adulto", marca: "Mars", categoria: "Alimento", presentacion: "1.5 kg", unidad_medida: "Bolsa", stock_actual: 22, stock_minimo: 10, precio: 34500, estado: "activo", imagenColor: "oklch(0.65 0.15 90)" },
  { id: 13, nombre: "Vitaminas Complejo B", marca: "Farmacol", categoria: "Medicamento", presentacion: "Frasco x30", unidad_medida: "Frasco", stock_actual: 14, stock_minimo: 6, precio: 22000, estado: "activo", imagenColor: "oklch(0.7 0.16 320)" },
  { id: 14, nombre: "Jabón en Barra", marca: "Rey", categoria: "Limpieza", presentacion: "300 g", unidad_medida: "Unidad", stock_actual: 88, stock_minimo: 20, precio: 3200, estado: "activo", imagenColor: "oklch(0.9 0.05 100)" },
  { id: 15, nombre: "Té Frío Lipton", marca: "Lipton", categoria: "Bebida", presentacion: "400 ml", unidad_medida: "Botella", stock_actual: 44, stock_minimo: 30, precio: 3400, estado: "activo", imagenColor: "oklch(0.72 0.16 85)" },
  { id: 16, nombre: "Guantes de Nitrilo", marca: "SafeHands", categoria: "Insumos", presentacion: "Caja x100", unidad_medida: "Caja", stock_actual: 5, stock_minimo: 10, precio: 32000, estado: "activo", imagenColor: "oklch(0.6 0.2 274)" },
];

export const MOCK_MOVEMENTS: MockMovement[] = [
  { id: 1, producto: "Dog Chow Adultos", productoImagenColor: "oklch(0.72 0.15 60)", tipo: "entrada", cantidad: 15, fecha: hoursAgo(1), usuario: "Fidel Mercado", origen: "Captura IA" },
  { id: 2, producto: "Coca Cola", productoImagenColor: "oklch(0.55 0.22 25)", tipo: "entrada", cantidad: 48, fecha: hoursAgo(2), usuario: "Fidel Mercado", origen: "Manual", observacion: "Compra a proveedor" },
  { id: 3, producto: "NexGard", productoImagenColor: "oklch(0.62 0.2 25)", tipo: "salida", cantidad: 6, fecha: hoursAgo(3), usuario: "Ana Torres", origen: "Manual", observacion: "Venta" },
  { id: 4, producto: "Amoxicilina 500mg", productoImagenColor: "oklch(0.65 0.18 300)", tipo: "entrada", cantidad: 4, fecha: hoursAgo(5), usuario: "Fidel Mercado", origen: "Manual" },
  { id: 5, producto: "Sprite", productoImagenColor: "oklch(0.75 0.18 140)", tipo: "salida", cantidad: 12, fecha: hoursAgo(6), usuario: "Ana Torres", origen: "Manual" },
  { id: 6, producto: "Royal Canin Mini", productoImagenColor: "oklch(0.68 0.17 40)", tipo: "entrada", cantidad: 10, fecha: hoursAgo(9), usuario: "Fidel Mercado", origen: "Captura IA" },
  { id: 7, producto: "Jabón Líquido", productoImagenColor: "oklch(0.68 0.18 145)", tipo: "salida", cantidad: 3, fecha: hoursAgo(11), usuario: "Ana Torres", origen: "Manual" },
  { id: 8, producto: "Pepsi", productoImagenColor: "oklch(0.5 0.2 260)", tipo: "entrada", cantidad: 30, fecha: hoursAgo(14), usuario: "Fidel Mercado", origen: "Manual" },
  { id: 9, producto: "Guantes de Nitrilo", productoImagenColor: "oklch(0.6 0.2 274)", tipo: "salida", cantidad: 2, fecha: hoursAgo(20), usuario: "Ana Torres", origen: "Manual" },
  { id: 10, producto: "Agua Cristal", productoImagenColor: "oklch(0.75 0.08 220)", tipo: "entrada", cantidad: 60, fecha: hoursAgo(26), usuario: "Fidel Mercado", origen: "Manual" },
  { id: 11, producto: "Whiskas Adulto", productoImagenColor: "oklch(0.65 0.15 90)", tipo: "salida", cantidad: 5, fecha: hoursAgo(32), usuario: "Ana Torres", origen: "Manual" },
  { id: 12, producto: "Cloro", productoImagenColor: "oklch(0.85 0.02 200)", tipo: "entrada", cantidad: 20, fecha: hoursAgo(40), usuario: "Fidel Mercado", origen: "Manual" },
  { id: 13, producto: "Vitaminas Complejo B", productoImagenColor: "oklch(0.7 0.16 320)", tipo: "ajuste", cantidad: 2, fecha: hoursAgo(48), usuario: "Ana Torres", origen: "Manual", observacion: "Conteo físico" },
  { id: 14, producto: "Detergente en Polvo", productoImagenColor: "oklch(0.7 0.14 200)", tipo: "entrada", cantidad: 12, fecha: hoursAgo(52), usuario: "Fidel Mercado", origen: "Captura IA" },
  { id: 15, producto: "Té Frío Lipton", productoImagenColor: "oklch(0.72 0.16 85)", tipo: "salida", cantidad: 9, fecha: hoursAgo(60), usuario: "Ana Torres", origen: "Manual" },
];
