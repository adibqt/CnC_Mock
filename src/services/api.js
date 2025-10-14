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
    if (config.url.includes('/api/doctors/') && config.url.includes('/my-appointments')) {
      // Doctor's own appointments - use doctor token
      if (doctorToken) {
        config.headers.Authorization = `Bearer ${doctorToken}`;
      }
    } else if (config.url.includes('/api/doctors/')) {
      // Other doctor endpoints - use doctor token if available, otherwise patient token for browsing
      if (doctorToken) {
        config.headers.Authorization = `Bearer ${doctorToken}`;
      } else if (patientToken && (config.url.includes('/all') || config.url.includes('/available-slots'))) {
        // Allow patients to view doctor list and availability
        config.headers.Authorization = `Bearer ${patientToken}`;
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
    } else if (config.url.includes('/api/appointments/')) {
      // Appointment endpoints - use appropriate token based on sub-path and method
      if (config.url.includes('/doctor/')) {
        // Doctor-specific appointments
        if (doctorToken) {
          config.headers.Authorization = `Bearer ${doctorToken}`;
        }
      } else if (config.url.includes('/patient/')) {
        // Patient-specific appointments
        if (patientToken) {
          config.headers.Authorization = `Bearer ${patientToken}`;
        }
      } else if (config.method === 'patch' || config.method === 'put') {
        // PATCH/PUT requests (status updates) - doctor operations only
        if (doctorToken) {
          config.headers.Authorization = `Bearer ${doctorToken}`;
        }
      } else {
        // General appointment operations (create, get details, etc.) - patient operations
        if (patientToken) {
          config.headers.Authorization = `Bearer ${patientToken}`;
        } else if (doctorToken) {
          // Fallback to doctor token if no patient token
          config.headers.Authorization = `Bearer ${doctorToken}`;
        }
      }
    } else if (config.url.includes('/livekit/')) {
      // LiveKit endpoints - use whichever token is available (doctor first for room management)
      const token = doctorToken || patientToken;
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
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
      method: config.method?.toUpperCase(),
      url: config.url,
      hasPatientToken: !!patientToken,
      hasDoctorToken: !!doctorToken,
      hasAuthHeader: !!config.headers.Authorization,
      usingToken: config.headers.Authorization ? 
        (config.headers.Authorization.includes(doctorToken) ? 'DOCTOR' : 'PATIENT') : 'NONE'
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
  // Clear all tokens (useful when switching between user types)
  clearAllTokens: () => {
    localStorage.removeItem('patient_accessToken');
    localStorage.removeItem('patient_userType');
    localStorage.removeItem('patient_userData');
    localStorage.removeItem('doctor_accessToken');
    localStorage.removeItem('doctor_userType');
    localStorage.removeItem('doctor_userData');
  },

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

// Appointment API endpoints
export const appointmentAPI = {
  // Create new appointment
  createAppointment: async (appointmentData) => {
    try {
      const response = await api.post('/api/appointments/', appointmentData);
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.detail || 'Failed to create appointment. Please try again.'
      };
    }
  },

  // Get patient's appointments
  getPatientAppointments: async (statusFilter = null) => {
    try {
      const url = statusFilter 
        ? `/api/appointments/patient/my-appointments?status_filter=${statusFilter}`
        : '/api/appointments/patient/my-appointments';
      const response = await api.get(url);
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.detail || 'Failed to fetch appointments.'
      };
    }
  },

  // Get doctor's appointments
  getDoctorAppointments: async (week = 'current') => {
    try {
      const response = await api.get(`/api/appointments/doctor/my-appointments?week=${week}`);
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.detail || 'Failed to fetch appointments.'
      };
    }
  },

  // Get appointment details
  getAppointmentDetails: async (appointmentId) => {
    try {
      const response = await api.get(`/api/appointments/${appointmentId}`);
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.detail || 'Failed to fetch appointment details.'
      };
    }
  },

  // Update appointment (doctor only)
  updateAppointment: async (appointmentId, updateData) => {
    try {
      const response = await api.patch(`/api/appointments/${appointmentId}`, updateData);
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.detail || 'Failed to update appointment.'
      };
    }
  },

  // Cancel appointment (patient)
  cancelAppointment: async (appointmentId) => {
    try {
      const response = await api.delete(`/api/appointments/${appointmentId}`);
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.detail || 'Failed to cancel appointment.'
      };
    }
  },

  // Update appointment status (doctor only)
  updateAppointmentStatus: async (appointmentId, status) => {
    try {
      const response = await api.patch(`/api/appointments/${appointmentId}`, { status });
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.detail || 'Failed to update appointment status.'
      };
    }
  },

  // Get doctor's available slots
  getAvailableSlots: async (doctorId, date) => {
    try {
      const response = await api.get(`/api/appointments/doctor/${doctorId}/available-slots?date=${date}`);
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.detail || 'Failed to fetch available slots.'
      };
    }
  },

  // Get all doctors (for patient to browse)
  getAllDoctors: async () => {
    try {
      const response = await api.get('/api/doctors/all');
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.detail || 'Failed to fetch doctors.'
      };
    }
  }
};

// LiveKit API
export const liveKitAPI = {
  // Join appointment video call
  joinAppointmentCall: async (appointmentId, roomType = 'consultation') => {
    try {
      const response = await api.post('/livekit/join-appointment', {
        appointment_id: appointmentId,
        room_type: roomType
      });
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Error joining appointment call:', error);
      return { 
        success: false, 
        error: error.response?.data?.detail || 'Failed to join video call'
      };
    }
  },

  // Create new video room (for doctors)
  createRoom: async (roomName, maxParticipants = 10) => {
    try {
      const response = await api.post(`/livekit/create-room/${roomName}`, null, {
        params: { max_participants: maxParticipants }
      });
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Error creating video room:', error);
      return { 
        success: false, 
        error: error.response?.data?.detail || 'Failed to create video room'
      };
    }
  },

  // End video room (for doctors)
  endRoom: async (roomName) => {
    try {
      const response = await api.delete(`/livekit/end-room/${roomName}`);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Error ending video room:', error);
      return { 
        success: false, 
        error: error.response?.data?.detail || 'Failed to end video room'
      };
    }
  },

  // Check room status (for notifications)
  checkRoomStatus: async (appointmentId) => {
    try {
      const response = await api.get(`/livekit/room-status/${appointmentId}`);
      return { success: true, data: response.data };
    } catch (error) {
      // Silently fail for room status checks
      return { 
        success: false, 
        data: { is_active: false, participant_count: 0 }
      };
    }
  }
};

export default api;
