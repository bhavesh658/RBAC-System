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
    let token = null;

    // Get token from Authorization header
    const authHeader = req.headers.authorization;

    if (authHeader?.startsWith('Bearer ')) {
        token = authHeader.split(' ')[1];
    }

    // Fallback to cookie
    if (!token && req.cookies?.accessToken) {
        token = req.cookies.accessToken;
    }

    if (!token) {
        throw new AppError(
            'Authentication token is required',
            HTTP_STATUS.UNAUTHORIZED
        );
    }

    // Verify JWT first (avoids unnecessary DB query)
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

    // Check token blacklist
    const blacklistedToken =
        await TokenBlacklist.findOne({ token }).lean();

    if (blacklistedToken) {
        throw new AppError(
            'Token has been revoked',
            HTTP_STATUS.UNAUTHORIZED
        );
    }

    // Load authenticated user
    const user = await User.findById(decoded.sub)
        .select('-password')
        .populate('department', 'name code')
        .populate({
            path: 'role',
            select: 'name permissions',
            populate: {
                path: 'permissions',
                select: 'name module action description',
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

    req.user = user;

    next();
});

module.exports = authenticate;