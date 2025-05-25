import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux'; // Import useSelector
import styles from './CourseDetail.module.css';

function CourseDetail() {
  const { id } = useParams(); // Get the course ID from the URL
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEnrolled, setIsEnrolled] = useState(false); // State to track enrollment status

  // Get user data from Redux store
  const { user, isLoggedIn } = useSelector((state) => state.auth);

  // TODO: Replace with actual login status, user role, and user ID from your authentication state management
  // const isLoggedIn = true; // Placeholder
  // const userRole = 'instructor'; // Placeholder
  // const loggedInUserId = 'Replace with actual logged-in user ID'; // TODO: Get actual logged-in user ID dynamically
  const userRole = user?.role; // Get user role from Redux state
  const loggedInUserId = user?.id; // Get user ID from Redux state using 'id'

  console.log('CourseDetail - isLoggedIn:', isLoggedIn); // Debugging log
  console.log('CourseDetail - userRole:', userRole); // Debugging log
  console.log('CourseDetail - loggedInUserId:', loggedInUserId); // Debugging log

  const navigate = useNavigate(); // Initialize useNavigate

  useEffect(() => {
    // Function to fetch a specific course by ID
    async function fetchCourse() {
      try {
        // Use relative path with proxy
        const response = await fetch(`/api/courses/${id}`);

        if (!response.ok) {
           const errorData = await response.json();
           // Check for the specific backend error indicating already enrolled
           if (response.status === 400 && errorData.message && errorData.message.includes('already enrolled')) {
               console.log('Student already enrolled in this course (handled).');
               setIsEnrolled(true); // Set enrolled state
               setCourse(null); // Clear course data as we are only showing enrolled message (optional, depends on desired display)
               setError(null); // Explicitly clear any error state
               setLoading(false); // Stop loading
               return; // Stop further processing in this try block
           }
           // For any other non-OK response (that is not the 'already enrolled' specific error), throw an error
           console.error(`Fetch error for course ${id}:`, response.status, errorData.message);
           throw new Error(`HTTP error! status: ${response.status}, Message: ${errorData.message || response.statusText}`);
        }

        // If the response is OK, process the course data
        const data = await response.json();
        console.log('Course data fetched successfully:', data);
        setCourse(data);
        // Assume backend includes isEnrolled status in the successful response too
        setIsEnrolled(data.isEnrolled || false); // Set isEnrolled based on backend data, default to false
        setLoading(false);
        setError(null); // Clear any previous error on successful fetch
        console.log('CourseDetail - course.instructor:', data.instructor);
        console.log('CourseDetail - isEnrolled from fetch:', data.isEnrolled);

      } catch (error) {
        console.error(`Caught error fetching course ${id}:`, error);
        setError(error.message);
        setLoading(false);
        setCourse(null); // Clear course data on error
        setIsEnrolled(false); // Ensure isEnrolled is false on error
      }
    }

    fetchCourse();
  }, [id, userRole]); // Re-run effect if the ID or userRole changes

  const handleEnroll = async () => {
    if (!isLoggedIn) {
      console.log('User not logged in. Redirect to login.');
      // Implement navigation to login page
      return;
    }

    if (userRole !== 'student') {
      console.log('Only students can enroll.');
      return;
    }

    // If already enrolled, do nothing or show a message (button should be disabled)
     if (isEnrolled) {
         console.log('Student already enrolled.');
         return;
     }

    try {
      const endpoint = `/api/enrollment/${id}`;
      const method = 'POST';
      const token = localStorage.getItem('jwtToken');
      const headers = {
         'Content-Type': 'application/json',
         'Authorization': `Bearer ${token}`
      };

      const response = await fetch(endpoint, { method, headers }); // Simplified body for now
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Enrollment failed');
      }

      console.log('Enrollment initiation successful:', data);

      // Assuming the backend response for paid courses includes a redirect or payment intent info
      // For now, we'll just navigate to the payment page if the course is paid.
       if (course && course.pricing > 0) {
            navigate(`/payment/${id}`);
       } else {
            // Free enrollment successful
            console.log('Free enrollment successful:', data);
            setIsEnrolled(true); // Update state
       }

    } catch (error) {
      console.error('Enrollment error:', error);
      setError(error.message || 'An error occurred during enrollment.');
    }
  };

  if (loading) return <div className={styles.loading}>Loading course details...</div>;

  // If student is logged in, is a student role, and is marked as enrolled
  // This check comes before any error handling.
  if (isLoggedIn && userRole === 'student' && isEnrolled) {
     console.log('Rendering already enrolled message for enrolled student.');
     return (
        <div className={styles.container}>
           <h1 className={styles.alreadyEnrolledMessage}>You are already enrolled in this course</h1>
           {/* Optionally add a link to the course content or dashboard here */}
           {/* You might also want to fetch and display the course content here if the student is enrolled */}
        </div>
     );
  }

  // Handle errors (only if not loading and not already handled as enrolled above)
  if (error && !loading) return <div className={styles.error}>Error loading course details: {error}</div>;

  // If course is not found after loading and no other conditions met
  if (!loading && !course) return <div className={styles.notFound}>Course not found.</div>;

  // If not enrolled (or not a student), show full course details
  // This condition implicitly covers: !loading && !error && course && (!isEnrolled || userRole !== 'student')
  return (
    <div className={styles.container}>
      <h1>{course.title}</h1>
      {course.imageUrl && <img src={course.imageUrl} alt={`${course.title} Image`} className={styles.courseImage} />}
      <p>{course.description}</p>
      <div className={styles.details}>
        <span>Category: {course.category}</span>
        <span>Pricing: ${course.pricing}</span>
        {course.tags && course.tags.length > 0 && (
          <span>Tags: {course.tags.join(', ')}</span>
        )}
      </div>

      {/* Edit Course Button (visible to the instructor who owns the course) */}
      {isLoggedIn && userRole === 'instructor' && course && course.instructor && course.instructor._id === loggedInUserId && (
        <div className={styles.editButtonContainer}>
          <button className={styles.editButton} onClick={() => navigate(`/edit-course/${course._id}`)}>Edit Course</button>
        </div>
      )}

      {/* Enroll Button (visible to students who are not enrolled) */}
      {isLoggedIn && userRole === 'student' && !isEnrolled && (
        <div className={styles.enrollButtonContainer}>
             <button className={styles.enrollButton} onClick={handleEnroll}>Enroll Now</button>
        </div>
      )}
       {/* Enrolled Button (visible to students who ARE enrolled) - This block is technically redundant now
           because of the isEnrolled check at the top, but kept for clarity in rendering buttons */}
        {/* {isLoggedIn && userRole === 'student' && isEnrolled && (
             <div className={styles.enrollButtonContainer}>
                 <button className={styles.enrolledButton} disabled>Enrolled</button>
             </div>
        )} */}

      {/* Show content only if course is loaded AND (it's not a student OR the student IS enrolled) */}
      {course.content && course.content.length > 0 && (userRole !== 'student' || isEnrolled) && (
        <div className={styles.contentSection}>
          <h3>Course Content</h3>
          <ul>
            {course.content.map((item, index) => (
              <li key={index}>
                {item.type === 'video' && <p>Video: {item.title} (<a href={item.url} target="_blank" rel="noopener noreferrer">Watch</a>)</p>}
                {item.type === 'pdf' && <p>PDF: {item.title} (<a href={item.url} target="_blank" rel="noopener noreferrer">View PDF</a>)</p>}
                {item.type === 'quiz' && <p>Quiz: {item.title} (Questions: {item.text})</p>}
                {item.type === 'resource' && <p>Resource: {item.title} (<a href={item.url} target="_blank" rel="noopener noreferrer">Access Resource</a>)</p>}
                {!item.type && <p>Untitled Content Item</p>}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default CourseDetail; 