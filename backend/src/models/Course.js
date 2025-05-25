const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        required: true
    },
    category: {
        type: String,
        required: true,
        trim: true
    },
    tags: [
        {
            type: String,
            trim: true
        }
    ],
    pricing: {
        type: Number,
        required: true,
        min: 0
    },
    instructor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    content: [
        {
            title: { type: String },
            type: { type: String, enum: ['video', 'pdf', 'quiz', 'resource'] },
            url: { type: String }, // For video URLs, resource URLs, PDF links
            text: { type: String }, // For quiz questions/structure, text resources
            // Add more fields as needed for different content types
        }
    ],
    ratings: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Rating'
        }
    ],
    averageRating: {
        type: Number,
        default: 0
    },
    enrolledStudents: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }
    ],
    createdAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

const Course = mongoose.model('Course', courseSchema);

module.exports = Course; 