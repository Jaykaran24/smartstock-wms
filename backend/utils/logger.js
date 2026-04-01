const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');
const path = require('path');
const fs = require('fs');

// Ensure logs directory exists
const logsDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
}

/**
 * Custom format for log messages
 */
const logFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
        let log = `${timestamp} [${level.toUpperCase()}]: ${message}`;
        
        // Add metadata if present
        if (Object.keys(meta).length > 0) {
            log += ` ${JSON.stringify(meta)}`;
        }
        
        // Add stack trace for errors
        if (stack) {
            log += `\n${stack}`;
        }
        
        return log;
    })
);

/**
 * Daily rotate file transport for all logs
 */
const allLogsTransport = new DailyRotateFile({
    filename: path.join(logsDir, 'application-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    maxSize: '20m',
    maxFiles: '30d',
    format: logFormat,
    level: process.env.LOG_LEVEL || 'info'
});

/**
 * Daily rotate file transport for error logs
 */
const errorLogsTransport = new DailyRotateFile({
    filename: path.join(logsDir, 'error-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    maxSize: '20m',
    maxFiles: '30d',
    format: logFormat,
    level: 'error'
});

/**
 * Console transport for development
 */
const consoleTransport = new winston.transports.Console({
    format: winston.format.combine(
        winston.format.colorize(),
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        winston.format.printf(({ timestamp, level, message, stack }) => {
            let log = `${timestamp} [${level}]: ${message}`;
            if (stack) {
                log += `\n${stack}`;
            }
            return log;
        })
    )
});

/**
 * Create the logger instance
 */
const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: logFormat,
    transports: [
        allLogsTransport,
        errorLogsTransport
    ],
    exitOnError: false
});

// Add console transport in development mode
if (process.env.NODE_ENV !== 'production') {
    logger.add(consoleTransport);
}

/**
 * Stream object for Morgan HTTP logger middleware
 */
logger.stream = {
    write: (message) => {
        logger.info(message.trim());
    }
};

/**
 * Helper methods for common logging patterns
 */
logger.logRequest = (req, statusCode, responseTime) => {
    const { method, originalUrl, ip, user } = req;
    logger.info('HTTP Request', {
        method,
        url: originalUrl,
        statusCode,
        responseTime: `${responseTime}ms`,
        ip,
        userId: user?.id,
        userRole: user?.role
    });
};

logger.logError = (error, req = null) => {
    const errorInfo = {
        message: error.message,
        stack: error.stack,
        ...(req && {
            method: req.method,
            url: req.originalUrl,
            ip: req.ip,
            userId: req.user?.id
        })
    };
    logger.error('Application Error', errorInfo);
};

logger.logDatabaseOperation = (operation, collection, success, details = {}) => {
    const level = success ? 'info' : 'error';
    logger[level]('Database Operation', {
        operation,
        collection,
        success,
        ...details
    });
};

logger.logAuthentication = (username, success, reason = null, ip = null) => {
    const level = success ? 'info' : 'warn';
    logger[level]('Authentication Attempt', {
        username,
        success,
        reason,
        ip
    });
};

logger.logSecurityEvent = (event, details) => {
    logger.warn('Security Event', {
        event,
        ...details,
        timestamp: new Date().toISOString()
    });
};

module.exports = logger;
