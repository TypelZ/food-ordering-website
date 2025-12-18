/**
 * Authentication Property Tests
 * Tests for registration, login, and JWT functionality
 */

const request = require('supertest');
const fc = require('fast-check');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');
const app = require('../app');
const { User } = require('../models');
const { JWT_SECRET } = require('../middleware/auth');

// Helper to generate unique email using UUID
const uniqueEmail = () => `test_${uuidv4()}@test.com`;

describe('Authentication Tests', () => {
  /**
   * **Feature: food-ordering-website, Property 1: Registration creates Customer with hashed password**
   * **Validates: Requirements 1.1, 1.4, 13.5**
   */
  test('Property 1: Registration creates Customer with hashed password', async () => {
    // Test with multiple valid inputs
    const testCases = [
      { nickname: 'John', password: 'password123', address: '123 Main St' },
      { nickname: 'Jane Doe', password: 'securePass!', address: '' },
      { nickname: 'User123', password: 'test1234', address: 'Apt 5, Building A' },
      { nickname: 'A', password: '123456', address: null },
      { nickname: 'Test User With Long Name', password: 'mypassword', address: '456 Oak Ave' }
    ];

    for (const testCase of testCases) {
      const email = uniqueEmail();
      
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          nickname: testCase.nickname,
          email,
          password: testCase.password,
          delivery_address: testCase.address
        });

      // Should succeed
      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);

      // Verify user was created with CUSTOMER role
      const user = await User.findOne({ where: { email } });
      expect(user).not.toBeNull();
      expect(user.role).toBe('CUSTOMER');

      // Verify password is hashed (not equal to plain text)
      expect(user.password).not.toBe(testCase.password);

      // Verify bcrypt can validate the password
      const isValid = await bcrypt.compare(testCase.password, user.password);
      expect(isValid).toBe(true);
    }
  });

  /**
   * **Feature: food-ordering-website, Property 3: Registration validation rejects incomplete data**
   * **Validates: Requirements 1.3**
   */
  test('Property 3: Registration validation rejects incomplete data', async () => {
    // Test missing nickname
    let response = await request(app)
      .post('/api/auth/register')
      .send({
        email: uniqueEmail(),
        password: 'password123'
      });
    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.errors).toContain('Nickname is required');

    // Test missing email
    response = await request(app)
      .post('/api/auth/register')
      .send({
        nickname: 'TestUser',
        password: 'password123'
      });
    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.errors).toContain('Email is required');

    // Test missing password
    response = await request(app)
      .post('/api/auth/register')
      .send({
        nickname: 'TestUser',
        email: uniqueEmail()
      });
    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);

    // Test short password
    response = await request(app)
      .post('/api/auth/register')
      .send({
        nickname: 'TestUser',
        email: uniqueEmail(),
        password: '12345'
      });
    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
  });

  /**
   * **Feature: food-ordering-website, Property 4: JWT contains correct claims**
   * **Validates: Requirements 2.1**
   */
  test('Property 4: JWT contains correct claims', async () => {
    const testCases = [
      { nickname: 'Customer1', role: 'CUSTOMER' },
      { nickname: 'Staff1', role: 'STAFF' },
      { nickname: 'Admin1', role: 'ADMIN' }
    ];

    for (const testCase of testCases) {
      const email = uniqueEmail();
      const password = 'testpassword123';

      // Create user directly
      const user = await User.create({
        nickname: testCase.nickname,
        email,
        password,
        role: testCase.role
      });

      // Login
      const response = await request(app)
        .post('/api/auth/login')
        .send({ email, password });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.token).toBeDefined();

      // Decode and verify JWT claims
      const decoded = jwt.verify(response.body.data.token, JWT_SECRET);
      expect(decoded.id).toBe(user.id);
      expect(decoded.email).toBe(email);
      expect(decoded.role).toBe(testCase.role);
    }
  });

  /**
   * **Feature: food-ordering-website, Property 5: Invalid credentials rejected**
   * **Validates: Requirements 2.2**
   */
  test('Property 5: Invalid credentials rejected', async () => {
    const email = uniqueEmail();
    
    // Create a test user
    await User.create({
      nickname: 'TestUser',
      email,
      password: 'correctpassword',
      role: 'CUSTOMER'
    });

    // Test wrong password
    let response = await request(app)
      .post('/api/auth/login')
      .send({
        email,
        password: 'wrongpassword'
      });
    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe('Invalid credentials');

    // Test non-existent email
    response = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'nonexistent@test.com',
        password: 'anypassword'
      });
    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe('Invalid credentials');
  });

  /**
   * Test email uniqueness during registration
   * **Validates: Requirements 1.2**
   */
  test('Registration rejects duplicate email', async () => {
    const email = uniqueEmail();
    
    // Create first user
    await User.create({
      nickname: 'FirstUser',
      email,
      password: 'password123',
      role: 'CUSTOMER'
    });

    // Try to register with same email
    const response = await request(app)
      .post('/api/auth/register')
      .send({
        nickname: 'SecondUser',
        email,
        password: 'password456'
      });

    expect(response.status).toBe(409);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe('Email already exists');
  });
});
