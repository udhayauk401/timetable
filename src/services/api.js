const MONGODB_URI = import.meta.env.MONGODB_URI || 'http://localhost:5000/api';

// Helper function to handle API calls
const apiCall = async (endpoint, options = {}) => {
  const token = localStorage.getItem('token');
  
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  try {
    const response = await fetch(`${MONGODB_URI}${endpoint}`, {
      ...options,
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'API Error');
    }

    return data;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};

// Authentication APIs
export const authAPI = {
  register: (email, password) =>
    apiCall('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  login: (email, password) =>
    apiCall('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  getMe: () => apiCall('/auth/me'),
};

// Habits APIs
export const habitsAPI = {
  getAll: () => apiCall('/habits'),

  create: (name) =>
    apiCall('/habits', {
      method: 'POST',
      body: JSON.stringify({ name }),
    }),

  delete: (id) =>
    apiCall(`/habits/${id}`, {
      method: 'DELETE',
    }),
};

// Attendance APIs
export const attendanceAPI = {
  getByMonth: (habitId, year, month) =>
    apiCall(`/attendance/${habitId}/${year}/${month}`),

  toggle: (habitId, date, completed) =>
    apiCall('/attendance', {
      method: 'POST',
      body: JSON.stringify({ habitId, date, completed }),
    }),

  getStats: (habitId, year, month) =>
    apiCall(`/attendance/stats/${habitId}/${year}/${month}`),
};

// Health check
export const healthCheck = () => apiCall('/health');
