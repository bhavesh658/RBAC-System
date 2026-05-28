const leadService = require('./lead.service');

const asyncHandler = require('../../common/asyncHandler');
const sendResponse = require('../../common/apiResponse');

const HTTP_STATUS = require('../../constants/httpStatus');


const createLead = asyncHandler(async (req, res) => {
  const lead = await leadService.createLead(
    req.body,
    req.user
  );

  return sendResponse(
    res,
    HTTP_STATUS.CREATED,
    'Lead created successfully',
    lead
  );
});


const getAllLeads = asyncHandler(
  async (req, res) => {
    const result =
      await leadService.getAllLeads(
        req.query,
        req.user
      );

    return sendResponse(
      res,
      HTTP_STATUS.OK,
      'Leads fetched successfully',
      result
    );
  }
);

const getLeadById = asyncHandler(async (req, res) => {
  const lead = await leadService.getLeadById(
    req.params.id
  );

  return sendResponse(
    res,
    HTTP_STATUS.OK,
    'Lead fetched successfully',
    lead
  );
});


const updateLead = asyncHandler(async (req, res) => {
  const lead = await leadService.updateLead(
    req.params.id,
    req.body,
    req.user
  );

  return sendResponse(
    res,
    HTTP_STATUS.OK,
    'Lead updated successfully',
    lead
  );
});


const deleteLead = asyncHandler(async (req, res) => {
  await leadService.deleteLead(
    req.params.id,
    req.user
  );

  return sendResponse(
    res,
    HTTP_STATUS.OK,
    'Lead deleted successfully'
  );
});


const assignLead = asyncHandler(async (req, res) => {
  const lead = await leadService.assignLead(
    req.params.id,
    req.body.assignedTo,
    req.user
  );

  return sendResponse(
    res,
    HTTP_STATUS.OK,
    'Lead assigned successfully',
    lead
  );
});


const updateLeadStatus = asyncHandler(async (req, res) => {
  const lead = await leadService.updateLeadStatus(
    req.params.id,
    req.body.status,
    req.user
  );

  return sendResponse(
    res,
    HTTP_STATUS.OK,
    'Lead status updated successfully',
    lead
  );
});


module.exports = {
  createLead,
  getAllLeads,
  getLeadById,
  updateLead,
  deleteLead,
  assignLead,
  updateLeadStatus,
};