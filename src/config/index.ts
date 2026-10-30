import axios from 'axios';
export const TOKEN_KEY = 'x-ai-sales-mail-token';
export const SERVER_URL = (import.meta.env.VITE_API_URL || 'https://ai-sales-mail-backend-ten.vercel.app').replace(/\/$/, '');
export const api = axios.create({ baseURL: SERVER_URL, timeout: 60000 });
api.interceptors.request.use(config => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
api.interceptors.response.use(response => response, error => {
  if (error.response?.status === 401 && !error.config?.url?.startsWith('/api/auth/')) {
    localStorage.removeItem(TOKEN_KEY);
    window.location.assign('/auth/login');
  }
  return Promise.reject(error);
});
export function errorMessage(error: unknown): string {
  return axios.isAxiosError(error) ? error.response?.data?.message || error.response?.data?.error || error.message : 'Something went wrong. Please try again.';
}
