const API_URL = 'http://localhost:5001/api';

// Public endpoints that don't require authentication
const publicEndpoints = ['/auth/login', '/auth/register'];

const apiCall = async (endpoint, options = {}) => {
  // Check if endpoint requires authentication
  const isPublic = publicEndpoints.includes(endpoint);
  
  let token = null;
  if (!isPublic) {
    token = localStorage.getItem('token');
    if (!token) {
      console.warn('No token found for protected endpoint:', endpoint);
    }
  }

  const config = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && {
        Authorization: `Bearer ${token}`,
      }),
      ...(options.headers || {}),
    },
  };

  console.log('API Call:', endpoint, 'Token:', token ? 'Present' : 'Not required for public endpoints');

  try {
    const response = await fetch(`${API_URL}${endpoint}`, config);

    const data = await response.json();

    console.log('API Response for', endpoint, ':', response.status, data);

    // For public endpoints (login/register), return data even if not ok
    // so the component can handle success/failure properly
    if (publicEndpoints.includes(endpoint)) {
      return data;
    }

    // For protected endpoints, throw error on non-ok status
    if (!response.ok) {
      console.error('API Error:', response.status, data);
      throw new Error(data.message || 'API Error');
    }

    return data;
  } catch (error) {
    console.error('API Fetch Error:', error);
    throw error;
  }
};

export const authAPI = {
  register: (userData) =>
    apiCall('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    }),

  login: (userData) =>
    apiCall('/auth/login', {
      method: 'POST',
      body: JSON.stringify(userData),
    }),

  getMe: () => apiCall('/auth/me'),
};

export const habitsAPI = {
  getHabits: () => apiCall('/habits'),

  createHabit: (habitData) =>
    apiCall('/habits', {
      method: 'POST',
      body: JSON.stringify(habitData),
    }),

  deleteHabit: (id) =>
    apiCall(`/habits/${id}`, {
      method: 'DELETE',
    }),
};

export const attendanceAPI = {
  getByMonth: (habitId, year, month) =>
    apiCall(`/attendance/${habitId}/${year}/${month}`),

  toggle: (attendanceData) =>
    apiCall('/attendance', {
      method: 'POST',
      body: JSON.stringify(attendanceData),
    }),

  getStats: (habitId, year, month) =>
    apiCall(`/attendance/stats/${habitId}/${year}/${month}`),
};

export const healthCheck = () => apiCall('/health');
