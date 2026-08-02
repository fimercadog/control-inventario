import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import * as auditoriaApi from "@/lib/api/auditoria";
import { ApiError } from "@/lib/api/client";
import type { AuditLog, AuditLogFiltros, PaginatedAuditLogs } from "@/lib/api/types";

/**
 * Auditoría (2026-08-02). Primer módulo de datos de negocio 100% de solo
 * lectura en este proyecto — un único thunk de fetch, sin ningún thunk de
 * mutación (no existen: crear/editar/eliminar no son acciones de este
 * módulo).
 */
interface AuditoriaState {
  items: AuditLog[];
  meta: PaginatedAuditLogs["meta"] | null;
  loading: boolean;
  error: string | null;
}

const initialState: AuditoriaState = {
  items: [],
  meta: null,
  loading: false,
  error: null,
};

function mensajeError(error: unknown, fallback: string): string {
  return error instanceof ApiError ? error.message : fallback;
}

export const fetchAuditLogs = createAsyncThunk(
  "auditoria/fetch",
  async (params: AuditLogFiltros | undefined, { rejectWithValue }) => {
    try {
      return await auditoriaApi.listAuditLogs(params);
    } catch (error) {
      return rejectWithValue(mensajeError(error, "No pudimos cargar la auditoría."));
    }
  }
);

const auditoriaSlice = createSlice({
  name: "auditoria",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchAuditLogs.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAuditLogs.fulfilled, (state, action) => {
        state.items = action.payload.items;
        state.meta = action.payload.meta;
        state.loading = false;
      })
      .addCase(fetchAuditLogs.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) ?? "No pudimos cargar la auditoría.";
      });
  },
});

export default auditoriaSlice.reducer;
