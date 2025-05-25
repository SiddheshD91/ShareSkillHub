import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import styles from './Home.module.css';

function Home() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Get user data from Redux store
  const { user, isLoggedIn } = useSelector((state) => state.auth);

  // Determine if the user is an instructor (using actual role from Redux)
  const isInstructor = isLoggedIn && user && user.role === 'instructor';

  useEffect(() => {
    // Function to get courses from the backend
    async function fetchCourses() {
      try {
        const response = await fetch('/api/courses');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setCourses(data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching courses:', error);
        setError(error.message);
        setLoading(false);
      }
    }

    fetchCourses();
  }, []);

  return (
    <div className={styles.home}>
      {/* Personalized Greeting */}
      {isLoggedIn && user && (
        <h2 className={styles.greeting}>Hi {user.name} ({user.role})</h2>
      )}
      
      <h1>Our Courses</h1>
      
      {/* Add course button/link for instructors */}
      {isInstructor && (
        <div className={styles.addCourseLinkContainer}>
          <Link to="/add-course" className={styles.addCourseButton}>Add New Course</Link>
        </div>
      )}

      {loading ? (
        <div>
          <p>Loading courses...</p>
        </div>
      ) : error ? (
         <div className={styles.error}>Error loading courses: {error}</div>
      ) : courses.length > 0 ? (
        <div className={styles.coursesList}>
          {courses.map((course) => (
            <div key={course._id} className={styles.courseBox}>
              <Link to={`/courses/${course._id}`} className={styles.courseLink}>
                <h2>{course.title}</h2>
                <p>{course.description}</p>
                <div>
                  <span>Duration: {course.duration}</span>
                  <span>Level: {course.level}</span>
                </div>
              </Link>
            </div>
          ))}
        </div>
       ) : (
         <div>
            <p>No courses found.</p>
         </div>
       )}
    </div>
  );
}

export default Home; 