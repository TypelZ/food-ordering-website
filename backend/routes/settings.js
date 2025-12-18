/**
 * Settings Routes
 * /api/settings/*
 */

const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settingsController');
const { authenticate } = require('../middleware/auth');

// All settings routes require authentication
router.use(authenticate);

router.get('/profile', settingsController.getProfile);
router.put('/profile', settingsController.updateProfile);
router.put('/password', settingsController.updatePassword);

module.exports = router;
