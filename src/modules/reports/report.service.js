const Attendance = require('../attendance/attendance.model');
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

module.exports = {
  getDailyReport,
  getMonthlyReport,
  getDepartmentReport,
};