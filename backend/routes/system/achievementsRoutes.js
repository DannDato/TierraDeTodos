import express from 'express';

import { ctrlAchievements } from '../../controllers/system/achievementsController.js';
import { verifyToken } from '../../middlewares/verifyToken.js';
import { checkPermissions } from '../../middlewares/checkPermissions.js';
import { uploadsCheck } from '../../utils/uploadsCheck.js';

const router = express.Router();

router.get('/achievements/catalog', verifyToken, checkPermissions(['emblems.view', 'goals.view', 'emblems.gest', 'goals.gest']), ctrlAchievements.getAchievementCatalog);

router.get('/achievements/users', verifyToken, checkPermissions(['emblems.give']), ctrlAchievements.getAssignableUsers);
router.get('/achievements/user-emblems', verifyToken, checkPermissions(['emblems.give']), ctrlAchievements.getUserEmblems);
router.post('/achievements/user-emblems', verifyToken, checkPermissions(['emblems.give']), ctrlAchievements.createUserEmblem);
router.patch('/achievements/user-emblems/:id', verifyToken, checkPermissions(['emblems.give']), ctrlAchievements.updateUserEmblem);
router.delete('/achievements/user-emblems/:id', verifyToken, checkPermissions(['emblems.give']), ctrlAchievements.deleteUserEmblem);

router.get('/achievements/emblems', verifyToken, checkPermissions(['emblems.view']), ctrlAchievements.getEmblems);
router.post('/achievements/emblems/upload-icon', verifyToken, checkPermissions(['emblems.gest', 'emblems.edit']), uploadsCheck({ type: 'image', field: 'emblemIcon', maxSizeMb: 5 }), ctrlAchievements.uploadEmblemIcon);
router.post('/achievements/emblems', verifyToken, checkPermissions(['emblems.gest']), ctrlAchievements.createEmblem);
router.put('/achievements/emblems/:id', verifyToken, checkPermissions(['emblems.edit']), ctrlAchievements.updateEmblem);
router.delete('/achievements/emblems/:id', verifyToken, checkPermissions(['emblems.remove']), ctrlAchievements.deleteEmblem);

router.get('/achievements/goals', verifyToken, checkPermissions(['goals.view']), ctrlAchievements.getGoals);
router.post('/achievements/goals', verifyToken, checkPermissions(['goals.gest']), ctrlAchievements.createGoal);
router.put('/achievements/goals/:id', verifyToken, checkPermissions(['goals.edit']), ctrlAchievements.updateGoal);
router.delete('/achievements/goals/:id', verifyToken, checkPermissions(['goals.remove']), ctrlAchievements.deleteGoal);

export default router;
