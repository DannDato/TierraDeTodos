import dbLogs from '../config/databaseLogs.js';
import { QueryTypes } from 'sequelize';
import logger from './winston.js';

let currentLogTable = null;

const SENSITIVE_PATTERNS = [
  {
    pattern: /(Bearer\s+)([A-Za-z0-9\-._~+/]+=*)/gi,
    replacement: '$1[REDACTED]'
  },
  {
    pattern: /\beyJ[A-Za-z0-9_-]+\.[A-Za-z0-9._-]+\.[A-Za-z0-9._-]+\b/g,
    replacement: '[REDACTED_JWT]'
  },
  {
    pattern: /(client_secret|refresh_token|access_token|token|password|passwd|secret|authorization)\s*[:=]\s*([^,;\s]+)/gi,
    replacement: '$1=[REDACTED]'
  }
];

const LOG_LIMITS = {
  accion: 255,
  apartado: 255,
  tabla: 255,
  valor: 255,
  username: 100,
  ip: 50,
  device: 255,
  query: 10,
};

const LOG_LEVEL_ALIASES = {
  warning: 'warn',
  success: 'info',
  fatal: 'error',
  trace: 'debug',
  login: 'info'
};

const VALID_LOG_LEVELS = new Set(['error', 'warn', 'info', 'debug']);

function clampText(value, maxLength) {
  if (value === null || value === undefined) return value;
  const text = String(value);
  if (!maxLength || text.length <= maxLength) return text;
  return text.slice(0, maxLength);
}

function sanitizeLogValue(value) {
  if (value === null || value === undefined) {
    return value;
  }

  let text = typeof value === 'string' ? value : JSON.stringify(value);

  for (const { pattern, replacement } of SENSITIVE_PATTERNS) {
    text = text.replace(pattern, replacement);
  }

  return text;
}

function normalizeLogType(type) {
  const normalized = String(type || 'info').toLowerCase().trim();
  const mapped = LOG_LEVEL_ALIASES[normalized] || normalized;
  return VALID_LOG_LEVELS.has(mapped) ? mapped : 'info';
}

function buildConsoleMessage(accion, valor, type) {
  const normalizedAction = sanitizeLogValue(accion) || 'Accion sin descripcion';
  const normalizedValue = sanitizeLogValue(valor);

  if (process.env.NODE_ENV !== 'development') {
    return normalizedAction;
  }

  if (!normalizedValue) {
    return normalizedAction;
  }

  const suffix = String(normalizedValue).substring(0, 140);
  return `${normalizedAction}${type === 'error' ? ` [ ${suffix} ]` : ` [ ${suffix} ]`}`;
}

async function ensureLogTable(fecha) {

  const year = fecha.getFullYear();
  const month = (fecha.getMonth() + 1).toString().padStart(2, '0');
  const logTable = `Logs_${year}_${month}`;

  // si ya es la misma tabla del mes, no hacer nada
  if (currentLogTable === logTable) {
    return logTable;
  }

  const tables = await dbLogs.query(
    `SHOW TABLES LIKE :table`,
    {
      replacements: { table: logTable },
      type: QueryTypes.SELECT
    }
  );

  if (tables.length === 0) {

    await dbLogs.query(`
      CREATE TABLE ${logTable} (
        id INT NOT NULL AUTO_INCREMENT,
        usuario INT NULL,
        username VARCHAR(100) NULL,
        ip VARCHAR(50) NULL,
        device VARCHAR(255) NULL,
        fecha DATETIME NULL,
        accion VARCHAR(255) NULL,
        apartado VARCHAR(255) NULL,
        tabla VARCHAR(255) NULL,
        query ENUM('select','insert','update','delete','click','N/A') NULL,
        condicion MEDIUMTEXT NULL,
        valor VARCHAR(255) NULL,
        old_data LONGTEXT NULL,
        PRIMARY KEY (id)
      ) ENGINE=InnoDB;
    `);

    logger.info({ message: `Tabla de logs creada: ${logTable}`, username: 'System' });
  }

  currentLogTable = logTable;

  return logTable;
}

export async function logAction({
  accion,
  apartado,
  query = '' || 'N/A',
  tabla = '',
  condicion = '',
  valor = '',
  userId = null,
  username = '',
  ip = '',
  fecha = new Date(),
  device = null,
  type = 'info'
}) {

  try {
    const normalizedType = normalizeLogType(type);
    const safeAccion = clampText(sanitizeLogValue(accion), LOG_LIMITS.accion);
    const safeApartado = clampText(sanitizeLogValue(apartado), LOG_LIMITS.apartado);
    const safeTabla = clampText(sanitizeLogValue(tabla), LOG_LIMITS.tabla);
    const safeQuery = clampText(sanitizeLogValue(query || 'N/A'), LOG_LIMITS.query);
    const safeCondicion = sanitizeLogValue(condicion);
    const safeValor = clampText(sanitizeLogValue(valor), LOG_LIMITS.valor);
    const safeUsername = clampText(sanitizeLogValue(username), LOG_LIMITS.username);
    const safeIp = clampText(sanitizeLogValue(ip), LOG_LIMITS.ip);
    const safeDevice = clampText(sanitizeLogValue(device), LOG_LIMITS.device);

    const logTable = await ensureLogTable(fecha);

    let oldData = null;

    if (safeTabla && safeCondicion && ["update", "delete"].includes(String(safeQuery || '').toLowerCase())) {

      const rows = await dbLogs.query(
        `SELECT * FROM ${safeTabla} WHERE ${safeCondicion}`,
        { type: QueryTypes.SELECT }
      );

      oldData = sanitizeLogValue(rows);
    }

    await dbLogs.query(
      `
      INSERT INTO ${logTable}
      (usuario, username, ip, device, fecha, accion, apartado, tabla, query, condicion, valor, old_data)
      VALUES (:usuario, :username, :ip, :device, :fecha, :accion, :apartado, :tabla, :query, :condicion, :valor, :old_data)
      `,
      {
        replacements: {
          usuario: userId,
          username: safeUsername,
          ip: safeIp,
          device: safeDevice,
          fecha,
          accion: safeAccion,
          apartado: safeApartado,
          tabla: safeTabla,
          query: safeQuery,
          condicion: safeCondicion,
          valor: safeValor,
          old_data: oldData
        }
      }
    );

    const message = buildConsoleMessage(safeAccion, safeValor, normalizedType);

    if (normalizedType === 'error') {
      logger.error({
        level: normalizedType,
        message,
        username: safeUsername,
        ip: safeIp
      });
    }else{
      logger.log({
        level: normalizedType,
        message,
        username: safeUsername,
        ip: safeIp
      });
    }

  } catch (error) {

    logger.error(`Error guardando log: ${error.message}`);

  }

}
