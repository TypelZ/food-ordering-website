/**
 * User Model
 * Represents users with roles: CUSTOMER, STAFF, ADMIN
 */

const { DataTypes } = require('sequelize');
const bcrypt = require('bcrypt');

module.exports = (sequelize) => {
  const User = sequelize.define('User', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    nickname: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notEmpty: { msg: 'Nickname is required' },
        len: { args: [1, 100], msg: 'Nickname must be 1-100 characters' }
      }
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: { msg: 'Email already exists' },
      validate: {
        notEmpty: { msg: 'Email is required' },
        isEmail: { msg: 'Invalid email format' }
      }
    },
    password: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        notEmpty: { msg: 'Password is required' },
        len: { args: [6, 255], msg: 'Password must be at least 6 characters' }
      }
    },
    role: {
      type: DataTypes.ENUM('CUSTOMER', 'STAFF', 'ADMIN'),
      allowNull: false,
      defaultValue: 'CUSTOMER'
    },
    delivery_address: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  }, {
    tableName: 'users',
    hooks: {
      // Hash password before creating user
      beforeCreate: async (user) => {
        if (user.password) {
          user.password = await bcrypt.hash(user.password, 10);
        }
      },
      // Hash password before updating if changed
      beforeUpdate: async (user) => {
        if (user.changed('password')) {
          user.password = await bcrypt.hash(user.password, 10);
        }
      }
    }
  });

  // Instance method to verify password
  User.prototype.verifyPassword = async function(password) {
    return bcrypt.compare(password, this.password);
  };

  // Instance method to return safe user data (no password)
  User.prototype.toSafeObject = function() {
    return {
      id: this.id,
      nickname: this.nickname,
      email: this.email,
      role: this.role,
      delivery_address: this.delivery_address,
      created_at: this.created_at
    };
  };

  return User;
};
