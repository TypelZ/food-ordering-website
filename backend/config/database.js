/**
 * Database Configuration
 * Sequelize connection settings for AWS RDS MySQL (production) or SQLite (development/test)
 */

const { Sequelize } = require('sequelize');

let sequelize;

// Use SQLite for testing/development, MySQL for production
if (process.env.NODE_ENV === 'test' || !process.env.DB_HOST || process.env.DB_HOST === 'localhost') {
  // SQLite for local development and testing
  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: process.env.NODE_ENV === 'test' ? ':memory:' : './database.sqlite',
    logging: false,
    define: {
      timestamps: true,
      underscored: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at'
    }
  });
} else {
  // MySQL for production (AWS RDS)
  sequelize = new Sequelize(
    process.env.DB_NAME || 'food_ordering',
    process.env.DB_USER || 'root',
    process.env.DB_PASS || '',
    {
      host: process.env.DB_HOST,
      port: process.env.DB_PORT || 3306,
      dialect: 'mysql',
      logging: process.env.NODE_ENV === 'development' ? console.log : false,
      pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000
      },
      define: {
        timestamps: true,
        underscored: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at'
      }
    }
  );
}

module.exports = sequelize;
