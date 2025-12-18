/**
 * User Controller
 * Handles user management (Admin only)
 */

const { User } = require('../models');

/**
 * Get all users
 * GET /api/users
 */
const getAll = async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: ['id', 'nickname', 'email', 'role', 'delivery_address', 'created_at'],
      order: [['created_at', 'DESC']]
    });

    res.json({
      success: true,
      data: { users }
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch users'
    });
  }
};

/**
 * Create staff account
 * POST /api/users/staff
 */
const createStaff = async (req, res) => {
  try {
    const { nickname, email, password } = req.body;

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

    // Create staff user
    const user = await User.create({
      nickname: nickname.trim(),
      email: email.toLowerCase().trim(),
      password,
      role: 'STAFF'
    });

    res.status(201).json({
      success: true,
      message: 'Staff account created successfully',
      data: { user: user.toSafeObject() }
    });
  } catch (error) {
    console.error('Create staff error:', error);
    
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: error.errors.map(e => e.message)
      });
    }

    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({
        success: false,
        message: 'Email already exists'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to create staff account'
    });
  }
};

/**
 * Update staff nickname
 * PUT /api/users/staff/:id
 */
const updateStaff = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Can only update STAFF users
    if (user.role !== 'STAFF') {
      return res.status(403).json({
        success: false,
        message: 'Can only update staff accounts'
      });
    }

    const { nickname } = req.body;

    if (!nickname || nickname.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Nickname is required'
      });
    }

    await user.update({ nickname: nickname.trim() });

    res.json({
      success: true,
      message: 'Staff account updated',
      data: { user: user.toSafeObject() }
    });
  } catch (error) {
    console.error('Update staff error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update staff account'
    });
  }
};

/**
 * Delete user (Customer or Staff)
 * DELETE /api/users/:id
 */
const deleteUser = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Cannot delete ADMIN users
    if (user.role === 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Cannot delete admin accounts'
      });
    }

    // Cannot delete yourself
    if (user.id === req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Cannot delete your own account'
      });
    }

    await user.destroy();

    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete user'
    });
  }
};

module.exports = {
  getAll,
  createStaff,
  updateStaff,
  deleteUser
};
