import { Router } from 'express';
import authRoutes from './auth.routes.js';
import productsRoutes from './products.routes.js';
import catalogRoutes from './catalog.routes.js';
import inventoryRoutes from './inventory.routes.js';
import customersRoutes from './customers.routes.js';
import quotationsRoutes from './quotations.routes.js';
import modulesRoutes from './modules.routes.js';
import configRoutes from './config.routes.js';
import storageRoutes from './storage.routes.js';

const router = Router();

// Healthcheck (sin autenticación — usado por Render y monitorización)
router.get('/health', (req, res) => {
  res.json({
    data: { status: 'ok', uptime: process.uptime(), timestamp: new Date().toISOString() },
    meta: null,
    error: null,
  });
});

router.use('/auth', authRoutes);
router.use('/products', productsRoutes);
router.use('/categories', catalogRoutes('categories'));
router.use('/brands', catalogRoutes('brands'));
router.use('/units', catalogRoutes('units'));
router.use('/suppliers', catalogRoutes('suppliers'));
router.use('/inventory', inventoryRoutes);
router.use('/customers', customersRoutes);
router.use('/quotations', quotationsRoutes);
router.use('/modules', modulesRoutes);
router.use('/config', configRoutes);
router.use('/storage', storageRoutes);

export default router;
