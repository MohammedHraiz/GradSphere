import { apiClient } from './apiClient';

export const getNotifications = () => apiClient.get('/v1/notifications');

export const getUnreadNotificationCount = () => apiClient.get('/v1/notifications/unread-count');

export const markNotificationAsRead = (notificationId) => apiClient.patch(`/v1/notifications/${notificationId}/read`);

export const markAllNotificationsAsRead = () => apiClient.patch('/v1/notifications/read-all');

export const clearAllNotifications = () => apiClient.delete('/v1/notifications/clear-all');

export const clearReadNotifications = () => apiClient.delete('/v1/notifications/clear-read');
