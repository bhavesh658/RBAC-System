const express = require('express');
const router = express.Router();
const userController = require('./user.controller');
const { createUserValidation } = require('./user.validation');
const authenticate = require('../../middleware/authenticate');
const authorize = require('../../middleware/authorize');
const validateRequest = require('../../middleware/validateRequest');
const validateObjectId = require('../../middleware/validateObjectId');


router.post(
  '/',
  authenticate,
  authorize('users.create'),
  createUserValidation,
  validateRequest,
  userController.createUser
);

router.get(
  '/',
  authenticate,
  authorize('users.read'),
  userController.getUsers
);

router.get(
  '/:id',
  authenticate,
  authorize('users.read'),
  validateObjectId,
  userController.getUserById
);

router.patch(
  '/:id',
  authenticate,
  authorize('users.update'),
  validateObjectId,
  validateRequest,
  userController.updateUser
);

router.patch(
  '/:id/toggle-status',
  authenticate,
  authorize('users.update'),
  validateObjectId,
  userController.toggleUserStatus
);

module.exports = router;