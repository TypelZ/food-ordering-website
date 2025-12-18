/**
 * Menu Routes
 * /api/menu/*
 */

const express = require('express');
const router = express.Router();
const multer = require('multer');
const menuController = require('../controllers/menuController');
const { authenticate } = require('../middleware/auth');
const { requireStaff } = require('../middleware/roleCheck');

// Configure multer for memory storage (for S3 upload)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    // Accept images only
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

// Public routes
router.get('/', menuController.getAll);
router.get('/:id', menuController.getById);

// Staff-only routes
router.post('/', authenticate, requireStaff, upload.single('image'), menuController.create);
router.put('/:id', authenticate, requireStaff, upload.single('image'), menuController.update);
router.delete('/:id', authenticate, requireStaff, menuController.remove);

module.exports = router;
