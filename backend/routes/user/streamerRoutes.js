import express from 'express';
import multer from 'multer';

import { ctrlStreamer } from '../../controllers/user/streamerController.js';
import { verifyToken } from '../../middlewares/verifyToken.js';

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
  fileFilter: (_req, file, cb) => {
    const allowedMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedMimes.includes(file?.mimetype || '')) {
      return cb(new Error(`Tipo de archivo no permitido: ${file?.mimetype || 'desconocido'}`));
    }
    return cb(null, true);
  },
});

const uploadStreamerImageOptional = (req, res, next) => {
  upload.single('image')(req, res, (error) => {
    if (!error) return next();

    if (error instanceof multer.MulterError) {
      if (error.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ message: 'El archivo supera el límite de 5MB' });
      }
      return res.status(400).json({ message: `Error de carga: ${error.message}` });
    }

    return res.status(400).json({ message: error.message || 'Archivo inválido' });
  });
};

router.get('/streamer', verifyToken, ctrlStreamer.getMyStreamer);
router.put('/streamer', verifyToken, uploadStreamerImageOptional, ctrlStreamer.upsertMyStreamer);

export default router;