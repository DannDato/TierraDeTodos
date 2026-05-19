import crypto from "crypto";

const DEVICE_ID_REGEX = /^[a-zA-Z0-9._:-]{8,128}$/;

const buildServerDeviceId = (deviceHash) => {
  const safeHash = String(deviceHash || "").toLowerCase().replace(/[^a-f0-9]/g, "");
  if (!safeHash) return null;
  return `srv_${safeHash.slice(0, 24)}`;
};

const sanitize = (value, max = 255) => {
  const text = String(value ?? "").trim();
  if (!text) return "";
  return text.slice(0, max);
};

const parseNumber = (value, { integer = true, min = 0, max = Number.MAX_SAFE_INTEGER } = {}) => {
  if (value === undefined || value === null || value === "") return null;
  const num = integer ? Number.parseInt(value, 10) : Number.parseFloat(value);
  if (!Number.isFinite(num)) return null;
  if (num < min || num > max) return null;
  return num;
};

export const normalizeIpAddress = (value) => {
  const raw = String(value || "").trim();
  if (!raw) return "0.0.0.0";

  const noPort = raw.includes(":") && raw.includes(".")
    ? raw.split(":").filter(Boolean).slice(0, -1).join(":") || raw
    : raw;

  const normalized = noPort.startsWith("::ffff:") ? noPort.replace("::ffff:", "") : noPort;
  return normalized || "0.0.0.0";
};

export const isUsableIpAddress = (value) => {
  const ip = normalizeIpAddress(value);
  if (!ip || ip === "0.0.0.0" || ip === "::") return false;
  return true;
};

const getRequestIp = (req) => {
  const trustProxy = ["1", "true", "yes", "on"].includes(
    String(process.env.TRUST_PROXY || "").trim().toLowerCase()
  );

  const forwarded = String(req.headers["x-forwarded-for"] || "").split(",")[0].trim();
  const candidate = trustProxy ? (forwarded || req.ip) : req.ip;

  return normalizeIpAddress(candidate);
};

const parseBrowser = (ua = "") => {
  const value = ua.toLowerCase();
  if (!value) return "unknown";

  if (value.includes("edg/")) return "edge";
  if (value.includes("opr/") || value.includes("opera")) return "opera";
  if (value.includes("firefox/")) return "firefox";
  if (value.includes("chrome/") && !value.includes("edg/")) return "chrome";
  if (value.includes("safari/") && !value.includes("chrome/")) return "safari";

  return "unknown";
};

const parseOs = (ua = "") => {
  const value = ua.toLowerCase();
  if (!value) return "unknown";

  if (value.includes("windows")) return "windows";
  if (value.includes("android")) return "android";
  if (value.includes("iphone") || value.includes("ipad") || value.includes("ios")) return "ios";
  if (value.includes("mac os") || value.includes("macintosh")) return "macos";
  if (value.includes("linux")) return "linux";

  return "unknown";
};

const parseDeviceType = (ua = "") => {
  const value = ua.toLowerCase();
  if (!value) return "unknown";

  if (value.includes("tablet") || value.includes("ipad")) return "tablet";
  if (value.includes("mobile") || value.includes("android") || value.includes("iphone")) return "mobile";
  return "desktop";
};

export const getDeviceContext = (req) => {
  const userAgent = sanitize(req.headers["user-agent"], 512);
  const acceptLanguage = sanitize(req.headers["accept-language"], 128);
  const languageFromHeader = sanitize(req.headers["x-device-language"], 32);
  const timezone = sanitize(req.headers["x-device-timezone"], 64);
  const platform = sanitize(req.headers["x-device-platform"] || req.headers["sec-ch-ua-platform"], 64);
  const screenResolution = sanitize(req.headers["x-device-screen"], 24);
  const pixelRatio = sanitize(req.headers["x-device-pixel-ratio"], 12);
  const deviceMemory = sanitize(req.headers["x-device-memory"], 12);

  const browser = parseBrowser(userAgent);
  const os = parseOs(userAgent);
  const deviceType = parseDeviceType(userAgent);

  const deviceIdRaw = sanitize(req.headers["x-device-id"], 128);
  const deviceId = DEVICE_ID_REGEX.test(deviceIdRaw) ? deviceIdRaw : "";

  const fingerprintHintRaw = sanitize(req.headers["x-device-fingerprint"], 128).toLowerCase();
  const fingerprintHint = /^[a-f0-9]{8,128}$/.test(fingerprintHintRaw) ? fingerprintHintRaw : "";

  const language = languageFromHeader || sanitize(acceptLanguage.split(",")[0], 32);

  const colorDepth = parseNumber(req.headers["x-device-color-depth"], { integer: true, min: 0, max: 128 });
  const hardwareConcurrency = parseNumber(req.headers["x-device-hardware-concurrency"], { integer: true, min: 0, max: 256 });
  const maxTouchPoints = parseNumber(req.headers["x-device-max-touch-points"], { integer: true, min: 0, max: 128 });

  const fingerprintVersion = "v2";
  const fingerprintBasis = [
    fingerprintVersion,
    fingerprintHint || "none",
    userAgent,
    acceptLanguage,
    language,
    timezone,
    platform,
    browser,
    os,
    deviceType,
    screenResolution,
    String(colorDepth ?? ""),
    pixelRatio,
    String(hardwareConcurrency ?? ""),
    deviceMemory,
    String(maxTouchPoints ?? ""),
  ].join("|");

  const fingerprintHash = crypto
    .createHash("sha256")
    .update(fingerprintBasis)
    .digest("hex");

  const deviceHashBasis = [
    "device-v2",
    fingerprintHash,
    browser,
    os,
    platform,
  ].join("|");

  const deviceHash = crypto
    .createHash("sha256")
    .update(deviceHashBasis)
    .digest("hex");

  return {
    ip: getRequestIp(req),
    userAgent,
    acceptLanguage,
    language,
    timezone,
    platform,
    browser,
    os,
    deviceType,
    screenResolution,
    colorDepth,
    pixelRatio,
    hardwareConcurrency,
    deviceMemory,
    maxTouchPoints,
    deviceId,
    fingerprintHint,
    fingerprintVersion,
    fingerprintHash,
    deviceHash,
    secChUa: sanitize(req.headers["sec-ch-ua"], 256),
    secChUaMobile: sanitize(req.headers["sec-ch-ua-mobile"], 32),
    secChUaPlatform: sanitize(req.headers["sec-ch-ua-platform"], 64),
  };
};

export const buildUserDevicePayload = ({ userId, context, authorized = "PENDING" }) => {
  const resolvedDeviceId = context.deviceId || buildServerDeviceId(context.deviceHash);

  return {
    user: userId,
    device_hash: context.deviceHash,
    device_id: resolvedDeviceId,
    fingerprint_hash: context.fingerprintHash,
    fingerprint_version: context.fingerprintVersion,
    authorized,
    user_agent: context.userAgent,
    ip_address: context.ip,
    accept_language: context.acceptLanguage || null,
    language: context.language || null,
    timezone: context.timezone || null,
    platform: context.platform || null,
    browser: context.browser || null,
    os: context.os || null,
    device_type: context.deviceType || null,
    screen_resolution: context.screenResolution || null,
    color_depth: context.colorDepth,
    pixel_ratio: context.pixelRatio || null,
    hardware_concurrency: context.hardwareConcurrency,
    device_memory: context.deviceMemory || null,
    max_touch_points: context.maxTouchPoints,
    fingerprint_metadata: JSON.stringify({
      sec_ch_ua: context.secChUa || null,
      sec_ch_ua_mobile: context.secChUaMobile || null,
      sec_ch_ua_platform: context.secChUaPlatform || null,
      hint: context.fingerprintHint || null,
    }),
    last_login: new Date(),
  };
};

export const buildDeviceLookup = (context) => {
  const or = [{ device_hash: context.deviceHash }];
  if (context.fingerprintHash) {
    or.push({ fingerprint_hash: context.fingerprintHash });
  }
  return or;
};
