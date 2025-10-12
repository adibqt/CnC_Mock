import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests if available
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// User API endpoints
export const userAPI = {
  // User signup
  signup: async (userData) => {
    try {
      const response = await api.post('/api/users/signup', userData);
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.detail || 'Signup failed. Please try again.',
      };
    }
  },

  // User login
  login: async (credentials) => {
    try {
      const response = await api.post('/api/users/login', credentials);
      const { access_token, user_data, user_type } = response.data;
      
      // Store token and user data
      localStorage.setItem('accessToken', access_token);
      localStorage.setItem('userType', user_type);
      localStorage.setItem('userData', JSON.stringify(user_data));
      
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.detail || 'Login failed. Please check your credentials.',
      };
    }
  },

  // Home page aggregate data
  getHomeData: async () => {
    const response = await api.get('/api/users/home');
    return response.data;
  },

  // Suggest a doctor based on concerns
  suggestDoctor: async (payload) => {
    const response = await api.post('/api/users/suggest-doctor', payload);
    return response.data;
  },

  // Get user profile
  getProfile: async () => {
    try {
      const response = await api.get('/api/users/profile');
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.detail || 'Failed to fetch profile.',
      };
    }
  },

  // Update user profile
  updateProfile: async (profileData) => {
    try {
      const response = await api.put('/api/users/profile', profileData);
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.detail || 'Failed to update profile.',
      };
    }
  },

  // Upload profile picture
  uploadProfilePicture: async (file) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await api.post('/api/users/profile-picture', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.detail || 'Failed to upload profile picture.',
      };
    }
  },
};

// Doctor API endpoints
export const doctorAPI = {
  // Doctor signup
  signup: async (doctorData) => {
    try {
      const response = await api.post('/api/doctors/signup', doctorData);
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.detail || 'Signup failed. Please try again.',
      };
    }
  },

  // Doctor login
  login: async (credentials) => {
    try {
      const response = await api.post('/api/doctors/login', credentials);
      const { access_token, user_data, user_type } = response.data;
      
      // Store token and user data
      localStorage.setItem('accessToken', access_token);
      localStorage.setItem('userType', user_type);
      localStorage.setItem('userData', JSON.stringify(user_data));
      
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.detail || 'Login failed. Please check your credentials.',
      };
    }
  },

  // Get doctor profile
  getProfile: async () => {
    try {
      const response = await api.get('/api/doctors/profile');
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.detail || 'Failed to fetch profile.',
      };
    }
  },
};

// Auth utilities
export const authUtils = {
  // Logout
  logout: () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('userType');
    localStorage.removeItem('userData');
    window.location.href = '/';
  },

  // Check if user is authenticated
  isAuthenticated: () => {
    return !!localStorage.getItem('accessToken');
  },

  // Get current user type
  getUserType: () => {
    return localStorage.getItem('userType');
  },

  // Get current user data
  getUserData: () => {
    const userData = localStorage.getItem('userData');
    return userData ? JSON.parse(userData) : null;
  },

  // Get token
  getToken: () => {
    return localStorage.getItem('accessToken');
  },
};

export default api;
