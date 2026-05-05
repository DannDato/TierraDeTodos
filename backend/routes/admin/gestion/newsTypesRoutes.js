import express from 'express';

import { ctrlNewsTypes } from '../../../controllers/admin/gestion/newsTypesController.js';
import { verifyToken } from '../../../middlewares/verifyToken.js';
import { checkPermissions } from '../../../middlewares/checkPermissions.js';

const router = express.Router();

router.get('/news-types', verifyToken, checkPermissions(['news_types.view']), ctrlNewsTypes.getAll);
router.post('/news-types', verifyToken, checkPermissions(['news_types.gest']), ctrlNewsTypes.create);
router.put('/news-types/:id', verifyToken, checkPermissions(['news_types.edit']), ctrlNewsTypes.update);
router.delete('/news-types/:id', verifyToken, checkPermissions(['news_types.remove']), ctrlNewsTypes.remove);

export default router;
