import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import * as reportesApi from "@/lib/api/reportes";
import { ApiError } from "@/lib/api/client";
import type { ReporteFiltros, ReporteResumen } from "@/lib/api/types";

/** Reportes (2026-08-02). Solo lectura — un único thunk de fetch, sin mutaciones. */
interface ReportesState {
  resumen: ReporteResumen | null;
  loading: boolean;
  error: string | null;
}

const initialState: ReportesState = {
  resumen: null,
  loading: false,
  error: null,
};

function mensajeError(error: unknown, fallback: string): string {
  return error instanceof ApiError ? error.message : fallback;
}

export const fetchReporteResumen = createAsyncThunk(
  "reportes/fetch",
  async (params: ReporteFiltros | undefined, { rejectWithValue }) => {
    try {
      return await reportesApi.getReporteResumen(params);
    } catch (error) {
      return rejectWithValue(mensajeError(error, "No pudimos cargar los reportes."));
    }
  }
);

const reportesSlice = createSlice({
  name: "reportes",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchReporteResumen.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchReporteResumen.fulfilled, (state, action) => {
        state.resumen = action.payload;
        state.loading = false;
      })
      .addCase(fetchReporteResumen.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) ?? "No pudimos cargar los reportes.";
      });
  },
});

export default reportesSlice.reducer;
