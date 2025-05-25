const Course = require('../models/Course');
const User = require('../models/User');

// Create a new course (Instructor only)
exports.createCourse = async (req, res) => {
    try {
        const { title, description, category, tags, pricing, content } = req.body;
        const instructorId = req.user._id; // Assuming user is attached to req by auth middleware
        const uploadedFiles = req.files; // Files information provided by multer (now an object with arrays)

        // Get the course image file
        const courseImageFile = uploadedFiles && uploadedFiles.courseImage ? uploadedFiles.courseImage[0] : null; // Assuming single image

        // Get the other course files
        const otherCourseFiles = uploadedFiles && uploadedFiles.courseFiles ? uploadedFiles.courseFiles : [];

        // Prepare course content data
        const courseContent = [];
        
        // Add course image URL to course data
        let courseImageUrl = null;
        if (courseImageFile) {
            courseImageUrl = `/uploads/${courseImageFile.filename}`; // Store the path relative to backend
        }

        // Process other course files
        if (otherCourseFiles.length > 0) {
            otherCourseFiles.forEach(file => {
                const contentType = file.mimetype.startsWith('video/') ? 'video' 
                                  : file.mimetype === 'application/pdf' ? 'pdf'
                                  : 'resource'; // Default or add more types

                courseContent.push({
                    title: file.originalname, // Use original name as title
                    type: contentType,
                    url: `/uploads/${file.filename}` // Store the path relative to backend
                    // Add text/quiz structure if needed based on content type
                });
            });
        }
        
        // If `content` was also sent in the body for other content types (like quizzes structure),
        // you can merge or process it here.
        if (content && Array.isArray(content)) {
             // Example: Merge content from body (e.g., quiz questions) with file content
             courseContent.push(...content);
        }

        const course = new Course({
            title,
            description,
            category,
            tags,
            pricing,
            instructor: instructorId,
            imageUrl: courseImageUrl, // Save the course image URL
            content: courseContent // Use the prepared content array
        });

        await course.save();

        // Add course to instructor's createdCourses list
        await User.findByIdAndUpdate(instructorId, { $push: { createdCourses: course._id } });

        res.status(201).json({ message: 'Course created successfully', course });
    } catch (error) {
        res.status(500).json({ message: 'Error creating course', error: error.message });
    }
};

// Get all courses
exports.getAllCourses = async (req, res) => {
    try {
        const courses = await Course.find().populate('instructor', 'name email'); // Populate instructor details
        res.json(courses);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching courses', error: error.message });
    }
};

// Get a single course by ID
exports.getCourseById = async (req, res) => {
    try {
        const course = await Course.findById(req.params.id)
            .populate('instructor', 'name email')
            .populate('ratings'); // Populate ratings (optional, could be a separate endpoint)

        if (!course) {
            return res.status(404).json({ message: 'Course not found' });
        }

        let isEnrolled = false;
        // Check if user is logged in and is a student
        if (req.user && req.user.role === 'student') {
            // Check if the student's ID is in the course's enrolledStudents array
            isEnrolled = course.enrolledStudents.includes(req.user._id);
        }

        // Send the course data along with enrollment status
        res.json({ ...course.toObject(), isEnrolled }); // Use toObject() to add properties to Mongoose document

    } catch (error) {
        console.error('Error fetching course by ID:', error);
        res.status(500).json({ message: 'Error fetching course', error: error.message });
    }
};

// Update a course (Instructor or Admin)
exports.updateCourse = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;
        const userId = req.user._id;
        const userRole = req.user.role;

        let findQuery = { _id: id };

        // If the user is an instructor, ensure they are the course owner
        if (userRole === 'instructor') {
            findQuery.instructor = userId;
        }

        // Admins can update any course, no need to add instructor check for them

        const course = await Course.findOneAndUpdate(
            findQuery,
            updates,
            { new: true }
        );

        if (!course) {
            return res.status(404).json({ message: 'Course not found or you are not authorized to update' });
        }

        res.json({ message: 'Course updated successfully', course });
    } catch (error) {
        res.status(500).json({ message: 'Error updating course', error: error.message });
    }
};

// Delete a course (Instructor only, must be the course owner, or Admin)
exports.deleteCourse = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user._id;
        const userRole = req.user.role; // Assuming role is on req.user

        const course = await Course.findOne({
            _id: id,
            $or: [{ instructor: userId }, { userRole: 'admin' }] // Allow instructor or admin to delete
        });

         if (!course) {
            return res.status(404).json({ message: 'Course not found or you are not authorized to delete' });
        }

        // Remove course from instructor's createdCourses list
        if (userRole !== 'admin') { // Only remove if instructor is deleting (and is the owner)
             await User.findByIdAndUpdate(course.instructor, { $pull: { createdCourses: course._id } });
        }

        // Note: You might also want to delete associated ratings here or handle them separately
        // Also consider deleting the actual files from the server/storage

        await Course.findByIdAndDelete(id);

        res.json({ message: 'Course deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting course', error: error.message });
    }
}; 