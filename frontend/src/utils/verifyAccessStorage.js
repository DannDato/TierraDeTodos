const PENDING_VERIFY_ACCESS_KEY = "pendingVerifyAccess";
const VERIFY_ACCESS_RESEND_AT_KEY = "pendingVerifyAccessResendAt";
const PENDING_VERIFY_ACCESS_TTL_MS = 15 * 60 * 1000;

const isBrowser = () => typeof window !== "undefined" && typeof window.sessionStorage !== "undefined";

const safeReadJson = (key) => {
  if (!isBrowser()) return null;

  try {
    const raw = window.sessionStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    window.sessionStorage.removeItem(key);
    return null;
  }
};

export const setPendingVerifyAccessUser = (usuario) => {
  if (!isBrowser()) return;

  window.sessionStorage.setItem(
    PENDING_VERIFY_ACCESS_KEY,
    JSON.stringify({
      usuario: String(usuario || "").trim(),
      createdAt: Date.now(),
    })
  );
};

export const getPendingVerifyAccessUser = () => {
  const payload = safeReadJson(PENDING_VERIFY_ACCESS_KEY);
  if (!payload?.usuario || !payload?.createdAt) {
    clearPendingVerifyAccessUser();
    return "";
  }

  if (Date.now() - Number(payload.createdAt) > PENDING_VERIFY_ACCESS_TTL_MS) {
    clearPendingVerifyAccessUser();
    return "";
  }

  return String(payload.usuario);
};

export const clearPendingVerifyAccessUser = () => {
  if (!isBrowser()) return;
  window.sessionStorage.removeItem(PENDING_VERIFY_ACCESS_KEY);
  window.sessionStorage.removeItem(VERIFY_ACCESS_RESEND_AT_KEY);
};

export const setVerifyAccessResendAvailableAt = (timestamp) => {
  if (!isBrowser()) return;
  window.sessionStorage.setItem(VERIFY_ACCESS_RESEND_AT_KEY, String(Number(timestamp) || 0));
};

export const getVerifyAccessResendAvailableAt = () => {
  if (!isBrowser()) return 0;
  const value = Number(window.sessionStorage.getItem(VERIFY_ACCESS_RESEND_AT_KEY) || 0);
  return Number.isFinite(value) ? value : 0;
};