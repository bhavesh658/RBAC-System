const mongoose = require('mongoose');
const Lead = require('./lead.model');
const User = require('../users/user.model');
const getPagination = require('../../common/pagination');
const AppError = require('../../common/AppError');
const HTTP_STATUS = require('../../constants/httpStatus');
const { createActivityLog } = require('../activity-logs/activityLog.service');

const createLead = async (payload, currentUser) => {
  const lead = await Lead.create({
    ...payload,
    createdBy: currentUser._id,
    updatedBy: currentUser._id,
  });

  await createActivityLog({
    module: 'Lead',
    action: 'Create',
    description: `${currentUser.firstName} ${currentUser.lastName} created a new lead`,
    performedBy: currentUser._id,
    metadata: {
      newvalue: {
        ...payload,
        createdBy: currentUser._id,
        updatedBy: currentUser._id,
      }
    }
  });

  return getLeadById(lead._id);
};

const getAllLeads = async (query = {}, currentUser) => {
  const { limit, skip } = getPagination(query);
  const filter = {};

  filter.isDeleted = false;

  if (query.status) filter.status = query.status;
  if (query.priority) filter.priority = query.priority;
  if (query.assignedTo) filter.assignedTo = query.assignedTo;
  if (query.department) filter.department = query.department;

  const result = await Lead.aggregate([
    {
      $facet: {
        leadsData: [
          { $match: filter },
          { $sort: { createdAt: -1 } },
          { $skip: skip },
          { $limit: limit },
          {
            $lookup: {
              from: 'users',
              localField: 'assignedTo',
              foreignField: '_id',
              as: 'assignedTo'
            }
          },
          { $unwind: { path: '$assignedTo', preserveNullAndEmptyArrays: true } },
          {
            $lookup: {
              from: 'departments',
              localField: 'department',
              foreignField: '_id',
              as: 'department'
            }
          },
          { $unwind: { path: '$department', preserveNullAndEmptyArrays: true } },
          {
            $lookup: {
              from: 'users',
              localField: 'createdBy',
              foreignField: '_id',
              as: 'createdBy'
            }
          },
          { $unwind: { path: '$createdBy', preserveNullAndEmptyArrays: true } },
          {
            $lookup: {
              from: 'users',
              localField: 'updatedBy',
              foreignField: '_id',
              as: 'updatedBy'
            }
          },
          { $unwind: { path: '$updatedBy', preserveNullAndEmptyArrays: true } },
          {
            $project: {
              'assignedTo.password': 0,
              'createdBy.password': 0,
              'updatedBy.password': 0,
            }
          }
        ],
        //  Updated: Ab Status ke base par counters calculate honge
        totalCount: [{ $match: { isDeleted: false } }, { $count: "count" }],
        newCount: [{ $match: { isDeleted: false, status: 'New' } }, { $count: "count" }],
        contactedCount: [{ $match: { isDeleted: false, status: 'Contacted' } }, { $count: "count" }],
        convertedCount: [{ $match: { isDeleted: false, status: 'Converted' } }, { $count: "count" }],
        lostCount: [{ $match: { isDeleted: false, status: 'Lost' } }, { $count: "count" }],
      }
    }
  ]);

  const facetResult = result[0];

  return {
    counts: {
      totalLeads: facetResult.totalCount[0]?.count || 0,
      newLeads: facetResult.newCount[0]?.count || 0,
      contactedLeads: facetResult.contactedCount[0]?.count || 0,
      convertedLeads: facetResult.convertedCount[0]?.count || 0,
      lostLeads: facetResult.lostCount[0]?.count || 0,
    },
    leads: facetResult.leadsData,
  };
};

const getLeadById = async (leadId) => {
  const lead = await Lead.findOne({
    _id: leadId,
    isDeleted: false,
  })
    .populate('assignedTo', 'firstName lastName email')
    .populate('department', 'name code')
    .populate('createdBy', 'firstName lastName')
    .populate('updatedBy', 'firstName lastName');

  if (!lead) {
    throw new AppError('Lead not found', HTTP_STATUS.NOT_FOUND);
  }
  return lead;
};

const updateLead = async (leadId, payload, currentUser) => {
  const lead = await Lead.findOne({ _id: leadId, isDeleted: false });

  if (!lead) {
    throw new AppError('Lead not found', HTTP_STATUS.NOT_FOUND);
  }

  Object.assign(lead, payload, { updatedBy: currentUser._id });
  await lead.save();

  await createActivityLog({
    module: 'Lead',
    action: 'Update',
    description: `${currentUser.firstName} ${currentUser.lastName} updated lead details`,
    performedBy: currentUser._id,
    recordId: lead._id,
    metadata: {
      newValue: { ...payload, updatedBy: currentUser.firstName + ' ' + currentUser.lastName },
    }
  });

  return getLeadById(lead._id);
};

const deleteLead = async (leadId, currentUser) => {
  // Sirf isDeleted true karna hai, isActive hata diya
  const lead = await Lead.findOneAndUpdate(
    { _id: leadId, isDeleted: false },
    { isDeleted: true, updatedBy: currentUser._id },
    { new: true }
  );

  if (!lead) {
    throw new AppError('Lead not found', HTTP_STATUS.NOT_FOUND);
  }

  await createActivityLog({
    module: 'Lead',
    action: 'Delete',
    description: `${currentUser.firstName} ${currentUser.lastName} deleted lead`,
    performedBy: currentUser._id,
    recordId: lead._id,
  });

  return null;
};

const assignLead = async (leadId, assignedTo, currentUser) => {
  const lead = await Lead.findOne({ _id: leadId, isDeleted: false });
  const user = await User.findOne({ _id: assignedTo });

  if (!user) {
    throw new AppError('Assigned user not found', HTTP_STATUS.NOT_FOUND);
  }
  if (!lead) {
    throw new AppError('Lead not found', HTTP_STATUS.NOT_FOUND);
  }

  const oldlead = { assignedTo: lead.assignedTo, status: lead.status };

  await createActivityLog({
    module: 'Lead',
    action: 'Assign',
    description: `${currentUser.firstName} ${currentUser.lastName} assigned lead to user "${user.firstName}"`,
    performedBy: currentUser._id,
    recordId: leadId,
    metadata: {
      previousValue: oldlead,
      newValue: { assignedTo    , status: oldlead.status }
    },
  });

  return updateLead(leadId, { assignedTo }, currentUser);
};

const updateLeadStatus = async (leadId, status, currentUser) => {
  await createActivityLog({
    module: 'Lead',
    action: 'Status Update',
    description: `${currentUser.firstName} ${currentUser.lastName} updated status to "${status}"`,
    performedBy: currentUser._id,
    recordId: leadId,
    metadata: { newValue: { status } }
  });

  return updateLead(leadId, { status, updatedBy: currentUser._id }, currentUser);
};


const getMyLeads = async (query = {}, currentUser) => {
  const { limit, skip } = getPagination(query);

  const userId = new mongoose.Types.ObjectId(currentUser._id);

  const filter = {
    isDeleted: false,
    assignedTo: userId,
  };

  if (query.status) filter.status = query.status;
  if (query.priority) filter.priority = query.priority;

  const result = await Lead.aggregate([
    {
      $facet: {
        leadsData: [
          { $match: filter },
          { $sort: { createdAt: -1 } },
          { $skip: skip },
          { $limit: limit },
          {
            $lookup: {
              from: 'departments',
              localField: 'department',
              foreignField: '_id',
              as: 'department'
            }
          },
          { $unwind: { path: '$department', preserveNullAndEmptyArrays: true } },
          {
            $lookup: {
              from: 'users',
              localField: 'createdBy',
              foreignField: '_id',
              as: 'createdBy'
            }
          },
          { $unwind: { path: '$createdBy', preserveNullAndEmptyArrays: true } },
          {
            $project: {
              firstName: 1,
              lastName: 1,
              email: 1,
              phone: 1,
              company: 1,
              source: 1,
              status: 1,
              priority: 1,
              estimatedValue: 1,
              notes: 1,
              followUpDate: 1,
              tags: 1,
              createdAt: 1,
              updatedAt: 1,
              assignedTo: 1,
              'department.name': 1,
              'department.code': 1,
              'createdBy.firstName': 1,
              'createdBy.lastName': 1,
              'createdBy.email': 1,
            }
          }
        ],
        totalCount: [{ $match: { isDeleted: false, assignedTo: userId } }, { $count: "count" }],
        newCount: [{ $match: { isDeleted: false, assignedTo: userId, status: 'New' } }, { $count: "count" }],
        contactedCount: [{ $match: { isDeleted: false, assignedTo: userId, status: 'Contacted' } }, { $count: "count" }],
        convertedCount: [{ $match: { isDeleted: false, assignedTo: userId, status: 'Converted' } }, { $count: "count" }],
        lostCount: [{ $match: { isDeleted: false, assignedTo: userId, status: 'Lost' } }, { $count: "count" }],
      }
    }
  ]);

  const facetResult = result[0];

  return {
    counts: {
      totalLeads: facetResult.totalCount[0]?.count || 0,
      newLeads: facetResult.newCount[0]?.count || 0,
      contactedLeads: facetResult.contactedCount[0]?.count || 0,
      convertedLeads: facetResult.convertedCount[0]?.count || 0,
      lostLeads: facetResult.lostCount[0]?.count || 0,
    },
    leads: facetResult.leadsData,
  };
};
module.exports = {
  createLead,
  getAllLeads,
  getLeadById,
  updateLead,
  deleteLead,
  assignLead,
  updateLeadStatus,
  getMyLeads
};