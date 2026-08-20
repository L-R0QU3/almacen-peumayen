import { Router } from 'express';
import { auth } from '../middlewares/auth.js';
import { requireModule } from '../middlewares/requireModule.js';
import { requirePermission } from '../middlewares/requirePermission.js';
import { PERMISSIONS } from '../lib/permissions.js';
import { getConfigController, updateConfigController } from '../controllers/configController.js';

const router = Router();

router.get('/', auth, requireModule('config'), requirePermission(PERMISSIONS.CONFIG_READ), getConfigController);
router.put('/', auth, requireModule('config'), requirePermission(PERMISSIONS.CONFIG_UPDATE), updateConfigController);

export default router;
