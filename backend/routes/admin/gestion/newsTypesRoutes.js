import express from 'express';

import { ctrlNewsTypes } from '../../../controllers/admin/gestion/newsTypesController.js';
import { verifyToken } from '../../../middlewares/verifyToken.js';
import { checkPermissions } from '../../../middlewares/checkPermissions.js';

const router = express.Router();

router.get('/news-types', verifyToken, checkPermissions(['catalog.news_type.view']), ctrlNewsTypes.getAll);
router.post('/news-types', verifyToken, checkPermissions(['catalog.news_type.gest']), ctrlNewsTypes.create);
router.put('/news-types/:id', verifyToken, checkPermissions(['catalog.news_type.edit']), ctrlNewsTypes.update);
router.delete('/news-types/:id', verifyToken, checkPermissions(['catalog.news_type.remove']), ctrlNewsTypes.remove);

export default router;

