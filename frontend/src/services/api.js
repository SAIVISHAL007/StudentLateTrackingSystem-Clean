import axios from "axios";

// Hardcoded backend URL for production deployment
const configuredBase = process.env.NODE_ENV === 'production'
  ? "https://backend-iesct31jw-chelluri-sai-vishals-projects-3f9c693c.vercel.app/api"
  : "http://localhost:5000/api";

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
