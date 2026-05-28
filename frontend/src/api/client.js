import axios from 'axios';
import { API_BASE_URL } from '../constants/api';
import { useAuthStore } from '../store/authStore';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 403 && error.response?.data?.message?.includes('token')) {
      useAuthStore.getState().logout();
    }

    return Promise.reject(error);
  }
);

export function getApiError(error) {
  return error.response?.data?.message || error.message || 'Something went wrong';
}
