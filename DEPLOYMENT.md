# SmartStock WMS - Production Deployment Guide

This guide provides comprehensive instructions for deploying SmartStock Warehouse Management System to production.

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Pre-Deployment Checklist](#pre-deployment-checklist)
3. [Deployment Methods](#deployment-methods)
4. [Environment Configuration](#environment-configuration)
5. [Database Setup](#database-setup)
6. [Security Hardening](#security-hardening)
7. [Monitoring & Maintenance](#monitoring--maintenance)
8. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### System Requirements
- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher
- **MongoDB**: v5.0 or higher (or MongoDB Atlas account)
- **RAM**: Minimum 2GB, Recommended 4GB+
- **Storage**: Minimum 10GB free space
- **OS**: Linux (Ubuntu 20.04+), macOS, or Windows Server

### Required Accounts
- MongoDB Atlas account (or self-hosted MongoDB)
- Domain name (for production URL)
- SSL/TLS certificate (Let's Encrypt recommended)
- (Optional) Cloud hosting account (AWS, DigitalOcean, Heroku, etc.)

---

## Pre-Deployment Checklist

### 1. Code Preparation
- [ ] Run all tests: `npm test`
- [ ] Build production assets
- [ ] Review and update dependencies: `npm audit fix`
- [ ] Remove development/debug code
- [ ] Update version in package.json

### 2. Environment Configuration
- [ ] Create production `.env` file
- [ ] Generate secure JWT secrets (64+ characters)
- [ ] Set `NODE_ENV=production`
- [ ] Configure production database URI
- [ ] Update CORS origins
- [ ] Set secure admin password

### 3. Security Review
- [ ] Enable HTTPS/SSL
- [ ] Configure rate limiting
- [ ] Set up firewall rules
- [ ] Enable MongoDB authentication
- [ ] Review security headers
- [ ] Disable debug mode

### 4. Database Preparation
- [ ] Backup existing data
- [ ] Run database migrations
- [ ] Create database indexes
- [ ] Test database connection

---

## Deployment Methods

### Method 1: Docker Deployment (Recommended)

#### Step 1: Prepare Environment
```bash
# Copy production environment file
cp .env.production.example .env

# Edit .env with your production values
nano .env
```

#### Step 2: Build Docker Image
```bash
# Build production image
docker build -t smartstock-wms:latest .

# Verify image
docker images | grep smartstock
```

#### Step 3: Run with Docker Compose
```bash
# Start all services
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f smartstock-app
```

#### Step 4: Verify Deployment
```bash
# Test health endpoint
curl http://localhost:3000/api/health

# Check detailed health
curl http://localhost:3000/api/health/detailed
```

---

### Method 2: Traditional Server Deployment

#### Step 1: Server Setup
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install MongoDB (if self-hosting)
wget -qO - https://www.mongodb.org/static/pgp/server-7.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list
sudo apt update
sudo apt install -y mongodb-org

# Start MongoDB
sudo systemctl start mongod
sudo systemctl enable mongod
```

#### Step 2: Deploy Application
```bash
# Create application directory
sudo mkdir -p /var/www/smartstock-wms
cd /var/www/smartstock-wms

# Clone or upload your code
# git clone <your-repository-url> .
# OR upload via scp/sftp

# Install dependencies (production only)
npm ci --only=production

# Create necessary directories
mkdir -p logs backups uploads

# Set proper permissions
sudo chown -R $USER:$USER /var/www/smartstock-wms
chmod -R 755 /var/www/smartstock-wms
```

#### Step 3: Configure Environment
```bash
# Create production environment file
nano .env

# Add your production configuration (see Environment Configuration section)
```

#### Step 4: Set Up Process Manager (PM2)
```bash
# Install PM2 globally
sudo npm install -g pm2

# Create PM2 ecosystem file
cat > ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: 'smartstock-wms',
    script: './backend/server.js',
    instances: 2,
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production'
    },
    error_file: './logs/pm2-error.log',
    out_file: './logs/pm2-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    max_memory_restart: '500M',
    watch: false
  }]
};
EOF

# Start application with PM2
pm2 start ecosystem.config.js

# Setup PM2 to start on system boot
pm2 startup
pm2 save

# Monitor application
pm2 status
pm2 logs smartstock-wms
```

---

### Method 3: Cloud Platform Deployment

#### Heroku Deployment

```bash
# Install Heroku CLI
curl https://cli-assets.heroku.com/install.sh | sh

# Login to Heroku
heroku login

# Create Heroku app
heroku create smartstock-wms

# Add MongoDB addon
heroku addons:create mongolab:sandbox

# Set environment variables
heroku config:set NODE_ENV=production
heroku config:set JWT_SECRET=your-secure-secret
heroku config:set JWT_REFRESH_SECRET=your-refresh-secret

# Deploy
git push heroku main

# Open app
heroku open
```

#### AWS EC2 Deployment
1. Launch EC2 instance (Ubuntu 20.04, t2.small or higher)
2. Configure security groups (allow ports 22, 80, 443, 3000)
3. Connect via SSH
4. Follow "Traditional Server Deployment" steps
5. Configure Elastic IP for static IP address
6. Set up Application Load Balancer (optional)

#### DigitalOcean Droplet
1. Create droplet (Ubuntu 20.04, $12/month or higher)
2. SSH into droplet
3. Follow "Traditional Server Deployment" steps
4. Configure firewall rules
5. Set up domain DNS records

---

## Environment Configuration

### Production .env File

```bash
# Environment
NODE_ENV=production

# Server
PORT=3000
FRONTEND_URL=https://yourdomain.com

# Database (MongoDB Atlas example)
MONGODB_URI=mongodb+srv://username:password@cluster0.mongodb.net/smartstock-wms?retryWrites=true&w=majority

# JWT Secrets (CHANGE THESE!)
# Generate with: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
JWT_SECRET=your-64-character-minimum-secure-random-string-here
JWT_REFRESH_SECRET=your-different-64-character-minimum-secure-random-string-here

# Admin
DEFAULT_ADMIN_PASSWORD=YourSecureAdminPassword123!

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
AUTH_RATE_LIMIT_MAX=5

# Security
BCRYPT_ROUNDS=12

# Logging
LOG_LEVEL=info
LOG_FILE=logs/app.log

# Backup
BACKUP_ENABLED=true
BACKUP_SCHEDULE=0 2 * * *
BACKUP_RETENTION_DAYS=30

# CORS (comma-separated)
CORS_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
```

### Generate Secure Secrets

```bash
# Generate JWT secret
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Generate multiple secrets
node -e "console.log('JWT_SECRET=' + require('crypto').randomBytes(64).toString('hex')); console.log('JWT_REFRESH_SECRET=' + require('crypto').randomBytes(64).toString('hex'))"
```

---

## Database Setup

### MongoDB Atlas (Cloud)

1. **Create Account**
   - Go to [MongoDB Atlas](https://www.mongodb.com/atlas)
   - Sign up for free tier

2. **Create Cluster**
   - Choose region closest to your users
   - Select M0 (free) or appropriate tier
   - Wait for cluster creation (5-10 minutes)

3. **Configure Access**
   ```
   - Network Access: Add your server IP or 0.0.0.0/0 (for testing)
   - Database Access: Create database user
   - Note: Username and password for connection string
   ```

4. **Get Connection String**
   ```
   - Click "Connect" on your cluster
   - Choose "Connect your application"
   - Copy connection string
   - Replace <username>, <password>, and <dbname>
   ```

5. **Test Connection**
   ```bash
   # Using MongoDB Compass or CLI
   mongosh "mongodb+srv://username:password@cluster0.mongodb.net/smartstock-wms"
   ```

### Self-Hosted MongoDB

```bash
# Install MongoDB
# (See Method 2 installation steps)

# Create database and user
mongosh

use smartstock-wms

db.createUser({
  user: "smartstock_admin",
  pwd: "secure_password_here",
  roles: [
    { role: "readWrite", db: "smartstock-wms" },
    { role: "dbAdmin", db: "smartstock-wms" }
  ]
})

# Update .env with local connection
MONGODB_URI=mongodb://smartstock_admin:secure_password_here@localhost:27017/smartstock-wms?authSource=smartstock-wms
```

---

## Security Hardening

### 1. Enable HTTPS/SSL

#### Using Let's Encrypt (Free SSL)

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Auto-renewal test
sudo certbot renew --dry-run
```

### 2. Configure Nginx Reverse Proxy

```bash
# Install Nginx
sudo apt install nginx

# Create configuration
sudo nano /etc/nginx/sites-available/smartstock-wms

# Add this configuration:
```

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # Proxy settings
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req zone=api burst=20 nodelay;
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/smartstock-wms /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
```

### 3. Firewall Configuration

```bash
# Configure UFW firewall
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw enable

# Block direct access to app port (if using Nginx)
sudo ufw deny 3000/tcp
```

### 4. Secure MongoDB

```bash
# Enable MongoDB authentication
sudo nano /etc/mongod.conf

# Add:
security:
  authorization: enabled

# Restart MongoDB
sudo systemctl restart mongod
```

---

## Monitoring & Maintenance

### 1. Application Monitoring

```bash
# Monitor with PM2
pm2 monit

# Check logs
pm2 logs smartstock-wms --lines 100

# Restart application
pm2 restart smartstock-wms

# Check resource usage
pm2 show smartstock-wms
```

### 2. Database Backups

```bash
# Manual backup
npm run backup

# List backups
npm run backup:list

# Restore from backup
npm run backup:restore backup-name

# Automated backups are configured via BACKUP_ENABLED=true in .env
# Default: Daily at 2 AM (configurable via BACKUP_SCHEDULE)
```

### 3. Log Management

```bash
# View application logs
tail -f logs/application-2025-10-21.log

# View error logs
tail -f logs/error-2025-10-21.log

# Rotate logs (automatically handled by Winston)
# Old logs are automatically deleted after 30 days
```

### 4. Health Checks

```bash
# Basic health check
curl https://yourdomain.com/api/health

# Detailed health check
curl https://yourdomain.com/api/health/detailed

# Setup monitoring service (e.g., UptimeRobot)
# Monitor: https://yourdomain.com/api/health/liveness
```

### 5. Performance Monitoring

Consider implementing:
- **New Relic**: Application performance monitoring
- **DataDog**: Infrastructure and application monitoring
- **Sentry**: Error tracking and monitoring
- **PM2 Plus**: Advanced PM2 monitoring (paid)

---

## Troubleshooting

### Application Won't Start

```bash
# Check logs
pm2 logs smartstock-wms

# Check environment variables
pm2 env 0

# Verify Node.js version
node --version

# Check port availability
sudo lsof -i :3000

# Restart application
pm2 restart smartstock-wms
```

### Database Connection Issues

```bash
# Test MongoDB connection
mongosh "$MONGODB_URI"

# Check MongoDB status (if self-hosted)
sudo systemctl status mongod

# View MongoDB logs
sudo tail -f /var/log/mongodb/mongod.log

# Verify network access (MongoDB Atlas)
# Check IP whitelist in Atlas dashboard
```

### High Memory Usage

```bash
# Check memory usage
pm2 show smartstock-wms

# Increase max memory restart
pm2 start ecosystem.config.js --max-memory-restart 1G

# Check for memory leaks in logs
grep -i "memory" logs/application-*.log
```

### SSL Certificate Issues

```bash
# Test SSL certificate
openssl s_client -connect yourdomain.com:443

# Renew certificate
sudo certbot renew

# Check certificate expiry
sudo certbot certificates
```

---

## Post-Deployment Steps

1. **Change Default Admin Password**
   - Login with default credentials
   - Immediately change password
   - Update .env with new DEFAULT_ADMIN_PASSWORD

2. **Test All Features**
   - User authentication
   - Product CRUD operations
   - Order management
   - Inventory updates

3. **Set Up Monitoring**
   - Configure uptime monitoring
   - Set up error alerts
   - Enable backup notifications

4. **Document Your Deployment**
   - Note all customizations
   - Document server details
   - Keep backup of configurations

5. **Plan for Scaling**
   - Monitor resource usage
   - Plan database scaling
   - Consider CDN for static assets
   - Implement caching strategy

---

## Maintenance Schedule

### Daily
- Review application logs
- Check backup completion
- Monitor system resources

### Weekly
- Review error logs
- Check security updates
- Test backup restoration
- Update dependencies: `npm update`

### Monthly
- Security audit: `npm audit`
- Database optimization
- Review access logs
- Update SSL certificates (if needed)

### Quarterly
- Full system backup
- Performance review
- Capacity planning
- Security assessment

---

## Support & Resources

- **Documentation**: README.md, API_DOCUMENTATION.md
- **Issues**: GitHub Issues
- **Community**: [Your community forum/Slack]
- **Commercial Support**: support@smartstock.com

---

## Emergency Contacts

- **System Administrator**: [Your contact]
- **Database Administrator**: [Your contact]
- **Security Team**: [Your contact]
- **24/7 Support**: [Your contact]

---

*Last Updated: October 21, 2025*
