/**
 * Order Model
 * Represents customer orders with status tracking
 */

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Order = sequelize.define('Order', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    status: {
      type: DataTypes.ENUM('Pending', 'Preparing', 'Ready', 'Completed', 'Cancelled'),
      allowNull: false,
      defaultValue: 'Pending'
    },
    total_price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        isDecimal: { msg: 'Total price must be a valid number' },
        min: { args: [0], msg: 'Total price cannot be negative' }
      }
    },
    delivery_address: {
      type: DataTypes.STRING(500),
      allowNull: true
    }
  }, {
    tableName: 'orders'
  });

  return Order;
};
