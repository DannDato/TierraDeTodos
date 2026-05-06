import nodemailer from "nodemailer";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const sendPasswordRecoveryEmail = async ({ user, token, req }) => {
  try {
    if (process.env.NODE_ENV === 'development') {
      console.log("======================================");
      console.log(`Usuario: ${user.email}`);
      console.log(`Solicitud de recuperación de contraseña`);
      console.log(`Token: ${token}`);
      console.log("Este enlace expira en 30 minutos");
      console.log("======================================");
    }

    if(process.env.SEND_MAIL === 'true'){
      const templatePath = path.join(__dirname, '../emails/password-recovery.html');
      let htmlContent = fs.existsSync(templatePath)
        ? fs.readFileSync(templatePath, 'utf-8')
        : `<div style='font-family:Arial,sans-serif;max-width:500px;margin:auto;padding:24px;background:#f9f9f9;border-radius:12px;'>
            <h2 style='color:#222;'>Solicitud de restablecimiento de contraseña</h2>
            <p>Hola <b>${user.username}</b>,</p>
            <p>Recibimos una solicitud para restablecer tu contraseña. Haz clic en el siguiente botón para continuar:</p>
            <p style='text-align:center;margin:32px 0;'>
              <a href='${process.env.APP_URL || process.env.BACKEND_URL}/password-recovery?token=${token}' style='background:#4f46e5;color:#fff;padding:12px 32px;border-radius:8px;text-decoration:none;font-weight:bold;'>Restablecer contraseña</a>
            </p>
            <p>Si no solicitaste este cambio, puedes ignorar este correo.</p>
            <p style='font-size:12px;color:#888;'>Este enlace expirará en 30 minutos.</p>
          </div>`;

      const baseUrl = process.env.FRONTEND_URL || process.env.APP_URL || process.env.BACKEND_URL;
      htmlContent = htmlContent.replace(/{{LINK}}/g, `${baseUrl}/password-recovery?token=${token}`);
      htmlContent = htmlContent.replace(/{{USERNAME}}/g, user.username);

      let transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          type: 'login',
          user: process.env.DANNBOT_MAIL_USER,
          pass: process.env.DANNBOT_MAIL_PASS
        }
      });
      const mailOptions = {
        from: "Tierra de Todos <" + process.env.DANNBOT_MAIL_USER + ">",
        to: user.email,
        subject: 'Restablecimiento de contraseña',
        text: `Solicitaste restablecer tu contraseña. Si no fuiste tú, ignora este correo. Enlace: ${baseUrl}/password-recovery?token=${token}`,
        html: htmlContent
      };
      await transporter.sendMail(mailOptions);
      if(req && req.logAction){
        await req.logAction({
          accion: "Correo de recuperación de contraseña enviado",
          apartado: "PasswordRecovery",
          userId: user.id,
          username: user.username,
          type: "info"
        });
      }
      return true;
    }
    return true;
  } catch (error) {
    if(req && req.logAction){
      await req.logAction({
        accion: error.message,
        apartado: "PasswordRecovery",
        userId: user?.id,
        username: user?.username,
        type: 'error'
      });
    }
    return false;
  }
};

