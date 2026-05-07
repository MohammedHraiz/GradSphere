import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getStudentDashboard } from '../../api/dashboardService';

const styles = `
.overview-viewport { padding: 10px 20px 40px; font-family: 'Plus Jakarta Sans', -apple-system, sans-serif; color: #0f172a; text-align: left; }
.hero-banner { background: linear-gradient(135deg, #4f46e5, #7c3aed); border-radius: 28px; padding: 34px 38px; color: white; display: flex; justify-content: space-between; gap: 20px; align-items: flex-end; box-shadow: 0 20px 25px -18px rgba(79,70,229,.6); }
.welcome-title { font-size: 34px; font-weight: 900; margin: 0 0 8px; letter-spacing: -1px; }
.welcome-subtitle { font-size: 15px; opacity: .92; margin: 0; line-height: 1.6; }
.date-badge { background: rgba(255,255,255,.18); padding: 11px 16px; border-radius: 14px; font-weight: 800; font-size: 13px; white-space: nowrap; }
.stats-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 18px; margin: 24px 0; }
.stat-card, .dash-card { background: white; border: 1px solid #e2e8f0; border-radius: 22px; padding: 22px; box-shadow: 0 10px 22px -24px rgba(15,23,42,.7); }
.stat-card { cursor: pointer; transition: .2s; }
.stat-card:hover { transform: translateY(-2px); border-color: #4f46e5; }
.stat-label { margin: 0 0 8px; color: #64748b; font-size: 11px; text-transform: uppercase; letter-spacing: .08em; font-weight: 900; }
.stat-value { margin: 0; color: #0f172a; font-size: 24px; font-weight: 900; overflow-wrap: anywhere; }
.dash-grid { display: grid; grid-template-columns: 1.5fr 1fr; gap: 22px; }
.dash-card h3 { margin: 0 0 16px; font-size: 19px; font-weight: 900; }
.info-row { display: flex; justify-content: space-between; gap: 18px; padding: 13px 0; border-bottom: 1px solid #f1f5f9; font-size: 14px; }
.info-row:last-child { border-bottom: 0; }
.info-row span:first-child { color: #64748b; font-weight: 800; }
.info-row span:last-child { color: #0f172a; font-weight: 900; text-align: right; }
.status-badge { display: inline-flex; padding: 7px 11px; border-radius: 9999px; font-size: 11px; font-weight: 900; text-transform: uppercase; }
.status-badge.submitted { background: #eef2ff; color: #4f46e5; }
.status-badge.review { background: #fef3c7; color: #b45309; }
.status-badge.changes { background: #fff7ed; color: #c2410c; }
.status-badge.approved { background: #d1fae5; color: #047857; }
.status-badge.rejected { background: #fee2e2; color: #b91c1c; }
.status-badge.archived { background: #e2e8f0; color: #334155; }
.quick-links { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 18px; }
.quick-links button { border: 0; border-radius: 12px; padding: 11px 14px; font-weight: 900; cursor: pointer; background: #0f172a; color: white; }
.empty-state, .loading-state, .error-state { border: 1px dashed #cbd5e1; border-radius: 18px; background: #f8fafc; padding: 22px; color: #64748b; font-weight: 700; line-height: 1.6; }
.error-state { border-color: #fecaca; background: #fff1f2; color: #be123c; }
@media (max-width: 900px) { .hero-banner, .dash-grid { flex-direction: column; display: flex; align-items: stretch; } .stats-grid { grid-template-columns: 1fr; } }
`;

const statusClass = (status) => {
  const value = String(status || '').toUpperCase();
  if (value === 'UNDER_REVIEW') return 'review';
  if (value === 'NEEDS_CHANGES' || value === 'REVISION_REQUIRED') return 'changes';
  if (value === 'APPROVED' || value === 'FINAL_APPROVAL_DEAN') return 'approved';
  if (value === 'REJECTED') return 'rejected';
  if (value === 'ARCHIVED') return 'archived';
  return 'submitted';
};

const visibleStatus = (status) => {
  const value = String(status || 'SUBMITTED').toUpperCase();
  if (value === 'PENDING') return 'SUBMITTED';
  if (value === 'FINAL_APPROVAL_DEAN') return 'APPROVED';
  if (value === 'REVISION_REQUIRED') return 'NEEDS_CHANGES';
  return value;
};

const Overview = () => {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      setError('');
      try {
        const response = await getStudentDashboard();
        setData(response?.data ?? null);
      } catch (err) {
        setError(err?.response?.data?.message || err?.message || 'Unable to load dashboard.');
      } finally {
        setIsLoading(false);
      }
    };
    void load();
  }, []);

  const currentDate = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div className="overview-viewport">
      <style>{styles}</style>
      <div className="hero-banner">
        <div>
          <h1 className="welcome-title">Welcome back, {data?.userName || 'Student'}</h1>
          <p className="welcome-subtitle">Your graduation project dashboard is now powered by live team, proposal, invitation, and feedback data.</p>
        </div>
        <div className="date-badge">{currentDate}</div>
      </div>

      {isLoading ? <div className="loading-state" style={{ marginTop: 24 }}>Loading dashboard...</div> : null}
      {error ? <div className="error-state" style={{ marginTop: 24 }}>{error}</div> : null}

      {!isLoading && !error && data ? (
        <>
          <div className="stats-grid">
            <div className="stat-card" onClick={() => navigate('/student/my-team')}><p className="stat-label">Team</p><p className="stat-value">{data.hasTeam ? data.teamName : 'No team yet'}</p></div>
            <div className="stat-card" onClick={() => navigate('/student/project')}><p className="stat-label">Project Status</p><p className="stat-value">{data.proposalSubmitted ? visibleStatus(data.projectStatus).replace(/_/g, ' ') : 'No proposal'}</p></div>
            <div className="stat-card" onClick={() => navigate('/student/invitations')}><p className="stat-label">Pending Invitations</p><p className="stat-value">{data.pendingReceivedInvitationsCount}</p></div>
          </div>

          <div className="dash-grid">
            <section className="dash-card">
              <h3>Project Snapshot</h3>
              {!data.hasTeam ? (
                <div className="empty-state">You are not in a team yet. Create or join a team to start the project lifecycle.</div>
              ) : !data.proposalSubmitted ? (
                <div className="empty-state">Your team has not submitted a proposal yet.</div>
              ) : (
                <>
                  <div className="info-row"><span>Project</span><span>{data.projectTitle}</span></div>
                  <div className="info-row"><span>Status</span><span><span className={`status-badge ${statusClass(data.projectStatus)}`}>{visibleStatus(data.projectStatus).replace(/_/g, ' ')}</span></span></div>
                  <div className="info-row"><span>Supervisor</span><span>{data.assignedSupervisorName || 'Not assigned yet'}</span></div>
                  <div className="info-row"><span>Latest Feedback</span><span>{data.latestFeedback || 'No feedback yet'}</span></div>
                  <div className="info-row"><span>Can Resubmit</span><span>{data.proposalCanResubmit ? 'Yes' : 'No'}</span></div>
                </>
              )}
              <div className="quick-links">
                <button onClick={() => navigate('/student/my-team')}>My Team</button>
                <button onClick={() => navigate('/student/project')}>Project Proposal</button>
                <button onClick={() => navigate('/student/invitations')}>Invitations</button>
              </div>
            </section>

            <aside className="dash-card">
              <h3>Team & Review</h3>
              <div className="info-row"><span>Team Members</span><span>{data.teamMemberCount}</span></div>
              <div className="info-row"><span>Your Role</span><span>{data.isTeamLeader ? 'Team Leader' : data.hasTeam ? 'Member' : 'No team'}</span></div>
              <div className="info-row"><span>Sent Invitations</span><span>{data.pendingSentInvitationsCount}</span></div>
              <div className="info-row"><span>Supervisor Request</span><span>{data.pendingSupervisorRequestStatus || data.latestSupervisorRequestStatus || 'None'}</span></div>
              <div className="info-row"><span>Upcoming Meetings</span><span>{data.upcomingMeetingsCount}</span></div>
              <div className="info-row"><span>Completed Meetings</span><span>{data.completedMeetingsCount}</span></div>
            </aside>
          </div>
        </>
      ) : null}
    </div>
  );
};

export default Overview;
