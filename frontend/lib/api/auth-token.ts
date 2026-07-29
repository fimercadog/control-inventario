/**
 * El access token vive únicamente en memoria (nunca en localStorage,
 * docs/04_ARCHITECTURE.md — "Tokens en cookies httpOnly"). Este módulo es
 * el único lugar donde se guarda: el slice de Redux lo actualiza aquí en
 * cada login/refresh, y el cliente de axios lo lee aquí para el header
 * Authorization, sin que ninguno de los dos dependa directamente del otro.
 */
let accessToken: string | null = null;

export function getAccessToken(): string | null {
  return accessToken;
}

export function setAccessToken(token: string | null): void {
  accessToken = token;
}

/**
 * El interceptor de axios (que no es un componente React ni conoce Redux)
 * llama esto cuando el refresh silencioso también falla — la sesión ya no
 * es recuperable. `Providers` registra el único listener real: limpia el
 * estado de auth y redirige a /login.
 */
let onSessionExpired: (() => void) | null = null;

export function setOnSessionExpired(callback: (() => void) | null): void {
  onSessionExpired = callback;
}

export function notifySessionExpired(): void {
  onSessionExpired?.();
}
