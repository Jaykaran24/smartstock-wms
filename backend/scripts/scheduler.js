const cron = require('node-cron');
const DatabaseBackup = require('./backup');
const logger = require('../utils/logger');

/**
 * Scheduled Backup Service
 * Automatically creates database backups based on schedule
 */

class BackupScheduler {
    constructor() {
        this.backup = new DatabaseBackup();
        this.schedule = process.env.BACKUP_SCHEDULE || '0 2 * * *'; // Default: 2 AM daily
        this.enabled = process.env.BACKUP_ENABLED === 'true';
        this.task = null;
    }

    /**
     * Start the scheduled backup service
     */
    start() {
        if (!this.enabled) {
            logger.info('Backup scheduler is disabled');
            console.log('Backup scheduler is disabled');
            return;
        }

        try {
            // Validate cron expression
            if (!cron.validate(this.schedule)) {
                throw new Error(`Invalid cron schedule: ${this.schedule}`);
            }

            // Schedule the backup task
            this.task = cron.schedule(this.schedule, async () => {
                logger.info('Starting scheduled backup');
                console.log('Starting scheduled backup...');
                
                const result = await this.backup.createBackup();
                
                if (result.success) {
                    logger.info('Scheduled backup completed successfully', {
                        backupName: result.backupName
                    });
                    console.log('Scheduled backup completed successfully');
                } else {
                    logger.error('Scheduled backup failed', {
                        error: result.error
                    });
                    console.error('Scheduled backup failed:', result.error);
                }
            });

            logger.info('Backup scheduler started', {
                schedule: this.schedule
            });
            console.log(`Backup scheduler started with schedule: ${this.schedule}`);
            console.log('Next backup will run at:', this.getNextRun());

        } catch (error) {
            logger.error('Failed to start backup scheduler', {
                error: error.message
            });
            console.error('Failed to start backup scheduler:', error.message);
        }
    }

    /**
     * Stop the scheduled backup service
     */
    stop() {
        if (this.task) {
            this.task.stop();
            logger.info('Backup scheduler stopped');
            console.log('Backup scheduler stopped');
        }
    }

    /**
     * Get next scheduled run time
     */
    getNextRun() {
        // This is a simple approximation
        const now = new Date();
        const parts = this.schedule.split(' ');
        
        // Parse cron: minute hour day month weekday
        const minute = parts[0] === '*' ? 0 : parseInt(parts[0]);
        const hour = parts[1] === '*' ? 0 : parseInt(parts[1]);
        
        const next = new Date();
        next.setHours(hour, minute, 0, 0);
        
        // If time has passed today, schedule for tomorrow
        if (next <= now) {
            next.setDate(next.getDate() + 1);
        }
        
        return next.toLocaleString();
    }

    /**
     * Run backup immediately (manual trigger)
     */
    async runNow() {
        logger.info('Manual backup triggered');
        console.log('Running backup now...');
        return await this.backup.createBackup();
    }
}

// Export for use in main application
module.exports = BackupScheduler;

// CLI interface for testing
if (require.main === module) {
    require('dotenv').config();
    
    const scheduler = new BackupScheduler();
    
    const command = process.argv[2];
    
    if (command === 'test') {
        console.log('Testing backup scheduler...');
        scheduler.start();
        console.log('Scheduler is running. Press Ctrl+C to stop.');
    } else if (command === 'now') {
        scheduler.runNow().then(result => {
            console.log('Backup result:', result);
            process.exit(result.success ? 0 : 1);
        });
    } else {
        console.log('Backup Scheduler');
        console.log('\nUsage:');
        console.log('  node scheduler.js test  - Test the scheduler');
        console.log('  node scheduler.js now   - Run backup immediately');
    }
}
