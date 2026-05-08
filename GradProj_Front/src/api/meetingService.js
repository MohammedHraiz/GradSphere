import { apiClient } from './apiClient';

export const getProjectMeetings = (projectId) => apiClient.get(`/projects/${projectId}/meetings`);

export const createProjectMeeting = (projectId, payload) => apiClient.post(`/projects/${projectId}/meetings`, payload);

export const updateProjectMeeting = (meetingId, payload) => apiClient.put(`/meetings/${meetingId}`, payload);

export const deleteProjectMeeting = (meetingId) => apiClient.delete(`/meetings/${meetingId}`);

export const getMyMeetings = () => apiClient.get('/meetings/my');

export const getSupervisorMeetings = () => apiClient.get('/meetings/supervisor');

export const requestProjectMeeting = (projectId, payload) => apiClient.post(`/projects/${projectId}/meetings/request`, payload);

export const approveMeeting = (meetingId) => apiClient.patch(`/meetings/${meetingId}/approve`);

export const rejectMeeting = (meetingId) => apiClient.patch(`/meetings/${meetingId}/reject`);

export const completeMeeting = (meetingId, payload) => apiClient.patch(`/meetings/${meetingId}/complete`, payload);

export const cancelMeeting = (meetingId) => apiClient.patch(`/meetings/${meetingId}/cancel`);
