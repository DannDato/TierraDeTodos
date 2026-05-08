import express from 'express';

import { ctrlCredential } from '../../controllers/user/credentialController.js';
import { verifyToken } from '../../middlewares/verifyToken.js';

const router = express.Router();

router.get('/credential', verifyToken, ctrlCredential.credential);

export default router;

