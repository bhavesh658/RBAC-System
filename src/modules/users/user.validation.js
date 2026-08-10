const { body } = require('express-validator');

const createUserValidation = [
  body('firstName')
    .notEmpty()
    .withMessage('First name is required'),

  body('email')
    .isEmail()
    .withMessage('Valid email is required'),

];

const setpasswordValidation = [
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  body('confirmPassword')
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error('Passwords do not match');
      }
      return true;
    }
    )
];


module.exports = {
  createUserValidation,
  setpasswordValidation
};