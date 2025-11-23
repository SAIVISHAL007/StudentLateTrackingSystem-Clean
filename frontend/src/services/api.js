import axios from "axios";

const API = axios.create({ 
  baseURL: process.env.NODE_ENV === 'production' 
    ? "/api"
    : "http://localhost:5000/api",
  timeout: 10000 // 10 second timeout
});

// Add JWT token to all requests (except auth routes)
API.interceptors.request.use(
  (config) => {
    // Don't add token to login/register/forgot-password requests
    const isAuthRoute = config.url?.includes('/auth/');
    
    if (!isAuthRoute) {
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
API.interceptors.response.use(
  (response) => response,
  (error) => {
    // Only handle 401 for non-auth routes
    const isAuthRoute = error.config?.url?.includes('/auth/');
    
    if (error.response?.status === 401 && !isAuthRoute) {
      // Token expired or invalid - clear auth and reload
      localStorage.removeItem('jwt_token');
      localStorage.removeItem('facultyAuth');
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

export default API;
