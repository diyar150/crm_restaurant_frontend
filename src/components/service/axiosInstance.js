import axios from 'axios';

// Create an instance of axios
const axiosInstance = axios.create({
  baseURL: 'http://localhost:3000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor for adding authorization headers
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    const expiry = localStorage.getItem('authTokenExpiry');
    if (token) {
      if (expiry && Date.now() > Number(expiry)) {
        localStorage.removeItem('authToken');
        localStorage.removeItem('authTokenExpiry');
        // Set a flag to show session expired message
        localStorage.setItem('showSessionExpiredMessage', '1');
        window.location.href = '/';
        return Promise.reject(new Error('Token expired'));
      }
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Add response interceptor to handle token errors
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (
      error.response &&
      error.response.status === 401
    ) {
      localStorage.removeItem('authToken');
      localStorage.removeItem('authTokenExpiry');
      // Set a flag to show session expired message
      localStorage.setItem('showSessionExpiredMessage', '1');
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;