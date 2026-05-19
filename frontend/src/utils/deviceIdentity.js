const DEVICE_ID_KEY = "tdt_device_id";
const FINGERPRINT_CACHE_KEY = "tdt_device_fp";

const safeLocalStorageGet = (key) => {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
};

const safeLocalStorageSet = (key, value) => {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Ignore write failures (private mode/storage restrictions)
  }
};

const hashString = (value) => {
  let hash = 0x811c9dc5;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
};

const createDeviceId = () => {
  const cryptoApi = globalThis.crypto;
  if (cryptoApi?.randomUUID) {
    return `did_${cryptoApi.randomUUID()}`;
  }

  const randomPart = Math.random().toString(36).slice(2, 12);
  const timePart = Date.now().toString(36);
  return `did_${timePart}${randomPart}`;
};

export const getOrCreateDeviceId = () => {
  const current = safeLocalStorageGet(DEVICE_ID_KEY);
  if (current) return current;

  const generated = createDeviceId();
  safeLocalStorageSet(DEVICE_ID_KEY, generated);
  return generated;
};

export const buildClientDeviceHeaders = () => {
  const nav = typeof navigator !== "undefined" ? navigator : null;
  const screenApi = typeof screen !== "undefined" ? screen : null;

  // Keep a local stable id for future features, but do not send it or use it as a trust signal.
  getOrCreateDeviceId();
  const language = nav?.language || "";
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || "";
  const platform = nav?.platform || nav?.userAgentData?.platform || "";
  const screenValue = screenApi ? `${screenApi.width || 0}x${screenApi.height || 0}` : "";
  const colorDepth = screenApi?.colorDepth != null ? String(screenApi.colorDepth) : "";
  const pixelRatio = typeof window !== "undefined" && Number.isFinite(window.devicePixelRatio)
    ? String(window.devicePixelRatio)
    : "";
  const hardwareConcurrency = nav?.hardwareConcurrency != null ? String(nav.hardwareConcurrency) : "";
  const deviceMemory = nav?.deviceMemory != null ? String(nav.deviceMemory) : "";
  const maxTouchPoints = nav?.maxTouchPoints != null ? String(nav.maxTouchPoints) : "";

  const basis = [
    nav?.userAgent || "",
    language,
    timezone,
    platform,
    screenValue,
    colorDepth,
    pixelRatio,
    hardwareConcurrency,
    deviceMemory,
    maxTouchPoints,
  ].join("|");

  const fingerprint = hashString(basis);
  safeLocalStorageSet(FINGERPRINT_CACHE_KEY, fingerprint);

  return {
    "x-device-fingerprint": fingerprint,
    "x-device-language": language,
    "x-device-timezone": timezone,
    "x-device-platform": platform,
    "x-device-screen": screenValue,
    "x-device-color-depth": colorDepth,
    "x-device-pixel-ratio": pixelRatio,
    "x-device-hardware-concurrency": hardwareConcurrency,
    "x-device-memory": deviceMemory,
    "x-device-max-touch-points": maxTouchPoints,
  };
};
