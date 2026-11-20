import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3000/api',
  timeout: 10000, 
  headers: {
    'Content-Type': 'application/json',
  },
});

let accessToken = null;
let onUnauthorized = null;

export const setBearerToken = (token) => {
  accessToken = token || null;
};

export const setUnauthorizedHandler = (handler) => {
  onUnauthorized = handler;
};

api.interceptors.request.use(
  (config) => {
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const requestUrl = error.config?.url || '';

    const normalizedMessage =
      error.response?.data?.message || error.message || 'Erreur réseau';

    const isAuthOrSetupEndpoint =
      requestUrl.includes('/login') ||
      requestUrl.includes('/installation/status');

    if (status === 401 && !isAuthOrSetupEndpoint) {
      accessToken = null;
      if (typeof onUnauthorized === 'function') {
        onUnauthorized();
      }
    }

    const normalizedError = new Error(normalizedMessage);
    normalizedError.status = status;
    normalizedError.response = error.response;
    normalizedError.originalError = error;

    return Promise.reject(normalizedError);
  }
);

export default api;