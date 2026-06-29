const Role = require('./role.model');
const Permission = require('../permissions/permission.model');
const AppError = require('../../common/AppError');
const HTTP_STATUS = require('../../constants/httpStatus');
const pagination = require('../../common/pagination');
const { createActivityLog } = require('../activity-logs/activityLog.service')

const createRole = async (data, user) => {
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
    createdBy: user._id,
  });

  await createActivityLog({
    module: 'Role',
    action: 'Create',
    description: `${user.firstName} ${user.lastName} created role ${role.name}`,
    recordId: role._id,
    metadata: {
      newValue: {
        name: role.name,
        department: role.department,
      }
    },
    performedBy: user._id,
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

const assignPermissions = async (roleId, permissionIds, user) => {
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

  await createActivityLog({
    module: 'Role',
    action: 'Assign Permissions',
    description: `${user.firstName} ${user.lastName} assigned permissions to role "${role.name}"`,
    performedBy: user._id,
    metadata: {
      newValue: {
        permissions: role.permissions,
      }
    }
  })

  await role.save();

  return Role.findById(roleId)
    .populate('department', 'name code')
    .populate(
      'permissions',
      'name module action description'
    );
};


const removePermissions = async (roleId, permissionIds, user) => {
  const role = await Role.findById(roleId);

  if (!role) {
    throw new AppError('Role not found', HTTP_STATUS.NOT_FOUND);
  }

  role.permissions = role.permissions.filter(
    (permissionId) =>
      !permissionIds.includes(permissionId.toString())
  );

  await role.save();

  await createActivityLog({
    module: 'Role',
    action: 'Remove Permissions From Role',
    description: `${user.firstName} ${user.lastName} removed permissions to role "${role.name}"`,
    performedBy: user._id,
    metadata: {
      previousValue : {
        permissions: role.permissions,
      }
    }
  })

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

const updateRole = async (id, data, user) => {
  const role = await Role.findOne({ _id: id });

  if (!role) {
    throw new AppError('Role not found', HTTP_STATUS.NOT_FOUND);
  }
  const oldRoleData = {
    name: role.name,
    department: role.department,
  };
  Object.assign(role, data);
  await role.save();

  await createActivityLog({
    module: 'Role',
    action: 'Update',
    description: `${user.firstName} ${user.lastName} updated role "${role.name}"`,
    recordId: role._id,
    performedBy: user._id,
    metadata: {
      previousValue : {
        name: oldRoleData.name,
        department: oldRoleData.department,
      },
      newValue: {
        name: data.name || role.name,
        department: data.department || role.department,
      }
    }
  });

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