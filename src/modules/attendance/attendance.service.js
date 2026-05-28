const Attendance = require('./attendance.model');
const AppError = require('../../common/AppError');
const HTTP_STATUS = require('../../constants/httpStatus');

const punchIn = async (userId) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let attendance = await Attendance.findOne({
    user: userId,
    date: today,
  });

  if (attendance && attendance.punchIn) {
    throw new AppError(
      'Already punched in for today',
      HTTP_STATUS.BAD_REQUEST
    );
  }

  if (!attendance) {
    attendance = await Attendance.create({
      user: userId,
      date: today,
      punchIn: new Date(),
    });
  } else {
    attendance.punchIn = new Date();
    await attendance.save();
  }

  return attendance;
};


const punchOut = async (userId) => {
 
  const attendance = await Attendance.findOne({
    user: userId,
    punchIn: { $exists: true },
    punchOut: { $exists: false },
  }).sort({ punchIn: -1 }); // Sabse naya open record pehle laayein

  if (!attendance) {
    throw new AppError(
      'No active punch-in session found. You may have already punched out or forgot to punch in.',
      HTTP_STATUS.BAD_REQUEST
    );
  }

  attendance.punchOut = new Date();

  const diff =
    (attendance.punchOut - attendance.punchIn) /
    (1000 * 60 * 60);

  attendance.totalHours = parseFloat(diff.toFixed(2));

  await attendance.save();

  return attendance;
};

module.exports = {
  punchIn,
  punchOut
};