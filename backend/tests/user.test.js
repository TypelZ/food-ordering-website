/**
 * User Management Property Tests
 * Tests for admin user management functionality
 */

const request = require('supertest');
const { v4: uuidv4 } = require('uuid');
const app = require('../app');
const { User } = require('../models');
const { generateToken } = require('../middleware/auth');

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

describe('User Management Tests', () => {
  /**
   * **Feature: food-ordering-website, Property 17: Staff account creation by Admin**
   * **Validates: Requirements 11.1, 11.3**
   */
  test('Property 17: Staff account creation by Admin', async () => {
    const admin = await createUserWithToken('ADMIN');

    const staffEmail = `newstaff_${uuidv4()}@test.com`;
    const response = await request(app)
      .post('/api/users/staff')
      .set('Authorization', `Bearer ${admin.token}`)
      .send({
        nickname: 'New Staff',
        email: staffEmail,
        password: 'staffpass123'
      });

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data.user.role).toBe('STAFF');
    expect(response.body.data.user.email).toBe(staffEmail);

    // Verify staff can login
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({ email: staffEmail, password: 'staffpass123' });

    expect(loginResponse.status).toBe(200);
    expect(loginResponse.body.data.user.role).toBe('STAFF');
  });

  /**
   * **Feature: food-ordering-website, Property 18: User deletion removes account**
   * **Validates: Requirements 11.4**
   */
  test('Property 18: User deletion removes account', async () => {
    const admin = await createUserWithToken('ADMIN');
    const customer = await createUserWithToken('CUSTOMER');

    // Delete customer
    let response = await request(app)
      .delete(`/api/users/${customer.user.id}`)
      .set('Authorization', `Bearer ${admin.token}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);

    // Verify user cannot login
    response = await request(app)
      .post('/api/auth/login')
      .send({ email: customer.user.email, password: 'password123' });

    expect(response.status).toBe(401);

    // Verify user not in database
    const deletedUser = await User.findByPk(customer.user.id);
    expect(deletedUser).toBeNull();
  });

  test('Admin can view all users', async () => {
    const admin = await createUserWithToken('ADMIN');
    await createUserWithToken('CUSTOMER');
    await createUserWithToken('STAFF');

    const response = await request(app)
      .get('/api/users')
      .set('Authorization', `Bearer ${admin.token}`);

    expect(response.status).toBe(200);
    expect(response.body.data.users.length).toBeGreaterThanOrEqual(3);
  });

  test('Admin can update staff nickname', async () => {
    const admin = await createUserWithToken('ADMIN');
    
    // Create staff
    const staffEmail = `staff_${uuidv4()}@test.com`;
    let response = await request(app)
      .post('/api/users/staff')
      .set('Authorization', `Bearer ${admin.token}`)
      .send({
        nickname: 'Original Name',
        email: staffEmail,
        password: 'staffpass123'
      });

    const staffId = response.body.data.user.id;

    // Update nickname
    response = await request(app)
      .put(`/api/users/staff/${staffId}`)
      .set('Authorization', `Bearer ${admin.token}`)
      .send({ nickname: 'Updated Name' });

    expect(response.status).toBe(200);
    expect(response.body.data.user.nickname).toBe('Updated Name');
  });

  test('Non-admin cannot access user management', async () => {
    const customer = await createUserWithToken('CUSTOMER');
    const staff = await createUserWithToken('STAFF');

    // Customer cannot list users
    let response = await request(app)
      .get('/api/users')
      .set('Authorization', `Bearer ${customer.token}`);
    expect(response.status).toBe(403);

    // Staff cannot list users
    response = await request(app)
      .get('/api/users')
      .set('Authorization', `Bearer ${staff.token}`);
    expect(response.status).toBe(403);

    // Customer cannot create staff
    response = await request(app)
      .post('/api/users/staff')
      .set('Authorization', `Bearer ${customer.token}`)
      .send({
        nickname: 'Hacker',
        email: 'hacker@test.com',
        password: 'hack123'
      });
    expect(response.status).toBe(403);
  });

  test('Admin cannot delete themselves', async () => {
    const admin = await createUserWithToken('ADMIN');

    const response = await request(app)
      .delete(`/api/users/${admin.user.id}`)
      .set('Authorization', `Bearer ${admin.token}`);

    // Admin is also protected from deletion (cannot delete admin accounts)
    expect(response.status).toBe(403);
    expect(response.body.message).toBe('Cannot delete admin accounts');
  });
});
