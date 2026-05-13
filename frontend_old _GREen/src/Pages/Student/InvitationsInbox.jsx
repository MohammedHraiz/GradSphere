import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../../api/apiClient';
import { useAuth } from '../../auth/AuthContext';
import FeedbackToast from '../../components/FeedbackToast';

const styles = `
.inv-page { padding: 10px 20px 40px; font-family: 'Plus Jakarta Sans', -apple-system, sans-serif; color: #0f172a; text-align: left; }
.inv-shell { width: min(100%, 1180px); margin: 0 auto; display: grid; gap: 22px; }
.inv-hero { display: flex; align-items: flex-end; justify-content: space-between; gap: 20px; padding: 28px; border-radius: 28px; border: 1px solid #e2e8f0; background: linear-gradient(135deg, rgba(79,70,229,0.08), rgba(59,130,246,0.05)), #ffffff; box-shadow: 0 18px 42px -30px rgba(15,23,42,0.34); }
.inv-kicker { margin: 0; font-size: 12px; font-weight: 800; letter-spacing: 0.16em; text-transform: uppercase; color: #4f46e5; }
.inv-title { margin: 10px 0 0; font-size: clamp(2rem, 4vw, 3rem); line-height: 1.05; font-weight: 900; letter-spacing: -0.05em; color: #0f172a; }
.inv-desc { margin: 14px 0 0; max-width: 760px; font-size: 14px; line-height: 1.75; color: #64748b; font-weight: 600; }
.inv-refresh { width: 46px; height: 46px; flex: 0 0 auto; display: inline-flex; align-items: center; justify-content: center; border-radius: 9999px; border: 1px solid #dbeafe; background: #eef2ff; color: #4f46e5; box-shadow: 0 16px 30px -24px rgba(79,102,241,0.45); cursor: pointer; transition: transform 160ms ease, background 160ms ease, border-color 160ms ease, color 160ms ease, box-shadow 160ms ease; }
.inv-refresh:hover { transform: translateY(-1px); background: #e0e7ff; border-color: #c7d2fe; box-shadow: 0 20px 32px -24px rgba(79,102,241,0.5); }
.inv-layout { display: grid; grid-template-columns: minmax(0, 1fr) 320px; gap: 22px; align-items: start; }
.inv-list { display: grid; gap: 16px; }
.inv-card { display: grid; grid-template-columns: 64px minmax(0, 1fr) auto; gap: 18px; align-items: center; padding: 20px; border-radius: 26px; border: 1px solid #e2e8f0; background: linear-gradient(180deg, #ffffff, #f8fafc); box-shadow: 0 20px 44px -34px rgba(15,23,42,0.28); transition: transform 180ms ease, border-color 180ms ease, box-shadow 180ms ease; }
.inv-card:hover { transform: translateY(-2px); border-color: #c7d2fe; box-shadow: 0 26px 48px -34px rgba(79,70,229,0.22); }
.inv-avatar { width: 64px; height: 64px; border-radius: 22px; display: flex; align-items: center; justify-content: center; background: linear-gradient(135deg, #eef2ff, #dbeafe); border: 1px solid #c7d2fe; color: #4338ca; font-size: 1.2rem; font-weight: 900; letter-spacing: 0.12em; }
.inv-meta { min-width: 0; }
.inv-label { margin: 0; font-size: 11px; font-weight: 800; letter-spacing: 0.22em; text-transform: uppercase; color: #64748b; }
.inv-heading { margin: 10px 0 0; font-size: 1.3rem; line-height: 1.2; font-weight: 900; letter-spacing: -0.04em; color: #0f172a; }
.inv-sender { margin: 8px 0 0; font-size: 14px; color: #475569; }
.inv-time { margin: 6px 0 0; font-size: 12px; color: #64748b; }
.inv-note { margin-top: 14px; padding: 14px 16px; border-radius: 18px; background: #f8fafc; border: 1px solid #e2e8f0; color: #475569; line-height: 1.7; font-size: 14px; }
.inv-actions { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; justify-content: flex-end; }
.inv-btn { min-width: 122px; display: inline-flex; align-items: center; justify-content: center; gap: 8px; padding: 12px 18px; border-radius: 9999px; font-size: 14px; font-weight: 800; cursor: pointer; transition: transform 160ms ease, box-shadow 160ms ease, border-color 160ms ease, background 160ms ease, color 160ms ease, opacity 160ms ease; }
.inv-btn:disabled { cursor: not-allowed; opacity: 0.72; }
.inv-btn-accept { border: 1px solid rgba(139,92,246,0.15); background: linear-gradient(135deg, #7c3aed, #4f46e5); color: white; box-shadow: 0 18px 34px -24px rgba(124,58,237,0.95); }
.inv-btn-accept:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 24px 40px -26px rgba(124,58,237,0.95); }
.inv-btn-reject { border: 1px solid rgba(248,113,113,0.25); background: #fff1f2; color: #be123c; }
.inv-btn-reject:hover:not(:disabled) { transform: translateY(-1px); background: #ffe4e6; border-color: rgba(248,113,113,0.35); color: #9f1239; }
.inv-btn-icon { width: 16px; height: 16px; }
.inv-spinner { width: 14px; height: 14px; border-radius: 9999px; border: 2px solid rgba(255,255,255,0.25); border-top-color: currentColor; animation: invSpin 0.8s linear infinite; }
.inv-reject-spin { color: #be123c; }
@keyframes invSpin { to { transform: rotate(360deg); } }
.inv-panel { position: sticky; top: 22px; display: grid; gap: 14px; }
.inv-panel-card { padding: 20px; border-radius: 24px; border: 1px solid #e2e8f0; background: #ffffff; box-shadow: 0 18px 40px -34px rgba(15,23,42,0.26); }
.inv-panel-label { margin: 0; font-size: 11px; font-weight: 800; letter-spacing: 0.22em; text-transform: uppercase; color: #64748b; }
.inv-panel-title { margin: 10px 0 0; font-size: 1rem; font-weight: 800; color: #0f172a; }
.inv-panel-text { margin: 10px 0 0; font-size: 14px; line-height: 1.8; color: #64748b; }
.inv-count { margin-top: 14px; font-size: 2.5rem; font-weight: 900; letter-spacing: -0.06em; color: #0f172a; }
.inv-loader, .inv-empty, .inv-error { min-height: 320px; display: flex; align-items: center; justify-content: center; text-align: center; border-radius: 28px; border: 1px solid #e2e8f0; background: #ffffff; box-shadow: 0 20px 46px -34px rgba(15,23,42,0.28); }
.inv-empty-wrap, .inv-error-wrap, .inv-loader-wrap { max-width: 520px; padding: 0 12px; }
.inv-empty-ico, .inv-error-ico { width: 66px; height: 66px; margin: 0 auto 18px; display: flex; align-items: center; justify-content: center; border-radius: 22px; background: #eef2ff; color: #4338ca; font-size: 1.8rem; font-weight: 900; }
.inv-empty-title, .inv-error-title { margin: 0; color: #0f172a; font-size: 1.25rem; font-weight: 900; letter-spacing: -0.03em; }
.inv-empty-copy, .inv-error-copy { margin: 10px 0 0; color: #64748b; font-size: 14px; line-height: 1.8; }
.inv-error { border-color: #fecaca; background: #fff1f2; }
.inv-error-ico { background: #fee2e2; color: #b91c1c; }
.inv-error-title { color: #9f1239; }
.inv-error-copy { color: #be123c; }
.inv-action { margin-top: 20px; display: inline-flex; align-items: center; justify-content: center; border: 0; border-radius: 9999px; padding: 12px 18px; background: linear-gradient(135deg, #7c3aed, #4f46e5); color: white; font-size: 14px; font-weight: 800; cursor: pointer; box-shadow: 0 18px 32px -24px rgba(124,58,237,0.95); transition: transform 160ms ease, box-shadow 160ms ease; }
.inv-action:hover { transform: translateY(-1px); box-shadow: 0 24px 38px -26px rgba(124,58,237,0.95); }
.inv-skeleton-grid { margin-top: 24px; display: grid; gap: 14px; }
.inv-skeleton-card { padding: 18px; border-radius: 24px; border: 1px solid #e2e8f0; background: linear-gradient(180deg, #ffffff, #f8fafc); }
.inv-skeleton-row { display: flex; align-items: flex-start; gap: 16px; }
.inv-skeleton-avatar { width: 56px; height: 56px; border-radius: 18px; background: #e2e8f0; }
.inv-skeleton-meta { flex: 1; display: grid; gap: 10px; }
.inv-skeleton-line { height: 12px; border-radius: 999px; background: #e2e8f0; }
.inv-skeleton-line.title { height: 18px; width: 75%; }
.inv-skeleton-line.short { width: 32%; }
.inv-skeleton-line.medium { width: 55%; }
.inv-skeleton-actions { display: flex; gap: 12px; margin-top: 18px; }
.inv-skeleton-button { flex: 1; height: 44px; border-radius: 999px; background: #e2e8f0; }
@media (max-width: 1024px) { .inv-layout { grid-template-columns: 1fr; } .inv-panel { position: static; } }
@media (max-width: 700px) { .inv-page { padding: 10px 16px 34px; } .inv-hero { padding: 22px 20px; align-items: flex-start; flex-direction: column; } .inv-card { grid-template-columns: 1fr; } .inv-actions { justify-content: stretch; } .inv-btn { width: 100%; } }
`;

const getInitials = (value = '') => {
  const parts = String(value).trim().split(/\s+/).filter(Boolean);

  if (parts.length === 0) {
    return 'TI';
  }

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return `${parts[0][0] ?? ''}${parts[parts.length - 1][0] ?? ''}`.toUpperCase();
};

const formatRelativeTime = (value) => {
  if (!value) {
    return 'Received recently';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return 'Received recently';
  }

  const diffMinutes = Math.max(1, Math.floor((Date.now() - date.getTime()) / 60000));

  if (diffMinutes < 60) {
    return `Received ${diffMinutes} minute${diffMinutes === 1 ? '' : 's'} ago`;
  }

  const diffHours = Math.floor(diffMinutes / 60);

  if (diffHours < 24) {
    return `Received ${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
  }

  const diffDays = Math.floor(diffHours / 24);
  return `Received ${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
};

const normalizeInvitation = (invitation, index) => {
  const source = invitation?.data ?? invitation ?? {};
  const team = source.team ?? source.teamDto ?? source.invitingTeam ?? {};
  const sender = source.sender ?? source.senderDto ?? source.fromUser ?? source.invitedBy ?? {};
  const createdAt = source.createdAt ?? source.sentAt ?? source.invitedAt ?? '';

  return {
    id: source.id ?? source.invitationId ?? source.uuid ?? `${source.teamName ?? team.name ?? 'invitation'}-${index}`,
    teamName: source.teamName ?? team.name ?? team.teamName ?? 'Your Team',
    senderName: source.senderName ?? sender.name ?? sender.fullName ?? sender.username ?? 'Team Lead',
    senderRole: source.senderRole ?? sender.role ?? '',
    message: source.message ?? source.note ?? '',
    createdAt,
    receivedLabel: formatRelativeTime(createdAt),
    avatarLabel: getInitials(source.teamName ?? team.name ?? team.teamName ?? 'Team'),
  };
};

const InvitationsInbox = () => {
  const navigate = useNavigate();
  const { refreshUserProfile } = useAuth();
  const [invitations, setInvitations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState({});
  const [toast, setToast] = useState(null);

  const loadInvitations = useCallback(async () => {
    setIsLoading(true);
    setError('');

    try {
      const response = await apiClient.get('/v1/invitations/me');
      const payload = response?.data;
      const items = Array.isArray(payload)
        ? payload
        : Array.isArray(payload?.data)
          ? payload.data
          : Array.isArray(payload?.invitations)
            ? payload.invitations
            : [];

      setInvitations(items.map(normalizeInvitation));
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Unable to load invitations.');
      setInvitations([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadInvitations();
  }, [loadInvitations]);

  const showToast = (type, message) => {
    setToast({ type, message });
  };

  const removeInvitation = (invitationId) => {
    setInvitations((current) => current.filter((item) => item.id !== invitationId));
  };

  const setCardLoading = (invitationId, value) => {
    setActionLoading((current) => ({ ...current, [invitationId]: value }));
  };

  const handleAccept = async (invitationId) => {
    if (!invitationId) {
      return;
    }

    setCardLoading(invitationId, 'accept');

    try {
      await apiClient.post(`/v1/invitations/${invitationId}/accept`);
      if (refreshUserProfile) {
        try {
          await refreshUserProfile();
        } catch {
        }
      }
      showToast('success', 'You have joined the team!');
      removeInvitation(invitationId);
      navigate('/my-team', { replace: true });
    } catch (err) {
      const status = err?.status ?? err?.response?.status;
      const backendMessage = err?.response?.data?.message || err?.message || 'Unable to accept invitation.';

      if (status === 409) {
        showToast('error', backendMessage || 'You are already in a team.');
      } else {
        showToast('error', backendMessage);
      }
    } finally {
      setCardLoading(invitationId, false);
    }
  };

  const handleReject = async (invitationId) => {
    if (!invitationId) {
      return;
    }

    setCardLoading(invitationId, 'reject');

    try {
      await apiClient.post(`/v1/invitations/${invitationId}/reject`);
      showToast('success', 'Invitation rejected.');
      removeInvitation(invitationId);
    } catch (err) {
      showToast('error', err?.response?.data?.message || err?.message || 'Unable to reject invitation.');
    } finally {
      setCardLoading(invitationId, false);
    }
  };

  const invitationCount = invitations.length;

  return (
    <div className="inv-page">
      <style>{styles}</style>
      <div className="inv-shell">
        <section className="inv-hero">
          <div>
            <p className="inv-kicker">Student Portal / Collaboration</p>
            <h1 className="inv-title">Invitations Inbox</h1>
            <p className="inv-desc">Review pending team invitations, accept the one you want, or decline the rest without leaving the student dashboard flow.</p>
          </div>

          <button type="button" onClick={() => void loadInvitations()} aria-label="Refresh invitations" className="inv-refresh">
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="inv-btn-icon">
              <path d="M21 12a9 9 0 1 1-3-6.7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M21 3v6h-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </section>

        <div className="inv-layout">
          <main className="inv-list">
            {isLoading ? (
              <div className="inv-loader">
                <div className="inv-loader-wrap">
                  <div className="flex items-center justify-center gap-3 text-slate-500">
                    <span className="inv-spinner" style={{ borderColor: 'rgba(79,70,229,0.15)', borderTopColor: '#4f46e5' }} />
                    <span className="text-sm font-semibold text-slate-500">Loading invitations...</span>
                  </div>
                  <div className="inv-skeleton-grid">
                    {Array.from({ length: 4 }).map((_, index) => (
                      <div key={index} className="inv-skeleton-card">
                        <div className="inv-skeleton-row">
                          <div className="inv-skeleton-avatar" />
                          <div className="inv-skeleton-meta">
                            <div className="inv-skeleton-line short" />
                            <div className="inv-skeleton-line title" />
                            <div className="inv-skeleton-line medium" />
                          </div>
                        </div>
                        <div className="inv-skeleton-actions">
                          <div className="inv-skeleton-button" />
                          <div className="inv-skeleton-button" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : error ? (
              <div className="inv-error">
                <div className="inv-error-wrap">
                  <div className="inv-error-ico">!</div>
                  <h2 className="inv-error-title">Unable to load invitations</h2>
                  <p className="inv-error-copy">{error}</p>
                  <button type="button" onClick={() => void loadInvitations()} className="inv-action">Try Again</button>
                </div>
              </div>
            ) : invitationCount === 0 ? (
              <div className="inv-empty">
                <div className="inv-empty-wrap">
                  <div className="inv-empty-ico">0</div>
                  <h2 className="inv-empty-title">You have no pending team invitations</h2>
                  <p className="inv-empty-copy">When a team invites you, it will appear here so you can join or decline instantly.</p>
                </div>
              </div>
            ) : (
              invitations.map((invitation) => {
                const loading = actionLoading[invitation.id];
                const isAccepting = loading === 'accept';
                const isRejecting = loading === 'reject';

                return (
                  <article key={invitation.id} className="inv-card">
                    <div className="inv-avatar">{invitation.avatarLabel}</div>

                    <div className="inv-meta">
                      <p className="inv-label">Invitation</p>
                      <h2 className="inv-heading">Team {invitation.teamName} invited you</h2>
                      <p className="inv-sender">
                        Sent by <span className="font-semibold text-slate-900">{invitation.senderName}</span>
                        {invitation.senderRole ? <span className="text-slate-500"> | {invitation.senderRole}</span> : null}
                      </p>
                      <p className="inv-time">{invitation.receivedLabel}</p>
                      {invitation.message ? <div className="inv-note">{invitation.message}</div> : null}
                    </div>

                    <div className="inv-actions">
                      <button
                        type="button"
                        disabled={Boolean(loading)}
                        onClick={() => void handleAccept(invitation.id)}
                        className="inv-btn inv-btn-accept"
                      >
                        {isAccepting ? <span className="inv-spinner" /> : <CheckIcon />}
                        <span>{isAccepting ? 'Accepting' : 'Accept'}</span>
                      </button>

                      <button
                        type="button"
                        disabled={Boolean(loading)}
                        onClick={() => void handleReject(invitation.id)}
                        className="inv-btn inv-btn-reject"
                      >
                        {isRejecting ? <span className="inv-spinner inv-reject-spin" style={{ borderColor: 'rgba(190,24,93,0.2)', borderTopColor: '#be123c' }} /> : <CloseIcon />}
                        <span>{isRejecting ? 'Rejecting' : 'Reject'}</span>
                      </button>
                    </div>
                  </article>
                );
              })
            )}
          </main>

          <aside className="inv-panel">
            <div className="inv-panel-card">
              <p className="inv-panel-label">Inbox Summary</p>
              <div className="inv-count">{invitationCount}</div>
              <p className="inv-panel-title">Pending invitations</p>
              <p className="inv-panel-text">Use this inbox to join a team in one step or decline invitations you do not want.</p>
            </div>

            <div className="inv-panel-card">
              <p className="inv-panel-label">Tip</p>
              <p className="inv-panel-title">Fast accept flow</p>
              <p className="inv-panel-text">If you are already in a team, the backend returns a conflict and the same message is shown here immediately.</p>
            </div>
          </aside>
        </div>

        <FeedbackToast message={toast?.message} type={toast?.type} onClose={() => setToast(null)} />
      </div>
    </div>
  );
};

const CheckIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="inv-btn-icon">
    <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const CloseIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="inv-btn-icon">
    <path d="M18 6L6 18" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M6 6l12 12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export default InvitationsInbox;
