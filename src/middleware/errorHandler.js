const HTTP_STATUS = require('../constants/httpStatus');
const logger = require('../utils/logger');

const errorHandler = (error, req, res, next) => {
    const statusCode =
        error.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR;

    const message =
        error.message || 'Internal Server Error';

    const response = {
        success: false,
        message,
    };
    logger.error(error.message, {
        stack: error.stack,
    });
    // Additional validation or custom error details
    if (error.errors) {
        response.errors = error.errors;
    }

    // Development mode only
    if (process.env.NODE_ENV === 'development') {
        response.stack = error.stack;
    }
    if (process.env.NODE_ENV === 'production') {
        delete response.stack;
    }

    return res.status(statusCode).json(response);
};

module.exports = errorHandler;