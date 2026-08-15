const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const logger = require('../../utils/logger');



// const transporter = nodemailer.createTransport({
//   host: 'smtp.gmail.com',
//   port: 587,              // 🚀 Wapas 587 try kar rahe hain
//   secure: false,          // 🚀 587 ke liye hamesha false rahega
//   requireTLS: true,       // 🚀 STARTTLS force karne ke liye
//   auth: {
//     user: process.env.EMAIL_USER?.trim(),
//     pass: process.env.EMAIL_PASSWORD?.trim(),
//   },
//   family: 4,              // 🚀 Ye IPv6 bypass hamesha on rakhna hai
//   connectionTimeout: 20000, // 🚀 20 seconds ka wait time de rahe hain (default bohot kam hota hai)
//   greetingTimeout: 20000,
// });

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST1?.trim(),
  port: Number(process.env.EMAIL_PORT1) || 587,
  secure: false, // 587 ke liye false hi rahega
  auth: {
    user: process.env.EMAIL_USER1?.trim(),
    pass: process.env.EMAIL_PASSWORD1?.trim(),
  }
});
transporter.verify()
  .then(() => logger.info("SMTP connection successful and ready to send emails"))
  .catch((err) => logger.error("SMTP connection failed on startup:", err));


const sendEmail = async ({ to, subject, html }) => {
  try {
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM?.trim() || process.env.EMAIL_USER?.trim(),
      to,
      subject,
      html,
    });

    logger.info(`Email sent successfully. MessageID: ${info.messageId}`);

    return info;
  } catch (error) {
    logger.error(`Failed to send email to ${to}. Error: ${error.message}`);
    throw new Error(`Email sending failed: ${error.message}`);
  }
};



const generateAccessToken = (user) => {
  if (!user || !user._id || !user.role || !user.department) {
    throw new Error('Invalid user object for token generation');
  }
  const payload = {
    sub: user._id.toString(),
    role: user.role.toString(),
    department: user.department.toString(),
  };

  

  const token = jwt.sign(
    payload,
    process.env.JWT_ACCESS_SECRET,
    {
      expiresIn: process.env.JWT_ACCESS_EXPIRES_IN,
    }
  );

  return token;
};

const generateRefreshToken = (
  user
) => {
  return jwt.sign(
    {
      sub: user._id,
    },
    process.env.JWT_REFRESH_SECRET,
    {
      expiresIn: process.env.JWT_REFRESH_EXPIRES_IN,
    }
  );
};




module.exports = {
  generateAccessToken, sendEmail, generateRefreshToken
};