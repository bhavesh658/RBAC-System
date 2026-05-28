const Role = require('./role.model');
const Permission = require('../permissions/permission.model');
const AppError = require('../../common/AppError');
const HTTP_STATUS = require('../../constants/httpStatus');
const pagination = require('../../common/pagination');

const createRole = async (data, userId) => {
  const existing = await Role.findOne({
    name: data.name,
    department: data.department,
  });

  if (existing) {
    throw new AppError(
      'Role already exists in this department',
      HTTP_STATUS.CONFLICT
    );
  }

  const role = await Role.create({
    ...data,
    createdBy: userId,
  });

  return role;
};

const getRolesByDepartment = async (departmentId, options = {}) => {
  const { limit, skip } = pagination(options);

  return Role.find({ department: departmentId })
    .populate('permissions', 'name module action')
    .populate('parentRole', 'name')
    .skip(skip)
    .limit(limit);
};

const assignPermissions = async (roleId, permissionIds) => {
  const role = await Role.findById(roleId);

  if (!role) {
    throw new AppError('Role not found', HTTP_STATUS.NOT_FOUND);
  }

  // Validate permissions
  const validPermissions = await Permission.find({
    _id: { $in: permissionIds },
  }).select('_id');

  if (validPermissions.length !== permissionIds.length) {
    throw new AppError(
      'One or more permissions are invalid',
      HTTP_STATUS.BAD_REQUEST
    );
  }

  // Merge existing + new permissions
  const existingIds = role.permissions.map((id) =>
    id.toString()
  );

  for (const permission of permissionIds) {
    if (!existingIds.includes(permission.toString())) {
      role.permissions.push(permission);
    }
  }

  await role.save();

  return Role.findById(roleId)
    .populate('department', 'name code')
    .populate(
      'permissions',
      'name module action description'
    );
};

/**
 * Remove specific permissions from role
 */
const removePermissions = async (roleId, permissionIds) => {
  const role = await Role.findById(roleId);

  if (!role) {
    throw new AppError('Role not found', HTTP_STATUS.NOT_FOUND);
  }

  role.permissions = role.permissions.filter(
    (permissionId) =>
      !permissionIds.includes(permissionId.toString())
  );

  await role.save();

  return Role.findById(roleId)
    .populate('department', 'name code')
    .populate(
      'permissions',
      'name module action description'
    );
};
const getAllRoles = async (query = {}) => {

  const filter = {};

  if (query.department) {
    filter.department = query.department;
  }


  const { limit, skip } = pagination(query);

  return Role.find(filter)
    .populate('department', 'name code')
    .populate('permissions', 'name module action')
    .populate('parentRole', 'name')
    .skip(skip)
    .limit(limit)
    .sort({ name: 1 });
};

const updateRole = async (id, data) => {
  const role = await Role.findByIdAndUpdate(id, data, {
    new: true,
  });

  if (!role) {
    throw new AppError('Role not found', HTTP_STATUS.NOT_FOUND);
  }

  return role;
};

module.exports = {
  createRole,
  getRolesByDepartment,
  assignPermissions,
  updateRole,
  getAllRoles,
  removePermissions,
};