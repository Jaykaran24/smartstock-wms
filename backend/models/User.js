const mongoose = require('mongoose');

/**
 * User Schema for authentication and authorization
 * Supports Admin and Staff roles with different permissions
 */
const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: [true, 'Username is required'],
        unique: true,
        trim: true,
        minlength: [3, 'Username must be at least 3 characters long'],
        maxlength: [30, 'Username cannot exceed 30 characters']
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: [6, 'Password must be at least 6 characters long']
    },
    role: {
        type: String,
        enum: {
            values: ['Admin', 'Staff'],
            message: 'Role must be either Admin or Staff'
        },
        default: 'Staff'
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    lastLogin: {
        type: Date
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

// Indexes for better query performance
userSchema.index({ username: 1 });
userSchema.index({ role: 1 });

// Virtual for user display name
userSchema.virtual('displayInfo').get(function() {
    return {
        id: this._id,
        username: this.username,
        role: this.role,
        isActive: this.isActive,
        createdAt: this.createdAt
    };
});

// Ensure virtual fields are serialized
userSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('User', userSchema);