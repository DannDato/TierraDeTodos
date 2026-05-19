import { Op } from 'sequelize';
import { models } from '../models/index.js';

const DEFAULT_RETENTION_DAYS = 30;
const DEFAULT_INTERVAL_MINUTES = 60;

const parsePositiveInt = (value, fallback) => {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return parsed;
};

const isCleanupEnabled = () => {
  const raw = String(process.env.ATTEMPTS_CLEANUP_ENABLED || 'true').trim().toLowerCase();
  return !['0', 'false', 'no', 'off'].includes(raw);
};

export const startAttemptsCleanupJob = ({ onInfo, onError } = {}) => {
  if (!isCleanupEnabled()) {
    onInfo?.('Purga de Attempts deshabilitada por ATTEMPTS_CLEANUP_ENABLED');
    return { enabled: false, stop: () => {} };
  }

  const retentionDays = parsePositiveInt(process.env.ATTEMPTS_RETENTION_DAYS, DEFAULT_RETENTION_DAYS);
  const intervalMinutes = parsePositiveInt(process.env.ATTEMPTS_CLEANUP_INTERVAL_MINUTES, DEFAULT_INTERVAL_MINUTES);
  const intervalMs = intervalMinutes * 60 * 1000;

  const runCleanup = async () => {
    const cutoff = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);

    const deletedRows = await models.Attempts.destroy({
      where: {
        createdAt: {
          [Op.lt]: cutoff
        }
      }
    });

    onInfo?.(`Purga Attempts ejecutada: ${deletedRows} registros eliminados (retencion ${retentionDays} dias)`);
  };

  runCleanup().catch((error) => {
    onError?.(`Error en purga inicial de Attempts: ${error.message}`);
  });

  const timer = setInterval(() => {
    runCleanup().catch((error) => {
      onError?.(`Error en purga programada de Attempts: ${error.message}`);
    });
  }, intervalMs);

  if (typeof timer.unref === 'function') {
    timer.unref();
  }

  onInfo?.(`Job de purga Attempts activo cada ${intervalMinutes} minutos (retencion ${retentionDays} dias)`);

  return {
    enabled: true,
    stop: () => clearInterval(timer)
  };
};
