/** Catálogo central de códigos de permiso (module.action). */
export const PERMISSIONS = {
  PRODUCTS_CREATE: 'products.create',
  PRODUCTS_READ: 'products.read',
  PRODUCTS_UPDATE: 'products.update',
  PRODUCTS_DELETE: 'products.delete',

  CATEGORIES_CREATE: 'categories.create',
  CATEGORIES_READ: 'categories.read',
  CATEGORIES_UPDATE: 'categories.update',
  CATEGORIES_DELETE: 'categories.delete',

  BRANDS_CREATE: 'brands.create',
  BRANDS_READ: 'brands.read',
  BRANDS_UPDATE: 'brands.update',
  BRANDS_DELETE: 'brands.delete',

  UNITS_CREATE: 'units.create',
  UNITS_READ: 'units.read',
  UNITS_UPDATE: 'units.update',
  UNITS_DELETE: 'units.delete',

  SUPPLIERS_CREATE: 'suppliers.create',
  SUPPLIERS_READ: 'suppliers.read',
  SUPPLIERS_UPDATE: 'suppliers.update',
  SUPPLIERS_DELETE: 'suppliers.delete',

  INVENTORY_READ: 'inventory.read',
  INVENTORY_CREATE_MOVEMENT: 'inventory.create_movement',
  INVENTORY_ADJUST: 'inventory.adjust',
  INVENTORY_VIEW_HISTORY: 'inventory.view_history',

  CUSTOMERS_CREATE: 'customers.create',
  CUSTOMERS_READ: 'customers.read',
  CUSTOMERS_UPDATE: 'customers.update',
  CUSTOMERS_DELETE: 'customers.delete',

  QUOTATIONS_CREATE: 'quotations.create',
  QUOTATIONS_READ: 'quotations.read',
  QUOTATIONS_UPDATE: 'quotations.update',
  QUOTATIONS_DELETE: 'quotations.delete',
  QUOTATIONS_CONVERT: 'quotations.convert',
  QUOTATIONS_EXPORT_PDF: 'quotations.export_pdf',

  CONFIG_READ: 'config.read',
  CONFIG_UPDATE: 'config.update',

  MODULES_READ: 'modules.read',
  MODULES_UPDATE: 'modules.update',
};

/** Módulo al que pertenece cada permiso (para el guard de módulo activo). */
export const PERMISSION_MODULES = Object.fromEntries(
  Object.values(PERMISSIONS).map((code) => [code, code.split('.')[0]])
);
