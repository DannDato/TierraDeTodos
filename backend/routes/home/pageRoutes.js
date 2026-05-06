import express from 'express';

import { ctrlPage } from '../../controllers/home/pageController.js';

const router = express.Router();

router.get('/news', ctrlPage.getLatestNews);
router.get('/rules', ctrlPage.getActiveEditionRules);
router.get('/timeline', ctrlPage.getActiveEditionTimeline);

export default router;

