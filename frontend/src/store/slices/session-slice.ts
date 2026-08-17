import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import * as authService from "@/lib/auth/auth-service";
import { extractApiErrorMessage } from "@/lib/api/errors";
import type { AuthenticatedUser, LoginPayload } from "@/types/auth";

type SessionStatus = "idle" | "loading" | "authenticated" | "unauthenticated";

interface SessionState {
  user: AuthenticatedUser | null;
  status: SessionStatus;
  error: string | null;
}

const initialState: SessionState = {
  user: null,
  status: "idle",
  error: null,
};

export const login = createAsyncThunk<
  Awaited<ReturnType<typeof authService.login>>,
  LoginPayload,
  { rejectValue: string }
>("session/login", async (payload, { rejectWithValue }) => {
  try {
    return await authService.login(payload);
  } catch (error) {
    return rejectWithValue(extractApiErrorMessage(error, "No se pudo iniciar sesión."));
  }
});

export const bootstrapSession = createAsyncThunk(
  "session/bootstrap",
  async () => authService.refresh()
);

export const logout = createAsyncThunk("session/logout", async () => {
  await authService.logout();
});

const sessionSlice = createSlice({
  name: "session",
  initialState,
  reducers: {
    clearSession(state) {
      state.user = null;
      state.status = "unauthenticated";
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.user = action.payload.user;
        state.status = "authenticated";
        state.error = null;
      })
      .addCase(login.rejected, (state, action) => {
        state.status = "unauthenticated";
        state.user = null;
        state.error = action.payload ?? "No se pudo iniciar sesión.";
      })
      .addCase(bootstrapSession.pending, (state) => {
        state.status = "loading";
      })
      .addCase(bootstrapSession.fulfilled, (state, action) => {
        state.user = action.payload.user;
        state.status = "authenticated";
      })
      .addCase(bootstrapSession.rejected, (state) => {
        state.user = null;
        state.status = "unauthenticated";
      })
      .addCase(logout.fulfilled, (state) => {
        state.user = null;
        state.status = "unauthenticated";
      })
      .addCase(logout.rejected, (state) => {
        state.user = null;
        state.status = "unauthenticated";
      });
  },
});

export const sessionActions = sessionSlice.actions;
export default sessionSlice.reducer;
