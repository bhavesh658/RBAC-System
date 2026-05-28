const mongoose = require('mongoose');
const Department = require('./department.model');
const User = require('../users/user.model');
const AppError = require('../../common/AppError');
const HTTP_STATUS = require('../../constants/httpStatus');
const pagination = require('../../common/pagination');

const createDepartment = async (data, userId) => {
  const existing = await Department.findOne({
    code: data.code.toUpperCase(),
  });

  if (existing) {
    throw new AppError('Department already exists', HTTP_STATUS.CONFLICT);
  }

  const department = await Department.create({
    ...data,
    code: data.code.toUpperCase(),
    createdBy: userId,
  });

  return department;
};

const getAllDepartments = async (options = {}) => {
  const { limit, skip } = pagination(options);
  return Department.find()
    .populate('head', 'firstName lastName email')
    .populate('createdBy', 'firstName email')
    .skip(skip)
    .limit(limit);
};

const getDepartmentById = async (id) => {
  const dept = await Department.findById(id)
    .populate('head')
    .populate('createdBy');

  if (!dept) {
    throw new AppError('Department not found', HTTP_STATUS.NOT_FOUND);
  }

  return dept;
};

const updateDepartment = async (id, data) => {
  const dept = await Department.findByIdAndUpdate(
    id,
    data,
    { new: true }
  );

  if (!dept) {
    throw new AppError('Department not found', HTTP_STATUS.NOT_FOUND);
  }

  return dept;
};

const assignHead = async (deptId, userId) => {
  // 1. Validate userId
  if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
    throw new AppError(
      'Invalid user ID',
      HTTP_STATUS.BAD_REQUEST
    );
  }

  // 2. Trim spaces and find user
  const user = await User.findById(userId.trim());

  if (!user) {
    throw new AppError(
      'User not found',
      HTTP_STATUS.NOT_FOUND
    );
  }

  // 3. Validate departmentId
  if (!mongoose.Types.ObjectId.isValid(deptId)) {
    throw new AppError(
      'Invalid department ID',
      HTTP_STATUS.BAD_REQUEST
    );
  }

  // 4. Update department head
  const dept = await Department.findByIdAndUpdate(
    deptId,
    {
      head: user._id,
    },
    {
      new: true,
      runValidators: true,
    }
  )
    .populate('head', 'firstName lastName email')
    .populate('createdBy', 'firstName lastName email');

  // 5. Check if department exists
  if (!dept) {
    throw new AppError(
      'Department not found',
      HTTP_STATUS.NOT_FOUND
    );
  }

  return dept;
};
module.exports = {
  createDepartment,
  getAllDepartments,
  getDepartmentById,
  updateDepartment,
  assignHead,
};