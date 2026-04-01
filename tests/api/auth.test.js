const request = require('supertest');
const mongoose = require('mongoose');
const { app } = require('../../backend/server');
const User = require('../../backend/models/User');
const { hashPassword } = require('../../backend/middleware/authUtils');

/**
 * Authentication API Tests
 */

describe('Authentication API', () => {
    let server;

    beforeAll(async () => {
        // Connect to test database
        const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/smartstock-test';
        await mongoose.connect(mongoUri);
        server = app;
    });

    afterAll(async () => {
        // Cleanup and close connections
        await mongoose.connection.dropDatabase();
        await mongoose.connection.close();
    });

    beforeEach(async () => {
        // Clear users collection before each test
        await User.deleteMany({});
    });

    describe('POST /api/auth/register', () => {
        it('should register a new user successfully', async () => {
            const userData = global.testUtils.createTestUser();

            const response = await request(server)
                .post('/api/auth/register')
                .send(userData)
                .expect(201);

            expect(response.body.success).toBe(true);
            expect(response.body.user).toHaveProperty('username', userData.username);
            expect(response.body.user).not.toHaveProperty('password');
            expect(response.body).toHaveProperty('token');
        });

        it('should not register user with duplicate username', async () => {
            const userData = global.testUtils.createTestUser();

            // Create first user
            await request(server)
                .post('/api/auth/register')
                .send(userData)
                .expect(201);

            // Try to create duplicate
            const response = await request(server)
                .post('/api/auth/register')
                .send(userData)
                .expect(400);

            expect(response.body.success).toBe(false);
        });

        it('should validate required fields', async () => {
            const response = await request(server)
                .post('/api/auth/register')
                .send({})
                .expect(400);

            expect(response.body.success).toBe(false);
        });
    });

    describe('POST /api/auth/login', () => {
        beforeEach(async () => {
            // Create a test user before each login test
            const hashedPassword = await hashPassword('Test123!');
            await User.create({
                username: 'testuser',
                password: hashedPassword,
                role: 'Staff'
            });
        });

        it('should login successfully with correct credentials', async () => {
            const response = await request(server)
                .post('/api/auth/login')
                .send({
                    username: 'testuser',
                    password: 'Test123!'
                })
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body).toHaveProperty('token');
            expect(response.body.user).toHaveProperty('username', 'testuser');
        });

        it('should reject login with incorrect password', async () => {
            const response = await request(server)
                .post('/api/auth/login')
                .send({
                    username: 'testuser',
                    password: 'WrongPassword123!'
                })
                .expect(401);

            expect(response.body.success).toBe(false);
        });

        it('should reject login with non-existent user', async () => {
            const response = await request(server)
                .post('/api/auth/login')
                .send({
                    username: 'nonexistent',
                    password: 'Test123!'
                })
                .expect(401);

            expect(response.body.success).toBe(false);
        });
    });

    describe('GET /api/auth/verify', () => {
        let token;

        beforeEach(async () => {
            // Register and get token
            const userData = global.testUtils.createTestUser();
            const response = await request(server)
                .post('/api/auth/register')
                .send(userData);
            
            token = response.body.token;
        });

        it('should verify valid token', async () => {
            const response = await request(server)
                .get('/api/auth/verify')
                .set('Authorization', `Bearer ${token}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.user).toHaveProperty('username');
        });

        it('should reject request without token', async () => {
            const response = await request(server)
                .get('/api/auth/verify')
                .expect(401);

            expect(response.body.success).toBe(false);
        });

        it('should reject invalid token', async () => {
            const response = await request(server)
                .get('/api/auth/verify')
                .set('Authorization', 'Bearer invalid-token')
                .expect(401);

            expect(response.body.success).toBe(false);
        });
    });
});
