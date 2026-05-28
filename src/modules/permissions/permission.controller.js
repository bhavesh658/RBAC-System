const asyncHandler = require('../../common/asyncHandler');
const sendResponse = require('../../common/apiResponse');
const HTTP_STATUS = require('../../constants/httpStatus');

const permissionService = require('./permission.service');

const getAllPermissions = asyncHandler(async (req, res) => {
    const permissions = await permissionService.getAllPermissions(
         req.query
    );

    return sendResponse(
        res,
        HTTP_STATUS.OK,
        'Permissions fetched successfully',
        permissions
    );
});

module.exports = {
    getAllPermissions,
};