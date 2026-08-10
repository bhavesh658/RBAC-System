const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
    {
        firstName: {
            type: String,
            required: [true, 'First name is required'],
            trim: true,
            maxlength: [50, 'First name cannot exceed 50 characters'],
        },

        lastName: {
            type: String,
            trim: true,
            maxlength: [50, 'Last name cannot exceed 50 characters'],
            default: '',
        },

        email: {
            type: String,
            required: [true, 'Email is required'],
            unique: true,
            lowercase: true,
            trim: true,
            index: true,
        },

        password: {
            type: String,
            required: [false, 'Password is optional'],
            minlength: [6, 'Password must be at least 6 characters long'],
            select: false,
        },
        status: {
            type: String,
            enum: ['Pending', 'Active', 'Inactive'],
            default: 'Pending',
        },

        phone: {
            type: String,
            trim: true,
            default: '',
        },

        department: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Department',
            default: null,
            require:true,

        },

        role: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Role',
            default: null,
            required:true,
        },

        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            default: null,
        },

        isActive: {
            type: Boolean,
            default: true,
        },

        lastLoginAt: {
            type: Date,
            default: null,
        },
        resetPasswordOtp: {
            type: String,
            default: null,
            select: false,
        },

        resetPasswordOtpExpires: {
            type: Date,
            default: null,
            select: false,
        },

        refreshToken: {
            type: String,
            default: null,
            select: false,
        },
        inviteToken: String,
        inviteTokenExpire: Date,
    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    }
);


userSchema.virtual('fullName').get(function () {
    return `${this.firstName} ${this.lastName}`.trim();
});


userSchema.pre('save', async function () {
    if (!this.isModified('password')) {
        return;
    }

    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

userSchema.methods.comparePassword = async function (candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model('User', userSchema);

module.exports = User;