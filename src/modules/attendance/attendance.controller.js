const asyncHandler = require('../../common/asyncHandler');
const sendResponse = require('../../common/apiResponse');
const HTTP_STATUS = require('../../constants/httpStatus');
const attendanceService = require('./attendance.service');


exports.getTodayStatus = async (req, res) => {
  try {
    const userId = req.user._id; 
    const result = await attendanceService.checkTodayStatus(userId);

    res.status(200).json({ 
      success: true, 
      status: result.status, 
      data: result.data 
    });

  } catch (error) {
    console.error("Error getting today's status:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};


exports.punchIn = async (req, res) => {
  try {
    const userId = req.user._id;
  
    const newAttendance = await attendanceService.performPunchIn(userId);

    res.status(201).json({ 
      success: true, 
      message: "Punched In Successfully!", 
      data: newAttendance 
    });

  } catch (error) {
    console.error("Error punching in:", error);
    const statusCode = error.statusCode || 500;
    res.status(statusCode).json({ success: false, message: error.message || "Internal Server Error" });
  }
};


exports.startBreak = async (req, res) => {
  try {
    const userId = req.user._id;
    const { type } = req.body; 

    const updatedAttendance = await attendanceService.performStartBreak(userId, type);

    res.status(200).json({
      success: true,
      message: "Break started successfully",
      data: updatedAttendance
    });
  } catch (error) {
    console.error("Error starting break:", error);
    const statusCode = error.statusCode || 500;
    res.status(statusCode).json({ success: false, message: error.message || "Internal Server Error" });
  }
};


exports.endBreak = async (req, res) => {
  try {
    const userId = req.user._id;
    const { reason } = req.body; 

    const updatedAttendance = await attendanceService.performEndBreak(userId, reason);

    res.status(200).json({
      success: true,
      message: "Break ended successfully, time to work!",
      data: updatedAttendance
    });
  } catch (error) {
    console.error("Error ending break:", error);
    const statusCode = error.statusCode || 500;
    res.status(statusCode).json({ success: false, message: error.message || "Internal Server Error" });
  }
};



exports.punchOut = async (req, res) => {
  try {
    const userId = req.user._id;
    const { dailyReport } = req.body;

    const updatedAttendance = await attendanceService.performPunchOut(userId, dailyReport);

    res.status(200).json({
      success: true,
      message: "Punched Out Successfully. Great job today!",
      data: updatedAttendance
    });
  } catch (error) {
    console.error("Error punching out:", error);
    const statusCode = error.statusCode || 500;
    res.status(statusCode).json({ success: false, message: error.message || "Internal Server Error" });
  }
};


exports.getMyRecords = async (req, res) => {
  try {
    const userId = req.user._id;
    const { page, limit } = req.query;

    const result = await attendanceService.getMyRecords(userId, page, limit);

    res.status(200).json({ success: true, data: result });
  } catch (error) {
    console.error("Error fetching my records:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

exports.getAllAttendance = async (req, res) => {
  try {
    const { page, limit, date, status, user } = req.query;
    
    const filters = { date, status, user };

    const result = await attendanceService.getAllAttendanceRecords(filters, page, limit);

    res.status(200).json({ success: true, data: result });
  } catch (error) {
    console.error("Error fetching all records:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

exports.updateAttendance = async (req, res) => {
  try {
    const { id } = req.params; 
    const updateData = req.body; 

    const updatedRecord = await attendanceService.updateAttendanceRecord(id, updateData);

    res.status(200).json({
      success: true,
      message: "Attendance updated successfully.",
      data: updatedRecord
    });
  } catch (error) {
    console.error("Error updating record:", error);
    const statusCode = error.statusCode || 500;
    res.status(statusCode).json({ success: false, message: error.message || "Internal Server Error" });
  }
};