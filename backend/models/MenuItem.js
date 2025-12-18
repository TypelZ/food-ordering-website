/**
 * MenuItem Model
 * Represents food items available for ordering
 */

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const MenuItem = sequelize.define('MenuItem', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        notEmpty: { msg: 'Name is required' },
        len: { args: [1, 255], msg: 'Name must be 1-255 characters' }
      }
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        notEmpty: { msg: 'Price is required' },
        isDecimal: { msg: 'Price must be a valid number' },
        min: { args: [0.01], msg: 'Price must be greater than 0' }
      }
    },
    image_url: {
      type: DataTypes.STRING(500),
      allowNull: true
    }
  }, {
    tableName: 'menu_items'
  });

  return MenuItem;
};
