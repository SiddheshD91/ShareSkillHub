import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import styles from './Register.module.css';

function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState(null); // State to handle registration errors
  const [loading, setLoading] = useState(false); // State to handle loading state
  const [success, setSuccess] = useState(false); // State to handle success state

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      setLoading(false);
      return;
    }

    try {
      // Assuming your backend registration endpoint is POST /api/auth/register on port 3001
      const response = await fetch('http://localhost:3001/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Handle specific backend errors if needed
        throw new Error(data.message || 'Registration failed');
      }

      // Assuming successful registration, maybe the backend returns user data or a success message
      console.log('Registration successful:', data);
      setSuccess(true);
      // Optionally clear form or redirect after a short delay
      setEmail('');
      setPassword('');
      setConfirmPassword('');

      // Redirect to login page after successful registration
      navigate('/login');

    } catch (err) {
      console.error('Registration error:', err);
      setError(err.message);
      setSuccess(false);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleRegister = () => {
    // Handle Google OAuth registration logic here
    console.log('Google Register clicked');
    // Redirect to your backend's Google OAuth initiation endpoint
    window.location.href = 'http://localhost:3001/auth/google'; // Assuming this is your Google OAuth endpoint
  };

  return (
    <div className={styles.registerContainer}>
      <h2>Register</h2>
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
        <div className={styles.formGroup}>
          <label htmlFor="confirmPassword">Confirm Password:</label>
          <input
            type="password"
            id="confirmPassword"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
        </div>
        {error && <div className={styles.errorMessage}>Error: {error}</div>}
        {success && <div className={styles.successMessage}>Registration successful!</div>}
        <button type="submit" className={styles.registerButton} disabled={loading}>
          {loading ? 'Registering...' : 'Register'}
        </button>
      </form>

      <div className={styles.googleRegister}>
        <button onClick={handleGoogleRegister} className={styles.googleButton}>
          Sign up with Google
        </button>
      </div>
    </div>
  );
}

export default Register; 