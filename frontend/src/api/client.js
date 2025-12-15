import axios from 'axios';

const api = axios.create({
  baseURL: '/',
  withCredentials: false,
});

// Add Authorization header to all requests if user is logged in
api.interceptors.request.use(
  (config) => {
    const userStr = localStorage.getItem('hr_user');
    console.log('[API] Request interceptor - userStr:', userStr ? 'present' : 'missing');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        const userId = user?.id || user?.user_id;

        if (userId) {
          config.headers.Authorization = `Bearer ${userId}`;
          console.log('[API] Added auth header for user:', userId);
        } else {
          console.warn('[API] Found user in localStorage but no ID found:', user);
        }
      } catch (e) {
        console.error('Failed to parse user from localStorage');
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - only log errors, don't auto-logout
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      console.log('[API] 401 error - check if auth header was sent');
      // Don't automatically remove user - let the auth context handle logout
    }
    return Promise.reject(error);
  }
);

export default api;
