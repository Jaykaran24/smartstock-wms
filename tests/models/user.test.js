const User = require('../../backend/models/User');
const { hashPassword, comparePassword } = require('../../backend/middleware/authUtils');

/**
 * User Model Tests
 */

describe('User Model', () => {
    describe('Schema Validation', () => {
        it('should create a valid user', () => {
            const userData = global.testUtils.createTestUser();
            const user = new User(userData);
            
            const error = user.validateSync();
            expect(error).toBeUndefined();
        });

        it('should require username', () => {
            const userData = global.testUtils.createTestUser({ username: undefined });
            const user = new User(userData);
            
            const error = user.validateSync();
            expect(error).toBeDefined();
            expect(error.errors.username).toBeDefined();
        });

        it('should require password', () => {
            const userData = global.testUtils.createTestUser({ password: undefined });
            const user = new User(userData);
            
            const error = user.validateSync();
            expect(error).toBeDefined();
            expect(error.errors.password).toBeDefined();
        });

        it('should default role to Staff', () => {
            const userData = global.testUtils.createTestUser({ role: undefined });
            const user = new User(userData);
            
            expect(user.role).toBe('Staff');
        });

        it('should only allow Admin or Staff roles', () => {
            const userData = global.testUtils.createTestUser({ role: 'InvalidRole' });
            const user = new User(userData);
            
            const error = user.validateSync();
            expect(error).toBeDefined();
            expect(error.errors.role).toBeDefined();
        });
    });

    describe('Password Hashing', () => {
        it('should hash password correctly', async () => {
            const password = 'Test123!';
            const hashed = await hashPassword(password);
            
            expect(hashed).toBeDefined();
            expect(hashed).not.toBe(password);
            expect(hashed.length).toBeGreaterThan(20);
        });

        it('should compare passwords correctly', async () => {
            const password = 'Test123!';
            const hashed = await hashPassword(password);
            
            const isMatch = await comparePassword(password, hashed);
            expect(isMatch).toBe(true);
        });

        it('should reject incorrect password', async () => {
            const password = 'Test123!';
            const hashed = await hashPassword(password);
            
            const isMatch = await comparePassword('WrongPassword', hashed);
            expect(isMatch).toBe(false);
        });
    });
});
