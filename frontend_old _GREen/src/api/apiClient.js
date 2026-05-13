import axios from 'axios';

// Environment-aware baseURL:
// - In development we use the Vite proxy at '/api' so requests like '/v1/...' become '/api/v1/...'
// - In production we use the configured VITE_API_BASE_URL when available, otherwise the current origin
export const backendRoot = (
  import.meta.env.VITE_API_BASE_URL
  || (import.meta.env.MODE === 'development' ? 'http://127.0.0.1:8080' : window.location.origin)
).replace(/\/+$/, '');

const baseURL = import.meta.env.MODE === 'development' ? '/api' : `${backendRoot}/api`;

export const apiClient = axios.create({
  baseURL,
  withCredentials: true,
  headers: {
    Accept: 'application/json',
  },
});

const TOKEN_STORAGE_KEYS = ['accessToken', 'token', 'jwt'];

const isPlainObject = (value) => Boolean(value) && typeof value === 'object' && !Array.isArray(value);

const extractFieldErrors = (payload) => {
  if (!payload) {
    return {};
  }

  if (isPlainObject(payload.fieldErrors)) {
    return payload.fieldErrors;
  }

  if (isPlainObject(payload.validationErrors)) {
    return payload.validationErrors;
  }

  if (isPlainObject(payload.errors)) {
    return payload.errors;
  }

  const payloadKeys = isPlainObject(payload) ? Object.keys(payload) : [];
  const isMessageOnly = payloadKeys.length > 0 && payloadKeys.every((key) => ['message', 'error', 'status', 'path', 'timestamp'].includes(key));

  if (!isMessageOnly && isPlainObject(payload) && Object.values(payload).every((value) => typeof value === 'string' || Array.isArray(value))) {
    return payload;
  }

  return {};
};

const readErrorPayload = async (payload) => {
  if (typeof Blob !== 'undefined' && payload instanceof Blob) {
    const text = await payload.text();

    if (!text) {
      return null;
    }

    try {
      return JSON.parse(text);
    } catch {
      return { message: text };
    }
  }

  return payload;
};

export const normalizeApiError = async (error) => {
  const responseData = await readErrorPayload(error?.response?.data);
  const status = error?.response?.status;
  const fieldErrors = status === 400 ? extractFieldErrors(responseData) : {};
  const firstFieldError = Object.values(fieldErrors)[0];
  const fallbackMessage = responseData?.message || responseData?.error || error?.message || 'Request failed';

  if (error?.response) {
    error.response.data = responseData;
  }

  error.status = status;
  error.fieldErrors = fieldErrors;
  error.validationErrors = fieldErrors;
  error.isValidationError = status === 400 && Object.keys(fieldErrors).length > 0;
  error.message = firstFieldError || fallbackMessage;

  return error;
};

apiClient.interceptors.request.use((config) => {
  const token = TOKEN_STORAGE_KEYS.map((key) => localStorage.getItem(key)).find(Boolean);

  if (token && !config.url.includes('/auth/')) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const requestUrl = String(error.config?.url ?? '');
    const isAuthRequest = requestUrl.includes('/auth/');

    if (error.response?.status === 401 && !isAuthRequest) {
      localStorage.clear(); 
      window.location.href = '/login';
    }
    return Promise.reject(await normalizeApiError(error));
  },
);

export const getValidationMessage = (fieldErrors, fieldName) => fieldErrors?.[fieldName] ?? '';

export const resolveBackendAssetUrl = (path) => {
  if (!path) return '';
  if (/^https?:\/\//i.test(path)) return path;
  return `${backendRoot}${path.startsWith('/') ? path : `/${path}`}`;
};
