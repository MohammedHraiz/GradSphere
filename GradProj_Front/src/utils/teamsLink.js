export const buildTeamsChatLink = (email) => {
  const normalizedEmail = String(email || '').trim();
  if (!normalizedEmail) {
    return '';
  }

  return `https://teams.microsoft.com/l/chat/0/0?users=${encodeURIComponent(normalizedEmail)}`;
};

export const openTeamsChat = (email) => {
  const link = buildTeamsChatLink(email);
  if (!link || typeof window === 'undefined') {
    return false;
  }

  window.open(link, '_blank', 'noopener,noreferrer');
  return true;
};
