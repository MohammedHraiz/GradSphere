export const getMeetingTypeIcon = (type) => ({
  REVIEW: '🔍',
  CHECK_IN: '🤝',
  MILESTONE: '🚩',
}[type] || '📅');

export const getMeetingStatusIcon = (status) => ({
  REQUESTED: '🕓',
  SCHEDULED: '📅',
  COMPLETED: '✅',
  CANCELED: '⛔',
  REJECTED: '❌',
}[status] || '📅');

export const getAttendanceIcon = (status) => ({
  PRESENT: '✅',
  ABSENT: '❌',
  EXCUSED: '📝',
}[status] || '•');

export const getTaskStatusIcon = (status) => ({
  NOT_STARTED: '⏳',
  IN_PROGRESS: '🔄',
  BLOCKED: '🚧',
  COMPLETED: '✅',
}[status] || '•');

export const getPriorityIcon = (priority) => ({
  LOW: '🟢',
  MEDIUM: '🟡',
  HIGH: '🟠',
  CRITICAL: '🔴',
}[priority] || '•');

export const getMilestoneStatusIcon = (status) => ({
  NOT_STARTED: '🏁',
  IN_PROGRESS: '🔄',
  SUBMITTED: '📤',
  UNDER_REVIEW: '🔍',
  APPROVED: '✅',
  NEEDS_CHANGES: '🛠️',
  COMPLETED: '🎯',
}[status] || '🚩');
