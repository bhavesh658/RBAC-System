const mongoose = require('mongoose');
const Department = require('./department.model');
const User = require('../users/user.model');
const AppError = require('../../common/AppError');
const HTTP_STATUS = require('../../constants/httpStatus');
const pagination = require('../../common/pagination');
const {createActivityLog} = require('../activity-logs/activityLog.service');


const createDepartment = async (data, user) => {
  const existing = await Department.findOne({
    code: data.code.toUpperCase(),
  });

  if (existing) {
    throw new AppError('Department already exists', HTTP_STATUS.CONFLICT);
  }

  const department = await Department.create({
    ...data,
    code: data.code.toUpperCase(),
    createdBy: user._id,
  });

  await createActivityLog({
    module: 'Department',
    action: 'Create',
    description: `Department ${department.name} created by ${user.firstName} ${user.lastName}`,
    performedBy: user._id,
    recordId: department._id,
  });


  return department;
};

const getAllDepartments = async (options = {}) => {
  const { page = 1, limit = 10, skip } = pagination(options); 
  
  const departments = await Department.find()
    .populate('head', 'firstName lastName email')
    .populate('createdBy', 'firstName email')
    .skip(skip)
    .limit(limit);

  const totalDepartments = await Department.countDocuments();
  const totalPages = Math.ceil(totalDepartments / limit);

  return { departments, totalPages, totalDepartments, currentPage: page };
};

const getDepartmentById = async (id) => {
  const dept = await Department.findById(id)
    .populate('head', 'firstName lastName email')
    .populate('createdBy', 'firstName lastName email');

  if (!dept) {
    throw new AppError('Department not found', HTTP_STATUS.NOT_FOUND);
  }

  return dept;
};

const updateDepartment = async (id, data, user) => {
  const dept = await Department.findByIdAndUpdate(
    id,
    data,
    { new: true }
  );

  if (!dept) {
    throw new AppError('Department not found', HTTP_STATUS.NOT_FOUND);
  }

  await createActivityLog({
    module: 'Department',
    action: 'Update',
    description: `Department ${dept.name} updated by ${user.firstName} ${user.lastName}`,
    performedBy: user._id,
    recordId: dept._id,
  });

  return dept;
};

const assignHead = async (deptId, userId, currentUser) => {
  if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
    throw new AppError(
      'Invalid user ID',
      HTTP_STATUS.BAD_REQUEST
    );
  }

  const user = await User.findById(userId.trim());

  if (!user) {
    throw new AppError(
      'User not found',
      HTTP_STATUS.NOT_FOUND
    );
  }

  if (!mongoose.Types.ObjectId.isValid(deptId)) {
    throw new AppError(
      'Invalid department ID',
      HTTP_STATUS.BAD_REQUEST
    );
  }

  // 1. Department ko update karo
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

  if (!dept) {
    throw new AppError(
      'Department not found',
      HTTP_STATUS.NOT_FOUND
    );
  }


  user.department = dept._id;
  await user.save(); 

  await createActivityLog({
    module: 'Department',
    action: 'Assign Head',
    description: `Department head assigned to ${user.firstName} ${user.lastName} for department ${dept.name} by ${currentUser.firstName} ${currentUser.lastName}`,
    performedBy: currentUser._id,
    recordId: dept._id,
  });

  return dept;
};
module.exports = {
  createDepartment,
  getAllDepartments,
  getDepartmentById,
  updateDepartment,
  assignHead,
};