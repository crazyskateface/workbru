import React from 'react';
import { Link } from 'react-router';

interface PasswordResetErrorProps {
    message: string;
}

export const PasswordResetError: React.FC<PasswordResetErrorProps> = ({ message }) => {
    return (
        <div className="password-reset-error">
            <div className="error-container">
                <h3>Password Reset Failed</h3>
                <p>{message}</p>
                <p>
                    Please try again or contact support if the problem persists.
                </p>
            </div>
            
            <div className="login-footer">
                <Link to="/login" className="back-link">Back to Login</Link>
                <span className="separator">|</span>
                <Link to="/password-reset" className="back-link">Try Again</Link>
            </div>
        </div>
    );
};