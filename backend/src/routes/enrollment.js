const express = require('express');
const router = express.Router();
const enrollmentController = require('../controllers/enrollmentController');
const { auth, checkRole } = require('../middleware/auth');

// Enroll in a course (Student only)
router.post('/:courseId', auth, checkRole(['student']), enrollmentController.enrollStudent);

// Check enrollment status for a course (Student only)
router.get('/:courseId/status', auth, checkRole(['student']), enrollmentController.checkEnrollment);

// Optional: Route for unenrolling could be added here
// router.post('/:courseId/unenroll', auth, checkRole(['student']), enrollmentController.unenrollStudent);

module.exports = router; 