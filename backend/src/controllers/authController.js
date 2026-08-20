import { ah, ok } from '../lib/response.js';
import { login, logout } from '../services/authService.js';
import { findAllModules } from '../repositories/modules.repo.js';
import { pool } from '../db/pool.js';

export const loginController = ah(async (req, res) => {
  const result = await login(req.body);
  return ok(res, result);
});

export const logoutController = ah(async (req, res) => {
  await logout(req.auth.userId);
  return ok(res, { loggedOut: true });
});

export const meController = ah(async (req, res) => {
  const modules = await findAllModules(pool);
  return ok(res, {
    id: req.auth.userId,
    email: req.auth.email,
    name: req.auth.name,
    role: req.auth.role,
    permissions: req.auth.permissions,
    modules,
  });
});
