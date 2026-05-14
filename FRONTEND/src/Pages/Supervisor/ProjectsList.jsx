import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import {
  acceptSupervisorRequest,
  downloadProposalFile,
  downloadSubmissionFile,
  getMySupervisorProjects,
  getPendingSupervisorRequests,
  getProjectSubmissions,
  rejectSupervisorRequest,
  updateProjectStatus,
} from '../../api/projectService';
import StyledSelect from '../../components/StyledSelect';
import ConfirmDialog from '../../components/ConfirmDialog';
import FeedbackToast from '../../components/FeedbackToast';
import ClickableUser from '../../components/ClickableUser';
import SearchBar from '../../components/SearchBar';
import { extractBlobFromResult, extractFileNameFromHeaders, openBlobInNewTab, triggerBrowserDownload } from '../../utils/downloadFile';
import ProjectStatusBadge from '../../components/ProjectStatusBadge';
import { normalizeProjectStatus } from '../../utils/projectStatus';

const styles = `
.sup-projects { padding: 10px 20px 40px; font-family: 'Plus Jakarta Sans', -apple-system, sans-serif; color: #0f172a; text-align: left; display: grid; gap: 24px; justify-items: center; }
.sup-header { display: flex; justify-content: space-between; align-items: flex-end; gap: 16px; margin-bottom: 0; width: min(100%, 1120px); }
.sup-kicker { margin: 0 0 6px; color: #2563eb; font-size: 12px; font-weight: 900; text-transform: uppercase; letter-spacing: .08em; }
.sup-title { margin: 0; font-size: 32px; font-weight: 900; }
.sup-refresh { border: 0; background: #0f172a; color: white; border-radius: 12px; padding: 11px 15px; font-weight: 900; cursor: pointer; }
.sup-grid { display: grid; grid-template-columns: minmax(0, 1fr); gap: 24px; align-items: start; width: min(100%, 1120px); }
.sup-section { background: white; border: 1px solid #e2e8f0; border-radius: 20px; padding: 22px; box-shadow: 0 10px 22px -24px rgba(15,23,42,.8); width: 100%; }
.sup-section h2 { margin: 0 0 14px; font-size: 19px; font-weight: 900; }
.sup-list { display: grid; gap: 12px; }
.sup-card { border: 1px solid #e2e8f0; border-radius: 16px; padding: 16px; background: #f8fafc; }
.sup-card-title { margin: 0; font-size: 16px; font-weight: 900; color: #0f172a; }
.sup-meta { margin: 6px 0 0; color: #64748b; font-size: 13px; line-height: 1.6; }
.sup-user-link { display: inline-flex; align-items: center; gap: 10px; border: none; background: transparent; padding: 0; font: inherit; text-align: left; cursor: pointer; }
.sup-user-avatar { width: 34px; height: 34px; border-radius: 12px; color: white; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 900; overflow: hidden; }
.sup-user-name { font-size: 13px; font-weight: 900; color: #0f172a; }
.sup-user-subtitle { font-size: 11px; color: #64748b; font-weight: 700; overflow-wrap: anywhere; }
.sup-team-members { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 10px; }
.sup-member-chip { display: inline-flex; align-items: center; gap: 10px; padding: 8px 12px; border-radius: 14px; border: 1px solid #e2e8f0; background: white; box-shadow: 0 10px 16px -20px rgba(15,23,42,.8); }
.sup-message { margin: 12px 0 0; border-left: 3px solid #2563eb; padding-left: 12px; color: #334155; font-size: 13px; line-height: 1.6; }
.sup-actions { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 14px; }
.sup-btn { border: 1px solid #cbd5e1; background: white; color: #0f172a; border-radius: 10px; padding: 9px 12px; font-size: 12px; font-weight: 900; cursor: pointer; }
.sup-btn.primary { border-color: #16a34a; background: #16a34a; color: white; }
.sup-btn.danger { border-color: #fecaca; background: #fff1f2; color: #be123c; }
.sup-btn:disabled { opacity: .6; cursor: not-allowed; }
.sup-feedback { display: grid; gap: 10px; margin-top: 12px; }
.sup-feedback textarea, .sup-feedback .styled-select-trigger { width: 100%; box-sizing: border-box; border: 1px solid #cbd5e1; border-radius: 10px; padding: 10px 12px; font: inherit; }
.sup-history { margin-top: 14px; padding: 14px; border-radius: 14px; border: 1px solid #e2e8f0; background: #ffffff; display: grid; gap: 10px; }
.sup-history-card { border: 1px solid #e2e8f0; border-radius: 14px; padding: 12px; background: #f8fafc; display: grid; gap: 8px; }
.sup-history-meta { font-size: 12px; color: #64748b; font-weight: 700; display: flex; flex-wrap: wrap; gap: 10px; }
.sup-history-note { margin: 0; color: #0f172a; font-size: 13px; font-weight: 700; line-height: 1.5; }
.sup-history-actions { display: flex; flex-wrap: wrap; gap: 8px; }
.sup-badge { display: inline-flex; align-items: center; gap: 6px; padding: 4px 10px; border-radius: 999px; font-size: 10px; font-weight: 900; text-transform: uppercase; letter-spacing: .06em; background: #e0e7ff; color: #4338ca; }
.sup-alert { margin-bottom: 16px; padding: 13px 15px; border-radius: 14px; font-size: 14px; font-weight: 800; }
.sup-alert.error { background: #fff1f2; border: 1px solid #fecaca; color: #be123c; }
.sup-alert.success { background: #f0fdf4; border: 1px solid #bbf7d0; color: #047857; }
.sup-empty { padding: 18px; border: 1px dashed #cbd5e1; border-radius: 14px; color: #64748b; background: #f8fafc; text-align: center; }
.sup-toolbar { width: 100%; margin-top: 18px; }
@media (max-width: 900px) { .sup-header { flex-direction: column; align-items: flex-start; } }
`;

const ProjectsList = () => {
  const location = useLocation();
  const [pendingRequests, setPendingRequests] = useState([]);
  const [projects, setProjects] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [busyId, setBusyId] = useState('');
  const [rejectMessageById, setRejectMessageById] = useState({});
  const [feedbackById, setFeedbackById] = useState({});
  const [alert, setAlert] = useState(null);
  const [confirmState, setConfirmState] = useState(null);
  const [historyByProject, setHistoryByProject] = useState({});
  const [historyOpenByProject, setHistoryOpenByProject] = useState({});
  const [historyLoadingByProject, setHistoryLoadingByProject] = useState({});
  const [historyErrorByProject, setHistoryErrorByProject] = useState({});
  const [submissionFileAction, setSubmissionFileAction] = useState('');

  const loadData = useCallback(async ({ clearAlert = true } = {}) => {
    setIsLoading(true);
    if (clearAlert) setAlert(null);
    try {
      const [requestsResponse, projectsResponse] = await Promise.all([
        getPendingSupervisorRequests(),
        getMySupervisorProjects(),
      ]);
      setPendingRequests(Array.isArray(requestsResponse?.data) ? requestsResponse.data : []);
      setProjects(Array.isArray(projectsResponse?.data) ? projectsResponse.data : []);
    } catch (err) {
      setAlert({ type: 'error', message: err?.response?.data?.message || err?.message || 'Unable to load supervisor projects.' });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  useEffect(() => {
    setSearchTerm(location.state?.targetProject || '');
  }, [location.state]);

  const filteredProjects = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    if (!query) {
      return projects;
    }

    return projects.filter((project) => [
      project?.title,
      project?.teamName,
      project?.latestFeedback,
      ...(project?.teamMembers || []).map((member) => member?.name),
    ]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(query)));
  }, [projects, searchTerm]);

  const runAction = async (id, action, message) => {
    setBusyId(id);
    setAlert(null);
    try {
      await action();
      await loadData({ clearAlert: false });
      setAlert({ type: 'success', message });
    } catch (err) {
      setAlert({ type: 'error', message: err?.response?.data?.message || err?.message || 'Action failed.' });
    } finally {
      setBusyId('');
    }
  };

  const submitFeedback = (project) => {
    if (project.status === 'ARCHIVED') {
      setAlert({ type: 'error', message: 'Archived projects cannot be modified by students or supervisors.' });
      return null;
    }
    const state = feedbackById[project.id] ?? {};
    const newStatus = state.status || project.status || 'UNDER_REVIEW';
    const comment = state.comment || '';
    return runAction(project.id, () => updateProjectStatus(project.id, newStatus, comment), 'Feedback saved.');
  };

  const confirmRejectRequest = (request) => {
    setConfirmState({
      title: 'Reject supervisor request?',
      message: 'Reject this supervisor request and send the response message to the team?',
      confirmLabel: 'Reject Request',
      tone: 'danger',
      loadingLabel: 'Rejecting...',
      onConfirm: async () => {
        await runAction(request.id, () => rejectSupervisorRequest(request.id, rejectMessageById[request.id] || ''), 'Supervisor request rejected.');
        setConfirmState(null);
      },
    });
  };

  const handleProposalFile = (project, mode) => runAction(project.id, async () => {
    const result = await downloadProposalFile(project.id);
    const blob = extractBlobFromResult(result);
    if (mode === 'view') {
      openBlobInNewTab(blob);
    } else {
      const fileName = extractFileNameFromHeaders(result?.headers, `${project.title || 'proposal'}.pdf`);
      triggerBrowserDownload(blob, fileName);
    }
  }, mode === 'view' ? 'Proposal opened.' : 'Proposal downloaded.');

  const toggleHistory = async (project) => {
    const projectId = project.id;
    const currentlyOpen = Boolean(historyOpenByProject[projectId]);
    if (currentlyOpen) {
      setHistoryOpenByProject((prev) => ({ ...prev, [projectId]: false }));
      return;
    }

    setHistoryOpenByProject((prev) => ({ ...prev, [projectId]: true }));
    if (historyByProject[projectId]) {
      return;
    }

    setHistoryLoadingByProject((prev) => ({ ...prev, [projectId]: true }));
    setHistoryErrorByProject((prev) => ({ ...prev, [projectId]: '' }));
    try {
      const response = await getProjectSubmissions(projectId);
      const items = Array.isArray(response?.data) ? response.data : [];
      setHistoryByProject((prev) => ({ ...prev, [projectId]: items }));
    } catch (err) {
      setHistoryErrorByProject((prev) => ({ ...prev, [projectId]: err?.response?.data?.message || err?.message || 'Unable to load submission history.' }));
    } finally {
      setHistoryLoadingByProject((prev) => ({ ...prev, [projectId]: false }));
    }
  };

  const handleSubmissionFile = async (projectId, submissionId, mode) => {
    if (!projectId || !submissionId) return;
    setSubmissionFileAction(`${submissionId}:${mode}`);
    try {
      const result = await downloadSubmissionFile(projectId, submissionId);
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
    <div className="sup-projects">
      <style>{styles}</style>
      <header className="sup-header">
        <div>
          <p className="sup-kicker">Supervisor / Proposal Review</p>
          <h1 className="sup-title">Proposal Review</h1>
          <p style={{ margin: '8px 0 0', color: '#64748b', fontSize: '14px', fontWeight: 600 }}>Review supervisor requests, assigned proposals, and project submissions.</p>
        </div>
        <button className="sup-refresh" disabled={isLoading} onClick={() => void loadData()}>{isLoading ? 'Refreshing...' : 'Refresh'}</button>
      </header>

      <div className="sup-grid">
        <section className="sup-section">
          <h2>Pending Supervisor Requests</h2>
          {isLoading ? (
            <div className="sup-empty">Loading requests...</div>
          ) : pendingRequests.length === 0 ? (
            <div className="sup-empty">No pending requests.</div>
          ) : (
            <div className="sup-list">
              {pendingRequests.map((request) => (
                <div className="sup-card" key={request.id}>
                  <p className="sup-card-title">{request.projectTitle}</p>
                  <p className="sup-meta">Team: {request.teamName || 'Unknown'} | Requested by: {request.requestedByName}</p>
                  {request.message ? <p className="sup-message">{request.message}</p> : null}
                  <div className="sup-feedback">
                    <textarea rows="2" placeholder="Optional rejection message" value={rejectMessageById[request.id] || ''} onChange={(event) => setRejectMessageById(prev => ({ ...prev, [request.id]: event.target.value }))} />
                  </div>
                  <div className="sup-actions">
                    <button className="sup-btn primary" disabled={busyId === request.id} onClick={() => runAction(request.id, () => acceptSupervisorRequest(request.id), 'Supervisor request accepted.', 'accept')}>{busyId === request.id ? 'Accepting...' : 'Accept'}</button>
                    <button className="sup-btn danger" disabled={busyId === request.id} onClick={() => confirmRejectRequest(request)}>{busyId === request.id ? 'Rejecting...' : 'Reject'}</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="sup-section">
          <h2>Assigned Projects</h2>
          <div className="sup-toolbar">
            <SearchBar
              placeholder="Search assigned projects, teams, students, or feedback..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              onClear={() => setSearchTerm('')}
            />
          </div>
          {isLoading ? (
            <div className="sup-empty">Loading assigned projects...</div>
          ) : filteredProjects.length === 0 ? (
            <div className="sup-empty">{projects.length === 0 ? 'No assigned projects yet.' : 'No assigned projects match your current search.'}</div>
          ) : (
            <div className="sup-list">
              {filteredProjects.map((project) => {
                const state = feedbackById[project.id] ?? {};
                const normalizedStatus = normalizeProjectStatus(project.status);
                const isArchived = normalizedStatus === 'ARCHIVED';
                const isResubmitted = normalizedStatus === 'SUBMITTED' && (project.proposalVersion ?? 1) > 1;
                const historyItems = historyByProject[project.id] || [];
                const historyLoading = historyLoadingByProject[project.id];
                const historyError = historyErrorByProject[project.id];
                const latestNote = historyItems.length ? historyItems[0]?.studentChangeNote : '';
                return (
                  <div className="sup-card" key={project.id}>
                    <p className="sup-card-title">{project.title}</p>
                    <div className="sup-meta" style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                      <span>Team: {project.teamName || 'Not linked'}</span>
                      <ProjectStatusBadge status={project.status} />
                    </div>
                    {Array.isArray(project.teamMembers) && project.teamMembers.length > 0 ? (
                      <div className="sup-team-members">
                        {project.teamMembers.map((member, index) => (
                          <ClickableUser
                            key={member?.id ?? member?.userId ?? `${project.id}-member-${index}`}
                            user={{
                              ...member,
                              id: member?.id ?? member?.userId ?? null,
                              role: member?.role ?? 'ROLE_STUDENT',
                              universityId: member?.universityId ?? member?.universityID ?? '',
                              specialty: member?.major ?? '',
                            }}
                            className="sup-user-link sup-member-chip"
                            avatarClassName="sup-user-avatar"
                            nameClassName="sup-user-name"
                            subtitle={member?.email || member?.memberRole || 'View student profile'}
                            subtitleClassName="sup-user-subtitle"
                          />
                        ))}
                      </div>
                    ) : null}
                    <div className="sup-meta" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      <span>Proposal Version: {project.proposalVersion || 1}</span>
                      {isResubmitted ? <span className="sup-badge">Resubmitted</span> : null}
                    </div>
                    {latestNote ? <p className="sup-message">Latest changes: {latestNote}</p> : null}
                    {isArchived ? <p className="sup-message">Archived project. Feedback and workflow updates are disabled.</p> : null}
                    <p className="sup-meta">{project.description}</p>
                    {project.latestFeedback ? <p className="sup-message">Latest feedback: {project.latestFeedback}</p> : null}
                    <div className="sup-actions">
                      {project.documentPath ? (
                        <>
                          <button className="sup-btn" disabled={busyId === project.id} onClick={() => void handleProposalFile(project, 'view')}>{busyId === project.id ? 'Opening...' : 'View Proposal'}</button>
                          <button className="sup-btn" disabled={busyId === project.id} onClick={() => void handleProposalFile(project, 'download')}>{busyId === project.id ? 'Downloading...' : 'Download Proposal'}</button>
                        </>
                      ) : (
                        <span className="sup-meta">No proposal file uploaded.</span>
                      )}
                      <button className="sup-btn" onClick={() => void toggleHistory(project)}>
                        {historyOpenByProject[project.id] ? 'Hide Submission History' : 'View Submission History'}
                      </button>
                    </div>
                    {historyOpenByProject[project.id] && (
                      <div className="sup-history">
                        {historyLoading ? (
                          <div className="sup-meta">Loading submission history...</div>
                        ) : historyError ? (
                          <div className="sup-meta">{historyError}</div>
                        ) : historyItems.length === 0 ? (
                          <div className="sup-meta">No submission history available yet.</div>
                        ) : (
                          historyItems.map((submission) => (
                            <div key={submission.id} className="sup-history-card">
                              <strong>Version {submission.versionNumber}{submission.isLatest ? ' (Latest)' : ''}</strong>
                              <div className="sup-history-meta">
                                <span>Submitted {submission.submittedAt ? new Date(submission.submittedAt).toLocaleString() : 'Recently'}</span>
                                <span>By {submission.submittedByName || 'Team Leader'}</span>
                              </div>
                              <p className="sup-history-note">{submission.studentChangeNote || (Number(submission.versionNumber) === 1 ? 'Initial submission' : 'No change note provided.')}</p>
                              <div className="sup-history-actions">
                                {submission.hasFile ? (
                                  <>
                                    <button
                                      className="sup-btn"
                                      disabled={submissionFileAction === `${submission.id}:view`}
                                      onClick={() => void handleSubmissionFile(project.id, submission.id, 'view')}
                                    >
                                      {submissionFileAction === `${submission.id}:view` ? 'Opening...' : 'View PDF'}
                                    </button>
                                    <button
                                      className="sup-btn"
                                      disabled={submissionFileAction === `${submission.id}:download`}
                                      onClick={() => void handleSubmissionFile(project.id, submission.id, 'download')}
                                    >
                                      {submissionFileAction === `${submission.id}:download` ? 'Downloading...' : 'Download PDF'}
                                    </button>
                                  </>
                                ) : (
                                  <span className="sup-meta">No file attached.</span>
                                )}
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                    <div className="sup-feedback">
                      <StyledSelect disabled={isArchived} value={state.status || project.status || 'UNDER_REVIEW'} onChange={(event) => setFeedbackById(prev => ({ ...prev, [project.id]: { ...state, status: event.target.value } }))}>
                        <option value="UNDER_REVIEW">Under Review</option>
                        <option value="NEEDS_CHANGES">Needs Changes</option>
                        <option value="APPROVED">Approved</option>
                        <option value="REJECTED">Rejected</option>
                      </StyledSelect>
                      <textarea disabled={isArchived} rows="3" placeholder="Feedback for students" value={state.comment || ''} onChange={(event) => setFeedbackById(prev => ({ ...prev, [project.id]: { ...state, comment: event.target.value } }))} />
                      <button className="sup-btn" disabled={busyId === project.id || isArchived} onClick={() => void submitFeedback(project)}>{busyId === project.id ? 'Updating...' : 'Save Feedback'}</button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
      <ConfirmDialog
        open={Boolean(confirmState)}
        title={confirmState?.title}
        message={confirmState?.message}
        confirmLabel={confirmState?.confirmLabel}
        tone={confirmState?.tone}
        isLoading={Boolean(busyId)}
        loadingLabel={confirmState?.loadingLabel}
        onCancel={() => setConfirmState(null)}
        onConfirm={confirmState?.onConfirm}
      />
      <FeedbackToast message={alert?.message} type={alert?.type} onClose={() => setAlert(null)} />
    </div>
  );
};

export default ProjectsList;

