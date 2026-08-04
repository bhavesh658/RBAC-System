const ActivityLog = require(
    './activityLog.model'
);

const getPagination = require(
    '../../common/pagination'
);

const createActivityLog =
    async ({
        module,
        action,
        description,
        recordId = null,
        performedBy,
        metadata = {},
    }) => {

        return ActivityLog.create({
            module,
            action,
            description,
            recordId,
            performedBy,
            metadata,
        });
    };




const getAllActivityLogs = async (query = {}) => {
    const { limit, skip } = getPagination(query);
    const page = parseInt(query.page) || 1; 

    const filter = {};

    if (query.module) {
        filter.module = query.module;
    }
    if (query.action) {
        filter.action = query.action;
    }
    if (query.performedBy) {
        filter.performedBy = query.performedBy;
    }
    if (query.recordId) {
        filter.recordId = query.recordId;
    }

    const logs = await ActivityLog.find(filter)
        .skip(skip)
        .limit(limit)
        .populate('performedBy', 'firstName lastName email fullName') 
        .sort({ createdAt: -1 });

    const totalRecords = await ActivityLog.countDocuments(filter);
    const totalPages = Math.ceil(totalRecords / limit);

    return {
        logs,
        pagination: {
            totalRecords,
            totalPages,
            currentPage: page,
            limit
        }
    };
};
module.exports = {
    createActivityLog,
    getAllActivityLogs,
};