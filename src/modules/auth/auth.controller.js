const asyncHandler = require('../../common/asyncHandler');
const sendResponse = require('../../common/apiResponse');
const HTTP_STATUS = require('../../constants/httpStatus');
const authService = require('./auth.service');
const TokenBlacklist = require('./tokenBlacklist.model');

const login = asyncHandler(async (req, res) => {

  const result = await authService.loginUser(req.body);
  const isProduction = process.env.NODE_ENV === 'production';

  res.cookie('accessToken', result.accessToken, {
    httpOnly: true,
    secure: isProduction,
    // Agar production hai toh 'none', local me 'lax' taaki browser cookie block na kare
    sameSite: isProduction ? 'none' : 'lax',
    maxAge: 24 * 60 * 60 * 1000, // 1 day
  });

  res.cookie('refreshToken', result.refreshToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
  const userResponse = {
    _id: result.user._id,
    firstName: result.user.firstName,
    lastName: result.user.lastName,
    fullName: result.user.fullName,
    email: result.user.email,
    phone: result.user.phone,
    isActive: result.user.isActive,
    department: result.user.department,
    role: result.user.role,
  };

  return sendResponse(
    res,
    HTTP_STATUS.OK,
    "Login successful",
    {
      user: userResponse,
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
  // 🚀 req.body.oldPassword ya req.body.currentPassword dono ko handle karne ke liye
  const currentPassword = req.body.oldPassword || req.body.currentPassword;

  const result = await authService.changePassword(
    req.user._id,
    currentPassword,
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