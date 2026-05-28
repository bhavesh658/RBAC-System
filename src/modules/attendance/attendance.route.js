const express = require('express');

const router = express.Router();

const attendanceController = require('./attendance.controller');

const authenticate = require('../../middleware/authenticate');
const authorize = require('../../middleware/authorize');


router.post(
  '/punch-in',
  authenticate,
  authorize('attendance.punchin'),
  attendanceController.punchIn
);

router.post(
  '/punch-out',
  authenticate,
  authorize('attendance.punchout'),
  attendanceController.punchOut
);

module.exports = router;