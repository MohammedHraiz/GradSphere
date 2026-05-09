import React, { useCallback, useEffect, useRef, useState } from 'react';
import { apiClient } from '../api/apiClient';
import { useAuth } from '../auth/AuthContext';
import { formatDepartmentLabel, getUserInitials, resolveProfilePhotoUrl } from '../utils/userMeta';
import FeedbackToast from './FeedbackToast';
import SearchBar from './SearchBar';
import './InviteModal.css';

const FIXED_MAX_MEMBERS = 5;
const TEAM_FULL_MESSAGE = 'Your team is full. Maximum team size is 5 members.';

const getFriendlyError = (error, fallback = 'Unable to complete this request.') => {
  const message = error?.response?.data?.message || error?.message || fallback;
  if (/^Request failed/i.test(message) || /^AxiosError/i.test(message)) {
    return fallback;
  }
  return message;
};

const InviteModal = ({
  isOpen,
  onClose,
  onInviteSent,
  currentMembers = 0,
  maxMembers = FIXED_MAX_MEMBERS,
  isTeamFull = false,
}) => {
  const { user } = useAuth();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [inviteLoadingMap, setInviteLoadingMap] = useState({});
  const [invitedIds, setInvitedIds] = useState(() => new Set());
  const [toast, setToast] = useState({ msg: '', type: 'success' });
  const inputRef = useRef(null);
  const currentUserId = user?.id ?? user?.userId ?? user?.studentId ?? user?.uuid ?? '';
  const normalizedMaxMembers = Math.min(Number(maxMembers) || FIXED_MAX_MEMBERS, FIXED_MAX_MEMBERS);
  const normalizedMembers = Math.max(0, Number(currentMembers) || 0);
  const slotsRemaining = Math.max(normalizedMaxMembers - normalizedMembers, 0);
  const teamIsFull = isTeamFull || normalizedMembers >= normalizedMaxMembers;

  const normalizeStudent = (student) => ({
    id: student?.id ?? student?.userId ?? student?.uuid ?? '',
    name: student?.name || student?.fullName || [student?.firstName, student?.lastName].filter(Boolean).join(' ') || 'Unnamed Student',
    universityID: student?.studentId ?? student?.universityID ?? student?.universityId ?? student?.studentNumber ?? '',
    email: student?.email ?? '',
    department: student?.department ?? student?.major ?? '',
    profilePhotoUrl: student?.profilePhotoUrl ?? student?.photoUrl ?? '',
    hasTeam: Boolean(student?.hasTeam ?? student?.teamId ?? student?.team),
    eligible: student?.eligible !== false,
    reason: student?.reason ?? '',
  });

  const applyEligibilityFilter = useCallback((items) => items
    .map(normalizeStudent)
    .filter((student) => {
      const studentId = String(student.id ?? '').toLowerCase();
      const loggedInId = String(currentUserId ?? '').toLowerCase();
      return student.eligible && !student.hasTeam && studentId && studentId !== loggedInId;
    }), [currentUserId]);

  const showToast = useCallback((msg, type = 'success') => {
    setToast({ msg, type });
  }, []);

  const fetchResults = useCallback(async (rawQuery, { silent = false } = {}) => {
    const q = String(rawQuery || '').trim();
    if (!q || teamIsFull) {
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
      showToast(getFriendlyError(err, 'Unable to search students.'), 'error');
      return [];
    } finally {
      if (!silent) setLoading(false);
    }
  }, [applyEligibilityFilter, showToast, teamIsFull]);

  useEffect(() => {
    if (!isOpen) return;
    setResults([]);
    setQuery('');
    setInvitedIds(new Set());
    setInviteLoadingMap({});
    setTimeout(() => {
      inputRef.current?.querySelector('input')?.focus();
    }, 80);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const q = String(query || '').trim();
    if (!q || teamIsFull) {
      setResults([]);
      setLoading(false);
      return undefined;
    }

    const timeoutId = setTimeout(() => {
      void fetchResults(q);
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [query, isOpen, fetchResults, teamIsFull]);

  const sendInvite = async (studentId) => {
    if (!studentId || teamIsFull) {
      if (teamIsFull) showToast(TEAM_FULL_MESSAGE, 'error');
      return;
    }

    setInviteLoadingMap((prev) => ({ ...prev, [studentId]: true }));
    try {
      await apiClient.post(`/v1/invitations/send/${studentId}`);
      setInvitedIds((prev) => {
        const copy = new Set(prev);
        copy.add(studentId);
        return copy;
      });
      setResults((prev) => prev.filter((student) => String(student.id) !== String(studentId)));
      showToast('Invitation sent.', 'success');
      await onInviteSent?.();
      await fetchResults(query, { silent: true });
    } catch (err) {
      showToast(getFriendlyError(err, 'Failed to send invitation.'), 'error');
    } finally {
      setInviteLoadingMap((prev) => {
        const copy = { ...prev };
        delete copy[studentId];
        return copy;
      });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="invite-modal-backdrop" onClick={onClose}>
      <div className="invite-modal" onClick={(event) => event.stopPropagation()} role="dialog" aria-modal="true" aria-label="Invite member">
        <div className="invite-modal-header">
          <div>
            <p className="invite-modal-kicker">Team Invitations</p>
            <h2>Invite Member</h2>
            <p>Search eligible students and send a team invitation.</p>
          </div>
          <button className="invite-modal-close" onClick={onClose} aria-label="Close invite dialog">x</button>
        </div>

        <div className="invite-capacity-row">
          <div>
            <span>Team capacity</span>
            <strong>{normalizedMembers} / {normalizedMaxMembers} members</strong>
          </div>
          <em>{teamIsFull ? 'Your team is full.' : `${slotsRemaining} ${slotsRemaining === 1 ? 'slot' : 'slots'} remaining`}</em>
        </div>

        <div className="invite-modal-body">
          <div className="invite-search" ref={inputRef}>
            <SearchBar
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onClear={() => setQuery('')}
              placeholder="Search by name, email, or university ID..."
              disabled={teamIsFull}
            />
          </div>

          <div className="invite-results">
            {teamIsFull ? (
              <div className="invite-state invite-state--full">
                <strong>Your team is full. Maximum team size is 5 members.</strong>
                <span>Remove a member before sending another invitation.</span>
              </div>
            ) : loading ? (
              <div className="invite-state">
                <strong>Searching students...</strong>
                <span>Checking eligibility with the portal.</span>
              </div>
            ) : !query.trim() ? (
              <div className="invite-state">
                <strong>Search for eligible students to invite.</strong>
                <span>Students already in a team or with pending invites stay hidden.</span>
              </div>
            ) : results.length === 0 ? (
              <div className="invite-state">
                <strong>No eligible students found.</strong>
                <span>Try another name, email, or university ID.</span>
              </div>
            ) : (
              results.map((student) => {
                const sid = student.id ?? '';
                const isInvited = invitedIds.has(sid);
                const loadingButton = Boolean(inviteLoadingMap[sid]);
                const photoUrl = resolveProfilePhotoUrl(student.profilePhotoUrl);

                return (
                  <div key={sid} className="invite-result-card">
                    <div className="invite-result-main">
                      <div className="invite-avatar">
                        {photoUrl ? <img src={photoUrl} alt={student.name} /> : getUserInitials(student.name)}
                      </div>
                      <div className="invite-result-copy">
                        <strong>{student.name}</strong>
                        <span>{student.email || 'Email not available'}</span>
                        <small>
                          {[student.universityID || 'ID not available', formatDepartmentLabel(student.department, 'Major not available')]
                            .filter(Boolean)
                            .join(' | ')}
                        </small>
                      </div>
                    </div>

                    <button
                      type="button"
                      disabled={isInvited || loadingButton}
                      onClick={() => void sendInvite(sid)}
                      className={isInvited ? 'invite-result-button invited' : 'invite-result-button'}
                    >
                      {loadingButton ? 'Sending...' : isInvited ? 'Invited' : 'Invite'}
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="invite-modal-footer">
          <button type="button" className="invite-footer-button" onClick={onClose}>Close</button>
        </div>
      </div>

      <FeedbackToast message={toast.msg} type={toast.type} onClose={() => setToast({ msg: '', type: 'success' })} />
    </div>
  );
};

export default InviteModal;
