const User = require('./user.model');
const AppError = require('../../common/AppError');
const HTTP_STATUS = require('../../constants/httpStatus');
const pagination = require('../../common/pagination');
const { createActivityLog } = require('../activity-logs/activityLog.service')

const createUser = async (data, createdBy) => {
  const email = data.email.trim().toLowerCase();
  const existing = await User.findOne({ email })
       .populate('createdBy', 'firstName lastName');
  if (existing) {
    throw new AppError(
      'User already exists with this email',
      HTTP_STATUS.CONFLICT
    );
  }

  const user = await User.create({
    ...data,
    email: data.email.toLowerCase(),
    createdBy,
  });


  await createActivityLog({
    module: 'User',
    action: 'Create',
    description:
      `${createdBy.firstName} ${createdBy.lastName} created user ${user.firstName} ${user.lastName}`,
    recordId: user._id,
    performedBy: createdBy._id,
    metadata: {
      newValue: {
        firstName:user.firstName,
        lastName:user.lastName,
        email:user.email,
        role:user.role,
        department:user.department,
      },
    },
  });
  return user;
};

const getUsers = async (filter = {}, query = {}) => {
  const { page, limit, skip } = pagination(query);

  return User.find(filter)
    .populate('department', 'name code')
    .populate('role', 'name permissions')
    .skip(skip)
    .limit(limit);
};

const getUserById = async (id) => {
  const user = await User.findById(id)
    .populate('department')
    .populate('role');

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
      previousValue : {
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
        role:  user.role,
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
    description:  toggledBy.firstName + ' ' + toggledBy.lastName + ' ' + `${user.isActive ? 'Activated' : 'Deactivated'} user ${user.firstName} ${user.lastName}`,
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
};