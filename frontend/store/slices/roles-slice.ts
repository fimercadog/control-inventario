import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import * as rolesApi from "@/lib/api/roles";
import { ApiError } from "@/lib/api/client";
import type { PaginatedItems, Role, StoreRolePayload, UpdateRolePayload } from "@/lib/api/types";

/**
 * Módulo 5 — Role Management (2026-08-02). Mismo Global UI Standard que
 * `clientes-slice.ts`: toda mutación recarga la lista desde el backend,
 * el reducer nunca parchea `items` a mano.
 */
interface RolesState {
  items: Role[];
  meta: PaginatedItems<Role>["meta"] | null;
  loading: boolean;
  error: string | null;
  /** Catálogo global de permisos — cargado una vez, reutilizado por los diálogos de crear/editar. */
  catalogoPermisos: string[];
  catalogoLoading: boolean;
}

const initialState: RolesState = {
  items: [],
  meta: null,
  loading: false,
  error: null,
  catalogoPermisos: [],
  catalogoLoading: false,
};

function mensajeError(error: unknown, fallback: string): string {
  return error instanceof ApiError ? error.message : fallback;
}

export const fetchRoles = createAsyncThunk(
  "roles/fetch",
  async (
    params: { busqueda?: string; estado?: string; page?: number } | undefined,
    { rejectWithValue }
  ) => {
    try {
      return await rolesApi.listRoles(params);
    } catch (error) {
      return rejectWithValue(mensajeError(error, "No pudimos cargar los roles."));
    }
  }
);

export const fetchCatalogoPermisos = createAsyncThunk(
  "roles/fetchCatalogoPermisos",
  async (_: void, { rejectWithValue }) => {
    try {
      return await rolesApi.listPermisos();
    } catch (error) {
      return rejectWithValue(mensajeError(error, "No pudimos cargar el catálogo de permisos."));
    }
  }
);

export const createRoleThunk = createAsyncThunk(
  "roles/create",
  async (payload: StoreRolePayload, { rejectWithValue }) => {
    try {
      return await rolesApi.createRole(payload);
    } catch (error) {
      return rejectWithValue(mensajeError(error, "No pudimos crear el rol."));
    }
  }
);

export const updateRoleThunk = createAsyncThunk(
  "roles/update",
  async (args: { id: number; payload: UpdateRolePayload }, { rejectWithValue }) => {
    try {
      return await rolesApi.updateRole(args.id, args.payload);
    } catch (error) {
      return rejectWithValue(mensajeError(error, "No pudimos guardar los cambios."));
    }
  }
);

export const desactivarRoleThunk = createAsyncThunk(
  "roles/desactivar",
  async (id: number, { rejectWithValue }) => {
    try {
      return await rolesApi.desactivarRole(id);
    } catch (error) {
      return rejectWithValue(mensajeError(error, "No pudimos desactivar el rol."));
    }
  }
);

export const activarRoleThunk = createAsyncThunk(
  "roles/activar",
  async (id: number, { rejectWithValue }) => {
    try {
      return await rolesApi.activarRole(id);
    } catch (error) {
      return rejectWithValue(mensajeError(error, "No pudimos activar el rol."));
    }
  }
);

const rolesSlice = createSlice({
  name: "roles",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchRoles.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchRoles.fulfilled, (state, action) => {
        state.items = action.payload.items;
        state.meta = action.payload.meta;
        state.loading = false;
      })
      .addCase(fetchRoles.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) ?? "No pudimos cargar los roles.";
      })
      .addCase(fetchCatalogoPermisos.pending, (state) => {
        state.catalogoLoading = true;
      })
      .addCase(fetchCatalogoPermisos.fulfilled, (state, action) => {
        state.catalogoPermisos = action.payload;
        state.catalogoLoading = false;
      })
      .addCase(fetchCatalogoPermisos.rejected, (state) => {
        state.catalogoLoading = false;
      });
  },
});

export default rolesSlice.reducer;
