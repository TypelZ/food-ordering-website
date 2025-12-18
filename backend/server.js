/**
 * Server Entry Point
 * Connects to database and starts the Express server
 */

require('dotenv').config();

const app = require('./app');
const { sequelize } = require('./models');

const PORT = process.env.PORT || 3000;

// Start server
async function startServer() {
  try {
    // Test database connection
    await sequelize.authenticate();
    console.log('✓ Database connection established');

    // Sync models (create tables if not exist)
    await sequelize.sync({ alter: false });
    console.log('✓ Database models synchronized');

    // Start listening
    app.listen(PORT, () => {
      console.log(`✓ Server running on port ${PORT}`);
      console.log(`  - API: http://localhost:${PORT}/api`);
      console.log(`  - Frontend: http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('✗ Failed to start server:', error.message);
    process.exit(1);
  }
}

startServer();
