/**
 * Jest Test Setup
 * Configure test environment and global setup/teardown
 */

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing-only';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-key-for-testing-only';
process.env.PORT = '3001';
process.env.LOG_LEVEL = 'error'; // Minimize logs during testing

// Increase timeout for database operations
jest.setTimeout(30000);

// Global test utilities
global.testUtils = {
    /**
     * Create a test user object
     */
    createTestUser: (overrides = {}) => ({
        username: 'testuser',
        password: 'Test123!',
        role: 'Staff',
        ...overrides
    }),

    /**
     * Create a test product object
     */
    createTestProduct: (overrides = {}) => ({
        name: 'Test Product',
        sku: 'TEST-001',
        category: 'Test Category',
        quantity: 100,
        location: 'A-1-1',
        description: 'Test product description',
        unitPrice: 10.99,
        reorderLevel: 10,
        ...overrides
    }),

    /**
     * Create a test order object
     */
    createTestOrder: (productId, overrides = {}) => ({
        type: 'Inbound',
        partyName: 'Test Supplier',
        partyContact: {
            email: 'supplier@test.com',
            phone: '1234567890',
            address: '123 Test St'
        },
        items: [{
            productId: productId,
            productName: 'Test Product',
            productSku: 'TEST-001',
            quantity: 50,
            unitPrice: 10.99
        }],
        priority: 'Medium',
        notes: 'Test order notes',
        ...overrides
    })
};

// Suppress console output during tests (optional)
if (process.env.SUPPRESS_LOGS === 'true') {
    global.console = {
        ...console,
        log: jest.fn(),
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
    };
}
