import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router';
import { authService } from '../../services/workbru-auth';
import './auth-styles.css';

const logout = () => {
    
    const handleLogout = async () => {
        await authService.logout();
        // Redirect to login or home page
        window.location.href = '/';
    };

    return (
        <div className="logout-container">
            <button className="btn btn-danger" onClick={handleLogout}>Logout</button>
        </div>
    );
}

export default logout;