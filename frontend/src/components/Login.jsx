import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { setLogin } from '../redux/authSlice';
import styles from './Login.module.css';

function Login({ setIsLoggedIn }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null); // State to handle login errors
  const [loading, setLoading] = useState(false); // State to handle loading state

  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const from = location.state?.from?.pathname || '/'; // Get the previous path or default to home

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/login', { // Assuming this is your login endpoint
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      console.log('Login response data:', data); // Debugging log

      if (!response.ok) {
        // Handle specific backend errors if needed, e.g., invalid credentials
        throw new Error(data.message || 'Login failed');
      }

      // Assuming the backend sends back user data (including role) and a token
      // The backend response structure is assumed to be { user: { _id, name, role, ... }, token: '...' }
      const { user, token } = data; 

      if (user && token) {
        // Dispatch setLogin action to update Redux store
        dispatch(setLogin({ user, token }));
        
        localStorage.setItem('jwtToken', token); // Store the token (optional, depending on your auth strategy)
        // setIsLoggedIn(true); // No longer needed if using Redux state for login status
        navigate(from, { replace: true }); // Navigate to the previous page or home
      } else {
        throw new Error('Login successful but required data (user or token) not received.');
      }

    } catch (err) {
      console.error('Login error:', err);
      setError(err.message);
      // setIsLoggedIn(false); // No longer needed if using Redux state
      localStorage.removeItem('jwtToken'); // Remove any potentially stale token
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    // Handle Google OAuth login logic here
    console.log('Google Login clicked');
    // Redirect to your backend's Google OAuth initiation endpoint
    window.location.href = 'http://localhost:3001/auth/google'; // Assuming this is your Google OAuth endpoint
  };

  return (
    <div className={styles.loginContainer}>
      <h2>Login</h2>
      <form onSubmit={handleSubmit}>
        <div className={styles.formGroup}>
          <label htmlFor="email">Email:</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className={styles.formGroup}>
          <label htmlFor="password">Password:</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        {error && <div className={styles.errorMessage}>{error}</div>}
        <button type="submit" className={styles.loginButton} disabled={loading}>
          {loading ? 'Logging in...' : 'Login'}
        </button>
      </form>

      <p className={styles.registerLink}>
        Don't have an account? <Link to="/register">Register here</Link>
      </p>

      <div className={styles.googleLogin}>
        <button onClick={handleGoogleLogin} className={styles.googleButton}>
          Sign in with Google
        </button>
      </div>
    </div>
  );
}

export default Login; 