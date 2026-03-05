import { logAction } from "../helpers/logger.js";

const injectLogAction = (req, res, next) => {

  req.logAction = async (config) => {

    try {

      const fecha = new Date();

      const userId = req.user?.id || null;
      const username = req.user?.username || null;

      const ip =
        req.headers['x-forwarded-for'] ||
        req.socket?.remoteAddress ||
        req.ip;

      const device = req.headers['user-agent'];

      await logAction({
        ...config,
        userId,
        username,
        ip,
        fecha,
        device
      });

    } catch (err) {
      console.error("Error registrando logAction:", err);
    }

  };

  next();
};

export default injectLogAction;