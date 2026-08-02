import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import * as authApi from "@/lib/api/auth";
import * as perfilApi from "@/lib/api/perfil";
import { setAccessToken } from "@/lib/api/auth-token";
import { ApiError } from "@/lib/api/client";
import type { AuthenticatedUser, ChangePasswordPayload, UpdateProfilePayload } from "@/lib/api/types";

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

/**
 * BUG-007: si el access token ya expiró (JWT_TTL=15 min) al momento del
 * click, el backend responde 401 a /auth/logout — correcto desde su
 * perspectiva (no hay sesión válida que cerrar), pero irrelevante para el
 * usuario: su intención (terminar la sesión) ya se cumple limpiando el
 * token localmente. No se relanza el error — un logout nunca debe
 * mostrarle un error al usuario, illustrado explícitamente en el reporte
 * de este bug.
 */
export const logoutThunk = createAsyncThunk("auth/logout", async () => {
  try {
    await authApi.logout();
  } catch {
    // Silenciado a propósito — ver comentario de la función.
  } finally {
    setAccessToken(null);
  }
});

/**
 * Perfil (2026-08-02). Los 3 thunks siguientes viven en `auth-slice`, no
 * en un `perfil-slice` propio: mutan exactamente el mismo `state.user`
 * que este slice ya es dueño — un slice separado necesitaría un mecanismo
 * cross-slice solo para actualizar el mismo objeto, sin beneficio real.
 *
 * Prefiere el primer error de campo (`fieldErrors`) sobre el mensaje
 * genérico de nivel superior — encontrado en verificación de navegador:
 * una contraseña actual incorrecta mostraba el toast genérico "Error de
 * validación" en vez del mensaje real y específico que el backend ya
 * arma ("La contraseña actual no es correcta").
 */
function mensajeError(error: unknown, fallback: string): string {
  if (error instanceof ApiError) {
    const primerCampo = error.fieldErrors && Object.values(error.fieldErrors)[0]?.[0];
    return primerCampo ?? error.message;
  }
  return fallback;
}

export const updateProfileThunk = createAsyncThunk(
  "auth/updateProfile",
  async (payload: UpdateProfilePayload, { rejectWithValue }) => {
    try {
      return await perfilApi.updateProfile(payload);
    } catch (error) {
      return rejectWithValue(mensajeError(error, "No pudimos guardar los cambios."));
    }
  }
);

export const uploadAvatarThunk = createAsyncThunk(
  "auth/uploadAvatar",
  async (archivo: File, { rejectWithValue }) => {
    try {
      return await perfilApi.uploadAvatar(archivo);
    } catch (error) {
      return rejectWithValue(mensajeError(error, "No pudimos subir el avatar."));
    }
  }
);

export const removeAvatarThunk = createAsyncThunk(
  "auth/removeAvatar",
  async (_: void, { rejectWithValue }) => {
    try {
      return await perfilApi.removeAvatar();
    } catch (error) {
      return rejectWithValue(mensajeError(error, "No pudimos eliminar el avatar."));
    }
  }
);

/** No actualiza `state.user` — revoca sesiones, el componente debe redirigir a /login. */
export const changePasswordThunk = createAsyncThunk(
  "auth/changePassword",
  async (payload: ChangePasswordPayload, { rejectWithValue }) => {
    try {
      await perfilApi.changePassword(payload);
    } catch (error) {
      return rejectWithValue(mensajeError(error, "No pudimos cambiar la contraseña."));
    }
  }
);

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
      .addCase(updateProfileThunk.fulfilled, (state, action) => {
        state.user = action.payload;
      })
      .addCase(uploadAvatarThunk.fulfilled, (state, action) => {
        state.user = action.payload;
      })
      .addCase(removeAvatarThunk.fulfilled, (state, action) => {
        state.user = action.payload;
      })
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
