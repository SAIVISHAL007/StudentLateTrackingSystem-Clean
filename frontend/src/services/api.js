import axios from "axios";

// API Base URL Configuration
// Development: uses localhost
// Production: uses REACT_APP_API_URL from environment variables
const getBaseURL = () => {
  // Check if custom API URL is set in environment
  if (process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL;
  }
  
  // Default to localhost for development
  return process.env.NODE_ENV === 'production' 
    ? "/api" // Fallback for production
    : "http://localhost:5000/api";
};

const API = axios.create({ 
  baseURL: getBaseURL(),
  timeout: 30000, // 30 second timeout for serverless functions
  headers: {
    'Content-Type': 'application/json'
  }
});

console.log('🌐 API Base URL:', getBaseURL());

// Add JWT token to all requests (except auth and student routes)
// Student routes no longer require authentication
API.interceptors.request.use(
  (config) => {
    // Only add token to auth routes that need it
    const isAuthRoute = config.url?.includes('/auth/');
    const isStudentRoute = config.url?.includes('/students/');
    
    // Only add token to auth routes (like /auth/faculty, /auth/register)
    if (isAuthRoute && !config.url?.includes('/login') && !config.url?.includes('/forgot-password')) {
      const token = localStorage.getItem('jwt_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle 401 errors (token expired or invalid)
// Note: Student routes no longer require authentication, so we don't redirect on 401 for them
API.interceptors.response.use(
  (response) => response,
  (error) => {
    // Don't redirect on 401 for student routes (they're now public)
    const isStudentRoute = error.config?.url?.includes('/students/');
    
    if (error.response?.status === 401 && !isStudentRoute) {
      // Token expired or invalid - clear auth and reload
      localStorage.removeItem('jwt_token');
      localStorage.removeItem('facultyAuth');
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

export default API;
