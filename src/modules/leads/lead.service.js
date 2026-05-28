const Lead = require('./lead.model');
const getPagination = require('../../common/pagination');
const AppError = require('../../common/AppError');
const HTTP_STATUS = require('../../constants/httpStatus');


const createLead = async (payload, currentUser) => {
  const lead = await Lead.create({
    ...payload,
    createdBy: currentUser._id,
    updatedBy: currentUser._id,
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
  const lead = await Lead.findOneAndUpdate(
    {
      _id: leadId,
      isDeleted: false,
    },
    {
      ...payload,
      updatedBy: currentUser._id,
    },
    {
      new: true,
      runValidators: true,
    }
  );

  if (!lead) {
    throw new AppError(
      'Lead not found',
      HTTP_STATUS.NOT_FOUND
    );
  }

  return getLeadById(lead._id);
};


const deleteLead = async (
  leadId,
  currentUser
) => {
  const lead = await Lead.findOneAndUpdate(
    {
      _id: leadId,
      isDeleted: false,
    },
    {
      isDeleted: true,
      updatedBy: currentUser._id,
    },
    {
      new: true,
    }
  );

  if (!lead) {
    throw new AppError(
      'Lead not found',
      HTTP_STATUS.NOT_FOUND
    );
  }

  return null;
};


const assignLead = async (
  leadId,
  assignedTo,
  currentUser
) => {
  return updateLead(
    leadId,
    { assignedTo },
    currentUser
  );
};


const updateLeadStatus = async (
  leadId,
  status,
  currentUser
) => {
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