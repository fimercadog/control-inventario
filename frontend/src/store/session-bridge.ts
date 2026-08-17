import { store } from "@/store/store";
import { sessionActions } from "@/store/slices/session-slice";
import { onSessionExpired } from "@/lib/auth/token-store";

let wired = false;

/** Connects a failed background token refresh to the Redux session state. Idempotent. */
export function wireSessionBridge(): void {
  if (wired) return;
  wired = true;
  onSessionExpired(() => {
    store.dispatch(sessionActions.clearSession());
  });
}
