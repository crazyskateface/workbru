import { useState } from 'react';
import { useNavigate } from 'react-router';
import { authService } from '../../services/workbru-auth';
import './auth-styles.css';

import { PasswordResetForm } from './PasswordResetForm';
import { PasswordResetConfirmation } from './PasswordResetConfirmation';
import { PasswordResetError } from './PasswordResetError'; 

const PasswordReset = () => {
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const navigate = useNavigate();

    const handleEmailChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setEmail(event.target.value);
    };

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            // Use auth service instead of direct API call
            await authService.requestPasswordReset(email);
            setSuccess(true);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="password-reset-container">
            <h1>Password Reset</h1>
            {success ? (
                <PasswordResetConfirmation />
            ) : error ? (
                <PasswordResetError message={error} />
            ) : (
                <PasswordResetForm
                    email={email}
                    onEmailChange={handleEmailChange}
                    onSubmit={handleSubmit}
                    isLoading={isLoading}
                />
            )}
        </div>
    );
}

export default PasswordReset;