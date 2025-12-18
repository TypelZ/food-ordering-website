/**
 * Menu Controller
 * Handles menu item CRUD operations
 */

const { MenuItem } = require('../models');
const { uploadImage, deleteImage } = require('../services/s3Service');

/**
 * Get all menu items
 * GET /api/menu
 */
const getAll = async (req, res) => {
  try {
    const items = await MenuItem.findAll({
      order: [['created_at', 'DESC']]
    });

    res.json({
      success: true,
      data: { items }
    });
  } catch (error) {
    console.error('Get menu error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch menu items'
    });
  }
};

/**
 * Get single menu item
 * GET /api/menu/:id
 */
const getById = async (req, res) => {
  try {
    const item = await MenuItem.findByPk(req.params.id);

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Menu item not found'
      });
    }

    res.json({
      success: true,
      data: { item }
    });
  } catch (error) {
    console.error('Get menu item error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch menu item'
    });
  }
};

/**
 * Create menu item
 * POST /api/menu
 */
const create = async (req, res) => {
  try {
    const { name, description, price } = req.body;

    // Validate required fields
    if (!name || !price) {
      return res.status(400).json({
        success: false,
        message: 'Name and price are required'
      });
    }

    // Handle image upload if provided
    let image_url = null;
    if (req.file) {
      image_url = await uploadImage(
        req.file.buffer,
        req.file.originalname,
        req.file.mimetype
      );
    }

    const item = await MenuItem.create({
      name,
      description: description || null,
      price: parseFloat(price),
      image_url
    });

    res.status(201).json({
      success: true,
      message: 'Menu item created successfully',
      data: { item }
    });
  } catch (error) {
    console.error('Create menu item error:', error);
    
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: error.errors.map(e => e.message)
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to create menu item'
    });
  }
};

/**
 * Update menu item
 * PUT /api/menu/:id
 */
const update = async (req, res) => {
  try {
    const item = await MenuItem.findByPk(req.params.id);

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Menu item not found'
      });
    }

    const { name, description, price } = req.body;

    // Handle image upload if provided
    let image_url = item.image_url;
    if (req.file) {
      // Delete old image if exists
      if (item.image_url) {
        await deleteImage(item.image_url);
      }
      
      image_url = await uploadImage(
        req.file.buffer,
        req.file.originalname,
        req.file.mimetype
      );
    }

    // Update fields
    await item.update({
      name: name || item.name,
      description: description !== undefined ? description : item.description,
      price: price ? parseFloat(price) : item.price,
      image_url
    });

    res.json({
      success: true,
      message: 'Menu item updated successfully',
      data: { item }
    });
  } catch (error) {
    console.error('Update menu item error:', error);
    
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: error.errors.map(e => e.message)
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to update menu item'
    });
  }
};

/**
 * Delete menu item
 * DELETE /api/menu/:id
 */
const remove = async (req, res) => {
  try {
    const item = await MenuItem.findByPk(req.params.id);

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Menu item not found'
      });
    }

    // Delete image from S3 if exists
    if (item.image_url) {
      await deleteImage(item.image_url);
    }

    await item.destroy();

    res.json({
      success: true,
      message: 'Menu item deleted successfully'
    });
  } catch (error) {
    console.error('Delete menu item error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete menu item'
    });
  }
};

module.exports = {
  getAll,
  getById,
  create,
  update,
  remove
};
