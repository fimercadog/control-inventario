export interface Cliente {
  id: number;
  nombre: string;
  nit: string | null;
  contacto: string | null;
  telefono: string | null;
  email: string | null;
  direccion: string | null;
  ciudad: string | null;
  pais: string | null;
  notas: string | null;
  estado: string;
  created_at: string;
  updated_at: string;
}

export interface ClientesQueryParams {
  busqueda?: string;
  estado?: "activo" | "todos";
  per_page?: 10 | 25 | 50 | 100;
  page?: number;
}

/** Matches StoreClienteRequest — nit/email are Identity (ADR-015), unique per company,
 * settable only at creation. */
export interface CreateClientePayload {
  nombre: string;
  nit?: string | null;
  contacto?: string | null;
  telefono?: string | null;
  email?: string | null;
  direccion?: string | null;
  ciudad?: string | null;
  pais?: string | null;
  notas?: string | null;
}

/** Matches UpdateClienteRequest — nit/email/estado deliberately excluded (identity/controlled
 * fields). An explicit `null` really blanks the field (ClienteDTO does not collapse
 * "omitted" and "sent as null" into the same case) — confirmed against ClienteDTO's own
 * docblock and matches manual.html's claim ("un campo vaciado se guarda como vacío de
 * verdad"), not assumed. */
export interface UpdateClientePayload {
  nombre?: string;
  contacto?: string | null;
  telefono?: string | null;
  direccion?: string | null;
  ciudad?: string | null;
  pais?: string | null;
  notas?: string | null;
}
