const express = require('express');

const router = express.Router();

const departmentController = require('./department.controller');
const { createDepartmentValidation } = require('./department.validation');

const validateRequest = require('../../middleware/validateRequest');
const authenticate = require('../../middleware/authenticate');
const authorize = require('../../middleware/authorize');
const validateObjectId = require('../../middleware/validateObjectId');



router.post(
  '/',
  authenticate,
  authorize('departments.create'),
  createDepartmentValidation,
  validateRequest,
  departmentController.createDepartment
);

router.get(
  '/',
  authenticate,
  authorize('departments.read'),
  departmentController.getAllDepartments
);

router.get(
  '/:id',
  authenticate,
  authorize('departments.read'),
  validateObjectId,
  departmentController.getDepartmentById
);

router.patch(
  '/:id',
  authenticate,
  authorize('departments.update'),
  validateObjectId,
  validateRequest,
  departmentController.updateDepartment
);

router.patch(
  '/:id/assign-head',
  authenticate,
  authorize('departments.update'),
  validateObjectId,
  validateRequest,
  departmentController.assignHead
);

module.exports = router;