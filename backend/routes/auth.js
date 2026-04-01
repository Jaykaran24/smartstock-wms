const express = require('express');
const User = require('../models/User');
const { 
    hashPassword, 
    comparePassword, 
    generateToken,
    createUserResponse,
    validatePassword,
    validateUsername,
    isRateLimited,
    recordFailedAttempt,
    clearFailedAttempts
} = require('../middleware/authUtils');
const { authenticateToken, adminOnly } = require('../middleware/auth');

const router = express.Router();

/**
 * @route POST /api/auth/register
 * @desc Register a new user
 * @access Public (but may be restricted to admin in production)
 */
router.post('/register', async (req, res) => {
    try {
        const { username, password, role } = req.body;

        // Validate input
        if (!username || !password) {
            return res.status(400).json({
                success: false,
                message: 'Username and password are required'
            });
        }

        // Validate username
        const usernameValidation = validateUsername(username);
        if (!usernameValidation.isValid) {
            return res.status(400).json({
                success: false,
                message: 'Invalid username',
                errors: usernameValidation.errors
            });
        }

        // Validate password
        const passwordValidation = validatePassword(password);
        if (!passwordValidation.isValid) {
            return res.status(400).json({
                success: false,
                message: 'Invalid password',
                errors: passwordValidation.errors
            });
        }

        // Check if user already exists
        const existingUser = await User.findOne({ 
            username: username.toLowerCase().trim() 
        });
        
        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: 'Username already exists'
            });
        }

        // Validate role if provided
        const validRoles = ['Admin', 'Staff'];
        const userRole = role && validRoles.includes(role) ? role : 'Staff';

        // Hash password
        const hashedPassword = await hashPassword(password);

        // Create user
        const user = new User({
            username: username.toLowerCase().trim(),
            password: hashedPassword,
            role: userRole
        });

        await user.save();

        // Generate token
        const token = generateToken({ userId: user._id, role: user.role });

        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            data: {
                user: createUserResponse(user),
                token
            }
        });

    } catch (error) {
        console.error('Registration error:', error);
        
        if (error.code === 11000) {
            return res.status(409).json({
                success: false,
                message: 'Username already exists'
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
 * @route POST /api/auth/login
 * @desc Login user
 * @access Public
 */
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const clientIP = req.ip || req.connection.remoteAddress;

        // Validate input
        if (!username || !password) {
            return res.status(400).json({
                success: false,
                message: 'Username and password are required'
            });
        }

        // Check rate limiting
        if (isRateLimited(clientIP) || isRateLimited(username.toLowerCase())) {
            return res.status(429).json({
                success: false,
                message: 'Too many failed login attempts. Please try again later.'
            });
        }

        // Find user
        const user = await User.findOne({ 
            username: username.toLowerCase().trim() 
        });

        if (!user) {
            recordFailedAttempt(clientIP);
            recordFailedAttempt(username.toLowerCase());
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        // Check if user is active
        if (!user.isActive) {
            return res.status(401).json({
                success: false,
                message: 'Account is deactivated. Please contact administrator.'
            });
        }

        // Verify password
        const isPasswordValid = await comparePassword(password, user.password);
        
        if (!isPasswordValid) {
            recordFailedAttempt(clientIP);
            recordFailedAttempt(username.toLowerCase());
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        // Clear failed attempts on successful login
        clearFailedAttempts(clientIP);
        clearFailedAttempts(username.toLowerCase());

        // Update last login
        user.lastLogin = new Date();
        await user.save();

        // Generate token
        const token = generateToken({ userId: user._id, role: user.role });

        res.json({
            success: true,
            message: 'Login successful',
            data: {
                user: createUserResponse(user),
                token
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

/**
 * @route GET /api/auth/profile
 * @desc Get current user profile
 * @access Private
 */
router.get('/profile', authenticateToken, async (req, res) => {
    try {
        res.json({
            success: true,
            data: {
                user: createUserResponse(req.user)
            }
        });
    } catch (error) {
        console.error('Profile fetch error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

/**
 * @route PUT /api/auth/profile
 * @desc Update current user profile
 * @access Private
 */
router.put('/profile', authenticateToken, async (req, res) => {
    try {
        const { username, currentPassword, newPassword } = req.body;
        const user = await User.findById(req.user._id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Update username if provided
        if (username && username !== user.username) {
            const usernameValidation = validateUsername(username);
            if (!usernameValidation.isValid) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid username',
                    errors: usernameValidation.errors
                });
            }

            const existingUser = await User.findOne({ 
                username: username.toLowerCase().trim(),
                _id: { $ne: user._id }
            });

            if (existingUser) {
                return res.status(409).json({
                    success: false,
                    message: 'Username already exists'
                });
            }

            user.username = username.toLowerCase().trim();
        }

        // Update password if provided
        if (newPassword) {
            if (!currentPassword) {
                return res.status(400).json({
                    success: false,
                    message: 'Current password is required to set new password'
                });
            }

            const isCurrentPasswordValid = await comparePassword(currentPassword, user.password);
            if (!isCurrentPasswordValid) {
                return res.status(401).json({
                    success: false,
                    message: 'Current password is incorrect'
                });
            }

            const passwordValidation = validatePassword(newPassword);
            if (!passwordValidation.isValid) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid new password',
                    errors: passwordValidation.errors
                });
            }

            user.password = await hashPassword(newPassword);
        }

        await user.save();

        res.json({
            success: true,
            message: 'Profile updated successfully',
            data: {
                user: createUserResponse(user)
            }
        });

    } catch (error) {
        console.error('Profile update error:', error);
        
        if (error.code === 11000) {
            return res.status(409).json({
                success: false,
                message: 'Username already exists'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

/**
 * @route POST /api/auth/logout
 * @desc Logout user (client-side token removal)
 * @access Private
 */
router.post('/logout', authenticateToken, (req, res) => {
    // In a real-world scenario, you might want to blacklist the token
    // For now, we'll just send a success response
    res.json({
        success: true,
        message: 'Logged out successfully'
    });
});

/**
 * @route GET /api/auth/users
 * @desc Get all users (Admin only)
 * @access Private (Admin)
 */
router.get('/users', authenticateToken, adminOnly, async (req, res) => {
    try {
        const users = await User.find({}, '-password').sort({ createdAt: -1 });
        
        res.json({
            success: true,
            data: {
                users: users.map(user => createUserResponse(user))
            }
        });
    } catch (error) {
        console.error('Users fetch error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

/**
 * @route PUT /api/auth/users/:id/role
 * @desc Update user role (Admin only)
 * @access Private (Admin)
 */
router.put('/users/:id/role', authenticateToken, adminOnly, async (req, res) => {
    try {
        const { role } = req.body;
        const userId = req.params.id;

        if (!['Admin', 'Staff'].includes(role)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid role. Must be Admin or Staff.'
            });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        user.role = role;
        await user.save();

        res.json({
            success: true,
            message: 'User role updated successfully',
            data: {
                user: createUserResponse(user)
            }
        });
    } catch (error) {
        console.error('Role update error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

module.exports = router;