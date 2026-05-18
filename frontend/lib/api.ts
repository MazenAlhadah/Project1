import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || '/api';

const api = axios.create({
  baseURL: API_URL,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor: أضف token
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('access_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor: refresh token تلقائياً
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && error.response?.data?.code === 'TOKEN_EXPIRED' && !original._retry) {
      original._retry = true;
      try {
        const refreshToken = localStorage.getItem('refresh_token');
        if (!refreshToken) throw new Error('No refresh token');
        const { data } = await axios.post(`${API_URL}/auth/refresh`, { refresh_token: refreshToken });
        localStorage.setItem('access_token', data.data.access_token);
        localStorage.setItem('refresh_token', data.data.refresh_token);
        original.headers.Authorization = `Bearer ${data.data.access_token}`;
        return api(original);
      } catch {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          localStorage.removeItem('user');
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

// Auth
export const authAPI = {
  register: (data: FormData) => api.post('/auth/register', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  login: (identifier: string, password: string) => api.post('/auth/login', { identifier, password }),
  refresh: (refresh_token: string) => api.post('/auth/refresh', { refresh_token }),
  logout: (refresh_token?: string) => api.post('/auth/logout', { refresh_token }),
  forgotPassword: (email: string) => api.post('/auth/forgot-password', { email }),
  resetPassword: (token: string, new_password: string) => api.post('/auth/reset-password', { token, new_password }),
  getMe: () => api.get('/auth/me'),
};

// Books
export const booksAPI = {
  getAll: () => api.get('/books'),
  getAllAdmin: () => api.get('/books/all'),
  getReadUrl: (id: string) => api.get(`/books/${id}/read`),
  create: (data: FormData) => api.post('/books', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  update: (id: string, data: FormData) => api.put(`/books/${id}`, data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  delete: (id: string) => api.delete(`/books/${id}`),
};

// Purchases
export const purchasesAPI = {
  request: (book_id: string) => api.post('/purchases', { book_id }),
  getMy: () => api.get('/purchases/my'),
  getPending: () => api.get('/purchases/pending'),
  getAll: () => api.get('/purchases/all'),
  confirm: (id: string) => api.put(`/purchases/${id}/confirm`),
  reject: (id: string) => api.put(`/purchases/${id}/reject`),
};

// Users
export const usersAPI = {
  getStudents: () => api.get('/users'),
  getPending: () => api.get('/users/pending'),
  approve: (id: string) => api.put(`/users/${id}/approve`),
  reject: (id: string) => api.put(`/users/${id}/reject`),
  reactivate: (id: string) => api.put(`/users/${id}/reactivate`),
  deleteStudent: (id: string) => api.delete(`/users/${id}`),
  resetPassword: (id: string) => api.put(`/users/${id}/reset-password`),
  getEmployees: () => api.get('/users/employees'),
  createEmployee: (data: object) => api.post('/users/employees', data),
  updateEmployee: (id: string, data: object) => api.put(`/users/employees/${id}`, data),
  deleteEmployee: (id: string) => api.delete(`/users/employees/${id}`),
  getAdmins: () => api.get('/users/admins'),
  createAdmin: (data: object) => api.post('/users/admins', data),
  deleteAdmin: (id: string) => api.delete(`/users/admins/${id}`),
};

// Settings
export const settingsAPI = {
  get: () => api.get('/settings'),
  update: (data: object) => api.put('/settings', data),
};

// Courses
export const coursesAPI = {
  getAll: () => api.get('/courses'),
  create: (data: FormData) => api.post('/courses', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  update: (id: string, data: FormData) => api.put(`/courses/${id}`, data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  delete: (id: string) => api.delete(`/courses/${id}`),
};

export default api;
