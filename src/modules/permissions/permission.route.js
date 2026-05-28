const express = require('express');

const router = express.Router();

const permissionController = require('./permission.controller');

const authenticate = require('../../middleware/authenticate');
const authorize = require('../../middleware/authorize');

router.get(
    '/',
    authenticate,
    authorize('permissions.read'),
    permissionController.getAllPermissions
);

module.exports = router;