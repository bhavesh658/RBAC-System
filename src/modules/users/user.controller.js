const asyncHandler = require('../../common/asyncHandler');
const sendResponse = require('../../common/apiResponse');
const HTTP_STATUS = require('../../constants/httpStatus');
const userService = require('./user.service');

const createUser = asyncHandler(async (req, res) => {
  const user = await userService.createUser(
    req.body,
    req.user._id
  );

  return sendResponse(
    res,
    HTTP_STATUS.CREATED,
    'User created successfully',
    user
  );
});

const getUsers = asyncHandler(async (req, res) => {
  const users = await userService.getUsers({}, req.query);

  return sendResponse(
    res,
    HTTP_STATUS.OK,
    'Users fetched successfully',
    users
  );
});

const getUserById = asyncHandler(async (req, res) => {
  const user = await userService.getUserById(req.params.id);

  return sendResponse(
    res,
    HTTP_STATUS.OK,
    'User fetched successfully',
    user
  );
});

const updateUser = asyncHandler(async (req, res) => {
  const user = await userService.updateUser(
    req.params.id,
    req.body
  );

  return sendResponse(
    res,
    HTTP_STATUS.OK,
    'User updated successfully',
    user
  );
});

const toggleUserStatus = asyncHandler(async (req, res) => {
  const user = await userService.toggleUserStatus(req.params.id);

  return sendResponse(
    res,
    HTTP_STATUS.OK,
    'User status updated successfully',
    user
  );
});

module.exports = {
  createUser,
  getUsers,
  getUserById,
  updateUser,
  toggleUserStatus,
};