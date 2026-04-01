const mongoose = require('mongoose');

/**
 * Order Schema for managing inbound and outbound orders
 * Supports automatic inventory updates based on status changes
 */
const orderItemSchema = new mongoose.Schema({
    productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: [true, 'Product ID is required']
    },
    productName: {
        type: String,
        required: [true, 'Product name is required']
    },
    productSku: {
        type: String,
        required: [true, 'Product SKU is required']
    },
    quantity: {
        type: Number,
        required: [true, 'Quantity is required'],
        min: [1, 'Quantity must be at least 1']
    },
    unitPrice: {
        type: Number,
        min: [0, 'Unit price cannot be negative'],
        default: 0
    }
}, { _id: false });

const orderSchema = new mongoose.Schema({
    orderId: {
        type: String,
        unique: true,
        required: [true, 'Order ID is required']
    },
    type: {
        type: String,
        enum: {
            values: ['Inbound', 'Outbound'],
            message: 'Order type must be either Inbound or Outbound'
        },
        required: [true, 'Order type is required']
    },
    partyName: {
        type: String,
        required: [true, 'Party name (Customer/Supplier) is required'],
        trim: true,
        maxlength: [100, 'Party name cannot exceed 100 characters']
    },
    partyContact: {
        email: {
            type: String,
            trim: true,
            lowercase: true
        },
        phone: {
            type: String,
            trim: true
        },
        address: {
            type: String,
            trim: true,
            maxlength: [500, 'Address cannot exceed 500 characters']
        }
    },
    items: {
        type: [orderItemSchema],
        validate: {
            validator: function(items) {
                return items && items.length > 0;
            },
            message: 'Order must contain at least one item'
        }
    },
    status: {
        type: String,
        enum: {
            values: ['Pending', 'Processing', 'Shipped', 'Received', 'Cancelled'],
            message: 'Invalid status value'
        },
        default: 'Pending'
    },
    priority: {
        type: String,
        enum: ['Low', 'Medium', 'High', 'Urgent'],
        default: 'Medium'
    },
    notes: {
        type: String,
        trim: true,
        maxlength: [1000, 'Notes cannot exceed 1000 characters']
    },
    totalValue: {
        type: Number,
        min: [0, 'Total value cannot be negative'],
        default: 0
    },
    expectedDate: {
        type: Date
    },
    completedDate: {
        type: Date
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Created by user is required']
    },
    lastModifiedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    statusHistory: [{
        status: String,
        timestamp: {
            type: Date,
            default: Date.now
        },
        updatedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        notes: String
    }]
}, {
    timestamps: true
});

// Indexes for better query performance
orderSchema.index({ orderId: 1 });
orderSchema.index({ type: 1, status: 1 });
orderSchema.index({ createdAt: -1 });
orderSchema.index({ partyName: 1 });
orderSchema.index({ 'items.productId': 1 });

// Virtual for order age in days
orderSchema.virtual('ageInDays').get(function() {
    return Math.floor((Date.now() - this.createdAt) / (1000 * 60 * 60 * 24));
});

// Virtual for total items count
orderSchema.virtual('totalItems').get(function() {
    return this.items.reduce((sum, item) => sum + item.quantity, 0);
});

// Pre-save middleware to generate orderId and calculate totals
orderSchema.pre('save', function(next) {
    // Generate orderId if not provided
    if (!this.orderId) {
        const prefix = this.type === 'Inbound' ? 'IN' : 'OUT';
        const timestamp = Date.now().toString().slice(-8);
        this.orderId = `${prefix}-${timestamp}`;
    }
    
    // Calculate total value
    this.totalValue = this.items.reduce((sum, item) => {
        return sum + (item.quantity * item.unitPrice);
    }, 0);
    
    // Add to status history if status changed
    if (this.isModified('status')) {
        this.statusHistory.push({
            status: this.status,
            timestamp: new Date(),
            updatedBy: this.lastModifiedBy,
            notes: `Status changed to ${this.status}`
        });
        
        // Set completion date for final statuses
        if (['Shipped', 'Received', 'Cancelled'].includes(this.status)) {
            this.completedDate = new Date();
        }
    }
    
    next();
});

// Ensure virtual fields are serialized
orderSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Order', orderSchema);