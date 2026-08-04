const asyncHandler = require('../../common/asyncHandler');

const sendResponse = require('../../common/apiResponse');

const HTTP_STATUS = require('../../constants/httpStatus');

const activityLogService = require('./activityLog.service');

const getAllActivityLogs = asyncHandler(async (req, res) => {
    const result = await activityLogService.getAllActivityLogs(req.query);
    
    return sendResponse(
        res,
        HTTP_STATUS.OK,
        'Activity logs fetched successfully',
        result 
    );
});

module.exports = {
  getAllActivityLogs,
};