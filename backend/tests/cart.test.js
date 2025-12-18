/**
 * Cart Property Tests
 * Tests for shopping cart operations
 */

const request = require('supertest');
const { v4: uuidv4 } = require('uuid');
const app = require('../app');
const { User, MenuItem } = require('../models');
const { generateToken } = require('../middleware/auth');

// Helper to create customer user and get token
const createCustomerWithToken = async () => {
  const user = await User.create({
    nickname: 'Customer',
    email: `customer_${uuidv4()}@test.com`,
    password: 'password123',
    role: 'CUSTOMER'
  });
  return { user, token: generateToken(user) };
};

// Helper to create menu item
const createMenuItem = async (name = 'Test Item', price = 10.99) => {
  return MenuItem.create({
    name,
    description: 'Test description',
    price,
    image_url: null
  });
};

describe('Cart Tests', () => {
  /**
   * **Feature: food-ordering-website, Property 8: Cart operations maintain consistency**
   * **Validates: Requirements 4.1, 4.2, 4.3, 4.4, 4.5**
   */
  test('Property 8: Cart operations maintain consistency', async () => {
    const { token } = await createCustomerWithToken();
    const item1 = await createMenuItem('Burger', 9.99);
    const item2 = await createMenuItem('Pizza', 14.99);

    // Initially cart should be empty
    let response = await request(app)
      .get('/api/cart')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.data.items).toHaveLength(0);
    expect(response.body.data.total).toBe(0);

    // Add first item
    response = await request(app)
      .post('/api/cart/add')
      .set('Authorization', `Bearer ${token}`)
      .send({ menuItemId: item1.id, quantity: 2 });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);

    // Verify cart state
    response = await request(app)
      .get('/api/cart')
      .set('Authorization', `Bearer ${token}`);

    expect(response.body.data.items).toHaveLength(1);
    expect(response.body.data.items[0].quantity).toBe(2);
    expect(response.body.data.total).toBe(19.98); // 9.99 * 2

    // Add second item
    response = await request(app)
      .post('/api/cart/add')
      .set('Authorization', `Bearer ${token}`)
      .send({ menuItemId: item2.id, quantity: 1 });

    expect(response.status).toBe(200);

    // Verify cart has both items
    response = await request(app)
      .get('/api/cart')
      .set('Authorization', `Bearer ${token}`);

    expect(response.body.data.items).toHaveLength(2);
    expect(response.body.data.total).toBe(34.97); // 19.98 + 14.99

    // Update quantity
    response = await request(app)
      .put('/api/cart/update')
      .set('Authorization', `Bearer ${token}`)
      .send({ menuItemId: item1.id, quantity: 3 });

    expect(response.status).toBe(200);

    // Verify updated quantity
    response = await request(app)
      .get('/api/cart')
      .set('Authorization', `Bearer ${token}`);

    const item1InCart = response.body.data.items.find(i => i.menuItemId === item1.id);
    expect(item1InCart.quantity).toBe(3);
    expect(response.body.data.total).toBe(44.96); // 9.99 * 3 + 14.99

    // Remove item
    response = await request(app)
      .delete(`/api/cart/remove/${item2.id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);

    // Verify removal
    response = await request(app)
      .get('/api/cart')
      .set('Authorization', `Bearer ${token}`);

    expect(response.body.data.items).toHaveLength(1);
    expect(response.body.data.total).toBe(29.97); // 9.99 * 3

    // Clear cart
    response = await request(app)
      .delete('/api/cart/clear')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);

    // Verify cart is empty
    response = await request(app)
      .get('/api/cart')
      .set('Authorization', `Bearer ${token}`);

    expect(response.body.data.items).toHaveLength(0);
    expect(response.body.data.total).toBe(0);
  });

  test('Adding same item increases quantity', async () => {
    const { token } = await createCustomerWithToken();
    const item = await createMenuItem('Burger', 10.00);

    // Add item twice
    await request(app)
      .post('/api/cart/add')
      .set('Authorization', `Bearer ${token}`)
      .send({ menuItemId: item.id, quantity: 1 });

    await request(app)
      .post('/api/cart/add')
      .set('Authorization', `Bearer ${token}`)
      .send({ menuItemId: item.id, quantity: 2 });

    // Verify quantity is combined
    const response = await request(app)
      .get('/api/cart')
      .set('Authorization', `Bearer ${token}`);

    expect(response.body.data.items).toHaveLength(1);
    expect(response.body.data.items[0].quantity).toBe(3);
  });

  test('Setting quantity to 0 removes item', async () => {
    const { token } = await createCustomerWithToken();
    const item = await createMenuItem('Burger', 10.00);

    // Add item
    await request(app)
      .post('/api/cart/add')
      .set('Authorization', `Bearer ${token}`)
      .send({ menuItemId: item.id, quantity: 2 });

    // Set quantity to 0
    await request(app)
      .put('/api/cart/update')
      .set('Authorization', `Bearer ${token}`)
      .send({ menuItemId: item.id, quantity: 0 });

    // Verify item removed
    const response = await request(app)
      .get('/api/cart')
      .set('Authorization', `Bearer ${token}`);

    expect(response.body.data.items).toHaveLength(0);
  });

  test('Cannot add non-existent menu item', async () => {
    const { token } = await createCustomerWithToken();

    const response = await request(app)
      .post('/api/cart/add')
      .set('Authorization', `Bearer ${token}`)
      .send({ menuItemId: 99999, quantity: 1 });

    expect(response.status).toBe(404);
    expect(response.body.message).toBe('Menu item not found');
  });
});
