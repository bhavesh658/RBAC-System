  const express = require('express');

  const router = express.Router();

  const authenticate = require(
    '../../middleware/authenticate'
  );

  const authorize = require(
    '../../middleware/authorize'
  );

  const validateRequest = require(
    '../../middleware/validateRequest'
  );

  const taskController = require(
    './task.controller'
  );

  const {
    createTaskValidation,
    updateTaskValidation,
    assignTaskValidation,
    changeTaskStatusValidation,
  } = require(
    './task.validation'
  );


  router.get(
    '/my-tasks'
    ,authenticate,
    taskController.getMyTasks);

  router.post(
    '/',
    authenticate,
    authorize('tasks.create'),
    createTaskValidation,
    validateRequest,
    taskController.createTask
  );



  router.get(
    '/',
    authenticate,
    authorize('tasks.read'),
    taskController.getAllTasks
  );



  router.get(
    '/:id',
    authenticate,
    authorize('tasks.read'),
    taskController.getTaskById
  );



  router.patch(
    '/:id',
    authenticate,
    authorize('tasks.update'),
    updateTaskValidation,
    validateRequest,
    taskController.updateTask
  );



  router.delete(
    '/:id',
    authenticate,
    authorize('tasks.delete'),
    taskController.deleteTask
  );



  router.patch(
    '/:id/assign',
    authenticate,
    authorize('tasks.assign'),
    assignTaskValidation,
    validateRequest,
    taskController.assignTask
  );



  router.patch(
    '/:id/status',
    authenticate,
    authorize('tasks.update'),
    changeTaskStatusValidation,
    validateRequest,
    taskController.changeTaskStatus
  );



  module.exports = router;