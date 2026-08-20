import { Router } from 'express';
import { auth } from '../middlewares/auth.js';
import { requireModule } from '../middlewares/requireModule.js';
import { requirePermission } from '../middlewares/requirePermission.js';
import { PERMISSIONS } from '../lib/permissions.js';
import {
  listModulesController,
  updateModuleController,
} from '../controllers/moduleController.js';

const router = Router();

router.get('/', auth, requireModule('modules'), requirePermission(PERMISSIONS.MODULES_READ), listModulesController);
router.put('/:code', auth, requireModule('modules'), requirePermission(PERMISSIONS.MODULES_UPDATE), updateModuleController);

export default router;
