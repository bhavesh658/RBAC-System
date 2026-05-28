const asyncHandler = require('../../common/asyncHandler');
const sendResponse = require('../../common/apiResponse');
const HTTP_STATUS = require('../../constants/httpStatus');

const roleService = require('./role.service');

const createRole = asyncHandler(async (req, res) => {
  const role = await roleService.createRole(
    req.body,
    req.user._id
  );

  return sendResponse(
    res,
    HTTP_STATUS.CREATED,
    'Role created successfully',
    role
  );
});

const getRolesByDepartment = asyncHandler(async (req, res) => {
  const roles = await roleService.getRolesByDepartment(
    req.params.departmentId
  );

  return sendResponse(
    res,
    HTTP_STATUS.OK,
    'Roles fetched successfully',
    roles
  );
});

const assignPermissions = asyncHandler(async (req, res) => {
  const role = await roleService.assignPermissions(
    req.params.id,
    req.body.permissions
  );

  return sendResponse(
    res,
    HTTP_STATUS.OK,
    'Permissions added successfully',
    role
  );
});

const removePermissions = asyncHandler(async (req, res) => {
  const role = await roleService.removePermissions(
    req.params.id,
    req.body.permissions
  );

  return sendResponse(
    res,
    HTTP_STATUS.OK,
    'Permissions removed successfully',
    role
  );
});

const updateRole = asyncHandler(async (req, res) => {
  const role = await roleService.updateRole(
    req.params.id,
    req.body
  );

  return sendResponse(
    res,
    HTTP_STATUS.OK,
    'Role updated successfully',
    role
  );
});

const getAllRoles = asyncHandler(async (req, res) => {
  const roles = await roleService.getAllRoles(req.query);

  return sendResponse(
    res,
    HTTP_STATUS.OK,
    'Roles fetched successfully',
    roles
  );
});

module.exports = {
  createRole,
  getRolesByDepartment,
  assignPermissions,
  getAllRoles,
  updateRole,
  removePermissions,
};