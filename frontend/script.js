/**
 * SmartStock WMS - Frontend JavaScript Application
 * Single Page Application with complete warehouse management functionality
 */

class SmartStockApp {
    constructor() {
        this.currentUser = null;
        this.currentSection = 'dashboard';
        this.apiBaseUrl = '/api';
        this.token = localStorage.getItem('token');
        this.products = [];
        this.orders = [];
        this.currentPage = 1;
        this.itemsPerPage = 20;
        this.searchQuery = '';
        this.filters = {};
        
        // Initialize the application
        this.init();
    }

    /**
     * Initialize the application
     */
    async init() {
        this.showLoading();
        
        // Set up event listeners
        this.setupEventListeners();
        
        // Check authentication status
        if (this.token) {
            try {
                await this.verifyAuth();
                this.showMainApp();
                await this.loadDashboard();
            } catch (error) {
                console.error('Authentication verification failed:', error);
                this.showLogin();
            }
        } else {
            this.showLogin();
        }
        
        this.hideLoading();
    }

    /**
     * Set up all event listeners
     */
    setupEventListeners() {
        // Login form
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', this.handleLogin.bind(this));
        }

        // Navigation menu
        document.addEventListener('click', (e) => {
            if (e.target.matches('.nav-link')) {
                e.preventDefault();
                const section = e.target.getAttribute('data-section');
                this.navigateToSection(section);
            }
        });

        // Mobile menu toggle
        const mobileMenuToggle = document.getElementById('mobileMenuToggle');
        if (mobileMenuToggle) {
            mobileMenuToggle.addEventListener('click', this.toggleMobileMenu.bind(this));
        }

        // User menu toggle
        const userMenuTrigger = document.getElementById('userMenuTrigger');
        if (userMenuTrigger) {
            userMenuTrigger.addEventListener('click', this.toggleUserMenu.bind(this));
        }

        // Logout button
        document.addEventListener('click', (e) => {
            if (e.target.matches('.logout-btn')) {
                e.preventDefault();
                this.handleLogout();
            }
        });

        // Search functionality
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.addEventListener('input', this.debounce(this.handleSearch.bind(this), 300));
        }

        // Filter changes
        document.addEventListener('change', (e) => {
            if (e.target.matches('.filter-select')) {
                this.handleFilterChange(e);
            }
        });

        // Modal functionality
        document.addEventListener('click', (e) => {
            if (e.target.matches('.modal-overlay') || e.target.matches('.modal-close')) {
                this.closeModal();
            }
            if (e.target.matches('.btn-add-product')) {
                this.showProductModal();
            }
            if (e.target.matches('.btn-add-order')) {
                this.showOrderModal();
            }
        });

        // Form submissions
        document.addEventListener('submit', (e) => {
            if (e.target.matches('#productForm')) {
                e.preventDefault();
                this.handleProductSubmit(e);
            }
            if (e.target.matches('#orderForm')) {
                e.preventDefault();
                this.handleOrderSubmit(e);
            }
            if (e.target.matches('#profileForm')) {
                e.preventDefault();
                this.handleProfileSubmit(e);
            }
        });

        // Action buttons
        document.addEventListener('click', (e) => {
            if (e.target.matches('.action-btn.edit')) {
                const id = e.target.getAttribute('data-id');
                const type = e.target.getAttribute('data-type');
                this.handleEdit(type, id);
            }
            if (e.target.matches('.action-btn.delete')) {
                const id = e.target.getAttribute('data-id');
                const type = e.target.getAttribute('data-type');
                this.handleDelete(type, id);
            }
            if (e.target.matches('.action-btn.view')) {
                const id = e.target.getAttribute('data-id');
                const type = e.target.getAttribute('data-type');
                this.handleView(type, id);
            }
        });

        // Pagination
        document.addEventListener('click', (e) => {
            if (e.target.matches('.pagination-btn')) {
                const page = parseInt(e.target.getAttribute('data-page'));
                this.goToPage(page);
            }
        });

        // Close dropdowns when clicking outside
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.user-menu')) {
                this.closeUserMenu();
            }
        });

        // Password toggle
        document.addEventListener('click', (e) => {
            if (e.target.matches('.toggle-password')) {
                this.togglePasswordVisibility(e.target);
            }
        });

        // Toast close
        document.addEventListener('click', (e) => {
            if (e.target.matches('.toast-close')) {
                this.closeToast(e.target.closest('.toast'));
            }
        });
    }

    /**
     * Authentication Methods
     */
    async handleLogin(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const credentials = {
            username: formData.get('username'),
            password: formData.get('password')
        };

        try {
            this.showButtonLoading(e.target.querySelector('.btn-primary'));
            
            const response = await this.makeRequest('/auth/login', {
                method: 'POST',
                body: JSON.stringify(credentials)
            });

            if (response.success) {
                this.token = response.data.token;
                this.currentUser = response.data.user;
                localStorage.setItem('token', this.token);
                
                this.showToast('success', 'Login Successful', `Welcome back, ${this.currentUser.username}!`);
                this.showMainApp();
                await this.loadDashboard();
            } else {
                throw new Error(response.message || 'Login failed');
            }
        } catch (error) {
            this.showToast('error', 'Login Failed', error.message);
        } finally {
            this.hideButtonLoading(e.target.querySelector('.btn-primary'));
        }
    }

    async verifyAuth() {
        const response = await this.makeRequest('/auth/profile');
        if (response.success) {
            this.currentUser = response.data.user;
            return true;
        }
        throw new Error('Authentication failed');
    }

    handleLogout() {
        localStorage.removeItem('token');
        this.token = null;
        this.currentUser = null;
        this.showToast('info', 'Logged Out', 'You have been successfully logged out.');
        this.showLogin();
    }

    /**
     * Navigation Methods
     */
    navigateToSection(section) {
        // Update active navigation
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
        });
        document.querySelector(`[data-section="${section}"]`)?.closest('.nav-item')?.classList.add('active');

        // Hide all sections
        document.querySelectorAll('.content-section').forEach(section => {
            section.classList.remove('active');
        });

        // Show target section
        const targetSection = document.getElementById(`${section}Section`);
        if (targetSection) {
            targetSection.classList.add('active');
            this.currentSection = section;
            
            // Update page title
            this.updatePageTitle(section);
            
            // Load section data
            this.loadSectionData(section);
        }

        // Close mobile menu if open
        this.closeMobileMenu();
    }

    updatePageTitle(section) {
        const titles = {
            dashboard: 'Dashboard',
            inventory: 'Inventory Management',
            orders: 'Order Management',
            profile: 'User Profile'
        };
        
        const titleElement = document.getElementById('pageTitle');
        if (titleElement) {
            titleElement.textContent = titles[section] || 'SmartStock WMS';
        }
    }

    async loadSectionData(section) {
        switch (section) {
            case 'dashboard':
                await this.loadDashboard();
                break;
            case 'inventory':
                await this.loadInventory();
                break;
            case 'orders':
                await this.loadOrders();
                break;
            case 'profile':
                this.loadProfile();
                break;
        }
    }

    /**
     * Dashboard Methods
     */
    async loadDashboard() {
        try {
            // Load dashboard statistics
            const [productStats, orderStats] = await Promise.all([
                this.makeRequest('/products/stats'),
                this.makeRequest('/orders/stats')
            ]);

            this.updateDashboardStats(productStats.data, orderStats.data);
            this.updateRecentActivity(orderStats.data.recentOrders);
        } catch (error) {
            console.error('Failed to load dashboard:', error);
            this.showToast('error', 'Dashboard Error', 'Failed to load dashboard data');
        }
    }

    updateDashboardStats(productStats, orderStats) {
        // Update product stats
        this.updateStatCard('totalProducts', productStats.totalProducts, 'Total Products');
        this.updateStatCard('totalQuantity', productStats.totalQuantity, 'Total Items');
        this.updateStatCard('lowStockItems', productStats.lowStockCount, 'Low Stock Items', productStats.lowStockCount > 0);
        this.updateStatCard('pendingOrders', orderStats.pendingOrders, 'Pending Orders');
    }

    updateStatCard(id, value, label, isWarning = false) {
        const card = document.getElementById(id);
        if (card) {
            const numberElement = card.querySelector('.stat-number');
            const labelElement = card.querySelector('h4');
            
            if (numberElement) numberElement.textContent = this.formatNumber(value);
            if (labelElement) labelElement.textContent = label;
            
            if (isWarning) {
                card.classList.add('warning');
            } else {
                card.classList.remove('warning');
            }
        }
    }

    updateRecentActivity(recentOrders) {
        const container = document.getElementById('recentActivity');
        if (!container) return;

        if (!recentOrders || recentOrders.length === 0) {
            container.innerHTML = '<div class="loading-placeholder">No recent activity</div>';
            return;
        }

        const html = recentOrders.map(order => `
            <div class="recent-item">
                <div class="recent-item-content">
                    <div class="recent-item-title">Order ${order.orderId}</div>
                    <div class="recent-item-details">
                        ${order.type} • ${order.partyName} • 
                        <span class="status-badge ${order.status.toLowerCase()}">${order.status}</span>
                    </div>
                    <div class="recent-item-time">${this.formatDate(order.createdAt)}</div>
                </div>
            </div>
        `).join('');

        container.innerHTML = html;
    }

    /**
     * Inventory Management Methods
     */
    async loadInventory() {
        try {
            const queryParams = new URLSearchParams({
                page: this.currentPage,
                limit: this.itemsPerPage,
                search: this.searchQuery,
                ...this.filters
            });

            const response = await this.makeRequest(`/products?${queryParams}`);
            
            if (response.success) {
                this.products = response.data.products;
                this.renderProductTable(this.products);
                this.renderPagination(response.data.pagination);
            }
        } catch (error) {
            console.error('Failed to load inventory:', error);
            this.showToast('error', 'Inventory Error', 'Failed to load inventory data');
        }
    }

    renderProductTable(products) {
        const tbody = document.getElementById('productTableBody');
        if (!tbody) return;

        if (!products || products.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" class="loading-cell">No products found</td></tr>';
            return;
        }

        const html = products.map(product => `
            <tr>
                <td>${this.escapeHtml(product.name)}</td>
                <td><code>${product.sku}</code></td>
                <td>${this.escapeHtml(product.category)}</td>
                <td>${product.quantity}</td>
                <td>${this.escapeHtml(product.location)}</td>
                <td>
                    <span class="status-badge ${this.getStockStatus(product).toLowerCase().replace(' ', '-')}">
                        ${this.getStockStatus(product)}
                    </span>
                </td>
                <td>
                    <div class="action-buttons">
                        <button class="action-btn edit" data-type="product" data-id="${product._id}" title="Edit">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="action-btn delete" data-type="product" data-id="${product._id}" title="Delete">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');

        tbody.innerHTML = html;
    }

    getStockStatus(product) {
        if (product.quantity === 0) return 'Out of Stock';
        if (product.quantity <= product.reorderLevel) return 'Low Stock';
        return 'In Stock';
    }

    showProductModal(product = null) {
        const modal = document.getElementById('productModal');
        const form = document.getElementById('productForm');
        const title = document.getElementById('productModalTitle');
        
        if (!modal || !form) return;

        // Reset form
        form.reset();
        
        if (product) {
            // Edit mode
            title.textContent = 'Edit Product';
            form.elements.name.value = product.name;
            form.elements.sku.value = product.sku;
            form.elements.category.value = product.category;
            form.elements.quantity.value = product.quantity;
            form.elements.location.value = product.location;
            form.elements.description.value = product.description || '';
            form.elements.unitPrice.value = product.unitPrice || '';
            form.elements.reorderLevel.value = product.reorderLevel;
            form.setAttribute('data-product-id', product._id);
        } else {
            // Add mode
            title.textContent = 'Add New Product';
            form.removeAttribute('data-product-id');
        }

        this.showModal(modal);
    }

    async handleProductSubmit(e) {
        const form = e.target;
        const productId = form.getAttribute('data-product-id');
        const formData = new FormData(form);
        
        const productData = {
            name: formData.get('name'),
            sku: formData.get('sku'),
            category: formData.get('category'),
            quantity: parseInt(formData.get('quantity')) || 0,
            location: formData.get('location'),
            description: formData.get('description'),
            unitPrice: parseFloat(formData.get('unitPrice')) || 0,
            reorderLevel: parseInt(formData.get('reorderLevel')) || 10
        };

        try {
            this.showButtonLoading(form.querySelector('.btn-primary'));
            
            const method = productId ? 'PUT' : 'POST';
            const url = productId ? `/products/${productId}` : '/products';
            
            const response = await this.makeRequest(url, {
                method,
                body: JSON.stringify(productData)
            });

            if (response.success) {
                this.showToast('success', 'Success', response.message);
                this.closeModal();
                await this.loadInventory();
            } else {
                throw new Error(response.message || 'Failed to save product');
            }
        } catch (error) {
            this.showToast('error', 'Error', error.message);
        } finally {
            this.hideButtonLoading(form.querySelector('.btn-primary'));
        }
    }

    /**
     * Order Management Methods
     */
    async loadOrders() {
        try {
            const queryParams = new URLSearchParams({
                page: this.currentPage,
                limit: this.itemsPerPage,
                search: this.searchQuery,
                ...this.filters
            });

            const response = await this.makeRequest(`/orders?${queryParams}`);
            
            if (response.success) {
                this.orders = response.data.orders;
                this.renderOrderTable(this.orders);
                this.renderPagination(response.data.pagination);
            }
        } catch (error) {
            console.error('Failed to load orders:', error);
            this.showToast('error', 'Orders Error', 'Failed to load orders data');
        }
    }

    renderOrderTable(orders) {
        const tbody = document.getElementById('orderTableBody');
        if (!tbody) return;

        if (!orders || orders.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="loading-cell">No orders found</td></tr>';
            return;
        }

        const html = orders.map(order => `
            <tr>
                <td><code>${order.orderId}</code></td>
                <td>${this.escapeHtml(order.partyName)}</td>
                <td>
                    <span class="status-badge ${order.type.toLowerCase()}">${order.type}</span>
                </td>
                <td>
                    <span class="status-badge ${order.status.toLowerCase()}">${order.status}</span>
                </td>
                <td>${this.formatDate(order.createdAt)}</td>
                <td>
                    <div class="action-buttons">
                        <button class="action-btn view" data-type="order" data-id="${order._id}" title="View Details">
                            <i class="fas fa-eye"></i>
                        </button>
                        ${order.status === 'Pending' || order.status === 'Processing' ? `
                            <button class="action-btn edit" data-type="order" data-id="${order._id}" title="Edit">
                                <i class="fas fa-edit"></i>
                            </button>
                        ` : ''}
                    </div>
                </td>
            </tr>
        `).join('');

        tbody.innerHTML = html;
    }

    showOrderModal(order = null) {
        const modal = document.getElementById('orderModal');
        const form = document.getElementById('orderForm');
        const title = document.getElementById('orderModalTitle');
        
        if (!modal || !form) return;

        // Reset form
        form.reset();
        
        if (order) {
            // Edit mode
            title.textContent = 'Edit Order';
            // Populate form with order data
            this.populateOrderForm(form, order);
        } else {
            // Add mode
            title.textContent = 'Create New Order';
            form.removeAttribute('data-order-id');
        }

        this.showModal(modal);
    }

    /**
     * Utility Methods
     */
    async makeRequest(endpoint, options = {}) {
        const url = `${this.apiBaseUrl}${endpoint}`;
        const defaultOptions = {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                ...(this.token && { 'Authorization': `Bearer ${this.token}` })
            }
        };

        const response = await fetch(url, { ...defaultOptions, ...options });
        
        if (response.status === 401) {
            this.handleLogout();
            throw new Error('Authentication required');
        }

        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.message || 'Request failed');
        }

        return data;
    }

    showLoading() {
        const loadingScreen = document.getElementById('loadingScreen');
        if (loadingScreen) {
            loadingScreen.classList.remove('hidden');
        }
    }

    hideLoading() {
        const loadingScreen = document.getElementById('loadingScreen');
        if (loadingScreen) {
            loadingScreen.classList.add('hidden');
        }
    }

    showLogin() {
        document.getElementById('loginScreen')?.classList.remove('hidden');
        document.getElementById('mainApp')?.classList.add('hidden');
    }

    showMainApp() {
        document.getElementById('loginScreen')?.classList.add('hidden');
        document.getElementById('mainApp')?.classList.remove('hidden');
        
        // Update user info in sidebar
        this.updateUserInfo();
    }

    updateUserInfo() {
        if (!this.currentUser) return;

        const usernameElements = document.querySelectorAll('.username');
        const roleElements = document.querySelectorAll('.user-role');

        usernameElements.forEach(el => el.textContent = this.currentUser.username);
        roleElements.forEach(el => el.textContent = this.currentUser.role);
    }

    showToast(type, title, message) {
        const container = document.getElementById('toastContainer');
        if (!container) return;

        const toastId = Date.now();
        const iconMap = {
            success: 'fas fa-check-circle',
            error: 'fas fa-exclamation-circle',
            warning: 'fas fa-exclamation-triangle',
            info: 'fas fa-info-circle'
        };

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.setAttribute('data-toast-id', toastId);
        toast.innerHTML = `
            <div class="toast-icon">
                <i class="${iconMap[type]}"></i>
            </div>
            <div class="toast-content">
                <div class="toast-title">${this.escapeHtml(title)}</div>
                <div class="toast-message">${this.escapeHtml(message)}</div>
            </div>
            <button class="toast-close">
                <i class="fas fa-times"></i>
            </button>
        `;

        container.appendChild(toast);

        // Trigger animation
        setTimeout(() => toast.classList.add('show'), 100);

        // Auto-hide after 5 seconds
        setTimeout(() => this.closeToast(toast), 5000);
    }

    closeToast(toast) {
        if (toast) {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }
    }

    showModal(modal) {
        if (modal) {
            modal.classList.add('active');
        }
    }

    closeModal() {
        document.querySelectorAll('.modal-overlay').forEach(modal => {
            modal.classList.remove('active');
        });
    }

    toggleMobileMenu() {
        const sidebar = document.querySelector('.sidebar');
        if (sidebar) {
            sidebar.classList.toggle('mobile-open');
        }
    }

    closeMobileMenu() {
        const sidebar = document.querySelector('.sidebar');
        if (sidebar) {
            sidebar.classList.remove('mobile-open');
        }
    }

    toggleUserMenu() {
        const userMenu = document.querySelector('.user-menu');
        if (userMenu) {
            userMenu.classList.toggle('active');
        }
    }

    closeUserMenu() {
        const userMenu = document.querySelector('.user-menu');
        if (userMenu) {
            userMenu.classList.remove('active');
        }
    }

    togglePasswordVisibility(button) {
        const input = button.closest('.password-input').querySelector('input');
        const icon = button.querySelector('i');
        
        if (input.type === 'password') {
            input.type = 'text';
            icon.className = 'fas fa-eye-slash';
        } else {
            input.type = 'password';
            icon.className = 'fas fa-eye';
        }
    }

    showButtonLoading(button) {
        if (button) {
            button.disabled = true;
            button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Loading...';
        }
    }

    hideButtonLoading(button, originalText = 'Submit') {
        if (button) {
            button.disabled = false;
            button.innerHTML = originalText;
        }
    }

    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    handleSearch(e) {
        this.searchQuery = e.target.value;
        this.currentPage = 1;
        this.loadSectionData(this.currentSection);
    }

    handleFilterChange(e) {
        this.filters[e.target.name] = e.target.value;
        this.currentPage = 1;
        this.loadSectionData(this.currentSection);
    }

    goToPage(page) {
        this.currentPage = page;
        this.loadSectionData(this.currentSection);
    }

    renderPagination(pagination) {
        const container = document.getElementById('paginationContainer');
        if (!container || !pagination) return;

        const { currentPage, totalPages, totalCount, hasNextPage, hasPrevPage } = pagination;

        const paginationHtml = `
            <div class="pagination-info">
                Showing ${((currentPage - 1) * this.itemsPerPage) + 1} to ${Math.min(currentPage * this.itemsPerPage, totalCount)} of ${totalCount} entries
            </div>
            <div class="pagination-controls">
                <button class="pagination-btn" data-page="${currentPage - 1}" ${!hasPrevPage ? 'disabled' : ''}>
                    <i class="fas fa-chevron-left"></i>
                </button>
                
                ${this.generatePageNumbers(currentPage, totalPages)}
                
                <button class="pagination-btn" data-page="${currentPage + 1}" ${!hasNextPage ? 'disabled' : ''}>
                    <i class="fas fa-chevron-right"></i>
                </button>
            </div>
        `;

        container.innerHTML = paginationHtml;
    }

    generatePageNumbers(currentPage, totalPages) {
        let pages = [];
        const maxVisible = 5;
        let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
        let end = Math.min(totalPages, start + maxVisible - 1);

        if (end - start + 1 < maxVisible) {
            start = Math.max(1, end - maxVisible + 1);
        }

        for (let i = start; i <= end; i++) {
            pages.push(`
                <button class="pagination-btn ${i === currentPage ? 'active' : ''}" data-page="${i}">
                    ${i}
                </button>
            `);
        }

        return pages.join('');
    }

    async handleEdit(type, id) {
        if (type === 'product') {
            const product = this.products.find(p => p._id === id);
            if (product) {
                this.showProductModal(product);
            }
        } else if (type === 'order') {
            try {
                const response = await this.makeRequest(`/orders/${id}`);
                if (response.success) {
                    this.showOrderModal(response.data.order);
                }
            } catch (error) {
                this.showToast('error', 'Error', 'Failed to load order details');
            }
        }
    }

    async handleDelete(type, id) {
        if (!confirm('Are you sure you want to delete this item?')) {
            return;
        }

        try {
            const endpoint = type === 'product' ? `/products/${id}` : `/orders/${id}`;
            const response = await this.makeRequest(endpoint, {
                method: 'DELETE'
            });

            if (response.success) {
                this.showToast('success', 'Deleted', response.message);
                this.loadSectionData(this.currentSection);
            }
        } catch (error) {
            this.showToast('error', 'Error', error.message);
        }
    }

    async handleView(type, id) {
        if (type === 'order') {
            try {
                const response = await this.makeRequest(`/orders/${id}`);
                if (response.success) {
                    this.showOrderDetails(response.data.order);
                }
            } catch (error) {
                this.showToast('error', 'Error', 'Failed to load order details');
            }
        }
    }

    showOrderDetails(order) {
        // Implementation for showing order details in a modal
        // This would create a detailed view of the order
        console.log('Show order details:', order);
    }

    loadProfile() {
        const form = document.getElementById('profileForm');
        if (form && this.currentUser) {
            // Fill form fields
            if (form.elements.username) {
                form.elements.username.value = this.currentUser.username;
            }
            if (form.elements.role) {
                form.elements.role.value = this.currentUser.role;
            }
        }
        
        // Update profile display elements
        const profileUsername = document.getElementById('profileUsername');
        const profileRole = document.getElementById('profileRole');
        if (profileUsername) profileUsername.textContent = this.currentUser?.username || 'Username';
        if (profileRole) profileRole.textContent = this.currentUser?.role || 'Role';
    }

    async handleProfileSubmit(e) {
        const form = e.target;
        const formData = new FormData(form);
        
        const profileData = {
            username: formData.get('username'),
            currentPassword: formData.get('currentPassword'),
            newPassword: formData.get('newPassword')
        };

        // Remove empty fields
        Object.keys(profileData).forEach(key => {
            if (!profileData[key]) {
                delete profileData[key];
            }
        });

        try {
            this.showButtonLoading(form.querySelector('.btn-primary'));
            
            const response = await this.makeRequest('/auth/profile', {
                method: 'PUT',
                body: JSON.stringify(profileData)
            });

            if (response.success) {
                this.currentUser = response.data.user;
                this.updateUserInfo();
                this.showToast('success', 'Profile Updated', response.message);
                form.reset();
                this.loadProfile();
            }
        } catch (error) {
            this.showToast('error', 'Error', error.message);
        } finally {
            this.hideButtonLoading(form.querySelector('.btn-primary'));
        }
    }

    // Helper methods
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    formatNumber(num) {
        return new Intl.NumberFormat().format(num);
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    formatCurrency(amount) {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(amount);
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new SmartStockApp();
});