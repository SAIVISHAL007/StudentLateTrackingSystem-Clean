import axios from "axios";

// Prefer an explicit backend URL in production via REACT_APP_API_URL.
// If not provided, fall back to `/api` (useful for monorepo deploys).
const configuredBase = process.env.REACT_APP_API_URL && process.env.REACT_APP_API_URL.trim()
  ? process.env.REACT_APP_API_URL.replace(/\/$/, '')
  : (process.env.NODE_ENV === 'production' ? "/api" : "http://localhost:5000/api");

const API = axios.create({
  baseURL: configuredBase,
  timeout: 10000 // 10 second timeout
});

// Add JWT token to all requests (skip only public auth endpoints: login/register)
API.interceptors.request.use(
  (config) => {
    const skipAuth = ['/auth/login','/auth/register'].some(path => config.url?.includes(path));
    if (!skipAuth) {
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
    const skipAuth = ['/auth/login','/auth/register'].some(path => error.config?.url?.includes(path));
    if (error.response?.status === 401 && !skipAuth) {
      localStorage.removeItem('jwt_token');
      localStorage.removeItem('facultyAuth');
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

export default API;
