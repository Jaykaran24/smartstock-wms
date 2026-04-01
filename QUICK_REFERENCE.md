# SmartStock WMS - Quick Reference

## 🚀 Quick Start

### Development
```bash
npm install
npm run dev
```
Access: http://localhost:3000

### Production (Docker)
```bash
docker-compose up -d
```

### Production (PM2)
```bash
npm ci --only=production
pm2 start ecosystem.config.js
```

---

## 📝 NPM Scripts

```bash
npm start              # Start production server
npm run dev            # Start development server with nodemon
npm test               # Run all tests
npm run test:watch     # Run tests in watch mode
npm run test:coverage  # Run tests with coverage report
npm run backup         # Create database backup
npm run backup:list    # List all backups
npm run backup:restore # Restore from backup
```

---

## 🔑 Default Credentials

**Username:** admin  
**Password:** Admin123!

⚠️ **IMPORTANT:** Change the default admin password immediately after first login!

---

## 📍 Important Endpoints

### Frontend
- Main App: http://localhost:3000

### API
- Base URL: http://localhost:3000/api
- Health: http://localhost:3000/api/health
- Detailed Health: http://localhost:3000/api/health/detailed
- Readiness: http://localhost:3000/api/health/readiness
- Liveness: http://localhost:3000/api/health/liveness

---

## 📁 Key Files

| File | Purpose |
|------|---------|
| `.env` | Environment variables (development) |
| `.env.production.example` | Production environment template |
| `.env.docker` | Docker environment template |
| `API_DOCUMENTATION.md` | Complete API reference |
| `DEPLOYMENT.md` | Deployment guide |
| `PRODUCTION_READY.md` | Production features summary |
| `ecosystem.config.js` | PM2 configuration (create as needed) |

---

## 🐳 Docker Commands

```bash
# Production
docker-compose up -d                    # Start services
docker-compose down                     # Stop services
docker-compose logs -f smartstock-app   # View logs
docker-compose restart smartstock-app   # Restart app

# Development
docker-compose -f docker-compose.dev.yml up    # Start dev environment
docker-compose -f docker-compose.dev.yml down  # Stop dev environment
```

---

## 🔧 PM2 Commands

```bash
pm2 start ecosystem.config.js    # Start application
pm2 restart smartstock-wms       # Restart application
pm2 stop smartstock-wms          # Stop application
pm2 logs smartstock-wms          # View logs
pm2 monit                        # Monitor resources
pm2 status                       # Check status
pm2 save                         # Save current state
```

---

## 📊 Log Files

```bash
logs/application-YYYY-MM-DD.log  # Application logs
logs/error-YYYY-MM-DD.log        # Error logs
logs/pm2-error.log               # PM2 errors
logs/pm2-out.log                 # PM2 output
```

View logs:
```bash
tail -f logs/application-$(date +%Y-%m-%d).log
tail -f logs/error-$(date +%Y-%m-%d).log
```

---

## 💾 Backup Management

```bash
# Create backup
npm run backup

# List all backups
npm run backup:list

# Restore from backup
npm run backup:restore <backup-name>

# Manual backup script
node backend/scripts/backup.js create
node backend/scripts/backup.js list
node backend/scripts/backup.js restore <backup-name>
```

Backups are stored in: `backups/`

---

## 🧪 Testing

```bash
# Run all tests
npm test

# Watch mode (re-run on changes)
npm run test:watch

# Coverage report
npm run test:coverage

# Run specific test file
npm test -- tests/api/auth.test.js

# Run tests matching pattern
npm test -- --testNamePattern="authentication"
```

---

## 🔒 Security Checklist

Before production deployment:

- [ ] Change default admin password
- [ ] Generate secure JWT secrets (64+ chars)
- [ ] Set `NODE_ENV=production`
- [ ] Configure production database
- [ ] Enable HTTPS/SSL
- [ ] Set up firewall rules
- [ ] Configure CORS origins
- [ ] Review rate limiting settings
- [ ] Test backup and restore
- [ ] Set up monitoring

---

## 🌐 Environment Variables

Essential variables for production:

```bash
NODE_ENV=production
PORT=3000
MONGODB_URI=mongodb+srv://...
JWT_SECRET=your-64-char-secret
JWT_REFRESH_SECRET=your-64-char-secret
DEFAULT_ADMIN_PASSWORD=SecurePassword123!
FRONTEND_URL=https://yourdomain.com
```

Generate secure secrets:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

---

## 🔍 Health Checks

```bash
# Basic health
curl http://localhost:3000/api/health

# Detailed health with metrics
curl http://localhost:3000/api/health/detailed

# Readiness probe
curl http://localhost:3000/api/health/readiness

# Liveness probe
curl http://localhost:3000/api/health/liveness
```

---

## 🚨 Troubleshooting

### Application won't start
```bash
# Check logs
pm2 logs smartstock-wms
# or
docker-compose logs smartstock-app

# Check port availability
netstat -ano | findstr :3000  # Windows
lsof -i :3000                  # Linux/Mac

# Verify environment variables
pm2 env 0
```

### Database connection issues
```bash
# Test MongoDB connection
mongosh "$MONGODB_URI"

# Check MongoDB status (if self-hosted)
systemctl status mongod  # Linux
```

### Reset to defaults
```bash
# Stop application
pm2 stop smartstock-wms

# Clear logs
rm -rf logs/*

# Restart
pm2 restart smartstock-wms
```

---

## 📚 Documentation Links

- **API Documentation**: `API_DOCUMENTATION.md`
- **Deployment Guide**: `DEPLOYMENT.md`
- **Production Features**: `PRODUCTION_READY.md`
- **Test Documentation**: `tests/README.md`
- **Main README**: `README.md`

---

## 🆘 Quick Support

| Issue | Solution |
|-------|----------|
| Can't login | Check default credentials (admin/Admin123!) |
| Database error | Verify MONGODB_URI in .env |
| Port in use | Change PORT in .env or kill process |
| No logs | Check logs/ directory exists and permissions |
| Backup fails | Ensure mongodump is installed |
| Tests fail | Run `npm install` and check test database |

---

## 🎯 Common Tasks

### Add New User (via API)
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"newuser","password":"Pass123!","role":"Staff"}'
```

### Create Product (via API)
```bash
curl -X POST http://localhost:3000/api/products \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Product Name","sku":"SKU-001",...}'
```

### View System Status
```bash
# PM2
pm2 status

# Docker
docker-compose ps

# Logs
pm2 logs --lines 50
```

---

## 🔄 Update & Maintenance

```bash
# Update dependencies
npm update

# Security audit
npm audit
npm audit fix

# Check outdated packages
npm outdated

# Clean install
rm -rf node_modules package-lock.json
npm install
```

---

## 📞 Support

- Issues: GitHub Issues
- Email: support@smartstock.com
- Documentation: See files listed above

---

*Last Updated: October 21, 2025*
