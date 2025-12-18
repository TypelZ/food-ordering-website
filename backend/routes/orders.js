/**
 * Order Routes
 * /api/orders/*
 */

const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { authenticate } = require('../middleware/auth');
const { requireCustomer, requireStaff } = require('../middleware/roleCheck');

// All order routes require authentication
router.use(authenticate);

// Get orders (customers see own, staff see all)
router.get('/', orderController.getOrders);
router.get('/:id', orderController.getOrderById);

// Customer-only: create order
router.post('/', requireCustomer, orderController.createOrder);

// Staff-only: update status
router.put('/:id/status', requireStaff, orderController.updateStatus);

module.exports = router;
