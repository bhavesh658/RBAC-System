const asyncHandler = require('../../common/asyncHandler');
const sendResponse = require('../../common/apiResponse');
const HTTP_STATUS = require('../../constants/httpStatus');

const departmentService = require('./department.service');

const createDepartment = asyncHandler(async (req, res) => {
  const dept = await departmentService.createDepartment(
    req.body,
    req.user._id
  );

  return sendResponse(
    res,
    HTTP_STATUS.CREATED,
    'Department created successfully',
    dept
  );
});

const getAllDepartments = asyncHandler(async (req, res) => {
  const depts = await departmentService.getAllDepartments(req.query);

  return sendResponse(
    res,
    HTTP_STATUS.OK,
    'Departments fetched successfully',
    depts
  );
});

const getDepartmentById = asyncHandler(async (req, res) => {
  const dept = await departmentService.getDepartmentById(
    req.params.id
  );

  return sendResponse(
    res,
    HTTP_STATUS.OK,
    'Department fetched successfully',
    dept
  );
});

const updateDepartment = asyncHandler(async (req, res) => {
  const dept = await departmentService.updateDepartment(
    req.params.id,
    req.body
  );

  return sendResponse(
    res,
    HTTP_STATUS.OK,
    'Department updated successfully',
    dept
  );
});

const assignHead = asyncHandler(async (req, res) => {
  const userId = req.body.userId || req.body.head;

  const dept = await departmentService.assignHead(
    req.params.id,
    userId
  );

  return sendResponse(
    res,
    HTTP_STATUS.OK,
    'Department head assigned successfully',
    dept
  );
});

module.exports = {
  createDepartment,
  getAllDepartments,
  getDepartmentById,
  updateDepartment,
  assignHead,
};