import React, { useEffect, useMemo, useState } from 'react';
import StyledFileInput from '../../components/StyledFileInput';
import { getMyProject } from '../../api/projectService';
import { downloadMilestoneSubmission, getProjectMilestones, submitMilestone } from '../../api/workflowService';
import FeedbackToast from '../../components/FeedbackToast';
import { extractBlobFromResult, openBlobInNewTab } from '../../utils/downloadFile';
import { getMilestoneStatusIcon } from '../../utils/statusIcons';

const styles = `
.milestones-wrapper { padding: 10px 20px 40px 20px; font-family: 'Plus Jakarta Sans', sans-serif; color: #0f172a; animation: fadeIn 0.4s ease-out; text-align: left; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
.m-header { margin-bottom: 40px; display: flex; justify-content: space-between; align-items: flex-end; gap: 18px; flex-wrap: wrap; }
.m-kicker { color: #4f46e5; font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 5px; }
.m-title { font-size: 32px; font-weight: 900; margin: 0; color: #0f172a; letter-spacing: -1px; }
.overall-progress-card { background: white; border: 1px solid #e2e8f0; padding: 25px; border-radius: 24px; margin-top: 25px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.02); }
.progress-text-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; gap: 18px; }
.progress-text-row h3 { font-size: 18px; font-weight: 800; margin: 0; }
.progress-subtext { font-size: 13px; color: #64748b; font-weight: 600; margin-top: 4px; }
.progress-percentage { font-size: 28px; font-weight: 900; color: #4f46e5; }
.progress-bar-bg { height: 10px; background: #f1f5f9; border-radius: 10px; overflow: hidden; }
.progress-bar-fill { height: 100%; background: linear-gradient(90deg, #4f46e5, #7c3aed); border-radius: 10px; transition: 0.6s ease-out; }
.timeline-container { position: relative; padding-left: 50px; margin-top: 50px; }
.timeline-container::before { content: ''; position: absolute; left: 24px; top: 0; height: 100%; width: 2px; background: #e2e8f0; border-radius: 2px; }
.timeline-item { position: relative; margin-bottom: 30px; }
.timeline-dot { position: absolute; left: -50px; top: 15px; width: 34px; height: 34px; border-radius: 50%; background: white; border: 2px solid #e2e8f0; display: flex; align-items: center; justify-content: center; z-index: 2; font-weight: 900; font-size: 14px; }
.timeline-item.completed .timeline-dot { border-color: #10b981; color: #10b981; }
.timeline-item.submitted .timeline-dot { border-color: #4f46e5; color: #4f46e5; }
.timeline-item.pending .timeline-dot { border-color: #cbd5e1; color: #94a3b8; }
.milestone-card { background: white; border: 1px solid #e2e8f0; border-radius: 24px; padding: 26px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.02); transition: all 0.25s ease; cursor: pointer; }
.milestone-card:hover { transform: translateY(-4px); border-color: #4f46e5; box-shadow: 0 20px 25px -5px rgba(79, 70, 229, 0.1); }
.m-card-header { display: flex; justify-content: space-between; align-items: flex-start; gap: 18px; margin-bottom: 14px; }
.m-card-title { font-size: 20px; font-weight: 800; margin: 0 0 5px 0; color: #0f172a; }
.m-card-date { font-size: 13px; font-weight: 700; color: #64748b; }
.status-badge { padding: 6px 12px; border-radius: 20px; font-size: 11px; font-weight: 800; text-transform: uppercase; }
.status-badge.completed { background: #d1fae5; color: #059669; }
.status-badge.submitted { background: #eef2ff; color: #4f46e5; }
.status-badge.pending { background: #f1f5f9; color: #94a3b8; }
.m-card-desc { font-size: 14px; color: #475569; line-height: 1.6; margin-bottom: 18px; }
.m-action-row { display: flex; justify-content: space-between; align-items: center; gap: 10px; border-top: 1px dashed #e2e8f0; padding-top: 14px; }
.m-action-row button { border: none; background: transparent; color: #4f46e5; font-weight: 800; cursor: pointer; }
.state { padding: 22px; border: 1px dashed #cbd5e1; border-radius: 18px; background: #f8fafc; color: #64748b; font-weight: 700; }
.state.error { border-color: #fecaca; background: #fff1f2; color: #be123c; }
.empty-state-card { display: grid; gap: 10px; max-width: 660px; margin-top: 24px; padding: 28px; border-radius: 22px; border: 1px solid #e2e8f0; background: linear-gradient(180deg, #ffffff, #f8fafc); box-shadow: 0 22px 42px -34px rgba(15,23,42,0.34); color: #475569; }
.empty-state-icon { width: 44px; height: 44px; border-radius: 14px; display: inline-flex; align-items: center; justify-content: center; background: #eef2ff; font-size: 22px; }
.empty-state-card h3 { margin: 0; color: #0f172a; font-size: 20px; font-weight: 900; }
.empty-state-card p { margin: 0; line-height: 1.6; font-weight: 600; }
.modal-backdrop { position: fixed; inset: 0; background: rgba(15, 23, 42, 0.6); backdrop-filter: blur(4px); display: flex; justify-content: center; align-items: center; z-index: 1000; animation: fadeIn 0.2s; padding: 20px; }
.modal-content { background: white; width: 100%; max-width: 760px; max-height: 90vh; border-radius: 28px; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25); position: relative; text-align: left; display: flex; flex-direction: column; overflow: hidden; }
.modal-header { padding: 25px 30px; border-bottom: 1px solid #f1f5f9; display: flex; align-items: center; justify-content: space-between; gap: 16px; }
.modal-header h2 { margin: 0; font-size: 22px; font-weight: 800; }
.close-btn { background: #f1f5f9; border: none; width: 36px; height: 36px; border-radius: 50%; cursor: pointer; font-size: 18px; color: #64748b; }
.modal-body { padding: 30px; overflow-y: auto; }
.sub-meta-grid, .form-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 18px; }
.meta-box, .field { background: #f8fafc; padding: 15px; border-radius: 12px; border: 1px solid #e2e8f0; }
.meta-box label, .field label { display: block; font-size: 11px; font-weight: 800; color: #94a3b8; text-transform: uppercase; margin-bottom: 8px; }
.meta-box span { font-weight: 800; color: #0f172a; font-size: 14px; }
.field input, .field textarea, .field .styled-file-input-shell { width: 100%; box-sizing: border-box; padding: 12px 14px; border: 1px solid #e2e8f0; border-radius: 12px; font: inherit; background: white; }
.field textarea { min-height: 120px; resize: vertical; }
.field.full { grid-column: 1 / -1; }
.feedback-box { background: #fffcf0; border: 1px solid #fde68a; padding: 20px; border-radius: 16px; margin-top: 20px; }
.modal-footer { display: flex; justify-content: flex-end; gap: 12px; padding: 20px 30px; border-top: 1px solid #f1f5f9; background: #f8fafc; border-bottom-left-radius: 28px; border-bottom-right-radius: 28px; }
.btn-secondary-modal { background: #fff; border: 1px solid #e2e8f0; color: #475569; padding: 12px 24px; border-radius: 12px; font-weight: 700; cursor: pointer; }
.btn-submit-final-saas { background: #4f46e5; color: white; border: none; padding: 12px 30px; border-radius: 12px; font-weight: 800; cursor: pointer; }
.file-link { display: inline-flex; margin-top: 12px; color: #4f46e5; font-weight: 800; text-decoration: none; }
@media (max-width: 760px) { .sub-meta-grid, .form-grid { grid-template-columns: 1fr; } }
`;

const labelize = (value) => String(value || '').replaceAll('_', ' ');
const milestoneState = (milestone) => {
  if (milestone.status === 'COMPLETED') return 'completed';
  if (milestone.status === 'SUBMITTED' || milestone.status === 'UNDER_REVIEW' || milestone.status === 'APPROVED') return 'submitted';
  return 'pending';
};

const Milestones = () => {
  const [project, setProject] = useState(null);
  const [milestones, setMilestones] = useState([]);
  const [selectedMilestone, setSelectedMilestone] = useState(null);
  const [submissionNotes, setSubmissionNotes] = useState('');
  const [submissionFile, setSubmissionFile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState(null);

  const loadData = async () => {
    setIsLoading(true);
    setError('');
    try {
      const response = await getMyProject();
      const myProject = response?.data ?? null;
      if (!myProject?.id) {
        setProject(null);
        setMilestones([]);
        return;
      }
      setProject(myProject);
      const workflowMilestones = await getProjectMilestones(myProject.id);
      setMilestones(workflowMilestones);
    } catch (err) {
      if (err?.status === 404 || err?.response?.status === 404) {
        setProject(null);
        setMilestones([]);
        return;
      }
      setError(err?.response?.data?.message || err?.message || 'Unable to load milestones.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const completedCount = milestones.filter((milestone) => milestone.status === 'COMPLETED').length;
  const progressPercentage = milestones.length ? Math.round((completedCount / milestones.length) * 100) : 0;

  const openViewModal = (milestone) => {
    setSelectedMilestone(milestone);
    setSubmissionNotes(milestone.submissionNotes || '');
    setSubmissionFile(null);
  };

  const closeModal = () => {
    setSelectedMilestone(null);
    setSubmissionNotes('');
    setSubmissionFile(null);
  };

  const handleSubmitWork = async (event) => {
    event.preventDefault();
    if (!selectedMilestone?.id || !submissionFile) {
      setToast({ type: 'error', message: 'Please choose a submission file first.' });
      return;
    }
    setIsSaving(true);
    try {
      const updated = await submitMilestone(selectedMilestone.id, { notes: submissionNotes, file: submissionFile });
      setMilestones((current) => current.map((milestone) => (milestone.id === updated.id ? updated : milestone)));
      setSelectedMilestone(updated);
      setSubmissionFile(null);
      setToast({ type: 'success', message: 'Milestone submission uploaded successfully.' });
    } catch (err) {
      setToast({ type: 'error', message: err?.response?.data?.message || err?.message || 'Unable to submit milestone work.' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleOpenSubmission = async (event, milestone) => {
    event.preventDefault();
    if (!milestone?.id) {
      return;
    }

    try {
      const result = await downloadMilestoneSubmission(milestone.id);
      openBlobInNewTab(extractBlobFromResult(result));
    } catch (err) {
      setToast({ type: 'error', message: err?.response?.data?.message || err?.message || 'Unable to open the submitted file.' });
    }
  };

  return (
    <div className="milestones-wrapper">
      <style>{styles}</style>

      <div className="m-header">
        <div>
          <p className="m-kicker">Student Portal / Roadmap</p>
          <h1 className="m-title">Project Milestones</h1>
        </div>
      </div>

      <div className="overall-progress-card">
        <div className="progress-text-row">
          <div>
            <h3>Overall Progress</h3>
            <p className="progress-subtext">You have completed {completedCount} out of {milestones.length} milestones.</p>
          </div>
          <div className="progress-percentage">{progressPercentage}%</div>
        </div>
        <div className="progress-bar-bg">
          <div className="progress-bar-fill" style={{ width: `${progressPercentage}%` }} />
        </div>
      </div>

      {isLoading ? <div className="state" style={{ marginTop: 24 }}>Loading project milestones...</div> : null}
      {error ? <div className="state error" style={{ marginTop: 24 }}>{error}</div> : null}
      {!isLoading && !error && !project ? (
        <div className="empty-state-card">
          <span className="empty-state-icon">🚩</span>
          <h3>No project milestones available yet.</h3>
          <p>Milestones will appear after your team submits a project proposal.</p>
        </div>
      ) : null}

      {!isLoading && !error && project ? (
        <div className="timeline-container">
          {milestones.map((milestone) => {
            const state = milestoneState(milestone);
            return (
              <div key={milestone.id} className={`timeline-item ${state}`}>
                <div className="timeline-dot">{getMilestoneStatusIcon(milestone.status)}</div>
                <div className="milestone-card" onClick={() => openViewModal(milestone)}>
                  <div className="m-card-header">
                    <div>
                      <h2 className="m-card-title">{milestone.title}</h2>
                      <span className="m-card-date">Deadline: {milestone.deadlineDate || 'No deadline set'}</span>
                    </div>
                    <div className={`status-badge ${state}`}>{getMilestoneStatusIcon(milestone.status)} {labelize(milestone.status)}</div>
                  </div>
                  <p className="m-card-desc">{milestone.description || 'No milestone description was added yet.'}</p>
                  <div className="m-action-row">
                    <span>{milestone.submissionFileName ? `Submitted: ${milestone.submissionFileName}` : 'No submission uploaded yet'}</span>
                    <button type="button">Open Details →</button>
                  </div>
                </div>
              </div>
            );
          })}
          {!milestones.length ? <div className="state">No milestones have been created for this project yet.</div> : null}
        </div>
      ) : null}

      {selectedMilestone ? (
        <div className="modal-backdrop" onClick={closeModal}>
          <div className="modal-content" onClick={(event) => event.stopPropagation()}>
            <div className="modal-header">
              <h2>{selectedMilestone.title}</h2>
              <button type="button" className="close-btn" onClick={closeModal}>×</button>
            </div>
            <div className="modal-body">
              <div className="sub-meta-grid">
                <div className="meta-box"><label>Deadline</label><span>{selectedMilestone.deadlineDate || 'Not set'}</span></div>
                <div className="meta-box"><label>Status</label><span>{labelize(selectedMilestone.status)}</span></div>
                <div className="meta-box"><label>Completed Date</label><span>{selectedMilestone.completedDate ? new Date(selectedMilestone.completedDate).toLocaleString() : 'Pending'}</span></div>
                <div className="meta-box"><label>Submission</label><span>{selectedMilestone.submissionFileName || 'No file uploaded yet'}</span></div>
              </div>
              <div className="feedback-box">
                <h4 style={{ marginTop: 0 }}>Description</h4>
                <p>{selectedMilestone.description || 'No description available for this milestone.'}</p>
              </div>
              <div className="feedback-box">
                <h4 style={{ marginTop: 0 }}>Key Requirements / Deliverables</h4>
                <p>{selectedMilestone.keyRequirements || 'No deliverables were added yet.'}</p>
              </div>
              <div className="feedback-box">
                <h4 style={{ marginTop: 0 }}>Supervisor Feedback</h4>
                <p>{selectedMilestone.reviewFeedback || 'No supervisor feedback yet.'}</p>
              </div>
              {selectedMilestone.submissionFilePath ? (
                <a className="file-link" href={selectedMilestone.submissionFilePath} target="_blank" rel="noreferrer" onClick={(event) => void handleOpenSubmission(event, selectedMilestone)}>
                  View current submission
                </a>
              ) : null}

              <form onSubmit={handleSubmitWork} style={{ marginTop: 20 }}>
                <div className="form-grid">
                  <div className="field full">
                    <label htmlFor="milestone-notes">Submission Notes</label>
                    <textarea id="milestone-notes" value={submissionNotes} onChange={(event) => setSubmissionNotes(event.target.value)} />
                  </div>
                  <div className="field full">
                    <label htmlFor="milestone-file">Upload Submission File</label>
                    <StyledFileInput
                      id="milestone-file"
                      accept=".pdf,.doc,.docx,.zip"
                      disabled={isSaving}
                      onChange={(event) => setSubmissionFile(event.target.files?.[0] ?? null)}
                      buttonLabel="Choose File"
                      placeholder="No submission file selected"
                    />
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn-secondary-modal" onClick={closeModal} disabled={isSaving}>Close</button>
                  <button type="submit" className="btn-submit-final-saas" disabled={isSaving}>{isSaving ? 'Submitting...' : 'Submit Milestone Work'}</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      ) : null}

      <FeedbackToast message={toast?.message} type={toast?.type} onClose={() => setToast(null)} />
    </div>
  );
};

export default Milestones;

