"use client";

import type { CreateProductoPayload, UpdateProductoPayload } from "@/types/producto";

const KEY = "fidelos-contingencia";
const CHANGE = "fidelos-contingencia-change";

export interface OperacionContingencia {
  id: string;
  tipo: "crear" | "actualizar";
  productoId?: number;
  productoNombre: string;
  baseVersion?: string;
  payload: CreateProductoPayload | UpdateProductoPayload;
  creadaEn: string;
  estado: "pendiente" | "conflicto" | "error";
  conflicto?: unknown;
  error?: string;
}

export interface EstadoContingencia {
  activo: boolean;
  operaciones: OperacionContingencia[];
}

const EMPTY: EstadoContingencia = { activo: false, operaciones: [] };
let cachedStoredValue: string | null | undefined;
let cachedState: EstadoContingencia = EMPTY;

function read(): EstadoContingencia {
  if (typeof window === "undefined") return EMPTY;

  const storedValue = window.localStorage.getItem(KEY);
  if (storedValue === cachedStoredValue) return cachedState;

  cachedStoredValue = storedValue;
  try {
    const parsed = JSON.parse(storedValue ?? "null") as EstadoContingencia | null;
    cachedState = parsed && Array.isArray(parsed.operaciones) ? parsed : EMPTY;
  } catch {
    cachedState = EMPTY;
  }

  return cachedState;
}

function write(state: EstadoContingencia) {
  window.localStorage.setItem(KEY, JSON.stringify(state));
  window.dispatchEvent(new Event(CHANGE));
}

export function getEstadoContingencia() {
  return read();
}

export function subscribeContingencia(listener: () => void) {
  window.addEventListener(CHANGE, listener);
  window.addEventListener("storage", listener);
  return () => {
    window.removeEventListener(CHANGE, listener);
    window.removeEventListener("storage", listener);
  };
}

export function activarContingencia() {
  write({ ...read(), activo: true });
}

export function salirContingencia() {
  write({ ...read(), activo: false });
}

export function agregarOperacion(operacion: Omit<OperacionContingencia, "id" | "creadaEn" | "estado">) {
  const state = read();
  const id = crypto.randomUUID();
  write({
    ...state,
    operaciones: [...state.operaciones, { ...operacion, id, creadaEn: new Date().toISOString(), estado: "pendiente" }],
  });
}

export function actualizarOperacion(id: string, changes: Partial<OperacionContingencia>) {
  const state = read();
  write({ ...state, operaciones: state.operaciones.map((op) => (op.id === id ? { ...op, ...changes } : op)) });
}

export function eliminarOperacion(id: string) {
  const state = read();
  write({ ...state, operaciones: state.operaciones.filter((op) => op.id !== id) });
}
