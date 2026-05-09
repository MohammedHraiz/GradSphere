import { useMemo, useState } from 'react';
import UserPreviewModal from './UserPreviewModal';
import {
  formatRoleLabel,
  getRoleTheme,
  getUserInitials,
  resolveProfilePhotoUrl,
} from '../utils/userMeta';

const ClickableUser = ({
  user,
  userId,
  name,
  subtitle,
  role,
  className,
  style,
  avatarClassName,
  nameClassName,
  subtitleClassName,
  badge = false,
  onClick,
}) => {
  const [activePreviewUser, setActivePreviewUser] = useState(null);

  const previewUser = useMemo(() => ({
    ...(user ?? {}),
    id: user?.id ?? user?.userId ?? user?.studentId ?? userId ?? null,
    name: user?.name ?? name ?? 'Unknown User',
    role: user?.role ?? role ?? '',
  }), [name, role, user, userId]);

  const theme = getRoleTheme(previewUser?.role);
  const photoUrl = resolveProfilePhotoUrl(previewUser?.profilePhotoUrl);
  const resolvedSubtitle = subtitle ?? (previewUser?.role ? formatRoleLabel(previewUser.role) : '');

  const handleOpen = () => {
    onClick?.(previewUser);
    setActivePreviewUser(previewUser);
  };

  return (
    <>
      <button
        type="button"
        className={className}
        style={style}
        onClick={handleOpen}
        aria-label={`View ${previewUser?.name || 'user'} profile`}
      >
        <span
          className={avatarClassName}
          style={!photoUrl ? { background: `linear-gradient(135deg, ${theme.accent}, #0f172a)` } : undefined}
        >
          {photoUrl ? <img src={photoUrl} alt={previewUser?.name || 'User'} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : getUserInitials(previewUser?.name)}
        </span>
        <span style={{ minWidth: 0, display: 'grid', gap: '2px', textAlign: 'left' }}>
          <span className={nameClassName}>{previewUser?.name || 'Unknown User'}</span>
          {resolvedSubtitle ? <span className={subtitleClassName}>{resolvedSubtitle}</span> : null}
          {badge ? (
            <span style={{ display: 'inline-flex', width: 'fit-content', marginTop: 4, padding: '4px 8px', borderRadius: 999, background: theme.soft, color: theme.accent, fontSize: 10, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              {formatRoleLabel(previewUser?.role)}
            </span>
          ) : null}
        </span>
      </button>
      <UserPreviewModal
        open={Boolean(activePreviewUser)}
        onClose={() => setActivePreviewUser(null)}
        userId={activePreviewUser?.id}
        user={activePreviewUser}
      />
    </>
  );
};

export default ClickableUser;
