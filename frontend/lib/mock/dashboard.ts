import { MOCK_MOVEMENTS, MOCK_PRODUCTS } from "@/lib/mock/data";

function isToday(iso: string): boolean {
  const date = new Date(iso);
  const now = new Date();
  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  );
}

export function getDashboardStats() {
  const totalProducts = MOCK_PRODUCTS.length;
  const totalStock = MOCK_PRODUCTS.reduce((sum, p) => sum + p.stock_actual, 0);
  const lowStock = MOCK_PRODUCTS.filter((p) => p.stock_actual <= p.stock_minimo).length;
  const todayEntries = MOCK_MOVEMENTS.filter((m) => m.tipo === "entrada" && isToday(m.fecha)).length;
  const todayExits = MOCK_MOVEMENTS.filter((m) => m.tipo === "salida" && isToday(m.fecha)).length;

  return { totalProducts, totalStock, lowStock, todayEntries, todayExits };
}

export function getRecentMovements(limit = 6) {
  return [...MOCK_MOVEMENTS]
    .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
    .slice(0, limit);
}

export function getLowStockProducts() {
  return MOCK_PRODUCTS.filter((p) => p.stock_actual <= p.stock_minimo);
}
