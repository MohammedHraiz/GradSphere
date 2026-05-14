import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAdminDashboard } from '../../api/dashboardService';
import ProjectStatusBadge from '../../components/ProjectStatusBadge';
import { getSortedProjectDomainCounts } from '../../utils/projectDomain';

const adminStyles = `
.admin-dash-container { padding: 20px 30px 60px; font-family: 'Plus Jakarta Sans', -apple-system, sans-serif; color: #0f172a; background: #f8fafc; min-height: 100vh; text-align: left; }
.ad-header-box { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 28px; background: transparent; padding: 0; border-radius: 0; border: none; }
.ad-kicker { color: #d97706; font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 1.5px; margin: 0 0 8px; }
.ad-title { font-size: 34px; font-weight: 900; margin: 0; color: #0f172a; letter-spacing: -1px; }
.btn-ad-action { background: white; border: 1px solid #d1d5db; color: #0f172a; padding: 10px 20px; border-radius: 10px; font-weight: 700; cursor: pointer; transition: all 0.2s; }
.btn-ad-action:hover { background: #f3f4f6; border-color: #9ca3af; }
.ad-stats-bar { display: grid; grid-template-columns: repeat(4, 1fr); gap: 24px; margin-bottom: 30px; }
.ad-stat-pill, .ad-card { background: white; border: 1px solid #e2e8f0; border-radius: 16px; padding: 24px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.02); }
.ad-stat-pill { cursor: pointer; transition: all 0.3s; }
.ad-stat-pill:hover { transform: translateY(-5px); border-color: #cbd5e1; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.05); }
.ad-stat-info h4 { margin: 0; font-size: 11px; color: #64748b; text-transform: uppercase; font-weight: 700; letter-spacing: 0.5px; }
.ad-stat-info p { margin: 12px 0 0; font-size: 32px; font-weight: 900; color: #0f172a; }
.ad-main-grid { display: grid; grid-template-columns: 1.2fr 1fr; gap: 24px; }
.ad-workflow-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 24px; margin-top: 24px; }
.ad-card-title { font-size: 17px; font-weight: 900; color: #0f172a; margin: 0 0 16px; }
.row-item { border: 1px solid #e2e8f0; background: white; border-radius: 12px; padding: 14px; margin-bottom: 10px; cursor: pointer; transition: all 0.2s; }
.row-item:hover { background: #f9fafb; border-color: #cbd5e1; }
.row-item strong { display: block; margin-bottom: 5px; color: #0f172a; }
.row-item span { color: #64748b; font-size: 13px; font-weight: 600; }
.state { border: 1px dashed #cbd5e1; background: #f9fafb; color: #64748b; padding: 18px; border-radius: 12px; font-weight: 700; }
.state.error { border-color: #fecaca; background: #fff1f2; color: #be123c; margin-bottom: 20px; }
.role-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; }
.role-pill { background: white; border: 1px solid #e2e8f0; border-radius: 12px; padding: 13px; }
.role-pill span { display: block; color: #64748b; font-size: 11px; font-weight: 700; text-transform: uppercase; margin-bottom: 5px; }
.role-pill strong { font-size: 22px; color: #0f172a; }
.mini-pill { background: white; border: 1px solid #e2e8f0; border-radius: 12px; padding: 13px; }
.mini-pill span { display: block; color: #64748b; font-size: 11px; font-weight: 700; text-transform: uppercase; margin-bottom: 5px; }
.mini-pill strong { font-size: 22px; color: #0f172a; }
.category-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 14px; }
.category-card { border: 1px solid #fde68a; background: linear-gradient(180deg, #fffaf0, #ffffff); border-radius: 14px; padding: 16px; box-shadow: 0 16px 28px -28px rgba(217,119,6,0.28); cursor: pointer; transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease; }
.category-card:hover { transform: translateY(-4px); box-shadow: 0 16px 30px rgba(15, 23, 42, 0.12); border-color: #fcd34d; }
.category-card span { display: block; color: #92400e; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 8px; }
.category-card strong { display: block; font-size: 24px; font-weight: 900; color: #92400e; margin-bottom: 6px; }
.category-card p { margin: 0; color: #b45309; font-size: 13px; font-weight: 700; line-height: 1.5; }
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

  const categoryEntries = useMemo(
    () => getSortedProjectDomainCounts(data?.projectsByCategory),
    [data?.projectsByCategory],
  );

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

          <section className="ad-card" style={{ marginTop: 24 }}>
            <h3 className="ad-card-title">Project Category Distribution</h3>
            {categoryEntries.length ? (
              <div className="category-grid">
                {categoryEntries.map(([category, count]) => (
                  <div key={category} className="category-card" onClick={() => navigate(`/admin/projects?category=${encodeURIComponent(category)}`)}>
                    <span>Category</span>
                    <strong>{count}</strong>
                    <p>{category}</p>
                  </div>
                ))}
              </div>
            ) : <div className="state">No category data is available in the current project set yet.</div>}
          </section>
        </>
      ) : null}
    </div>
  );
};

export default AdminDashboard;
