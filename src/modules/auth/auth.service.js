const Department = require('../departments/department.model');
const Role = require('../roles/role.model');
const User = require('../users/user.model');
const AppError = require('../../common/AppError');
const HTTP_STATUS = require('../../constants/httpStatus');
const { generateAccessToken, generateRefreshToken,sendEmail } = require('./auth.utils');
const crypto = require('crypto');
const TokenBlacklist = require('./tokenBlacklist.model');
const jwt = require('jsonwebtoken');

const loginUser = async ({ email, password }) => {

    const user = await User.findOne({
        email: email.toLowerCase(),
    })
        .select('+password')
        .populate('department', 'name code')
        .populate('role', 'name');

    if (!user) {
        throw new AppError(
            'Invalid email or password',
            HTTP_STATUS.UNAUTHORIZED
        );
    }

    if (!user.isActive) {
        throw new AppError(
            'Your account is inactive. Please contact the administrator.',
            HTTP_STATUS.FORBIDDEN
        );
    }

    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
        throw new AppError(
            'Invalid email or password',
            HTTP_STATUS.UNAUTHORIZED
        );
    }

    // Update last login timestamp
    user.lastLoginAt = new Date();
    await user.save();

    // Generate JWT
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);
    user.refreshToken = refreshToken;

    await user.save();
    // Remove password before returning
    user.password = undefined;

    return {
        accessToken,
        user,
        refreshToken,
    };
};


const logoutUser = async (
    accessToken,
    refreshToken
) => {

    if (accessToken) {
        const decoded = jwt.decode(
            accessToken
        );

        if (decoded?.exp) {
            await TokenBlacklist.create({
                token: accessToken,

                expiresAt: new Date(
                    decoded.exp * 1000
                ),
            });
        }
    }


    if (refreshToken) {
        await User.findOneAndUpdate(
            { refreshToken },
            {
                refreshToken: null,
            }
        );
    }

    return true;
};



const forgotPassword = async (email) => {
    const user = await User.findOne({
        email: email.toLowerCase(),
    });

    if (!user) {
        throw new AppError(
            'If an account exists with this email, a password reset OTP has been sent.',
            HTTP_STATUS.NOT_FOUND
        );
    }

    // Generate 6-digit OTP
    const otp = Math.floor(
        100000 + Math.random() * 900000
    ).toString();

    // Hash OTP
    const hashedOtp = crypto
        .createHash('sha256')
        .update(otp)
        .digest('hex');

    // Save hashed OTP and expiry (10 minutes)
    user.resetPasswordOtp = hashedOtp;
    user.resetPasswordOtpExpires = new Date(
        Date.now() + 10 * 60 * 1000
    );

    // Save without validation
    await user.save({ validateBeforeSave: false });

    // Send email
    await sendEmail({
        to: user.email,
        subject: 'Reset Password OTP',
        html: `
      <h2>RBAC System Password Reset</h2>
      <p>Your OTP is:</p>
      <h1>${otp}</h1>
      <p>This OTP is valid for 10 minutes.</p>
    `,
    });

    return {
        message: 'If an account exists with this email, a password reset OTP has been sent.',
    };
};

/**
 * Reset Password
 */
const resetPassword = async (
    email,
    otp,
    newPassword
) => {
    const hashedOtp = crypto
        .createHash('sha256')
        .update(otp)
        .digest('hex');

    const user = await User.findOne({
        email: email.toLowerCase(),
        resetPasswordOtp: hashedOtp,
        resetPasswordOtpExpires: {
            $gt: new Date(),
        },
    });

    if (!user) {
        throw new AppError(
            'Invalid or expired OTP',
            HTTP_STATUS.BAD_REQUEST
        );
    }

    // Update password
    user.password = newPassword;

    // Clear OTP fields
    user.resetPasswordOtp = null;
    user.resetPasswordOtpExpires = null;

    // Password hash pre-save hook automatically run hoga
    await user.save();

    return {
        message: 'Password reset successfully',
    };
};

const changePassword = async (userId, currentPassword, newPassword) => {
    const user = await User.findById(userId).select('+password');
    if (!user) {
        throw new AppError('User not found', HTTP_STATUS.NOT_FOUND);
    }
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
        throw new AppError('Current password is incorrect', HTTP_STATUS.BAD_REQUEST);
    }
    user.password = newPassword;
    await user.save();
    return {
        message: 'Password changed successfully',
    };
}


module.exports = {
    loginUser, forgotPassword, resetPassword, changePassword, logoutUser
};