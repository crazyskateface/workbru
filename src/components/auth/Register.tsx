import { useState } from 'react';
import { useNavigate, Link } from 'react-router';
import { authService } from '../../services/workbru-auth';
import './auth-styles.css';

const Register = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [email, setEmail] = useState('');
    const [givenName, setGivenName] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    
    // State for confirmation code flow
    const [isRegistered, setIsRegistered] = useState(false);
    const [confirmationCode, setConfirmationCode] = useState('');
    
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        
        // Validate passwords match
        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        // Validate password strength
        if (password.length < 8) {
            setError('Password must be at least 8 characters long');
            return;
        }

        setIsLoading(true);

        try {
            // Register the user
            await authService.register(username, password, email, givenName);
            setIsRegistered(true);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Registration failed');
        } finally {
            setIsLoading(false);
        }
    };

    const handleConfirmationSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            // Confirm registration
            const success = await authService.confirmRegistration(username, confirmationCode);
            
            if (success) {
                // Redirect to login page
                navigate('/login', { state: { message: 'Registration successful! You can now log in.' } });
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to confirm registration');
        } finally {
            setIsLoading(false);
        }
    };

    // Show confirmation code form after successful registration
    if (isRegistered) {
        return (
            <div className="login-container">
                <div className="login-card">
                    <h2>Verify Your Account</h2>
                    <p>We've sent a verification code to your email address. Please enter it below.</p>
                    
                    {error && <div className="error-message">{error}</div>}
                    
                    <form onSubmit={handleConfirmationSubmit} className="login-form">
                        <div className="form-group">
                            <label htmlFor="confirmation-code">Confirmation Code</label>
                            <input
                                id="confirmation-code"
                                type="text"
                                value={confirmationCode}
                                onChange={(e) => setConfirmationCode(e.target.value)}
                                required
                            />
                        </div>
                        
                        <button 
                            type="submit" 
                            className="btn btn-primary login-button"
                            disabled={isLoading}
                        >
                            {isLoading ? 'Verifying...' : 'Verify Account'}
                        </button>
                    </form>
                    
                    <div className="login-footer">
                        <Link to="/login" className="back-link">Back to Login</Link>
                    </div>
                </div>
            </div>
        );
    }

    // Registration form
    return (
        <div className="login-container">
            <div className="login-card">
                <h2>Create an Account</h2>
                
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
                        <label htmlFor="email">Email</label>
                        <input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>
                    
                    <div className="form-group">
                        <label htmlFor="given-name">Your Name</label>
                        <input
                            id="given-name"
                            type="text"
                            value={givenName}
                            onChange={(e) => setGivenName(e.target.value)}
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
                    
                    <div className="form-group">
                        <label htmlFor="confirm-password">Confirm Password</label>
                        <input
                            id="confirm-password"
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                        />
                    </div>
                    
                    <button 
                        type="submit" 
                        className="btn btn-primary login-button"
                        disabled={isLoading}
                    >
                        {isLoading ? 'Registering...' : 'Register'}
                    </button>
                </form>
                
                <div className="login-footer">
                    <p>Already have an account? <Link to="/login" className="link">Log in</Link></p>
                </div>
            </div>
        </div>
    );
};

export default Register;