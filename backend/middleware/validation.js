const { body, param, query, validationResult } = require('express-validator');

/**
 * Validation Middleware for API Endpoints
 * Provides comprehensive input validation and sanitization
 */

/**
 * Handle validation errors
 */
const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            message: 'Validation failed',
            errors: errors.array().map(err => ({
                field: err.path,
                message: err.msg,
                value: err.value
            }))
        });
    }
    next();
};

/**
 * User Validation Rules
 */
const validateRegister = [
    body('username')
        .trim()
        .isLength({ min: 3, max: 30 })
        .withMessage('Username must be between 3 and 30 characters')
        .matches(/^[a-zA-Z0-9_]+$/)
        .withMessage('Username can only contain letters, numbers, and underscores'),
    
    body('password')
        .isLength({ min: 6 })
        .withMessage('Password must be at least 6 characters long')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
        .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
    
    body('role')
        .optional()
        .isIn(['Admin', 'Staff'])
        .withMessage('Role must be either Admin or Staff'),
    
    handleValidationErrors
];

const validateLogin = [
    body('username')
        .trim()
        .notEmpty()
        .withMessage('Username is required'),
    
    body('password')
        .notEmpty()
        .withMessage('Password is required'),
    
    handleValidationErrors
];

/**
 * Product Validation Rules
 */
const validateProduct = [
    body('name')
        .trim()
        .notEmpty()
        .withMessage('Product name is required')
        .isLength({ max: 100 })
        .withMessage('Product name cannot exceed 100 characters'),
    
    body('sku')
        .trim()
        .notEmpty()
        .withMessage('SKU is required')
        .matches(/^[A-Z0-9-_]+$/)
        .withMessage('SKU can only contain uppercase letters, numbers, hyphens, and underscores')
        .toUpperCase(),
    
    body('category')
        .trim()
        .notEmpty()
        .withMessage('Category is required')
        .isLength({ max: 50 })
        .withMessage('Category cannot exceed 50 characters'),
    
    body('quantity')
        .isInt({ min: 0 })
        .withMessage('Quantity must be a non-negative integer')
        .toInt(),
    
    body('location')
        .trim()
        .notEmpty()
        .withMessage('Location is required')
        .isLength({ max: 50 })
        .withMessage('Location cannot exceed 50 characters'),
    
    body('description')
        .optional()
        .trim()
        .isLength({ max: 500 })
        .withMessage('Description cannot exceed 500 characters'),
    
    body('unitPrice')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('Unit price must be a non-negative number')
        .toFloat(),
    
    body('reorderLevel')
        .optional()
        .isInt({ min: 0 })
        .withMessage('Reorder level must be a non-negative integer')
        .toInt(),
    
    handleValidationErrors
];

const validateProductUpdate = [
    body('name')
        .optional()
        .trim()
        .isLength({ min: 1, max: 100 })
        .withMessage('Product name must be between 1 and 100 characters'),
    
    body('sku')
        .optional()
        .trim()
        .matches(/^[A-Z0-9-_]+$/)
        .withMessage('SKU can only contain uppercase letters, numbers, hyphens, and underscores')
        .toUpperCase(),
    
    body('category')
        .optional()
        .trim()
        .isLength({ max: 50 })
        .withMessage('Category cannot exceed 50 characters'),
    
    body('quantity')
        .optional()
        .isInt({ min: 0 })
        .withMessage('Quantity must be a non-negative integer')
        .toInt(),
    
    body('location')
        .optional()
        .trim()
        .isLength({ max: 50 })
        .withMessage('Location cannot exceed 50 characters'),
    
    body('description')
        .optional()
        .trim()
        .isLength({ max: 500 })
        .withMessage('Description cannot exceed 500 characters'),
    
    body('unitPrice')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('Unit price must be a non-negative number')
        .toFloat(),
    
    body('reorderLevel')
        .optional()
        .isInt({ min: 0 })
        .withMessage('Reorder level must be a non-negative integer')
        .toInt(),
    
    handleValidationErrors
];

/**
 * Order Validation Rules
 */
const validateOrder = [
    body('type')
        .isIn(['Inbound', 'Outbound'])
        .withMessage('Order type must be either Inbound or Outbound'),
    
    body('partyName')
        .trim()
        .notEmpty()
        .withMessage('Party name (Customer/Supplier) is required')
        .isLength({ max: 100 })
        .withMessage('Party name cannot exceed 100 characters'),
    
    body('partyContact.email')
        .optional()
        .trim()
        .isEmail()
        .withMessage('Invalid email address')
        .normalizeEmail(),
    
    body('partyContact.phone')
        .optional()
        .trim()
        .matches(/^[\d\s\-\+\(\)]+$/)
        .withMessage('Invalid phone number format'),
    
    body('partyContact.address')
        .optional()
        .trim()
        .isLength({ max: 500 })
        .withMessage('Address cannot exceed 500 characters'),
    
    body('items')
        .isArray({ min: 1 })
        .withMessage('Order must contain at least one item'),
    
    body('items.*.productId')
        .notEmpty()
        .withMessage('Product ID is required')
        .isMongoId()
        .withMessage('Invalid product ID'),
    
    body('items.*.quantity')
        .isInt({ min: 1 })
        .withMessage('Item quantity must be at least 1')
        .toInt(),
    
    body('items.*.unitPrice')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('Unit price must be a non-negative number')
        .toFloat(),
    
    body('priority')
        .optional()
        .isIn(['Low', 'Medium', 'High', 'Urgent'])
        .withMessage('Priority must be Low, Medium, High, or Urgent'),
    
    body('notes')
        .optional()
        .trim()
        .isLength({ max: 1000 })
        .withMessage('Notes cannot exceed 1000 characters'),
    
    handleValidationErrors
];

const validateOrderUpdate = [
    body('status')
        .optional()
        .isIn(['Pending', 'Processing', 'Shipped', 'Received', 'Cancelled'])
        .withMessage('Invalid status value'),
    
    body('priority')
        .optional()
        .isIn(['Low', 'Medium', 'High', 'Urgent'])
        .withMessage('Priority must be Low, Medium, High, or Urgent'),
    
    body('notes')
        .optional()
        .trim()
        .isLength({ max: 1000 })
        .withMessage('Notes cannot exceed 1000 characters'),
    
    handleValidationErrors
];

/**
 * ID Parameter Validation
 */
const validateMongoId = [
    param('id')
        .isMongoId()
        .withMessage('Invalid ID format'),
    
    handleValidationErrors
];

/**
 * Query Parameter Validation
 */
const validateSearchQuery = [
    query('search')
        .optional()
        .trim()
        .isLength({ max: 100 })
        .withMessage('Search query cannot exceed 100 characters'),
    
    query('category')
        .optional()
        .trim()
        .isLength({ max: 50 })
        .withMessage('Category cannot exceed 50 characters'),
    
    query('page')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Page must be a positive integer')
        .toInt(),
    
    query('limit')
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage('Limit must be between 1 and 100')
        .toInt(),
    
    handleValidationErrors
];

module.exports = {
    validateRegister,
    validateLogin,
    validateProduct,
    validateProductUpdate,
    validateOrder,
    validateOrderUpdate,
    validateMongoId,
    validateSearchQuery,
    handleValidationErrors
};
