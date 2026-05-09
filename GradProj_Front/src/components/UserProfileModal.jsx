import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '../auth/AuthContext';
import { getMyProfile, updateMyProfile, uploadProfilePhoto } from '../api/userService';
import FeedbackToast from './FeedbackToast';
import './UserProfileModal.css';
import {
  formatDepartmentLabel,
  formatRoleLabel,
  getRoleTheme,
  getUserInitials,
  resolveProfilePhotoUrl,
} from '../utils/userMeta';

const MAX_PROFILE_IMAGE_SIZE = 2 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

const createDraftFromProfile = (profile) => ({
  phoneNumber: profile?.phoneNumber ?? '',
  specialty: profile?.specialty ?? '',
  officeHours: profile?.officeHours ?? '',
});

const getErrorMessage = (error, fallback) => error?.message || error?.response?.data?.message || fallback;

const UserProfileModal = ({ open, onClose }) => {
  const { currentUser, refreshUserProfile } = useAuth();
  const fileInputRef = useRef(null);
  const [savedProfile, setSavedProfile] = useState(currentUser ?? null);
  const [profileDraft, setProfileDraft] = useState(createDraftFromProfile(currentUser));
  const [isDraftDirty, setIsDraftDirty] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState(null);
  const [selectedPhotoFile, setSelectedPhotoFile] = useState(null);
  const [selectedPhotoPreview, setSelectedPhotoPreview] = useState('');
  const [selectedPhotoName, setSelectedPhotoName] = useState('');
  const isEditingRef = useRef(false);
  const isDraftDirtyRef = useRef(false);

  const role = savedProfile?.role ?? currentUser?.role ?? null;
  const roleTheme = useMemo(() => getRoleTheme(role), [role]);
  const isSupervisor = role === 'ROLE_SUPERVISOR';
  const savedAvatarSrc = resolveProfilePhotoUrl(savedProfile?.profilePhotoUrl);
  const avatarSrc = selectedPhotoPreview || savedAvatarSrc;

  const clearSelectedPhoto = () => {
    setSelectedPhotoFile(null);
    if (selectedPhotoPreview) {
      URL.revokeObjectURL(selectedPhotoPreview);
    }
    setSelectedPhotoPreview('');
    setSelectedPhotoName('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const syncDraftWithProfile = (profile) => {
    setProfileDraft(createDraftFromProfile(profile));
    setIsDraftDirty(false);
  };

  useEffect(() => {
    isEditingRef.current = isEditing;
    isDraftDirtyRef.current = isDraftDirty;
  }, [isEditing, isDraftDirty]);

  useEffect(() => {
    if (!open) {
      setIsEditing(false);
      setError('');
      clearSelectedPhoto();
      return;
    }

    const initialProfile = currentUser ?? null;
    setSavedProfile(initialProfile);
    syncDraftWithProfile(initialProfile);
    setIsEditing(false);
    setError('');

    let cancelled = false;

    const loadProfile = async () => {
      setIsLoading(!initialProfile);
      try {
        const latest = typeof refreshUserProfile === 'function'
          ? await refreshUserProfile()
          : await getMyProfile();
        if (cancelled || !latest) return;
        setSavedProfile(latest);
        if (!isEditingRef.current && !isDraftDirtyRef.current) {
          syncDraftWithProfile(latest);
        }
      } catch (err) {
        if (!cancelled) {
          setError(getErrorMessage(err, 'Unable to load profile.'));
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
  }, [open]);

  useEffect(() => {
    if (!open || isEditing || isDraftDirty) return;
    setSavedProfile(currentUser ?? null);
    syncDraftWithProfile(currentUser ?? null);
  }, [currentUser, open, isEditing, isDraftDirty]);

  useEffect(() => {
    if (!open) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  useEffect(() => () => {
    if (selectedPhotoPreview) {
      URL.revokeObjectURL(selectedPhotoPreview);
    }
  }, [selectedPhotoPreview]);

  if (!open) return null;

  const handleEditStart = () => {
    syncDraftWithProfile(savedProfile);
    setError('');
    clearSelectedPhoto();
    setIsEditing(true);
  };

  const handleCancel = () => {
    syncDraftWithProfile(savedProfile);
    setError('');
    clearSelectedPhoto();
    setIsEditing(false);
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setProfileDraft((current) => ({ ...current, [name]: value }));
    setIsDraftDirty(true);
  };

  const handleChooseImage = () => {
    fileInputRef.current?.click();
  };

  const handlePhotoSelect = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      setToast({ message: 'Profile photo must be JPG, PNG, or WebP.', type: 'error' });
      event.target.value = '';
      return;
    }

    if (file.size > MAX_PROFILE_IMAGE_SIZE) {
      setToast({ message: 'Profile photo must be 2MB or smaller.', type: 'error' });
      event.target.value = '';
      return;
    }

    if (selectedPhotoPreview) {
      URL.revokeObjectURL(selectedPhotoPreview);
    }

    setSelectedPhotoFile(file);
    setSelectedPhotoPreview(URL.createObjectURL(file));
    setSelectedPhotoName(file.name);
    setIsDraftDirty(true);
    setError('');
  };

  const handleSave = async (event) => {
    event.preventDefault();
    setIsSaving(true);
    setError('');

    try {
      const payload = {
        phoneNumber: profileDraft.phoneNumber.trim() || null,
        specialty: profileDraft.specialty.trim() || null,
      };

      if (isSupervisor) {
        payload.officeHours = profileDraft.officeHours.trim() || null;
      }

      let latestProfile = await updateMyProfile(payload);
      setSavedProfile(latestProfile);

      if (selectedPhotoFile) {
        latestProfile = await uploadProfilePhoto(selectedPhotoFile);
        setSavedProfile(latestProfile);
      }

      if (typeof refreshUserProfile === 'function') {
        const refreshed = await refreshUserProfile();
        if (refreshed) {
          latestProfile = refreshed;
          setSavedProfile(refreshed);
        }
      }

      syncDraftWithProfile(latestProfile);
      clearSelectedPhoto();
      setIsEditing(false);
      setToast({
        message: selectedPhotoFile ? 'Profile and photo updated successfully.' : 'Profile updated successfully.',
      });
    } catch (err) {
      const message = getErrorMessage(err, 'Unable to update profile.');
      setError(message);
      setToast({ message, type: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  const detailCards = [
    { label: 'Email', value: savedProfile?.email || 'Not available' },
    { label: 'University ID', value: savedProfile?.universityId || 'Not assigned' },
    { label: 'Role', value: formatRoleLabel(role) },
    { label: 'Department', value: formatDepartmentLabel(savedProfile?.department) },
  ];

  return createPortal(
    <>
      <div className="profile-sheet-backdrop" onClick={onClose} role="presentation">
        <div className="profile-sheet" onClick={(event) => event.stopPropagation()}>
          <div className="profile-sheet-header" style={{ background: `linear-gradient(135deg, ${roleTheme.accent}, #4338ca)` }}>
            <button type="button" className="profile-sheet-close" onClick={onClose} aria-label="Close profile modal">
              &times;
            </button>

            <div className="profile-sheet-headline">
              <div className="profile-avatar-shell">
                <div className="profile-avatar" style={{ background: `linear-gradient(135deg, ${roleTheme.accent}, #1d4ed8)` }}>
                  {avatarSrc ? (
                    <img src={avatarSrc} alt={savedProfile?.name || 'User profile'} />
                  ) : (
                    getUserInitials(savedProfile?.name)
                  )}
                </div>
              </div>

              <div className="profile-identity">
                <p className="profile-sheet-kicker">Portal Profile</p>
                <h2 className="profile-sheet-title">{savedProfile?.name || 'My Profile'}</h2>
                <div className="profile-meta">
                  <span className="profile-role-badge" style={{ background: roleTheme.soft, color: roleTheme.accent }}>
                    {formatRoleLabel(role)}
                  </span>
                  {savedProfile?.department ? (
                    <span className="profile-chip">{formatDepartmentLabel(savedProfile.department)}</span>
                  ) : null}
                </div>
              </div>
            </div>
          </div>

          <div className="profile-sheet-scroll">
            <div className="profile-sheet-body">
              {isLoading && !savedProfile ? (
                <div className="profile-state">Loading your profile...</div>
              ) : (
                <div className="profile-stack">
                  <section className="profile-panel">
                    <div className="profile-section-heading">
                      <div>
                        <h3>Account Details</h3>
                        <p>These fields are read-only and can only be changed by the admin.</p>
                      </div>
                    </div>

                    <div className="profile-details-grid">
                      {detailCards.map((item) => (
                        <div key={item.label} className="profile-detail-card">
                          <span className="profile-detail-label">{item.label}</span>
                          <span className="profile-detail-value">{item.value}</span>
                        </div>
                      ))}
                    </div>

                    <div className="profile-helper-card">
                      Name, email, ID number, role, and department can only be changed by the admin.
                    </div>
                  </section>

                  <section className="profile-panel">
                    <div className="profile-section-heading">
                      <div>
                        <h3>Editable Profile</h3>
                        <p>Update the personal information and avatar you control.</p>
                      </div>
                    </div>

                    <form className="profile-form" onSubmit={handleSave}>
                      <div className="profile-photo-card">
                        <div className="profile-photo-preview-ring" style={{ background: roleTheme.soft }}>
                          <div className="profile-photo-preview-inner" style={{ background: `linear-gradient(135deg, ${roleTheme.accent}, #1d4ed8)` }}>
                            {avatarSrc ? (
                              <img src={avatarSrc} alt={savedProfile?.name || 'Profile preview'} />
                            ) : (
                              <span>{getUserInitials(savedProfile?.name)}</span>
                            )}
                          </div>
                        </div>

                        <div className="profile-photo-actions">
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                            className="profile-hidden-input"
                            onChange={handlePhotoSelect}
                          />
                          <div className="profile-photo-copy">
                            <strong>Profile Photo</strong>
                            <p>JPG, PNG, or WebP. Max 2MB.</p>
                          </div>
                          {isEditing ? (
                            <div className="profile-photo-buttons">
                              <button type="button" className="profile-btn-secondary" onClick={handleChooseImage} disabled={isSaving}>
                                Choose Image
                              </button>
                              {selectedPhotoFile ? (
                                <button type="button" className="profile-btn-secondary" onClick={clearSelectedPhoto} disabled={isSaving}>
                                  Remove Selection
                                </button>
                              ) : null}
                            </div>
                          ) : null}
                          {selectedPhotoName ? <span className="profile-photo-name">{selectedPhotoName}</span> : null}
                        </div>
                      </div>

                      <div className="profile-form-grid">
                        <div className="profile-form-group">
                          <label htmlFor="profile-phone-number">Phone Number</label>
                          <input
                            id="profile-phone-number"
                            className="profile-input"
                            name="phoneNumber"
                            value={profileDraft.phoneNumber}
                            onChange={handleChange}
                            placeholder="07XXXXXXXX"
                            disabled={!isEditing || isSaving}
                          />
                        </div>

                        <div className="profile-form-group">
                          <label htmlFor="profile-specialty">Specialty</label>
                          <input
                            id="profile-specialty"
                            className="profile-input"
                            name="specialty"
                            value={profileDraft.specialty}
                            onChange={handleChange}
                            placeholder="Frontend Developer"
                            disabled={!isEditing || isSaving}
                          />
                        </div>
                      </div>

                      {isSupervisor ? (
                        <div className="profile-form-group">
                          <label htmlFor="profile-office-hours">Office Hours</label>
                          <textarea
                            id="profile-office-hours"
                            className="profile-textarea"
                            name="officeHours"
                            value={profileDraft.officeHours}
                            onChange={handleChange}
                            placeholder="Sun & Tue, 10:00 AM - 12:00 PM"
                            disabled={!isEditing || isSaving}
                          />
                        </div>
                      ) : null}

                      {error ? <div className="profile-error">{error}</div> : null}

                      <div className="profile-toolbar">
                        {isEditing ? (
                          <>
                            <button type="button" className="profile-btn-secondary" onClick={handleCancel} disabled={isSaving}>
                              Cancel
                            </button>
                            <button
                              type="submit"
                              className="profile-btn"
                              style={{ background: `linear-gradient(135deg, ${roleTheme.accent}, #1d4ed8)`, color: '#fff' }}
                              disabled={isSaving}
                            >
                              {isSaving ? 'Saving...' : 'Save Profile'}
                            </button>
                          </>
                        ) : (
                          <button
                            type="button"
                            className="profile-btn"
                            style={{ background: `linear-gradient(135deg, ${roleTheme.accent}, #1d4ed8)`, color: '#fff' }}
                            onClick={handleEditStart}
                          >
                            Edit Profile
                          </button>
                        )}
                      </div>
                    </form>
                  </section>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <FeedbackToast message={toast?.message} type={toast?.type} onClose={() => setToast(null)} />
    </>,
    document.body,
  );
};

export default UserProfileModal;
