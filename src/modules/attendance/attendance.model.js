const mongoose = require("mongoose");

const breakSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ["Manual", "Auto"],
    required: true
  },
  startTime: {
    type: Date,
    required: true
  },
  endTime: {
    type: Date
  },
  reason: {
    type: String,
    default: "" // e.g., "Lunch", "Was on Call"
  }
});

const attendanceSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  date: {
    type: String,
    required: true // Format: "YYYY-MM-DD" 
  },
  punchInTime: {
    type: Date,
    required: true
  },
  punchOutTime: {
    type: Date
  },
  breaks: [breakSchema], // Upar banaya hua break schema yahan use hoga

  totalEffectiveHours: {
    type: Number,
    default: 0 // Gross Hours - Break Hours
  },
  dailyReport: {
    type: String,
    default: "" // End of day me DSR yahan save hogi
  },
  status: {
    type: String,
    enum: ["Present", "Half Day", "Absent"],
    default: "Present"
  }
}, { timestamps: true });

attendanceSchema.index({ user: 1, date: 1 }, { unique: true });

module.exports = mongoose.model("Attendance", attendanceSchema);