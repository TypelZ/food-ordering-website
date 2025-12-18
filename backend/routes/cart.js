/**
 * Cart Routes
 * /api/cart/*
 */

const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cartController');
const { authenticate } = require('../middleware/auth');
const { requireCustomer } = require('../middleware/roleCheck');

// All cart routes require authentication and CUSTOMER role
router.use(authenticate, requireCustomer);

router.get('/', cartController.getCart);
router.post('/add', cartController.addItem);
router.put('/update', cartController.updateItem);
router.delete('/remove/:itemId', cartController.removeItem);
router.delete('/clear', cartController.clearCart);

module.exports = router;
