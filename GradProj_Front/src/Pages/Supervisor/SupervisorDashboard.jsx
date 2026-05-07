import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './SupervisorDashboard.css';
import { getSupervisorDashboard } from '../../api/dashboardService';

const extraStyles = `
.sup-live-grid { display: grid; grid-template-columns: 1.2fr 1fr; gap: 24px; margin-top: 28px; }
.sup-live-card { background: white; border: 1px solid #e2e8f0; border-radius: 20px; padding: 22px; box-shadow: 0 10px 22px -24px rgba(15,23,42,.8); }
.sup-live-card h3 { margin: 0 0 16px; font-size: 19px; font-weight: 900; color: #0f172a; }
.sup-list { display: grid; gap: 12px; }
.sup-list-item { border: 1px solid #e2e8f0; background: #f8fafc; border-radius: 15px; padding: 14px; cursor: pointer; }
.sup-list-item strong { display: block; color: #0f172a; margin-bottom: 5px; }
.sup-list-item span { color: #64748b; font-size: 13px; font-weight: 700; line-height: 1.5; }
.sup-state { border: 1px dashed #cbd5e1; background: #f8fafc; color: #64748b; padding: 18px; border-radius: 16px; font-weight: 700; }
.sup-state.error { border-color: #fecaca; background: #fff1f2; color: #be123c; }
.status-pill { display: inline-flex; padding: 5px 9px; border-radius: 999px; font-size: 11px; font-weight: 900; background: #eef2ff; color: #4f46e5; text-transform: uppercase; }
@media (max-width: 900px) { .sup-live-grid { grid-template-columns: 1fr; } }
`;

const visibleStatus = (status) => {
  const value = String(status || '').toUpperCase();
  if (value === 'PENDING') return 'SUBMITTED';
  if (value === 'FINAL_APPROVAL_DEAN') return 'APPROVED';
  if (value === 'REVISION_REQUIRED') return 'NEEDS_CHANGES';
  return value;
};

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
                      <span>Team: {project.teamName || 'Not linked'} | <span className="status-pill">{visibleStatus(project.status).replace(/_/g, ' ')}</span></span>
                    </div>
                  ))}
                </div>
              ) : <div className="sup-state">No assigned projects yet.</div>}
            </section>
          </div>
        </>
      ) : null}
    </div>
  );
};

export default SupervisorDashboard;
