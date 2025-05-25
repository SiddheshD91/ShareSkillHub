const express = require('express');
const router = express.Router();
const ratingController = require('../controllers/ratingController');
const { auth, checkRole } = require('../middleware/auth');

// Add a rating to a course (Student only)
router.post('/:courseId', auth, checkRole(['student']), ratingController.addRating);

// Get ratings for a specific course (accessible by anyone)
router.get('/:courseId', ratingController.getCourseRatings);

// Optional: Routes for updating/deleting ratings could be added here with appropriate middleware

module.exports = router; 