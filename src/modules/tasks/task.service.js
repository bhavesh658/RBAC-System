const Task = require('./task.model');
const User = require('../users/user.model');
const AppError = require('../../common/AppError');

const HTTP_STATUS = require('../../constants/httpStatus');
const pagination = require('../../common/pagination');
const {createActivityLog,} = require('../activity-logs/activityLog.service');


const createTask = async (payload, currentUser) => {

  const task =
    await Task.create({
      ...payload,

      createdBy:
        currentUser._id,
    });

  await createActivityLog({
    module: 'Task',
    action: 'Create',
    description:
      `${currentUser.fullName} created task ${task.title}`,
    recordId: task._id,
    performedBy: currentUser._id,
    metadata: {
      newValue: {
        title: task.title,
        status: task.status,
        priority: task.priority,
        assignedTo: task.assignedTo,
      },
    },
  });

  return task;
};



const getAllTasks = async ( query = {}) => {

  const { page, limit, skip } = pagination(query);

  const filter = {
    isDeleted: false,
  };

  if (query.project) {
    filter.project =
      query.project;
  }

  if (query.assignedTo) {
    filter.assignedTo =
      query.assignedTo;
  }

  if (query.status) {
    filter.status =
      query.status;
  }

  if (query.priority) {
    filter.priority =
      query.priority;
  }

  const tasks =
    await Task.find(filter)

      .populate(
        'project',
        'name status'
      )

      .populate(
        'assignedTo',
        'firstName lastName email'
      )

      .populate(
        'createdBy',
        'firstName lastName'
      )

      .populate(
        'updatedBy',
        'firstName lastName'
      )
      .skip(skip)
      .limit(limit)

      .sort({
        createdAt: -1,
      });

  return tasks;
};



const getTaskById = async (
  taskId
) => {

  const task =
    await Task.findOne({
      _id: taskId,
      isDeleted: false,
    })

      .populate(
        'project',
        'name status'
      )

      .populate(
        'assignedTo',
        'firstName lastName email'
      )

      .populate(
        'createdBy',
        'firstName lastName'
      )

      .populate(
        'updatedBy',
        'firstName lastName'
      );

  if (!task) {
    throw new AppError(
      'Task not found',
      HTTP_STATUS.NOT_FOUND
    );
  }

  return task;
};



const updateTask = async (
  taskId,
  payload,
  currentUser
) => {

  const task =
    await Task.findOne({
      _id: taskId,
      isDeleted: false,
    });

  if (!task) {
    throw new AppError(
      'Task not found',
      HTTP_STATUS.NOT_FOUND
    );
  }
  const oldTask = {
    title: task.title,
    status: task.status,
    priority: task.priority,
    assignedTo: task.assignedTo,
  };
  Object.assign(
    task,
    payload
  );

  task.updatedBy =
    currentUser._id;

  await task.save();

  await createActivityLog({
    module: 'Task',
    action: 'Update',
    description:
      `${currentUser.fullName} updated task ${task.title}`,
    recordId: task._id,
    performedBy: currentUser._id,
    metadata: {
      previousValue: oldTask,
      newValue: {
        title: task.title,
        status: task.status,
        priority: task.priority,
        assignedTo: task.assignedTo,
      },
    },
  });

  return task;
};



const deleteTask = async (
  taskId,
  currentUser
) => {

  const task =
    await Task.findOne({
      _id: taskId,
      isDeleted: false,
    });

  if (!task) {
    throw new AppError(
      'Task not found',
      HTTP_STATUS.NOT_FOUND
    );
  }

  task.isDeleted = true;

  task.updatedBy =
    currentUser._id;

  await task.save();

  await createActivityLog({
    module: 'Task',
    action: 'Delete',
    description:
      `${currentUser.fullName} deleted task ${task.title}`,
    recordId: task._id,
    performedBy: currentUser._id,
    metadata: {
      deletedTask: {
        title: task.title,
        status: task.status,
        priority: task.priority,
      },
    },
  });

  return true;
};



const assignTask = async (
  taskId,
  assignedTo,
  currentUser
) => {

  const task =
    await Task.findOne({
      _id: taskId,
      isDeleted: false,
    });

  const user =
    await User.findById(
      assignedTo
    ).select(
      'firstName lastName'
    );

    if (!user) {
  throw new AppError(
    'Assigned user not found',
    HTTP_STATUS.NOT_FOUND
  );
}

  if (!task) {
    throw new AppError(
      'Task not found',
      HTTP_STATUS.NOT_FOUND
    );
  }

  const previousAssignedTo =
    task.assignedTo;

  task.assignedTo =
    assignedTo;

  task.updatedBy =
    currentUser._id;

  await task.save();


  await createActivityLog({
    module: 'Task',
    action: 'Assign',
    description:
      `${currentUser.fullName} assigned task ${task.title}`,
    recordId: task._id,
    performedBy: currentUser._id,
    metadata: {
      previousValue: {
        assignedToId:
          task.assignedTo || null,
      },

      newValue: {
        assignedToId:
          user._id,

        assignedToName:
          `${user.firstName} ${user.lastName}`,
      },
    },
  });

  return task;
};



const changeTaskStatus =async (
    taskId,
    status,
    currentUser
  ) => {

    const task =
      await Task.findOne({
        _id: taskId,
        isDeleted: false,
      });

    if (!task) {
      throw new AppError(
        'Task not found',
        HTTP_STATUS.NOT_FOUND
      );
    }
    const previousStatus =
      task.status;

    task.status = status;

    task.updatedBy =
      currentUser._id;

    await task.save();

    await createActivityLog({
      module: 'Task',
      action: 'Status Change',
      description:
        `${currentUser.fullName} changed task status`,
      recordId: task._id,
      performedBy: currentUser._id,
      metadata: {
        previousValue: {
          status:
            previousStatus,
        },

        newValue: {
          status,
        },
      },
    });

    return task;
  };

module.exports = {
  createTask,
  getAllTasks,
  getTaskById,
  updateTask,
  deleteTask,
  assignTask,
  changeTaskStatus,
};