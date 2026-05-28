const Permission = require('./permission.model');
const getPagination = require('../../common/pagination');


const getAllPermissions = async (options = {}) => {
const { limit, skip } = getPagination(options);
  return Permission.find()
    .skip(skip)
    .limit(limit)
    .sort({ module: 1, action: 1 });
}



module.exports = {
    getAllPermissions,
};