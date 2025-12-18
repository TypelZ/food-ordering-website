/**
 * User Routes
 * /api/users/*
 * Admin only
 */

const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticate } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/roleCheck');

// All user management routes require Admin role
router.use(authenticate, requireAdmin);

router.get('/', userController.getAll);
router.post('/staff', userController.createStaff);
router.put('/staff/:id', userController.updateStaff);
router.delete('/:id', userController.deleteUser);

module.exports = router;
