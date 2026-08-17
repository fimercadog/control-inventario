/**
 * Holds the JWT access token in memory only (never localStorage, per the backend's
 * own contract). Deliberately outside Redux: the axios client needs synchronous
 * read/write access to the token on every request, and importing the Redux store
 * from the axios client would create a circular module dependency (store -> the
 * session slice -> the auth service -> the axios client -> store).
 */
let accessToken: string | null = null;

export function getAccessToken(): string | null {
  return accessToken;
}

export function setAccessToken(token: string | null): void {
  accessToken = token;
}

export function clearAccessToken(): void {
  accessToken = null;
}

type ExpiredListener = () => void;
const expiredListeners = new Set<ExpiredListener>();

/** Called by the axios client when a silent refresh fails, so Redux can clear the session. */
export function notifySessionExpired(): void {
  accessToken = null;
  expiredListeners.forEach((listener) => listener());
}

export function onSessionExpired(listener: ExpiredListener): () => void {
  expiredListeners.add(listener);
  return () => expiredListeners.delete(listener);
}
