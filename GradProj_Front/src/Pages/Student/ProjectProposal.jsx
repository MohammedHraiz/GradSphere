import { useCallback, useEffect, useMemo, useState } from 'react';
import ProjectSubmissionForm from '../../components/ProjectSubmissionForm';
import {
  cancelSupervisorRequest,
  downloadProposalFile,
  getMyProject,
  getProjectSubmissions,
  getSupervisors,
  downloadSubmissionFile,
} from '../../api/projectService';
import { apiClient } from '../../api/apiClient';
import { useAuth } from '../../auth/AuthContext';
import { extractBlobFromResult, extractFileNameFromHeaders, openBlobInNewTab, triggerBrowserDownload } from '../../utils/downloadFile';
import ConfirmDialog from '../../components/ConfirmDialog';
import FeedbackToast from '../../components/FeedbackToast';
import ProjectStatusBadge from '../../components/ProjectStatusBadge';
import { formatProjectStatus } from '../../utils/projectStatus';

const styles = `
.proposal-page { padding: 10px 20px 40px 20px; font-family: 'Plus Jakarta Sans', -apple-system, sans-serif; color: #0f172a; text-align: left; }
.proposal-header { display: flex; align-items: flex-end; justify-content: space-between; gap: 18px; margin-bottom: 28px; }
.proposal-kicker { margin: 0 0 6px; color: #4f46e5; font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; }
.proposal-title { margin: 0; font-size: 32px; font-weight: 900; letter-spacing: -1px; }
.proposal-layout { display: grid; grid-template-columns: minmax(0, 1fr) 380px; gap: 24px; align-items: start; }
.proposal-card { background: white; border: 1px solid #e2e8f0; border-radius: 24px; padding: 28px; box-shadow: 0 10px 24px -22px rgba(15,23,42,0.6); }
.proposal-card h2 { margin: 0 0 10px; font-size: 20px; font-weight: 900; }
.proposal-card p { margin: 0 0 20px; color: #64748b; font-size: 14px; line-height: 1.7; }
.proposal-card form, .resubmit-form { display: grid; gap: 18px; }
.proposal-card label { display: block; margin-bottom: 8px; color: #475569; font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: .05em; }
.proposal-card input, .proposal-card textarea, .proposal-card select { width: 100%; box-sizing: border-box; border: 1px solid #e2e8f0; border-radius: 14px; padding: 13px 15px; font: inherit; font-size: 14px; outline: none; background: white; }
.proposal-card input[readonly] { background: #f8fafc; color: #334155; font-weight: 800; }
.proposal-card textarea { min-height: 140px; resize: vertical; }
.proposal-card input:focus, .proposal-card textarea:focus, .proposal-card select:focus { border-color: #4f46e5; box-shadow: 0 0 0 4px rgba(79,70,229,.10); }
.proposal-card form div div { margin-top: 8px; color: #be123c; font-size: 13px; font-weight: 700; }
.proposal-card button[type="submit"] { border: 0; border-radius: 14px; background: #4f46e5; color: white; padding: 14px 18px; font-weight: 900; cursor: pointer; }
.proposal-card button[type="submit"]:disabled { opacity: .65; cursor: not-allowed; }
.proposal-summary { display: grid; gap: 14px; }
.proposal-row { padding: 14px 0; border-bottom: 1px solid #f1f5f9; }
.proposal-row:last-child { border-bottom: 0; }
.proposal-label { margin: 0 0 5px; color: #94a3b8; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: .08em; }
.proposal-value { margin: 0; color: #0f172a; font-size: 14px; font-weight: 800; line-height: 1.5; overflow-wrap: anywhere; }
.proposal-empty { border: 1px dashed #cbd5e1; border-radius: 20px; padding: 24px; background: #f8fafc; color: #64748b; text-align: center; line-height: 1.7; }
.proposal-notice { border-radius: 18px; padding: 16px; background: #f8fafc; border: 1px solid #e2e8f0; color: #475569; font-weight: 700; line-height: 1.6; margin-bottom: 18px; }
.proposal-notice.warn { background: #fff7ed; border-color: #fed7aa; color: #9a3412; }
.proposal-actions { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 14px; }
.proposal-button { border: 0; border-radius: 12px; background: #0f172a; color: white; padding: 12px 14px; font-weight: 900; cursor: pointer; }
.proposal-button.secondary { background: white; color: #0f172a; border: 1px solid #cbd5e1; }
.proposal-button.danger { background: white; color: #be123c; border: 1px solid #fecaca; }
.proposal-button:disabled { opacity: .65; cursor: not-allowed; }
.request-box { display: grid; gap: 12px; margin-top: 16px; border: 1px solid #e2e8f0; border-radius: 16px; padding: 16px; background: #f8fafc; }
.request-box select, .request-box textarea { width: 100%; box-sizing: border-box; border: 1px solid #e2e8f0; border-radius: 12px; padding: 11px 12px; font: inherit; }
.proposal-history { margin-top: 30px; display: grid; gap: 14px; }
.proposal-history-header { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.proposal-history-title { margin: 0; font-size: 20px; font-weight: 900; }
.proposal-history-card { border: 1px solid #e2e8f0; border-radius: 20px; padding: 18px; background: #f8fafc; display: grid; gap: 10px; }
.proposal-history-meta { display: flex; flex-wrap: wrap; gap: 12px; font-size: 12px; font-weight: 700; color: #64748b; }
.proposal-history-note { margin: 0; color: #0f172a; font-size: 13px; font-weight: 700; line-height: 1.6; }
.proposal-history-badge { display: inline-flex; align-items: center; gap: 6px; padding: 6px 10px; border-radius: 999px; font-size: 11px; font-weight: 900; letter-spacing: .05em; text-transform: uppercase; background: #ede9fe; color: #6d28d9; }
.proposal-history-actions { display: flex; flex-wrap: wrap; gap: 10px; }
.proposal-history-divider { height: 1px; background: #e2e8f0; }
@media (max-width: 900px) { .proposal-layout { grid-template-columns: 1fr; } .proposal-header { align-items: flex-start; flex-direction: column; } }
`;

const canResubmitStatus = (status) => ['NEEDS_CHANGES', 'REJECTED', 'REVISION_REQUIRED'].includes(String(status || '').toUpperCase());

const ProjectProposal = () => {
  const { user } = useAuth();
  const [project, setProject] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [isLeader, setIsLeader] = useState(false);
  const [teamName, setTeamName] = useState('');
  const [supervisors, setSupervisors] = useState([]);
  const [actionLoading, setActionLoading] = useState(false);
  const [proposalFileAction, setProposalFileAction] = useState('');
  const [submissions, setSubmissions] = useState([]);
  const [submissionsLoading, setSubmissionsLoading] = useState(false);
  const [submissionsError, setSubmissionsError] = useState('');
  const [submissionFileAction, setSubmissionFileAction] = useState('');
  const [confirmState, setConfirmState] = useState(null);

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type });
  }, []);

  const loadProject = useCallback(async () => {
    setIsLoading(true);

    try {
      const response = await getMyProject();
      const nextProject = response?.data ?? null;
      setProject(nextProject);
    } catch (err) {
      if ((err?.status ?? err?.response?.status) === 404) {
        setProject(null);
      } else {
        showToast(err?.response?.data?.message || err?.message || 'Unable to load your project proposal.', 'error');
      }
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    void loadProject();
  }, [loadProject]);

  const loadSubmissions = useCallback(async (projectId) => {
    if (!projectId) return;
    setSubmissionsLoading(true);
    setSubmissionsError('');
    try {
      const response = await getProjectSubmissions(projectId);
      const items = Array.isArray(response?.data) ? response.data : [];
      setSubmissions(items);
    } catch (err) {
      setSubmissions([]);
      setSubmissionsError(err?.response?.data?.message || err?.message || 'Unable to load submission history.');
    } finally {
      setSubmissionsLoading(false);
    }
  }, []);

  useEffect(() => {
    const loadLeaderState = async () => {
      try {
        const response = await apiClient.get('/v1/teams/my/members');
        const members = Array.isArray(response?.data) ? response.data : [];
        const currentUserId = user?.id ?? user?.userId ?? user?.uuid ?? '';
        const current = members.find(member => String(member?.userId ?? member?.id ?? '').toLowerCase() === String(currentUserId).toLowerCase());
        setIsLeader(String(current?.memberRole ?? '').toUpperCase() === 'LEADER');
      } catch {
        setIsLeader(false);
      }
    };
    if (user?.hasTeam) void loadLeaderState();
  }, [user]);

  useEffect(() => {
    const loadTeam = async () => {
      try {
        const response = await apiClient.get('/v1/student/teams/my');
        const payload = response?.data ?? {};
        setTeamName(payload.teamName ?? payload.name ?? '');
      } catch {
        setTeamName('');
      }
    };
    if (user?.hasTeam) void loadTeam();
  }, [user?.hasTeam]);

  useEffect(() => {
    const loadSupervisors = async () => {
      try {
        const response = await getSupervisors();
        const items = Array.isArray(response?.data) ? response.data : [];
        setSupervisors(items);
      } catch {
        setSupervisors([]);
      }
    };
    void loadSupervisors();
  }, []);

  useEffect(() => {
    if (project?.id) {
      void loadSubmissions(project.id);
    } else {
      setSubmissions([]);
    }
  }, [project?.id, loadSubmissions]);

  const currentStatus = String(project?.status || '').toUpperCase();
  const allowResubmit = isLeader && project && canResubmitStatus(currentStatus);
  const resubmitNeedsSupervisor = allowResubmit && !project?.supervisor && !project?.pendingSupervisorRequestStatus;

  const statusMessage = useMemo(() => {
    if (!project) return '';
    if (currentStatus === 'SUBMITTED') return 'Your proposal has been submitted and is waiting for review.';
    if (currentStatus === 'UNDER_REVIEW') return 'Your proposal is under review. Resubmission is disabled while the review is active.';
    if (canResubmitStatus(currentStatus)) return 'Changes are needed. The team leader can resubmit an updated proposal.';
    if (currentStatus === 'APPROVED' || currentStatus === 'FINAL_APPROVAL_DEAN') return 'Your proposal is approved. Editing is disabled.';
    if (currentStatus === 'ARCHIVED') return 'This project is archived. Editing is disabled.';
    return '';
  }, [currentStatus, project]);

  const handleSubmitted = (submittedProject) => {
    setProject(submittedProject ?? null);
    showToast('Project proposal submitted and supervisor request sent.');
    void loadProject();
  };

  const handleCancelRequest = () => {
    const requestId = project?.pendingSupervisorRequestId ?? project?.supervisorRequestId;
    if (!requestId) return;
    setConfirmState({
      title: 'Cancel supervisor request?',
      message: 'Cancel this pending supervisor request? You can request a supervisor again after it is canceled.',
      confirmLabel: 'Cancel Request',
      tone: 'danger',
      loadingLabel: 'Canceling...',
      onConfirm: async () => {
        setActionLoading(true);
        try {
          await cancelSupervisorRequest(requestId);
          showToast('Supervisor request canceled.');
          await loadProject();
        } catch (err) {
          showToast(err?.response?.data?.message || err?.message || 'Could not cancel supervisor request.', 'error');
        } finally {
          setActionLoading(false);
          setConfirmState(null);
        }
      },
    });
  };

  const handleResubmitted = (updatedProject) => {
    setProject(updatedProject ?? null);
    showToast('Proposal resubmitted successfully.');
    void loadProject();
  };

  const handleProposalFile = async (mode) => {
    if (!project?.id) return;
      const handleSubmissionFile = async (submissionId, mode) => {
        if (!project?.id || !submissionId) return;
        setSubmissionFileAction(`${submissionId}:${mode}`);
        try {
          const result = await downloadSubmissionFile(project.id, submissionId);
          const blob = extractBlobFromResult(result);
          if (mode === 'view') {
            openBlobInNewTab(blob);
          } else {
            const fileName = extractFileNameFromHeaders(result?.headers, `proposal_v${project.proposalVersion || 1}.pdf`);
            triggerBrowserDownload(blob, fileName);
          }
        } catch (err) {
          showToast(err?.response?.data?.message || err?.message || 'Could not open proposal file.', 'error');
        } finally {
          setSubmissionFileAction('');
        }
      };
          {project && (
            <section className="proposal-history">
              <div className="proposal-history-header">
                <h2 className="proposal-history-title">Proposal Versions</h2>
                <span className="proposal-history-badge">{project.proposalVersion ? `Version ${project.proposalVersion}` : 'Version history'}</span>
              </div>
              {submissionsLoading ? (
                <div className="proposal-empty">Loading submission history...</div>
              ) : submissionsError ? (
                <div className="proposal-empty">{submissionsError}</div>
              ) : submissions.length === 0 ? (
                <div className="proposal-empty">No submission history is available yet. The current proposal is shown above.</div>
              ) : (
                submissions.map((submission) => (
                  <div className="proposal-history-card" key={submission.id}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                      <strong>Version {submission.versionNumber}</strong>
                      {submission.isLatest ? <span className="proposal-history-badge">Latest</span> : null}
                    </div>
                    <div className="proposal-history-meta">
                      <span>Submitted {submission.submittedAt ? new Date(submission.submittedAt).toLocaleString() : 'Recently'}</span>
                      <span>By {submission.submittedByName || 'Team Leader'}</span>
                    </div>
                    <div className="proposal-history-divider" />
                    <p className="proposal-history-note">{submission.studentChangeNote || (Number(submission.versionNumber) === 1 ? 'Initial submission' : 'No change note provided.')}</p>
                    <div className="proposal-history-actions">
                      {submission.hasFile ? (
                        <>
                          <button
                            className="proposal-button secondary"
                            disabled={submissionFileAction === `${submission.id}:view`}
                            onClick={() => void handleSubmissionFile(submission.id, 'view')}
                          >
                            {submissionFileAction === `${submission.id}:view` ? 'Opening...' : 'View PDF'}
                          </button>
                          <button
                            className="proposal-button secondary"
                            disabled={submissionFileAction === `${submission.id}:download`}
                            onClick={() => void handleSubmissionFile(submission.id, 'download')}
                          >
                            {submissionFileAction === `${submission.id}:download` ? 'Downloading...' : 'Download PDF'}
                          </button>
                        </>
                      ) : (
                        <span className="proposal-value">No proposal file available.</span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </section>
          )}
    setProposalFileAction(mode);
    try {
      const result = await downloadProposalFile(project.id);
      const blob = extractBlobFromResult(result);
      if (mode === 'view') {
        openBlobInNewTab(blob);
      } else {
        const fileName = extractFileNameFromHeaders(result?.headers, `${project.title || 'proposal'}.pdf`);
        triggerBrowserDownload(blob, fileName);
      }
    } catch (err) {
      showToast(err?.response?.data?.message || err?.message || 'Could not open proposal file.', 'error');
    } finally {
      setProposalFileAction('');
    }
  };

  return (
    <div className="proposal-page">
      <style>{styles}</style>
      <header className="proposal-header">
        <div>
          <p className="proposal-kicker">Student Portal / Project</p>
          <h1 className="proposal-title">Project Proposal</h1>
        </div>
        {project?.status ? <ProjectStatusBadge status={project.status} /> : null}
      </header>

      <div className="proposal-layout">
        <section className="proposal-card">
          <h2>{allowResubmit ? 'Resubmit Proposal' : 'Submit Proposal'}</h2>
          <p>The team leader submits the official proposal document for dean or supervisor review.</p>
          {!user?.hasTeam ? (
            <div className="proposal-empty">You must create or join a team before submitting a proposal.</div>
          ) : isLoading ? (
            <div className="proposal-empty">Loading proposal...</div>
          ) : !project ? (
            isLeader ? (
              <ProjectSubmissionForm
                projectName={teamName}
                supervisors={supervisors}
                requireSupervisor
                requireFile
                onSuccess={handleSubmitted}
              />
            ) : (
              <div className="proposal-empty">Only the team leader can submit the project proposal.</div>
            )
          ) : allowResubmit ? (
            <>
              <div className="proposal-notice warn">{statusMessage}</div>
              <ProjectSubmissionForm
                mode="resubmit"
                projectId={project.id}
                projectName={teamName || project.teamName || project.title}
                initialDescription={project.description ?? ''}
                supervisors={supervisors}
                requireSupervisor={Boolean(resubmitNeedsSupervisor)}
                requireFile={false}
                onSuccess={handleResubmitted}
              />
            </>
          ) : (
            <div className="proposal-empty">
              {canResubmitStatus(currentStatus) && !isLeader
                ? 'Only the team leader can resubmit the project proposal.'
                : statusMessage || 'A proposal has already been submitted.'}
            </div>
          )}
        </section>

        <aside className="proposal-card">
          <h2>Current Proposal</h2>
          {isLoading ? (
            <div className="proposal-empty">Loading proposal...</div>
          ) : project ? (
            <div className="proposal-summary">
              <div className="proposal-row"><p className="proposal-label">Title</p><p className="proposal-value">{project.title}</p></div>
              <div className="proposal-row"><p className="proposal-label">Description</p><p className="proposal-value">{project.description}</p></div>
              <div className="proposal-row"><p className="proposal-label">Proposal Version</p><p className="proposal-value">Proposal Version {project.proposalVersion || 1}</p></div>
              <div className="proposal-row"><p className="proposal-label">Status</p><p className="proposal-value"><ProjectStatusBadge status={project.status} /></p></div>
              <div className="proposal-row"><p className="proposal-label">Status Guidance</p><p className="proposal-value">{statusMessage || 'No additional action is needed right now.'}</p></div>
              <div className="proposal-row"><p className="proposal-label">Assigned Supervisor</p><p className="proposal-value">{project.supervisor ? `${project.supervisor.name}${project.supervisor.email ? ` (${project.supervisor.email})` : ''}` : 'Not assigned yet'}</p></div>
              <div className="proposal-row">
                <p className="proposal-label">Supervisor Request</p>
                <p className="proposal-value">
                  {project.pendingSupervisorRequestStatus ? `Pending with ${project.pendingSupervisorName || 'supervisor'}` : project.lastSupervisorRequestResponseMessage ? `Last response: ${project.lastSupervisorRequestResponseMessage}` : 'No pending request'}
                </p>
              </div>
              <div className="proposal-row"><p className="proposal-label">Latest Feedback</p><p className="proposal-value">{project.latestFeedback || 'No feedback yet.'}</p></div>
              <div className="proposal-row"><p className="proposal-label">Team</p><p className="proposal-value">{project.teamName || 'Not linked'}</p></div>
              <div className="proposal-row">
                <p className="proposal-label">Proposal PDF</p>
                {project.documentPath ? (
                  <div className="proposal-actions">
                    <button className="proposal-button secondary" disabled={Boolean(proposalFileAction)} onClick={() => void handleProposalFile('view')}>
                      {proposalFileAction === 'view' ? 'Opening...' : 'View Proposal'}
                    </button>
                    <button className="proposal-button secondary" disabled={Boolean(proposalFileAction)} onClick={() => void handleProposalFile('download')}>
                      {proposalFileAction === 'download' ? 'Downloading...' : 'Download Proposal'}
                    </button>
                  </div>
                ) : (
                  <p className="proposal-value">No proposal file uploaded.</p>
                )}
              </div>
              {isLeader && project.pendingSupervisorRequestStatus && (project.pendingSupervisorRequestId || project.supervisorRequestId) ? (
                <div className="proposal-actions">
                  <button className="proposal-button danger" disabled={actionLoading} onClick={handleCancelRequest}>
                    {actionLoading ? 'Canceling...' : 'Cancel Pending Request'}
                  </button>
                </div>
              ) : null}
            </div>
          ) : (
            <div className="proposal-empty">No proposal has been submitted yet.</div>
          )}
        </aside>
      </div>

      <ConfirmDialog
        open={Boolean(confirmState)}
        title={confirmState?.title}
        message={confirmState?.message}
        confirmLabel={confirmState?.confirmLabel}
        tone={confirmState?.tone}
        isLoading={actionLoading}
        loadingLabel={confirmState?.loadingLabel}
        onCancel={() => setConfirmState(null)}
        onConfirm={confirmState?.onConfirm}
      />
      <FeedbackToast message={toast?.message} type={toast?.type} onClose={() => setToast(null)} />
    </div>
  );
};

export default ProjectProposal;
