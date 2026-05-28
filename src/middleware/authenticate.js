const jwt = require('jsonwebtoken');

const User = require('../modules/users/user.model');
require('../modules/departments/department.model');
require('../modules/roles/role.model');
require('../modules/permissions/permission.model');
const TokenBlacklist = require('../modules/auth/tokenBlacklist.model');

const AppError = require('../common/AppError');
const HTTP_STATUS = require('../constants/httpStatus');
const asyncHandler = require('../common/asyncHandler');

const authenticate = asyncHandler(async (req, res, next) => {
  const authHeader = req.headers.authorization;
  let token = null;

  // Get token from Authorization header
  if (
    authHeader &&
    authHeader.startsWith('Bearer ')
  ) {
    token = authHeader.split(' ')[1];
  }

  // Get token from cookies
  if (!token && req.cookies?.accessToken) {
    token = req.cookies.accessToken;
  }

  // Token required
  if (!token) {
    throw new AppError(
      'Authentication token is required',
      HTTP_STATUS.UNAUTHORIZED
    );
  }

  const blacklistedToken =
    await TokenBlacklist.findOne({
      token,
    });

  if (blacklistedToken) {
    throw new AppError(
      'Token has been revoked',
      HTTP_STATUS.UNAUTHORIZED
    );
  }

  // Verify token
  let decoded;



  try {
    decoded = jwt.verify(
      token,
      process.env.JWT_ACCESS_SECRET
    );
  } catch (error) {
    throw new AppError(
      'Invalid or expired token',
      HTTP_STATUS.UNAUTHORIZED
    );
  }

  // Load current user with department, role and permissions
  const user = await User.findById(decoded.sub)
    .select('-password')
    .populate('department', 'name code')
    .populate({
      path: 'role',
      select: 'name permissions',
      populate: {
        path: 'permissions',
        select:
          'name module action description',
      },
    });

  if (!user) {
    throw new AppError(
      'User not found',
      HTTP_STATUS.UNAUTHORIZED
    );
  }

  if (!user.isActive) {
    throw new AppError(
      'Your account is inactive',
      HTTP_STATUS.FORBIDDEN
    );
  }

  // Attach authenticated user to request
  req.user = user;


  next();
});

module.exports = authenticate;