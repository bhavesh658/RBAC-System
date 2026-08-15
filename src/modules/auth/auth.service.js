const Department = require('../departments/department.model');
const Role = require('../roles/role.model');
const User = require('../users/user.model');
const AppError = require('../../common/AppError');
const HTTP_STATUS = require('../../constants/httpStatus');
const { generateAccessToken, generateRefreshToken, sendEmail } = require('./auth.utils');
const TokenBlacklist = require('./tokenBlacklist.model');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const loginUser = async ({email,password,}) => {
    const user = await User.findOne({
        email: email.toLowerCase(),
    })
        .select("+password")


    if (!user) {
        throw new AppError(
            "Invalid email or password",
            HTTP_STATUS.UNAUTHORIZED
        );
    }

    if (!user.isActive) {
        throw new AppError(
            "Your account is inactive. Please contact the administrator.",
            HTTP_STATUS.FORBIDDEN
        );
    }

    const isPasswordValid =
        await user.comparePassword(password);

    if (!isPasswordValid) {
        throw new AppError(
            "Invalid password",
            HTTP_STATUS.UNAUTHORIZED
        );
    }

    const accessToken =generateAccessToken(user);
    const refreshToken =generateRefreshToken(user);
    await User.updateOne(
        { _id: user._id },
        {
            $set: {
                lastLoginAt: new Date(),
                refreshToken,
            },
        }
    );
    user.password = undefined;


    return {
        accessToken,
        refreshToken,
        user,
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
    try {
        
        const user = await User.findOne({
            email: email.toLowerCase(),
        });

        if (!user) {
            throw new AppError(
                'If an account exists with this email, a password reset link has been sent.',
                404 
            );
        }

        const resetToken = crypto.randomBytes(32).toString('hex');
        const hashedToken = crypto
            .createHash('sha256')
            .update(resetToken)
            .digest('hex');

        user.resetPasswordToken = hashedToken;
        user.resetPasswordTokenExpires = new Date(
            Date.now() + 15 * 60 * 1000
        );

        await user.save({ validateBeforeSave: false });

        const frontendUrl = process.env.CLIENT_URL;
        
        const resetUrl = `${frontendUrl}/reset-password/${resetToken}`;

        
        try {
            await sendEmail({
                to: user.email,
                subject: 'Reset Your RBAC Password',
                html: `
                  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
                    <h2 style="color: #333;">RBAC System Password Reset</h2>
                    <p>You recently requested to reset your password for your account.</p>
                    <p>Click the button below to set a new password:</p>
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${resetUrl}" style="background-color: #FF6600; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Reset Password</a>
                    </div>
                    <p style="color: #666; font-size: 14px;">This link is valid for 15 minutes. If you did not request this, please ignore this email.</p>
                    <hr style="border: none; border-top: 1px solid #eee; margin-top: 30px;" />
                    <p style="color: #999; font-size: 12px;">If the button doesn't work, copy and paste this link into your browser:<br/>${resetUrl}</p>
                  </div>
                `,
            });
        } catch (emailError) {
            
            user.resetPasswordToken = undefined;
            user.resetPasswordTokenExpires = undefined;
            await user.save({ validateBeforeSave: false });

            throw new AppError('There was an error sending the email. Try again later!', 500);
        }

        return {
            message: 'If an account exists with this email, a password reset link has been sent.',
        };
        
    } catch (error) {
        throw error;
    }
};


const resetPassword = async (token, newPassword) => {
    const hashedToken = crypto
        .createHash('sha256')
        .update(token)
        .digest('hex');

    const user = await User.findOne({
        resetPasswordToken: hashedToken,
        resetPasswordTokenExpires: {
            $gt: new Date(),
        },
    });

    if (!user) {
        throw new AppError(
            'Token is invalid or has expired. Please request a new link.',
            HTTP_STATUS.BAD_REQUEST
        );
    }

    user.password = newPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordTokenExpires = undefined;

    await user.save();

    return {
        message: 'Password reset successfully. You can now login.',
    };
};
const changePassword = async (userId, currentPassword, newPassword) => {
    const user = await User.findById(userId).select('+password');
    
    if (!user) {
        throw new AppError('User not found', HTTP_STATUS.NOT_FOUND);
    }
    
    // Check if current password matches
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
        throw new AppError('Current password is incorrect', HTTP_STATUS.BAD_REQUEST);
    }
    
    // Set new password (Mongoose pre-save hook automatically hash kar dega)
    user.password = newPassword;
    await user.save();

    return {
        message: 'Password changed successfully',
    };
};

module.exports = {
    loginUser, forgotPassword, resetPassword, changePassword, logoutUser
};