import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

const numberFormatter = new Intl.NumberFormat("es-CO");
const currencyFormatter = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0,
});

export function formatNumber(value: number): string {
  return numberFormatter.format(value);
}

export function formatCurrency(value: number): string {
  return currencyFormatter.format(value);
}

export function formatRelativeTime(iso: string): string {
  return formatDistanceToNow(new Date(iso), { addSuffix: true, locale: es });
}

export function formatConfidence(value: number): string {
  return `${Math.round(value * 100)}%`;
}
