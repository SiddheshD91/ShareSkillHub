const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { auth } = require('../middleware/auth');
const passport = require('passport'); // Import passport

// Register route
router.post('/register', authController.register);

// Login route
router.post('/login', authController.login);

// Logout route
router.post('/logout', authController.logout);

// Get current user route
router.get('/me', auth, authController.getCurrentUser);

// Google OAuth routes
// Route to initiate Google OAuth login
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

// Route to handle Google OAuth callback
router.get('/google/callback', 
    passport.authenticate('google', { failureRedirect: '/login' }), // Redirect to login on failure
    (req, res) => {
        // Successful authentication, generate JWT and redirect or respond
        // We can reuse the logic from the regular login success
        const token = authController.generateToken(req.user._id); // Assuming generateToken is accessible or move to utils
        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });
        
        // Redirect to a frontend page or send a success response
        // For simplicity, redirecting to home or dashboard after successful login
        res.redirect(process.env.CLIENT_URL || 'http://localhost:3000'); 
    }
);

module.exports = router; 