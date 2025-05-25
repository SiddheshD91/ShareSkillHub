import { Link, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { setLogout } from '../redux/authSlice';
import styles from './Header.module.css';

function Header() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { isLoggedIn } = useSelector((state) => state.auth);

  const handleLogoutClick = () => {
    dispatch(setLogout());
    localStorage.removeItem('jwtToken');
    navigate('/login');
  };

  return (
    <header className={styles.header}>
      <div className={styles.logo}>
        <h1>CourseHub</h1>
      </div>
      <nav className={styles.nav}>
        <ul>
          <li><Link to="/">Home</Link></li>
          <li><Link to="/courses">Courses</Link></li>
          <li><Link to="/about">About</Link></li>
          <li><Link to="/contact">Contact</Link></li>
          {isLoggedIn ? (
            <li><button onClick={handleLogoutClick} className={styles.logoutButton}>Logout</button></li>
          ) : (
            <>
              <li><Link to="/login">Login</Link></li>
              {/* Register link is on the Login page now */}
              {/* <li><Link to="/register">Register</Link></li> */}
            </>
          )}
        </ul>
      </nav>
    </header>
  );
}

export default Header; 