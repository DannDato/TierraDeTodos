import jwt from 'jsonwebtoken';
import { models } from '../models/index.js';

export const CreateSession = async ({ token, userId, req }) => {
  const decoded = jwt.verify(token, process.env.JWT_SECRET);

  if (decoded.userId !== userId) {
    throw new Error('Token inválido para el usuario actual');
  }

  const device = req.headers['user-agent'] || 'unknown-device';

  await models.Sessions.destroy({
    where: {
      userId,
      device
    }
  });

  const session = await models.Sessions.create({
    userId,
    jwt: token,
    ip: req.ip,
    device,
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    revoked: false
  });

  return session;
};
