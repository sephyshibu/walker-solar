import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Token storage keys
const ACCESS_TOKEN_KEY = 'accessToken';
const REFRESH_TOKEN_KEY = 'refreshToken';
const TOKEN_EXPIRY_KEY = 'tokenExpiry';

// Token helper functions
export const tokenStorage = {
  getAccessToken: () => localStorage.getItem(ACCESS_TOKEN_KEY),
  getRefreshToken: () => localStorage.getItem(REFRESH_TOKEN_KEY),
  getTokenExpiry: () => localStorage.getItem(TOKEN_EXPIRY_KEY),
  
  setTokens: (accessToken: string, refreshToken: string, expiresIn: number) => {
    localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    // Store expiry time (current time + expires in seconds - 30 seconds buffer)
    const expiryTime = Date.now() + (expiresIn - 30) * 1000;
    localStorage.setItem(TOKEN_EXPIRY_KEY, expiryTime.toString());
  },
  
  updateAccessToken: (accessToken: string, expiresIn: number) => {
    localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
    const expiryTime = Date.now() + (expiresIn - 30) * 1000;
    localStorage.setItem(TOKEN_EXPIRY_KEY, expiryTime.toString());
  },
  
  clearTokens: () => {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(TOKEN_EXPIRY_KEY);
    localStorage.removeItem('user');
  },
  
  isTokenExpired: () => {
    const expiry = localStorage.getItem(TOKEN_EXPIRY_KEY);
    if (!expiry) return true;
    return Date.now() >= parseInt(expiry);
  }
};

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Flag to prevent multiple refresh requests
let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

// Subscribe to token refresh
const subscribeTokenRefresh = (cb: (token: string) => void) => {
  refreshSubscribers.push(cb);
};

// Notify all subscribers with new token
const onTokenRefreshed = (token: string) => {
  refreshSubscribers.forEach(cb => cb(token));
  refreshSubscribers = [];
};

// Refresh the access token
const refreshAccessToken = async (): Promise<string | null> => {
  try {
    const refreshToken = tokenStorage.getRefreshToken();
    if (!refreshToken) {
      throw new Error('No refresh token');
    }

    const response = await axios.post(`${API_URL}/auth/refresh`, {
      refreshToken
    });

    const { accessToken, accessTokenExpiresIn } = response.data.data;
    tokenStorage.updateAccessToken(accessToken, accessTokenExpiresIn);
    
    return accessToken;
  } catch (error) {
    tokenStorage.clearTokens();
    return null;
  }
};

// Request interceptor to add auth token
api.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    // Skip token for auth endpoints (except profile)
    const isAuthEndpoint = config.url?.includes('/auth/') && 
                          !config.url?.includes('/auth/profile') &&
                          !config.url?.includes('/auth/change-password') &&
                          !config.url?.includes('/auth/logout');
    
    if (isAuthEndpoint) {
      return config;
    }

    let accessToken = tokenStorage.getAccessToken();
    
    // Check if token is expired and we have a refresh token
    if (accessToken && tokenStorage.isTokenExpired()) {
      const refreshToken = tokenStorage.getRefreshToken();
      
      if (refreshToken) {
        if (!isRefreshing) {
          isRefreshing = true;
          
          const newToken = await refreshAccessToken();
          isRefreshing = false;
          
          if (newToken) {
            onTokenRefreshed(newToken);
            accessToken = newToken;
          } else {
            // Refresh failed, redirect to login
            window.location.href = '/login';
            return Promise.reject(new Error('Token refresh failed'));
          }
        } else {
          // Wait for the ongoing refresh
          return new Promise((resolve) => {
            subscribeTokenRefresh((token: string) => {
              config.headers.Authorization = `Bearer ${token}`;
              resolve(config);
            });
          });
        }
      }
    }
    
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
    
    // If 401 and not already retried
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      const refreshToken = tokenStorage.getRefreshToken();
      
      if (refreshToken && !isRefreshing) {
        isRefreshing = true;
        
        try {
          const newToken = await refreshAccessToken();
          isRefreshing = false;
          
          if (newToken) {
            onTokenRefreshed(newToken);
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            return api(originalRequest);
          }
        } catch (refreshError) {
          isRefreshing = false;
        }
      }
      
      // Refresh failed or no refresh token
      tokenStorage.clearTokens();
      window.location.href = '/login';
    }
    
    return Promise.reject(error);
  }
);

// Auth
export const authApi = {
  register: (data: { email: string; password: string; firstName: string; lastName: string; phone?: string }) =>
    api.post('/auth/register', data),
  login: (data: { email: string; password: string }) =>
    api.post('/auth/login', data),
  refreshToken: (refreshToken: string) =>
    api.post('/auth/refresh', { refreshToken }),
  logout: () => api.post('/auth/logout'),
  getProfile: () => api.get('/auth/profile'),
  updateProfile: (data: FormData) =>
    api.put('/auth/profile', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    api.put('/auth/change-password', data),
};

// Products
export const productApi = {
  getAll: (params?: any) => api.get('/products', { params }),
  getFeatured: (limit?: number) => api.get('/products/featured', { params: { limit } }),
  getById: (id: string) => api.get(`/products/${id}`),
  getBySlug: (slug: string) => api.get(`/products/slug/${slug}`),
  getByCategory: (category: string, params?: any) => api.get(`/products/category/${category}`, { params }),
  search: (query: string, params?: any) => api.get('/products/search', { params: { q: query, ...params } }),
  create: (data: FormData) => api.post('/products', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  update: (id: string, data: FormData) => api.put(`/products/${id}`, data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  delete: (id: string) => api.delete(`/products/${id}`),
  block: (id: string) => api.patch(`/products/${id}/block`),
  unblock: (id: string) => api.patch(`/products/${id}/unblock`),
  setFeatured: (id: string, featured: boolean) => api.patch(`/products/${id}/featured`, { featured }),
  getStats: () => api.get('/admin/products/stats'),
  uploadVideo: (id: string, data: FormData) => api.post(`/products/${id}/video`, data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  deleteVideo: (id: string) => api.delete(`/products/${id}/video`),
};

// Cart
export const cartApi = {
  get: () => api.get('/cart'),
  addItem: (productId: string, quantity?: number) => api.post('/cart', { productId, quantity }),
  updateItem: (productId: string, quantity: number) => api.put(`/cart/${productId}`, { quantity }),
  removeItem: (productId: string) => api.delete(`/cart/${productId}`),
  clear: () => api.delete('/cart'),
};

// Orders
export const orderApi = {
  create: (data: { shippingAddress: any; notes?: string }) => api.post('/orders', data),
  getMyOrders: (params?: any) => api.get('/orders/my-orders', { params }),
  getById: (id: string) => api.get(`/orders/${id}`),
  cancel: (id: string) => api.patch(`/orders/${id}/cancel`),
  markWhatsAppSent: (id: string) => api.patch(`/orders/${id}/whatsapp-sent`),
  // Admin
  getAll: (params?: any) => api.get('/admin/orders', { params }),
  getStats: () => api.get('/admin/orders/stats'),
  updateStatus: (id: string, status: string) => api.patch(`/admin/orders/${id}/status`, { status }),
  getCourierServices: () => api.get('/admin/orders/couriers'),
  addTracking: (id: string, awbNumber: string, courierService: string) => 
    api.patch(`/admin/orders/${id}/tracking`, { awbNumber, courierService }),
};

// Wishlist
export const wishlistApi = {
  get: () => api.get('/wishlist'),
  addItem: (productId: string) => api.post('/wishlist', { productId }),
  removeItem: (productId: string) => api.delete(`/wishlist/${productId}`),
  clear: () => api.delete('/wishlist'),
  checkItem: (productId: string) => api.get(`/wishlist/check/${productId}`),
};

// Gallery
export const galleryApi = {
  getAll: (params?: any) => api.get('/gallery', { params }),
  getByCategory: (category: string, params?: any) => api.get(`/gallery/category/${category}`, { params }),
  getById: (id: string) => api.get(`/gallery/${id}`),
  create: (data: FormData) => api.post('/gallery', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  update: (id: string, data: FormData) => api.put(`/gallery/${id}`, data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  delete: (id: string) => api.delete(`/gallery/${id}`),
  toggleActive: (id: string) => api.patch(`/gallery/${id}/toggle-active`),
};

// Contact
export const contactApi = {
  create: (data: { name: string; email: string; phone?: string; subject: string; message: string }) =>
    api.post('/contact', data),
  markWhatsAppSent: (id: string) => api.patch(`/contact/${id}/whatsapp-sent`),
  // Admin
  getAll: (params?: any) => api.get('/admin/contacts', { params }),
  getById: (id: string) => api.get(`/admin/contacts/${id}`),
  respond: (id: string, response: string) => api.post(`/admin/contacts/${id}/respond`, { response }),
  close: (id: string) => api.patch(`/admin/contacts/${id}/close`),
  delete: (id: string) => api.delete(`/admin/contacts/${id}`),
  getStats: () => api.get('/admin/contacts/stats'),
};

// Admin - Users
export const adminApi = {
  getUsers: (params?: any) => api.get('/admin/users', { params }),
  getUserById: (id: string) => api.get(`/admin/users/${id}`),
  blockUser: (id: string) => api.patch(`/admin/users/${id}/block`),
  unblockUser: (id: string) => api.patch(`/admin/users/${id}/unblock`),
  getUserStats: () => api.get('/admin/users/stats'),
};

export default api;
