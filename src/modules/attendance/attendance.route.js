const express = require('express');
const   router = express.Router();
const attendanceController = require('./attendance.controller');
const authenticate = require('../../middleware/authenticate');
const authorize = require('../../middleware/authorize');


router.get(
  '/today',
  authenticate,
  attendanceController.getTodayStatus
);

router.post(
  '/punch-in',
  authenticate,
  authorize("attendance.punchin"),
  attendanceController.punchIn
);

router.post("/break/start",
  authenticate,
  authorize("attendance.punchin"),
  attendanceController.startBreak
)

router.post("/break/end",
  authenticate,
  authorize("attendance.punchin"),
  attendanceController.endBreak
)

router.post("/punch-out",
  authenticate,
  authorize("attendance.punchin"),
  attendanceController.punchOut
)

router.get("/my-records",
  authenticate,
  authorize("attendance.read_own"),
  attendanceController.getMyRecords
)

router.get("/all",
  authenticate,
  authorize("attendance.read_all"),
  attendanceController.getAllAttendance
)

router.put("/:id",
  authenticate,
  authorize("attendance.update"),
  attendanceController.updateAttendance
)
module.exports = router;