import axios from 'axios';
import { clearAuthToken } from '@/auth/token';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8888/api/v1';

console.log('🔗 API URL configured as:', API_URL);

export const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

api.interceptors.response.use(
    (response) => response,
    (error) => {
        // Если токен протух/невалиден — сбрасываем, чтобы ProtectedRoute сам отправил на /login.
        if (error?.response?.status === 401) {
            clearAuthToken();
        }
        return Promise.reject(error);
    }
);
