import { apiClient } from './apiClient';

const unwrapList = (response) => {
  const payload = response?.data?.data ?? response?.data ?? [];
  return Array.isArray(payload) ? payload : [];
};

const getDirectoryPrefix = (scope = 'dean') => (scope === 'admin' ? '/v1/admin' : '/v1/dean');

export const getSupervisors = async (scope = 'dean') => {
  const response = await apiClient.get(`${getDirectoryPrefix(scope)}/supervisors`);
  return unwrapList(response);
};

export const getAllTeams = async (scope = 'dean') => {
  const response = await apiClient.get(`${getDirectoryPrefix(scope)}/teams`);
  return unwrapList(response);
};

export const getAllStudents = async (scope = 'dean') => {
  const response = await apiClient.get(`${getDirectoryPrefix(scope)}/students`);
  return unwrapList(response);
};
