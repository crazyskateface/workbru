import { Outlet, Link, useLocation, useNavigate } from 'react-router';
import { useState, useEffect } from 'react';
import { authService } from '../../services/workbru-auth';
import './admin-styles.css';

const AdminLayout = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isAdmin, setIsAdmin] = useState(false);
    const [userName, setUserName] = useState('');

    useEffect(() => {
        // Check authentication status when component mounts
        const checkAuth = () => {
            const isAuth = authService.isAuthenticated();
            const admin = authService.isAdmin();
            const user = authService.getCurrentUser();
            
            setIsAuthenticated(isAuth);
            setIsAdmin(admin);
            setUserName(user?.givenName || '');
        };
        
        checkAuth();
        
        // Listen for storage events (for cross-tab logout)
        const handleStorageChange = () => {
            checkAuth();
        };
        
        window.addEventListener('storage', handleStorageChange);
        return () => {
            window.removeEventListener('storage', handleStorageChange);
        };
    }, []);

    // Session refresh logic - refresh when needed
    useEffect(() => {
        // Check if we should refresh the session
        const checkSessionRefresh = async () => {
            if (isAuthenticated) {
                await authService.checkAuthStatus();
            }
        };

        // Check immediately, then set up periodic checks
        checkSessionRefresh();
        
        // Check every 5 minutes to keep session alive for active users
        const intervalId = setInterval(checkSessionRefresh, 5 * 60 * 1000);
        
        return () => clearInterval(intervalId);
    }, [isAuthenticated]);

    const handleLogout = async () => {
        await authService.logout();
        setIsAuthenticated(false);
        setIsAdmin(false);
        setUserName('');
        // Redirect to login or home page
        window.location.href = '/';
    };
    
    const handleLoginClick = () => {
        navigate('/login');
    };

    // If not authenticated or not admin, show login button
    if (!isAuthenticated || !isAdmin) {
        return (
            <div className="admin-login">
                <h1>WorkBru Admin</h1>
                <p>You need to login with admin privileges to access this area.</p>
                <div className="admin-login-actions">
                    <button 
                        className="btn btn-primary login-btn"
                        onClick={handleLoginClick}
                    >
                        Login as Admin
                    </button>
                    <Link to="/" className="btn btn-secondary">Back to Home</Link>
                </div>
            </div>
        );
    }

    return (
        <div className="admin-layout">
            <header className="admin-header">
                <div className="logo">
                    <h1>WorkBru Admin</h1>
                </div>
                <div className="auth-controls">
                    <span className="welcome-message">Welcome, {userName}</span>
                    <div className="dropdown">
                        <button className="btn btn-secondary">Account</button>
                        <div className="dropdown-content">
                            <Link to="/sessions">Manage Sessions</Link>
                            <button 
                                className="logout-btn"
                                onClick={handleLogout}
                            >
                                Logout
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            <div className="admin-container">
                <nav className="admin-sidebar">
                    <ul>
                        <li className={location.pathname === '/admin' ? 'active' : ''}>
                            <Link to="/admin">Dashboard</Link>
                        </li>
                        <li className={location.pathname.includes('/admin/places') ? 'active' : ''}>
                            <Link to="/admin/places">Places</Link>
                        </li>
                        <li>
                            <Link to="/sessions">Manage Sessions</Link>
                        </li>
                        <li>
                            <Link to="/">View Site</Link>
                        </li>
                    </ul>
                </nav>

                <main className="admin-content">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default AdminLayout;
