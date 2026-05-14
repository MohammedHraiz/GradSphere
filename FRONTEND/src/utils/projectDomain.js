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

export const resolveProjectDomainValue = (...sources) => {
  for (const source of sources) {
    if (!source || typeof source !== 'object') continue;

    const candidates = [
      source.projectDomain,
      source.projectCategory,
      source.domain,
      source.category,
      source.project?.projectDomain,
      source.project?.projectCategory,
      source.project?.domain,
      source.project?.category,
    ];

    const match = candidates.find((value) => String(value || '').trim());
    if (match) {
      return String(match).trim();
    }
  }

  return '';
};

export const getProjectDomainOptions = (items, resolver = (item) => resolveProjectDomainValue(item)) => (
  Array.from(
    new Set(
      (items || [])
        .map((item) => resolver(item))
        .filter(Boolean)
        .map((value) => getProjectDomainLabel(value)),
    ),
  ).sort((left, right) => left.localeCompare(right))
);

export const coerceProjectDomainFilter = (value, options, allValue = 'All Categories') => {
  const normalized = getProjectDomainLabel(value, '');
  return normalized && options.includes(normalized) ? normalized : allValue;
};

export const getSortedProjectDomainCounts = (counts) => (
  Object.entries(counts || {})
    .map(([domain, count]) => [getProjectDomainLabel(domain), Number(count) || 0])
    .filter(([, count]) => count > 0)
    .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
);
