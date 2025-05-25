const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { auth, checkRole } = require('../middleware/auth');

// All admin routes are protected and require admin role
router.use(auth, checkRole(['admin']));

// Get dashboard stats
router.get('/dashboard', adminController.getDashboardStats);

// Get all users
router.get('/users', adminController.getAllUsers);

// Update user role
router.put('/users/:userId/role', adminController.updateUserRole);

module.exports = router; 