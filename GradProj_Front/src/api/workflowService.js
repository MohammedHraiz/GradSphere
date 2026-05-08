import { apiClient } from './apiClient';

export const getProjectTasks = async (projectId) => {
  const response = await apiClient.get(`/projects/${projectId}/tasks`);
  return response?.data ?? [];
};

export const createProjectTask = async (projectId, payload) => {
  const response = await apiClient.post(`/projects/${projectId}/tasks`, payload);
  return response?.data ?? null;
};

export const updateTask = async (taskId, payload) => {
  const response = await apiClient.patch(`/tasks/${taskId}`, payload);
  return response?.data ?? null;
};

export const updateTaskStatus = async (taskId, status) => {
  const response = await apiClient.patch(`/tasks/${taskId}/status`, { status });
  return response?.data ?? null;
};

export const deleteTask = async (taskId) => {
  await apiClient.delete(`/tasks/${taskId}`);
};

export const getProjectMilestones = async (projectId) => {
  const response = await apiClient.get(`/projects/${projectId}/milestones`);
  return response?.data ?? [];
};

export const createProjectMilestone = async (projectId, payload) => {
  const response = await apiClient.post(`/projects/${projectId}/milestones`, payload);
  return response?.data ?? null;
};

export const updateMilestone = async (milestoneId, payload) => {
  const response = await apiClient.patch(`/milestones/${milestoneId}`, payload);
  return response?.data ?? null;
};

export const submitMilestone = async (milestoneId, { notes, file }) => {
  const formData = new FormData();
  if (notes) {
    formData.append('notes', notes);
  }
  if (file) {
    formData.append('file', file);
  }
  const response = await apiClient.post(`/milestones/${milestoneId}/submission`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response?.data ?? null;
};

export const deleteMilestone = async (milestoneId) => {
  await apiClient.delete(`/milestones/${milestoneId}`);
};
