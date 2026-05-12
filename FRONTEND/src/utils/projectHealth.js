const PROJECT_HEALTH_META = {
  EXCELLENT: { label: 'Excellent', icon: '★', className: 'excellent' },
  ON_TRACK: { label: 'On Track', icon: '✓', className: 'on-track' },
  AT_RISK: { label: 'At Risk', icon: '!', className: 'at-risk' },
  DELAYED: { label: 'Delayed', icon: '⏱', className: 'delayed' },
};

export const normalizeProjectHealth = (health) => String(health || 'ON_TRACK').toUpperCase();

export const getProjectHealthMeta = (health) => PROJECT_HEALTH_META[normalizeProjectHealth(health)] ?? PROJECT_HEALTH_META.ON_TRACK;

export const formatProjectHealth = (health) => getProjectHealthMeta(health).label;
