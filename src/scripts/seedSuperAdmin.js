

require('dotenv').config();

const connectDB = require('../config/db');
const Department = require('../modules/departments/department.model');
const Role = require('../modules/roles/role.model');
const User = require('../modules/users/user.model');
const Permission = require('../modules/permissions/permission.model');
const logger = require('../utils/logger');


const permissionData = [
  // Permissions Module
  {
    name: 'permissions.read',
    module: 'permissions',
    action: 'read',
    description: 'View all permissions',
    isSystemPermission: true,
  },

  // Departments Module
  {
    name: 'departments.create',
    module: 'departments',
    action: 'create',
    description: 'Create departments',
    isSystemPermission: true,
  },
  {
    name: 'departments.read',
    module: 'departments',
    action: 'read',
    description: 'View departments',
    isSystemPermission: true,
  },
  {
    name: 'departments.update',
    module: 'departments',
    action: 'update',
    description: 'Update departments',
    isSystemPermission: true,
  },

  // Roles Module
  {
    name: 'roles.create',
    module: 'roles',
    action: 'create',
    description: 'Create roles',
    isSystemPermission: true,
  },
  {
    name: 'roles.read',
    module: 'roles',
    action: 'read',
    description: 'View roles',
    isSystemPermission: true,
  },
  {
    name: 'roles.update',
    module: 'roles',
    action: 'update',
    description: 'Update roles',
    isSystemPermission: true,
  },
  {
    name: 'roles.assignpermissions',
    module: 'roles',
    action: 'assignpermissions',
    description: 'Assign permissions to roles',
    isSystemPermission: true,
  },

  // Users Module
  {
    name: 'users.create',
    module: 'users',
    action: 'create',
    description: 'Create users',
    isSystemPermission: true,
  },
  {
    name: 'users.read',
    module: 'users',
    action: 'read',
    description: 'View users',
    isSystemPermission: true,
  },
  {
    name: 'users.update',
    module: 'users',
    action: 'update',
    description: 'Update users',
    isSystemPermission: true,
  },

  // Attendance Module
  {
    name: 'attendance.punchin',
    module: 'attendance',
    action: 'punchin',
    description: 'Punch in attendance',
    isSystemPermission: true,
  },
  {
    name: 'attendance.punchout',
    module: 'attendance',
    action: 'punchout',
    description: 'Punch out attendance',
    isSystemPermission: true,
  },

  // Reports Module
  {
    name: 'reports.read',
    module: 'reports',
    action: 'read',
    description: 'View reports',
    isSystemPermission: true,
  },


  // leads Module
  {
    name: 'leads.create',
    module: 'leads',
    action: 'create',
    description: 'Create leads',
    isSystemPermission: true,
  },
  {
    name: 'leads.read',
    module: 'leads',
    action: 'read',
    description: 'View leads',
    isSystemPermission: true,
  },
  {
    name: 'leads.update',
    module: 'leads',
    action: 'update',
    description: 'Update leads',
    isSystemPermission: true,
  },
  {
    name: 'leads.delete',
    module: 'leads',
    action: 'delete',
    description: 'Delete leads',
    isSystemPermission: true,
  },
  {
    name: 'leads.assign',
    module: 'leads',
    action: 'assign',
    description: 'Assign leads to users',
    isSystemPermission: true,
  },
];

const seedSuperAdmin = async () => {
  try {
    // Connect to database
    await connectDB();

   
    for (const permission of permissionData) {
      await Permission.findOneAndUpdate(
        { name: permission.name },
        permission,
        {
          upsert: true,
          new: true,
          setDefaultsOnInsert: true,
        }
      );
    }
    
    logger.info('Permissions seeded successfully.');

    let systemDepartment = await Department.findOne({
      code: 'SYSTEM',
    });

    if (!systemDepartment) {
      systemDepartment = await Department.create({
        name: 'System',
        code: 'SYSTEM',
        description: 'Internal system department',
        isActive: true,
      });

      logger.info('System department created successfully.');
    } else {
      logger.info('System department already exists.');
    }

    
    let superAdminRole = await Role.findOne({
      name: 'Super Admin',
      department: systemDepartment._id,
    });

    // Get all permission IDs
    const allPermissions = await Permission.find({}, '_id');
    const permissionIds = allPermissions.map(
      (permission) => permission._id
    );

    if (!superAdminRole) {
      superAdminRole = await Role.create({
        name: 'Super Admin',
        description: 'Full system access',
        department: systemDepartment._id,
        permissions: permissionIds,
        isSystemRole: true,
        isActive: true,
      });

      logger.info('Super Admin role created successfully.');
    } else {
      // Update existing Super Admin role with all permissions
      superAdminRole.permissions = permissionIds;
      await superAdminRole.save();

      logger.info(
        'Super Admin role already exists and permissions updated.'
      );
    }



   
    const existingUser = await User.findOne({
      email: process.env.SUPER_ADMIN_EMAIL.toLowerCase(),
    });

    if (!existingUser) {
      const fullName =
        process.env.SUPER_ADMIN_NAME || 'Super Admin';

      const nameParts = fullName.trim().split(' ');
      const firstName = nameParts[0] || 'Super';
      const lastName =
        nameParts.slice(1).join(' ') || 'Admin';

      await User.create({
        firstName,
        lastName,
        email: process.env.SUPER_ADMIN_EMAIL.toLowerCase(),
        password: process.env.SUPER_ADMIN_PASSWORD,
        department: systemDepartment._id,
        role: superAdminRole._id,
        isActive: true,
      });

      logger.info('Super Admin user created successfully.');
    } else {
      // Ensure existing user always has latest Super Admin role
      existingUser.role = superAdminRole._id;
      existingUser.department = systemDepartment._id;
      await existingUser.save();

      logger.info(
        'Super Admin user already exists and role updated.'
      );
    }

    logger.info('Seed completed successfully.');
    process.exit(0);
  } catch (error) {
    logger.error('Seed Error:', error.message);
    process.exit(1);
  }
};

seedSuperAdmin();