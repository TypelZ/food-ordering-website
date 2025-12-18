/**
 * Authentication Controller
 * Handles user registration, login, and logout
 */

const { User } = require('../models');
const { generateToken } = require('../middleware/auth');

/**
 * Register a new customer
 * POST /api/auth/register
 */
const register = async (req, res) => {
  try {
    const { nickname, email, password, delivery_address } = req.body;

    // Validate required fields
    const errors = [];
    if (!nickname || nickname.trim() === '') {
      errors.push('Nickname is required');
    }
    if (!email || email.trim() === '') {
      errors.push('Email is required');
    }
    if (!password || password.length < 6) {
      errors.push('Password must be at least 6 characters');
    }

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors
      });
    }

    // Check if email already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'Email already exists'
      });
    }

    // Create new customer (role is always CUSTOMER for registration)
    const user = await User.create({
      nickname: nickname.trim(),
      email: email.toLowerCase().trim(),
      password,
      role: 'CUSTOMER',
      delivery_address: delivery_address || null
    });

    res.status(201).json({
      success: true,
      message: 'Registration successful',
      data: {
        user: user.toSafeObject()
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    
    // Handle Sequelize validation errors
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: error.errors.map(e => e.message)
      });
    }

    // Handle unique constraint errors
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({
        success: false,
        message: 'Email already exists'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Registration failed. Please try again.'
    });
  }
};

/**
 * Login user
 * POST /api/auth/login
 */
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    // Find user by email
    const user = await User.findOne({ 
      where: { email: email.toLowerCase().trim() } 
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Verify password
    const isValidPassword = await user.verifyPassword(password);
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Generate JWT token
    const token = generateToken(user);

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        user: user.toSafeObject()
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed. Please try again.'
    });
  }
};

/**
 * Logout user
 * POST /api/auth/logout
 * Note: JWT is stateless, so logout is handled client-side by clearing the token
 */
const logout = async (req, res) => {
  res.json({
    success: true,
    message: 'Logout successful. Please clear your token.'
  });
};

module.exports = {
  register,
  login,
  logout
};
