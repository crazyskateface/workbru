import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router';
import { authService } from '../../services/workbru-auth';
import Logout from './Logout';
import './auth-styles.css';

// Types for password challenge and reset
type PasswordResetRequired = {
    type: string;
    username: string;
    message: string;
    errorId?: string;
};

const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isAdmin, setIsAdmin] = useState(false);
    
    // Password reset required state
    const [passwordResetRequired, setPasswordResetRequired] = useState<PasswordResetRequired | null>(null);
    const [resetInitiated, setResetInitiated] = useState(false);
    const [resetCode, setResetCode] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmNewPassword, setConfirmNewPassword] = useState('');
    
    const navigate = useNavigate();

    // Check if user is already logged in
    useEffect(() => {
        const checkAuth = () => {
            const isAuth = authService.isAuthenticated();
            const admin = authService.isAdmin();
            setIsAuthenticated(isAuth);
            setIsAdmin(admin);
            
            // If already logged in as admin, redirect to admin page
            if (isAuth && admin) {
                navigate('/admin');
            }
        };
        
        checkAuth();
    }, [navigate]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            // Call the login function from our auth service
            const user = await authService.login(username, password);
            
            // If login is successful, check if user is admin
            if (user.isAdmin) {
                // Redirect to admin dashboard
                navigate('/admin');
            } else {
                // Redirect to home page for regular users
                navigate('/');
            }
        } catch (err) {
            // Check if we received a password reset required response
            if (err && typeof err === 'object' && 'type' in err && err.type === 'PASSWORD_RESET_REQUIRED') {
                // Store the password reset required info
                setPasswordResetRequired(err as PasswordResetRequired);
                console.log('Password reset required:', err);
            } else {
                setError(err instanceof Error ? err.message : 'Failed to login');
            }
        } finally {
            setIsLoading(false);
        }
    };

    // When the user needs to reset their password
    const handleInitiateReset = async () => {
        if (!passwordResetRequired) return;
        
        setIsLoading(true);
        setError('');
        
        try {
            // Call the service to initiate the password reset
            const success = await authService.initiatePasswordReset(passwordResetRequired.username);
            if (success) {
                setResetInitiated(true);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to initiate password reset');
        } finally {
            setIsLoading(false);
        }
    };

    // When the user submits the reset code and new password
    const handleCompleteReset = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!passwordResetRequired) {
            setError('Password reset information is missing');
            return;
        }
        
        // Validate passwords match
        if (newPassword !== confirmNewPassword) {
            setError('Passwords do not match');
            return;
        }

        // Validate password strength
        if (newPassword.length < 8) {
            setError('Password must be at least 8 characters long');
            return;
        }

        setIsLoading(true);
        setError('');
        
        try {
            // Call the service to complete the password reset
            const success = await authService.completePasswordReset(
                passwordResetRequired.username,
                resetCode,
                newPassword
            );
            
            if (success) {
                // Show success message and redirect to login
                setPasswordResetRequired(null);
                setResetInitiated(false);
                setError(''); // Clear any errors
                
                // Try to log in with the new credentials
                try {
                    const user = await authService.login(passwordResetRequired.username, newPassword);
                    
                    // If login is successful, check if user is admin
                    if (user.isAdmin) {
                        // Redirect to admin dashboard
                        navigate('/admin');
                    } else {
                        // Redirect to home page for regular users
                        navigate('/');
                    }
                } catch (loginErr) {
                    // Password reset successful but login failed
                    // Just show a success message and let them log in manually
                    alert('Password has been reset successfully. Please log in with your new password.');
                    setPassword(''); // Clear the password field
                }
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to reset password');
        } finally {
            setIsLoading(false);
        }
    };

    // If already authenticated but not admin
    if (isAuthenticated && !isAdmin) {
        return (
            <div className="login-container">
                <div className="login-card">
                    <h2>Access Denied</h2>
                    <p>Your account does not have admin privileges.</p>
                    <div className="login-footer">
                        <Link to="/" className="back-link">Back to Home</Link>
                        <br />
                        <br />
                        <Logout />
                    </div>
                </div>
            </div>
        );
    }

    // Show the password reset required screen
    if (passwordResetRequired) {
        // If the reset has been initiated, show the form to enter the code and new password
        if (resetInitiated) {
            return (
                <div className="login-container">
                    <div className="login-card">
                        <h2>Reset Your Password</h2>
                        <p>A verification code has been sent to your email. Please enter the code and your new password below.</p>
                        
                        {error && <div className="error-message">{error}</div>}
                        
                        <form onSubmit={handleCompleteReset} className="login-form">
                            <div className="form-group">
                                <label htmlFor="reset-code">Verification Code</label>
                                <input
                                    id="reset-code"
                                    type="text"
                                    value={resetCode}
                                    onChange={(e) => setResetCode(e.target.value)}
                                    required
                                />
                            </div>
                            
                            <div className="form-group">
                                <label htmlFor="new-password">New Password</label>
                                <input
                                    id="new-password"
                                    type="password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    required
                                />
                            </div>
                            
                            <div className="form-group">
                                <label htmlFor="confirm-password">Confirm Password</label>
                                <input
                                    id="confirm-password"
                                    type="password"
                                    value={confirmNewPassword}
                                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                                    required
                                />
                            </div>
                            
                            <button 
                                type="submit" 
                                className="btn btn-primary login-button"
                                disabled={isLoading}
                            >
                                {isLoading ? 'Resetting Password...' : 'Reset Password'}
                            </button>
                        </form>
                        
                        <div className="login-footer">
                            <button 
                                className="back-link"
                                onClick={() => {
                                    setPasswordResetRequired(null);
                                    setResetInitiated(false);
                                }}
                            >
                                Back to Login
                            </button>
                        </div>
                    </div>
                </div>
            );
        }
        
        // Show the initial password reset required screen
        return (
            <div className="login-container">
                <div className="login-card">
                    <h2>Password Reset Required</h2>
                    <p>{passwordResetRequired.message}</p>
                    
                    {error && <div className="error-message">{error}</div>}
                    
                    <div className="form-actions">
                        <button 
                            className="btn btn-primary login-button"
                            onClick={handleInitiateReset}
                            disabled={isLoading}
                        >
                            {isLoading ? 'Sending Reset Code...' : 'Send Reset Code'}
                        </button>
                    </div>
                    
                    <div className="login-footer">
                        <button 
                            className="back-link"
                            onClick={() => setPasswordResetRequired(null)}
                        >
                            Back to Login
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Regular login form
    return (
        <div className="login-container">
            <div className="login-card">
                <h2>Admin Login</h2>
                
                {error && <div className="error-message">{error}</div>}
                
                <form onSubmit={handleSubmit} className="login-form">
                    <div className="form-group">
                        <label htmlFor="username">Username</label>
                        <input
                            id="username"
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                        />
                    </div>
                    
                    <div className="form-group">
                        <label htmlFor="password">Password</label>
                        <input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>
                    
                    <button 
                        type="submit" 
                        className="btn btn-primary login-button"
                        disabled={isLoading}
                    >
                        {isLoading ? 'Logging in...' : 'Login'}
                    </button>
                </form>
                
                <div className="login-footer">
                    <Link to="/" className="back-link">Back to Home</Link>
                    <span className="separator">|</span>
                    <Link to="/password-reset" className="back-link">Forgot Password?</Link>
                </div>
            </div>
        </div>
    );
};

export default Login;