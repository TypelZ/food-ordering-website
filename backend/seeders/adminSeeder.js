/**
 * Admin Seeder
 * Creates default admin account if not exists
 */

require('dotenv').config();

const { sequelize, User } = require('../models');

const DEFAULT_ADMIN = {
  nickname: 'Admin',
  email: 'admin@foodorder.com',
  password: 'admin123',
  role: 'ADMIN'
};

async function seedAdmin() {
  try {
    // Connect to database
    await sequelize.authenticate();
    console.log('Database connected.');

    // Sync models
    await sequelize.sync();

    // Check if admin exists
    const existingAdmin = await User.findOne({ 
      where: { email: DEFAULT_ADMIN.email } 
    });

    if (existingAdmin) {
      console.log('Admin account already exists.');
      console.log(`Email: ${DEFAULT_ADMIN.email}`);
    } else {
      // Create admin
      await User.create(DEFAULT_ADMIN);
      console.log('Admin account created successfully!');
      console.log(`Email: ${DEFAULT_ADMIN.email}`);
      console.log(`Password: ${DEFAULT_ADMIN.password}`);
    }

    console.log('\nYou can now login with these credentials.');
    process.exit(0);
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  }
}

seedAdmin();
