const express = require('express');
const Product = require('../models/Product');
const { authenticateToken, staffOrAdmin } = require('../middleware/auth');

const router = express.Router();

/**
 * @route GET /api/products
 * @desc Get all products with optional search and filtering
 * @access Private (Staff/Admin)
 */
router.get('/', authenticateToken, staffOrAdmin, async (req, res) => {
    try {
        const { 
            search, 
            category, 
            lowStock, 
            page = 1, 
            limit = 50,
            sortBy = 'name',
            sortOrder = 'asc'
        } = req.query;

        // Build query
        const query = { isActive: true };

        // Search by name or SKU
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { sku: { $regex: search, $options: 'i' } }
            ];
        }

        // Filter by category
        if (category) {
            query.category = { $regex: category, $options: 'i' };
        }

        // Filter low stock items
        if (lowStock === 'true') {
            query.$expr = { $lte: ['$quantity', '$reorderLevel'] };
        }

        // Build sort object
        const sortObj = {};
        sortObj[sortBy] = sortOrder === 'desc' ? -1 : 1;

        // Execute query with pagination
        const skip = (parseInt(page) - 1) * parseInt(limit);
        
        const [products, totalCount] = await Promise.all([
            Product.find(query)
                .sort(sortObj)
                .skip(skip)
                .limit(parseInt(limit))
                .populate('createdBy', 'username'),
            Product.countDocuments(query)
        ]);

        // Calculate pagination info
        const totalPages = Math.ceil(totalCount / parseInt(limit));
        const hasNextPage = parseInt(page) < totalPages;
        const hasPrevPage = parseInt(page) > 1;

        res.json({
            success: true,
            data: {
                products,
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
        console.error('Products fetch error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

/**
 * @route GET /api/products/stats
 * @desc Get product statistics for dashboard
 * @access Private (Staff/Admin)
 */
router.get('/stats', authenticateToken, staffOrAdmin, async (req, res) => {
    try {
        const [
            totalProducts,
            totalQuantity,
            lowStockCount,
            outOfStockCount,
            categories
        ] = await Promise.all([
            Product.countDocuments({ isActive: true }),
            Product.aggregate([
                { $match: { isActive: true } },
                { $group: { _id: null, total: { $sum: '$quantity' } } }
            ]),
            Product.countDocuments({
                isActive: true,
                $expr: { $lte: ['$quantity', '$reorderLevel'] }
            }),
            Product.countDocuments({ isActive: true, quantity: 0 }),
            Product.aggregate([
                { $match: { isActive: true } },
                { $group: { _id: '$category', count: { $sum: 1 } } },
                { $sort: { count: -1 } }
            ])
        ]);

        res.json({
            success: true,
            data: {
                totalProducts,
                totalQuantity: totalQuantity[0]?.total || 0,
                lowStockCount,
                outOfStockCount,
                categories
            }
        });

    } catch (error) {
        console.error('Product stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

/**
 * @route GET /api/products/:id
 * @desc Get single product by ID
 * @access Private (Staff/Admin)
 */
router.get('/:id', authenticateToken, staffOrAdmin, async (req, res) => {
    try {
        const product = await Product.findById(req.params.id)
            .populate('createdBy', 'username');

        if (!product || !product.isActive) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        res.json({
            success: true,
            data: { product }
        });

    } catch (error) {
        console.error('Product fetch error:', error);
        
        if (error.kind === 'ObjectId') {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

/**
 * @route POST /api/products
 * @desc Create new product
 * @access Private (Staff/Admin)
 */
router.post('/', authenticateToken, staffOrAdmin, async (req, res) => {
    try {
        const { name, sku, category, quantity, location, description, unitPrice, reorderLevel } = req.body;

        // Validate required fields
        if (!name || !sku || !category || !location) {
            return res.status(400).json({
                success: false,
                message: 'Name, SKU, category, and location are required'
            });
        }

        // Check if SKU already exists
        const existingProduct = await Product.findOne({ 
            sku: sku.toUpperCase().trim(),
            isActive: true 
        });

        if (existingProduct) {
            return res.status(409).json({
                success: false,
                message: 'SKU already exists'
            });
        }

        // Create product
        const product = new Product({
            name: name.trim(),
            sku: sku.toUpperCase().trim(),
            category: category.trim(),
            quantity: parseInt(quantity) || 0,
            location: location.trim(),
            description: description?.trim() || '',
            unitPrice: parseFloat(unitPrice) || 0,
            reorderLevel: parseInt(reorderLevel) || 10,
            createdBy: req.user._id
        });

        await product.save();
        await product.populate('createdBy', 'username');

        res.status(201).json({
            success: true,
            message: 'Product created successfully',
            data: { product }
        });

    } catch (error) {
        console.error('Product creation error:', error);

        if (error.code === 11000) {
            return res.status(409).json({
                success: false,
                message: 'SKU already exists'
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
 * @route PUT /api/products/:id
 * @desc Update product
 * @access Private (Staff/Admin)
 */
router.put('/:id', authenticateToken, staffOrAdmin, async (req, res) => {
    try {
        const { name, sku, category, quantity, location, description, unitPrice, reorderLevel } = req.body;

        const product = await Product.findById(req.params.id);

        if (!product || !product.isActive) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        // Check if SKU is being changed and if new SKU exists
        if (sku && sku.toUpperCase().trim() !== product.sku) {
            const existingProduct = await Product.findOne({ 
                sku: sku.toUpperCase().trim(),
                _id: { $ne: product._id },
                isActive: true 
            });

            if (existingProduct) {
                return res.status(409).json({
                    success: false,
                    message: 'SKU already exists'
                });
            }
        }

        // Update fields
        if (name !== undefined) product.name = name.trim();
        if (sku !== undefined) product.sku = sku.toUpperCase().trim();
        if (category !== undefined) product.category = category.trim();
        if (quantity !== undefined) product.quantity = parseInt(quantity);
        if (location !== undefined) product.location = location.trim();
        if (description !== undefined) product.description = description.trim();
        if (unitPrice !== undefined) product.unitPrice = parseFloat(unitPrice);
        if (reorderLevel !== undefined) product.reorderLevel = parseInt(reorderLevel);

        await product.save();
        await product.populate('createdBy', 'username');

        res.json({
            success: true,
            message: 'Product updated successfully',
            data: { product }
        });

    } catch (error) {
        console.error('Product update error:', error);

        if (error.kind === 'ObjectId') {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        if (error.code === 11000) {
            return res.status(409).json({
                success: false,
                message: 'SKU already exists'
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
 * @route DELETE /api/products/:id
 * @desc Delete product (soft delete)
 * @access Private (Staff/Admin)
 */
router.delete('/:id', authenticateToken, staffOrAdmin, async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);

        if (!product || !product.isActive) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        // Soft delete - mark as inactive
        product.isActive = false;
        await product.save();

        res.json({
            success: true,
            message: 'Product deleted successfully'
        });

    } catch (error) {
        console.error('Product deletion error:', error);

        if (error.kind === 'ObjectId') {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

/**
 * @route PUT /api/products/:id/quantity
 * @desc Update product quantity (for inventory adjustments)
 * @access Private (Staff/Admin)
 */
router.put('/:id/quantity', authenticateToken, staffOrAdmin, async (req, res) => {
    try {
        const { quantity, reason } = req.body;

        if (quantity === undefined || quantity < 0) {
            return res.status(400).json({
                success: false,
                message: 'Valid quantity is required'
            });
        }

        const product = await Product.findById(req.params.id);

        if (!product || !product.isActive) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        const oldQuantity = product.quantity;
        product.quantity = parseInt(quantity);
        
        await product.save();

        res.json({
            success: true,
            message: 'Product quantity updated successfully',
            data: { 
                product,
                adjustment: {
                    oldQuantity,
                    newQuantity: product.quantity,
                    difference: product.quantity - oldQuantity,
                    reason: reason || 'Manual adjustment',
                    adjustedBy: req.user.username,
                    adjustedAt: new Date()
                }
            }
        });

    } catch (error) {
        console.error('Quantity update error:', error);

        if (error.kind === 'ObjectId') {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

module.exports = router;