import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom'; // Import useNavigate
import styles from './EditCourse.module.css';

function EditCourse() {
  const { courseId } = useParams(); // Get courseId from URL
  console.log('EditCourse - courseId from useParams:', courseId); // Debugging log
  const navigate = useNavigate(); // Initialize useNavigate
  const [course, setCourse] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    pricing: 0,
    tags: '',
    imageUrl: '',
    // Add other editable fields here
  });
  const [contentItems, setContentItems] = useState([]); // State for course content
  const [editingIndex, setEditingIndex] = useState(null); // State to track which content item index is being edited
  const [isAddingNew, setIsAddingNew] = useState(false); // State to track if a new item is being added
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSaving, setIsSaving] = useState(false); // State for saving process
  const [isDeleting, setIsDeleting] = useState(false); // State for deleting process

  useEffect(() => {
    async function fetchCourse() {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch(`/api/courses/${courseId}`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setCourse(data);
        // Initialize form data with fetched course data
        setFormData({
          title: data.title || '',
          description: data.description || '',
          category: data.category || '',
          pricing: data.pricing || 0,
          tags: data.tags ? data.tags.join(', ') : '', // Convert array to string for input
          imageUrl: data.imageUrl || '',
          // Initialize other fields
        });
        setContentItems(data.content || []); // Initialize content items
        setLoading(false);
      } catch (error) {
        console.error(`Error fetching course ${courseId}:`, error);
        setError(error.message);
        setLoading(false);
      }
    }

    if (courseId) {
      fetchCourse();
    }
  }, [courseId]); // Re-run effect if courseId changes

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  // Handle input changes for content items
  const handleContentInputChange = (index, e) => {
    const { name, value } = e.target;
    const updatedContent = [...contentItems];
    updatedContent[index] = {
      ...updatedContent[index],
      [name]: value,
    };
    setContentItems(updatedContent);
  };

  // Handle adding a new content item
  const handleAddContent = (type) => {
    // Determine initial structure based on type
    let newItem;
    if (type === 'video' || type === 'resource') {
      newItem = { type, title: '', url: '' };
    } else if (type === 'pdf') {
       newItem = { type, title: '', url: '' }; // Assuming PDF also has title and URL
    } else if (type === 'quiz') {
      newItem = { type, title: '', text: '' }; // Assuming quiz has title and text/questions
    } else {
      newItem = { type, title: '' }; // Default basic structure
    }

    setContentItems([...contentItems, newItem]);
    setEditingIndex(contentItems.length); // Set editing index to the new item's index
    setIsAddingNew(true);
  };

  // Handle editing an existing content item
  const handleEditContent = (index) => {
    setEditingIndex(index);
    setIsAddingNew(false);
  };

  // Handle removing a content item
  const handleRemoveContent = (index) => {
    if (window.confirm('Are you sure you want to remove this content item?')) {
      const updatedContent = contentItems.filter((_, i) => i !== index);
      setContentItems(updatedContent);
      // If the removed item was being edited, clear the editing state
      if (editingIndex === index) {
        setEditingIndex(null);
        setIsAddingNew(false);
      } else if (editingIndex !== null && editingIndex > index) {
         // If removing an item before the edited one, adjust the editing index
         setEditingIndex(editingIndex - 1);
      }
    }
  };

  // Handle saving changes to a content item
  const handleSaveContent = () => {
    setEditingIndex(null);
    setIsAddingNew(false);
    // No need to update contentItems state here, as handleContentInputChange already does it.
  };

  // Handle canceling content item editing
  const handleCancelEdit = () => {
     if (isAddingNew) {
       // If canceling a new item, remove it from the list
       const updatedContent = contentItems.filter((_, i) => i !== editingIndex);
       setContentItems(updatedContent);
     }
    setEditingIndex(null);
    setIsAddingNew(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);

    // Prevent saving if a content item is currently being edited
    if (editingIndex !== null) {
       setError('Please save or cancel the current content item edit before saving the course.');
       setIsSaving(false);
       return;
    }

    try {
      // Prepare data for backend (convert tags string back to array)
      const dataToSave = {
        ...formData,
        tags: formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0),
        content: contentItems, // Include content items
        // Add other necessary fields or transformations
      };

      const response = await fetch(`/api/courses/${courseId}`, {
        method: 'PATCH', // Changed from PUT to PATCH
        headers: {
          'Content-Type': 'application/json',
          // Include authorization token if needed
          'Authorization': `Bearer ${localStorage.getItem('jwtToken')}` // Example
        },
        body: JSON.stringify(dataToSave),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to update course');
      }

      console.log('Course updated successfully:', result);
      // Redirect to course detail page after successful update
      navigate(`/courses/${courseId}`);

    } catch (error) {
      console.error('Error saving course:', error);
      setError(error.message || 'An error occurred while saving.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this course?')) {
      setIsDeleting(true);
      setError(null);

      try {
        const response = await fetch(`/api/courses/${courseId}`, {
          method: 'DELETE',
          headers: {
            // Include authorization token if needed
            'Authorization': `Bearer ${localStorage.getItem('jwtToken')}` // Example
          },
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.message || 'Failed to delete course');
        }

        console.log('Course deleted successfully:', result);
        // Redirect to home page or courses list after successful deletion
        navigate('/'); // Or wherever appropriate

      } catch (error) {
        console.error('Error deleting course:', error);
        setError(error.message || 'An error occurred while deleting.');
      } finally {
        setIsDeleting(false);
      }
    }
  };

  if (loading) return <div className={styles.loading}>Loading course details...</div>;
  if (error && !course) return <div className={styles.error}>Error loading course details: {error}</div>;
  if (!course && !loading) return <div className={styles.notFound}>Course not found.</div>;

  // Display error message even if course data is loaded (e.g., save error)
  return (
    <div className={styles.container}>
      <h2>Edit Course: {course.title}</h2>
      {error && <div className={styles.errorMessage}>{error}</div>}
      <form onSubmit={handleSubmit}>
        <div className={styles.formGroup}>
          <label htmlFor="title">Title:</label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleInputChange}
            required
          />
        </div>
        <div className={styles.formGroup}>
          <label htmlFor="description">Description:</label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
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
            value={formData.category}
            onChange={handleInputChange}
            required
          />
        </div>
        <div className={styles.formGroup}>
          <label htmlFor="pricing">Pricing:</label>
          <input
            type="number"
            id="pricing"
            name="pricing"
            value={formData.pricing}
            onChange={handleInputChange}
            required
            min="0"
          />
        </div>
        <div className={styles.formGroup}>
          <label htmlFor="tags">Tags (comma-separated):</label>
          <input
            type="text"
            id="tags"
            name="tags"
            value={formData.tags}
            onChange={handleInputChange}
          />
        </div>
         <div className={styles.formGroup}>
          <label htmlFor="imageUrl">Image URL:</label>
          <input
            type="text"
            id="imageUrl"
            name="imageUrl"
            value={formData.imageUrl}
            onChange={handleInputChange}
          />
        </div>

        {/* Course Content Section */}
        <div className={styles.contentSection}>
          <h3>Course Content</h3>
          {!isAddingNew && editingIndex === null && (
            <div className={styles.contentAddButtons}>
              <button type="button" onClick={() => handleAddContent('video')}>Add Video</button>
              <button type="button" onClick={() => handleAddContent('pdf')}>Add PDF</button>
              <button type="button" onClick={() => handleAddContent('quiz')}>Add Quiz</button>
              <button type="button" onClick={() => handleAddContent('resource')}>Add Resource</button>
            </div>
          )}

          <ul>
            {contentItems.map((item, index) => (
              <li key={index} className={styles.contentItem}>
                {editingIndex === index ? (
                  // Render editable form fields when editing
                  <div className={styles.contentEditForm}>
                    <input
                      type="text"
                      name="title"
                      placeholder="Title"
                      value={item.title || ''}
                      onChange={(e) => handleContentInputChange(index, e)}
                    />
                     {/* Add more fields based on item.type */}
                     {(item.type === 'video' || item.type === 'pdf' || item.type === 'resource') && (
                        <input
                           type="text"
                           name="url"
                           placeholder="URL"
                           value={item.url || ''}
                           onChange={(e) => handleContentInputChange(index, e)}
                        />
                     )}
                      {item.type === 'quiz' && (
                        <textarea
                           name="text"
                           placeholder="Questions (e.g., JSON or plain text)"
                           value={item.text || ''}
                           onChange={(e) => handleContentInputChange(index, e)}
                        />
                      )}
                    <button type="button" onClick={handleSaveContent}>Save</button>
                    <button type="button" onClick={handleCancelEdit}>Cancel</button>
                  </div>
                ) : (
                  // Render item details and buttons when not editing
                  <>
                    <span>{item.type}: {item.title || item.text}</span>
                    <button type="button" onClick={() => handleEditContent(index)}>Edit</button>
                    <button type="button" onClick={() => handleRemoveContent(index)}>Remove</button>
                  </>
                )}
              </li>
            ))}
          </ul>
        </div>

        {/* Add input fields for other editable fields */}
        <button type="submit" className={styles.saveButton} disabled={isSaving || editingIndex !== null}>
          {isSaving ? 'Saving...' : 'Save Changes'}
        </button>

        <button type="button" className={styles.deleteButton} onClick={handleDelete} disabled={isDeleting || editingIndex !== null}>
          {isDeleting ? 'Deleting...' : 'Delete Course'}
        </button>
      </form>
    </div>
  );
}

export default EditCourse; 