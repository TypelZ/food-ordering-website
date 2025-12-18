/**
 * Models Index
 * Loads all models and sets up associations
 */

const sequelize = require('../config/database');

// Import model definitions
const User = require('./User')(sequelize);
const MenuItem = require('./MenuItem')(sequelize);
const Order = require('./Order')(sequelize);
const OrderItem = require('./OrderItem')(sequelize);

// Define associations

// User has many Orders
User.hasMany(Order, {
  foreignKey: 'user_id',
  as: 'orders'
});

// Order belongs to User
Order.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'user'
});

// Order has many OrderItems
Order.hasMany(OrderItem, {
  foreignKey: 'order_id',
  as: 'items'
});

// OrderItem belongs to Order
OrderItem.belongsTo(Order, {
  foreignKey: 'order_id',
  as: 'order'
});

// OrderItem belongs to MenuItem
OrderItem.belongsTo(MenuItem, {
  foreignKey: 'menu_item_id',
  as: 'menuItem'
});

// MenuItem has many OrderItems
MenuItem.hasMany(OrderItem, {
  foreignKey: 'menu_item_id',
  as: 'orderItems'
});

module.exports = {
  sequelize,
  User,
  MenuItem,
  Order,
  OrderItem
};
