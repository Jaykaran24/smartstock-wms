const express = require('express');
const mongoose = require('mongoose');
const os = require('os');
const router = express.Router();

/**
 * Health Check and System Metrics Endpoint
 * Provides detailed information about system status
 */

/**
 * GET /api/health
 * Basic health check
 */
router.get('/health', (req, res) => {
    res.json({
        success: true,
        message: 'SmartStock WMS API is running',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development'
    });
});

/**
 * GET /api/health/detailed
 * Detailed health check with database and system metrics
 */
router.get('/health/detailed', async (req, res) => {
    try {
        // Database connection status
        const dbStatus = mongoose.connection.readyState;
        const dbStatusMap = {
            0: 'disconnected',
            1: 'connected',
            2: 'connecting',
            3: 'disconnecting'
        };

        // System metrics
        const uptime = process.uptime();
        const systemUptime = os.uptime();
        
        // Memory usage
        const memoryUsage = process.memoryUsage();
        const totalMemory = os.totalmem();
        const freeMemory = os.freemem();
        const usedMemory = totalMemory - freeMemory;
        
        // CPU information
        const cpus = os.cpus();
        const loadAverage = os.loadavg();

        // Database stats (if connected)
        let dbStats = null;
        if (dbStatus === 1) {
            try {
                dbStats = await mongoose.connection.db.stats();
            } catch (error) {
                dbStats = { error: 'Unable to fetch database stats' };
            }
        }

        const healthData = {
            success: true,
            timestamp: new Date().toISOString(),
            environment: process.env.NODE_ENV || 'development',
            
            // Application status
            application: {
                name: 'SmartStock WMS',
                version: process.env.npm_package_version || '1.0.0',
                nodeVersion: process.version,
                uptime: {
                    seconds: Math.floor(uptime),
                    formatted: formatUptime(uptime)
                }
            },

            // Database status
            database: {
                status: dbStatusMap[dbStatus],
                connected: dbStatus === 1,
                host: mongoose.connection.host,
                name: mongoose.connection.name,
                ...(dbStats && {
                    collections: dbStats.collections,
                    dataSize: formatBytes(dbStats.dataSize),
                    storageSize: formatBytes(dbStats.storageSize),
                    indexes: dbStats.indexes
                })
            },

            // System metrics
            system: {
                platform: os.platform(),
                architecture: os.arch(),
                hostname: os.hostname(),
                uptime: {
                    seconds: Math.floor(systemUptime),
                    formatted: formatUptime(systemUptime)
                },
                cpus: {
                    count: cpus.length,
                    model: cpus[0]?.model,
                    speed: `${cpus[0]?.speed} MHz`
                },
                loadAverage: {
                    '1min': loadAverage[0].toFixed(2),
                    '5min': loadAverage[1].toFixed(2),
                    '15min': loadAverage[2].toFixed(2)
                }
            },

            // Memory usage
            memory: {
                application: {
                    rss: formatBytes(memoryUsage.rss),
                    heapTotal: formatBytes(memoryUsage.heapTotal),
                    heapUsed: formatBytes(memoryUsage.heapUsed),
                    external: formatBytes(memoryUsage.external)
                },
                system: {
                    total: formatBytes(totalMemory),
                    free: formatBytes(freeMemory),
                    used: formatBytes(usedMemory),
                    usagePercentage: ((usedMemory / totalMemory) * 100).toFixed(2) + '%'
                }
            }
        };

        // Return 503 if database is not connected
        if (dbStatus !== 1) {
            return res.status(503).json({
                ...healthData,
                success: false,
                message: 'Service unavailable - Database not connected'
            });
        }

        res.json(healthData);
    } catch (error) {
        console.error('Health check error:', error);
        res.status(503).json({
            success: false,
            message: 'Service health check failed',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined,
            timestamp: new Date().toISOString()
        });
    }
});

/**
 * GET /api/health/readiness
 * Kubernetes-style readiness probe
 */
router.get('/health/readiness', async (req, res) => {
    try {
        // Check database connection
        const dbStatus = mongoose.connection.readyState;
        
        if (dbStatus === 1) {
            // Perform a simple database operation to verify it's working
            await mongoose.connection.db.admin().ping();
            
            return res.json({
                success: true,
                ready: true,
                timestamp: new Date().toISOString()
            });
        }

        res.status(503).json({
            success: false,
            ready: false,
            message: 'Service not ready - Database not connected',
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(503).json({
            success: false,
            ready: false,
            message: 'Readiness check failed',
            timestamp: new Date().toISOString()
        });
    }
});

/**
 * GET /api/health/liveness
 * Kubernetes-style liveness probe
 */
router.get('/health/liveness', (req, res) => {
    res.json({
        success: true,
        alive: true,
        timestamp: new Date().toISOString()
    });
});

/**
 * Helper function to format bytes to human-readable format
 */
function formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Helper function to format uptime
 */
function formatUptime(seconds) {
    const days = Math.floor(seconds / (24 * 60 * 60));
    const hours = Math.floor((seconds % (24 * 60 * 60)) / (60 * 60));
    const minutes = Math.floor((seconds % (60 * 60)) / 60);
    const secs = Math.floor(seconds % 60);
    
    const parts = [];
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);
    if (secs > 0 || parts.length === 0) parts.push(`${secs}s`);
    
    return parts.join(' ');
}

module.exports = router;
