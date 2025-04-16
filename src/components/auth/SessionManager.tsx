import { useState, useEffect } from 'react';
import { authService } from '../../services/workbru-auth';
import './auth-styles.css';

interface Session {
  expiresAt: number;
  isValid: boolean;
  issuedAt: number;
  message: string;
  userId: string;
  username: string;
}

const SessionManager = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadSession();
  }, []);

  const loadSession = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const sessionsResponse = await authService.listSessions();
      console.log('Session data:', sessionsResponse);
      
      if (sessionsResponse && sessionsResponse.length > 0) {
        setSession(sessionsResponse[0]);
      } else {
        setError('No active session found.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load session');
    } finally {
      setIsLoading(false);
    }
  };

  const refreshSession = async () => {
    if (refreshing) return;
    
    setRefreshing(true);
    try {
      const refreshed = await authService.refreshCurrentSession();
      if (refreshed) {
        loadSession();
      } else {
        setError('Failed to refresh session');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to refresh session');
    } finally {
      setRefreshing(false);
    }
  };

  const formatDate = (timestamp: number): string => {
    return new Date(timestamp).toLocaleString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const calculateTimeRemaining = (expiresAt: number): string => {
    const now = Date.now();
    const remainingMs = expiresAt - now;
    
    if (remainingMs <= 0) {
      return 'Expired';
    }
    
    // Convert to minutes and hours
    const totalMinutes = Math.floor(remainingMs / (1000 * 60));
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m remaining`;
    } else {
      return `${minutes}m remaining`;
    }
  };

  const getExpirationClassName = (expiresAt: number): string => {
    const now = Date.now();
    const remainingMs = expiresAt - now;
    const remainingHours = remainingMs / (1000 * 60 * 60);
    
    if (remainingHours < 1) {
      return 'status-indicator inactive';
    }
    return '';
  };

  return (
    <div className="session-manager">
      <div className="session-manager-header">
        <h2>Session Information</h2>
        <div className="session-manager-actions">
          <button 
            className="btn btn-secondary"
            onClick={loadSession}
            disabled={isLoading}
          >
            <i className="fas fa-sync-alt"></i> Refresh
          </button>
          <button 
            className="btn btn-primary"
            onClick={refreshSession}
            disabled={isLoading || refreshing}
          >
            {refreshing ? (
              <>
                <i className="fas fa-spinner fa-spin"></i> Extending...
              </>
            ) : (
              <>
                <i className="fas fa-clock"></i> Extend Session
              </>
            )}
          </button>
        </div>
      </div>
      
      {error && <div className="error-message">{error}</div>}
      
      {isLoading ? (
        <div className="loading">
          <i className="fas fa-circle-notch fa-spin"></i> Loading session information...
        </div>
      ) : !session ? (
        <div className="no-sessions">No active session found.</div>
      ) : (
        <div className="session-details">
          <table className="session-table">
            <tbody>
              <tr>
                <td className="label">Status:</td>
                <td>
                  <span className={`status-indicator ${session.isValid ? 'active' : 'inactive'}`}>
                    {session.isValid ? 'Active' : 'Inactive'}
                  </span>
                </td>
              </tr>
              <tr>
                <td className="label">User ID:</td>
                <td>{session.userId}</td>
              </tr>
              <tr>
                <td className="label">Username:</td>
                <td>{session.username}</td>
              </tr>
              <tr>
                <td className="label">Created:</td>
                <td>{formatDate(session.issuedAt)}</td>
              </tr>
              <tr>
                <td className="label">Expires:</td>
                <td>
                  <span className={getExpirationClassName(session.expiresAt)}>
                    {formatDate(session.expiresAt)}
                  </span>
                  <span className="time-remaining">
                    ({calculateTimeRemaining(session.expiresAt)})
                  </span>
                </td>
              </tr>
              <tr>
                <td className="label">Message:</td>
                <td>{session.message}</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
      
      <div className="session-info">
        <h3>About Your Session</h3>
        <ul>
          <li>Your session will expire automatically after a period of inactivity.</li>
          <li>You can extend your current session by clicking the "Extend Session" button.</li>
          <li>For security reasons, always sign out when using shared devices.</li>
        </ul>
      </div>
    </div>
  );
};

export default SessionManager;