import axios from 'axios';

const API_BASE = '/api';

// Create axios instance
const apiClient = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor - add auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - handle 401 errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth APIs
export const register = (data) => apiClient.post('/register', data);
export const customerLogin = (data) => apiClient.post('/login', data);
export const adminLogin = (data) => apiClient.post('/admin/login', data);
export const getProfile = () => apiClient.get('/profile');

// Room APIs
export const getAvailableRooms = (params) => apiClient.get('/rooms', { params });
export const getAllRooms = () => apiClient.get('/admin/rooms');
export const createRoom = (data) => apiClient.post('/admin/rooms', data);
export const updateRoom = (id, data) => apiClient.put(`/admin/rooms/${id}`, data);

// Reservation APIs
export const createReservation = (data) => apiClient.post('/reservations', data);
export const getMyReservations = () => apiClient.get('/my-reservations');
export const getAllReservations = () => apiClient.get('/admin/reservations');
export const cancelReservation = (id) => apiClient.post(`/reservations/${id}/cancel`);
export const updateReservationStatus = (id, status) => 
  apiClient.patch(`/admin/reservations/${id}/status`, { status });

// Payment APIs
export const makePayment = (id, data) => apiClient.post(`/reservations/${id}/pay`, data);
export const getAllPayments = () => apiClient.get('/admin/payments');

// Customer APIs
export const getAllCustomers = () => apiClient.get('/admin/customers');
export const searchCustomers = (name) => apiClient.get('/admin/customers/search', { params: { name } });

// Revenue API
export const getRevenue = () => apiClient.get('/admin/revenue');

export default apiClient;
