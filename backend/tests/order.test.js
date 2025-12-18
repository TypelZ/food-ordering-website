/**
 * Order Property Tests
 * Tests for order creation and management
 */

const request = require('supertest');
const { v4: uuidv4 } = require('uuid');
const app = require('../app');
const { User, MenuItem, Order, OrderItem } = require('../models');
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

// Helper to create menu item
const createMenuItem = async (name = 'Test Item', price = 10.99) => {
  return MenuItem.create({
    name,
    description: 'Test description',
    price,
    image_url: null
  });
};

// Helper to add item to cart
const addToCart = async (token, menuItemId, quantity = 1) => {
  return request(app)
    .post('/api/cart/add')
    .set('Authorization', `Bearer ${token}`)
    .send({ menuItemId, quantity });
};

describe('Order Tests', () => {
  /**
   * **Feature: food-ordering-website, Property 9: Order creation integrity**
   * **Validates: Requirements 5.1, 5.2, 5.3**
   */
  test('Property 9: Order creation integrity', async () => {
    const { token } = await createUserWithToken('CUSTOMER');
    const item1 = await createMenuItem('Burger', 9.99);
    const item2 = await createMenuItem('Fries', 4.99);

    // Add items to cart
    await addToCart(token, item1.id, 2);
    await addToCart(token, item2.id, 1);

    // Create order
    let response = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data.order).toBeDefined();

    const order = response.body.data.order;
    expect(order.status).toBe('Pending');
    expect(parseFloat(order.total_price)).toBe(24.97); // 9.99*2 + 4.99
    expect(order.items).toHaveLength(2);

    // Verify cart is cleared after order
    response = await request(app)
      .get('/api/cart')
      .set('Authorization', `Bearer ${token}`);

    expect(response.body.data.items).toHaveLength(0);
  });

  /**
   * **Feature: food-ordering-website, Property 10: Customer order isolation**
   * **Validates: Requirements 6.1, 6.2**
   */
  test('Property 10: Customer order isolation', async () => {
    const customer1 = await createUserWithToken('CUSTOMER');
    const customer2 = await createUserWithToken('CUSTOMER');
    const item = await createMenuItem('Pizza', 15.00);

    // Customer 1 creates order
    await addToCart(customer1.token, item.id, 1);
    await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${customer1.token}`);

    // Customer 2 creates order
    await addToCart(customer2.token, item.id, 2);
    await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${customer2.token}`);

    // Customer 1 should only see their order
    let response = await request(app)
      .get('/api/orders')
      .set('Authorization', `Bearer ${customer1.token}`);

    expect(response.body.data.orders).toHaveLength(1);
    expect(response.body.data.orders[0].user_id).toBe(customer1.user.id);

    // Customer 2 should only see their order
    response = await request(app)
      .get('/api/orders')
      .set('Authorization', `Bearer ${customer2.token}`);

    expect(response.body.data.orders).toHaveLength(1);
    expect(response.body.data.orders[0].user_id).toBe(customer2.user.id);
  });

  /**
   * **Feature: food-ordering-website, Property 11: Order response completeness**
   * **Validates: Requirements 5.4, 6.2**
   */
  test('Property 11: Order response completeness', async () => {
    const { user, token } = await createUserWithToken('CUSTOMER');
    const item = await createMenuItem('Salad', 8.99);

    await addToCart(token, item.id, 1);
    await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${token}`);

    // Get orders
    const response = await request(app)
      .get('/api/orders')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    const order = response.body.data.orders[0];

    // Verify order has all required fields
    expect(order).toHaveProperty('id');
    expect(order).toHaveProperty('status');
    expect(order).toHaveProperty('total_price');
    expect(order).toHaveProperty('created_at');
    expect(order).toHaveProperty('items');
    expect(order).toHaveProperty('user');

    // Verify order items have menu item details
    expect(order.items[0]).toHaveProperty('quantity');
    expect(order.items[0]).toHaveProperty('price');
    expect(order.items[0]).toHaveProperty('menuItem');
    expect(order.items[0].menuItem).toHaveProperty('name');
  });

  /**
   * **Feature: food-ordering-website, Property 15: Order status updates persist**
   * **Validates: Requirements 9.2, 9.3**
   */
  test('Property 15: Order status updates persist', async () => {
    const customer = await createUserWithToken('CUSTOMER');
    const staff = await createUserWithToken('STAFF');
    const item = await createMenuItem('Soup', 6.99);

    // Create order
    await addToCart(customer.token, item.id, 1);
    let response = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${customer.token}`);

    const orderId = response.body.data.order.id;

    // Staff updates status through each stage
    const statuses = ['Preparing', 'Ready', 'Completed'];

    for (const status of statuses) {
      response = await request(app)
        .put(`/api/orders/${orderId}/status`)
        .set('Authorization', `Bearer ${staff.token}`)
        .send({ status });

      expect(response.status).toBe(200);
      expect(response.body.data.order.status).toBe(status);

      // Verify persistence
      response = await request(app)
        .get(`/api/orders/${orderId}`)
        .set('Authorization', `Bearer ${staff.token}`);

      expect(response.body.data.order.status).toBe(status);
    }
  });

  test('Cannot create order with empty cart', async () => {
    const { token } = await createUserWithToken('CUSTOMER');

    const response = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(400);
    expect(response.body.message).toBe('Cart is empty');
  });

  test('Staff can view all orders', async () => {
    const customer = await createUserWithToken('CUSTOMER');
    const staff = await createUserWithToken('STAFF');
    const item = await createMenuItem('Wrap', 11.99);

    // Customer creates order
    await addToCart(customer.token, item.id, 1);
    await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${customer.token}`);

    // Staff can see all orders
    const response = await request(app)
      .get('/api/orders')
      .set('Authorization', `Bearer ${staff.token}`);

    expect(response.status).toBe(200);
    expect(response.body.data.orders.length).toBeGreaterThan(0);
  });

  test('Invalid status rejected', async () => {
    const customer = await createUserWithToken('CUSTOMER');
    const staff = await createUserWithToken('STAFF');
    const item = await createMenuItem('Taco', 7.99);

    await addToCart(customer.token, item.id, 1);
    let response = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${customer.token}`);

    const orderId = response.body.data.order.id;

    response = await request(app)
      .put(`/api/orders/${orderId}/status`)
      .set('Authorization', `Bearer ${staff.token}`)
      .send({ status: 'InvalidStatus' });

    expect(response.status).toBe(400);
  });
});
