const Attendance = require('./attendance.model');
const AppError = require('../../common/AppError');
const HTTP_STATUS = require('../../constants/httpStatus');


const getTodayDateString = () => {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

exports.checkTodayStatus = async (userId) => {
  const today = getTodayDateString();
  const attendance = await Attendance.findOne({ user: userId, date: today });

  if (!attendance) {
    return { status: "Not Punched In", data: null };
  }

  if (attendance.punchOutTime) {
    return { status: "Punched Out", data: attendance };
  }

  // Break check
  const lastBreak = attendance.breaks[attendance.breaks.length - 1];
  if (lastBreak && !lastBreak.endTime) {
    return { status: "On Break", data: attendance };
  }

  return { status: "Punched In", data: attendance };
};

exports.performPunchIn = async (userId) => {
  const today = getTodayDateString();
  
  const existing = await Attendance.findOne({ user: userId, date: today });
  if (existing) {
    const error = new Error("You have already punched in today.");
    error.statusCode = 400;
    throw error;
  }

  const newAttendance = await Attendance.create({
    user: userId,
    date: today,
    punchInTime: new Date()
  });

  return newAttendance;
};


exports.performStartBreak = async (userId, type) => {
  const today = getTodayDateString();
  const attendance = await Attendance.findOne({ user: userId, date: today });

  if (!attendance) {
    const error = new Error("You have not punched in today.");
    error.statusCode = 400;
    throw error;
  }
  if (attendance.punchOutTime) {
    const error = new Error("You have already punched out for the day.");
    error.statusCode = 400;
    throw error;
  }

  const lastBreak = attendance.breaks[attendance.breaks.length - 1];
  if (lastBreak && !lastBreak.endTime) {
    const error = new Error("You are already on a break.");
    error.statusCode = 400;
    throw error;
  }

  // Naya break start karo
  attendance.breaks.push({
    type: type || "Manual", 
    startTime: new Date()
  });

  await attendance.save();
  return attendance;
};


exports.performEndBreak = async (userId, reason) => {
  const today = getTodayDateString();
  const attendance = await Attendance.findOne({ user: userId, date: today });

  if (!attendance || attendance.punchOutTime) {
    const error = new Error("Invalid attendance record or already punched out.");
    error.statusCode = 400;
    throw error;
  }

  const lastBreak = attendance.breaks[attendance.breaks.length - 1];
  if (!lastBreak || lastBreak.endTime) {
    const error = new Error("You are not currently on a break.");
    error.statusCode = 400;
    throw error;
  }

  lastBreak.endTime = new Date();
  if (reason) {
    lastBreak.reason = reason;
  }

  await attendance.save();
  return attendance;
};


exports.performPunchOut = async (userId, dailyReport) => {
  const today = getTodayDateString();
  const attendance = await Attendance.findOne({ user: userId, date: today });

  // Checks
  if (!attendance) {
    const error = new Error("You have not punched in today.");
    error.statusCode = 400;
    throw error;
  }
  if (attendance.punchOutTime) {
    const error = new Error("You have already punched out for the day.");
    error.statusCode = 400;
    throw error;
  }
  if (!dailyReport || dailyReport.trim() === "") {
    const error = new Error("Daily Status Report (DSR) is mandatory for Punch Out.");
    error.statusCode = 400;
    throw error;
  }

  const punchOutTime = new Date();

  const lastBreak = attendance.breaks[attendance.breaks.length - 1];
  if (lastBreak && !lastBreak.endTime) {
    lastBreak.endTime = punchOutTime;
    lastBreak.reason = lastBreak.reason || "Auto-closed by Punch Out";
  }

  
  const diffInMs = Math.abs(punchOutTime - attendance.punchInTime);
  const grossHours = diffInMs / (1000 * 60 * 60); 

  let totalBreakMs = 0;
  attendance.breaks.forEach(b => {
    if (b.startTime && b.endTime) {
      totalBreakMs += Math.abs(b.endTime - b.startTime);
    }
  });
  const breakHours = totalBreakMs / (1000 * 60 * 60);

  let effectiveHours = grossHours - breakHours;
  effectiveHours = Math.max(0, effectiveHours); 

  attendance.punchOutTime = punchOutTime;
  attendance.totalEffectiveHours = parseFloat(effectiveHours.toFixed(2));
  attendance.dailyReport = dailyReport;

  if (attendance.totalEffectiveHours < 5) {
    attendance.status = "Half Day";
  } else {
    attendance.status = "Present";
  }

  await attendance.save();
  return attendance;
};


exports.getMyRecords = async (userId, page = 1, limit = 30) => {
  const skip = (page - 1) * limit;
  
  const records = await Attendance.find({ user: userId })
    .sort({ date: -1 })
    .skip(skip)
    .limit(limit);

  const total = await Attendance.countDocuments({ user: userId });

  return {
    records,
    pagination: {
      totalRecords: total,
      totalPages: Math.ceil(total / limit),
      currentPage: Number(page)
    }
  };
};

exports.getAllAttendanceRecords = async (filters, page = 1, limit = 10) => {
  const skip = (page - 1) * limit;
  let query = {};

  if (filters.date) query.date = filters.date;
  if (filters.status) query.status = filters.status;
  if (filters.user) query.user = filters.user;

  const records = await Attendance.find(query)
    .populate("user", "firstName lastName email") 
    .sort({ date: -1 })
    .skip(skip)
    .limit(limit);

  const total = await Attendance.countDocuments(query);

  return {
    records,
    pagination: {
      totalRecords: total,
      totalPages: Math.ceil(total / limit),
      currentPage: Number(page)
    }
  };
};

exports.updateAttendanceRecord = async (attendanceId, updateData) => {
  const updatedRecord = await Attendance.findByIdAndUpdate(
    attendanceId,
    { $set: updateData },
    { new: true, runValidators: true }
  ).populate("user", "firstName lastName email");

  if (!updatedRecord) {
    const error = new Error("Attendance record not found.");
    error.statusCode = 404;
    throw error;
  }

  return updatedRecord;
};