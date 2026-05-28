
const express = require('express');
const router = express.Router();

const authenticate = require('../../middleware/authenticate');
const authorize = require('../../middleware/authorize');
const validateRequest = require('../../middleware/validateRequest');
const validateObjectId = require('../../middleware/validateObjectId');
const leadController = require('./lead.controller');

const {
  createLeadValidation,
  updateLeadValidation,
  assignLeadValidation,
  updateLeadStatusValidation,
} = require('./lead.validation');


router.post(
  '/',
  authenticate,
  authorize('leads.create'),
  createLeadValidation ,
  validateRequest,
  leadController.createLead
);


router.get(
  '/',
  authenticate,
  authorize('leads.read'),
  leadController.getAllLeads
);


router.get(
  '/:id',
  authenticate,
  authorize('leads.read'),
  validateObjectId,
  leadController.getLeadById
);


router.patch(
  '/:id',
  authenticate,
  authorize('leads.update'),
  validateObjectId,
  updateLeadValidation,
  validateRequest,
  leadController.updateLead
);

router.patch(
  '/:id/assign',
  authenticate,
  authorize('leads.assign'),
  validateObjectId,
  assignLeadValidation,
  validateRequest,
  leadController.assignLead
);


router.patch(
  '/:id/status',
  authenticate,
  authorize('leads.update'),
  validateObjectId,
  updateLeadStatusValidation,
  validateRequest,
  leadController.updateLeadStatus
);


router.delete(
  '/:id',
  authenticate,
  authorize('leads.delete'),
  validateObjectId,
  leadController.deleteLead
);

module.exports = router;