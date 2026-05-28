const mongoose = require('mongoose');
const pagination = require('../../common/pagination');

const permissionSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'Permission name is required'],
            trim: true,
            unique: true,
            lowercase: true,
        },

        module: {
            type: String,
            required: [true, 'Module name is required'],
            trim: true,
            lowercase: true,
        },

        action: {
            type: String,
            required: [true, 'Action name is required'],
            trim: true,
            lowercase: true,
        },

        description: {
            type: String,
            trim: true,
            default: '',
            maxlength: [500, 'Description cannot exceed 500 characters'],
        },

        isActive: {
            type: Boolean,
            default: true,
        },

        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            default: null,
        },
    },
    {
        timestamps: true,
    }
);
permissionSchema.plugin(pagination);
const Permission = mongoose.model('Permission', permissionSchema);

module.exports = Permission;