import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getStudentDashboard } from '../../api/dashboardService';
import ProjectStatusBadge from '../../components/ProjectStatusBadge';
import { getProjectDomainLabel } from '../../utils/projectDomain';
import { formatProjectStatus } from '../../utils/projectStatus';

const styles = `
.overview-viewport { padding: 10px 20px 40px; font-family: 'Plus Jakarta Sans', -apple-system, sans-serif; color: #0f172a; text-align: left; }
.hero-banner { background: linear-gradient(135deg, #4f46e5, #7c3aed); border-radius: 28px; padding: 34px 38px; color: white; display: flex; justify-content: space-between; gap: 20px; align-items: flex-end; box-shadow: 0 20px 25px -18px rgba(79,70,229,.6); }
.welcome-title { font-size: 34px; font-weight: 900; margin: 0 0 8px; letter-spacing: -1px; }
.welcome-subtitle { font-size: 15px; opacity: .92; margin: 0; line-height: 1.6; }
.date-badge { background: rgba(255,255,255,.18); padding: 11px 16px; border-radius: 14px; font-weight: 800; font-size: 13px; white-space: nowrap; }
.stats-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 18px; margin: 24px 0; }
.workflow-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 22px; margin-top: 22px; }
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
.quick-links { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 18px; }
.quick-links button { border: 0; border-radius: 12px; padding: 11px 14px; font-weight: 900; cursor: pointer; background: #0f172a; color: white; }
.mini-stat-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; margin-top: 14px; }
.mini-stat { border: 1px solid #e2e8f0; border-radius: 16px; padding: 14px; background: #f8fafc; }
.mini-stat span { display: block; font-size: 11px; font-weight: 900; color: #64748b; text-transform: uppercase; margin-bottom: 6px; }
.mini-stat strong { font-size: 22px; color: #0f172a; }
.progress-list { display: grid; gap: 12px; }
.progress-row { border: 1px solid #e2e8f0; border-radius: 18px; padding: 16px; background: #f8fafc; }
.progress-top { display: flex; justify-content: space-between; gap: 12px; margin-bottom: 10px; font-weight: 800; }
.progress-meta { color: #64748b; font-size: 12px; font-weight: 700; margin-bottom: 10px; }
.progress-bar { height: 10px; border-radius: 999px; background: #e2e8f0; overflow: hidden; }
.progress-fill { height: 100%; border-radius: 999px; background: linear-gradient(90deg, #4f46e5, #7c3aed); }
.empty-state, .loading-state, .error-state { border: 1px dashed #cbd5e1; border-radius: 18px; background: #f8fafc; padding: 22px; color: #64748b; font-weight: 700; line-height: 1.6; }
.error-state { border-color: #fecaca; background: #fff1f2; color: #be123c; }
@media (max-width: 900px) { .hero-banner, .dash-grid { flex-direction: column; display: flex; align-items: stretch; } .stats-grid, .workflow-grid { grid-template-columns: 1fr; } }
`;

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
          <h1 className="welcome-title">Welcome back,Graduate</h1>
          <p className="welcome-subtitle">Your project is on track, keep up the good work to finish on time.</p>
        </div>
        <div className="date-badge">{currentDate}</div>
      </div>

      {isLoading ? <div className="loading-state" style={{ marginTop: 24 }}>Loading dashboard...</div> : null}
      {error ? <div className="error-state" style={{ marginTop: 24 }}>{error}</div> : null}

      {!isLoading && !error && data ? (
        <>
          <div className="stats-grid">
            <div className="stat-card" onClick={() => navigate('/student/my-team')}><p className="stat-label">Team</p><p className="stat-value">{data.hasTeam ? data.teamName : 'No team yet'}</p></div>
            <div className="stat-card" onClick={() => navigate('/student/project')}><p className="stat-label">Project Status</p><p className="stat-value">{data.proposalSubmitted ? formatProjectStatus(data.projectStatus) : 'No proposal'}</p></div>
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
                  <div className="info-row"><span>Category</span><span>{getProjectDomainLabel(data.projectDomain, 'Not specified')}</span></div>
                  <div className="info-row"><span>Status</span><span><ProjectStatusBadge status={data.projectStatus} /></span></div>
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

          <div className="workflow-grid">
            <section className="dash-card">
              <h3>Task Status</h3>
              <div className="mini-stat-grid">
                <div className="mini-stat"><span>Not Started</span><strong>{data.taskSummary?.todo ?? 0}</strong></div>
                <div className="mini-stat"><span>In Progress</span><strong>{data.taskSummary?.inProgress ?? 0}</strong></div>
                <div className="mini-stat"><span>Completed</span><strong>{data.taskSummary?.done ?? 0}</strong></div>
                <div className="mini-stat"><span>Overdue</span><strong>{data.taskSummary?.overdue ?? 0}</strong></div>
              </div>
              <div className="quick-links">
                <button onClick={() => navigate('/student/tasks')}>Open Tasks</button>
              </div>
            </section>

            <section className="dash-card">
              <h3>Milestones</h3>
              <div className="mini-stat-grid">
                <div className="mini-stat"><span>Total</span><strong>{data.milestoneSummary?.total ?? 0}</strong></div>
                <div className="mini-stat"><span>Completed</span><strong>{data.milestoneSummary?.completed ?? 0}</strong></div>
                <div className="mini-stat"><span>Pending</span><strong>{data.milestoneSummary?.pending ?? 0}</strong></div>
                <div className="mini-stat"><span>Task Total</span><strong>{data.taskSummary?.total ?? 0}</strong></div>
              </div>
              <div className="quick-links">
                <button onClick={() => navigate('/student/milestones')}>Open Milestones</button>
              </div>
            </section>
          </div>

          <section className="dash-card" style={{ marginTop: 22 }}>
            <h3>Project Progress</h3>
            {data.projectProgress?.length ? (
              <div className="progress-list">
                {data.projectProgress.map((projectProgress) => (
                  <div key={projectProgress.projectId} className="progress-row">
                    <div className="progress-top">
                      <span>{projectProgress.projectTitle}</span>
                      <span>{projectProgress.overallCompletionPercentage}%</span>
                    </div>
                    <div className="progress-meta">
                      Tasks: {projectProgress.taskCompletionPercentage}% | Milestones: {projectProgress.milestoneCompletionPercentage}% | Overdue Tasks: {projectProgress.overdueTasksCount}
                    </div>
                    <div className="progress-bar">
                      <div className="progress-fill" style={{ width: `${projectProgress.overallCompletionPercentage}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">Progress bars will appear here once tasks or milestones are created for your project.</div>
            )}
          </section>
        </>
      ) : null}
    </div>
  );
};

export default Overview;
