const mongoose = require('mongoose');

const validateObjectId = (req, res, next) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid ID format. Must be a valid 24-character hex string.'
    });
  }

  next();
};

module.exports = validateObjectId;