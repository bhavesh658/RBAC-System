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


const getAllLeads = async (
  query = {},
  currentUser
) => {
  const { limit, skip } = getPagination(query);
  const filter = {};

  if (currentUser.role?.name !== 'Super Admin') {
    filter.isDeleted = false;
    filter.isActive = true;
  }

  if (query.status) filter.status = query.status;
  if (query.priority) filter.priority = query.priority;
  if (query.assignedTo) filter.assignedTo = query.assignedTo;
  if (query.department) filter.department = query.department;

  const result = await Lead.aggregate([
    {
      $facet: {
        leadsData: [
          { $match: filter }, // Jo filter user ne apply kiya
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
              from: 'departments', // Aapke departments collection ka naam
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
          // Sirf zaroori fields ko select/project karne ke liye:
          {
            $project: {
              'assignedTo.password': 0, // Jo fields nahi chahiye unhe hata sakte hain
              'createdBy.password': 0,
              'updatedBy.password': 0,
            }
          }
        ],
        // Track 2: Saare global counts ek sath calculation
        totalCount: [{ $count: "count" }],
        activeCount: [
          { $match: { isDeleted: false, isActive: true } },
          { $count: "count" }
        ],
        inactiveCount: [
          { $match: { isActive: false, isDeleted: false } },
          { $count: "count" }
        ],
        deletedCount: [
          { $match: { isDeleted: true } },
          { $count: "count" }
        ]
      }
    }
  ]);

  const facetResult = result[0];

  return {
    counts: {
      totalLeads: facetResult.totalCount[0]?.count || 0,
      activeLeads: facetResult.activeCount[0]?.count || 0,
      inactiveLeads: facetResult.inactiveCount[0]?.count || 0,
      deletedLeads: facetResult.deletedCount[0]?.count || 0,
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
    throw new AppError(
      'Lead not found',
      HTTP_STATUS.NOT_FOUND
    );
  }

  return lead;
};


const updateLead = async (
  leadId,
  payload,
  currentUser
) => {

  const lead = await Lead.findOne({ _id: leadId, isDeleted: false });

  if (!lead) {
    throw new AppError(
      'Lead not found',
      HTTP_STATUS.NOT_FOUND
    );
  }

  Object.assign(lead, payload, { updatedBy: currentUser._id });
  await lead.save();

  await createActivityLog({
    module: 'Lead',
    action: 'Update',
    description: `${currentUser.firstName} ${currentUser.lastName} updated lead "${lead._id}"`,
    performedBy: currentUser._id,
    recordId: lead._id,
    metadata: {
      newValue: {
        ...payload,
        updatedBy: currentUser._id,
      }
    }
  });

  return getLeadById(lead._id);
};


const deleteLead = async (
  leadId,
  currentUser
) => {
  const lead = await Lead.findOneAndUpdate({ _id: leadId, isDeleted: false,});

  if (!lead) {
    throw new AppError(
      'Lead not found',
      HTTP_STATUS.NOT_FOUND
    );
  }

  await createActivityLog({
    module: 'Lead',
    action: 'Delete',
    description: `${currentUser.firstName} ${currentUser.lastName} deleted lead "${lead.name}"`,
    performedBy: currentUser._id,
    recordId: lead._id,
  });

  return null;
};


const assignLead = async (leadId, assignedTo, currentUser) => {
  const lead = await Lead.findOne({
    _id: leadId,
    isDeleted: false,
  });


  const user = await User.findOne({
    _id: assignedTo,
  });

  if (!user) {
    throw new AppError(
      'Assigned user not found or inactive',
      HTTP_STATUS.NOT_FOUND
    );
  }
  if (!lead) {
    throw new AppError(
      'Lead not found',
      HTTP_STATUS.NOT_FOUND
    );
  }
  const oldlead = {
    assignedTo: lead.assignedTo,
    status: lead.status,
  }
  await createActivityLog({
    module: 'Lead',
    action: 'Assign',
    description: `${currentUser.firstName} ${currentUser.lastName} assigned lead "${lead._id}" to user "${user.firstName} ${user.lastName}"`,
    performedBy: currentUser._id,
    metadata: {
      previousValue : {
        assignedTo: oldlead.assignedTo,
        status: oldlead.status,
      }
      ,
      newValue: {
        assignedTo,
        status: oldlead.status,
      }
    },
    recordId: leadId,
  });

  return updateLead(leadId, { assignedTo }, currentUser);
};


const updateLeadStatus = async (
  leadId,
  status,
  currentUser
) => {

  await createActivityLog({
    module: 'Lead',
    action: 'Status Update',
    description: `${currentUser.firstName} ${currentUser.lastName} updated status of lead "${leadId}" to "${status}"`,
    performedBy: currentUser._id,
    recordId: leadId,
    metadata: {
      newValue: {
        status,
      }
    }
  });

  return updateLead(
    leadId,
    {
      status,
      updatedBy: currentUser._id, // User who updated the status
    },
    currentUser
  );
};


module.exports = {
  createLead,
  getAllLeads,
  getLeadById,
  updateLead,
  deleteLead,
  assignLead,
  updateLeadStatus,
};