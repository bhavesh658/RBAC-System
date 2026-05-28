const asyncHandler = require('../../common/asyncHandler');
const sendResponse = require('../../common/apiResponse');
const HTTP_STATUS = require('../../constants/httpStatus');

const attendanceService = require('./attendance.service');

const punchIn = asyncHandler(async (req, res) => {
  const data = await attendanceService.punchIn(req.user._id);

  return sendResponse(
    res,
    HTTP_STATUS.OK,
    'Punched in successfully',
    data
  );
});

const punchOut = asyncHandler(async (req, res) => {
  const data = await attendanceService.punchOut(req.user._id);

  return sendResponse(
    res,
    HTTP_STATUS.OK,
    'Punched out successfully',
    data
  );
});

module.exports = {
  punchIn,
  punchOut,
};