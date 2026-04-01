const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Utility functions for password hashing and JWT operations
 */

/**
 * Hash password using bcryptjs
 * @param {string} password - Plain text password
 * @returns {Promise<string>} Hashed password
 */
const hashPassword = async (password) => {
    const saltRounds = 12;
    return await bcrypt.hash(password, saltRounds);
};

/**
 * Compare password with hash
 * @param {string} password - Plain text password
 * @param {string} hashedPassword - Hashed password from database
 * @returns {Promise<boolean>} True if passwords match
 */
const comparePassword = async (password, hashedPassword) => {
    return await bcrypt.compare(password, hashedPassword);
};

/**
 * Generate JWT token
 * @param {Object} payload - Data to include in token
 * @param {string} expiresIn - Token expiration time
 * @returns {string} JWT token
 */
const generateToken = (payload, expiresIn = '24h') => {
    return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn });
};

/**
 * Generate refresh token (longer expiration)
 * @param {Object} payload - Data to include in token
 * @returns {string} Refresh token
 */
const generateRefreshToken = (payload) => {
    return jwt.sign(payload, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET, { 
        expiresIn: '7d' 
    });
};

/**
 * Verify JWT token
 * @param {string} token - JWT token to verify
 * @returns {Object} Decoded token payload
 */
const verifyToken = (token) => {
    return jwt.verify(token, process.env.JWT_SECRET);
};

/**
 * Create user response object (excludes sensitive data)
 * @param {Object} user - User document from database
 * @returns {Object} Safe user data for client
 */
const createUserResponse = (user) => {
    return {
        id: user._id,
        username: user.username,
        role: user.role,
        createdAt: user.createdAt,
        lastLogin: user.lastLogin,
        isActive: user.isActive
    };
};

/**
 * Validate password strength
 * @param {string} password - Password to validate
 * @returns {Object} Validation result with isValid and errors
 */
const validatePassword = (password) => {
    const errors = [];
    
    if (password.length < 6) {
        errors.push('Password must be at least 6 characters long');
    }
    
    if (password.length > 128) {
        errors.push('Password must not exceed 128 characters');
    }
    
    if (!/[A-Z]/.test(password)) {
        errors.push('Password must contain at least one uppercase letter');
    }
    
    if (!/[a-z]/.test(password)) {
        errors.push('Password must contain at least one lowercase letter');
    }
    
    if (!/[0-9]/.test(password)) {
        errors.push('Password must contain at least one number');
    }
    
    return {
        isValid: errors.length === 0,
        errors
    };
};

/**
 * Validate username
 * @param {string} username - Username to validate
 * @returns {Object} Validation result with isValid and errors
 */
const validateUsername = (username) => {
    const errors = [];
    
    if (!username || username.trim().length < 3) {
        errors.push('Username must be at least 3 characters long');
    }
    
    if (username && username.length > 30) {
        errors.push('Username must not exceed 30 characters');
    }
    
    if (username && !/^[a-zA-Z0-9_-]+$/.test(username)) {
        errors.push('Username can only contain letters, numbers, underscores, and hyphens');
    }
    
    return {
        isValid: errors.length === 0,
        errors
    };
};

/**
 * Rate limiting helper - check if user has exceeded login attempts
 * @param {string} identifier - IP address or username
 * @returns {boolean} True if rate limited
 */
const isRateLimited = (identifier) => {
    // This would typically use Redis or another cache
    // For this implementation, we'll use a simple in-memory approach
    if (!global.loginAttempts) {
        global.loginAttempts = new Map();
    }
    
    const attempts = global.loginAttempts.get(identifier) || { count: 0, lastAttempt: Date.now() };
    const timeDiff = Date.now() - attempts.lastAttempt;
    
    // Reset counter after 15 minutes
    if (timeDiff > 15 * 60 * 1000) {
        global.loginAttempts.delete(identifier);
        return false;
    }
    
    // Rate limit after 5 failed attempts
    return attempts.count >= 5;
};

/**
 * Record failed login attempt
 * @param {string} identifier - IP address or username
 */
const recordFailedAttempt = (identifier) => {
    if (!global.loginAttempts) {
        global.loginAttempts = new Map();
    }
    
    const attempts = global.loginAttempts.get(identifier) || { count: 0, lastAttempt: Date.now() };
    attempts.count += 1;
    attempts.lastAttempt = Date.now();
    
    global.loginAttempts.set(identifier, attempts);
};

/**
 * Clear failed login attempts for identifier
 * @param {string} identifier - IP address or username
 */
const clearFailedAttempts = (identifier) => {
    if (global.loginAttempts) {
        global.loginAttempts.delete(identifier);
    }
};

module.exports = {
    hashPassword,
    comparePassword,
    generateToken,
    generateRefreshToken,
    verifyToken,
    createUserResponse,
    validatePassword,
    validateUsername,
    isRateLimited,
    recordFailedAttempt,
    clearFailedAttempts
};