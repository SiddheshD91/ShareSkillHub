import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux'
import { store } from './redux/store'
import { setLogin } from './redux/authSlice'
import './index.css'
import App from './App.jsx'

// Function to check for token and fetch user data on startup
const loadUserFromToken = async () => {
  const token = localStorage.getItem('jwtToken');
  if (token) {
    try {
      // Fetch user data using the token
      const response = await fetch('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        // If token is invalid or expired, remove it and clear auth state
        localStorage.removeItem('jwtToken');
        // Although setLogout isn't strictly needed here as initial state is logged out,
        // it's good practice if we were initializing from server-rendered state.
        // store.dispatch(setLogout());
        throw new Error('Failed to fetch user data with token');
      }

      const userData = await response.json();
      // Dispatch setLogin to populate Redux store
      store.dispatch(setLogin({ user: userData, token }));
      console.log('User loaded from token and state updated.', userData);

    } catch (error) {
      console.error('Error loading user from token:', error);
      // Clean up token if fetching fails
      localStorage.removeItem('jwtToken');
    }
  }
};

// Call the function to load user data before rendering the app
loadUserFromToken();

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Provider store={store}>
      <App />
    </Provider>
  </StrictMode>,
)
