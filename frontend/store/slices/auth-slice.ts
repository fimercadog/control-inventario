import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import * as authApi from "@/lib/api/auth";
import { setAccessToken } from "@/lib/api/auth-token";
import { ApiError } from "@/lib/api/client";
import type { AuthenticatedUser } from "@/lib/api/types";

interface AuthState {
  user: AuthenticatedUser | null;
  /**
   * 'idle': todavía no se intentó el refresh silencioso al cargar la app.
   * 'loading': login o bootstrap en curso.
   * 'authenticated' / 'unauthenticated': resultado ya conocido — recién
   * ahí es seguro decidir si se redirige a /login (evita el parpadeo).
   */
  status: "idle" | "loading" | "authenticated" | "unauthenticated";
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  status: "idle",
  error: null,
};

/**
 * Al cargar la app no hay access token en memoria (nunca se persiste) —
 * este refresh silencioso contra la cookie httpOnly es lo que restaura la
 * sesión sin pedir credenciales de nuevo en cada recarga de página.
 */
export const bootstrapAuth = createAsyncThunk("auth/bootstrap", async () => {
  const result = await authApi.refresh();
  setAccessToken(result.access_token);
  return result.user;
});

export const loginThunk = createAsyncThunk(
  "auth/login",
  async (
    args: { email: string; password: string; rememberMe: boolean },
    { rejectWithValue }
  ) => {
    try {
      const result = await authApi.login(args.email, args.password, args.rememberMe);
      setAccessToken(result.access_token);
      return result.user;
    } catch (error) {
      const message = error instanceof ApiError ? error.message : "No pudimos iniciar sesión.";
      return rejectWithValue(message);
    }
  }
);

export const logoutThunk = createAsyncThunk("auth/logout", async () => {
  try {
    await authApi.logout();
  } finally {
    setAccessToken(null);
  }
});

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    /** El interceptor de axios llama esto cuando el refresh silencioso también falla a mitad de sesión. */
    sessionExpired(state) {
      state.user = null;
      state.status = "unauthenticated";
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(bootstrapAuth.pending, (state) => {
        state.status = "loading";
      })
      .addCase(bootstrapAuth.fulfilled, (state, action) => {
        state.user = action.payload;
        state.status = "authenticated";
      })
      .addCase(bootstrapAuth.rejected, (state) => {
        state.user = null;
        state.status = "unauthenticated";
      })
      .addCase(loginThunk.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(loginThunk.fulfilled, (state, action) => {
        state.user = action.payload;
        state.status = "authenticated";
      })
      .addCase(loginThunk.rejected, (state, action) => {
        state.status = "unauthenticated";
        state.error = (action.payload as string) ?? "No pudimos iniciar sesión.";
      })
      .addCase(logoutThunk.fulfilled, (state) => {
        state.user = null;
        state.status = "unauthenticated";
      });
  },
});

export const { sessionExpired } = authSlice.actions;
export default authSlice.reducer;
