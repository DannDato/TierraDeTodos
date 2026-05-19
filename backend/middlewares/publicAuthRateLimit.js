import { Op } from 'sequelize';
import { models } from '../models/index.js';
import { normalizeIpAddress } from '../utils/deviceIdentity.js';

const DEFAULT_WINDOW_MS = 5 * 60 * 1000;

const parsePositiveInt = (value, fallback) => {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return parsed;
};

const getClientIp = (req) => {
  const trustProxy = ['1', 'true', 'yes', 'on'].includes(
    String(process.env.TRUST_PROXY || '').trim().toLowerCase()
  );

  const forwarded = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim();
  const candidate = trustProxy ? (forwarded || req.ip) : req.ip;
  return normalizeIpAddress(candidate);
};

const getUserAgent = (req) => String(req.headers['user-agent'] || '').slice(0, 512);

const findUserByCredential = async (credential) => {
  const value = String(credential || '').trim();
  if (!value) return null;

  return models.Users.findOne({
    attributes: ['id'],
    where: {
      [Op.or]: [
        { username: value },
        { email: value }
      ]
    }
  });
};

const findUserByRegisterPayload = async ({ username, email }) => {
  const usernameValue = String(username || '').trim();
  const emailValue = String(email || '').trim();

  if (!usernameValue && !emailValue) return null;

  const conditions = [];
  if (usernameValue) conditions.push({ username: usernameValue });
  if (emailValue) conditions.push({ email: emailValue });

  if (conditions.length === 0) return null;

  return models.Users.findOne({
    attributes: ['id'],
    where: {
      [Op.or]: conditions
    }
  });
};

export const createPublicAuthRateLimit = ({
  actionType,
  windowMs = DEFAULT_WINDOW_MS,
  maxIpRequests,
  maxUserRequests,
  getUserId,
  ipBlockedMessage = 'Demasiados intentos. Intenta más tarde.',
  userBlockedMessage = 'Cuenta temporalmente bloqueada. Intenta más tarde.'
}) => {
  if (!actionType) {
    throw new Error('createPublicAuthRateLimit requiere actionType');
  }

  return async (req, res, next) => {
    try {
      const now = Date.now();
      const windowStart = new Date(now - windowMs);
      const ip = getClientIp(req);

      let userId = null;
      if (typeof getUserId === 'function') {
        userId = await getUserId(req);
      }

      if (Number.isFinite(maxIpRequests) && maxIpRequests > 0) {
        const ipRequests = await models.Attempts.count({
          where: {
            action_type: actionType,
            status: 'REQUEST',
            ip_address: ip,
            createdAt: { [Op.gte]: windowStart }
          }
        });

        if (ipRequests >= maxIpRequests) {
          return res.status(429).json({ message: ipBlockedMessage });
        }
      }

      if (Number.isFinite(maxUserRequests) && maxUserRequests > 0 && userId) {
        const userRequests = await models.Attempts.count({
          where: {
            action_type: actionType,
            status: 'REQUEST',
            user: userId,
            createdAt: { [Op.gte]: windowStart }
          }
        });

        if (userRequests >= maxUserRequests) {
          return res.status(429).json({ message: userBlockedMessage });
        }
      }

      await models.Attempts.create({
        user: userId,
        action_type: actionType,
        status: 'REQUEST',
        reason: 'RATE_LIMIT_TRACK',
        ip_address: ip,
        user_agent: getUserAgent(req)
      });

      return next();
    } catch (error) {
      return next(error);
    }
  };
};

export const loginRateLimit = createPublicAuthRateLimit({
  actionType: 'LOGIN',
  maxIpRequests: parsePositiveInt(process.env.RATE_LIMIT_LOGIN_MAX_IP, 20),
  maxUserRequests: parsePositiveInt(process.env.RATE_LIMIT_LOGIN_MAX_USER, 5),
  windowMs: parsePositiveInt(process.env.RATE_LIMIT_LOGIN_WINDOW_MS, DEFAULT_WINDOW_MS),
  getUserId: async (req) => {
    const user = await findUserByCredential(req.body?.usuario);
    return user?.id || null;
  },
  ipBlockedMessage: 'Demasiados intentos. Intenta nuevamente más tarde.',
  userBlockedMessage: 'Cuenta temporalmente bloqueada. Intenta más tarde.'
});

export const registerRateLimit = createPublicAuthRateLimit({
  actionType: 'REGISTER',
  maxIpRequests: parsePositiveInt(process.env.RATE_LIMIT_REGISTER_MAX_IP, 10),
  maxUserRequests: parsePositiveInt(process.env.RATE_LIMIT_REGISTER_MAX_USER, 5),
  windowMs: parsePositiveInt(process.env.RATE_LIMIT_REGISTER_WINDOW_MS, DEFAULT_WINDOW_MS),
  getUserId: async (req) => {
    const user = await findUserByRegisterPayload({
      username: req.body?.username,
      email: req.body?.email
    });
    return user?.id || null;
  },
  ipBlockedMessage: 'Demasiados intentos de registro. Intenta nuevamente más tarde.',
  userBlockedMessage: 'Demasiados intentos de registro. Intenta nuevamente más tarde.'
});

export const verifyCodeRateLimit = createPublicAuthRateLimit({
  actionType: 'VERIFY-DEVICE',
  maxIpRequests: parsePositiveInt(process.env.RATE_LIMIT_VERIFY_MAX_IP, 20),
  maxUserRequests: parsePositiveInt(process.env.RATE_LIMIT_VERIFY_MAX_USER, 5),
  windowMs: parsePositiveInt(process.env.RATE_LIMIT_VERIFY_WINDOW_MS, DEFAULT_WINDOW_MS),
  getUserId: async (req) => {
    const user = await findUserByCredential(req.body?.usuario);
    return user?.id || null;
  },
  ipBlockedMessage: 'Acceso bloqueado temporalmente. Intenta más tarde.',
  userBlockedMessage: 'Acceso bloqueado temporalmente. Intenta más tarde.'
});

export const resendVerifyCodeRateLimit = createPublicAuthRateLimit({
  actionType: 'VERIFY-RESEND',
  maxIpRequests: parsePositiveInt(process.env.RATE_LIMIT_RESEND_MAX_IP, 8),
  maxUserRequests: parsePositiveInt(process.env.RATE_LIMIT_RESEND_MAX_USER, 4),
  windowMs: parsePositiveInt(process.env.RATE_LIMIT_RESEND_WINDOW_MS, DEFAULT_WINDOW_MS),
  getUserId: async (req) => {
    const user = await findUserByCredential(req.body?.usuario);
    return user?.id || null;
  },
  ipBlockedMessage: 'Has alcanzado el límite de reenvíos. Intenta más tarde.',
  userBlockedMessage: 'Has alcanzado el límite de reenvíos. Intenta más tarde.'
});

export const googleAuthRateLimit = createPublicAuthRateLimit({
  actionType: 'GOOGLE-AUTH',
  maxIpRequests: parsePositiveInt(process.env.RATE_LIMIT_GOOGLE_MAX_IP, 30),
  windowMs: parsePositiveInt(process.env.RATE_LIMIT_GOOGLE_WINDOW_MS, DEFAULT_WINDOW_MS),
  maxUserRequests: null,
  ipBlockedMessage: 'Demasiadas solicitudes. Intenta nuevamente más tarde.'
});
