const express = require('express');

const router = express.Router();

const reportController = require('./report.controller');
const validateRequest = require('../../middleware/validateRequest');
const validateObjectId = require('../../middleware/validateObjectId');
const authenticate = require('../../middleware/authenticate');
const authorize = require('../../middleware/authorize');



router.get(
  '/daily',
  authenticate,
  authorize('reports.read'),
  validateRequest,
  reportController.getDailyReport
);

router.get(
  '/monthly',
  authenticate,
  authorize('reports.read'),
  validateRequest,
  reportController.getMonthlyReport
);

router.get(
  '/department/:departmentId',
  authenticate,
  authorize('reports.read'),
  validateObjectId,
  reportController.getDepartmentReport
);

module.exports = router;