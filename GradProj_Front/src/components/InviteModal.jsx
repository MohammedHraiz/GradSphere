import React, { useCallback, useEffect, useRef, useState } from 'react';
import { apiClient } from '../api/apiClient';
import { useAuth } from '../auth/AuthContext';
import FeedbackToast from './FeedbackToast';

const InviteModal = ({ isOpen, onClose, onInviteSent }) => {
  const { user } = useAuth();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [inviteLoadingMap, setInviteLoadingMap] = useState({});
  const [invitedIds, setInvitedIds] = useState(() => new Set());
  const [toast, setToast] = useState({ msg: '', type: 'success' });
  const inputRef = useRef(null);
  const currentUserId = user?.id ?? user?.userId ?? user?.studentId ?? user?.uuid ?? '';

  const normalizeStudent = (student) => ({
    id: student?.id ?? student?.userId ?? student?.uuid ?? '',
    name: student?.name ?? student?.fullName ?? 'Unnamed',
    universityID: student?.studentId ?? student?.universityID ?? student?.universityId ?? student?.studentNumber ?? '',
    email: student?.email ?? '',
    hasTeam: Boolean(student?.hasTeam ?? student?.teamId ?? student?.team),
    eligible: student?.eligible !== false,
    reason: student?.reason ?? '',
  });

  const applyEligibilityFilter = (items) => items
    .map(normalizeStudent)
    .filter((student) => {
      const studentId = String(student.id ?? '').toLowerCase();
      const loggedInId = String(currentUserId ?? '').toLowerCase();
      return student.eligible && !student.hasTeam && studentId && studentId !== loggedInId;
    });

  const showToast = useCallback((msg, type = 'success') => {
    setToast({ msg, type });
  }, []);

  const fetchResults = useCallback(async (rawQuery, { silent = false } = {}) => {
    const q = String(rawQuery || '').trim();
    if (!q) {
      setResults([]);
      setLoading(false);
      return [];
    }

    if (!silent) setLoading(true);
    try {
      const res = await apiClient.get(`/v1/users/students/search?query=${encodeURIComponent(q)}`);
      const payload = res?.data ?? [];
      const students = Array.isArray(payload) ? payload : Array.isArray(payload?.students) ? payload.students : [];
      const eligibleStudents = applyEligibilityFilter(students);
      setResults(eligibleStudents);
      return eligibleStudents;
    } catch (err) {
      setResults([]);
      showToast(err?.response?.data?.message || err?.message || 'Unable to search students', 'error');
      return [];
    } finally {
      if (!silent) setLoading(false);
    }
  }, [currentUserId, showToast]);

  useEffect(() => {
    if (!isOpen) return;
    setResults([]);
    setQuery('');
    setTimeout(() => { try { inputRef.current?.focus(); } catch {} }, 60);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const q = String(query || '').trim();
    if (!q) { setResults([]); setLoading(false); return; }
    const timeoutId = setTimeout(async () => {
      await fetchResults(q);
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [query, isOpen, fetchResults]);

  const sendInvite = async (studentId) => {
    if (!studentId) return;
    setInviteLoadingMap(prev => ({ ...prev, [studentId]: true }));
    try {
      await apiClient.post(`/v1/invitations/send/${studentId}`);
      setInvitedIds(prev => { const c = new Set(prev); c.add(studentId); return c; });
      setResults(prev => prev.filter(student => String(student.id) !== String(studentId)));
      showToast('Invitation sent.', 'success');
      onInviteSent?.();
      await fetchResults(query, { silent: true });
    } catch (err) {
      showToast(err?.response?.data?.message || err?.message || 'Failed to send invitation', 'error');
    } finally {
      setInviteLoadingMap(prev => { const copy = { ...prev }; delete copy[studentId]; return copy; });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="w-full max-w-3xl overflow-hidden rounded-[28px] shadow-[0_36px_90px_-30px_rgba(2,6,23,0.9)]" onClick={e => e.stopPropagation()} role="dialog" aria-modal="true" aria-label="Invite new member">
        <div className="modal-shell">
          <div className="modal-header-saas">
            <div className="modal-title-block">
              <h2>Invite Member</h2>
              <p className="modal-subtitle">Search students and send invitations instantly.</p>
            </div>
            <button className="btn-close-circle" onClick={onClose} aria-label="Close invite dialog">✕</button>
          </div>

          <div className="modal-body-saas">
            <div className="search-input-wrapper">
              <span className="search-icon-fixed">🔍</span>
              <input ref={inputRef} type="text" placeholder="Search by name, university ID, or email..." value={query} onChange={(e) => setQuery(e.target.value)} aria-label="Search eligible students" />
            </div>
            <p className="modal-subtitle" style={{ marginTop: '-6px' }}>Only eligible students without a team are shown here.</p>

            <div className="results-list">
              {loading && (
                <div className="invite-loading">
                  <div className="invite-empty-icon">⌛</div>
                  <p className="invite-empty-title">Searching students</p>
                  <p className="invite-empty-copy">Please wait while we fetch matching results.</p>
                </div>
              )}

              {!loading && query.trim() && results.length === 0 && (
                <div className="invite-empty">
                  <div className="invite-empty-icon">🔎</div>
                  <p className="invite-empty-title">No eligible students found</p>
                  <p className="invite-empty-copy">Try another name, university ID, or email.</p>
                </div>
              )}

              {!loading && !query.trim() && (
                <div className="invite-empty">
                  <div className="invite-empty-icon">👥</div>
                  <p className="invite-empty-title">Start typing to search</p>
                  <p className="invite-empty-copy">Find classmates and invite them to your team.</p>
                </div>
              )}

              {!loading && results.map((student) => {
                const sid = student.id ?? '';
                const displayId = student.universityID || student.email || '';
                const isInvited = invitedIds.has(sid);
                const loadingBtn = Boolean(inviteLoadingMap[sid]);

                return (
                  <div key={sid} className="invite-card">
                    <div className="invite-student">
                      <p className="invite-name">{student.name}</p>
                      <p className="invite-meta">{displayId}</p>
                    </div>

                    <div className="invite-actions">
                      <button disabled={isInvited || loadingBtn} onClick={() => void sendInvite(sid)} className={`invite-button ${isInvited ? 'invite-button--sent' : ''}`}>
                        {loadingBtn ? <><span className="invite-spinner" /> Sending...</> : isInvited ? <>✓ Sent</> : 'Send Invite'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <FeedbackToast message={toast.msg} type={toast.type} onClose={() => setToast({ msg: '', type: 'success' })} />
      </div>
    </div>
  );
};

export default InviteModal;
