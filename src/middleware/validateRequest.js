const { validationResult } = require('express-validator');

const AppError = require('../common/AppError');
const HTTP_STATUS = require('../constants/httpStatus');

const validateRequest = (req, res, next) => {
  const errors = validationResult(req);

  if (errors.isEmpty()) {
    return next();
  }

  const formattedErrors = errors.array().map((error) => ({
    field: error.path,
    message: error.msg,
  }));

  const error = new AppError(
    'Validation failed',
    HTTP_STATUS.UNPROCESSABLE_ENTITY
  );

  error.errors = formattedErrors;

  return next(error);
};

module.exports = validateRequest;


