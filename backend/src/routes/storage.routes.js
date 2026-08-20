import { Router } from 'express';
import { auth } from '../middlewares/auth.js';
import { requireModule } from '../middlewares/requireModule.js';
import { requirePermission } from '../middlewares/requirePermission.js';
import { PERMISSIONS } from '../lib/permissions.js';
import { ah, ok } from '../lib/response.js';
import { presignLogoUpload } from '../services/storageService.js';

const router = Router();

// URL firmada para subir/reemplazar el logo. Solo ADMIN (config.update).
router.post(
  '/logo/presign',
  auth,
  requireModule('config'),
  requirePermission(PERMISSIONS.CONFIG_UPDATE),
  ah(async (req, res) => {
    return ok(res, await presignLogoUpload());
  })
);

export default router;
