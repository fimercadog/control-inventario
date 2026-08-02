import { configureStore } from "@reduxjs/toolkit";
import authReducer from "@/store/slices/auth-slice";
import clientesReducer from "@/store/slices/clientes-slice";

export function makeStore() {
  return configureStore({
    reducer: {
      auth: authReducer,
      clientes: clientesReducer,
    },
  });
}

export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore["getState"]>;
export type AppDispatch = AppStore["dispatch"];
