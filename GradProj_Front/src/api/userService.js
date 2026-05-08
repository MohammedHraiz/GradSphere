import { apiClient } from './apiClient';

const buildQuery = (params = {}) => {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && String(value).trim() !== '') {
      searchParams.set(key, String(value).trim());
    }
  });
  const query = searchParams.toString();
  return query ? `?${query}` : '';
};

export const getAdminUsers = async (params = {}) => {
  const response = await apiClient.get(`/v1/admin/users${buildQuery(params)}`);
  const payload = response?.data?.users ?? response?.data?.data ?? response?.data ?? [];
  return Array.isArray(payload) ? payload : [];
};

export const parseAdminUsersResponse = (responseData) => {
  const payload = responseData?.users ?? responseData?.data ?? responseData ?? [];
  return Array.isArray(payload) ? payload : [];
};

export const createAdminUser = async (payload) => {
  const response = await apiClient.post('/v1/admin/users', payload);
  return response?.data;
};

export const updateAdminUser = async (userId, payload) => {
  const response = await apiClient.patch(`/v1/admin/users/${userId}`, payload);
  return response?.data;
};

export const getMyProfile = async () => {
  const response = await apiClient.get('/v1/users/me');
  return response?.data?.data ?? response?.data ?? null;
};

export const updateMyProfile = async (payload) => {
  const response = await apiClient.patch('/v1/users/me/profile', payload);
  return response?.data?.data ?? response?.data ?? null;
};

export const uploadProfilePhoto = async (file) => {
  const formData = new FormData();
  formData.append('photo', file);
  const response = await apiClient.post('/v1/users/me/profile-photo', formData);
  return response?.data?.data ?? response?.data ?? null;
};
