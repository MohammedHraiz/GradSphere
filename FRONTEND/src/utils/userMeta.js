export const ROLE_OPTIONS = [
  { value: 'ROLE_STUDENT', label: 'Student' },
  { value: 'ROLE_SUPERVISOR', label: 'Supervisor' },
  { value: 'ROLE_DEAN_OFFICE', label: 'Dean Office' },
  { value: 'ROLE_ADMIN', label: 'Admin' },
];

export const DEPARTMENT_OPTIONS = [
  { value: 'COMPUTER_SCIENCE', label: 'Computer Science' },
  { value: 'COMPUTER_INFORMATION_SCIENCE', label: 'Computer Information Science' },
  { value: 'SOFTWARE_ENGINEERING', label: 'Software Engineering' },
  { value: 'ANIMATION', label: 'Animation' },
];

const ROLE_LABELS = Object.fromEntries(ROLE_OPTIONS.map((option) => [option.value, option.label]));
const DEPARTMENT_LABELS = Object.fromEntries(DEPARTMENT_OPTIONS.map((option) => [option.value, option.label]));
const USER_STORAGE_KEY = 'user';
const PHOTO_VERSION_STORAGE_KEY = 'profilePhotoVersion';

const safeParseJson = (value) => {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
};

export const roleNeedsDepartment = (role) => role === 'ROLE_STUDENT' || role === 'ROLE_SUPERVISOR';

export const formatRoleLabel = (role) => ROLE_LABELS[role] ?? (String(role || '').replace(/^ROLE_/i, '').replace(/_/g, ' ') || 'Unknown');

export const formatDepartmentLabel = (department, fallback = 'Not assigned') => {
  const value = String(department || '').trim();
  if (!value) return fallback;
  return DEPARTMENT_LABELS[value] ?? value.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase());
};

export const getUserDepartment = (user) => user?.department ?? '';

export const formatMajorLabel = (user, fallback = 'Major not assigned') => formatDepartmentLabel(getUserDepartment(user), fallback);

export const resolveProfilePhotoUrl = (photoUrl) => {
  if (!photoUrl) return '';
  if (/^https?:\/\//i.test(photoUrl)) return photoUrl;
  const backendBase = (
    import.meta.env.VITE_API_BASE_URL
    || (import.meta.env.MODE === 'development' ? 'http://127.0.0.1:8080' : window.location.origin)
  ).replace(/\/+$/, '');
  const normalizedPath = photoUrl.startsWith('/') ? photoUrl : `/${photoUrl}`;
  const absoluteUrl = `${backendBase}${normalizedPath}`;
  const storedUser = safeParseJson(localStorage.getItem(USER_STORAGE_KEY));
  const normalizedBasePath = normalizedPath.split('?', 2)[0];

  if (storedUser?.id && normalizedBasePath === `/files/profile-photos/${storedUser.id}`) {
    const version = storedUser.profilePhotoVersion || localStorage.getItem(PHOTO_VERSION_STORAGE_KEY);
    if (version) {
      return `${absoluteUrl}${absoluteUrl.includes('?') ? '&' : '?'}v=${encodeURIComponent(version)}`;
    }
  }

  return absoluteUrl;
};

export const getUserInitials = (name) => {
  const tokens = String(name || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2);

  if (!tokens.length) return 'U';
  return tokens.map((token) => token.charAt(0).toUpperCase()).join('');
};

export const getRoleTheme = (role) => {
  switch (role) {
    case 'ROLE_ADMIN':
      return { accent: '#0ea5e9', soft: 'rgba(14, 165, 233, 0.14)', badge: 'admin' };
    case 'ROLE_DEAN_OFFICE':
      return { accent: '#f59e0b', soft: 'rgba(245, 158, 11, 0.14)', badge: 'dean' };
    case 'ROLE_SUPERVISOR':
      return { accent: '#7c3aed', soft: 'rgba(124, 58, 237, 0.14)', badge: 'supervisor' };
    default:
      return { accent: '#4f46e5', soft: 'rgba(79, 70, 229, 0.14)', badge: 'student' };
  }
};
