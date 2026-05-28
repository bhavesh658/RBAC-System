const mongoose = require('mongoose');

const roleSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'Role name is required'],
            trim: true,
            maxlength: [100, 'Role name cannot exceed 100 characters'],
        },

        description: {
            type: String,
            trim: true,
            default: '',
            maxlength: [500, 'Description cannot exceed 500 characters'],
        },

        department: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Department',
            required: [true, 'Department is required'],
        },

        permissions: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Permission',
            },
        ],

        parentRole: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Role',
            default: null,
        },

        isSystemRole: {
            type: Boolean,
            default: false,
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

// Unique role name within a department
roleSchema.index(
    { department: 1, name: 1 },
    { unique: true }
);

const Role = mongoose.model('Role', roleSchema);

module.exports = Role;