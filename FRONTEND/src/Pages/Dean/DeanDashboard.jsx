import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getDeanDashboard } from '../../api/dashboardService';
import ProjectStatusBadge from '../../components/ProjectStatusBadge';

const styles = `
.dean-viewport { padding: 30px; font-family: 'Plus Jakarta Sans', sans-serif; text-align: left; color: #0f172a; }
.dean-header-row { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 28px; border-bottom: 1px solid #e2e8f0; padding-bottom: 18px; }
.dean-title-kicker { color: #f59e0b; font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 5px; }
.dean-page-title { font-size: 32px; font-weight: 900; margin: 0; letter-spacing: -1px; }
.btn-export { background: #0f172a; color: white; border: none; padding: 12px 18px; border-radius: 12px; font-weight: 800; cursor: pointer; }
.dean-stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 18px; margin-bottom: 26px; }
.dean-stat-card, .dean-panel { background: white; border: 1px solid #e2e8f0; border-radius: 22px; padding: 22px; box-shadow: 0 10px 22px -24px rgba(15,23,42,.7); }
.dean-stat-card { cursor: pointer; transition: .2s; }
.dean-stat-card:hover { transform: translateY(-2px); border-color: #f59e0b; }
.d-stat-title { color: #64748b; font-size: 11px; font-weight: 900; text-transform: uppercase; letter-spacing: .08em; margin: 0 0 10px; }
.d-stat-value { font-size: 30px; font-weight: 900; margin: 0; }
.dean-grid { display: grid; grid-template-columns: 1.2fr 1fr; gap: 22px; }
.workflow-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 22px; margin-top: 22px; }
.dean-panel h3 { margin: 0 0 16px; font-size: 19px; font-weight: 900; }
.row-item { border: 1px solid #e2e8f0; background: #f8fafc; border-radius: 15px; padding: 14px; margin-bottom: 10px; cursor: pointer; }
.row-item strong { display: block; margin-bottom: 5px; }
.row-item span { color: #64748b; font-size: 13px; font-weight: 700; }
.state { border: 1px dashed #cbd5e1; background: #f8fafc; color: #64748b; padding: 18px; border-radius: 16px; font-weight: 700; }
.state.error { border-color: #fecaca; background: #fff1f2; color: #be123c; margin-bottom: 20px; }
.mini-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
.mini-card { border: 1px solid #e2e8f0; background: #f8fafc; border-radius: 16px; padding: 14px; }
.mini-card span { display: block; font-size: 11px; font-weight: 900; color: #64748b; text-transform: uppercase; margin-bottom: 6px; }
.mini-card strong { font-size: 24px; color: #0f172a; }
@media (max-width: 980px) { .dean-stats-grid { grid-template-columns: repeat(2, 1fr); } .dean-grid, .dean-header-row, .workflow-grid { grid-template-columns: 1fr; display: grid; gap: 16px; } }
`;

const DeanDashboard = () => {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      setError('');
      try {
        const response = await getDeanDashboard();
        setData(response?.data ?? null);
      } catch (err) {
        setError(err?.response?.data?.message || err?.message || 'Unable to load dean dashboard.');
      } finally {
        setIsLoading(false);
      }
    };
    void load();
  }, []);

  return (
    <div className="dean-viewport">
      <style>{styles}</style>
      <div className="dean-header-row">
        <div>
          <p className="dean-title-kicker">Faculty Overview</p>
          <h1 className="dean-page-title">Dean Analytics Hub</h1>
        </div>
        <button className="btn-export" onClick={() => window.print()}>Export Faculty Report</button>
      </div>

      {isLoading ? <div className="state">Loading dean dashboard...</div> : null}
      {error ? <div className="state error">{error}</div> : null}

      {!isLoading && !error && data ? (
        <>
          <div className="dean-stats-grid">
            <div className="dean-stat-card" onClick={() => navigate('/dean/projects')}><p className="d-stat-title">Total Projects</p><p className="d-stat-value">{data.totalProjects}</p></div>
            <div className="dean-stat-card" onClick={() => navigate('/dean/projects')}><p className="d-stat-title">Under Review</p><p className="d-stat-value">{data.underReviewProjectsCount}</p></div>
            <div className="dean-stat-card" onClick={() => navigate('/dean/projects')}><p className="d-stat-title">Approved</p><p className="d-stat-value">{data.approvedProjectsCount}</p></div>
            <div className="dean-stat-card" onClick={() => navigate('/dean/supervisor-requests')}><p className="d-stat-title">Pending Supervisor Requests</p><p className="d-stat-value">{data.pendingSupervisorRequestsCount}</p></div>
            <div className="dean-stat-card" onClick={() => navigate('/dean/projects')}><p className="d-stat-title">Unassigned Projects</p><p className="d-stat-value">{data.unassignedProjectsCount}</p></div>
            <div className="dean-stat-card" onClick={() => navigate('/dean/teams')}><p className="d-stat-title">Teams</p><p className="d-stat-value">{data.totalTeams}</p></div>
            <div className="dean-stat-card" onClick={() => navigate('/dean/students')}><p className="d-stat-title">Students</p><p className="d-stat-value">{data.totalStudents}</p></div>
            <div className="dean-stat-card" onClick={() => navigate('/dean/supervisors')}><p className="d-stat-title">Supervisors</p><p className="d-stat-value">{data.totalSupervisors}</p></div>
          </div>

          <div className="dean-grid">
            <section className="dean-panel">
              <h3>Recent Projects</h3>
              {data.recentProjects?.length ? data.recentProjects.map((project) => (
                <div className="row-item" key={project.projectId} onClick={() => navigate('/dean/projects')}>
                  <strong>{project.projectTitle}</strong>
                  <span>Team: {project.teamName || 'Not linked'} | <ProjectStatusBadge status={project.status} /></span>
                </div>
              )) : <div className="state">No projects submitted yet.</div>}
            </section>

            <section className="dean-panel">
              <h3>Recent Supervisor Requests</h3>
              {data.recentSupervisorRequests?.length ? data.recentSupervisorRequests.map((request) => (
                <div className="row-item" key={request.requestId} onClick={() => navigate('/dean/supervisor-requests')}>
                  <strong>{request.projectTitle || 'Untitled Project'}</strong>
                  <span>{request.teamName || 'No team'} requested {request.supervisorName || 'Supervisor'} | {request.status}</span>
                </div>
              )) : <div className="state">No supervisor requests yet.</div>}
            </section>
          </div>

          <div className="workflow-grid">
            <section className="dean-panel">
              <h3>Task Analytics</h3>
              <div className="mini-grid">
                <div className="mini-card"><span>Total Tasks</span><strong>{data.taskSummary?.total ?? 0}</strong></div>
                <div className="mini-card"><span>Not Started</span><strong>{data.taskSummary?.todo ?? 0}</strong></div>
                <div className="mini-card"><span>In Progress</span><strong>{data.taskSummary?.inProgress ?? 0}</strong></div>
                <div className="mini-card"><span>Overdue</span><strong>{data.overdueTasksCount ?? 0}</strong></div>
              </div>
            </section>

            <section className="dean-panel">
              <h3>Milestone Analytics</h3>
              <div className="mini-grid">
                <div className="mini-card"><span>Total Milestones</span><strong>{data.milestoneSummary?.total ?? 0}</strong></div>
                <div className="mini-card"><span>Completed</span><strong>{data.milestoneSummary?.completed ?? 0}</strong></div>
                <div className="mini-card"><span>Pending</span><strong>{data.milestoneSummary?.pending ?? 0}</strong></div>
                <div className="mini-card"><span>Projects</span><strong>{data.totalProjects}</strong></div>
              </div>
            </section>
          </div>

          <div className="dean-grid" style={{ marginTop: 22 }}>
            <section className="dean-panel">
              <h3>Highest Pending Task Load</h3>
              {data.highestPendingTaskLoadProjects?.length ? data.highestPendingTaskLoadProjects.map((project) => (
                <div className="row-item" key={project.projectId} onClick={() => navigate('/dean/projects')}>
                  <strong>{project.projectTitle}</strong>
                  <span>Pending Tasks: {project.pendingTasksCount} | Overdue: {project.overdueTasksCount} | Overall: {project.overallCompletionPercentage}%</span>
                </div>
              )) : <div className="state">No pending-task data yet.</div>}
            </section>

            <section className="dean-panel">
              <h3>Upcoming Milestones</h3>
              {data.upcomingMilestones?.length ? data.upcomingMilestones.map((milestone) => (
                <div className="row-item" key={milestone.milestoneId} onClick={() => navigate('/dean/projects')}>
                  <strong>{milestone.title}</strong>
                  <span>{milestone.projectTitle || 'Project'} | Due: {milestone.dueDate || 'No date'}</span>
                </div>
              )) : <div className="state">No upcoming milestones.</div>}
            </section>
          </div>
        </>
      ) : null}
    </div>
  );
};

export default DeanDashboard;
