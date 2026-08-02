import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import * as clientesApi from "@/lib/api/clientes";
import { ApiError } from "@/lib/api/client";
import type { Cliente, PaginatedItems, StoreClientePayload, UpdateClientePayload } from "@/lib/api/types";

/**
 * Módulo Clientes (2026-08-02) — primer slice de datos de negocio de este
 * proyecto. Todos los demás módulos (Categorías, Marcas, Proveedores,
 * Productos, Stock, Movimientos, Usuarios) manejan su propia lista con el
 * hook `useCrudList` (estado local por componente), no con Redux. Este
 * slice existe porque CLAUDE.md declara Redux Toolkit como parte del
 * stack oficial del proyecto — Clientes es el primer módulo construido
 * bajo la metodología de vertical slice completo (2026-08-02) y lo usa
 * tal como se pidió explícitamente, no como una reescritura retroactiva
 * de los módulos anteriores.
 *
 * Mismo Global UI Standard que `useCrudList` (aprobado 2026-07-29): toda
 * mutación (crear/editar/deshabilitar/habilitar) invalida y recarga la
 * lista desde el backend — nunca parchea `items` a mano. Por eso este
 * slice solo guarda estado real para `fetchClientes`; los thunks de
 * mutación se despachan y el componente vuelve a despachar `fetchClientes`
 * al resolver, en vez de que el reducer intente adivinar cómo mutar la
 * página/filtros actuales.
 */
interface ClientesState {
  items: Cliente[];
  meta: PaginatedItems<Cliente>["meta"] | null;
  loading: boolean;
  error: string | null;
}

const initialState: ClientesState = {
  items: [],
  meta: null,
  loading: false,
  error: null,
};

function mensajeError(error: unknown, fallback: string): string {
  return error instanceof ApiError ? error.message : fallback;
}

export const fetchClientes = createAsyncThunk(
  "clientes/fetch",
  async (
    params: { busqueda?: string; estado?: string; page?: number } | undefined,
    { rejectWithValue }
  ) => {
    try {
      return await clientesApi.listClientes(params);
    } catch (error) {
      return rejectWithValue(mensajeError(error, "No pudimos cargar los clientes."));
    }
  }
);

export const createClienteThunk = createAsyncThunk(
  "clientes/create",
  async (payload: StoreClientePayload, { rejectWithValue }) => {
    try {
      return await clientesApi.createCliente(payload);
    } catch (error) {
      return rejectWithValue(mensajeError(error, "No pudimos crear el cliente."));
    }
  }
);

export const updateClienteThunk = createAsyncThunk(
  "clientes/update",
  async (args: { id: number; payload: UpdateClientePayload }, { rejectWithValue }) => {
    try {
      return await clientesApi.updateCliente(args.id, args.payload);
    } catch (error) {
      return rejectWithValue(mensajeError(error, "No pudimos guardar los cambios."));
    }
  }
);

export const disableClienteThunk = createAsyncThunk(
  "clientes/disable",
  async (id: number, { rejectWithValue }) => {
    try {
      return await clientesApi.disableCliente(id);
    } catch (error) {
      return rejectWithValue(mensajeError(error, "No pudimos deshabilitar el cliente."));
    }
  }
);

export const enableClienteThunk = createAsyncThunk(
  "clientes/enable",
  async (id: number, { rejectWithValue }) => {
    try {
      return await clientesApi.enableCliente(id);
    } catch (error) {
      return rejectWithValue(mensajeError(error, "No pudimos habilitar el cliente."));
    }
  }
);

const clientesSlice = createSlice({
  name: "clientes",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchClientes.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchClientes.fulfilled, (state, action) => {
        state.items = action.payload.items;
        state.meta = action.payload.meta;
        state.loading = false;
      })
      .addCase(fetchClientes.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) ?? "No pudimos cargar los clientes.";
      });
  },
});

export default clientesSlice.reducer;
