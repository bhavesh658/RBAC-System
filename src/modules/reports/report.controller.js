const asyncHandler = require('../../common/asyncHandler');
const sendResponse = require('../../common/apiResponse');
const HTTP_STATUS = require('../../constants/httpStatus');

const reportService = require('./report.service');

const getDailyReport = asyncHandler(async (req, res) => {
  const data = await reportService.getDailyReport(
    req.query.date
  );

  return sendResponse(
    res,
    HTTP_STATUS.OK,
    'Daily report fetched successfully',
    data
  );
});


const getMonthlyReport = asyncHandler(async (req, res) => {
  const { month, year } = req.query;

  const data = await reportService.getMonthlyReport(
    Number(month),
    Number(year)
  );

  return sendResponse(
    res,
    HTTP_STATUS.OK,
    'Monthly report fetched successfully',
    data
  );
});


const getDepartmentReport = asyncHandler(async (req, res) => {
  const data = await reportService.getDepartmentReport(
    req.params.departmentId
  );

  return sendResponse(
    res,
    HTTP_STATUS.OK,
    'Department report fetched successfully',
    data
  );
});

module.exports = {
  getDailyReport,
  getMonthlyReport,
  getDepartmentReport,
};