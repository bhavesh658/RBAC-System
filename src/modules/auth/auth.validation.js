const { body } = require('express-validator');

const loginValidation = [
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Invalid email address'),

  body('password')
    .notEmpty()
    .withMessage('Password is required'),
];

const passwordRules = (fieldName) =>
  body(fieldName)
    .trim()
    .notEmpty()
    .withMessage(`${fieldName} is required`)
    .bail()
    .isStrongPassword({
      minLength: 8,
      minLowercase: 1,
      minUppercase: 1,
      minNumbers: 1,
      minSymbols: 1,
    })
    .withMessage(
      `${fieldName} must contain at least 8 characters, one uppercase letter, one lowercase letter, one number and one special character`
    );

const resetPasswordValidation = [
  passwordRules('password'),
];

const changePasswordValidation = [
  body('currentPassword')
    .trim()
    .notEmpty()
    .withMessage('Current password is required'),

  passwordRules('newPassword'),
];

module.exports = {
  loginValidation,
  resetPasswordValidation,
  changePasswordValidation,
};