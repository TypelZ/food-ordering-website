/**
 * Order Controller
 * Handles order creation and management
 */

const { Order, OrderItem, MenuItem, User } = require('../models');
const { getCartForCheckout, clearCartAfterCheckout, calculateTotal } = require('./cartController');

// Valid order statuses
const VALID_STATUSES = ['Pending', 'Preparing', 'Ready', 'Completed', 'Cancelled'];

/**
 * Get orders
 * GET /api/orders
 * Customers see their own orders, Staff see all orders
 */
const getOrders = async (req, res) => {
  try {
    const whereClause = req.user.role === 'CUSTOMER' 
      ? { user_id: req.user.id } 
      : {};

    const orders = await Order.findAll({
      where: whereClause,
      include: [
        {
          model: OrderItem,
          as: 'items',
          include: [{ model: MenuItem, as: 'menuItem' }]
        },
        {
          model: User,
          as: 'user',
          attributes: ['id', 'nickname', 'email', 'delivery_address']
        }
      ],
      order: [['created_at', 'DESC']]
    });

    res.json({
      success: true,
      data: { orders }
    });
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch orders'
    });
  }
};

/**
 * Get single order
 * GET /api/orders/:id
 */
const getOrderById = async (req, res) => {
  try {
    const order = await Order.findByPk(req.params.id, {
      include: [
        {
          model: OrderItem,
          as: 'items',
          include: [{ model: MenuItem, as: 'menuItem' }]
        },
        {
          model: User,
          as: 'user',
          attributes: ['id', 'nickname', 'email', 'delivery_address']
        }
      ]
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Customers can only view their own orders
    if (req.user.role === 'CUSTOMER' && order.user_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    res.json({
      success: true,
      data: { order }
    });
  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch order'
    });
  }
};

/**
 * Create order (checkout)
 * POST /api/orders
 */
const createOrder = async (req, res) => {
  try {
    const cart = getCartForCheckout(req.user.id);
    const { delivery_address } = req.body;

    if (cart.size === 0) {
      return res.status(400).json({
        success: false,
        message: 'Cart is empty'
      });
    }

    // Get user's default address if not provided
    const user = await User.findByPk(req.user.id);
    const orderAddress = delivery_address || user.delivery_address || '';

    // Calculate total
    const total_price = calculateTotal(cart);

    // Create order with delivery address
    const order = await Order.create({
      user_id: req.user.id,
      status: 'Pending',
      total_price,
      delivery_address: orderAddress
    });

    // Create order items
    const orderItems = [];
    for (const [menuItemId, cartItem] of cart) {
      orderItems.push({
        order_id: order.id,
        menu_item_id: menuItemId,
        quantity: cartItem.quantity,
        price: parseFloat(cartItem.item.price)
      });
    }

    await OrderItem.bulkCreate(orderItems);

    // Clear cart after successful order
    clearCartAfterCheckout(req.user.id);

    // Fetch complete order with items
    const completeOrder = await Order.findByPk(order.id, {
      include: [
        {
          model: OrderItem,
          as: 'items',
          include: [{ model: MenuItem, as: 'menuItem' }]
        }
      ]
    });

    res.status(201).json({
      success: true,
      message: 'Order placed successfully',
      data: { order: completeOrder }
    });
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create order'
    });
  }
};

/**
 * Update order status (Staff only)
 * PUT /api/orders/:id/status
 */
const updateStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (!status || !VALID_STATUSES.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}`
      });
    }

    const order = await Order.findByPk(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    await order.update({ status });

    res.json({
      success: true,
      message: 'Order status updated',
      data: { order }
    });
  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update order status'
    });
  }
};

module.exports = {
  getOrders,
  getOrderById,
  createOrder,
  updateStatus,
  VALID_STATUSES
};
