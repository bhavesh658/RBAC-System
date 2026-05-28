const User = require('./user.model');
const AppError = require('../../common/AppError');
const HTTP_STATUS = require('../../constants/httpStatus');
const pagination = require('../../common/pagination');

const createUser = async (data, createdBy) => {
  const email = data.email.trim().toLowerCase();
  const existing = await User.findOne({ email });
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

const updateUser = async (id, data) => {
  const user = await User.findByIdAndUpdate(id, data, {
    new: true,
  });

  if (!user) {
    throw new AppError('User not found', HTTP_STATUS.NOT_FOUND);
  }

  return user;
};

const toggleUserStatus = async (id) => {
  const user = await User.findById(id);

  if (!user) {
    throw new AppError('User not found', HTTP_STATUS.NOT_FOUND);
  }

  user.isActive = !user.isActive;
  await user.save();

  return user;
};

module.exports = {
  createUser,
  getUsers,
  getUserById,
  updateUser,
  toggleUserStatus,
};