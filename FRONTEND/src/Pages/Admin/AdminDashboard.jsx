import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAdminDashboard } from '../../api/dashboardService';
import ProjectStatusBadge from '../../components/ProjectStatusBadge';

const adminStyles = `
.admin-dash-container { padding: 20px 30px 60px; font-family: 'Plus Jakarta Sans', -apple-system, sans-serif; color: #f8fafc; background: #0b1121; min-height: 100vh; text-align: left; }
.ad-header-box { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 28px; background: #0f172a; padding: 25px 30px; border-radius: 20px; border: 1px solid #1e293b; }
.ad-kicker { color: #06b6d4; font-size: 13px; font-weight: 800; text-transform: uppercase; letter-spacing: 1.5px; margin: 0 0 5px; }
.ad-title { font-size: 32px; font-weight: 900; margin: 0; color: #f8fafc; letter-spacing: -1px; }
.btn-ad-action { background: #1e293b; border: 1px solid #334155; color: #f8fafc; padding: 12px 18px; border-radius: 12px; font-weight: 800; cursor: pointer; }
.ad-stats-bar { display: grid; grid-template-columns: repeat(4, 1fr); gap: 18px; margin-bottom: 26px; }
.ad-stat-pill, .ad-card { background: #0f172a; border: 1px solid #1e293b; border-radius: 20px; padding: 20px; box-shadow: 0 10px 30px -24px rgba(0,0,0,.8); }
.ad-stat-pill { cursor: pointer; transition: .2s; }
.ad-stat-pill:hover { transform: translateY(-2px); border-color: #3b82f6; }
.ad-stat-info h4 { margin: 0; font-size: 12px; color: #94a3b8; text-transform: uppercase; font-weight: 800; letter-spacing: .05em; }
.ad-stat-info p { margin: 7px 0 0; font-size: 28px; font-weight: 900; color: #f8fafc; }
.ad-main-grid { display: grid; grid-template-columns: 1.2fr 1fr; gap: 24px; }
.ad-workflow-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 24px; margin-top: 24px; }
.ad-card-title { font-size: 17px; font-weight: 900; color: #f8fafc; margin: 0 0 16px; }
.row-item { border: 1px solid #1e293b; background: #111c31; border-radius: 15px; padding: 14px; margin-bottom: 10px; cursor: pointer; }
.row-item strong { display: block; margin-bottom: 5px; color: #f8fafc; }
.row-item span { color: #94a3b8; font-size: 13px; font-weight: 700; }
.state { border: 1px dashed #334155; background: #0f172a; color: #94a3b8; padding: 18px; border-radius: 16px; font-weight: 700; }
.state.error { border-color: rgba(239,68,68,.35); background: rgba(239,68,68,.1); color: #fecaca; margin-bottom: 20px; }
.role-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; }
.role-pill { background: #111c31; border: 1px solid #1e293b; border-radius: 14px; padding: 13px; }
.role-pill span { display: block; color: #94a3b8; font-size: 11px; font-weight: 900; text-transform: uppercase; margin-bottom: 5px; }
.role-pill strong { font-size: 22px; color: #f8fafc; }
.mini-pill { background: #111c31; border: 1px solid #1e293b; border-radius: 14px; padding: 13px; }
.mini-pill span { display: block; color: #94a3b8; font-size: 11px; font-weight: 900; text-transform: uppercase; margin-bottom: 5px; }
.mini-pill strong { font-size: 22px; color: #f8fafc; }
@media (max-width: 980px) { .ad-stats-bar { grid-template-columns: repeat(2, 1fr); } .ad-main-grid, .ad-header-box, .ad-workflow-grid { grid-template-columns: 1fr; display: grid; gap: 16px; } }
`;

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      setError('');
      try {
        const response = await getAdminDashboard();
        setData(response?.data ?? null);
      } catch (err) {
        setError(err?.response?.data?.message || err?.message || 'Unable to load admin dashboard.');
      } finally {
        setIsLoading(false);
      }
    };
    void load();
  }, []);

  return (
    <div className="admin-dash-container">
      <style>{adminStyles}</style>
      <div className="ad-header-box">
        <div>
          <p className="ad-kicker">Core System Overview</p>
          <h1 className="ad-title">System Dashboard</h1>
        </div>
      </div>

      {isLoading ? <div className="state">Loading admin dashboard...</div> : null}
      {error ? <div className="state error">{error}</div> : null}

      {!isLoading && !error && data ? (
        <>
          <div className="ad-stats-bar">
            <div className="ad-stat-pill" onClick={() => navigate('/admin/users')}><div className="ad-stat-info"><h4>Total Users</h4><p>{data.totalUsers}</p></div></div>
            <div className="ad-stat-pill" onClick={() => navigate('/admin/users')}><div className="ad-stat-info"><h4>Students</h4><p>{data.totalStudents}</p></div></div>
            <div className="ad-stat-pill" onClick={() => navigate('/admin/users')}><div className="ad-stat-info"><h4>Supervisors</h4><p>{data.totalSupervisors}</p></div></div>
            <div className="ad-stat-pill" onClick={() => navigate('/admin/projects')}><div className="ad-stat-info"><h4>Total Projects</h4><p>{data.totalProjects}</p></div></div>
            <div className="ad-stat-pill" onClick={() => navigate('/admin/projects')}><div className="ad-stat-info"><h4>Teams</h4><p>{data.totalTeams}</p></div></div>
            <div className="ad-stat-pill" onClick={() => navigate('/admin/supervisor-requests')}><div className="ad-stat-info"><h4>Supervisor Requests</h4><p>{data.pendingSupervisorRequestsCount}</p></div></div>
            <div className="ad-stat-pill" onClick={() => navigate('/admin/projects')}><div className="ad-stat-info"><h4>Unassigned Projects</h4><p>{data.unassignedProjectsCount}</p></div></div>
            <div className="ad-stat-pill" onClick={() => navigate('/admin/projects')}><div className="ad-stat-info"><h4>Archived Projects</h4><p>{data.archivedProjectsCount}</p></div></div>
          </div>

          <div className="ad-main-grid">
            <section className="ad-card">
              <h3 className="ad-card-title">Recent Projects</h3>
              {data.recentProjects?.length ? data.recentProjects.map((project) => (
                <div className="row-item" key={project.projectId} onClick={() => navigate('/admin/projects')}>
                  <strong>{project.projectTitle}</strong>
                  <span>Team: {project.teamName || 'Not linked'} | <ProjectStatusBadge status={project.status} /></span>
                </div>
              )) : <div className="state">No projects submitted yet.</div>}
            </section>

            <section className="ad-card">
              <h3 className="ad-card-title">Users By Role</h3>
              <div className="role-grid">
                <div className="role-pill"><span>Students</span><strong>{data.totalStudents}</strong></div>
                <div className="role-pill"><span>Supervisors</span><strong>{data.totalSupervisors}</strong></div>
                <div className="role-pill"><span>Dean Office</span><strong>{data.totalDeanOfficeUsers}</strong></div>
                <div className="role-pill"><span>Admins</span><strong>{data.totalAdmins}</strong></div>
              </div>
              <h3 className="ad-card-title" style={{ marginTop: 24 }}>Recent Users</h3>
              {data.recentUsers?.length ? data.recentUsers.map((user) => (
                <div className="row-item" key={user.userId} onClick={() => navigate('/admin/users')}>
                  <strong>{user.name}</strong>
                  <span>{user.email} | {String(user.role || '').replace('ROLE_', '')}</span>
                </div>
              )) : <div className="state">No users found.</div>}
            </section>
          </div>

          <div className="ad-workflow-grid">
            <section className="ad-card">
              <h3 className="ad-card-title">Task Overview</h3>
              <div className="role-grid">
                <div className="mini-pill"><span>Total Tasks</span><strong>{data.taskSummary?.total ?? 0}</strong></div>
                <div className="mini-pill"><span>Not Started</span><strong>{data.taskSummary?.todo ?? 0}</strong></div>
                <div className="mini-pill"><span>In Progress</span><strong>{data.taskSummary?.inProgress ?? 0}</strong></div>
                <div className="mini-pill"><span>Overdue</span><strong>{data.overdueTasksCount ?? 0}</strong></div>
              </div>
            </section>

            <section className="ad-card">
              <h3 className="ad-card-title">Milestone Overview</h3>
              <div className="role-grid">
                <div className="mini-pill"><span>Total Milestones</span><strong>{data.milestoneSummary?.total ?? 0}</strong></div>
                <div className="mini-pill"><span>Completed</span><strong>{data.milestoneSummary?.completed ?? 0}</strong></div>
                <div className="mini-pill"><span>Pending</span><strong>{data.milestoneSummary?.pending ?? 0}</strong></div>
                <div className="mini-pill"><span>Projects</span><strong>{data.totalProjects}</strong></div>
              </div>
            </section>
          </div>

          <section className="ad-card" style={{ marginTop: 24 }}>
            <h3 className="ad-card-title">Projects With Highest Pending Task Load</h3>
            {data.highestPendingTaskLoadProjects?.length ? data.highestPendingTaskLoadProjects.map((project) => (
              <div className="row-item" key={project.projectId} onClick={() => navigate('/admin/projects')}>
                <strong>{project.projectTitle}</strong>
                <span>Pending Tasks: {project.pendingTasksCount} | Overdue: {project.overdueTasksCount} | Overall Progress: {project.overallCompletionPercentage}%</span>
              </div>
            )) : <div className="state">No workflow load data yet.</div>}
          </section>
        </>
      ) : null}
    </div>
  );
};

export default AdminDashboard;
