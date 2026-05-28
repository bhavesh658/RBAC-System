
const { body } = require('express-validator');

const {
  LEAD_SOURCES,
  LEAD_STATUSES,
  LEAD_PRIORITIES,
} = require('./lead.constants');

/**
 * Create Lead Validation
 */
const createLeadValidation = [
  body('firstName')
    .trim()
    .notEmpty()
    .withMessage('First name is required'),

  body('lastName')
    .optional({ nullable: true })
    .trim(),

  body('email')
    .optional({ nullable: true, checkFalsy: true })
    .isEmail()
    .withMessage('Valid email is required')
    .normalizeEmail(),

  body('phone')
    .trim()
    .notEmpty()
    .withMessage('Phone number is required'),

  body('company')
    .optional()
    .trim(),

  body('source')
    .optional()
    .isIn(LEAD_SOURCES)
    .withMessage(
      `Source must be one of: ${LEAD_SOURCES.join(', ')}`
    ),

  body('status')
    .optional()
    .isIn(LEAD_STATUSES)
    .withMessage(
      `Status must be one of: ${LEAD_STATUSES.join(', ')}`
    ),

  body('priority')
    .optional()
    .isIn(LEAD_PRIORITIES)
    .withMessage(
      `Priority must be one of: ${LEAD_PRIORITIES.join(', ')}`
    ),

  body('assignedTo')
    .optional({ nullable: true })
    .isMongoId()
    .withMessage('Invalid assignedTo ID'),

  body('department')
    .optional({ nullable: true })
    .isMongoId()
    .withMessage('Invalid department ID'),

  body('estimatedValue')
    .optional()
    .isFloat({ min: 0 })
    .withMessage(
      'Estimated value must be greater than or equal to 0'
    ),

  body('notes')
    .optional(),

  body('followUpDate')
    .optional({ nullable: true })
    .isISO8601()
    .withMessage('Invalid follow up date'),

  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array'),
];

/**
 * Update Lead Validation
 */
const updateLeadValidation = [
  body('firstName')
    .optional()
    .trim(),

  body('lastName')
    .optional()
    .trim(),

  body('email')
    .optional({ nullable: true, checkFalsy: true })
    .isEmail()
    .withMessage('Valid email is required')
    .normalizeEmail(),

  body('phone')
    .optional()
    .trim(),

  body('company')
    .optional()
    .trim(),

  body('source')
    .optional()
    .isIn(LEAD_SOURCES)
    .withMessage(
      `Source must be one of: ${LEAD_SOURCES.join(', ')}`
    ),

  body('status')
    .optional()
    .isIn(LEAD_STATUSES)
    .withMessage(
      `Status must be one of: ${LEAD_STATUSES.join(', ')}`
    ),

  body('priority')
    .optional()
    .isIn(LEAD_PRIORITIES)
    .withMessage(
      `Priority must be one of: ${LEAD_PRIORITIES.join(', ')}`
    ),

  body('assignedTo')
    .optional({ nullable: true })
    .isMongoId()
    .withMessage('Invalid assignedTo ID'),

  body('department')
    .optional({ nullable: true })
    .isMongoId()
    .withMessage('Invalid department ID'),

  body('estimatedValue')
    .optional()
    .isFloat({ min: 0 })
    .withMessage(
      'Estimated value must be greater than or equal to 0'
    ),

  body('notes')
    .optional(),

  body('followUpDate')
    .optional({ nullable: true })
    .isISO8601()
    .withMessage('Invalid follow up date'),

  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array'),

  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean value'),
];

/**
 * Assign Lead Validation
 */
const assignLeadValidation = [
  body('assignedTo')
    .notEmpty()
    .withMessage('assignedTo is required')
    .bail()
    .isMongoId()
    .withMessage('Invalid assignedTo ID'),
];

/**
 * Update Lead Status Validation
 */
const updateLeadStatusValidation = [
  body('status')
    .notEmpty()
    .withMessage('Status is required')
    .bail()
    .isIn(LEAD_STATUSES)
    .withMessage(
      `Status must be one of: ${LEAD_STATUSES.join(', ')}`
    ),
];

module.exports = {
  createLeadValidation,
  updateLeadValidation,
  assignLeadValidation,
  updateLeadStatusValidation,
};