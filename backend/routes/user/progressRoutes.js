import express from 'express';

import { ctrlProgress } from '../../controllers/user/progressController.js';
import { verifyToken } from '../../middlewares/verifyToken.js';

const router = express.Router();

router.get('/progress/emblems', verifyToken, ctrlProgress.getMyEmblems);
router.put('/progress/emblems', verifyToken, ctrlProgress.saveMyEmblemsLayout);

export default router;