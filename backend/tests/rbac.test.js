/**
 * Role-Based Access Control Property Tests
 * Tests for authentication and authorization
 */

const request = require('supertest');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const app = require('../app');
const { User, MenuItem } = require('../models');
const { generateToken, JWT_SECRET } = require('../middleware/auth');

// Helper to create user and get token
const createUserWithToken = async (role = 'CUSTOMER') => {
  const user = await User.create({
    nickname: role,
    email: `${role.toLowerCase()}_${uuidv4()}@test.com`,
    password: 'password123',
    role
  });
  return { user, token: generateToken(user) };
};

describe('RBAC Tests', () => {
  /**
   * **Feature: food-ordering-website, Property 6: Invalid JWT rejected**
   * **Validates: Requirements 2.4, 12.1, 12.4**
   */
  test('Property 6: Invalid JWT rejected', async () => {
    // Test with no token
    let response = await request(app).get('/api/cart');
    expect(response.status).toBe(401);
    expect(response.body.message).toBe('Access denied. No token provided.');

    // Test with malformed token
    response = await request(app)
      .get('/api/cart')
      .set('Authorization', 'Bearer invalid.token.here');
    expect(response.status).toBe(401);
    expect(response.body.message).toBe('Invalid token.');

    // Test with expired token
    const expiredToken = jwt.sign(
      { id: 1, email: 'test@test.com', role: 'CUSTOMER' },
      JWT_SECRET,
      { expiresIn: '-1h' }
    );
    response = await request(app)
      .get('/api/cart')
      .set('Authorization', `Bearer ${expiredToken}`);
    expect(response.status).toBe(401);

    // Test with wrong secret
    const wrongSecretToken = jwt.sign(
      { id: 1, email: 'test@test.com', role: 'CUSTOMER' },
      'wrong-secret',
      { expiresIn: '1h' }
    );
    response = await request(app)
      .get('/api/cart')
      .set('Authorization', `Bearer ${wrongSecretToken}`);
    expect(response.status).toBe(401);
  });

  /**
   * **Feature: food-ordering-website, Property 16: Role-based access control enforcement**
   * **Validates: Requirements 8.5, 9.4, 11.7, 12.2, 12.3**
   */
  test('Property 16: Role-based access control enforcement', async () => {
    const customer = await createUserWithToken('CUSTOMER');
    const staff = await createUserWithToken('STAFF');
    const admin = await createUserWithToken('ADMIN');

    // Create a menu item for testing
    const menuItem = await MenuItem.create({
      name: 'Test Item',
      price: 10.00
    });

    // === CUSTOMER PERMISSIONS ===
    // Customer CAN access cart
    let response = await request(app)
      .get('/api/cart')
      .set('Authorization', `Bearer ${customer.token}`);
    expect(response.status).toBe(200);

    // Customer CAN view menu
    response = await request(app).get('/api/menu');
    expect(response.status).toBe(200);

    // Customer CANNOT manage menu
    response = await request(app)
      .post('/api/menu')
      .set('Authorization', `Bearer ${customer.token}`)
      .field('name', 'Hacked Item')
      .field('price', '1.00');
    expect(response.status).toBe(403);

    // Customer CANNOT update order status
    response = await request(app)
      .put('/api/orders/1/status')
      .set('Authorization', `Bearer ${customer.token}`)
      .send({ status: 'Completed' });
    expect(response.status).toBe(403);

    // Customer CANNOT access user management
    response = await request(app)
      .get('/api/users')
      .set('Authorization', `Bearer ${customer.token}`);
    expect(response.status).toBe(403);

    // === STAFF PERMISSIONS ===
    // Staff CAN manage menu
    response = await request(app)
      .post('/api/menu')
      .set('Authorization', `Bearer ${staff.token}`)
      .field('name', 'Staff Item')
      .field('price', '15.00');
    expect(response.status).toBe(201);

    // Staff CAN view all orders
    response = await request(app)
      .get('/api/orders')
      .set('Authorization', `Bearer ${staff.token}`);
    expect(response.status).toBe(200);

    // Staff CANNOT access cart (customer only)
    response = await request(app)
      .get('/api/cart')
      .set('Authorization', `Bearer ${staff.token}`);
    expect(response.status).toBe(403);

    // Staff CANNOT access user management
    response = await request(app)
      .get('/api/users')
      .set('Authorization', `Bearer ${staff.token}`);
    expect(response.status).toBe(403);

    // === ADMIN PERMISSIONS ===
    // Admin CAN access user management
    response = await request(app)
      .get('/api/users')
      .set('Authorization', `Bearer ${admin.token}`);
    expect(response.status).toBe(200);

    // Admin CAN create staff
    response = await request(app)
      .post('/api/users/staff')
      .set('Authorization', `Bearer ${admin.token}`)
      .send({
        nickname: 'New Staff',
        email: `newstaff_${uuidv4()}@test.com`,
        password: 'password123'
      });
    expect(response.status).toBe(201);
  });

  test('Protected routes require authentication', async () => {
    const protectedRoutes = [
      { method: 'get', path: '/api/cart' },
      { method: 'post', path: '/api/cart/add' },
      { method: 'get', path: '/api/orders' },
      { method: 'post', path: '/api/orders' },
      { method: 'get', path: '/api/settings/profile' },
      { method: 'put', path: '/api/settings/profile' },
      { method: 'put', path: '/api/settings/password' },
      { method: 'get', path: '/api/users' },
      { method: 'post', path: '/api/users/staff' }
    ];

    for (const route of protectedRoutes) {
      const response = await request(app)[route.method](route.path);
      expect(response.status).toBe(401);
    }
  });

  test('Public routes accessible without authentication', async () => {
    // Menu is public
    let response = await request(app).get('/api/menu');
    expect(response.status).toBe(200);

    // Auth routes are public
    response = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test@test.com', password: 'test' });
    // Should be 401 (invalid credentials), not 401 (no token)
    expect(response.body.message).toBe('Invalid credentials');
  });

  test('Token with deleted user rejected', async () => {
    const { user, token } = await createUserWithToken('CUSTOMER');
    
    // Delete user
    await user.destroy();

    // Try to use token
    const response = await request(app)
      .get('/api/cart')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(401);
    expect(response.body.message).toBe('Invalid token. User not found.');
  });
});
