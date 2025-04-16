import { Place, PlaceSchema } from '../models/place';
import { authService } from './workbru-auth';

const BASE_URL = "https://wvhn624cd3.execute-api.us-east-1.amazonaws.com/v1/" // get from env? 

// Maximum number of retries for CSRF token rotation
const MAX_CSRF_RETRIES = 3;

// Check if running in development mode
const isDevelopment = (): boolean => {
    return window.location.hostname === 'localhost' || 
           window.location.hostname === '127.0.0.1';
};

// Extract CSRF token from response headers if present
const updateCsrfTokenFromResponse = (response: Response): void => {
  const newCsrfToken = response.headers.get('X-CSRF-Token');
  if (newCsrfToken && localStorage) {
    localStorage.setItem('csrf_token', newCsrfToken);
  }
};

// Handle API request with CSRF token retry logic
const apiRequestWithRetry = async (
  url: URL | string, 
  options: RequestInit, 
  retryCount = 0
): Promise<Response> => {
  try {
    // If in development mode, ensure CORS is properly configured
    if (isDevelopment() && !options.mode) {
      options.mode = 'cors';
    }
    
    const response = await fetch(url, options);
    
    // Check for a new CSRF token in the response
    updateCsrfTokenFromResponse(response);
    
    // If the request failed due to an invalid CSRF token and we have retries left
    if (response.status === 403 && 
        retryCount < MAX_CSRF_RETRIES) {
      
      // Try to extract error message - handle case where response might not be JSON
      let errorMessage = '';
      try {
        if (response.headers.get('Content-Type')?.includes('application/json')) {
          const errorData = await response.json();
          errorMessage = errorData.message || '';
        }
      } catch (e) {
        // If we can't parse JSON, just continue
      }
      
      if (errorMessage.includes('CSRF')) {
        // Get the latest CSRF token
        const currentToken = localStorage.getItem('csrf_token');
        
        if (currentToken && options.headers) {
          // Update headers with new token
          if (options.headers instanceof Headers) {
            options.headers.set('X-CSRF-Token', currentToken);
          } else {
            (options.headers as Record<string, string>)['X-CSRF-Token'] = currentToken;
          }
          
          // Retry the request with the updated token
          return apiRequestWithRetry(url, options, retryCount + 1);
        }
      }
    }
    
    return response;
  } catch (error) {
    console.error('API request failed:', error);
    throw error;
  }
};

async function apiGet<T>(path: string, params?: Record<string, string>): Promise<T> {
  // Get CSRF token
  const csrfToken = localStorage.getItem('csrf_token');
  const headers: HeadersInit = {
    'Content-Type': 'application/json'
  };
  
  // Add CSRF token if available
  if (csrfToken) {
    headers['X-CSRF-Token'] = csrfToken;
  }
  
  // Add Authorization header with ID token if available
  // This is needed for the Cognito authorizer in API Gateway
  const currentUser = authService.getCurrentUser();
  if (currentUser?.idToken) {
    headers['Authorization'] = `Bearer ${currentUser.idToken}`;
  }

  // path: /places
  const url = new URL(BASE_URL + path)
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.set(key, value);
    });
  }

  const options = {
    method: 'GET',
    headers,
    credentials: 'include' as RequestCredentials, // Include cookies in the request
    mode: isDevelopment() ? 'cors' as RequestMode : undefined // Set CORS mode in development
  };

  const response = await apiRequestWithRetry(url, options);
  if (!response.ok) {
    // Handle 401 by redirecting to login page if appropriate
    if (response.status === 401) {
      console.error('Authentication error, session may have expired');
      // Clear authentication state
      await authService.logout();
      // Redirect to login page if we're in a browser environment
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }
    throw new Error(response.statusText);
  }
  return await response.json() as T;
}

async function apiPost<T>(path: string, data: any): Promise<T> {
  // Get CSRF token
  const csrfToken = localStorage.getItem('csrf_token');
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  
  // Add CSRF token if available
  if (csrfToken) {
    headers['X-CSRF-Token'] = csrfToken;
  }
  
  // Add Authorization header with ID token if available
  const currentUser = authService.getCurrentUser();
  if (currentUser?.idToken) {
    headers['Authorization'] = `Bearer ${currentUser.idToken}`;
  }
  
  const url = new URL(BASE_URL + path);
  
  const options = {
    method: "POST",
    headers,
    body: JSON.stringify(data),
    credentials: 'include' as RequestCredentials, // Include cookies in the request
    mode: isDevelopment() ? 'cors' as RequestMode : undefined // Set CORS mode in development
  };
  
  const response = await apiRequestWithRetry(url, options);
  if (!response.ok) {
    // Handle 401 by redirecting to login page if appropriate
    if (response.status === 401) {
      console.error('Authentication error, session may have expired');
      // Clear authentication state
      await authService.logout();
      // Redirect to login page if we're in a browser environment
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }
    throw new Error(response.statusText);
  }
  return await response.json() as T;
}

async function apiPut<T>(path: string, data: any): Promise<T> {
  // Get CSRF token
  const csrfToken = localStorage.getItem('csrf_token');
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  
  // Add CSRF token if available
  if (csrfToken) {
    headers['X-CSRF-Token'] = csrfToken;
  }
  
  // Add Authorization header with ID token if available
  const currentUser = authService.getCurrentUser();
  if (currentUser?.idToken) {
    headers['Authorization'] = `Bearer ${currentUser.idToken}`;
  }
  
  const url = new URL(BASE_URL + path);
  
  const options = {
    method: "PUT",
    headers,
    body: JSON.stringify(data),
    credentials: 'include' as RequestCredentials, // Include cookies in the request
    mode: isDevelopment() ? 'cors' as RequestMode : undefined // Set CORS mode in development
  };
  
  const response = await apiRequestWithRetry(url, options);
  if (!response.ok) {
    // Handle 401 by redirecting to login page if appropriate
    if (response.status === 401) {
      console.error('Authentication error, session may have expired');
      // Clear authentication state
      await authService.logout();
      // Redirect to login page if we're in a browser environment
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }
    throw new Error(response.statusText);
  }
  return await response.json() as T;
}

async function apiDelete<T>(path: string): Promise<T> {
  // Get CSRF token
  const csrfToken = localStorage.getItem('csrf_token');
  const headers: HeadersInit = {
    'Content-Type': 'application/json'
  };
  
  // Add CSRF token if available
  if (csrfToken) {
    headers['X-CSRF-Token'] = csrfToken;
  }
  
  // Add Authorization header with ID token if available
  const currentUser = authService.getCurrentUser();
  if (currentUser?.idToken) {
    headers['Authorization'] = `Bearer ${currentUser.idToken}`;
  }
  
  const url = new URL(BASE_URL + path);
  
  const options = {
    method: "DELETE",
    headers,
    credentials: 'include' as RequestCredentials, // Include cookies in the request
    mode: isDevelopment() ? 'cors' as RequestMode : undefined // Set CORS mode in development
  };
  
  const response = await apiRequestWithRetry(url, options);
  if (!response.ok) {
    // Handle 401 by redirecting to login page if appropriate
    if (response.status === 401) {
      console.error('Authentication error, session may have expired');
      // Clear authentication state
      await authService.logout();
      // Redirect to login page if we're in a browser environment
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }
    throw new Error(response.statusText);
  }
  return await response.json() as T;
}

// get all places
export async function getWorkbruData() {
  //             Passed to T ↴
  // url.searchParams.set("lat", "39.088565")
  // url.searchParams.set("lng", "-84.5313728")
  // url.searchParams.set("radius", "300")
  const res = await apiGet<{ message: string }>("places")
  console.log("response: ", res.message)
  return res.message
}

// Get all places for admin
export async function getAllPlaces(): Promise<Place[]> {
  const res = await apiGet<{ message: string }>("places");
  const places = JSON.parse(res.message) as Place[];
  
  return places;
}

// Get a single place by ID
export async function getPlaceById(id: string): Promise<Place> {
  const res = await apiGet<{ message: string }>(`places/${id}`);
  const place = JSON.parse(res.message) as Place;
  return place;
}

// Create a new place
export async function createPlace(place: Omit<Place, 'id'>): Promise<Place> {
  const validatedPlace = PlaceSchema.omit({ id: true }).parse(place);
  const res = await apiPost<{ message: string }>("places", validatedPlace);
  const createdPlace = JSON.parse(res.message) as Place;
  return createdPlace;
}

// Update an existing place
export async function updatePlace(id: string, place: Partial<Place>): Promise<Place> {
  const res = await apiPut<{ message: string }>(`places/${id}`, place);
  const updatedPlace = JSON.parse(res.message) as Place;
  return updatedPlace;
}

// Delete a place
export async function deletePlace(id: string): Promise<{ success: boolean }> {
  const res = await apiDelete<{ message: string }>(`places/${id}`);
  const result = JSON.parse(res.message) as { success: boolean };
  return result;
}