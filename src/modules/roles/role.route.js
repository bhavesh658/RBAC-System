const express = require('express');
const router = express.Router();
const roleController = require('./role.controller');
const { createRoleValidation } = require('./role.validation');
const validateRequest = require('../../middleware/validateRequest');
const authenticate = require('../../middleware/authenticate');
const authorize = require('../../middleware/authorize');
const validateObjectId = require('../../middleware/validateObjectId');


router.post(
  '/',
  authenticate,
  authorize('roles.create'),
  createRoleValidation,
  validateRequest,
  roleController.createRole
);

router.get(
  '/',
  authenticate,
  authorize('roles.read'),
  roleController.getAllRoles
);

router.get(
  '/department/:id',
  authenticate,
  authorize('roles.read'),
  validateObjectId,
  roleController.getRolesByDepartment
);

router.patch(
  '/:id/permissions',
  authenticate,
  authorize('roles.assignpermissions'),
  validateObjectId,
  validateRequest,
  roleController.assignPermissions
);

router.patch(
  '/:id/remove-permissions',
  authenticate,
  authorize('roles.assignpermissions'),
  validateObjectId,
  validateRequest,
  roleController.removePermissions
);

router.patch(
  '/:id',
  authenticate,
  authorize('roles.update'),
  validateObjectId,
  validateRequest,
  roleController.updateRole
);

router.patch(
  '/:id/toggle-status',
  authenticate,
  authorize('roles.update'), 
  validateObjectId,
  roleController.toggleRoleStatus
);

router.delete(
  '/:id',
  authenticate,
  authorize('roles.update'), 
  validateObjectId,
  roleController.deleteRole
);



module.exports = router;