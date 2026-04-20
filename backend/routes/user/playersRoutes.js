import express from 'express';

import { ctrlPlayers } from '../../controllers/user/playersController.js';
import { verifyToken } from '../../middlewares/verifyToken.js';

const router = express.Router();

router.get('/players', verifyToken, ctrlPlayers.players);

export default router;
