const asyncHandler = require('../../common/asyncHandler');
const sendResponse = require('../../common/apiResponse');
const HTTP_STATUS = require('../../constants/httpStatus');
const authService = require('./auth.service');
const TokenBlacklist = require('./tokenBlacklist.model');

const login = asyncHandler(async (req, res) => {
  
  const result = await authService.loginUser(req.body);

  res.cookie('accessToken', result.accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 24 * 60 * 60 * 1000, // 1 day
  });
  res.cookie(
      'refreshToken',
      result.refreshToken,
      {
        httpOnly: true,
        secure:
          process.env.NODE_ENV ===
          'production',
        sameSite: 'strict',
        maxAge:
          7 * 24 * 60 * 60 * 1000,
      }
    );
  return sendResponse(
    res,
    HTTP_STATUS.OK,
    'Login successful',
    {
      user: result.user,
    }
  );
});


const logout = asyncHandler(async (req, res) => {
  const accessToken =
    req.cookies?.accessToken;

  const refreshToken =
    req.cookies?.refreshToken;


  // Service call
  await authService.logoutUser(
    accessToken,
    refreshToken
  );

  
  res.clearCookie('accessToken', {
    httpOnly: true,
    secure:
      process.env.NODE_ENV ===
      'production',
    sameSite: 'strict',
  });

  res.clearCookie('refreshToken', {
    httpOnly: true,
    secure:
      process.env.NODE_ENV ===
      'production',
    sameSite: 'strict',
  });

  return sendResponse(
    res,
    HTTP_STATUS.OK,
    'Logged out successfully',
    null
  );
});

const getProfile = asyncHandler(async (req, res) => {
  return sendResponse(
    res,
    HTTP_STATUS.OK,
    'Profile fetched successfully',
    req.user
  );
});


const forgotPassword = asyncHandler(async (req, res) => {
  const result =
    await authService.forgotPassword(
      req.body.email
    );

  return sendResponse(
    res,
    HTTP_STATUS.OK,
    result.message
  );
});

const resetPassword = asyncHandler(async (req, res) => {
  const result =
    await authService.resetPassword(
      req.body.email,
      req.body.otp,
      req.body.newPassword
    );

  return sendResponse(
    res,
    HTTP_STATUS.OK,
    result.message
  );
});

const changePassword = asyncHandler(async (req, res) => {

  const result =
    await authService.changePassword(
      req.user._id,
      req.body.currentPassword,
      req.body.newPassword
    );

  return sendResponse(
    res,
    HTTP_STATUS.OK,
    result.message
  );
});

module.exports = {
  login, getProfile, logout, forgotPassword, resetPassword, changePassword
};