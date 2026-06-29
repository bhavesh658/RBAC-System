const mongoose = require('mongoose');

const activityLogSchema =
    new mongoose.Schema(
        {
            module: {
                type: String,
                required: true,
            },

            action: {
                type: String,
                required: true,
            },

            description: {
                type: String,
                required: true,
            },

            recordId: {
                type:
                    mongoose.Schema.Types.ObjectId,
                default: null,
            },

            performedBy: {
                type:
                    mongoose.Schema.Types.ObjectId,
                ref: 'User',
                required: true,
            },

            metadata: {
                type: Object,
                default: {},
            },
        },
        {
            timestamps: true,
        }
    );


activityLogSchema.index({ performedBy: 1, createdAt: -1 });
activityLogSchema.index({ module: 1, action: 1, createdAt: -1 });
activityLogSchema.index({ recordId: 1 });


module.exports = mongoose.model(
    'ActivityLog',
    activityLogSchema
);