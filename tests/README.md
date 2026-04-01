# Test Suite for SmartStock WMS

This directory contains the test suite for the SmartStock Warehouse Management System.

## Structure

```
tests/
├── setup.js              # Test environment setup
├── api/                  # API endpoint tests
│   ├── auth.test.js     # Authentication tests
│   ├── products.test.js # Product management tests
│   └── orders.test.js   # Order management tests
├── models/              # Database model tests
│   ├── user.test.js    # User model tests
│   ├── product.test.js # Product model tests
│   └── order.test.js   # Order model tests
└── integration/         # Integration tests
    └── workflow.test.js # End-to-end workflow tests
```

## Running Tests

### Run all tests
```bash
npm test
```

### Run tests in watch mode
```bash
npm test -- --watch
```

### Run tests with coverage
```bash
npm test -- --coverage
```

### Run specific test file
```bash
npm test -- tests/api/auth.test.js
```

### Run tests matching pattern
```bash
npm test -- --testNamePattern="authentication"
```

## Writing Tests

### Test Structure
Each test file should follow this structure:

```javascript
describe('Feature Name', () => {
    beforeAll(async () => {
        // Setup before all tests
    });

    afterAll(async () => {
        // Cleanup after all tests
    });

    beforeEach(async () => {
        // Setup before each test
    });

    afterEach(async () => {
        // Cleanup after each test
    });

    describe('Specific Functionality', () => {
        it('should do something specific', async () => {
            // Test implementation
        });
    });
});
```

### Test Utilities
Use the global test utilities defined in `setup.js`:

```javascript
// Create test data
const user = global.testUtils.createTestUser();
const product = global.testUtils.createTestProduct();
const order = global.testUtils.createTestOrder(productId);
```

## Test Database

Tests use a separate test database to avoid affecting development/production data. The database is automatically created and cleaned up during tests.

## Coverage Reports

Coverage reports are generated in the `coverage/` directory after running tests with the `--coverage` flag. View the HTML report by opening `coverage/lcov-report/index.html` in a browser.

## Continuous Integration

Tests should be run automatically on every commit and pull request in your CI/CD pipeline.

Example GitHub Actions workflow:
```yaml
- name: Run tests
  run: npm test -- --coverage
```

## Best Practices

1. **Isolation**: Each test should be independent and not rely on other tests
2. **Cleanup**: Always clean up test data after tests complete
3. **Assertions**: Use descriptive assertion messages
4. **Coverage**: Aim for at least 80% code coverage
5. **Speed**: Keep tests fast by mocking external dependencies
6. **Documentation**: Document complex test scenarios

## Troubleshooting

### Database Connection Issues
Make sure MongoDB is running and the connection string in test setup is correct.

### Timeout Errors
Increase the timeout in `jest.config.js` if tests are timing out:
```javascript
testTimeout: 60000 // 60 seconds
```

### Port Already in Use
If the test server port is in use, change it in `tests/setup.js`:
```javascript
process.env.PORT = '3002';
```
