import { Amplify } from 'aws-amplify';

// Define the user type that will be used throughout the application
export type User = {
    id: string;
    username: string;
    email: string;
    givenName: string;
    isAdmin: boolean;
    idToken?: string; // Add idToken to User type
    refreshToken?: string;
};

// Authentication response types
type AuthTokens = {
    idToken: string;
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
};

type UserAttributes = {
    email?: string;
    given_name?: string;
    'custom:isAdmin'?: string;
    [key: string]: string | undefined;
};

type AuthResponseUser = {
    id?: string;
    username: string;
    attributes?: UserAttributes;
};

type AuthResponse = {
    message: {
        tokens?: AuthTokens;
        user?: AuthResponseUser;
        isAdmin?: boolean;
        message?: string;
        challengeName?: string;
        session?: string;
        userAttributes?: string;
        requiredAttributes?: string[];
        userId?: string;
        csrfToken?: string; // Added to handle new CSRF token system
    }
};

// API constants
const BASE_URL = "https://wvhn624cd3.execute-api.us-east-1.amazonaws.com/v1/";

// Cached user data
let currentUser: User | null = null;
let csrfToken: string | null = null;
const CSRF_STORAGE_KEY = 'csrf_token';
const USER_STORAGE_KEY = 'auth_user';

// Maximum number of retries for CSRF token rotation
const MAX_CSRF_RETRIES = 3;

// Store the CSRF token received from the server
const storeCsrfToken = (token: string): void => {
    csrfToken = token;
    localStorage.setItem(CSRF_STORAGE_KEY, token);
};

// Get the current CSRF token
const getCsrfToken = (): string | null => {
    if (csrfToken) return csrfToken;
    
    const storedToken = localStorage.getItem(CSRF_STORAGE_KEY);
    if (storedToken) {
        csrfToken = storedToken;
        return storedToken;
    }
    
    return null;
};

// Extract CSRF token from response headers if present
const updateCsrfTokenFromResponse = (response: Response): void => {
    const newCsrfToken = response.headers.get('X-CSRF-Token');
    if (newCsrfToken) {
        storeCsrfToken(newCsrfToken);
    }
};

// Handle API request with CSRF token retry logic
const apiRequestWithRetry = async (
    url: string, 
    options: RequestInit, 
    retryCount = 0
): Promise<Response> => {
    try {
        // If in development mode, ensure CORS is properly configured
        if (isDevelopment() && !options.mode) {
            options.mode = 'cors';
        }
        
        // Add Authorization header with ID token if available and not already set
        // This is needed for the Cognito authorizer in API Gateway
        if (currentUser?.idToken && options.headers) {
            // Check if headers is Headers instance or plain object and add Authorization header
            if (options.headers instanceof Headers) {
                if (!options.headers.has('Authorization')) {
                    options.headers.set('Authorization', `Bearer ${currentUser.idToken}`);
                }
            } else {
                const headers = options.headers as Record<string, string>;
                if (!headers['Authorization']) {
                    headers['Authorization'] = `Bearer ${currentUser.idToken}`;
                }
            }
        }
        
        const response = await fetch(url, options);
        console.log('apiRequestWithRetry response:', response);
        // Check for a new CSRF token in the response and update our stored token
        updateCsrfTokenFromResponse(response);
        
        // If the request failed due to an invalid CSRF token and we have retries left
        if (response.status === 403 && 
            retryCount < MAX_CSRF_RETRIES) {
            
            // Try to extract error message - handle case where response might not be JSON
            let errorMessage = '';
            try {
                const errorData = await response.json();
                errorMessage = errorData.message || '';
            } catch (e) {
                // If we can't parse JSON, just continue
            }
            
            if (errorMessage.includes('CSRF')) {
                // Update the CSRF token in the request headers and retry
                if (options.headers) {
                    const currentToken = getCsrfToken();
                    if (currentToken) {
                        if (options.headers instanceof Headers) {
                            options.headers.set('X-CSRF-Token', currentToken);
                        } else {
                            (options.headers as Record<string, string>)['X-CSRF-Token'] = currentToken;
                        }
                    }
                }
                
                // Retry the request with the updated token
                return apiRequestWithRetry(url, options, retryCount + 1);
            }
        }
        
        return response;
    } catch (error) {
        console.error('API request failed:', error);
        throw error;
    }
};

// Helper to determine if we need to refresh the session
const shouldRefreshSession = (): boolean => {
    // Sessions are managed by HTTP-only cookies on the server side
    // This is just a heuristic to determine if we should attempt a refresh
    return !!currentUser && !document.cookie.includes('sessionId');
};

// Check if running in development mode
const isDevelopment = (): boolean => {
    return window.location.hostname === 'localhost' || 
           window.location.hostname === '127.0.0.1';
};

// Refresh the session
const refreshSession = async (): Promise<boolean> => {
    try {
        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
            'X-CSRF-Token': getCsrfToken() || ''
        };
        
        // Add Bearer token for Cognito authorization if available
        console.log('[refreshSession] currentUser:', currentUser);
        console.log('[refreshSession] idToken:', currentUser?.idToken);

        if (currentUser?.idToken) {
            headers['Authorization'] = `Bearer ${currentUser.idToken}`;
        }
        
        // Create base options for the request
        const options: RequestInit = {
            method: 'PUT',
            headers,
            credentials: 'include', // Include cookies in the request
            mode: 'cors' // Always use cors mode for cross-origin requests
        };
        
        // Call the session refresh endpoint
        const response = await fetch(`${BASE_URL}users/session`, options);
        
        if (!response.ok) {
            console.warn('Session refresh failed:', response.status, response.statusText);
            return false;
        }
        
        const data = await response.json();
        
        // If we received a new CSRF token, update it
        if (data.message?.csrfToken) {
            storeCsrfToken(data.message.csrfToken);
        }
        
        // If we received new tokens, update the current user
        if (data.message?.tokens?.idToken) {
            if (currentUser) {
                currentUser.idToken = data.message.tokens.idToken;
                
                if (data.message.tokens.refreshToken) {
                    currentUser.refreshToken = data.message.tokens.refreshToken;
                }
                
                // Store updated user info
                localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(currentUser));
            }
        }
        
        return true;
    } catch (error) {
        console.error('Session refresh error:', error);
        return false;
    }
};

// Auth service with methods for login, logout, etc.
export const authService = {
    // Check if user is logged in
    isAuthenticated(): boolean {
        return !!currentUser;
    },

    // Get current user
    getCurrentUser(): User | null {
        return currentUser;
    },

    // Check if current user is admin
    isAdmin(): boolean {
        return currentUser?.isAdmin || false;
    },

    // Login with username and password
    async login(username: string, password: string): Promise<User> {
        try {
            console.log('Login attempt for user:', username);
            
            // Simple login - just send username and password directly
            const loginPayload = { 
                username, 
                password 
            };
            
            // For login, don't include the CSRF token in the first request
            // The server will provide a new CSRF token in the response
            const response = await fetch(`${BASE_URL}auth`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(loginPayload),
                credentials: 'include', // Include cookies in the request
                mode: isDevelopment() ? 'cors' : undefined
            });

            // Get response data - needed whether the request succeeded or failed
            const data = await response.json();
            console.log('Login response:', data);
            
            // Update CSRF token from response headers if present
            updateCsrfTokenFromResponse(response);

            // Also check for CSRF token in the response body (it might be there instead of in headers)
            if (data && data.csrfToken) {
                storeCsrfToken(data.csrfToken);
            } else if (data.message && data.message.csrfToken) {
                storeCsrfToken(data.message.csrfToken);
            }

            // Handle unsuccessful response
            if (!response.ok) {
                // Handle specific error cases
                if (response.status === 401) {
                    throw new Error('Invalid username or password');
                } else if (response.status === 403 && data.message === 'CSRF token required') {
                    // For CSRF errors, try to handle it gracefully
                    console.warn('CSRF token was required but not available. This should be handled by the server for login requests.');
                }
                
                // Handle password reset required case
                if (data.message && typeof data.message === 'object' && 
                    data.message.requiresPasswordReset === true) {
                    
                    throw {
                        type: 'PASSWORD_RESET_REQUIRED',
                        username: username,
                        message: 'Password reset required for your account. Please follow the reset process.',
                        errorId: data.message.errorId
                    };
                }
                
                // Generic error for other failures
                throw new Error(data.message || 'Login failed. Please check your credentials.');
            }

            // If we got here, it's a successful login
            // Extract user data and create the user object
            const responseUser = data.user || (data.message && data.message.user);
            const responseIsAdmin = data.isAdmin === true || (data.message && data.message.isAdmin === true);
            
            if (!responseUser) {
                throw new Error('User data missing from authentication response');
            }
            
            // Extract tokens from the response if available
            let idToken = null;
            let refreshToken = null;
            
            // Check both normalized and nested structures
            if (data.tokens) {
                idToken = data.tokens.idToken;
                refreshToken = data.tokens.refreshToken;
            } else if (data.message && data.message.tokens) {
                idToken = data.message.tokens.idToken;
                refreshToken = data.message.tokens.refreshToken;
            }
            
            // Create user object with token info
            currentUser = {
                id: responseUser.id || responseUser.username || username,
                username: responseUser.username || username,
                email: responseUser.attributes?.email || '',
                givenName: responseUser.attributes?.given_name || '',
                isAdmin: responseIsAdmin,
                idToken: idToken,
                refreshToken: refreshToken
            };
            
            localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(currentUser));
            
            return currentUser;
        } catch (error) {
            console.error('Login error:', error);
            if (error && typeof error === 'object' && 'type' in error) {
                throw error; // Rethrow specific error types to be handled by the UI
            }
            throw new Error(error instanceof Error ? error.message : 'An unknown error occurred');
        }
    },

    // Initiate password reset process (when PASSWORD_RESET_REQUIRED is encountered)
    async initiatePasswordReset(username: string): Promise<boolean> {
        try {
            const response = await fetch(`${BASE_URL}auth/forgot-password`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username }),
                credentials: 'include',
                mode: isDevelopment() ? 'cors' : undefined
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to initiate password reset');
            }

            // Password reset initiated successfully
            return true;
        } catch (error) {
            console.error('Password reset initiation error:', error);
            throw new Error(error instanceof Error ? error.message : 'Failed to initiate password reset');
        }
    },

    // Complete password reset with code and new password (after PASSWORD_RESET_REQUIRED)
    async completePasswordReset(username: string, confirmationCode: string, newPassword: string): Promise<boolean> {
        try {
            const response = await fetch(`${BASE_URL}auth/forgot-password/confirm`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    username,
                    confirmationCode,
                    newPassword
                }),
                credentials: 'include',
                mode: isDevelopment() ? 'cors' : undefined
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to complete password reset');
            }

            // Password reset completed successfully
            return true;
        } catch (error) {
            console.error('Password reset completion error:', error);
            throw new Error(error instanceof Error ? error.message : 'Failed to complete password reset');
        }
    },

    // Complete a password challenge
    async completePasswordChallenge(
        username: string, 
        newPassword: string, 
        session?: string,
        userAttributes?: Record<string, string>
    ): Promise<User> {
        try {
            console.log('Completing password challenge for user:', username);
            
            // Build the challenge payload - only include userAttributes if provided
            const challengePayload: Record<string, any> = {
                username,
                newPassword
            };
            
            // Only add session to the payload if it was provided
            // It might be missing in a generateSession flow
            if (session) {
                challengePayload.session = session;
            }
            
            // Only add userAttributes to the payload if they were provided
            if (userAttributes && Object.keys(userAttributes).length > 0) {
                challengePayload.userAttributes = userAttributes;
            }
            
            // Don't include CSRF token when generating a new session
            // The server will create a new CSRF token and send it back after successful challenge
            const headers: Record<string, string> = {
                'Content-Type': 'application/json'
            };
            
            // Only add CSRF token if we have one and we're not in a generateSession flow
            const currentToken = getCsrfToken();
            if (currentToken) {
                headers['X-CSRF-Token'] = currentToken;
            }
            
            const response = await fetch(`${BASE_URL}auth/challenge`, {
                method: 'POST',
                headers,
                body: JSON.stringify(challengePayload),
                credentials: 'include' // Include cookies in the request
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to complete password challenge');
            }

            // Update CSRF token from response headers
            updateCsrfTokenFromResponse(response);
            
            const data = await response.json();
            
            // Store new CSRF token if received in the response body
            if (data.message && data.message.csrfToken) {
                storeCsrfToken(data.message.csrfToken);
            }
            
            // Extract user data from the new response format
            const responseUser = data.message.user;
            const responseIsAdmin = data.message.isAdmin === true;
            
            // Create user object
            currentUser = {
                id: responseUser?.id || username,
                username: username,
                email: responseUser?.attributes?.email || '',
                givenName: responseUser?.attributes?.given_name || '',
                isAdmin: responseIsAdmin
            };
            
            localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(currentUser));
            
            return currentUser;
        } catch (error) {
            console.error('Challenge completion error:', error);
            throw new Error(error instanceof Error ? error.message : 'Failed to complete password challenge');
        }
    },

    // Register a new user
    async register(username: string, password: string, email: string, givenName: string): Promise<{ username: string }> {
        try {
            const response = await apiRequestWithRetry(`${BASE_URL}auth/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-Token': getCsrfToken() || ''
                },
                body: JSON.stringify({
                    username,
                    password,
                    email,
                    given_name: givenName
                }),
                credentials: 'include' // Include cookies in the request
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Registration failed');
            }

            const data = await response.json();
            
            // Store new CSRF token if received in the response body
            if (data.message && data.message.csrfToken) {
                storeCsrfToken(data.message.csrfToken);
            }
            
            return { username: data.username || username };
        } catch (error) {
            console.error('Registration error:', error);
            throw new Error(error instanceof Error ? error.message : 'Registration failed');
        }
    },

    // Confirm registration with verification code
    async confirmRegistration(username: string, confirmationCode: string): Promise<boolean> {
        try {
            const response = await apiRequestWithRetry(`${BASE_URL}auth/register/confirm`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-Token': getCsrfToken() || ''
                },
                body: JSON.stringify({
                    username,
                    confirmationCode
                }),
                credentials: 'include' // Include cookies in the request
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to confirm registration');
            }

            const data = await response.json();
            
            // Store new CSRF token if received in the response body
            if (data.message && data.message.csrfToken) {
                storeCsrfToken(data.message.csrfToken);
            }
            
            return true;
        } catch (error) {
            console.error('Confirmation error:', error);
            throw new Error(error instanceof Error ? error.message : 'Failed to confirm registration');
        }
    },
    
    // Request password reset (forgot password)
    async requestPasswordReset(email: string): Promise<boolean> {
        try {
            const response = await apiRequestWithRetry(`${BASE_URL}auth/forgot-password`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-Token': getCsrfToken() || ''
                },
                body: JSON.stringify({ email }),
                credentials: 'include' // Include cookies in the request
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to request password reset');
            }

            const data = await response.json();
            
            // Store new CSRF token if received in the response body
            if (data.message && data.message.csrfToken) {
                storeCsrfToken(data.message.csrfToken);
            }
            
            // Even if user doesn't exist, we don't want to reveal that for security reasons
            return true;
        } catch (error) {
            console.error('Password reset request error:', error);
            throw new Error(error instanceof Error ? error.message : 'Failed to request password reset');
        }
    },

    // Confirm password reset with code and new password
    async confirmPasswordReset(email: string, confirmationCode: string, newPassword: string): Promise<boolean> {
        try {
            const response = await apiRequestWithRetry(`${BASE_URL}auth/reset-password`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-Token': getCsrfToken() || ''
                },
                body: JSON.stringify({
                    email,
                    confirmationCode,
                    newPassword
                }),
                credentials: 'include' // Include cookies in the request
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to reset password');
            }

            const data = await response.json();
            
            // Store new CSRF token if received in the response body
            if (data.message && data.message.csrfToken) {
                storeCsrfToken(data.message.csrfToken);
            }
            
            return true;
        } catch (error) {
            console.error('Password reset confirmation error:', error);
            throw new Error(error instanceof Error ? error.message : 'Failed to reset password');
        }
    },

    // Logout
    async logout(): Promise<void> {
        try {
            // Call the logout endpoint to invalidate the session
            await apiRequestWithRetry(`${BASE_URL}auth/logout`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-Token': getCsrfToken() || ''
                },
                credentials: 'include' // Include cookies in the request
            });
        } catch (error) {
            console.warn('Error during logout:', error);
            // Continue with local logout even if server logout fails
        } finally {
            // Always clear local state
            currentUser = null;
            csrfToken = null;
            localStorage.removeItem(USER_STORAGE_KEY);
            localStorage.removeItem(CSRF_STORAGE_KEY);
        }
    },
    
    // Update user profile
    async updateProfile(username: string, attributes: {givenName?: string}): Promise<User> {
        // Try to refresh the session if needed
        if (shouldRefreshSession()) {
            const refreshed = await refreshSession();
            if (!refreshed) {
                throw new Error('Authentication required');
            }
        }
        
        try {
            // Send update request with standardized attribute names
            const response = await apiRequestWithRetry(`${BASE_URL}users/${username}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-Token': getCsrfToken() || ''
                },
                body: JSON.stringify({
                    givenName: attributes.givenName
                }),
                credentials: 'include' // Include cookies in the request
            });
            
            if (!response.ok) {
                throw new Error('Failed to update profile');
            }
            
            const data = await response.json();
            
            // Store new CSRF token if received in the response body
            if (data.message && data.message.csrfToken) {
                storeCsrfToken(data.message.csrfToken);
            }
            
            // Update current user with new data
            if (currentUser) {
                currentUser = {
                    ...currentUser,
                    givenName: attributes.givenName || currentUser.givenName
                };
                localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(currentUser));
            }
            
            return currentUser!;
        } catch (error) {
            console.error('Update profile error:', error);
            throw new Error(error instanceof Error ? error.message : 'An unknown error occurred');
        }
    },
    
    // Refresh the current session
    async refreshCurrentSession(): Promise<boolean> {
        return refreshSession();
    },
    
    // Check authentication status and refresh if needed
    async checkAuthStatus(): Promise<boolean> {
        if (!currentUser) {
            return false;
        }
        
        if (shouldRefreshSession()) {
            return refreshSession();
        }
        
        return true;
    },
    
    // List all active sessions
    async listSessions(): Promise<any[]> {
        try {
            console.log('Listing sessions for user:', currentUser?.username);
            const headers: HeadersInit = {
                'Content-Type': 'application/json'
            };
            if (currentUser?.idToken) {
                headers['Authorization'] = `Bearer ${currentUser.idToken}`;
            }
            
            // Add CSRF token if available
            const currentToken = getCsrfToken();
            if (currentToken) {
                headers['X-CSRF-Token'] = currentToken;
            }

            // Prepare the request with proper credentials
            const options: RequestInit = {
                method: 'GET',
                headers,
                credentials: 'include',
                mode: 'cors'
            };
            
            console.log('Making request to list sessions with options:', { 
                headers: Object.fromEntries(headers instanceof Headers ? 
                    Array.from(headers.entries()) : 
                    Object.entries(headers)),
                credentials: options.credentials,
                mode: options.mode
            });
            
            const response = await fetch(`${BASE_URL}users/session`, options);
            console.log('Sessions response status:', response.status);
            console.log('Sessions response cookies:', document.cookie);
            
            if (!response.ok) {
                console.error('Failed to list sessions, status:', response.status);
                throw new Error('Failed to list sessions');
            }
            
            const data = await response.json();
            console.log(data)
            return [data];
        } catch (error) {
            console.error('List sessions error:', error);
            throw new Error(error instanceof Error ? error.message : 'An unknown error occurred');
        }
    },
    
    // Invalidate a specific session
    async invalidateSession(sessionId: string): Promise<boolean> {
        try {
            const response = await apiRequestWithRetry(`${BASE_URL}auth/session/${sessionId}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-Token': getCsrfToken() || '',
                    'Authorization': `Bearer ${currentUser?.idToken}`
                },
                credentials: 'include' // Include cookies in the request
            });
            
            if (!response.ok) {
                throw new Error('Failed to invalidate session');
            }
            
            return true;
        } catch (error) {
            console.error('Invalidate session error:', error);
            throw new Error(error instanceof Error ? error.message : 'An unknown error occurred');
        }
    },
    
    // Initialize - check for existing session
    init(): void {
        const savedUser = localStorage.getItem(USER_STORAGE_KEY);
        if (savedUser) {
            try {
                currentUser = JSON.parse(savedUser);
                
                // Load CSRF token if available
                const savedToken = localStorage.getItem(CSRF_STORAGE_KEY);
                if (savedToken) {
                    csrfToken = savedToken;
                }
                
                // Check authentication status
                this.checkAuthStatus().then(isAuthenticated => {
                    if (!isAuthenticated) {
                        // If session validation failed, log out the user
                        // this.logout();
                    }
                });
            } catch (e) {
                localStorage.removeItem(USER_STORAGE_KEY);
            }
        }
    }
};

// Initialize on import
authService.init();