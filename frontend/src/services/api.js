import axios from "axios";

// Backend base URL: use REACT_APP_API_URL in production to avoid hardcoding
const getBackendURL = () => {
  if (process.env.NODE_ENV === 'production') {
    return process.env.REACT_APP_API_URL || "https://backend-aq2ym15ta-chelluri-sai-vishals-projects-3f9c693c.vercel.app/api";
  }
  
  // Development: auto-detect host
  const host = window.location.hostname;
  const port = 5000;
  
  return `http://${host}:${port}/api`;
};

const configuredBase = getBackendURL();

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
