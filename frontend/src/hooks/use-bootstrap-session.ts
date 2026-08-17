"use client";

import { useEffect, useRef } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { bootstrapSession } from "@/store/slices/session-slice";

/** Restores the session on a fresh page load by exchanging the httpOnly refresh cookie for a new access token. */
export function useBootstrapSession() {
  const dispatch = useAppDispatch();
  const status = useAppSelector((state) => state.session.status);
  const hasStarted = useRef(false);

  useEffect(() => {
    if (status === "idle" && !hasStarted.current) {
      hasStarted.current = true;
      dispatch(bootstrapSession());
    }
  }, [status, dispatch]);

  return status;
}
