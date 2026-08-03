import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import * as reportesApi from "@/lib/api/reportes";
import { ApiError } from "@/lib/api/client";
import type {
  PaginatedReporteHistorial,
  ReporteCatalogoItem,
  ReporteFiltros,
  ReporteHistorialFiltros,
  ReporteResultado,
  ReporteResumen,
} from "@/lib/api/types";

/**
 * Reportes (2026-08-02, ampliado 2026-08-03 a centro de reportes
 * completo). `resumen` sigue siendo el dashboard original, sin cambios.
 * Lo nuevo es `catalogo` (los 13 reportes disponibles), `resultado` (el
 * preview del reporte actualmente abierto) e `historial` (ejecuciones
 * pasadas) — todos de solo lectura, igual que el resto del módulo.
 */
interface ReportesState {
  resumen: ReporteResumen | null;
  loading: boolean;
  error: string | null;

  catalogo: ReporteCatalogoItem[];
  catalogoLoading: boolean;

  resultado: ReporteResultado | null;
  resultadoLoading: boolean;
  resultadoError: string | null;

  historial: PaginatedReporteHistorial | null;
  historialLoading: boolean;
}

const initialState: ReportesState = {
  resumen: null,
  loading: false,
  error: null,

  catalogo: [],
  catalogoLoading: false,

  resultado: null,
  resultadoLoading: false,
  resultadoError: null,

  historial: null,
  historialLoading: false,
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

export const fetchCatalogoReportes = createAsyncThunk(
  "reportes/fetchCatalogo",
  async (_: void, { rejectWithValue }) => {
    try {
      return await reportesApi.getCatalogoReportes();
    } catch (error) {
      return rejectWithValue(mensajeError(error, "No pudimos cargar el catálogo de reportes."));
    }
  }
);

export const fetchPreviewReporte = createAsyncThunk(
  "reportes/fetchPreview",
  async (
    { clave, filtros }: { clave: string; filtros: Record<string, string | number | undefined> },
    { rejectWithValue }
  ) => {
    try {
      return await reportesApi.previewReporte(clave, filtros);
    } catch (error) {
      return rejectWithValue(mensajeError(error, "No pudimos generar el reporte."));
    }
  }
);

export const fetchHistorialReportes = createAsyncThunk(
  "reportes/fetchHistorial",
  async (params: ReporteHistorialFiltros | undefined, { rejectWithValue }) => {
    try {
      return await reportesApi.getHistorialReportes(params);
    } catch (error) {
      return rejectWithValue(mensajeError(error, "No pudimos cargar el historial de reportes."));
    }
  }
);

const reportesSlice = createSlice({
  name: "reportes",
  initialState,
  reducers: {
    limpiarResultadoReporte(state) {
      state.resultado = null;
      state.resultadoError = null;
    },
  },
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
      })

      .addCase(fetchCatalogoReportes.pending, (state) => {
        state.catalogoLoading = true;
      })
      .addCase(fetchCatalogoReportes.fulfilled, (state, action) => {
        state.catalogo = action.payload;
        state.catalogoLoading = false;
      })
      .addCase(fetchCatalogoReportes.rejected, (state) => {
        state.catalogoLoading = false;
      })

      .addCase(fetchPreviewReporte.pending, (state) => {
        state.resultadoLoading = true;
        state.resultadoError = null;
      })
      .addCase(fetchPreviewReporte.fulfilled, (state, action) => {
        state.resultado = action.payload;
        state.resultadoLoading = false;
      })
      .addCase(fetchPreviewReporte.rejected, (state, action) => {
        state.resultadoLoading = false;
        state.resultado = null;
        state.resultadoError = (action.payload as string) ?? "No pudimos generar el reporte.";
      })

      .addCase(fetchHistorialReportes.pending, (state) => {
        state.historialLoading = true;
      })
      .addCase(fetchHistorialReportes.fulfilled, (state, action) => {
        state.historial = action.payload;
        state.historialLoading = false;
      })
      .addCase(fetchHistorialReportes.rejected, (state) => {
        state.historialLoading = false;
      });
  },
});

export const { limpiarResultadoReporte } = reportesSlice.actions;
export default reportesSlice.reducer;
