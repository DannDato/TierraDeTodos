

import { models } from "../../models/index.js";

import { sendPasswordRecoveryEmail } from "../../helpers/emailTemplates.js";
import bcrypt from 'bcrypt';
import jwt from "jsonwebtoken";
const { JWT_SECRET } = process.env;

class PasswordRecoveryController {
  static async requestPasswordRecovery(req, res) {
    try {
      let email = undefined;
      if (req.user && req.user.email) {
        email = req.user.email;
      } else if (req.body && req.body.email) {
        email = req.body.email;
      }
      if (!email) return res.status(400).json({ message: "Email requerido" });
      const user = await models.Users.findOne({ where: { email } });
      if (!user) return res.status(404).json({ message: "Usuario no encontrado" });

      // Generar token único
      const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: "30m" });
      const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutos

      // Guardar token en la base de datos
      await models.UserTokens.create({
        userId: user.id,
        token,
        type: "password_recovery",
        used: false,
        expiresAt,
      });

      // Enviar email (flujo igual que sendAccessCodeEmail)
      const emailSent = await sendPasswordRecoveryEmail({ user, token, req });
      if (!emailSent) {
        return res.status(500).json({ message: "No se pudo enviar el correo de recuperación" });
      }
      return res.json({ message: "Correo de recuperación enviado" });
    } catch (err) {
      return res.status(500).json({ message: err.message || "Error enviando correo" });
    }
  }

  static async resetPassword(req, res) {
    try {
      const { token, password, check } = req.body;
      if (!token) return res.status(400).json({ message: "Token requerido" });
      let payload;
      try {
        payload = jwt.verify(token, JWT_SECRET);
      } catch {
        return res.status(400).json({ message: "Token inválido o expirado" });
      }
      const user = await models.Users.findByPk(payload.userId);
      if (!user) return res.status(404).json({ message: "Usuario no encontrado" });

      // Buscar el token en la base de datos
      const dbToken = await models.UserTokens.findOne({
        where: {
          userId: user.id,
          token,
          type: "password_recovery",
        },
      });
      if (!dbToken) {
        return res.status(400).json({ message: "Token inválido" });
      }
      if (dbToken.used) {
        return res.status(400).json({ message: "Token ya usado" });
      }
      if (dbToken.expiresAt < new Date()) {
        return res.status(400).json({ message: "Token expirado" });
      }

      // Solo validación de token
      if (check) return res.json({ message: "Token válido" });

      if (!password) return res.status(400).json({ message: "Faltan datos" });
      // Validar que la nueva contraseña no haya sido usada antes
      const prevPasswords = await models.UserPasswords.findAll({
        where: { userId: user.id },
        order: [['changedAt', 'DESC']],
        limit: 10 // puedes ajustar el historial
      });
      for (const prev of prevPasswords) {
        if (await bcrypt.compare(password, prev.password)) {
          return res.status(400).json({ message: "Tu contraseña no puede ser igual a una de tus contraseñas anteriores." });
        }
      }
      // Guardar la contraseña actual antes de cambiarla
      await models.UserPasswords.create({
        userId: user.id,
        password: user.password,
        changedAt: new Date()
      });
      user.password = await bcrypt.hash(password, 10);
      await user.save();
      // Cerrar todas las sesiones activas del usuario
      await models.Sessions.update(
        { revoked: true },
        { where: { userId: user.id, revoked: false } }
      );
      dbToken.used = true;
      await dbToken.save();
      return res.json({ message: "Contraseña actualizada correctamente. Se cerraron todas las sesiones." });
    } catch (err) {
      return res.status(500).json({ message: err.message || "Error actualizando contraseña" });
    }
  }
}

export default PasswordRecoveryController;
