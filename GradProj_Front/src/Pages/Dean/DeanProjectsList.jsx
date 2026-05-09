import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { archiveProject, assignSupervisor, downloadAllMeetings, downloadProposalFile, downloadSubmissionFile, getDeanProjects, getProjectSubmissions, getSupervisors, updateProjectStatus } from '../../api/projectService';
import { extractBlobFromResult, extractFileNameFromHeaders, openBlobInNewTab, triggerBrowserDownload } from '../../utils/downloadFile';
import ConfirmDialog from '../../components/ConfirmDialog';
import FeedbackToast from '../../components/FeedbackToast';
import ProjectStatusBadge from '../../components/ProjectStatusBadge';
import ClickableUser from '../../components/ClickableUser';
import SearchBar from '../../components/SearchBar';
import { formatProjectStatus, normalizeProjectStatus } from '../../utils/projectStatus';

const projectsStyles = `
.dean-proj-container { padding: 20px 30px 60px 30px; font-family: 'Plus Jakarta Sans', -apple-system, sans-serif; color: #0f172a; text-align: left; background: #f8fafc; min-height: 100vh; }
.dp-header-box { display: flex; justify-content: space-between; align-items: flex-end; gap: 18px; margin-bottom: 26px; background: white; padding: 25px 30px; border-radius: 20px; border: 1px solid #e2e8f0; box-shadow: 0 4px 15px -5px rgba(0,0,0,0.02); }
.dp-kicker { color: #d97706; font-size: 13px; font-weight: 800; text-transform: uppercase; letter-spacing: 1.5px; margin: 0 0 5px 0; }
.dp-title { font-size: 32px; font-weight: 900; margin: 0; color: #0f172a; letter-spacing: -1px; }
.dp-header-actions { display: flex; gap: 12px; flex-wrap: wrap; }
.btn-dp-outline { background: white; border: 1px solid #cbd5e1; color: #475569; padding: 12px 18px; border-radius: 12px; font-weight: 800; font-size: 13px; cursor: pointer; transition: 0.2s; }
.btn-dp-outline:hover { background: #f8fafc; border-color: #94a3b8; color: #0f172a; transform: translateY(-1px); }
.btn-dp-dark { background: #0f172a; color: white; border-color: #0f172a; }
.dp-stats-bar { display: grid; grid-template-columns: repeat(4, 1fr); gap: 18px; margin-bottom: 24px; }
.dp-stat-pill { background: white; border: 1px solid #e2e8f0; border-radius: 18px; padding: 18px 22px; display: flex; align-items: center; justify-content: space-between; gap: 18px; cursor: pointer; transition: all 0.2s ease; }
.dp-stat-pill:hover, .dp-stat-pill.active-filter { border-color: #0f172a; box-shadow: 0 10px 22px -18px rgba(15,23,42,.7); transform: translateY(-2px); }
.dp-stat-info h4 { margin: 0; font-size: 12px; color: #64748b; text-transform: uppercase; font-weight: 800; letter-spacing: .05em; }
.dp-stat-info p { margin: 5px 0 0; font-size: 30px; font-weight: 900; color: #0f172a; line-height: 1; }
.dp-toolbar { display: flex; gap: 15px; background: white; padding: 15px; border-radius: 16px; border: 1px solid #e2e8f0; margin-bottom: 22px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.02); }
.dp-search { flex-grow: 1; }
.dp-filter { padding: 10px 15px; border: 1px solid #e2e8f0; border-radius: 10px; font-size: 13px; font-weight: 700; color: #475569; background: #f8fafc; outline: none; cursor: pointer; min-width: 180px; font-family: inherit; }
.dp-table-card { background: white; border: 1px solid #e2e8f0; border-radius: 20px; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.02); overflow: hidden; }
.dean-table { width: 100%; border-collapse: collapse; }
.dean-table th { padding: 16px 20px; background: #f8fafc; font-size: 11px; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 1px; border-bottom: 1px solid #e2e8f0; text-align: left; }
.dean-table td { padding: 18px 20px; border-bottom: 1px solid #f1f5f9; font-size: 14px; font-weight: 600; color: #1e293b; vertical-align: middle; }
.dean-table tr:last-child td { border-bottom: none; }
.dp-proj-name { font-size: 15px; font-weight: 900; color: #0f172a; margin-bottom: 4px; }
.dp-proj-id { font-size: 12px; color: #94a3b8; font-weight: 700; overflow-wrap: anywhere; }
.dp-user-link { display: inline-flex; align-items: center; gap: 10px; width: 100%; border: none; background: transparent; padding: 0; font: inherit; cursor: pointer; text-align: left; }
.dp-user-avatar { width: 38px; height: 38px; border-radius: 12px; color: white; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 900; overflow: hidden; }
.dp-user-name { font-size: 14px; font-weight: 900; color: #0f172a; }
.dp-user-subtitle { font-size: 12px; color: #64748b; font-weight: 700; overflow-wrap: anywhere; }
.dp-actions { display: flex; flex-wrap: wrap; gap: 8px; }
.dp-action-btn { border: 1px solid #e2e8f0; background: white; color: #0f172a; border-radius: 10px; padding: 8px 10px; font-size: 12px; font-weight: 800; cursor: pointer; }
.dp-action-btn:hover:not(:disabled) { background: #0f172a; color: white; border-color: #0f172a; }
.dp-action-btn:disabled { opacity: .55; cursor: not-allowed; }
.dp-alert { margin-bottom: 18px; border-radius: 14px; padding: 13px 15px; font-size: 14px; font-weight: 700; }
.dp-alert.error { border: 1px solid #fecaca; background: #fff1f2; color: #be123c; }
.dp-alert.success { border: 1px solid #bbf7d0; background: #f0fdf4; color: #047857; }
.dp-empty { text-align: center; padding: 54px 20px; color: #64748b; font-weight: 700; }
.dp-history-backdrop { position: fixed; inset: 0; background: rgba(2, 6, 23, 0.7); backdrop-filter: blur(8px); display: flex; align-items: center; justify-content: center; padding: 20px; z-index: 9999; }
.dp-history-card { width: min(740px, 100%); background: white; border-radius: 22px; border: 1px solid #e2e8f0; box-shadow: 0 30px 70px -35px rgba(15, 23, 42, 0.9); overflow: hidden; display: grid; }
.dp-history-header { padding: 20px 22px; border-bottom: 1px solid #e2e8f0; display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.dp-history-title { margin: 0; font-size: 20px; font-weight: 900; }
.dp-history-body { padding: 20px 22px; display: grid; gap: 12px; max-height: 70vh; overflow: auto; }
.dp-history-item { border: 1px solid #e2e8f0; border-radius: 16px; padding: 14px; background: #f8fafc; display: grid; gap: 8px; }
.dp-history-meta { font-size: 12px; font-weight: 700; color: #64748b; display: flex; flex-wrap: wrap; gap: 10px; }
.dp-history-note { margin: 0; color: #0f172a; font-size: 13px; font-weight: 700; line-height: 1.6; }
.dp-history-actions { display: flex; flex-wrap: wrap; gap: 8px; }
.dp-history-badge { display: inline-flex; align-items: center; gap: 6px; padding: 4px 10px; border-radius: 999px; font-size: 10px; font-weight: 900; text-transform: uppercase; letter-spacing: .06em; background: #ede9fe; color: #6d28d9; }
@media (max-width: 980px) { .dp-header-box { align-items: flex-start; flex-direction: column; } .dp-stats-bar { grid-template-columns: repeat(2, 1fr); } .dp-toolbar { flex-direction: column; } }
`;

const normalizeProject = (project) => ({
  id: project?.id ?? '',
  title: project?.title ?? 'Untitled Project',
  description: project?.description ?? '',
  status: project?.status ?? 'PENDING',
  studentId: project?.studentId ?? '',
  studentName: project?.studentName ?? 'Unknown Student',
  studentEmail: project?.studentEmail ?? '',
  teamName: project?.teamName ?? 'Not linked',
  documentPath: project?.documentPath ?? '',
  supervisor: project?.supervisor ?? null,
  latestFeedback: project?.latestFeedback ?? '',
  pendingSupervisorName: project?.pendingSupervisorName ?? '',
  submittedAt: project?.submittedAt ?? project?.createdAt ?? '',
});

const DeanProjectsList = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isAdminPath = location.pathname.startsWith('/admin');
  const [projects, setProjects] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [isLoading, setIsLoading] = useState(true);
  const [alert, setAlert] = useState(null);
  const [actionId, setActionId] = useState('');
  const [supervisors, setSupervisors] = useState([]);
  const [selectedSupervisorByProject, setSelectedSupervisorByProject] = useState({});
  const [statusByProject, setStatusByProject] = useState({});
  const [confirmState, setConfirmState] = useState(null);
  const [historyProject, setHistoryProject] = useState(null);
  const [historyItems, setHistoryItems] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState('');
  const [submissionFileAction, setSubmissionFileAction] = useState('');

  const loadProjects = async ({ clearAlert = true } = {}) => {
    setIsLoading(true);
    if (clearAlert) {
      setAlert(null);
    }

    try {
      const response = await getDeanProjects();
      const payload = response?.data;
      const items = Array.isArray(payload) ? payload : Array.isArray(payload?.projects) ? payload.projects : [];
      setProjects(items.map(normalizeProject));
    } catch (err) {
      setProjects([]);
      setAlert({ type: 'error', message: err?.response?.data?.message || err?.message || 'Unable to load projects.' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadProjects();
    const loadSupervisors = async () => {
      try {
        const response = await getSupervisors();
        setSupervisors(Array.isArray(response?.data) ? response.data : []);
      } catch {
        setSupervisors([]);
      }
    };
    void loadSupervisors();
  }, []);

  useEffect(() => {
    if (location.state?.targetProj) {
      setSearchTerm(location.state.targetProj);
    }
  }, [location.state]);

  const filteredProjects = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();
    return projects.filter((project) => {
      const matchesSearch = !search || [project.title, project.studentName, project.teamName, project.supervisor?.name, formatProjectStatus(project.status)]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(search));
      const matchesStatus = statusFilter === 'All' || normalizeProjectStatus(project.status) === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [projects, searchTerm, statusFilter]);

  const counts = useMemo(() => ({
    all: projects.length,
    pending: projects.filter((project) => normalizeProjectStatus(project.status) === 'SUBMITTED').length,
    approved: projects.filter((project) => normalizeProjectStatus(project.status) === 'APPROVED').length,
    archived: projects.filter((project) => normalizeProjectStatus(project.status) === 'ARCHIVED').length,
  }), [projects]);

  const runAction = async (projectId, action, successMessage, busyLabel = 'Working') => {
    setActionId(`${projectId}:${busyLabel}`);
    setAlert(null);

    try {
      await action();
      await loadProjects({ clearAlert: false });
      setAlert({ type: 'success', message: successMessage });
    } catch (err) {
      setAlert({ type: 'error', message: err?.response?.data?.message || err?.message || 'Action failed.' });
    } finally {
      setActionId('');
    }
  };

  const handleArchive = (projectId) => {
    setConfirmState({
      title: 'Archive project?',
      message: 'Archive this project? Archived projects cannot be updated through the normal review workflow.',
      confirmLabel: 'Archive Project',
      tone: 'danger',
      loadingLabel: 'Archiving...',
      onConfirm: async () => {
        await runAction(projectId, async () => {
          await archiveProject(projectId);
        }, 'Project archived successfully.', 'archive');
        setConfirmState(null);
      },
    });
  };

  const handleDownloadMeetings = (projectId) => runAction(projectId, async () => {
    const result = await downloadAllMeetings(projectId);
    const blob = extractBlobFromResult(result);
    const project = projects.find((item) => item.id === projectId);
    const fileName = extractFileNameFromHeaders(result?.headers, `${project?.title || 'Project'}_Meetings.zip`);
    triggerBrowserDownload(blob, fileName);
  }, 'Meeting PDF archive downloaded.', 'meetings');

  const handleProposalFile = (project, mode) => runAction(project.id, async () => {
    const result = await downloadProposalFile(project.id);
    const blob = extractBlobFromResult(result);
    if (mode === 'view') {
      openBlobInNewTab(blob);
    } else {
      const fileName = extractFileNameFromHeaders(result?.headers, `${project.title || 'proposal'}.pdf`);
      triggerBrowserDownload(blob, fileName);
    }
  }, mode === 'view' ? 'Proposal opened.' : 'Proposal downloaded.', mode);

  const handleAssignSupervisor = (projectId) => {
    const supervisorId = selectedSupervisorByProject[projectId];
    if (!supervisorId) {
      setAlert({ type: 'error', message: 'Select a supervisor first.' });
      return;
    }
    return runAction(projectId, async () => {
      await assignSupervisor(projectId, supervisorId);
    }, 'Supervisor assigned.', 'assign');
  };

  const handleManualStatus = (projectId) => {
    const nextStatus = statusByProject[projectId];
    if (!nextStatus) {
      setAlert({ type: 'error', message: 'Select a status first.' });
      return;
    }
    return runAction(projectId, async () => {
      await updateProjectStatus(projectId, nextStatus, `Status manually changed to ${nextStatus}.`);
    }, 'Project status updated.', 'status');
  };

  const openHistory = async (project) => {
    setHistoryProject(project);
    setHistoryItems([]);
    setHistoryError('');
    setHistoryLoading(true);
    try {
      const response = await getProjectSubmissions(project.id);
      const items = Array.isArray(response?.data) ? response.data : [];
      setHistoryItems(items);
    } catch (err) {
      setHistoryError(err?.response?.data?.message || err?.message || 'Unable to load submission history.');
    } finally {
      setHistoryLoading(false);
    }
  };

  const closeHistory = () => {
    setHistoryProject(null);
    setHistoryItems([]);
    setHistoryError('');
  };

  const handleSubmissionFile = async (submissionId, mode) => {
    if (!historyProject?.id || !submissionId) return;
    setSubmissionFileAction(`${submissionId}:${mode}`);
    try {
      const result = await downloadSubmissionFile(historyProject.id, submissionId);
      const blob = extractBlobFromResult(result);
      if (mode === 'view') {
        openBlobInNewTab(blob);
      } else {
        const fileName = extractFileNameFromHeaders(result?.headers, `proposal_${submissionId}.pdf`);
        triggerBrowserDownload(blob, fileName);
      }
    } catch (err) {
      setAlert({ type: 'error', message: err?.response?.data?.message || err?.message || 'Could not open submission file.' });
    } finally {
      setSubmissionFileAction('');
    }
  };

  return (
    <div className="dean-proj-container">
      <style>{projectsStyles}</style>

      <div className="dp-header-box">
        <div>
          <p className="dp-kicker">Faculty Projects Directory</p>
          <h1 className="dp-title">Submitted Graduation Projects</h1>
        </div>
        <div className="dp-header-actions">
          <button className="btn-dp-outline" onClick={() => navigate(isAdminPath ? '/admin/dashboard' : '/dean/dashboard')}>Back to Dashboard</button>
          <button className="btn-dp-outline btn-dp-dark" disabled={isLoading} onClick={() => void loadProjects()}>{isLoading ? 'Refreshing...' : 'Refresh'}</button>
        </div>
      </div>

      <div className="dp-stats-bar">
        <div className={`dp-stat-pill ${statusFilter === 'All' ? 'active-filter' : ''}`} onClick={() => setStatusFilter('All')}><div className="dp-stat-info"><h4>Total Projects</h4><p>{counts.all}</p></div></div>
        <div className={`dp-stat-pill ${statusFilter === 'SUBMITTED' ? 'active-filter' : ''}`} onClick={() => setStatusFilter('SUBMITTED')}><div className="dp-stat-info"><h4>Submitted</h4><p>{counts.pending}</p></div></div>
        <div className={`dp-stat-pill ${statusFilter === 'APPROVED' ? 'active-filter' : ''}`} onClick={() => setStatusFilter('APPROVED')}><div className="dp-stat-info"><h4>Approved</h4><p>{counts.approved}</p></div></div>
        <div className={`dp-stat-pill ${statusFilter === 'ARCHIVED' ? 'active-filter' : ''}`} onClick={() => setStatusFilter('ARCHIVED')}><div className="dp-stat-info"><h4>Archived</h4><p>{counts.archived}</p></div></div>
      </div>

      <div className="dp-toolbar">
        <SearchBar className="dp-search" placeholder="Search projects, students, teams, or supervisors..." value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} onClear={() => setSearchTerm('')} />
        <select className="dp-filter" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
          <option value="All">All Statuses</option>
          <option value="SUBMITTED">Submitted</option>
          <option value="UNDER_REVIEW">Under Review</option>
          <option value="NEEDS_CHANGES">Needs Changes</option>
          <option value="APPROVED">Approved</option>
          <option value="REJECTED">Rejected</option>
          <option value="ARCHIVED">Archived</option>
        </select>
      </div>

      <div className="dp-table-card">
        <table className="dean-table">
          <thead>
            <tr>
              <th>Project</th>
              <th>Student</th>
              <th>Team</th>
              <th>Status / Supervisor</th>
              <th>Submitted</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan="6" className="dp-empty">Loading submitted projects...</td></tr>
            ) : filteredProjects.length === 0 ? (
              <tr><td colSpan="6" className="dp-empty">No submitted projects found.</td></tr>
            ) : filteredProjects.map((project) => {
              const busy = actionId.startsWith(`${project.id}:`);
              const isArchived = normalizeProjectStatus(project.status) === 'ARCHIVED';
              const canArchive = normalizeProjectStatus(project.status) === 'APPROVED' && !isArchived;
              return (
                <tr key={project.id}>
                  <td>
                    <div className="dp-proj-name">{project.title}</div>
                    <div className="dp-proj-id">{project.teamName || 'Not linked'}</div>
                  </td>
                  <td>
                    <ClickableUser
                      user={{
                        id: project.studentId,
                        name: project.studentName,
                        email: project.studentEmail,
                        role: 'ROLE_STUDENT',
                      }}
                      className="dp-user-link"
                      avatarClassName="dp-user-avatar"
                      nameClassName="dp-user-name"
                      subtitle={project.studentEmail || 'View student profile'}
                      subtitleClassName="dp-user-subtitle"
                    />
                  </td>
                  <td>{project.teamName}</td>
                  <td>
                    <ProjectStatusBadge status={project.status} />
                    <div className="dp-proj-id" style={{marginTop: 6}}>
                      Supervisor:{' '}
                      {project.supervisor ? (
                        <ClickableUser
                          user={{ ...project.supervisor, role: 'ROLE_SUPERVISOR' }}
                          className="dp-user-link"
                          style={{ display: 'inline-flex', width: 'auto', verticalAlign: 'middle' }}
                          avatarClassName="dp-user-avatar"
                          nameClassName="dp-user-name"
                          subtitle={project.supervisor?.email || 'View supervisor profile'}
                          subtitleClassName="dp-user-subtitle"
                        />
                      ) : (
                        'Unassigned'
                      )}
                      {project.pendingSupervisorName ? ` | Pending: ${project.pendingSupervisorName}` : ''}
                    </div>
                    <div className="dp-proj-id" style={{marginTop: 6}}>Proposal Version: {project.proposalVersion || 1}</div>
                  </td>
                  <td>{project.submittedAt ? new Date(project.submittedAt).toLocaleDateString() : 'Recently'}</td>
                  <td>
                    <div className="dp-actions">
                      <button className="dp-action-btn" disabled={busy} onClick={() => handleDownloadMeetings(project.id)}>{actionId === `${project.id}:meetings` ? 'Downloading...' : 'PDF ZIP'}</button>
                      {project.documentPath ? (
                        <>
                          <button className="dp-action-btn" disabled={busy} onClick={() => handleProposalFile(project, 'view')}>{actionId === `${project.id}:view` ? 'Opening...' : 'View Proposal'}</button>
                          <button className="dp-action-btn" disabled={busy} onClick={() => handleProposalFile(project, 'download')}>{actionId === `${project.id}:download` ? 'Downloading...' : 'Download Proposal'}</button>
                        </>
                      ) : null}
                      <button className="dp-action-btn" disabled={busy} onClick={() => void openHistory(project)}>History</button>
                      {canArchive ? (
                        <button className="dp-action-btn" disabled={busy} onClick={() => handleArchive(project.id)}>{actionId === `${project.id}:archive` ? 'Archiving...' : 'Archive'}</button>
                      ) : null}
                      {isArchived ? <div className="dp-proj-id" style={{ width: '100%' }}>Archived project. Dean/Admin can reopen by changing the status.</div> : null}
                      <select className="dp-filter" style={{minWidth: 150, padding: '8px 10px'}} disabled={busy} value={selectedSupervisorByProject[project.id] || ''} onChange={(event) => setSelectedSupervisorByProject(prev => ({ ...prev, [project.id]: event.target.value }))}>
                        <option value="">Supervisor...</option>
                        {supervisors.map((supervisor) => (
                          <option key={supervisor.id} value={supervisor.id}>{supervisor.name}</option>
                        ))}
                      </select>
                      <button className="dp-action-btn" disabled={busy || isArchived} onClick={() => handleAssignSupervisor(project.id)}>{actionId === `${project.id}:assign` ? 'Assigning...' : 'Assign'}</button>
                      <select className="dp-filter" style={{minWidth: 145, padding: '8px 10px'}} disabled={busy} value={statusByProject[project.id] || ''} onChange={(event) => setStatusByProject(prev => ({ ...prev, [project.id]: event.target.value }))}>
                        <option value="">Status...</option>
                        <option value="SUBMITTED">Submitted</option>
                        <option value="UNDER_REVIEW">Under Review</option>
                        <option value="NEEDS_CHANGES">Needs Changes</option>
                        <option value="APPROVED">Approved</option>
                        <option value="REJECTED">Rejected</option>
                        <option value="ARCHIVED">Archived</option>
                      </select>
                      <button className="dp-action-btn" disabled={busy} onClick={() => handleManualStatus(project.id)}>{actionId === `${project.id}:status` ? 'Updating...' : 'Update'}</button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <ConfirmDialog
        open={Boolean(confirmState)}
        title={confirmState?.title}
        message={confirmState?.message}
        confirmLabel={confirmState?.confirmLabel}
        tone={confirmState?.tone}
        isLoading={Boolean(actionId)}
        loadingLabel={confirmState?.loadingLabel}
        onCancel={() => setConfirmState(null)}
        onConfirm={confirmState?.onConfirm}
      />
      <FeedbackToast message={alert?.message} type={alert?.type} onClose={() => setAlert(null)} />

      {historyProject && (
        <div className="dp-history-backdrop" onClick={closeHistory}>
          <div className="dp-history-card" onClick={(event) => event.stopPropagation()}>
            <div className="dp-history-header">
              <div>
                <h3 className="dp-history-title">Proposal Versions</h3>
                <div className="dp-proj-id">{historyProject.title}</div>
              </div>
              <button className="btn-dp-outline" onClick={closeHistory}>Close</button>
            </div>
            <div className="dp-history-body">
              {historyLoading ? (
                <div className="dp-empty">Loading submission history...</div>
              ) : historyError ? (
                <div className="dp-empty">{historyError}</div>
              ) : historyItems.length === 0 ? (
                <div className="dp-empty">No submission history available yet.</div>
              ) : (
                historyItems.map((submission) => (
                  <div key={submission.id} className="dp-history-item">
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                      <strong>Version {submission.versionNumber}</strong>
                      {submission.isLatest ? <span className="dp-history-badge">Latest</span> : null}
                    </div>
                    <div className="dp-history-meta">
                      <span>Submitted {submission.submittedAt ? new Date(submission.submittedAt).toLocaleString() : 'Recently'}</span>
                      <span>By {submission.submittedByName || 'Team Leader'}</span>
                    </div>
                    <p className="dp-history-note">{submission.studentChangeNote || (Number(submission.versionNumber) === 1 ? 'Initial submission' : 'No change note provided.')}</p>
                    <div className="dp-history-actions">
                      {submission.hasFile ? (
                        <>
                          <button
                            className="dp-action-btn"
                            disabled={submissionFileAction === `${submission.id}:view`}
                            onClick={() => void handleSubmissionFile(submission.id, 'view')}
                          >
                            {submissionFileAction === `${submission.id}:view` ? 'Opening...' : 'View PDF'}
                          </button>
                          <button
                            className="dp-action-btn"
                            disabled={submissionFileAction === `${submission.id}:download`}
                            onClick={() => void handleSubmissionFile(submission.id, 'download')}
                          >
                            {submissionFileAction === `${submission.id}:download` ? 'Downloading...' : 'Download PDF'}
                          </button>
                        </>
                      ) : (
                        <span className="dp-proj-id">No file attached.</span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DeanProjectsList;
