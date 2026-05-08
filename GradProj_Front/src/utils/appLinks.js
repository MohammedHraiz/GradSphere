export const normalizeRoleSegment = (role) => {
  const rawRole = String(role || '').replace(/^ROLE_/i, '').toLowerCase();
  if (rawRole === 'dean_office' || rawRole === 'dean-office' || rawRole === 'deanoffice') {
    return 'dean';
  }
  return rawRole;
};

export const resolveNotificationLink = (role, rawLink) => {
  if (!rawLink) return null;
  if (/^\/(student|supervisor|dean|admin)\b/.test(rawLink)) return rawLink;

  const roleSegment = normalizeRoleSegment(role);
  const [path, query = ''] = rawLink.split('?');
  const search = query ? `?${query}` : '';

  if (path === '/project') {
    if (roleSegment === 'student') return `/student/project${search}`;
    return `/${roleSegment}/projects${search}`;
  }

  if (path === '/meetings') {
    return `/${roleSegment}/meetings${search}`;
  }

  if (path === '/invitations') {
    return '/student/invitations';
  }

  if (path === '/my-team') {
    return '/student/my-team';
  }

  if (path === '/notifications') {
    return `/${roleSegment}/notifications`;
  }

  return `/${roleSegment}${path}${search}`;
};
