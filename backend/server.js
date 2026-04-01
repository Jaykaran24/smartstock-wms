const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const morgan = require('morgan');
const path = require('path');
require('dotenv').config();

// Import utilities
const logger = require('./utils/logger');

// Import routes
const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const orderRoutes = require('./routes/orders');
const healthRoutes = require('./routes/health');

// Create Express app
const app = express();

// Trust proxy for accurate IP addresses (important for rate limiting)
app.set('trust proxy', 1);

// Security middleware
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", "data:", "https:"],
            fontSrc: ["'self'", "https://cdnjs.cloudflare.com"],
            connectSrc: ["'self'"],
        },
    },
}));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: {
        success: false,
        message: 'Too many requests from this IP, please try again later.'
    },
    standardHeaders: true,
    legacyHeaders: false,
});

app.use('/api/', limiter);

// Stricter rate limiting for auth endpoints
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // limit each IP to 10 auth requests per windowMs
    message: {
        success: false,
        message: 'Too many authentication attempts, please try again later.'
    },
    standardHeaders: true,
    legacyHeaders: false,
});

app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

// CORS configuration
const corsOptions = {
    origin: process.env.FRONTEND_URL || 'http://localhost:5000',
    credentials: true,
    optionsSuccessStatus: 200,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

app.use(cors(corsOptions));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Data sanitization against NoSQL injection
app.use(mongoSanitize());

// HTTP request logging
if (process.env.NODE_ENV === 'production') {
    app.use(morgan('combined', { stream: logger.stream }));
} else {
    app.use(morgan('dev'));
}

// Serve static frontend files
app.use(express.static(path.join(__dirname, '../frontend')));

// Database connection
const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/smartstock-wms', {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        
        logger.info(`MongoDB Connected: ${conn.connection.host}`);
        console.log(`MongoDB Connected: ${conn.connection.host}`);
        
        // Create default admin user if none exists
        await createDefaultAdmin();
        
    } catch (error) {
        logger.error('Database connection error:', error);
        console.error('Database connection error:', error);
        process.exit(1);
    }
};

// Create default admin user
const createDefaultAdmin = async () => {
    try {
        const User = require('./models/User');
        const { hashPassword } = require('./middleware/authUtils');
        
        const adminExists = await User.findOne({ role: 'Admin' });
        
        if (!adminExists) {
            const defaultPassword = process.env.DEFAULT_ADMIN_PASSWORD || 'Admin123!';
            const hashedPassword = await hashPassword(defaultPassword);
            
            const defaultAdmin = new User({
                username: 'admin',
                password: hashedPassword,
                role: 'Admin'
            });
            
            await defaultAdmin.save();
            logger.info('Default admin user created');
            console.log('Default admin user created:');
            console.log('Username: admin');
            console.log(`Password: ${defaultPassword}`);
            console.log('Please change this password after first login!');
        }
    } catch (error) {
        logger.error('Error creating default admin:', error);
        console.error('Error creating default admin:', error);
    }
};

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api', healthRoutes);

// Health check endpoint (legacy, kept for backward compatibility)
app.get('/api/health-legacy', (req, res) => {
    res.json({ 
        success: true, 
        message: 'SmartStock WMS API is running (use /api/health instead)',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development'
    });
});

// Dashboard stats endpoint (combined stats for frontend)
app.get('/api/dashboard/stats', async (req, res) => {
    try {
        // This endpoint requires authentication but we'll include it in the main server
        // The actual implementation would be moved to a separate dashboard route file
        res.json({
            success: true,
            message: 'Dashboard stats endpoint - implement with authentication'
        });
    } catch (error) {
        console.error('Dashboard stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

// Catch-all handler for frontend routing (SPA support)
app.get('*', (req, res) => {
    // Don't serve index.html for API routes
    if (req.path.startsWith('/api/')) {
        return res.status(404).json({ 
            success: false, 
            message: 'API endpoint not found' 
        });
    }
    
    // Serve the frontend index.html for all non-API routes
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// Global error handler
app.use((err, req, res, next) => {
    logger.logError(err, req);
    console.error('Unhandled error:', err);
    
    // Don't leak error details in production
    const message = process.env.NODE_ENV === 'production' 
        ? 'Something went wrong!' 
        : err.message;
    
    res.status(err.status || 500).json({
        success: false,
        message,
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
});

// Server instance (will be set when server starts)
let serverInstance = null;

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
    logger.error('Unhandled Promise Rejection:', err);
    console.log('Unhandled Promise Rejection:', err.message);
    // Close server & exit process
    if (serverInstance) {
        serverInstance.close(() => {
            process.exit(1);
        });
    } else {
        process.exit(1);
    }
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
    logger.error('Uncaught Exception:', err);
    console.log('Uncaught Exception:', err.message);
    process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    logger.info('SIGTERM received. Shutting down gracefully...');
    console.log('SIGTERM received. Shutting down gracefully...');
    if (serverInstance) {
        serverInstance.close(() => {
            logger.info('Process terminated');
            console.log('Process terminated');
            mongoose.connection.close();
        });
    }
});

process.on('SIGINT', () => {
    logger.info('SIGINT received. Shutting down gracefully...');
    console.log('SIGINT received. Shutting down gracefully...');
    if (serverInstance) {
        serverInstance.close(() => {
            logger.info('Process terminated');
            console.log('Process terminated');
            mongoose.connection.close();
        });
    }
});

// Start server
const PORT = process.env.PORT || 3v  000;

const startServer = async () => {
    await connectDB();
    
    serverInstance = app.listen(PORT, () => {
        logger.info(`SmartStock WMS Server running on port ${PORT}`);
        logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
        
        console.log(`🚀 SmartStock WMS Server running on port ${PORT}`);
        console.log(`📱 Frontend URL: http://localhost:${PORT}`);
        console.log(`🔌 API Base URL: http://localhost:${PORT}/api`);
        console.log(`🏥 Health Check: http://localhost:${PORT}/api/health`);
        console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
        
        if (process.env.NODE_ENV !== 'production') {
            console.log('\n🔧 Development Mode:');
            console.log('- CORS enabled for all origins');
            console.log('- Detailed error messages enabled');
            console.log('- Default admin user: admin / Admin123!');
        }
    });
    
    return serverInstance;
};

// Export for testing
if (require.main === module) {
    startServer();
} else {
    module.exports = { app, startServer };
}