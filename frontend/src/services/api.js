import axios from "axios";

const API = axios.create({ 
  baseURL: process.env.NODE_ENV === 'production' 
    ? "/api"
    : "http://localhost:5000/api",
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
