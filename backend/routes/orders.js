const express = require('express');
const mongoose = require('mongoose');
const Order = require('../models/Order');
const Product = require('../models/Product');
const { authenticateToken, staffOrAdmin } = require('../middleware/auth');

const router = express.Router();

/**
 * @route GET /api/orders
 * @desc Get all orders with optional filtering
 * @access Private (Staff/Admin)
 */
router.get('/', authenticateToken, staffOrAdmin, async (req, res) => {
    try {
        const { 
            type, 
            status, 
            partyName,
            page = 1, 
            limit = 20,
            sortBy = 'createdAt',
            sortOrder = 'desc'
        } = req.query;

        // Build query
        const query = {};

        if (type) {
            query.type = type;
        }

        if (status) {
            query.status = status;
        }

        if (partyName) {
            query.partyName = { $regex: partyName, $options: 'i' };
        }

        // Build sort object
        const sortObj = {};
        sortObj[sortBy] = sortOrder === 'desc' ? -1 : 1;

        // Execute query with pagination
        const skip = (parseInt(page) - 1) * parseInt(limit);
        
        const [orders, totalCount] = await Promise.all([
            Order.find(query)
                .sort(sortObj)
                .skip(skip)
                .limit(parseInt(limit))
                .populate('createdBy', 'username')
                .populate('lastModifiedBy', 'username')
                .populate('items.productId', 'name sku'),
            Order.countDocuments(query)
        ]);

        // Calculate pagination info
        const totalPages = Math.ceil(totalCount / parseInt(limit));
        const hasNextPage = parseInt(page) < totalPages;
        const hasPrevPage = parseInt(page) > 1;

        res.json({
            success: true,
            data: {
                orders,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages,
                    totalCount,
                    hasNextPage,
                    hasPrevPage,
                    limit: parseInt(limit)
                }
            }
        });

    } catch (error) {
        console.error('Orders fetch error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

/**
 * @route GET /api/orders/stats
 * @desc Get order statistics for dashboard
 * @access Private (Staff/Admin)
 */
router.get('/stats', authenticateToken, staffOrAdmin, async (req, res) => {
    try {
        const [
            totalOrders,
            pendingOrders,
            processingOrders,
            completedOrders,
            recentOrders
        ] = await Promise.all([
            Order.countDocuments({}),
            Order.countDocuments({ status: 'Pending' }),
            Order.countDocuments({ status: 'Processing' }),
            Order.countDocuments({ status: { $in: ['Shipped', 'Received'] } }),
            Order.find({})
                .sort({ createdAt: -1 })
                .limit(5)
                .populate('createdBy', 'username')
                .select('orderId type partyName status createdAt')
        ]);

        res.json({
            success: true,
            data: {
                totalOrders,
                pendingOrders,
                processingOrders,
                completedOrders,
                recentOrders
            }
        });

    } catch (error) {
        console.error('Order stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

/**
 * @route GET /api/orders/:id
 * @desc Get single order by ID
 * @access Private (Staff/Admin)
 */
router.get('/:id', authenticateToken, staffOrAdmin, async (req, res) => {
    try {
        const order = await Order.findById(req.params.id)
            .populate('createdBy', 'username')
            .populate('lastModifiedBy', 'username')
            .populate('items.productId', 'name sku category location')
            .populate('statusHistory.updatedBy', 'username');

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        res.json({
            success: true,
            data: { order }
        });

    } catch (error) {
        console.error('Order fetch error:', error);
        
        if (error.kind === 'ObjectId') {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

/**
 * @route POST /api/orders
 * @desc Create new order
 * @access Private (Staff/Admin)
 */
router.post('/', authenticateToken, staffOrAdmin, async (req, res) => {
    const session = await mongoose.startSession();
    
    try {
        await session.withTransaction(async () => {
            const { 
                type, 
                partyName, 
                partyContact, 
                items, 
                notes, 
                priority, 
                expectedDate 
            } = req.body;

            // Validate required fields
            if (!type || !partyName || !items || !Array.isArray(items) || items.length === 0) {
                throw new Error('Type, party name, and items are required');
            }

            if (!['Inbound', 'Outbound'].includes(type)) {
                throw new Error('Order type must be Inbound or Outbound');
            }

            // Validate and prepare items
            const orderItems = [];
            for (const item of items) {
                if (!item.productId || !item.quantity || item.quantity <= 0) {
                    throw new Error('Each item must have a valid productId and quantity');
                }

                const product = await Product.findById(item.productId).session(session);
                if (!product || !product.isActive) {
                    throw new Error(`Product not found: ${item.productId}`);
                }

                // For outbound orders, check if sufficient quantity is available
                if (type === 'Outbound' && product.quantity < item.quantity) {
                    throw new Error(`Insufficient quantity for product ${product.name}. Available: ${product.quantity}, Required: ${item.quantity}`);
                }

                orderItems.push({
                    productId: product._id,
                    productName: product.name,
                    productSku: product.sku,
                    quantity: parseInt(item.quantity),
                    unitPrice: parseFloat(item.unitPrice) || product.unitPrice || 0
                });
            }

            // Create order
            const order = new Order({
                type,
                partyName: partyName.trim(),
                partyContact: partyContact || {},
                items: orderItems,
                notes: notes?.trim() || '',
                priority: priority || 'Medium',
                expectedDate: expectedDate ? new Date(expectedDate) : null,
                createdBy: req.user._id,
                lastModifiedBy: req.user._id
            });

            await order.save({ session });
            
            // Populate the order for response
            await order.populate([
                { path: 'createdBy', select: 'username' },
                { path: 'items.productId', select: 'name sku category location' }
            ]);

            res.status(201).json({
                success: true,
                message: 'Order created successfully',
                data: { order }
            });
        });

    } catch (error) {
        console.error('Order creation error:', error);

        if (error.message.includes('required') || 
            error.message.includes('must be') || 
            error.message.includes('Insufficient') ||
            error.message.includes('not found')) {
            return res.status(400).json({
                success: false,
                message: error.message
            });
        }

        if (error.name === 'ValidationError') {
            const errors = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({
                success: false,
                message: 'Validation error',
                errors
            });
        }

        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    } finally {
        await session.endSession();
    }
});

/**
 * @route PUT /api/orders/:id/status
 * @desc Update order status with automatic inventory updates
 * @access Private (Staff/Admin)
 */
router.put('/:id/status', authenticateToken, staffOrAdmin, async (req, res) => {
    const session = await mongoose.startSession();
    
    try {
        await session.withTransaction(async () => {
            const { status, notes } = req.body;

            if (!status) {
                throw new Error('Status is required');
            }

            const validStatuses = ['Pending', 'Processing', 'Shipped', 'Received', 'Cancelled'];
            if (!validStatuses.includes(status)) {
                throw new Error('Invalid status');
            }

            const order = await Order.findById(req.params.id).session(session);
            if (!order) {
                throw new Error('Order not found');
            }

            const oldStatus = order.status;
            
            // Check if status change is valid
            if (oldStatus === status) {
                throw new Error('Order already has this status');
            }

            // Handle inventory updates based on status change
            if (status === 'Shipped' && order.type === 'Outbound') {
                // Decrease inventory for outbound shipments
                for (const item of order.items) {
                    const product = await Product.findById(item.productId).session(session);
                    if (product) {
                        if (product.quantity < item.quantity) {
                            throw new Error(`Insufficient quantity for product ${product.name}. Available: ${product.quantity}, Required: ${item.quantity}`);
                        }
                        product.quantity -= item.quantity;
                        await product.save({ session });
                    }
                }
            } else if (status === 'Received' && order.type === 'Inbound') {
                // Increase inventory for inbound receipts
                for (const item of order.items) {
                    const product = await Product.findById(item.productId).session(session);
                    if (product) {
                        product.quantity += item.quantity;
                        await product.save({ session });
                    }
                }
            }

            // Update order status
            order.status = status;
            order.lastModifiedBy = req.user._id;
            
            // Add status change note
            if (notes) {
                order.notes += (order.notes ? '\n\n' : '') + `Status Update (${new Date().toISOString()}): ${notes}`;
            }

            await order.save({ session });

            // Populate for response
            await order.populate([
                { path: 'createdBy', select: 'username' },
                { path: 'lastModifiedBy', select: 'username' },
                { path: 'items.productId', select: 'name sku category location' }
            ]);

            res.json({
                success: true,
                message: `Order status updated to ${status}`,
                data: { 
                    order,
                    inventoryUpdated: ['Shipped', 'Received'].includes(status)
                }
            });
        });

    } catch (error) {
        console.error('Order status update error:', error);

        if (error.kind === 'ObjectId') {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        if (error.message.includes('required') || 
            error.message.includes('Invalid') || 
            error.message.includes('not found') ||
            error.message.includes('Insufficient') ||
            error.message.includes('already has')) {
            return res.status(400).json({
                success: false,
                message: error.message
            });
        }

        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    } finally {
        await session.endSession();
    }
});

/**
 * @route PUT /api/orders/:id
 * @desc Update order details
 * @access Private (Staff/Admin)
 */
router.put('/:id', authenticateToken, staffOrAdmin, async (req, res) => {
    try {
        const { partyName, partyContact, notes, priority, expectedDate } = req.body;

        const order = await Order.findById(req.params.id);
        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        // Only allow updates if order is not completed
        if (['Shipped', 'Received', 'Cancelled'].includes(order.status)) {
            return res.status(400).json({
                success: false,
                message: 'Cannot update completed orders'
            });
        }

        // Update allowed fields
        if (partyName !== undefined) order.partyName = partyName.trim();
        if (partyContact !== undefined) order.partyContact = partyContact;
        if (notes !== undefined) order.notes = notes.trim();
        if (priority !== undefined) order.priority = priority;
        if (expectedDate !== undefined) order.expectedDate = expectedDate ? new Date(expectedDate) : null;
        
        order.lastModifiedBy = req.user._id;

        await order.save();

        // Populate for response
        await order.populate([
            { path: 'createdBy', select: 'username' },
            { path: 'lastModifiedBy', select: 'username' },
            { path: 'items.productId', select: 'name sku category location' }
        ]);

        res.json({
            success: true,
            message: 'Order updated successfully',
            data: { order }
        });

    } catch (error) {
        console.error('Order update error:', error);

        if (error.kind === 'ObjectId') {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        if (error.name === 'ValidationError') {
            const errors = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({
                success: false,
                message: 'Validation error',
                errors
            });
        }

        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

/**
 * @route DELETE /api/orders/:id
 * @desc Cancel order
 * @access Private (Staff/Admin)
 */
router.delete('/:id', authenticateToken, staffOrAdmin, async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);
        
        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        // Only allow cancellation of pending or processing orders
        if (!['Pending', 'Processing'].includes(order.status)) {
            return res.status(400).json({
                success: false,
                message: 'Can only cancel pending or processing orders'
            });
        }

        order.status = 'Cancelled';
        order.lastModifiedBy = req.user._id;
        await order.save();

        res.json({
            success: true,
            message: 'Order cancelled successfully'
        });

    } catch (error) {
        console.error('Order cancellation error:', error);

        if (error.kind === 'ObjectId') {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

module.exports = router;