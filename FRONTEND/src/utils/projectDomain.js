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
const CANONICAL_PROJECT_DOMAINS = [...PROJECT_DOMAIN_OPTIONS, UNCATEGORIZED_PROJECT_DOMAIN];
export const ALL_PROJECT_DOMAINS_OPTION = { label: 'All Categories', value: 'all' };

export const normalizeProjectDomainValue = (value, fallback = UNCATEGORIZED_PROJECT_DOMAIN) => {
  const canonicalLabel = getProjectDomainLabel(value, fallback);
  return String(canonicalLabel || '')
    .trim()
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/\s+/g, ' ')
    .replace(/\s*\/\s*/g, '/');
};

const normalizeDomainKey = (value) => String(value || '')
  .trim()
  .toLowerCase()
  .replace(/&/g, 'and')
  .replace(/\s+/g, ' ')
  .replace(/\s*\/\s*/g, '/');

const PROJECT_DOMAIN_LOOKUP = CANONICAL_PROJECT_DOMAINS.reduce((accumulator, domain) => {
  accumulator[normalizeDomainKey(domain)] = domain;
  return accumulator;
}, {});

export const getProjectDomainLabel = (value, fallback = UNCATEGORIZED_PROJECT_DOMAIN) => {
  const normalized = String(value || '').trim();
  if (!normalized) {
    return fallback;
  }

  return PROJECT_DOMAIN_LOOKUP[normalizeDomainKey(normalized)] || normalized;
};

export const resolveProjectDomainValue = (...sources) => {
  for (const source of sources) {
    if (!source || typeof source !== 'object') continue;

    const candidates = [
      source.projectDomain,
      source.project_domain,
      source.projectCategory,
      source.domain,
      source.category,
      source.project?.project_domain,
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

export const getProjectDomain = (source, fallback = UNCATEGORIZED_PROJECT_DOMAIN) => (
  getProjectDomainLabel(resolveProjectDomainValue(source), fallback)
);

export const getProjectDomainOptions = (items, resolver = (item) => resolveProjectDomainValue(item)) => (
  [
    ...CANONICAL_PROJECT_DOMAINS,
    ...Array.from(
      new Set(
        (items || [])
          .map((item) => resolver(item))
          .filter(Boolean)
          .map((value) => getProjectDomainLabel(value))
          .filter((value) => !CANONICAL_PROJECT_DOMAINS.includes(value)),
      ),
    ).sort((left, right) => left.localeCompare(right)),
  ]
);

export const PROJECT_DOMAIN_FILTER_OPTIONS = [
  ALL_PROJECT_DOMAINS_OPTION,
  ...CANONICAL_PROJECT_DOMAINS.map((label) => ({
    label,
    value: normalizeProjectDomainValue(label),
  })),
];

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
