import express from 'express';

import { ctrlProgress } from '../../controllers/user/progressController.js';
import { ctrlAchievementProgress } from '../../controllers/user/achievementProgressController.js';
import { verifyToken } from '../../middlewares/verifyToken.js';

const router = express.Router();

router.get('/progress/emblems', verifyToken, ctrlProgress.getMyEmblems);
router.put('/progress/emblems', verifyToken, ctrlProgress.saveMyEmblemsLayout);
router.get('/progress/achievements', verifyToken, ctrlAchievementProgress.getAchievements);
router.get('/progress/stats', verifyToken, ctrlAchievementProgress.getStats);

export default router;
