import React from 'react';
import { Link } from 'react-router';

export const PasswordResetConfirmation: React.FC = () => {
    return (
        <div className="password-reset-confirmation">
            <div className="success-message">
                <h3>Check Your Email</h3>
                <p>
                    We've sent password reset instructions to your email address.
                    Please check your inbox and follow the link to reset your password.
                </p>
                <p>
                    If you don't receive an email within a few minutes, please check your spam folder
                    or try again with the correct email address.
                </p>
            </div>
            
            <div className="login-footer">
                <Link to="/login" className="back-link">Back to Login</Link>
                <span className="separator">|</span>
                <Link to="/password-reset-confirm" className="back-link">Enter Reset Code</Link>
            </div>
        </div>
    );
};