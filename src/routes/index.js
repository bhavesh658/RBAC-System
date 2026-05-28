const express = require('express');

const authRoutes = require('../modules/auth/auth.route');
const departmentRoutes = require('../modules/departments/department.route');
const roleRoutes = require('../modules/roles/role.route');
const userRoutes = require('../modules/users/user.route');
const attendanceRoutes = require('../modules/attendance/attendance.route');
const reportRoutes = require('../modules/reports/report.route');
const permissionRoutes = require('../modules/permissions/permission.route');
const leadRoutes = require('../modules/leads/lead.route');


const router = express.Router();


router.use('/auth', authRoutes);
router.use('/departments', departmentRoutes);
router.use('/roles', roleRoutes);
router.use('/users', userRoutes);
router.use('/attendance', attendanceRoutes);
router.use('/reports', reportRoutes);
router.use('/permissions', permissionRoutes);
router.use('/leads', leadRoutes);

module.exports = router;