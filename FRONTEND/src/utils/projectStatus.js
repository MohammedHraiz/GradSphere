export const normalizeProjectStatus = (status) => {
  const value = String(status || 'SUBMITTED').toUpperCase();

  if (value === 'PENDING') return 'SUBMITTED';
  if (value === 'FINAL_APPROVAL_DEAN') return 'APPROVED';
  if (value === 'REVISION_REQUIRED') return 'NEEDS_CHANGES';

  return value;
};

export const formatProjectStatus = (status) => {
  const value = normalizeProjectStatus(status).toLowerCase().split('_');
  return value.map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(' ');
};

export const getProjectStatusTone = (status) => {
  const value = normalizeProjectStatus(status);

  if (value === 'UNDER_REVIEW') return 'under-review';
  if (value === 'NEEDS_CHANGES') return 'needs-changes';
  if (value === 'APPROVED') return 'approved';
  if (value === 'REJECTED') return 'rejected';
  if (value === 'ARCHIVED') return 'archived';

  return 'submitted';
};
