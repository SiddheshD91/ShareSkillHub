import React, { useState } from 'react';
import styles from './AddCourse.module.css'; // We will create this CSS module later

function AddCourse() {
  const [courseDetails, setCourseDetails] = useState({
    title: '',
    description: '',
    category: '', // Added category field
    tags: '', // Added tags field (will handle as comma-separated string initially)
    pricing: 0, // Added pricing field
  });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCourseDetails({ ...courseDetails, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');

    const courseData = { ...courseDetails }; // Use courseDetails directly
    // Note: No file uploads are included in this version

    try {
      // TODO: Replace with your actual backend API endpoint for adding courses
      const response = await fetch('/api/courses', { 
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(courseData), // Send as JSON
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to add course');
      }

      setMessage('Course added successfully!');
      // Optionally reset the form
      setCourseDetails({
        title: '',
        description: '',
        category: '',
        tags: '',
        pricing: 0,
      });

    } catch (err) {
      console.error('Error adding course:', err);
      setError(err.message || 'An error occurred while adding the course.');
    }
  };

  return (
    <div className={styles.addCourseContainer}>
      <h2>Add New Course</h2>
      <form onSubmit={handleSubmit}>
        <div className={styles.formGroup}>
          <label htmlFor="title">Course Title:</label>
          <input
            type="text"
            id="title"
            name="title"
            value={courseDetails.title}
            onChange={handleInputChange}
            required
          />
        </div>
        <div className={styles.formGroup}>
          <label htmlFor="description">Description:</label>
          <textarea
            id="description"
            name="description"
            value={courseDetails.description}
            onChange={handleInputChange}
            required
          />
        </div>
        <div className={styles.formGroup}>
          <label htmlFor="category">Category:</label>
          <input
            type="text"
            id="category"
            name="category"
            value={courseDetails.category}
            onChange={handleInputChange}
            required
          />
        </div>
        <div className={styles.formGroup}>
          <label htmlFor="tags">Tags (comma-separated):</label>
          <input
            type="text"
            id="tags"
            name="tags"
            value={courseDetails.tags}
            onChange={handleInputChange}
            placeholder="e.g., web development, react, nodejs"
          />
        </div>
        <div className={styles.formGroup}>
          <label htmlFor="pricing">Pricing:</label>
          <input
            type="number"
            id="pricing"
            name="pricing"
            value={courseDetails.pricing}
            onChange={handleInputChange}
            required
            min="0"
          />
        </div>

        <button type="submit" className={styles.submitButton}>Add Course</button>
      </form>
      {message && <p className={styles.successMessage}>{message}</p>}
      {error && <p className={styles.errorMessage}>{error}</p>}
    </div>
  );
}

export default AddCourse; 