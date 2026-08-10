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
  const existing = await User.findOne({ email }) .populate('createdBy', 'firstName lastName');
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
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto;">
      <h2>Welcome to the RBAC System</h2>
      <p>Hello ${user.firstName},</p>
      <p>You have been invited by ${currentuser.firstName} ${currentuser.lastName} to join the platform.</p>
      <p>Please click the button below to set up your password and activate your account:</p>
      <a href="${setupUrl}" style="display: inline-block; padding: 10px 20px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 5px; margin-top: 10px;">
        Set Password
      </a>
      <p style="margin-top: 20px; font-size: 12px; color: #666;">This link is valid for 24 hours.</p>
    </div>
  `;

  await sendEmail({
    to: user.email,
    subject: 'Invitation to Join RBAC System - Setup Your Account',
    html: emailHtml,
  });

  await createActivityLog({
    module: 'User',
    action: 'Create',
    description: `${currentuser.firstName} ${currentuser.lastName} created user ${user.firstName} ${user.lastName} (Invitation Sent)`,
    recordId: user._id,
    performedBy: currentuser  ._id,
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

 return res.status(201).json({ success: true, user: responseData });
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