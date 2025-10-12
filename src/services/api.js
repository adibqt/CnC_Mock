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
    // Check for both patient and doctor tokens
    const patientToken = localStorage.getItem('patient_accessToken');
    const doctorToken = localStorage.getItem('doctor_accessToken');
    
    // Use the appropriate token based on the endpoint
    if (config.url.includes('/api/doctors/')) {
      // Doctor endpoints - use doctor token
      if (doctorToken) {
        config.headers.Authorization = `Bearer ${doctorToken}`;
      }
    } else if (config.url.includes('/api/users/')) {
      // User endpoints - use patient token
      if (patientToken) {
        config.headers.Authorization = `Bearer ${patientToken}`;
      }
    } else if (config.url.includes('/api/ai/')) {
      // AI endpoints - patient token (patients use AI consultation)
      if (patientToken) {
        config.headers.Authorization = `Bearer ${patientToken}`;
      }
    } else {
      // For other endpoints, try patient first (most common), then doctor
      const token = patientToken || doctorToken;
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    
    // Debug logging
    console.log('🔑 API Request:', {
      url: config.url,
      hasPatientToken: !!patientToken,
      hasDoctorToken: !!doctorToken,
      hasAuthHeader: !!config.headers.Authorization
    });
    
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
      
      // Store token and user data with patient prefix
      localStorage.setItem('patient_accessToken', access_token);
      localStorage.setItem('patient_userType', user_type);
      localStorage.setItem('patient_userData', JSON.stringify(user_data));
      
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
      
      // Store token and user data with doctor prefix
      localStorage.setItem('doctor_accessToken', access_token);
      localStorage.setItem('doctor_userType', user_type);
      localStorage.setItem('doctor_userData', JSON.stringify(user_data));
      
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

  // Update doctor profile
  updateProfile: async (profileData) => {
    try {
      const response = await api.put('/api/doctors/profile', profileData);
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.detail || 'Failed to update profile.',
      };
    }
  },

  // Upload certificate (MBBS or FCPS)
  uploadCertificate: async (certificateType, file) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('certificate_type', certificateType);
      
      const response = await api.post(`/api/doctors/upload-certificate?certificate_type=${certificateType}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.detail || 'Failed to upload certificate.',
      };
    }
  },

  // Get doctor home data
  getHomeData: async () => {
    try {
      const response = await api.get('/api/doctors/home');
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.detail || 'Failed to fetch home data.',
      };
    }
  },

  // Get doctor schedule
  getSchedule: async () => {
    try {
      const response = await api.get('/api/doctors/schedule');
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.detail || 'Failed to fetch schedule.',
      };
    }
  },

  // Update doctor schedule
  updateSchedule: async (scheduleData) => {
    try {
      const response = await api.put('/api/doctors/schedule', scheduleData);
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.detail || 'Failed to update schedule.',
      };
    }
  },
};

// Auth utilities
export const authUtils = {
  // Logout (specify user type)
  logout: (userType = null) => {
    if (userType === 'patient' || !userType) {
      localStorage.removeItem('patient_accessToken');
      localStorage.removeItem('patient_userType');
      localStorage.removeItem('patient_userData');
    }
    if (userType === 'doctor' || !userType) {
      localStorage.removeItem('doctor_accessToken');
      localStorage.removeItem('doctor_userType');
      localStorage.removeItem('doctor_userData');
    }
    window.location.href = '/';
  },

  // Check if user is authenticated
  isAuthenticated: (userType = null) => {
    if (userType === 'patient') {
      return !!localStorage.getItem('patient_accessToken');
    } else if (userType === 'doctor') {
      return !!localStorage.getItem('doctor_accessToken');
    } else {
      // Check if any user is authenticated
      return !!localStorage.getItem('patient_accessToken') || !!localStorage.getItem('doctor_accessToken');
    }
  },

  // Get current user type (returns 'patient', 'doctor', or null)
  getUserType: () => {
    if (localStorage.getItem('patient_accessToken')) {
      return localStorage.getItem('patient_userType') || 'patient';
    } else if (localStorage.getItem('doctor_accessToken')) {
      return localStorage.getItem('doctor_userType') || 'doctor';
    }
    return null;
  },

  // Get current user data
  getUserData: (userType = null) => {
    let userData = null;
    if (userType === 'patient') {
      userData = localStorage.getItem('patient_userData');
    } else if (userType === 'doctor') {
      userData = localStorage.getItem('doctor_userData');
    } else {
      // Try to get whichever is available
      userData = localStorage.getItem('patient_userData') || localStorage.getItem('doctor_userData');
    }
    return userData ? JSON.parse(userData) : null;
  },

  // Get token
  getToken: (userType = null) => {
    if (userType === 'patient') {
      return localStorage.getItem('patient_accessToken');
    } else if (userType === 'doctor') {
      return localStorage.getItem('doctor_accessToken');
    } else {
      // Try to get whichever is available
      return localStorage.getItem('patient_accessToken') || localStorage.getItem('doctor_accessToken');
    }
  },
};

// AI Consultation API endpoints
export const aiAPI = {
  // Analyze text symptoms
  analyzeSymptoms: async (message, conversationHistory = null) => {
    try {
      const response = await api.post('/api/ai/analyze-symptoms', {
        message,
        conversation_history: conversationHistory
      });
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.detail || 'Failed to analyze symptoms. Please try again.'
      };
    }
  },

  // Analyze audio
  analyzeAudio: async (audioBlob) => {
    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.wav');
      
      const response = await api.post('/api/ai/analyze-audio', formData, {
        headers: { 
          'Content-Type': 'multipart/form-data'
        }
      });
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.detail || 'Failed to analyze audio. Please try again.'
      };
    }
  },

  // Get consultation history
  getConsultationHistory: async (limit = 10) => {
    try {
      const response = await api.get(`/api/ai/consultation-history?limit=${limit}`);
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.detail || 'Failed to load consultation history.'
      };
    }
  },

  // Get specific consultation
  getConsultation: async (consultationId) => {
    try {
      const response = await api.get(`/api/ai/consultation/${consultationId}`);
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.detail || 'Failed to load consultation details.'
      };
    }
  },

  // Delete consultation
  deleteConsultation: async (consultationId) => {
    try {
      const response = await api.delete(`/api/ai/consultation/${consultationId}`);
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.detail || 'Failed to delete consultation.'
      };
    }
  },

  // Generate AI followup
  generateFollowup: async (consultationId) => {
    try {
      const response = await api.post('/api/ai/followup', null, {
        params: { consultation_id: consultationId }
      });
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.detail || 'Failed to generate follow-up.'
      };
    }
  }
};

export default api;
