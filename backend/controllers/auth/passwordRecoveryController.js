

import { models } from "../../models/index.js";

import { sendPasswordRecoveryEmail } from "../../helpers/emailTemplates.js";
import bcrypt from 'bcrypt';
import jwt from "jsonwebtoken";
const { JWT_SECRET } = process.env;

const logAuthAction = async (req, config) => {
  if (req?.logAction) {
    await req.logAction(config);
  }
};

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
      // No revelar si el email existe o no (evitar enumeraciÃ³n de cuentas)
      if (!user) return res.status(200).json({ message: "Si el correo estÃ¡ registrado, recibirÃ¡s un enlace de recuperaciÃ³n" });

      // Generar token Ãºnico
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
        return res.status(500).json({ message: "No se pudo enviar el correo de recuperaciÃ³n" });
      }
      await logAuthAction(req, {
        accion: 'Correo de recuperacion enviado',
        apartado: 'PasswordRecovery',
        userId: user.id,
        username: user.username,
        valor: `email=${email}`,
        type: 'info'
      });
      return res.json({ message: "Correo de recuperaciÃ³n enviado" });
    } catch (err) {
      await logAuthAction(req, {
        accion: 'Error enviando correo de recuperacion',
        apartado: 'PasswordRecovery',
        valor: err.message,
        type: 'error'
      });
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
        return res.status(400).json({ message: "Token invÃ¡lido o expirado" });
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
        return res.status(400).json({ message: "Token invÃ¡lido" });
      }
      if (dbToken.used) {
        return res.status(400).json({ message: "Token ya usado" });
      }
      if (dbToken.expiresAt < new Date()) {
        return res.status(400).json({ message: "Token expirado" });
      }

      // Solo validaciÃ³n de token
      if (check) {
        await logAuthAction(req, {
          accion: 'Token de recuperacion validado',
          apartado: 'PasswordRecovery',
          userId: user.id,
          username: user.username,
          type: 'info'
        });
        return res.json({ message: "Token vÃ¡lido" });
      }

      if (!password) return res.status(400).json({ message: "Faltan datos" });

      const passwordStr = String(password);
      if (passwordStr.length < 8 || passwordStr.length > 128) {
        return res.status(400).json({ message: 'La contraseÃ±a debe tener entre 8 y 128 caracteres' });
      }

      // Validar que la nueva contraseÃ±a no haya sido usada antes
      const prevPasswords = await models.UserPasswords.findAll({
        where: { userId: user.id },
        order: [['changedAt', 'DESC']],
        limit: 10 // puedes ajustar el historial
      });
      for (const prev of prevPasswords) {
        if (await bcrypt.compare(password, prev.password)) {
          return res.status(400).json({ message: "Tu contraseÃ±a no puede ser igual a una de tus contraseÃ±as anteriores." });
        }
      }
      // Guardar la contraseÃ±a actual antes de cambiarla
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
      await logAuthAction(req, {
        accion: 'Contrasena restablecida correctamente',
        apartado: 'PasswordRecovery',
        userId: user.id,
        username: user.username,
        type: 'info'
      });
      return res.json({ message: "ContraseÃ±a actualizada correctamente. Se cerraron todas las sesiones." });
    } catch (err) {
      await logAuthAction(req, {
        accion: 'Error restableciendo contrasena',
        apartado: 'PasswordRecovery',
        valor: err.message,
        type: 'error'
      });
      return res.status(500).json({ message: err.message || "Error actualizando contraseÃ±a" });
    }
  }
}

export default PasswordRecoveryController;

