import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { authService } from '../../services/workbru-auth';
import './auth-styles.css';

const PasswordResetConfirm = () => {
    const [email, setEmail] = useState('');
    const [confirmationCode, setConfirmationCode] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setError(null);

        // Validate passwords match
        if (newPassword !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        // Validate password strength
        if (newPassword.length < 8) {
            setError('Password must be at least 8 characters long');
            return;
        }

        setIsLoading(true);

        try {
            await authService.confirmPasswordReset(email, confirmationCode, newPassword);
            setSuccess(true);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    if (success) {
        return (
            <div className="password-reset-container">
                <div className="password-reset-confirm-success">
                    <h3>Password Reset Complete</h3>
                    <p>Your password has been successfully reset.</p>
                    <p>You can now log in with your new password.</p>
                    <div className="login-footer">
                        <Link to="/login" className="btn btn-primary">Go to Login</Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="password-reset-container">
            <h1>Reset Your Password</h1>
            
            {error && <div className="error-message">{error}</div>}
            
            <div className="password-reset-form">
                <p>Enter the confirmation code that was sent to your email along with your new password.</p>
                
                <form onSubmit={handleSubmit} className="login-form">
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
                        <label htmlFor="code">Confirmation Code</label>
                        <input
                            id="code"
                            type="text"
                            value={confirmationCode}
                            onChange={(e) => setConfirmationCode(e.target.value)}
                            required
                        />
                    </div>
                    
                    <div className="form-group">
                        <label htmlFor="newPassword">New Password</label>
                        <input
                            id="newPassword"
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            required
                        />
                    </div>
                    
                    <div className="form-group">
                        <label htmlFor="confirmPassword">Confirm Password</label>
                        <input
                            id="confirmPassword"
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
                        {isLoading ? 'Resetting Password...' : 'Reset Password'}
                    </button>
                </form>
                
                <div className="login-footer">
                    <Link to="/login" className="back-link">Back to Login</Link>
                </div>
            </div>
        </div>
    );
};

export default PasswordResetConfirm;