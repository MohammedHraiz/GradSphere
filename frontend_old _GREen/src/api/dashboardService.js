import { apiClient } from './apiClient';

export const getStudentDashboard = () => apiClient.get('/v1/dashboard/student');

export const getSupervisorDashboard = () => apiClient.get('/v1/dashboard/supervisor');

export const getDeanDashboard = () => apiClient.get('/v1/dashboard/dean');

export const getAdminDashboard = () => apiClient.get('/v1/dashboard/admin');
