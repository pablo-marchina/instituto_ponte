const AUTH_SESSION_EXPIRED_EVENT = "corrije-ai:auth-session-expired";

export function notifySessionExpired() {
  if (typeof window === "undefined") return;

  window.dispatchEvent(new Event(AUTH_SESSION_EXPIRED_EVENT));
}

export function listenSessionExpired(listener: () => void) {
  if (typeof window === "undefined") return () => undefined;

  window.addEventListener(AUTH_SESSION_EXPIRED_EVENT, listener);

  return () => {
    window.removeEventListener(AUTH_SESSION_EXPIRED_EVENT, listener);
  };
}
