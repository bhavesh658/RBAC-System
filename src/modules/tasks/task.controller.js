const asyncHandler = require('../../common/asyncHandler');

const sendResponse = require('../../common/apiResponse')

const HTTP_STATUS = require('../../constants/httpStatus');

const taskService = require('./task.service');



const createTask = asyncHandler(
  async (req, res) => {
    const task =
      await taskService.createTask(
        req.body,
        req.user
      );

    return sendResponse(
      res,
      HTTP_STATUS.CREATED,
      'Task created successfully',
      task
    );
  }
);



const getAllTasks = asyncHandler(
  async (req, res) => {
    const result = await taskService.getAllTasks(req.query);

    return sendResponse(
      res,
      HTTP_STATUS.OK,
      'Tasks fetched successfully',
      result
    );
  }
);


const getTaskById = asyncHandler(
  async (req, res) => {
    const task =
      await taskService.getTaskById(
        req.params.id
      );

    return sendResponse(
      res,
      HTTP_STATUS.OK,
      'Task fetched successfully',
      task
    );
  }
);


const updateTask = asyncHandler(
  async (req, res) => {
    const task =
      await taskService.updateTask(
        req.params.id,
        req.body,
        req.user
      );

    return sendResponse(
      res,
      HTTP_STATUS.OK,
      'Task updated successfully',
      task
    );
  }
);



const deleteTask = asyncHandler(
  async (req, res) => {
    await taskService.deleteTask(
      req.params.id,
      req.user
    );

    return sendResponse(
      res,
      HTTP_STATUS.OK,
      'Task deleted successfully',
      null
    );
  }
);



const assignTask = asyncHandler(
  async (req, res) => {
    const task =
      await taskService.assignTask(
        req.params.id,
        req.body.assignedTo,
        req.user
      );

    return sendResponse(
      res,
      HTTP_STATUS.OK,
      'Task assigned successfully',
      task
    );
  }
);



const changeTaskStatus = asyncHandler(
  async (req, res) => {
    const task =
      await taskService.changeTaskStatus(
        req.params.id,
        req.body.status,
        req.user
      );

    return sendResponse(
      res,
      HTTP_STATUS.OK,
      'Task status updated successfully',
      task
    );
  }
);

const getMyTasks = asyncHandler(
  async (req, res) => {
    const userId = req.user._id; 
    const result = await taskService.getMyTasks(req.query, userId);

    return sendResponse(
      res,
      HTTP_STATUS.OK,
      'My tasks fetched successfully',
      result
    );
  }
);



module.exports = {
  createTask,
  getAllTasks,
  getTaskById,
  updateTask,
  deleteTask,
  assignTask,
  changeTaskStatus,
  getMyTasks
};