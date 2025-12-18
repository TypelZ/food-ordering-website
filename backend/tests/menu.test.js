/**
 * Menu Property Tests
 * Tests for menu CRUD operations
 */

const request = require('supertest');
const { v4: uuidv4 } = require('uuid');
const app = require('../app');
const { User, MenuItem } = require('../models');
const { generateToken } = require('../middleware/auth');

// Helper to create staff user and get token
const createStaffToken = async () => {
  const user = await User.create({
    nickname: 'Staff',
    email: `staff_${uuidv4()}@test.com`,
    password: 'password123',
    role: 'STAFF'
  });
  return generateToken(user);
};

// Helper to create customer user and get token
const createCustomerToken = async () => {
  const user = await User.create({
    nickname: 'Customer',
    email: `customer_${uuidv4()}@test.com`,
    password: 'password123',
    role: 'CUSTOMER'
  });
  return generateToken(user);
};

describe('Menu Tests', () => {
  /**
   * **Feature: food-ordering-website, Property 7: Menu retrieval returns complete items**
   * **Validates: Requirements 3.1**
   */
  test('Property 7: Menu retrieval returns complete items', async () => {
    // Create test menu items
    const items = await Promise.all([
      MenuItem.create({ name: 'Burger', description: 'Delicious burger', price: 9.99, image_url: 'http://example.com/burger.jpg' }),
      MenuItem.create({ name: 'Pizza', description: 'Cheesy pizza', price: 12.99, image_url: 'http://example.com/pizza.jpg' }),
      MenuItem.create({ name: 'Salad', description: 'Fresh salad', price: 7.99, image_url: null })
    ]);

    // Get menu (public endpoint)
    const response = await request(app).get('/api/menu');

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.items).toHaveLength(3);

    // Verify each item has required fields
    for (const item of response.body.data.items) {
      expect(item).toHaveProperty('id');
      expect(item).toHaveProperty('name');
      expect(item).toHaveProperty('description');
      expect(item).toHaveProperty('price');
      expect(item).toHaveProperty('image_url');
    }
  });

  /**
   * **Feature: food-ordering-website, Property 14: Menu CRUD operations persist**
   * **Validates: Requirements 8.1, 8.2, 8.4**
   */
  test('Property 14: Menu CRUD operations persist', async () => {
    const staffToken = await createStaffToken();

    // CREATE
    let response = await request(app)
      .post('/api/menu')
      .set('Authorization', `Bearer ${staffToken}`)
      .field('name', 'Test Item')
      .field('description', 'Test description')
      .field('price', '15.99');

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    const createdId = response.body.data.item.id;

    // Verify creation persisted
    response = await request(app).get(`/api/menu/${createdId}`);
    expect(response.status).toBe(200);
    expect(response.body.data.item.name).toBe('Test Item');
    expect(response.body.data.item.description).toBe('Test description');
    expect(parseFloat(response.body.data.item.price)).toBe(15.99);

    // UPDATE
    response = await request(app)
      .put(`/api/menu/${createdId}`)
      .set('Authorization', `Bearer ${staffToken}`)
      .field('name', 'Updated Item')
      .field('price', '19.99');

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);

    // Verify update persisted
    response = await request(app).get(`/api/menu/${createdId}`);
    expect(response.status).toBe(200);
    expect(response.body.data.item.name).toBe('Updated Item');
    expect(parseFloat(response.body.data.item.price)).toBe(19.99);

    // DELETE
    response = await request(app)
      .delete(`/api/menu/${createdId}`)
      .set('Authorization', `Bearer ${staffToken}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);

    // Verify deletion persisted
    response = await request(app).get(`/api/menu/${createdId}`);
    expect(response.status).toBe(404);
  });

  /**
   * Test that customers cannot access menu management
   * **Validates: Requirements 8.5**
   */
  test('Customers cannot manage menu items', async () => {
    const customerToken = await createCustomerToken();

    // Try to create
    let response = await request(app)
      .post('/api/menu')
      .set('Authorization', `Bearer ${customerToken}`)
      .field('name', 'Unauthorized Item')
      .field('price', '10.00');

    expect(response.status).toBe(403);
    expect(response.body.success).toBe(false);

    // Create an item as staff first
    const staffToken = await createStaffToken();
    response = await request(app)
      .post('/api/menu')
      .set('Authorization', `Bearer ${staffToken}`)
      .field('name', 'Staff Item')
      .field('price', '10.00');
    
    const itemId = response.body.data.item.id;

    // Try to update as customer
    response = await request(app)
      .put(`/api/menu/${itemId}`)
      .set('Authorization', `Bearer ${customerToken}`)
      .field('name', 'Hacked Item');

    expect(response.status).toBe(403);

    // Try to delete as customer
    response = await request(app)
      .delete(`/api/menu/${itemId}`)
      .set('Authorization', `Bearer ${customerToken}`);

    expect(response.status).toBe(403);
  });

  /**
   * Test menu is accessible without authentication
   * **Validates: Requirements 3.3**
   */
  test('Menu is publicly accessible', async () => {
    // Create a menu item
    await MenuItem.create({ name: 'Public Item', price: 5.99 });

    // Access without token
    const response = await request(app).get('/api/menu');

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.items.length).toBeGreaterThan(0);
  });
});
