/**
 * Settings Property Tests
 * Tests for user profile and password management
 */

const request = require('supertest');
const bcrypt = require('bcrypt');
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
    role,
    delivery_address: '123 Test St'
  });
  return { user, token: generateToken(user) };
};

describe('Settings Tests', () => {
  /**
   * **Feature: food-ordering-website, Property 2: Email uniqueness constraint**
   * **Validates: Requirements 1.2**
   */
  test('Property 2: Email uniqueness constraint', async () => {
    const customer1 = await createUserWithToken('CUSTOMER');
    const customer2 = await createUserWithToken('CUSTOMER');

    // Try to update customer2's email to customer1's email
    const response = await request(app)
      .put('/api/settings/profile')
      .set('Authorization', `Bearer ${customer2.token}`)
      .send({ email: customer1.user.email });

    expect(response.status).toBe(409);
    expect(response.body.message).toBe('Email already exists');
  });

  /**
   * **Feature: food-ordering-website, Property 12: Profile updates persist correctly**
   * **Validates: Requirements 7.1, 7.2**
   */
  test('Property 12: Profile updates persist correctly', async () => {
    const { user, token } = await createUserWithToken('CUSTOMER');

    const newNickname = 'Updated Nickname';
    const newEmail = `updated_${uuidv4()}@test.com`;
    const newAddress = '456 New Address';

    // Update profile
    let response = await request(app)
      .put('/api/settings/profile')
      .set('Authorization', `Bearer ${token}`)
      .send({
        nickname: newNickname,
        email: newEmail,
        delivery_address: newAddress
      });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);

    // Verify persistence
    response = await request(app)
      .get('/api/settings/profile')
      .set('Authorization', `Bearer ${token}`);

    expect(response.body.data.user.nickname).toBe(newNickname);
    expect(response.body.data.user.email).toBe(newEmail);
    expect(response.body.data.user.delivery_address).toBe(newAddress);

    // Verify in database
    const updatedUser = await User.findByPk(user.id);
    expect(updatedUser.nickname).toBe(newNickname);
    expect(updatedUser.email).toBe(newEmail);
    expect(updatedUser.delivery_address).toBe(newAddress);
  });

  /**
   * **Feature: food-ordering-website, Property 13: Password updates are hashed**
   * **Validates: Requirements 7.4, 7.5**
   */
  test('Property 13: Password updates are hashed', async () => {
    const { user, token } = await createUserWithToken('CUSTOMER');
    const newPassword = 'newSecurePassword123';

    // Update password
    const response = await request(app)
      .put('/api/settings/password')
      .set('Authorization', `Bearer ${token}`)
      .send({
        currentPassword: 'password123',
        newPassword
      });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);

    // Verify password is hashed in database
    const updatedUser = await User.findByPk(user.id);
    expect(updatedUser.password).not.toBe(newPassword);

    // Verify bcrypt can validate new password
    const isValid = await bcrypt.compare(newPassword, updatedUser.password);
    expect(isValid).toBe(true);

    // Verify can login with new password
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({ email: user.email, password: newPassword });

    expect(loginResponse.status).toBe(200);
  });

  /**
   * **Feature: food-ordering-website, Property 19: Staff settings restrictions**
   * **Validates: Requirements 10.1, 10.2**
   */
  test('Property 19: Staff settings restrictions', async () => {
    const { user, token } = await createUserWithToken('STAFF');

    // Staff tries to update profile (should fail)
    let response = await request(app)
      .put('/api/settings/profile')
      .set('Authorization', `Bearer ${token}`)
      .send({
        nickname: 'New Nickname',
        email: 'newemail@test.com'
      });

    expect(response.status).toBe(403);
    expect(response.body.message).toBe('Staff can only change password');

    // Staff can update password
    response = await request(app)
      .put('/api/settings/password')
      .set('Authorization', `Bearer ${token}`)
      .send({
        currentPassword: 'password123',
        newPassword: 'newStaffPassword123'
      });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
  });

  test('Get profile returns user data', async () => {
    const { user, token } = await createUserWithToken('CUSTOMER');

    const response = await request(app)
      .get('/api/settings/profile')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.data.user.id).toBe(user.id);
    expect(response.body.data.user.nickname).toBe(user.nickname);
    expect(response.body.data.user.email).toBe(user.email);
    expect(response.body.data.user.role).toBe('CUSTOMER');
    // Password should not be returned
    expect(response.body.data.user.password).toBeUndefined();
  });

  test('Wrong current password rejected', async () => {
    const { token } = await createUserWithToken('CUSTOMER');

    const response = await request(app)
      .put('/api/settings/password')
      .set('Authorization', `Bearer ${token}`)
      .send({
        currentPassword: 'wrongpassword',
        newPassword: 'newpassword123'
      });

    expect(response.status).toBe(401);
    expect(response.body.message).toBe('Current password is incorrect');
  });

  test('Partial profile update works', async () => {
    const { user, token } = await createUserWithToken('CUSTOMER');
    const originalEmail = user.email;

    // Update only nickname
    const response = await request(app)
      .put('/api/settings/profile')
      .set('Authorization', `Bearer ${token}`)
      .send({ nickname: 'Only Nickname Changed' });

    expect(response.status).toBe(200);
    expect(response.body.data.user.nickname).toBe('Only Nickname Changed');
    expect(response.body.data.user.email).toBe(originalEmail);
  });
});
