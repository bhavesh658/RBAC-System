const mongoose = require('mongoose');

const departmentSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'Department name is required'],
            trim: true,
            unique: true,
            maxlength: [100, 'Department name cannot exceed 100 characters'],
        },

        code: {
            type: String,
            required: [true, 'Department code is required'],
            trim: true,
            uppercase: true,
            unique: true,
            maxlength: [20, 'Department code cannot exceed 20 characters'],
        },

        description: {
            type: String,
            trim: true,
            default: '',
            maxlength: [500, 'Description cannot exceed 500 characters'],
        },

        head: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            default: null,
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

const Department = mongoose.model('Department', departmentSchema);

module.exports = Department;