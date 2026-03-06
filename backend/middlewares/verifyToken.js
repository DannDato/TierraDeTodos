import jwt from 'jsonwebtoken';
import { models } from '../models/index.js';

export const verifyToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader) {return res.status(401).json({ message: 'JWT no autorizado' });}

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await models.Users.findByPk(decoded.id);
    if (!user) {
      return res.status(401).json({ message: 'Usuario no encontrado' });
    }
    req.user = user;
    next();

  } catch (error) {

    return res.status(403).json({ message: 'JWT no válido' });

  }

};