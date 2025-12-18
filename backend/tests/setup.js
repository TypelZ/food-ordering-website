/**
 * Jest Test Setup
 * Configures test environment and database
 */

const { sequelize } = require('../models');

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-key';
process.env.JWT_EXPIRES_IN = '1h';

// Increase timeout for database operations
jest.setTimeout(30000);

// Setup before all tests
beforeAll(async () => {
  // Sync database (create tables)
  await sequelize.sync({ force: true });
});

// Cleanup after each test
afterEach(async () => {
  // Clear all tables
  const models = Object.values(sequelize.models);
  for (const model of models) {
    await model.destroy({ where: {}, force: true });
  }
});

// Cleanup after all tests
afterAll(async () => {
  await sequelize.close();
});
