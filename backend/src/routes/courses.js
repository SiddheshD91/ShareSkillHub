const express = require('express');
const router = express.Router();
const courseController = require('../controllers/courseController');
const { auth, checkRole } = require('../middleware/auth');
const upload = require('../config/multerConfig'); // Import the multer config

// Get all courses (accessible by anyone)
router.get('/', courseController.getAllCourses);

// Get a single course by ID (accessible by anyone)
router.get('/:id', courseController.getCourseById);

// Create a new course (Instructor only) - Add multer middleware here
router.post('/', auth, checkRole(['instructor']), upload.fields([{ name: 'courseImage', maxCount: 1 }, { name: 'courseFiles', maxCount: 10 }]), courseController.createCourse);

// Update a course (Instructor only, must be the course owner)
router.patch('/:id', auth, checkRole(['instructor']), courseController.updateCourse);

// Delete a course (Instructor or Admin)
router.delete('/:id', auth, checkRole(['instructor', 'admin']), courseController.deleteCourse);

module.exports = router; 