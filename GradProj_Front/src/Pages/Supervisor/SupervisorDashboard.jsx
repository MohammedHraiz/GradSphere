import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './SupervisorDashboard.css';
import { getSupervisorDashboard } from '../../api/dashboardService';
import ProjectStatusBadge from '../../components/ProjectStatusBadge';

const extraStyles = `
.sup-live-grid { display: grid; grid-template-columns: 1.2fr 1fr; gap: 24px; margin-top: 28px; }
.sup-workflow-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 24px; margin-top: 24px; }
.sup-live-card { background: white; border: 1px solid #e2e8f0; border-radius: 20px; padding: 22px; box-shadow: 0 10px 22px -24px rgba(15,23,42,.8); }
.sup-live-card h3 { margin: 0 0 16px; font-size: 19px; font-weight: 900; color: #0f172a; }
.sup-list { display: grid; gap: 12px; }
.sup-list-item { border: 1px solid #e2e8f0; background: #f8fafc; border-radius: 15px; padding: 14px; cursor: pointer; }
.sup-list-item strong { display: block; color: #0f172a; margin-bottom: 5px; }
.sup-list-item span { color: #64748b; font-size: 13px; font-weight: 700; line-height: 1.5; }
.sup-state { border: 1px dashed #cbd5e1; background: #f8fafc; color: #64748b; padding: 18px; border-radius: 16px; font-weight: 700; }
.sup-state.error { border-color: #fecaca; background: #fff1f2; color: #be123c; }
.sup-mini-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
.sup-mini-card { border: 1px solid #e2e8f0; background: #f8fafc; border-radius: 16px; padding: 14px; }
.sup-mini-card span { display: block; font-size: 11px; font-weight: 900; color: #64748b; text-transform: uppercase; margin-bottom: 6px; }
.sup-mini-card strong { font-size: 24px; color: #0f172a; }
.sup-progress { display: grid; gap: 12px; }
.sup-progress-row { border: 1px solid #e2e8f0; border-radius: 16px; background: #f8fafc; padding: 14px; }
.sup-progress-head { display: flex; justify-content: space-between; gap: 12px; margin-bottom: 8px; font-weight: 800; }
.sup-progress-meta { font-size: 12px; color: #64748b; font-weight: 700; margin-bottom: 10px; }
.sup-progress-bar { height: 10px; border-radius: 999px; background: #e2e8f0; overflow: hidden; }
.sup-progress-fill { height: 100%; background: linear-gradient(90deg, #4f46e5, #7c3aed); }
@media (max-width: 900px) { .sup-live-grid, .sup-workflow-grid { grid-template-columns: 1fr; } }
`;

const SupervisorDashboard = () => {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      setError('');
      try {
        const response = await getSupervisorDashboard();
        setData(response?.data ?? null);
      } catch (err) {
        setError(err?.response?.data?.message || err?.message || 'Unable to load dashboard.');
      } finally {
        setIsLoading(false);
      }
    };
    void load();
  }, []);

  return (
    <div className="sup-dashboard-wrapper">
      <style>{extraStyles}</style>
      <div className="sup-header">
        <div className="sup-header-titles">
          <h4>Supervisor Panel</h4>
          <h1>Dashboard Overview</h1>
        </div>
        <div className="sup-header-actions">
          <button className="btn-primary" onClick={() => navigate('/supervisor/projects')}>Projects & Requests</button>
        </div>
      </div>

      {isLoading ? <div className="sup-state">Loading supervisor dashboard...</div> : null}
      {error ? <div className="sup-state error">{error}</div> : null}

      {!isLoading && !error && data ? (
        <>
          <div className="sup-stats-grid">
            <div className="sup-stat-card purple" onClick={() => navigate('/supervisor/projects')}><div className="stat-header"><h3 className="stat-title">Pending Requests</h3><span className="stat-icon">📨</span></div><p className="stat-value">{data.pendingSupervisorRequestsCount}</p><p className="stat-footer neutral">Awaiting response</p></div>
            <div className="sup-stat-card blue" onClick={() => navigate('/supervisor/projects')}><div className="stat-header"><h3 className="stat-title">Assigned Projects</h3><span className="stat-icon">📁</span></div><p className="stat-value">{data.assignedProjectsCount}</p><p className="stat-footer neutral">Assigned to you</p></div>
            <div className="sup-stat-card orange" onClick={() => navigate('/supervisor/projects')}><div className="stat-header"><h3 className="stat-title">Under Review</h3><span className="stat-icon">⏳</span></div><p className="stat-value">{data.underReviewProjectsCount}</p><p className="stat-footer warning">Review active</p></div>
            <div className="sup-stat-card teal" onClick={() => navigate('/supervisor/projects')}><div className="stat-header"><h3 className="stat-title">Needs Changes</h3><span className="stat-icon">✍️</span></div><p className="stat-value">{data.needsChangesProjectsCount}</p><p className="stat-footer neutral">Revision requested</p></div>
          </div>

          <div className="sup-live-grid">
            <section className="sup-live-card">
              <h3>Recent Pending Requests</h3>
              {data.recentPendingRequests?.length ? (
                <div className="sup-list">
                  {data.recentPendingRequests.map((request) => (
                    <div className="sup-list-item" key={request.requestId} onClick={() => navigate('/supervisor/projects')}>
                      <strong>{request.projectTitle || 'Untitled Project'}</strong>
                      <span>Team: {request.teamName || 'Not linked'} | Requested by: {request.requestedByName || 'Unknown'}</span>
                    </div>
                  ))}
                </div>
              ) : <div className="sup-state">No pending supervisor requests.</div>}
            </section>

            <section className="sup-live-card">
              <h3>Recent Assigned Projects</h3>
              {data.recentAssignedProjects?.length ? (
                <div className="sup-list">
                  {data.recentAssignedProjects.map((project) => (
                    <div className="sup-list-item" key={project.projectId} onClick={() => navigate('/supervisor/projects')}>
                      <strong>{project.projectTitle}</strong>
                      <span>Team: {project.teamName || 'Not linked'} | <ProjectStatusBadge status={project.status} /></span>
                    </div>
                  ))}
                </div>
              ) : <div className="sup-state">No assigned projects yet.</div>}
            </section>
          </div>

          <div className="sup-workflow-grid">
            <section className="sup-live-card">
              <h3>Task Summary</h3>
              <div className="sup-mini-grid">
                <div className="sup-mini-card"><span>Not Started</span><strong>{data.taskSummary?.todo ?? 0}</strong></div>
                <div className="sup-mini-card"><span>In Progress</span><strong>{data.taskSummary?.inProgress ?? 0}</strong></div>
                <div className="sup-mini-card"><span>Completed</span><strong>{data.taskSummary?.done ?? 0}</strong></div>
                <div className="sup-mini-card"><span>Overdue</span><strong>{data.taskSummary?.overdue ?? 0}</strong></div>
              </div>
            </section>

            <section className="sup-live-card">
              <h3>Milestone Summary</h3>
              <div className="sup-mini-grid">
                <div className="sup-mini-card"><span>Total</span><strong>{data.milestoneSummary?.total ?? 0}</strong></div>
                <div className="sup-mini-card"><span>Completed</span><strong>{data.milestoneSummary?.completed ?? 0}</strong></div>
                <div className="sup-mini-card"><span>Pending</span><strong>{data.milestoneSummary?.pending ?? 0}</strong></div>
                <div className="sup-mini-card"><span>Projects</span><strong>{data.assignedProjectsCount}</strong></div>
              </div>
            </section>
          </div>

          <div className="sup-live-grid">
            <section className="sup-live-card">
              <h3>Overdue Tasks</h3>
              {data.overdueTasks?.length ? (
                <div className="sup-list">
                  {data.overdueTasks.map((task) => (
                    <div className="sup-list-item" key={task.taskId} onClick={() => navigate('/supervisor/tasks')}>
                      <strong>{task.title}</strong>
                      <span>{task.projectTitle || 'Project'} | {task.assignedToName || 'Unassigned'} | Due: {task.dueDate || 'No date'}</span>
                    </div>
                  ))}
                </div>
              ) : <div className="sup-state">No overdue tasks right now.</div>}
            </section>

            <section className="sup-live-card">
              <h3>Upcoming Milestones</h3>
              {data.upcomingMilestones?.length ? (
                <div className="sup-list">
                  {data.upcomingMilestones.map((milestone) => (
                    <div className="sup-list-item" key={milestone.milestoneId} onClick={() => navigate('/supervisor/milestones')}>
                      <strong>{milestone.title}</strong>
                      <span>{milestone.projectTitle || 'Project'} | Due: {milestone.dueDate || 'No date'}</span>
                    </div>
                  ))}
                </div>
              ) : <div className="sup-state">No upcoming milestones.</div>}
            </section>
          </div>

          <section className="sup-live-card" style={{ marginTop: 24 }}>
            <h3>Project Progress</h3>
            {data.projectProgress?.length ? (
              <div className="sup-progress">
                {data.projectProgress.map((projectProgress) => (
                  <div key={projectProgress.projectId} className="sup-progress-row">
                    <div className="sup-progress-head">
                      <span>{projectProgress.projectTitle}</span>
                      <span>{projectProgress.overallCompletionPercentage}%</span>
                    </div>
                    <div className="sup-progress-meta">
                      Tasks: {projectProgress.taskCompletionPercentage}% | Milestones: {projectProgress.milestoneCompletionPercentage}% | Pending Tasks: {projectProgress.pendingTasksCount}
                    </div>
                    <div className="sup-progress-bar">
                      <div className="sup-progress-fill" style={{ width: `${projectProgress.overallCompletionPercentage}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            ) : <div className="sup-state">Progress bars will appear once tasks or milestones exist.</div>}
          </section>
        </>
      ) : null}
    </div>
  );
};

export default SupervisorDashboard;
