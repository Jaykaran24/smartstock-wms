# SmartStock WMS - Project Structure

```
smartstock-wms/
│
├── 📁 backend/                          # Backend Node.js application
│   ├── 📁 middleware/
│   │   ├── auth.js                      # JWT authentication middleware
│   │   ├── authUtils.js                 # Password hashing utilities
│   │   └── validation.js                # ✨ Input validation rules (NEW)
│   │
│   ├── 📁 models/                       # Mongoose database models
│   │   ├── User.js                      # User model (Admin/Staff)
│   │   ├── Product.js                   # Product/Inventory model
│   │   └── Order.js                     # Order model (Inbound/Outbound)
│   │
│   ├── 📁 routes/                       # Express API routes
│   │   ├── auth.js                      # Authentication endpoints
│   │   ├── products.js                  # Product management endpoints
│   │   ├── orders.js                    # Order management endpoints
│   │   └── health.js                    # ✨ Health check endpoints (NEW)
│   │
│   ├── 📁 scripts/                      # ✨ Utility scripts (NEW)
│   │   ├── backup.js                    # MongoDB backup script
│   │   └── scheduler.js                 # Automated backup scheduler
│   │
│   ├── 📁 utils/                        # ✨ Utility modules (NEW)
│   │   └── logger.js                    # Winston logger configuration
│   │
│   └── server.js                        # ✨ Main server file (ENHANCED)
│
├── 📁 frontend/                         # Frontend application
│   ├── index.html                       # Main HTML file
│   ├── script.js                        # JavaScript SPA logic
│   └── styles.css                       # CSS styling
│
├── 📁 tests/                            # ✨ Test suite (NEW)
│   ├── 📁 api/                          # API endpoint tests
│   │   └── auth.test.js                 # Authentication tests
│   ├── 📁 models/                       # Model tests
│   │   └── user.test.js                 # User model tests
│   ├── setup.js                         # Test environment setup
│   └── README.md                        # Testing documentation
│
├── 📁 logs/                             # ✨ Application logs (AUTO-CREATED)
│   ├── application-YYYY-MM-DD.log       # Daily application logs
│   └── error-YYYY-MM-DD.log             # Daily error logs
│
├── 📁 backups/                          # ✨ Database backups (AUTO-CREATED)
│   └── backup-YYYY-MM-DD-HH-mm-ss/      # Timestamped backups
│
├── 📁 uploads/                          # File uploads directory (optional)
│
├── 📁 node_modules/                     # NPM dependencies (git-ignored)
│
├── 📄 .env                              # ✨ Environment variables (ENHANCED)
├── 📄 .env.example                      # Environment template
├── 📄 .env.production.example           # ✨ Production env template (NEW)
├── 📄 .env.docker                       # ✨ Docker env template (NEW)
│
├── 📄 .gitignore                        # ✨ Git exclusions (NEW)
├── 📄 .dockerignore                     # ✨ Docker exclusions (NEW)
│
├── 📄 Dockerfile                        # ✨ Production Docker image (NEW)
├── 📄 Dockerfile.dev                    # ✨ Development Docker image (NEW)
├── 📄 docker-compose.yml                # ✨ Production Docker Compose (NEW)
├── 📄 docker-compose.dev.yml            # ✨ Development Docker Compose (NEW)
│
├── 📄 jest.config.js                    # ✨ Jest test configuration (NEW)
├── 📄 ecosystem.config.js               # PM2 configuration (create as needed)
│
├── 📄 package.json                      # ✨ NPM configuration (ENHANCED)
├── 📄 package-lock.json                 # NPM dependency lock
│
├── 📄 README.md                         # ✨ Main documentation (ENHANCED)
├── 📄 API_DOCUMENTATION.md              # ✨ Complete API reference (NEW)
├── 📄 DEPLOYMENT.md                     # ✨ Deployment guide (NEW)
├── 📄 PRODUCTION_READY.md               # ✨ Production features summary (NEW)
├── 📄 QUICK_REFERENCE.md                # ✨ Quick reference card (NEW)
└── 📄 PROJECT_STRUCTURE.md              # ✨ This file (NEW)
```

---

## 📂 Directory Purpose

### `/backend`
Contains all server-side code including API routes, database models, middleware, and utilities.

### `/backend/middleware`
- **auth.js**: JWT token verification and role-based access control
- **authUtils.js**: Password hashing and comparison utilities
- **validation.js**: Express-validator rules for input validation

### `/backend/models`
Mongoose schemas defining the database structure:
- **User**: Authentication and user management
- **Product**: Inventory items with SKU, location, quantities
- **Order**: Inbound/Outbound orders with automatic inventory updates

### `/backend/routes`
Express router modules handling API endpoints:
- **auth.js**: `/api/auth/*` - Registration, login, token verification
- **products.js**: `/api/products/*` - CRUD operations for products
- **orders.js**: `/api/orders/*` - Order management
- **health.js**: `/api/health/*` - Health checks and system metrics

### `/backend/scripts`
Utility scripts for maintenance tasks:
- **backup.js**: Database backup creation and restoration
- **scheduler.js**: Automated backup scheduling with cron

### `/backend/utils`
Shared utilities used across the application:
- **logger.js**: Winston logger with daily rotation and structured logging

### `/frontend`
Single Page Application (SPA) files:
- **index.html**: Main HTML structure
- **script.js**: Frontend JavaScript (authentication, API calls, UI logic)
- **styles.css**: Complete styling with responsive design

### `/tests`
Test suite for the application:
- **api/**: API endpoint tests using Supertest
- **models/**: Database model tests
- **setup.js**: Test environment configuration

### `/logs`
Auto-created directory for application logs:
- Rotated daily
- Separate error and application logs
- 30-day retention by default

### `/backups`
Auto-created directory for database backups:
- Timestamped backup directories
- Configurable retention period
- Includes all database collections

---

## 📄 Configuration Files

### Environment Files
| File | Purpose |
|------|---------|
| `.env` | Development environment variables |
| `.env.production.example` | Template for production environment |
| `.env.docker` | Docker-specific configuration |

### Docker Files
| File | Purpose |
|------|---------|
| `Dockerfile` | Production container image |
| `Dockerfile.dev` | Development container with hot reload |
| `docker-compose.yml` | Production orchestration |
| `docker-compose.dev.yml` | Development environment |
| `.dockerignore` | Files excluded from Docker build |

### Testing Files
| File | Purpose |
|------|---------|
| `jest.config.js` | Jest test runner configuration |
| `tests/setup.js` | Test environment setup |

### Process Management
| File | Purpose |
|------|---------|
| `ecosystem.config.js` | PM2 process manager config (create as needed) |

### Version Control
| File | Purpose |
|------|---------|
| `.gitignore` | Files excluded from Git |

---

## 📝 Documentation Files

| File | Description |
|------|-------------|
| `README.md` | Main project documentation with features and setup |
| `API_DOCUMENTATION.md` | Complete API reference with examples |
| `DEPLOYMENT.md` | Step-by-step deployment guide |
| `PRODUCTION_READY.md` | Summary of all production features |
| `QUICK_REFERENCE.md` | Quick command reference |
| `PROJECT_STRUCTURE.md` | This file - project organization |
| `tests/README.md` | Testing documentation |

---

## 🔄 Data Flow

```
Frontend (index.html, script.js)
    ↓ HTTP Requests
Server (server.js)
    ↓ Routing
API Routes (routes/)
    ↓ Validation (middleware/validation.js)
    ↓ Authentication (middleware/auth.js)
    ↓ Business Logic
Database Models (models/)
    ↓
MongoDB Database
    ↓ Logging
Winston Logger (utils/logger.js)
    ↓
Log Files (logs/)
```

---

## 🔐 Security Layers

```
1. Rate Limiting (server.js)
    ↓
2. CORS Policy (server.js)
    ↓
3. Input Validation (middleware/validation.js)
    ↓
4. Input Sanitization (express-mongo-sanitize)
    ↓
5. Authentication (middleware/auth.js)
    ↓
6. Authorization (role-based)
    ↓
7. Database Operations (models/)
```

---

## 🚀 Request Lifecycle

### Example: Create Product

```
1. Frontend: User fills product form
   ↓
2. Frontend: POST request to /api/products
   ↓
3. Server: Rate limiter checks request count
   ↓
4. Server: CORS validation
   ↓
5. Validation Middleware: Validates product data
   ↓
6. Auth Middleware: Verifies JWT token
   ↓
7. Auth Middleware: Checks user role permissions
   ↓
8. Route Handler: Creates product in database
   ↓
9. Logger: Logs successful operation
   ↓
10. Response: Returns created product to frontend
```

---

## 📦 Dependencies Overview

### Production Dependencies
- **express**: Web framework
- **mongoose**: MongoDB ODM
- **jsonwebtoken**: JWT authentication
- **bcryptjs**: Password hashing
- **helmet**: Security headers
- **cors**: Cross-origin resource sharing
- **dotenv**: Environment variables
- **express-rate-limit**: Rate limiting
- **express-validator**: Input validation
- **express-mongo-sanitize**: NoSQL injection prevention
- **winston**: Logging
- **winston-daily-rotate-file**: Log rotation
- **morgan**: HTTP request logging
- **node-cron**: Task scheduling

### Development Dependencies
- **nodemon**: Auto-restart on changes
- **jest**: Testing framework
- **supertest**: API testing
- **@shelf/jest-mongodb**: MongoDB testing

---

## 🎯 Key Features by File

### server.js
- Express app initialization
- Security middleware (Helmet, CORS, Rate limiting)
- Database connection
- Route mounting
- Error handling
- Graceful shutdown

### middleware/auth.js
- JWT token verification
- Role-based authorization
- User authentication

### middleware/validation.js
- Input validation rules
- Data sanitization
- Error formatting

### utils/logger.js
- Structured logging
- Log rotation
- Multiple log levels
- Request logging

### scripts/backup.js
- Database backup creation
- Backup restoration
- Backup management

### routes/health.js
- Basic health check
- Detailed system metrics
- Kubernetes probes

---

## 🔧 Maintenance Files

### Logs
```
logs/application-YYYY-MM-DD.log   # All logs
logs/error-YYYY-MM-DD.log         # Errors only
logs/pm2-*.log                    # PM2 logs (if using PM2)
```

### Backups
```
backups/backup-YYYY-MM-DD-HH-mm-ss/
    └── smartstock-wms/           # Database dump
        ├── users.bson
        ├── products.bson
        └── orders.bson
```

---

## 📊 File Statistics

| Category | Count |
|----------|-------|
| Backend Source Files | 12 |
| Frontend Files | 3 |
| Test Files | 4 |
| Configuration Files | 8 |
| Documentation Files | 7 |
| Docker Files | 4 |
| **Total Project Files** | **38** |

---

## 🎨 Naming Conventions

### Files
- **JavaScript**: camelCase (e.g., `authUtils.js`)
- **Config**: lowercase with dots (e.g., `jest.config.js`)
- **Docs**: UPPERCASE (e.g., `README.md`)
- **Environment**: lowercase with dots (e.g., `.env.production`)

### Code
- **Variables/Functions**: camelCase (e.g., `getUserData`)
- **Classes**: PascalCase (e.g., `DatabaseBackup`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `MAX_RETRY_COUNT`)
- **Private**: _prefixed (e.g., `_internalMethod`)

---

## 🔗 File Relationships

```
server.js
├── requires → routes/*.js
├── requires → middleware/auth.js
├── requires → utils/logger.js
└── connects → MongoDB

routes/*.js
├── requires → models/*.js
├── requires → middleware/auth.js
├── requires → middleware/validation.js
└── uses → utils/logger.js

models/*.js
└── defines → Mongoose schemas

scripts/*.js
├── requires → utils/logger.js
└── connects → MongoDB
```

---

*This structure represents the complete production-ready SmartStock WMS application.*
