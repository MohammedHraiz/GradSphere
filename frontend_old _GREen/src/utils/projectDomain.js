export const PROJECT_DOMAIN_OPTIONS = [
  'Web',
  'Mobile',
  'AI / Machine Learning',
  'Data Science',
  'Cybersecurity',
  'Hardware',
  'IoT',
  'Embedded Systems',
  'Networking',
  'Game Development',
  'Other',
];

export const UNCATEGORIZED_PROJECT_DOMAIN = 'Uncategorized';

export const getProjectDomainLabel = (value, fallback = UNCATEGORIZED_PROJECT_DOMAIN) => {
  const normalized = String(value || '').trim();
  return normalized || fallback;
};

export const getSortedProjectDomainCounts = (counts) => (
  Object.entries(counts || {})
    .map(([domain, count]) => [getProjectDomainLabel(domain), Number(count) || 0])
    .filter(([, count]) => count > 0)
    .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
);
