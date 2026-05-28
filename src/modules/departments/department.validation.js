const { body } = require('express-validator');

const createDepartmentValidation = [
    body('name')
        .notEmpty()
        .withMessage('Department name is required'),

    body('code')
        .notEmpty()
        .withMessage('Department code is required')
        .isLength({ min: 2, max: 20 })
        .withMessage('Code must be 2-20 characters'),

    body('description')
        .optional()
        .isString()
        .withMessage('Description must be a string'),
];

module.exports = {
    createDepartmentValidation,
};