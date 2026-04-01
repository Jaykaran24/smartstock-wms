const mongoose = require('mongoose');

/**
 * Product Schema for inventory management
 * Includes stock tracking, location management, and audit trail
 */
const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Product name is required'],
        trim: true,
        maxlength: [100, 'Product name cannot exceed 100 characters']
    },
    sku: {
        type: String,
        required: [true, 'SKU is required'],
        unique: true,
        trim: true,
        uppercase: true,
        match: [/^[A-Z0-9-_]+$/, 'SKU can only contain letters, numbers, hyphens, and underscores']
    },
    category: {
        type: String,
        required: [true, 'Category is required'],
        trim: true,
        maxlength: [50, 'Category cannot exceed 50 characters']
    },
    quantity: {
        type: Number,
        required: [true, 'Quantity is required'],
        min: [0, 'Quantity cannot be negative'],
        default: 0
    },
    location: {
        type: String,
        required: [true, 'Location is required'],
        trim: true,
        maxlength: [50, 'Location cannot exceed 50 characters']
    },
    description: {
        type: String,
        trim: true,
        maxlength: [500, 'Description cannot exceed 500 characters']
    },
    unitPrice: {
        type: Number,
        min: [0, 'Unit price cannot be negative'],
        default: 0
    },
    reorderLevel: {
        type: Number,
        min: [0, 'Reorder level cannot be negative'],
        default: 10
    },
    lastUpdated: {
        type: Date,
        default: Date.now
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

// Indexes for better query performance
productSchema.index({ sku: 1 });
productSchema.index({ category: 1 });
productSchema.index({ name: 'text', sku: 'text' }); // Text search
productSchema.index({ quantity: 1 });

// Virtual for low stock indicator
productSchema.virtual('isLowStock').get(function() {
    return this.quantity <= this.reorderLevel;
});

// Virtual for stock status
productSchema.virtual('stockStatus').get(function() {
    if (this.quantity === 0) return 'Out of Stock';
    if (this.quantity <= this.reorderLevel) return 'Low Stock';
    return 'In Stock';
});

// Pre-save middleware to update lastUpdated
productSchema.pre('save', function(next) {
    this.lastUpdated = Date.now();
    next();
});

// Ensure virtual fields are serialized
productSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Product', productSchema);