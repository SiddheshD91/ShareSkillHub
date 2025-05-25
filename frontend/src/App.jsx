import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { useState } from 'react';
import Home from './components/Home'
import Header from './components/Header'
import Footer from './components/Footer'
import Login from './components/Login'
import Register from './components/Register'
import CourseDetail from './components/CourseDetail'
import AddCourse from './components/AddCourse';
import PaymentPage from './components/PaymentPage';
import EditCourse from './components/EditCourse';
import './App.css'

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  // TODO: Implement logic to get user role, possibly from local storage or context
  const userRole = 'instructor'; // Placeholder: Replace with actual user role

  // The actual logout logic including navigation will be handled in Header
  const handleLogout = () => {
    setIsLoggedIn(false);
    // In a real app, you would clear tokens, etc.
  };

  return (
    <Router>
      <div className="app">
        <Header isLoggedIn={isLoggedIn} onLogout={handleLogout} />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login setIsLoggedIn={setIsLoggedIn} />} />
            <Route path="/register" element={<Register />} />
            <Route path="/courses/:id" element={<CourseDetail />} />
            {/* Add route for AddCourse, protected for instructors */}
            <Route 
              path="/add-course"
              element={userRole === 'instructor' ? <AddCourse /> : <Navigate to="/login" replace />}
            />
            {/* Add route for PaymentPage with course ID parameter */}
            <Route path="/payment/:courseId" element={<PaymentPage />} />
            {/* Add route for EditCourse with course ID parameter, protected for instructors and admins */}
            <Route 
              path="/edit-course/:courseId"
              element={(userRole === 'instructor' || userRole === 'admin') ? <EditCourse /> : <Navigate to="/login" replace />}
            />
            {/* Add more routes here as needed */}
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  )
}

export default App
