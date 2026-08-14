const User = require('./user.model');
const AppError = require('../../common/AppError');
const HTTP_STATUS = require('../../constants/httpStatus');
const pagination = require('../../common/pagination');
const { createActivityLog } = require('../activity-logs/activityLog.service')
const crypto = require('crypto');
const sendEmail = require('../auth/auth.utils').sendEmail;



const createUser = async (data, createdBy) => {
  const email = data.email.trim().toLowerCase();
  const currentuser = await User.findById(createdBy);
  const existing = await User.findOne({ email }).populate('createdBy', 'firstName lastName');
  
  if (existing) {
    throw new AppError(
      'User already exists with this email',
      HTTP_STATUS.CONFLICT
    );
  }

  const inviteToken = crypto.randomBytes(20).toString('hex');
  const inviteTokenExpire = Date.now() + 24 * 60 * 60 * 1000;

  const userData = { ...data };
  delete userData.password;

  const user = await User.create({
    ...userData,
    email,
    createdBy,
    status: 'Pending',
    inviteToken: inviteToken,
    inviteTokenExpire: inviteTokenExpire,
  });

  await user.populate([
    { path: 'department', select: 'name -_id' },
    { path: 'role', select: 'name -_id' }
  ]);

  const frontendURL = process.env.CLIENT_URL || 'http://localhost:5173';
  const setupUrl = `${frontendURL}/setup-password/${inviteToken}`;

  const emailHtml = `
  <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f4f7f6; padding: 40px 20px;">
    <div style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.05);">
      <!-- Header Area -->
      <div style="background-color: #FF6600; padding: 30px 20px; text-align: center;">
        <h1 style="color: #ffffff; margin: 0; font-size: 26px; font-weight: 700; letter-spacing: 0.5px;">
          Syandrix Infotech
        </h1>
      </div>

      <!-- Body Content -->
      <div style="padding: 40px 30px;">
        <h2 style="margin-top: 0; color: #1a1a1a; font-size: 22px; font-weight: 600;">
          Welcome to the family!
        </h2>
        <p style="font-size: 16px; line-height: 1.6; color: #4a4a4a; margin-bottom: 20px;">
          Hello <strong>${user.firstName}</strong>,
        </p>
        <p style="font-size: 16px; line-height: 1.6; color: #4a4a4a; margin-bottom: 25px;">
          You have been invited by the management to join the <strong>Syandrix Infotech Management Console</strong>. We are thrilled to have you on board!
        </p>
        <p style="font-size: 16px; line-height: 1.6; color: #4a4a4a; margin-bottom: 35px;">
          To get started, please click the button below to set up your secure password and activate your account.
        </p>

        <!-- Call to Action Button -->
        <div style="text-align: center; margin: 40px 0;">
          <a href="${setupUrl}" style="background-color: #FF6600; color: #ffffff; text-decoration: none; padding: 14px 35px; font-size: 16px; font-weight: bold; border-radius: 50px; display: inline-block;">
            Set Up Password
          </a>
        </div>

        <p style="font-size: 14px; color: #888888; text-align: center; margin-top: 30px; border-top: 1px solid #eeeeee; padding-top: 20px;">
          <em>Note: This secure link is valid for <strong>24 hours</strong> only.</em>
        </p>
      </div>

      <!-- Footer -->
      <div style="background-color: #f9f9f9; padding: 20px; text-align: center; border-top: 1px solid #eeeeee;">
        <p style="margin: 0; font-size: 12px; color: #999999;">
          &copy; ${new Date().getFullYear()} Syandrix Infotech. All rights reserved.
        </p>
        <p style="margin: 5px 0 0; font-size: 12px; color: #999999;">
          This is an automated system email. Please do not reply.
        </p>
      </div>
    </div>
  </div>
  `;

  try {
    await sendEmail({
      to: user.email,
      subject: 'Invitation to Join RBAC System - Setup Your Account',
      html: emailHtml,
    });
  } catch (emailError) {
    await User.findByIdAndDelete(user._id);
    throw new AppError(
      'User created but failed to send invitation email. Process reverted.',
      HTTP_STATUS.INTERNAL_SERVER_ERROR
    );
  }

  await createActivityLog({
    module: 'User',
    action: 'Create',
    description: `${currentuser.firstName} ${currentuser.lastName} created user ${user.firstName} ${user.lastName} (Invitation Sent)`,
    recordId: user._id,
    performedBy: currentuser._id,
    metadata: {
      newValue: {
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        department: user.department,
        status: 'Pending'
      },
    },
  });

  return user;
};



const setupPassword = async (token, newPassword) => {
  const user = await User.findOne({
    inviteToken: token,
    inviteTokenExpire: { $gt: Date.now() },
  });


  if (!user) {
    throw new AppError('Invalid or expired invitation token', HTTP_STATUS.BAD_REQUEST);
  }

  user.password = newPassword;

  // Activate user and remove tokens
  user.status = 'Active';
  user.inviteToken = undefined;
  user.inviteTokenExpire = undefined;

  await user.save();

  //Add activity log for account activation
  await createActivityLog({
    module: 'User',
    action: 'Activate',
    description: `${user.firstName} set their password and activated their account.`,
    recordId: user._id,
    performedBy: user._id,
  });

  return user;
};



const getUsers = async (filter = {}, query = {}) => {
  const { page, limit, skip } = pagination(query);

  const users = await User.find(filter)
    .populate('department', 'name -_id') 
    .populate('role', 'name -_id')
    .skip(skip)
    .limit(limit);

  const totalUsers = await User.countDocuments(filter);

  const totalPages = Math.ceil(totalUsers / limit);

  return { users, totalPages, totalUsers, currentPage: page };
};


const getUserById = async (id) => {
  const user = await User.findById(id)
    .populate('department')
    .populate({
      path: 'role',
      populate: {
        path: 'permissions',
        select: 'name'
      }
    });

  if (!user) {
    throw new AppError('User not found', HTTP_STATUS.NOT_FOUND);
  }

  return user;
};

const updateUser = async (id, data, updatedBy) => {
  const user = await User.findOne({ _id: id });

  if (!user) {
    throw new AppError('User not found', HTTP_STATUS.NOT_FOUND);
  }

  const oldData = {
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    role: user.role,
    department: user.department,
  };
  Object.assign(user, data);

  await user.save();

  await createActivityLog({
    module: 'User',
    action: 'Update',
    description: `${updatedBy.firstName} ${updatedBy.lastName} updated user ${user.firstName} ${user.lastName}`,
    recordId: user._id,
    performedBy: updatedBy._id,
    metadata: {
      previousValue: {
        firstName: oldData.firstName,
        lastName: oldData.lastName,
        email: oldData.email,
        role: oldData.role,
        department: oldData.department,
      },
      newValue: {
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        department: user.department,
      },
    },
  });

  return user;
};

const toggleUserStatus = async (id, toggledBy) => {
  const user = await User.findById(id);

  if (!user) {
    throw new AppError('User not found', HTTP_STATUS.NOT_FOUND);
  }

  user.isActive = !user.isActive;
  await user.save();

  await createActivityLog({
    module: 'User',
    action: user.isActive ? 'Activate' : 'Deactivate',
    description: toggledBy.firstName + ' ' + toggledBy.lastName + ' ' + `${user.isActive ? 'Activated' : 'Deactivated'} user ${user.firstName} ${user.lastName}`,
    recordId: user._id,
    performedBy: toggledBy._id,
    metadata: {
      newValue: {
        isActive: user.isActive
      }
    }
  });


  return user;
};

module.exports = {
  createUser,
  getUsers,
  getUserById,
  updateUser,
  toggleUserStatus,
  setupPassword
};