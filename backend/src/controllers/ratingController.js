const Rating = require('../models/Rating');
const Course = require('../models/Course');

// Add a rating to a course (Student only)
exports.addRating = async (req, res) => {
    try {
        const { courseId } = req.params;
        const { rating, comment } = req.body;
        const userId = req.user._id; // Assuming user is attached to req by auth middleware

        // Check if the user has already rated this course (optional, depending on requirements)
        const existingRating = await Rating.findOne({ course: courseId, user: userId });
        if (existingRating) {
            return res.status(400).json({ message: 'You have already rated this course' });
        }

        const newRating = new Rating({
            rating,
            comment,
            user: userId,
            course: courseId
        });

        await newRating.save();

        // Add rating to the course's ratings list and recalculate average rating
        const course = await Course.findById(courseId).populate('ratings');
        course.ratings.push(newRating._id);

        // Recalculate average rating
        const totalRatings = course.ratings.length;
        const sumRatings = course.ratings.reduce((sum, r) => sum + r.rating, 0);
        course.averageRating = totalRatings > 0 ? sumRatings / totalRatings : 0;

        await course.save();

        res.status(201).json({ message: 'Rating added successfully', rating: newRating });
    } catch (error) {
        res.status(500).json({ message: 'Error adding rating', error: error.message });
    }
};

// Get ratings for a specific course
exports.getCourseRatings = async (req, res) => {
    try {
        const { courseId } = req.params;

        const ratings = await Rating.find({ course: courseId }).populate('user', 'name email'); // Populate user details

        res.json(ratings);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching ratings', error: error.message });
    }
};

// Optional: Get a single rating by ID
// exports.getRatingById = async (req, res) => { ... };

// Optional: Update a rating (User who created it only)
// exports.updateRating = async (req, res) => { ... };

// Optional: Delete a rating (User who created it or Admin)
// exports.deleteRating = async (req, res) => { ... }; 