/**
 * Cart Controller
 * Handles shopping cart operations
 * Uses in-memory storage (Map) for simplicity
 */

const { MenuItem } = require('../models');

// In-memory cart storage: Map<userId, Map<menuItemId, {item, quantity}>>
const carts = new Map();

/**
 * Get user's cart
 * @param {number} userId 
 * @returns {Map} User's cart
 */
const getUserCart = (userId) => {
  if (!carts.has(userId)) {
    carts.set(userId, new Map());
  }
  return carts.get(userId);
};

/**
 * Calculate cart total
 * @param {Map} cart 
 * @returns {number} Total price
 */
const calculateTotal = (cart) => {
  let total = 0;
  for (const [, cartItem] of cart) {
    total += parseFloat(cartItem.item.price) * cartItem.quantity;
  }
  return Math.round(total * 100) / 100; // Round to 2 decimal places
};

/**
 * Get cart contents
 * GET /api/cart
 */
const getCart = async (req, res) => {
  try {
    const cart = getUserCart(req.user.id);
    const items = [];

    for (const [menuItemId, cartItem] of cart) {
      items.push({
        menuItemId,
        item: cartItem.item,
        quantity: cartItem.quantity,
        subtotal: Math.round(parseFloat(cartItem.item.price) * cartItem.quantity * 100) / 100
      });
    }

    res.json({
      success: true,
      data: {
        items,
        total: calculateTotal(cart),
        itemCount: items.length
      }
    });
  } catch (error) {
    console.error('Get cart error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get cart'
    });
  }
};

/**
 * Add item to cart
 * POST /api/cart/add
 */
const addItem = async (req, res) => {
  try {
    const { menuItemId, quantity = 1 } = req.body;

    if (!menuItemId) {
      return res.status(400).json({
        success: false,
        message: 'Menu item ID is required'
      });
    }

    // Verify menu item exists
    const menuItem = await MenuItem.findByPk(menuItemId);
    if (!menuItem) {
      return res.status(404).json({
        success: false,
        message: 'Menu item not found'
      });
    }

    const cart = getUserCart(req.user.id);
    
    if (cart.has(menuItemId)) {
      // Increase quantity if already in cart
      const cartItem = cart.get(menuItemId);
      cartItem.quantity += parseInt(quantity);
    } else {
      // Add new item
      cart.set(menuItemId, {
        item: menuItem.toJSON(),
        quantity: parseInt(quantity)
      });
    }

    res.json({
      success: true,
      message: 'Item added to cart',
      data: {
        total: calculateTotal(cart),
        itemCount: cart.size
      }
    });
  } catch (error) {
    console.error('Add to cart error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add item to cart'
    });
  }
};

/**
 * Update item quantity
 * PUT /api/cart/update
 */
const updateItem = async (req, res) => {
  try {
    const { menuItemId, quantity } = req.body;

    if (!menuItemId || quantity === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Menu item ID and quantity are required'
      });
    }

    const cart = getUserCart(req.user.id);

    if (!cart.has(menuItemId)) {
      return res.status(404).json({
        success: false,
        message: 'Item not in cart'
      });
    }

    const qty = parseInt(quantity);
    
    if (qty <= 0) {
      // Remove item if quantity is 0 or less
      cart.delete(menuItemId);
    } else {
      // Update quantity
      cart.get(menuItemId).quantity = qty;
    }

    res.json({
      success: true,
      message: qty <= 0 ? 'Item removed from cart' : 'Cart updated',
      data: {
        total: calculateTotal(cart),
        itemCount: cart.size
      }
    });
  } catch (error) {
    console.error('Update cart error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update cart'
    });
  }
};

/**
 * Remove item from cart
 * DELETE /api/cart/remove/:itemId
 */
const removeItem = async (req, res) => {
  try {
    const menuItemId = parseInt(req.params.itemId);
    const cart = getUserCart(req.user.id);

    if (!cart.has(menuItemId)) {
      return res.status(404).json({
        success: false,
        message: 'Item not in cart'
      });
    }

    cart.delete(menuItemId);

    res.json({
      success: true,
      message: 'Item removed from cart',
      data: {
        total: calculateTotal(cart),
        itemCount: cart.size
      }
    });
  } catch (error) {
    console.error('Remove from cart error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to remove item from cart'
    });
  }
};

/**
 * Clear cart
 * DELETE /api/cart/clear
 */
const clearCart = async (req, res) => {
  try {
    const cart = getUserCart(req.user.id);
    cart.clear();

    res.json({
      success: true,
      message: 'Cart cleared',
      data: {
        total: 0,
        itemCount: 0
      }
    });
  } catch (error) {
    console.error('Clear cart error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to clear cart'
    });
  }
};

// Export for use in order controller
const getCartForCheckout = (userId) => {
  return getUserCart(userId);
};

const clearCartAfterCheckout = (userId) => {
  const cart = getUserCart(userId);
  cart.clear();
};

module.exports = {
  getCart,
  addItem,
  updateItem,
  removeItem,
  clearCart,
  getCartForCheckout,
  clearCartAfterCheckout,
  calculateTotal
};
