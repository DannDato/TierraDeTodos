import jwt from "jsonwebtoken";
import { models } from "../models/index.js";
import { Op } from "sequelize";

export const verifyToken = async (req, res, next) => {

  const authHeader = req.headers["authorization"];
  if (!authHeader) {
    return res.status(401).json({ message: "JWT no autorizado" });
  }

  const [scheme, token] = authHeader.split(" ");
  if (scheme !== "Bearer" || !token) {
    return res.status(401).json({ message: "Formato de autorización inválido" });
  }

  try {

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await models.Users.findByPk(decoded.userId);
    if (!user) {
      return res.status(401).json({ message: "Usuario no encontrado" });
    }

    const session = await models.Sessions.findOne({
      where: {
        jwt: token,
        userId: decoded.userId,
        revoked: false,
        expiresAt: {
          [Op.gt]: new Date()
        }
      }
    });

    if (!session) {
      return res.status(401).json({ message: "Sesión inválida o revocada" });
    }

    req.user = user;
    req.session = session;

    next();

  } catch (error) {

    return res.status(403).json({ message: "JWT no válido" });

  }

};