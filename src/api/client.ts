import axios from 'axios';

// Dynamically determine the API Base URL:
// 1. If VITE_API_BASE_URL is set in .env / .env.production, use it.
// 2. In Production build (Mobile APK), default to the live server (https://api.aleshrakcentre.com/api/v1).
// 3. In Development (npm run dev), default to local machine (http://localhost:3010/api/v1).
const rawBaseUrl =
  import.meta.env.VITE_API_BASE_URL ||
  (import.meta.env.PROD
    ? 'https://api.aleshrakcentre.com/api/v1'
    : 'http://localhost:3010/api/v1');

const sanitizedBase = rawBaseUrl.replace(/\/+$/, '');
const API_BASE_URL = sanitizedBase.endsWith('/mobile-employees')
  ? sanitizedBase
  : `${sanitizedBase}/mobile-employees`;

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
  timeout: 15000,
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('mobile_auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && !window.location.pathname.includes('/login')) {
      localStorage.removeItem('mobile_auth_token');
      localStorage.removeItem('mobile_user_profile');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
