import { apiClient } from './apiClient';

const buildProposalFormData = (projectData, proposalFile) => {
  const formData = new FormData();

  formData.append('description', projectData.description ?? '');

  if (projectData.supervisorId) {
    formData.append('supervisorId', projectData.supervisorId);
  }

  if (projectData.requestMessage) {
    formData.append('requestMessage', projectData.requestMessage);
  }

  if (proposalFile) {
    formData.append('proposalFile', proposalFile, proposalFile.name);
  }

  if (projectData.studentChangeNote) {
    formData.append('studentChangeNote', projectData.studentChangeNote);
  }

  return formData;
};

export const submitProjectProposal = (projectData, proposalFile) => {
  return apiClient.post('/projects/submit', buildProposalFormData(projectData, proposalFile));
};

export const resubmitProjectProposal = (projectId, projectData, proposalFile) => {
  return apiClient.patch(`/projects/${projectId}/resubmit`, buildProposalFormData(projectData, proposalFile));
};

export const getMyProject = () => {
  return apiClient.get('/projects/my-project');
};

export const getAssignedProjects = () => {
  return apiClient.get('/projects/assigned');
};

export const getMySupervisorProjects = () => {
  return apiClient.get('/projects/supervisor/my');
};

export const getDeanProjects = () => {
  return apiClient.get('/projects/all');
};

export const getUnassignedProjects = () => {
  return apiClient.get('/projects/unassigned');
};

export const getSupervisors = () => {
  return apiClient.get('/v1/users/supervisors');
};

export const requestSupervisor = (projectId, supervisorId, message) => {
  return apiClient.post(`/v1/supervisor-requests/projects/${projectId}/request/${supervisorId}`, { message });
};

export const cancelSupervisorRequest = (requestId) => {
  return apiClient.patch(`/v1/supervisor-requests/${requestId}/cancel`);
};

export const getPendingSupervisorRequests = () => {
  return apiClient.get('/v1/supervisor-requests/my/pending');
};

export const acceptSupervisorRequest = (requestId) => {
  return apiClient.patch(`/v1/supervisor-requests/${requestId}/accept`);
};

export const rejectSupervisorRequest = (requestId, responseMessage) => {
  return apiClient.patch(`/v1/supervisor-requests/${requestId}/reject`, { responseMessage });
};

export const getAllSupervisorRequests = () => {
  return apiClient.get('/v1/supervisor-requests/all');
};

export const assignSupervisor = (projectId, supervisorId) => {
  return apiClient.patch(`/projects/${projectId}/assign-supervisor/${supervisorId}`);
};

export const updateProjectStatus = (projectId, newStatus, comment) => {
  return apiClient.patch(`/projects/${projectId}/feedback`, {
    newStatus,
    comment,
  });
};

export const downloadProposalFile = (projectId) => {
  return apiClient.get(`/projects/${projectId}/proposal-file`, {
    responseType: 'blob',
  });
};

export const getProjectSubmissions = (projectId) => {
  return apiClient.get(`/projects/${projectId}/submissions`);
};

export const downloadSubmissionFile = (projectId, submissionId) => {
  return apiClient.get(`/projects/${projectId}/submissions/${submissionId}/file`, {
    responseType: 'blob',
  });
};

export const downloadSingleMeetingForm = (meetingId) => {
  return apiClient.get(`/meetings/${meetingId}/download-form`, {
    responseType: 'blob',
  });
};

export const downloadAllMeetings = (projectId) => {
  return apiClient.get(`/projects/${projectId}/download-all-meetings`, {
    responseType: 'blob',
  });
};

export const archiveProject = (projectId) => {
  return apiClient.post(`/admin/archive/${projectId}`);
};
