import { configureStore } from "@reduxjs/toolkit";
import authReducer from "@/store/slices/auth-slice";
import clientesReducer from "@/store/slices/clientes-slice";
import rolesReducer from "@/store/slices/roles-slice";
import auditoriaReducer from "@/store/slices/auditoria-slice";

export function makeStore() {
  return configureStore({
    reducer: {
      auth: authReducer,
      clientes: clientesReducer,
      roles: rolesReducer,
      auditoria: auditoriaReducer,
    },
  });
}

export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore["getState"]>;
export type AppDispatch = AppStore["dispatch"];
