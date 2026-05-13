import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '../auth/AuthContext';
import { getPublicUserProfile } from '../api/userService';
import { openTeamsChat } from '../utils/teamsLink';
import {
  formatMajorLabel,
  formatRoleLabel,
  getUserDepartment,
  getRoleTheme,
  getUserInitials,
  resolveProfilePhotoUrl,
} from '../utils/userMeta';
import './UserPreviewModal.css';

const normalizeUser = (user) => {
  if (!user) {
    return null;
  }

  return {
    id: user.id ?? user.userId ?? user.studentId ?? null,
    name: user.name ?? user.fullName ?? 'Unknown User',
    email: user.email ?? '',
    role: user.role ?? user.userRole ?? '',
    department: getUserDepartment(user),
    universityId: user.universityId ?? user.universityID ?? user.studentNumber ?? '',
    profilePhotoUrl: user.profilePhotoUrl ?? user.photoUrl ?? '',
    phoneNumber: user.phoneNumber ?? '',
    specialty: user.specialty ?? '',
    officeHours: user.officeHours ?? '',
    createdAt: user.createdAt ?? null,
  };
};

const getContactLabel = (role) => {
  if (role === 'ROLE_SUPERVISOR') {
    return 'Contact Supervisor';
  }

  if (role === 'ROLE_STUDENT') {
    return 'Contact Student';
  }

  return 'Contact User';
};

const UserPreviewModal = ({ open, onClose, userId, user, title = 'User Profile' }) => {
  const { user: currentUser } = useAuth();
  const incomingSeedUser = useMemo(() => normalizeUser(user), [user]);
  const [lockedSelection, setLockedSelection] = useState({ userId: null, user: null });
  const seedUser = lockedSelection.user ?? incomingSeedUser;
  const stableUserId = lockedSelection.userId ?? userId ?? seedUser?.id ?? null;
  const [profile, setProfile] = useState(seedUser);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    if (!open) {
      setLockedSelection({ userId: null, user: null });
      return;
    }

    setLockedSelection((current) => {
      if (current.userId || current.user) {
        return current;
      }

      return {
        userId: userId ?? incomingSeedUser?.id ?? null,
        user: incomingSeedUser,
      };
    });
  }, [incomingSeedUser, open, userId]);

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    let cancelled = false;

    const loadProfile = async () => {
      setProfile(seedUser);
      setError('');

      if (!stableUserId) {
        return;
      }

      setIsLoading(true);
      try {
        const response = await getPublicUserProfile(stableUserId);
        if (!cancelled) {
          setProfile(normalizeUser(response) ?? seedUser);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err?.response?.data?.message || err?.message || 'Could not load user profile.');
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    void loadProfile();

    return () => {
      cancelled = true;
    };
  }, [open, seedUser, stableUserId, reloadToken]);

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        onClose?.();
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => {
      window.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, onClose]);

  if (!open) {
    return null;
  }

  const theme = getRoleTheme(profile?.role);
  const photoUrl = resolveProfilePhotoUrl(profile?.profilePhotoUrl);
  const contactLabel = getContactLabel(profile?.role);
  const canContact = Boolean(String(profile?.email || '').trim());
  const isSelfProfile = Boolean(
    (profile?.id && (currentUser?.id || currentUser?.userId || currentUser?.studentId) && String(profile.id) === String(currentUser.id ?? currentUser.userId ?? currentUser.studentId))
      || (profile?.email && currentUser?.email && String(profile.email).toLowerCase() === String(currentUser.email).toLowerCase())
  );

  const infoCards = [
    { label: 'Email', value: profile?.email || 'Not provided', full: true },
    { label: 'Department / Major', value: formatMajorLabel(profile, 'Not provided') },
    { label: 'University ID', value: profile?.universityId || 'Not provided' },
    { label: 'Phone Number', value: profile?.phoneNumber || 'Not provided' },
  ];

  if (profile?.specialty) {
    infoCards.push({ label: 'Specialty', value: profile.specialty, full: true });
  }

  if (profile?.role === 'ROLE_SUPERVISOR') {
    infoCards.push({ label: 'Office Hours', value: profile?.officeHours || 'Not provided', full: true });
  }

  return createPortal(
    <div className="user-preview-backdrop" onClick={onClose}>
      <div className="user-preview-modal" onClick={(event) => event.stopPropagation()} role="dialog" aria-modal="true" aria-label={title}>
        <div className="user-preview-header">
          <div className="user-preview-hero">
            <div className="user-preview-avatar" style={{ background: `linear-gradient(135deg, ${theme.accent}, #0f172a)` }}>
              {photoUrl ? <img src={photoUrl} alt={profile?.name || 'User'} /> : getUserInitials(profile?.name)}
            </div>
            <div className="user-preview-copy">
              <p className="user-preview-card-label">{title}</p>
              <h2 className="user-preview-name">{profile?.name || 'Unknown User'}</h2>
              <div className="user-preview-subline">
                <span className="user-preview-badge" style={{ color: theme.accent, background: theme.soft }}>
                  {formatRoleLabel(profile?.role)}
                </span>
                {isSelfProfile ? (
                  <span className="user-preview-badge self">
                    This is you
                  </span>
                ) : null}
              </div>
              {profile?.specialty ? <p className="user-preview-specialty">{profile.specialty}</p> : null}
            </div>
          </div>
          <button type="button" className="user-preview-close" aria-label="Close profile preview" onClick={onClose}>
            x
          </button>
        </div>

        <div className="user-preview-body">
          {isLoading && !profile ? (
            <div className="user-preview-state">
              <p className="user-preview-state-title">Loading profile...</p>
              <p className="user-preview-state-copy">Pulling the latest profile details from the portal.</p>
            </div>
          ) : error && !profile ? (
            <div className="user-preview-state">
              <p className="user-preview-state-title">Could not load user profile.</p>
              <p className="user-preview-state-copy">{error}</p>
              <button type="button" className="user-preview-btn secondary" onClick={() => setReloadToken((current) => current + 1)}>
                Retry
              </button>
            </div>
          ) : (
            <>
              {isLoading ? <p className="user-preview-note">Refreshing profile details...</p> : null}
              {error ? <p className="user-preview-note">{error}</p> : null}
              <div className="user-preview-grid">
                {infoCards.map((card) => (
                  <div key={card.label} className={`user-preview-card${card.full ? ' full' : ''}`}>
                    <p className="user-preview-card-label">{card.label}</p>
                    <p className="user-preview-card-value">{card.value}</p>
                  </div>
                ))}
              </div>
              <div className="user-preview-actions">
                <button type="button" className="user-preview-btn secondary" onClick={onClose}>
                  Close
                </button>
                {!isSelfProfile && canContact ? (
                  <button
                    type="button"
                    className="user-preview-btn primary"
                    onClick={() => openTeamsChat(profile?.email)}
                  >
                    {contactLabel} in Teams
                  </button>
                ) : null}
              </div>
            </>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
};

export default UserPreviewModal;
