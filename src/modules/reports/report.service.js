const Attendance = require('../attendance/attendance.model');
const User = require('../users/user.model');
const Project = require('../projects/project.model');
const Task = require('../tasks/task.model');
const mongoose = require('mongoose'); 

const getDailyReport = async (date) => {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);

  const end = new Date(date);
  end.setHours(23, 59, 59, 999);

  return Attendance.find({
    date: { $gte: start, $lte: end },
  })
    .populate('user', 'firstName lastName email')
    .populate({
      path: 'user',
      populate: {
        path: 'department',
        select: 'name code',
      },
    });
};

const getMonthlyReport = async (month, year) => {
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 0, 23, 59, 59);

  return Attendance.find({
    date: { $gte: start, $lte: end },
  }).populate('user', 'firstName lastName email');
};


const getDepartmentReport = async (departmentId) => {
  const report = await Attendance.aggregate([
    {
      $lookup: {
        from: 'users',              // Aapke users collection ka sahi naam (usually plural)
        localField: 'user',         // Attendance model ki field
        foreignField: '_id',        // User model ki field
        as: 'userDetails'
      }
    },
    {
      $unwind: {
        path: '$userDetails',
        preserveNullAndEmptyArrays: false 
      }
    },
    {
      $match: {
        'userDetails.department': new mongoose.Types.ObjectId(departmentId)
      }
    },
    {
      $lookup: {
        from: 'departments',        
        localField: 'userDetails.department',
        foreignField: '_id',
        as: 'departmentDetails'
      }
    },
    {
      $unwind: {
        path: '$departmentDetails',
        preserveNullAndEmptyArrays: true
      }
    },
    {
      $project: {
        _id: 1,
        date: 1,
        punchIn: 1,
        punchOut: 1,
        totalHours: 1,
        createdAt: 1,
        updatedAt: 1,
        user: {
          _id: '$userDetails._id',
          firstName: '$userDetails.firstName',
          lastName: '$userDetails.lastName',
          email: '$userDetails.email',
          department: {
            _id: '$departmentDetails._id',
            name: '$departmentDetails.name',
            code: '$departmentDetails.code'
          }
        }
      }
    },
    { $sort: { date: -1 } }
  ]);

  return report; 
};



const getUserComprehensiveReport = async (userId, startDate, endDate) => {
  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0);

  const end = new Date(endDate);
  end.setHours(23, 59, 59, 999);

  // 1. Fetch User Info
  const user = await User.findById(userId)
    .select('-password -__v') // Password remove karna zaroori hai
    .populate('department', 'name code')
    .populate('role', 'name');

  if (!user) {
    throw new AppError('User not found', HTTP_STATUS.NOT_FOUND);
  }

  const [attendanceRecords, projects, tasks] = await Promise.all([
    
    Attendance.find({
      user: userId,
      date: { $gte: start, $lte: end }
    }).sort({ date: -1 }).select('date punchIn punchOut totalHours'),

    Project.find({ assignees: userId })
      .select('name status progress startDate endDate')
      .lean(),

    Task.find({ 
      assignedTo: userId,
      status: { $nin: ['Completed', 'Done'] } 
    })
      .select('title status priority dueDate')
      .lean()
  ]);

  const totalDaysPresent = attendanceRecords.length;
  const totalHoursWorked = attendanceRecords.reduce((acc, curr) => acc + (curr.totalHours || 0), 0);

  return {
    reportPeriod: {
      startDate: start,
      endDate: end
    },
    userDetails: {
      id: user._id,
      name: `${user.firstName} ${user.lastName || ''}`.trim(),
      email: user.email,
      department: user.department?.name || 'N/A',
      role: user.role?.name || 'N/A',
      status: user.isActive ? 'Active' : 'Inactive'
    },
    attendanceSummary: {
      totalDaysPresent,
      totalHoursWorked: parseFloat(totalHoursWorked.toFixed(2)),
      averageHoursPerDay: totalDaysPresent > 0 ? parseFloat((totalHoursWorked / totalDaysPresent).toFixed(2)) : 0,
      records: attendanceRecords
    },
    workProfile: {
      activeProjectsCount: projects.length,
      pendingTasksCount: tasks.length,
      projects: projects,
      tasks: tasks
    }
  };
};

module.exports = {
  getDailyReport,
  getMonthlyReport,
  getDepartmentReport,
  getUserComprehensiveReport
};