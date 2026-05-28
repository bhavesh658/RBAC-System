const { body } = require('express-validator');

const createRoleValidation = [
  body('name')
    .notEmpty()
    .isString()
    .withMessage('Role name is required'),

  body('department')
    .notEmpty()
    .isMongoId()
    .withMessage('Department is required'),

  body('permissions')
    .isArray()
    .withMessage('Permissions must be an array'),
];

module.exports = {
  createRoleValidation,
};