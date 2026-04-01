# SmartStock - Warehouse Management System

![SmartStock WMS](https://img.shields.io/badge/SmartStock-WMS-blue)
![Node.js](https://img.shields.io/badge/Node.js-v18+-green)
![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-green)
![License](https://img.shields.io/badge/License-MIT-yellow)
![Production Ready](https://img.shields.io/badge/Production-Ready-brightgreen)

A comprehensive, **production-ready** full-stack Warehouse Management System built with modern web technologies. SmartStock WMS provides robust inventory tracking, order management, user authentication, automated backups, comprehensive logging, and enterprise-grade security features.

## ✨ **Production Features**

### 🔐 **Enterprise Security**
- JWT-based authentication with secure token management
- Input validation and sanitization (express-validator)
- NoSQL injection prevention
- Rate limiting (100 req/15min, 10 auth req/15min)
- Helmet security headers
- CORS configuration
- Password hashing with bcrypt (configurable rounds)

### 📝 **Production Logging**
- Winston logger with daily file rotation
- Separate error and application logs
- Structured logging with metadata
- 30-day automatic log retention
- HTTP request logging via Morgan
- Configurable log levels

### 🏥 **Health Monitoring**
- Comprehensive health check endpoints
- System metrics (CPU, memory, uptime)
- Database connection status
- Kubernetes-ready readiness/liveness probes
- Real-time resource monitoring

### 💾 **Automated Backups**
- Scheduled MongoDB backups (configurable cron)
- Manual backup creation
- Backup restoration
- Automatic cleanup (retention policy)
- NPM scripts for easy backup management

### 🐳 **Docker Support**
- Production-ready Dockerfile
- Docker Compose orchestration
- Development environment with hot reload
- MongoDB container option
- Nginx reverse proxy configuration
- Health checks built-in

### 🧪 **Testing Foundation**
- Jest test framework configured
- Supertest for API testing
- Sample test files (auth, models)
- Test utilities and helpers
- Coverage reporting

### 📚 **Complete Documentation**
- Comprehensive API documentation
- Step-by-step deployment guide
- Testing documentation
- Production readiness checklist
- Troubleshooting guides

## 🚀 Features

### 🔐 **Authentication & Authorization**
- Secure JWT-based authentication
- Role-based access control (Admin/Staff)
- Password hashing with bcryptjs
- Rate limiting for security
- Session management
- Token verification endpoint

### 📊 **Dashboard Analytics**
- Real-time inventory statistics
- Order status tracking
- Low stock alerts
- Recent activity feed
- Visual metrics cards

### 📦 **Inventory Management**
- Complete CRUD operations for products
- SKU-based product identification
- Category and location tracking
- Stock level monitoring
- Reorder level management
- Advanced search and filtering

### 🚚 **Order Management**
- Inbound and outbound order processing
- Automatic inventory updates
- Order status tracking (Pending → Processing → Shipped/Received)
- Customer/supplier management
- Order history and audit trail

### 💻 **Modern UI/UX**
- Responsive design (mobile, tablet, desktop)
- Single Page Application (SPA) architecture
- Professional color scheme
- Interactive modals and forms
- Real-time notifications
- Loading states and animations

## 🛠 **Technology Stack**

### **Backend**
- **Node.js** - Runtime environment
- **Express.js** - Web application framework
- **MongoDB** - Database (Atlas recommended)
- **Mongoose** - ODM for MongoDB
- **JWT** - Authentication tokens
- **bcryptjs** - Password hashing
- **Helmet** - Security middleware
- **CORS** - Cross-origin resource sharing

### **Frontend**
- **HTML5** - Semantic markup
- **CSS3** - Modern styling with Flexbox/Grid
- **Vanilla JavaScript** - SPA functionality
- **Font Awesome** - Icons
- **Responsive Design** - Mobile-first approach

## 📋 **Prerequisites**

Before you begin, ensure you have the following installed:

- **Node.js** (v14.0.0 or higher) - [Download](https://nodejs.org/)
- **npm** (comes with Node.js)
- **MongoDB Atlas** account - [Sign up](https://www.mongodb.com/atlas)
- **Git** (optional) - [Download](https://git-scm.com/)

## 🚀 **Installation & Setup**

### **Step 1: Clone or Download the Project**

```bash
# If using Git
git clone <repository-url>
cd smartstock-wms

# Or download and extract the ZIP file
```

### **Step 2: Install Dependencies**

```bash
# Install all required packages
npm install
```

### **Step 3: Environment Configuration**

1. Copy the example environment file:
```bash
cp .env.example .env
```

2. Edit `.env` file with your configuration:
```env
# Required Configuration
NODE_ENV=development
PORT=5000
MONGODB_URI=your-mongodb-atlas-connection-string
JWT_SECRET=your-super-secure-jwt-secret-minimum-32-characters
DEFAULT_ADMIN_PASSWORD=Admin123!

# Optional Configuration
FRONTEND_URL=http://localhost:5000
JWT_REFRESH_SECRET=your-refresh-secret
BCRYPT_ROUNDS=12
```

**Important Environment Variables:**

- **MONGODB_URI**: Your MongoDB Atlas connection string
- **JWT_SECRET**: A secure secret key (minimum 32 characters)
- **DEFAULT_ADMIN_PASSWORD**: Initial admin password (change after first login)

### **Step 4: MongoDB Atlas Setup**

1. **Create MongoDB Atlas Account**:
   - Go to [MongoDB Atlas](https://www.mongodb.com/atlas)
   - Sign up for a free account

2. **Create a Cluster**:
   - Choose "Build a Database"
   - Select "M0 Sandbox" (Free tier)
   - Choose your preferred region
   - Click "Create Cluster"

3. **Create Database User**:
   - Go to "Database Access"
   - Click "Add New Database User"
   - Choose "Password" authentication
   - Create username and secure password
   - Set role to "Atlas Admin" or "Read and write to any database"

4. **Configure Network Access**:
   - Go to "Network Access"
   - Click "Add IP Address"
   - Choose "Allow Access from Anywhere" (0.0.0.0/0) for development
   - For production, use specific IP addresses

5. **Get Connection String**:
   - Go to "Clusters"
   - Click "Connect" on your cluster
   - Choose "Connect your application"
   - Copy the connection string
   - Replace `<username>`, `<password>`, and `<database>` in the string

**Example Connection String:**
```
mongodb+srv://username:password@cluster0.abc123.mongodb.net/smartstock-wms?retryWrites=true&w=majority
```

### **Step 5: Generate Secure JWT Secret**

Create a secure JWT secret (minimum 32 characters):

```bash
# Option 1: Use Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Option 2: Use online generator
# Visit: https://www.allkeysgenerator.com/Random/Security-Encryption-Key-Generator.aspx
```

## 🏃‍♂️ **Running the Application**

### **Development Mode**

```bash
# Start the server with auto-restart on file changes
npm run dev

# Or start normally
npm start
```

The application will be available at: **http://localhost:5000**

### **Production Mode**

```bash
# Set production environment
export NODE_ENV=production

# Start the application
npm start
```

## 👤 **Default Login Credentials**

On first startup, a default admin user is automatically created:

```
Username: admin
Password: Admin123! (or your custom DEFAULT_ADMIN_PASSWORD)
```

**⚠️ Important**: Change this password immediately after first login!

## 📱 **Using the Application**

### **1. Login**
- Navigate to http://localhost:5000
- Use the default credentials or create a new user
- The application will redirect to the dashboard

### **2. Dashboard**
- View real-time statistics
- Monitor inventory levels
- Check recent orders
- Identify low stock items

### **3. Inventory Management**
- **Add Products**: Click "Add Product" button
- **Edit Products**: Click the edit icon in the products table
- **Delete Products**: Click the delete icon (confirmation required)
- **Search**: Use the search bar to filter by name or SKU
- **Filter**: Use dropdown filters for categories

### **4. Order Management**
- **Create Orders**: Click "Create Order" button
- **Track Orders**: Monitor order status progression
- **Update Status**: Change order status to trigger inventory updates
- **View Details**: Click the view icon for order details

### **5. User Profile**
- Access via user menu (top-right)
- Update username and password
- View account information

## 🔧 **API Endpoints**

### **Authentication**
```
POST /api/auth/register     # Register new user
POST /api/auth/login        # User login
GET  /api/auth/profile      # Get user profile
PUT  /api/auth/profile      # Update profile
POST /api/auth/logout       # Logout user
GET  /api/auth/users        # Get all users (Admin only)
PUT  /api/auth/users/:id/role # Update user role (Admin only)
```

### **Products**
```
GET    /api/products        # Get all products (with pagination & filters)
GET    /api/products/stats  # Get product statistics
GET    /api/products/:id    # Get single product
POST   /api/products        # Create new product
PUT    /api/products/:id    # Update product
DELETE /api/products/:id    # Delete product
PUT    /api/products/:id/quantity # Update product quantity
```

### **Orders**
```
GET    /api/orders          # Get all orders (with pagination & filters)
GET    /api/orders/stats    # Get order statistics
GET    /api/orders/:id      # Get single order
POST   /api/orders          # Create new order
PUT    /api/orders/:id      # Update order
PUT    /api/orders/:id/status # Update order status
DELETE /api/orders/:id      # Cancel order
```

### **Utility**
```
GET /api/health             # Health check endpoint
```

## 📊 **Database Schema**

### **User Model**
```javascript
{
  username: String (required, unique),
  password: String (required, hashed),
  role: String (enum: ['Admin', 'Staff']),
  createdAt: Date,
  lastLogin: Date,
  isActive: Boolean
}
```

### **Product Model**
```javascript
{
  name: String (required),
  sku: String (required, unique, uppercase),
  category: String (required),
  quantity: Number (required, min: 0),
  location: String (required),
  description: String,
  unitPrice: Number (min: 0),
  reorderLevel: Number (default: 10),
  lastUpdated: Date,
  createdBy: ObjectId (ref: User),
  isActive: Boolean
}
```

### **Order Model**
```javascript
{
  orderId: String (unique, auto-generated),
  type: String (enum: ['Inbound', 'Outbound']),
  partyName: String (required),
  partyContact: {
    email: String,
    phone: String,
    address: String
  },
  items: [{
    productId: ObjectId (ref: Product),
    productName: String,
    productSku: String,
    quantity: Number (min: 1),
    unitPrice: Number
  }],
  status: String (enum: ['Pending', 'Processing', 'Shipped', 'Received', 'Cancelled']),
  priority: String (enum: ['Low', 'Medium', 'High', 'Urgent']),
  notes: String,
  totalValue: Number,
  expectedDate: Date,
  completedDate: Date,
  createdBy: ObjectId (ref: User),
  lastModifiedBy: ObjectId (ref: User),
  statusHistory: Array
}
```

## 🔒 **Security Features**

- **JWT Authentication** with secure token handling
- **Password Hashing** using bcryptjs with salt rounds
- **Rate Limiting** to prevent abuse
- **Input Validation** and sanitization
- **CORS Protection** for cross-origin requests
- **Helmet.js** for security headers
- **Environment Variables** for sensitive configuration
- **Role-based Access Control** for different user permissions

## 🐛 **Troubleshooting**

### **Common Issues**

1. **MongoDB Connection Failed**
   ```
   Error: MongoNetworkError: failed to connect to server
   ```
   - Verify your MongoDB Atlas connection string
   - Check network access settings in MongoDB Atlas
   - Ensure your IP address is whitelisted

2. **JWT Secret Error**
   ```
   Error: secretOrPrivateKey is required
   ```
   - Make sure JWT_SECRET is set in your .env file
   - Ensure the secret is at least 32 characters long

3. **Port Already in Use**
   ```
   Error: listen EADDRINUSE :::5000
   ```
   - Change the PORT in your .env file
   - Or kill the process using the port: `npx kill-port 5000`

4. **Module Not Found**
   ```
   Error: Cannot find module 'express'
   ```
   - Run `npm install` to install dependencies
   - Ensure you're in the correct directory

### **Debug Mode**

Enable detailed logging:
```bash
# Set debug mode
export DEBUG=app:*

# Start the application
npm start
```

### **Health Check**

Test if the API is working:
```bash
# Check API health
curl http://localhost:5000/api/health

# Expected response:
{
  "success": true,
  "message": "SmartStock WMS API is running",
  "timestamp": "2024-10-11T...",
  "environment": "development"
}
```

## 🚀 **Deployment**

### **Environment Setup for Production**

1. **Update Environment Variables**:
```env
NODE_ENV=production
PORT=80
MONGODB_URI=your-production-mongodb-uri
JWT_SECRET=your-production-jwt-secret
FRONTEND_URL=https://your-domain.com
```

2. **Security Considerations**:
- Use environment-specific MongoDB clusters
- Implement proper SSL/TLS certificates
- Set up proper firewall rules
- Use specific IP whitelisting instead of 0.0.0.0/0
- Enable MongoDB Atlas backup
- Set up monitoring and alerting

### **Deployment Platforms**

**Heroku:**
```bash
# Install Heroku CLI and login
heroku create your-app-name
heroku config:set MONGODB_URI=your-connection-string
heroku config:set JWT_SECRET=your-jwt-secret
git push heroku main
```

**Railway:**
```bash
# Install Railway CLI and login
railway login
railway init
railway add
railway deploy
```

**DigitalOcean App Platform:**
- Upload your code to GitHub
- Connect GitHub repository to DigitalOcean
- Configure environment variables
- Deploy

## 🤝 **Contributing**

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 **License**

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👥 **Support**

If you encounter any issues or have questions:

1. Check the [Troubleshooting](#-troubleshooting) section
2. Search existing [Issues](https://github.com/your-repo/issues)
3. Create a new issue with detailed information
4. Include error messages, logs, and steps to reproduce

## 🔮 **Future Enhancements**

- [ ] **Advanced Analytics** - Charts and graphs for insights
- [ ] **Email Notifications** - Alerts for low stock and order updates
- [ ] **Barcode Scanning** - Mobile app integration
- [ ] **Reporting System** - Generate PDF reports
- [ ] **Multi-warehouse Support** - Manage multiple locations
- [ ] **API Documentation** - Interactive Swagger/OpenAPI docs
- [ ] **Backup & Restore** - Automated database backups
- [ ] **Audit Logging** - Detailed activity tracking
- [ ] **Integration APIs** - Connect with external systems
- [ ] **Mobile App** - Native iOS/Android applications

## 📊 **Project Structure**

```
smartstock-wms/
├── backend/
│   ├── models/
│   │   ├── User.js
│   │   ├── Product.js
│   │   └── Order.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── products.js
│   │   └── orders.js
│   ├── middleware/
│   │   ├── auth.js
│   │   └── authUtils.js
│   └── server.js
├── frontend/
│   ├── index.html
│   ├── styles.css
│   └── script.js
├── package.json
├── .env.example
└── README.md
```

## 🎯 **Key Benefits**

- **Efficient Inventory Tracking** - Real-time stock monitoring
- **Automated Workflows** - Reduce manual errors
- **User-Friendly Interface** - Intuitive design for all skill levels
- **Scalable Architecture** - Grows with your business
- **Security First** - Enterprise-level security measures
- **Cost-Effective** - Open-source solution
- **Mobile Responsive** - Access from any device
- **Quick Setup** - Get running in minutes

---

**Built with ❤️ by the SmartStock Team**

*Transforming warehouse management through modern technology*