import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../../api/apiClient';
import { useAuth } from '../../auth/AuthContext';
import FeedbackToast from '../../components/FeedbackToast';

const styles = `
.inv-page { min-height: 100vh; background: radial-gradient(circle at top, rgba(79,70,229,0.10), transparent 34%), linear-gradient(180deg, #020617 0%, #0f172a 100%); color: #e2e8f0; }
.inv-shell { max-width: 1360px; margin: 0 auto; padding: 32px 24px 56px; }
.inv-hero { display: flex; align-items: center; justify-content: space-between; gap: 20px; padding: 26px 28px; border-radius: 28px; border: 1px solid rgba(148,163,184,0.14); background: rgba(15,23,42,0.88); box-shadow: 0 30px 70px -28px rgba(2,6,23,0.8); backdrop-filter: blur(14px); }
.inv-kicker { margin: 0; font-size: 11px; font-weight: 800; letter-spacing: 0.32em; text-transform: uppercase; color: #94a3b8; }
.inv-title { margin: 10px 0 0; font-size: clamp(2.1rem, 4vw, 4rem); line-height: 1; font-weight: 900; letter-spacing: -0.05em; color: #f8fafc; }
.inv-desc { margin: 14px 0 0; max-width: 820px; font-size: 15px; line-height: 1.8; color: #94a3b8; }
.inv-refresh { width: 46px; height: 46px; flex: 0 0 auto; display: inline-flex; align-items: center; justify-content: center; border-radius: 9999px; border: 1px solid rgba(139,92,246,0.22); background: rgba(99,102,241,0.10); color: #c4b5fd; box-shadow: 0 18px 36px -26px rgba(99,102,241,0.8); cursor: pointer; transition: transform 160ms ease, background 160ms ease, border-color 160ms ease, color 160ms ease; }
.inv-refresh:hover { transform: translateY(-1px); background: rgba(99,102,241,0.16); border-color: rgba(167,139,250,0.38); color: #ddd6fe; }
.inv-layout { display: grid; grid-template-columns: minmax(0, 1fr) 320px; gap: 22px; margin-top: 22px; align-items: start; }
.inv-list { display: grid; gap: 16px; }
.inv-card { display: grid; grid-template-columns: 64px minmax(0, 1fr) auto; gap: 18px; align-items: center; padding: 20px; border-radius: 26px; border: 1px solid rgba(148,163,184,0.12); background: linear-gradient(180deg, rgba(15,23,42,0.98), rgba(15,23,42,0.92)); box-shadow: 0 24px 56px -38px rgba(2,6,23,0.9); transition: transform 180ms ease, border-color 180ms ease, box-shadow 180ms ease, background 180ms ease; }
.inv-card:hover { transform: translateY(-2px); border-color: rgba(129,140,248,0.30); box-shadow: 0 32px 60px -36px rgba(2,6,23,0.95); }
.inv-avatar { width: 64px; height: 64px; border-radius: 22px; display: flex; align-items: center; justify-content: center; background: linear-gradient(135deg, rgba(99,102,241,0.18), rgba(124,58,237,0.18)); border: 1px solid rgba(129,140,248,0.18); color: #c4b5fd; font-size: 1.2rem; font-weight: 900; letter-spacing: 0.12em; }
.inv-meta { min-width: 0; }
.inv-label { margin: 0; font-size: 11px; font-weight: 800; letter-spacing: 0.28em; text-transform: uppercase; color: #64748b; }
.inv-heading { margin: 10px 0 0; font-size: 1.3rem; line-height: 1.2; font-weight: 900; letter-spacing: -0.04em; color: #f8fafc; }
.inv-sender { margin: 8px 0 0; font-size: 14px; color: #cbd5e1; }
.inv-time { margin: 6px 0 0; font-size: 12px; color: #64748b; }
.inv-note { margin-top: 14px; padding: 14px 16px; border-radius: 18px; background: rgba(2,6,23,0.55); border: 1px solid rgba(148,163,184,0.10); color: #cbd5e1; line-height: 1.7; font-size: 14px; }
.inv-actions { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; justify-content: flex-end; }
.inv-btn { min-width: 122px; display: inline-flex; align-items: center; justify-content: center; gap: 8px; padding: 12px 18px; border-radius: 9999px; font-size: 14px; font-weight: 800; cursor: pointer; transition: transform 160ms ease, box-shadow 160ms ease, border-color 160ms ease, background 160ms ease, color 160ms ease, opacity 160ms ease; }
.inv-btn:disabled { cursor: not-allowed; opacity: 0.72; }
.inv-btn-accept { border: 1px solid rgba(139,92,246,0.15); background: linear-gradient(135deg, #7c3aed, #4f46e5); color: white; box-shadow: 0 18px 34px -24px rgba(124,58,237,0.95); }
.inv-btn-accept:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 24px 40px -26px rgba(124,58,237,0.95); }
.inv-btn-reject { border: 1px solid rgba(248,113,113,0.25); background: rgba(248,113,113,0.06); color: #fca5a5; }
.inv-btn-reject:hover:not(:disabled) { transform: translateY(-1px); background: rgba(248,113,113,0.10); border-color: rgba(248,113,113,0.35); color: #fecaca; }
.inv-btn-icon { width: 16px; height: 16px; }
.inv-sent { background: rgba(34,197,94,0.12); color: #4ade80; border-color: rgba(34,197,94,0.15); }
.inv-spinner { width: 14px; height: 14px; border-radius: 9999px; border: 2px solid rgba(255,255,255,0.25); border-top-color: currentColor; animation: invSpin 0.8s linear infinite; }
@keyframes invSpin { to { transform: rotate(360deg); } }
.inv-panel { position: sticky; top: 22px; display: grid; gap: 14px; }
.inv-panel-card { padding: 20px; border-radius: 24px; border: 1px solid rgba(148,163,184,0.12); background: rgba(15,23,42,0.9); box-shadow: 0 24px 50px -34px rgba(2,6,23,0.9); }
.inv-panel-label { margin: 0; font-size: 11px; font-weight: 800; letter-spacing: 0.28em; text-transform: uppercase; color: #64748b; }
.inv-panel-title { margin: 10px 0 0; font-size: 1rem; font-weight: 800; color: #f8fafc; }
.inv-panel-text { margin: 10px 0 0; font-size: 14px; line-height: 1.8; color: #94a3b8; }
.inv-count { margin-top: 14px; font-size: 2.5rem; font-weight: 900; letter-spacing: -0.06em; color: #f8fafc; }
.inv-loader, .inv-empty, .inv-error { min-height: 320px; display: flex; align-items: center; justify-content: center; text-align: center; border-radius: 28px; border: 1px solid rgba(148,163,184,0.12); background: rgba(15,23,42,0.86); box-shadow: 0 24px 56px -38px rgba(2,6,23,0.9); }
.inv-card-shell { padding: 18px; }
.inv-empty-wrap, .inv-error-wrap, .inv-loader-wrap { max-width: 520px; padding: 0 12px; }
.inv-empty-ico, .inv-error-ico { width: 66px; height: 66px; margin: 0 auto 18px; display: flex; align-items: center; justify-content: center; border-radius: 22px; background: rgba(148,163,184,0.08); font-size: 1.8rem; }
.inv-empty-title, .inv-error-title { margin: 0; color: #f8fafc; font-size: 1.25rem; font-weight: 900; letter-spacing: -0.03em; }
.inv-empty-copy, .inv-error-copy { margin: 10px 0 0; color: #94a3b8; font-size: 14px; line-height: 1.8; }
.inv-error { border-color: rgba(239,68,68,0.20); background: rgba(127,29,29,0.14); }
.inv-error-ico { background: rgba(239,68,68,0.12); }
.inv-error-title { color: #fecaca; }
.inv-error-copy { color: #fecaca; }
.inv-action { margin-top: 20px; display: inline-flex; align-items: center; justify-content: center; border: 0; border-radius: 9999px; padding: 12px 18px; background: linear-gradient(135deg, #7c3aed, #4f46e5); color: white; font-size: 14px; font-weight: 800; cursor: pointer; box-shadow: 0 18px 32px -24px rgba(124,58,237,0.95); transition: transform 160ms ease, box-shadow 160ms ease; }
.inv-action:hover { transform: translateY(-1px); box-shadow: 0 24px 38px -26px rgba(124,58,237,0.95); }
.inv-reject-spin { color: #fca5a5; }
@media (max-width: 1024px) { .inv-layout { grid-template-columns: 1fr; } .inv-panel { position: static; } }
@media (max-width: 700px) { .inv-shell { padding: 18px 16px 40px; } .inv-hero { padding: 20px 18px; align-items: flex-start; } .inv-card { grid-template-columns: 1fr; } .inv-actions { justify-content: stretch; } .inv-btn { width: 100%; } }
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
            <p className="inv-kicker">Collaboration</p>
            <h1 className="inv-title">Invitations Inbox</h1>
            <p className="inv-desc">Review pending team invitations, accept the one you want, or decline the rest.</p>
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
                  <div className="flex items-center justify-center gap-3 text-slate-300">
                    <span className="inv-spinner" />
                    <span className="text-sm font-semibold text-slate-300">Loading invitations...</span>
                  </div>
                  <div className="mt-6 grid gap-4 xl:grid-cols-2">
                    {Array.from({ length: 4 }).map((_, index) => (
                      <div key={index} className="inv-card-shell rounded-[24px] border border-slate-800 bg-slate-950/70">
                        <div className="flex items-start gap-4">
                          <div className="h-14 w-14 rounded-2xl bg-slate-800" />
                          <div className="flex-1 space-y-3">
                            <div className="h-3 w-24 rounded bg-slate-800" />
                            <div className="h-5 w-3/4 rounded bg-slate-800" />
                            <div className="h-4 w-1/2 rounded bg-slate-800" />
                          </div>
                        </div>
                        <div className="mt-5 flex gap-3">
                          <div className="h-11 flex-1 rounded-full bg-slate-800" />
                          <div className="h-11 flex-1 rounded-full bg-slate-800" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : error ? (
              <div className="inv-error">
                <div className="inv-error-wrap">
                  <div className="inv-error-ico">⚠️</div>
                  <h2 className="inv-error-title">Unable to load invitations</h2>
                  <p className="inv-error-copy">{error}</p>
                  <button type="button" onClick={() => void loadInvitations()} className="inv-action">Try Again</button>
                </div>
              </div>
            ) : invitationCount === 0 ? (
              <div className="inv-empty">
                <div className="inv-empty-wrap">
                  <div className="inv-empty-ico">🧘</div>
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
                      <p className="inv-sender">Sent by <span className="font-semibold text-slate-100">{invitation.senderName}</span>{invitation.senderRole ? <span className="text-slate-500"> • {invitation.senderRole}</span> : null}</p>
                      <p className="inv-time">{invitation.receivedLabel}</p>
                      {invitation.message ? <div className="inv-note">{invitation.message}</div> : null}
                    </div>

                    <div className="inv-actions">
                      <button
                        type="button"
                        disabled={Boolean(loading)}
                        onClick={() => void handleAccept(invitation.id)}
                        className={`inv-btn inv-btn-accept ${loading === 'sent' ? 'inv-sent' : ''}`}
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
                        {isRejecting ? <span className="inv-spinner inv-reject-spin" /> : <CloseIcon />}
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
              <p className="inv-panel-text">If you are already in a team, the backend returns a conflict and we surface that message immediately.</p>
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
