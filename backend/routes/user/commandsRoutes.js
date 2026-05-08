import express from 'express';

import { ctrlCommands } from '../../controllers/user/commandsController.js';
import { verifyToken } from '../../middlewares/verifyToken.js';

const router = express.Router();

router.get('/commands', verifyToken, ctrlCommands.getUserCommands);

export default router;

