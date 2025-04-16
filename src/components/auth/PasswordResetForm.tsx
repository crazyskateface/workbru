import React from 'react';
import { Link } from 'react-router';

interface PasswordResetFormProps {
    email: string;
    onEmailChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
    onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
    isLoading: boolean;
}

export const PasswordResetForm: React.FC<PasswordResetFormProps> = ({
    email,
    onEmailChange,
    onSubmit,
    isLoading
}) => {
    return (
        <div className="password-reset-form">
            <p>Enter your email address and we'll send you instructions to reset your password.</p>
            
            <form onSubmit={onSubmit} className="login-form">
                <div className="form-group">
                    <label htmlFor="email">Email</label>
                    <input
                        id="email"
                        type="email"
                        value={email}
                        onChange={onEmailChange}
                        required
                    />
                </div>
                
                <button 
                    type="submit" 
                    className="btn btn-primary login-button"
                    disabled={isLoading}
                >
                    {isLoading ? 'Sending...' : 'Reset Password'}
                </button>
            </form>
            
            <div className="login-footer">
                <Link to="/login" className="back-link">Back to Login</Link>
            </div>
        </div>
    );
};