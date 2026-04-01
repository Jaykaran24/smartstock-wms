const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const { promisify } = require('util');

const execPromise = promisify(exec);
require('dotenv').config();

/**
 * MongoDB Backup Script
 * Creates automated backups of the MongoDB database
 */

class DatabaseBackup {
    constructor() {
        this.backupDir = path.join(__dirname, '../backups');
        this.mongoUri = process.env.MONGODB_URI;
        this.retentionDays = parseInt(process.env.BACKUP_RETENTION_DAYS) || 30;
        
        // Ensure backup directory exists
        if (!fs.existsSync(this.backupDir)) {
            fs.mkdirSync(this.backupDir, { recursive: true });
        }
    }

    /**
     * Parse MongoDB URI to extract connection details
     */
    parseMongoUri() {
        try {
            const url = new URL(this.mongoUri.replace('mongodb+srv://', 'https://'));
            const username = url.username;
            const password = url.password;
            const host = url.hostname;
            const database = url.pathname.split('/')[1].split('?')[0];
            
            return { username, password, host, database };
        } catch (error) {
            console.error('Failed to parse MongoDB URI:', error.message);
            throw new Error('Invalid MongoDB URI');
        }
    }

    /**
     * Create a backup of the database
     */
    async createBackup() {
        try {
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const backupName = `backup-${timestamp}`;
            const backupPath = path.join(this.backupDir, backupName);

            console.log(`Starting backup: ${backupName}`);
            console.log(`Backup location: ${backupPath}`);

            // Parse MongoDB URI
            const { username, password, host, database } = this.parseMongoUri();

            // Construct mongodump command
            const command = `mongodump --uri="${this.mongoUri}" --out="${backupPath}"`;

            // Execute backup
            const { stdout, stderr } = await execPromise(command);
            
            if (stderr && !stderr.includes('writing')) {
                console.error('Backup stderr:', stderr);
            }
            
            console.log('Backup completed successfully');
            console.log(`Backup saved to: ${backupPath}`);

            // Clean old backups
            await this.cleanOldBackups();

            return {
                success: true,
                backupName,
                backupPath,
                timestamp: new Date().toISOString()
            };

        } catch (error) {
            console.error('Backup failed:', error.message);
            return {
                success: false,
                error: error.message,
                timestamp: new Date().toISOString()
            };
        }
    }

    /**
     * Clean up old backups based on retention policy
     */
    async cleanOldBackups() {
        try {
            const files = fs.readdirSync(this.backupDir);
            const now = Date.now();
            const maxAge = this.retentionDays * 24 * 60 * 60 * 1000; // Convert days to milliseconds

            let deletedCount = 0;

            for (const file of files) {
                const filePath = path.join(this.backupDir, file);
                const stats = fs.statSync(filePath);

                // Check if file is older than retention period
                if (now - stats.mtimeMs > maxAge) {
                    // Delete directory recursively
                    fs.rmSync(filePath, { recursive: true, force: true });
                    console.log(`Deleted old backup: ${file}`);
                    deletedCount++;
                }
            }

            if (deletedCount > 0) {
                console.log(`Cleaned up ${deletedCount} old backup(s)`);
            } else {
                console.log('No old backups to clean');
            }

        } catch (error) {
            console.error('Failed to clean old backups:', error.message);
        }
    }

    /**
     * List all available backups
     */
    listBackups() {
        try {
            const files = fs.readdirSync(this.backupDir);
            const backups = files.map(file => {
                const filePath = path.join(this.backupDir, file);
                const stats = fs.statSync(filePath);
                return {
                    name: file,
                    path: filePath,
                    created: stats.mtime,
                    size: this.formatBytes(stats.size)
                };
            });

            return backups.sort((a, b) => b.created - a.created);
        } catch (error) {
            console.error('Failed to list backups:', error.message);
            return [];
        }
    }

    /**
     * Restore database from backup
     */
    async restoreBackup(backupName) {
        try {
            const backupPath = path.join(this.backupDir, backupName);

            if (!fs.existsSync(backupPath)) {
                throw new Error(`Backup not found: ${backupName}`);
            }

            console.log(`Starting restore from: ${backupName}`);
            console.log(`Backup location: ${backupPath}`);

            // Construct mongorestore command
            const command = `mongorestore --uri="${this.mongoUri}" --drop "${backupPath}"`;

            // Execute restore
            const { stdout, stderr } = await execPromise(command);
            
            if (stderr) {
                console.error('Restore stderr:', stderr);
            }

            console.log('Restore completed successfully');

            return {
                success: true,
                backupName,
                timestamp: new Date().toISOString()
            };

        } catch (error) {
            console.error('Restore failed:', error.message);
            return {
                success: false,
                error: error.message,
                timestamp: new Date().toISOString()
            };
        }
    }

    /**
     * Format bytes to human-readable format
     */
    formatBytes(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
}

// CLI interface
if (require.main === module) {
    const backup = new DatabaseBackup();
    const command = process.argv[2];

    switch (command) {
        case 'create':
            backup.createBackup()
                .then(result => {
                    console.log('\nBackup Result:', result);
                    process.exit(result.success ? 0 : 1);
                });
            break;

        case 'list':
            const backups = backup.listBackups();
            console.log('\nAvailable Backups:');
            console.log(JSON.stringify(backups, null, 2));
            process.exit(0);
            break;

        case 'restore':
            const backupName = process.argv[3];
            if (!backupName) {
                console.error('Error: Backup name required');
                console.log('Usage: node backup.js restore <backup-name>');
                process.exit(1);
            }
            backup.restoreBackup(backupName)
                .then(result => {
                    console.log('\nRestore Result:', result);
                    process.exit(result.success ? 0 : 1);
                });
            break;

        case 'clean':
            backup.cleanOldBackups()
                .then(() => {
                    console.log('\nCleanup completed');
                    process.exit(0);
                });
            break;

        default:
            console.log('MongoDB Backup Script');
            console.log('\nUsage:');
            console.log('  node backup.js create          - Create a new backup');
            console.log('  node backup.js list            - List all backups');
            console.log('  node backup.js restore <name>  - Restore from backup');
            console.log('  node backup.js clean           - Clean old backups');
            process.exit(0);
    }
}

module.exports = DatabaseBackup;
