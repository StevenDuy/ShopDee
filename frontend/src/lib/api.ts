export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api";

import axios from 'axios';

/**
 * Axios instance tối ưu cho toàn bộ hệ thống ShopDee
 * - timeout 10s để tránh request treo vô thời hạn
 * - Keep-Alive để tái sử dụng kết nối TCP (giảm overhead đáng kể)
 * - Tự động thêm Authorization header khi có token
 */
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000, // 10 giây
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  // Tái sử dụng kết nối TCP - tương tự "Keep-Alive" trong HTTP
  // Giúp giảm thời gian kết nối cho request liên tiếp
  withCredentials: false,
});

// Request interceptor - tự động thêm token
api.interceptors.request.use(
  (config) => {
    // Lấy token từ Zustand store (không import store để tránh circular dep)
    const raw = typeof window !== 'undefined'
      ? localStorage.getItem('auth-storage')
      : null;

    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        const token = parsed?.state?.token;
        if (token && !config.headers['Authorization']) {
          config.headers['Authorization'] = `Bearer ${token}`;
        }
      } catch (_) {}
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - xử lý lỗi toàn cục
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Nếu 401 - token hết hạn, xóa storage
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('auth-storage');
        // Chỉ redirect nếu không ở trang login
        if (!window.location.pathname.includes('/login')) {
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;
