import React, { useEffect, useMemo, useState } from 'react';
import { getAssignedProjects } from '../../api/projectService';
import { createProjectMilestone, deleteMilestone, getProjectMilestones, updateMilestone } from '../../api/workflowService';
import FeedbackToast from '../../components/FeedbackToast';
import './MilestoneManagement.css';

const MILESTONE_STATUSES = ['NOT_STARTED', 'IN_PROGRESS', 'SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'NEEDS_CHANGES', 'COMPLETED'];
const emptyCreateForm = { title: '', description: '', deadlineDate: '', keyRequirements: '' };
const emptyReviewForm = { title: '', description: '', deadlineDate: '', keyRequirements: '', status: 'NOT_STARTED', completedDate: '', reviewFeedback: '' };
const labelize = (value) => String(value || '').replaceAll('_', ' ');
const statusClassName = (value) => String(value || 'NOT_STARTED').toLowerCase().replaceAll('_', '-');

const MilestoneManagement = () => {
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [milestones, setMilestones] = useState([]);
  const [activeMilestoneId, setActiveMilestoneId] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [createForm, setCreateForm] = useState(emptyCreateForm);
  const [reviewForm, setReviewForm] = useState(emptyReviewForm);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState(null);

  const selectedProject = useMemo(
    () => projects.find((project) => project.id === selectedProjectId) ?? null,
    [projects, selectedProjectId],
  );

  const activeMilestone = useMemo(
    () => milestones.find((milestone) => milestone.id === activeMilestoneId) ?? null,
    [milestones, activeMilestoneId],
  );

  const loadProjects = async () => {
    setIsLoading(true);
    setError('');
    try {
      const response = await getAssignedProjects();
      const assignedProjects = response?.data ?? [];
      setProjects(assignedProjects);
      const firstProjectId = assignedProjects?.[0]?.id ?? '';
      setSelectedProjectId((current) => current || firstProjectId);
    } catch (err) {
      setError(err?.message || 'Unable to load assigned projects.');
    } finally {
      setIsLoading(false);
    }
  };

  const loadMilestones = async (projectId) => {
    if (!projectId) {
      setMilestones([]);
      setActiveMilestoneId(null);
      return;
    }
    try {
      const workflowMilestones = await getProjectMilestones(projectId);
      setMilestones(workflowMilestones);
      setActiveMilestoneId((current) => {
        const stillExists = workflowMilestones.some((milestone) => milestone.id === current);
        if (stillExists) return current;
        return workflowMilestones?.[0]?.id || null;
      });
    } catch (err) {
      setToast({ type: 'error', message: err?.message || 'Unable to load milestones.' });
    }
  };

  useEffect(() => {
    void loadProjects();
  }, []);

  useEffect(() => {
    void loadMilestones(selectedProjectId);
  }, [selectedProjectId]);

  const completedCount = milestones.filter((milestone) => milestone.status === 'COMPLETED').length;
  const fillPercentage = milestones.length ? (completedCount / milestones.length) * 100 : 0;

  const openAddModal = () => {
    setCreateForm(emptyCreateForm);
    setShowAddModal(true);
  };

  const openReviewModal = () => {
    if (!activeMilestone) return;
    setReviewForm({
      title: activeMilestone.title ?? '',
      description: activeMilestone.description ?? '',
      deadlineDate: activeMilestone.deadlineDate ?? '',
      keyRequirements: activeMilestone.keyRequirements ?? '',
      status: activeMilestone.status ?? 'NOT_STARTED',
      completedDate: activeMilestone.completedDate ? new Date(activeMilestone.completedDate).toISOString().slice(0, 10) : '',
      reviewFeedback: activeMilestone.reviewFeedback ?? '',
    });
    setShowReviewModal(true);
  };

  const closeModals = () => {
    setShowAddModal(false);
    setShowReviewModal(false);
    setCreateForm(emptyCreateForm);
    setReviewForm(emptyReviewForm);
  };

  const saveMilestone = async (event) => {
    event.preventDefault();
    if (!selectedProjectId) return;
    setIsSaving(true);
    try {
      const payload = {
        title: createForm.title.trim(),
        description: createForm.description.trim(),
        deadlineDate: createForm.deadlineDate || null,
        keyRequirements: createForm.keyRequirements.trim(),
      };
      const created = await createProjectMilestone(selectedProjectId, payload);
      const nextMilestones = [...milestones, created].sort((a, b) => String(a.deadlineDate || '').localeCompare(String(b.deadlineDate || '')));
      setMilestones(nextMilestones);
      setActiveMilestoneId(created.id);
      setToast({ type: 'success', message: 'Milestone created successfully.' });
      closeModals();
    } catch (err) {
      setToast({ type: 'error', message: err?.response?.data?.message || err?.message || 'Unable to save the milestone.' });
    } finally {
      setIsSaving(false);
    }
  };

  const updateMilestoneReview = async (event) => {
    event.preventDefault();
    if (!activeMilestone?.id) return;
    setIsSaving(true);
    try {
      const payload = {
        title: reviewForm.title.trim(),
        description: reviewForm.description.trim(),
        deadlineDate: reviewForm.deadlineDate || null,
        keyRequirements: reviewForm.keyRequirements.trim(),
        status: reviewForm.status,
        completedDate: reviewForm.completedDate ? new Date(`${reviewForm.completedDate}T12:00:00Z`).toISOString() : null,
        reviewFeedback: reviewForm.reviewFeedback.trim(),
      };
      const updated = await updateMilestone(activeMilestone.id, payload);
      setMilestones((current) => current.map((milestone) => (milestone.id === updated.id ? updated : milestone)));
      setToast({ type: 'success', message: 'Milestone review updated successfully.' });
      closeModals();
    } catch (err) {
      setToast({ type: 'error', message: err?.response?.data?.message || err?.message || 'Unable to update the milestone.' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!activeMilestone?.id) return;
    setIsSaving(true);
    try {
      await deleteMilestone(activeMilestone.id);
      const remaining = milestones.filter((milestone) => milestone.id !== activeMilestone.id);
      setMilestones(remaining);
      setActiveMilestoneId(remaining[0]?.id ?? null);
      setToast({ type: 'success', message: 'Milestone deleted successfully.' });
      closeModals();
    } catch (err) {
      setToast({ type: 'error', message: err?.response?.data?.message || err?.message || 'Unable to delete the milestone.' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="milestone-container">
      <div className="page-header">
        <div>
          <p className="subtitle">Supervisor / Tracking</p>
          <h1 className="title">Milestone Management</h1>
        </div>
        <div className="header-actions">
          <button className="btn-primary-saas" onClick={openAddModal} disabled={!selectedProjectId}>Add Milestone</button>
        </div>
      </div>

      <div className="project-selector-bar">
        <label htmlFor="milestone-project-select">Select Project</label>
        <select id="milestone-project-select" className="saas-select-large" value={selectedProjectId} onChange={(event) => setSelectedProjectId(event.target.value)}>
          <option value="">Select project</option>
          {projects.map((project) => <option key={project.id} value={project.id}>{project.title}</option>)}
        </select>
      </div>

      {isLoading ? <div className="timeline-empty">Loading assigned projects...</div> : null}
      {error ? <div className="timeline-empty">{error}</div> : null}
      {!isLoading && !error && !projects.length ? <div className="timeline-empty">No assigned projects yet, so milestones are still empty.</div> : null}

      {!isLoading && !error && projects.length ? (
        <>
          <div className="timeline-wrapper">
            <div className="horizontal-timeline">
              <div className="timeline-track-bg" />
              <div className="timeline-track-fill" style={{ width: `${fillPercentage}%` }} />
              {milestones.map((milestone) => (
                <div
                  key={milestone.id}
                  className={`timeline-node ${statusClassName(milestone.status)} ${activeMilestoneId === milestone.id ? 'active' : ''}`}
                  onClick={() => setActiveMilestoneId(milestone.id)}
                >
                  <div className="node-point" />
                  <span className="node-label">{milestone.title}</span>
                  <span className="node-date">{milestone.deadlineDate || 'No date'}</span>
                </div>
              ))}
            </div>
          </div>

          {activeMilestone ? (
            <div className="milestone-detail-card">
              <div className="detail-header">
                <div className="detail-title">
                  <h2>{activeMilestone.title}</h2>
                  <p>{activeMilestone.description || 'No description was added for this milestone yet.'}</p>
                </div>
                <div>
                  <span className={`status-badge-lg ${statusClassName(activeMilestone.status)}`}>{labelize(activeMilestone.status)}</span>
                </div>
              </div>

              <div className="detail-content">
                <div className="requirements-list">
                  <h4>Milestone Snapshot</h4>
                  <div className="req-item"><span className="req-key">Deadline</span><span>{activeMilestone.deadlineDate || 'Not set'}</span></div>
                  <div className="req-item"><span className="req-key">Deliverables</span><span>{activeMilestone.keyRequirements || 'No key requirements yet.'}</span></div>
                  <div className="req-item"><span className="req-key">Completed</span><span>{activeMilestone.completedDate ? new Date(activeMilestone.completedDate).toLocaleDateString() : 'Pending'}</span></div>
                  <div className="req-item"><span className="req-key">Project</span><span>{selectedProject?.title || 'Selected project'}</span></div>
                  <div className="req-item"><span className="req-key">Submission</span><span>{activeMilestone.submissionFileName || 'No file submitted yet.'}</span></div>
                </div>

                <div className="stats-box">
                  <h4>Milestone Stats</h4>
                  <div className="stat-row">
                    <span>Completed Milestones</span>
                    <span>{completedCount}</span>
                  </div>
                  <div className="stat-row">
                    <span>Total Milestones</span>
                    <span>{milestones.length}</span>
                  </div>
                  <div className="stat-row">
                    <span>Progress</span>
                    <span>{Math.round(fillPercentage)}%</span>
                  </div>
                  <button className="btn-primary-saas stats-box-btn" onClick={openReviewModal}>
                    Review and Update
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="timeline-empty">No milestones have been created for this project yet.</div>
          )}
        </>
      ) : null}

      {showAddModal ? (
        <div className="modal-overlay">
          <div className="saas-modal">
            <div className="modal-header-saas">
              <div>
                <p className="modal-kicker-saas">Milestone Setup</p>
                <h2>Create New Milestone</h2>
              </div>
              <button className="close-btn-saas" onClick={closeModals}>&times;</button>
            </div>
            <form className="saas-form" onSubmit={saveMilestone}>
              <div className="modal-scroll-saas">
                <section className="review-section-card">
                  <div className="review-section-head">
                    <div>
                      <h3>Core Details</h3>
                      <p>Define the milestone target, due date, and core expectation in one compact block.</p>
                    </div>
                  </div>
                  <div className="review-grid">
                    <div className="form-group form-group-full">
                      <label>Milestone Title</label>
                      <input type="text" value={createForm.title} onChange={(event) => setCreateForm((current) => ({ ...current, title: event.target.value }))} required />
                    </div>
                    <div className="form-group">
                      <label>Deadline</label>
                      <input type="date" value={createForm.deadlineDate} onChange={(event) => setCreateForm((current) => ({ ...current, deadlineDate: event.target.value }))} />
                    </div>
                  </div>
                </section>

                <section className="review-section-card">
                  <div className="review-section-head">
                    <div>
                      <h3>Student Guidance</h3>
                      <p>Keep the brief readable so the work, evidence, and expectations are obvious to the team.</p>
                    </div>
                  </div>
                  <div className="review-grid">
                    <div className="form-group form-group-full">
                      <label>Description / Notes</label>
                      <textarea rows="4" value={createForm.description} onChange={(event) => setCreateForm((current) => ({ ...current, description: event.target.value }))} />
                    </div>
                    <div className="form-group form-group-full">
                      <label>Key Requirements / Deliverables</label>
                      <textarea rows="4" value={createForm.keyRequirements} onChange={(event) => setCreateForm((current) => ({ ...current, keyRequirements: event.target.value }))} />
                    </div>
                  </div>
                </section>
              </div>
              <div className="modal-footer-saas">
                <button type="button" className="btn-cancel-saas" onClick={closeModals} disabled={isSaving}>Cancel</button>
                <button type="submit" className="btn-submit-saas" disabled={isSaving}>{isSaving ? 'Saving...' : 'Save Milestone'}</button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {showReviewModal && activeMilestone ? (
        <div className="modal-overlay">
          <div className="saas-modal saas-modal-review">
            <div className="modal-header-saas">
              <div>
                <p className="modal-kicker-saas">Milestone Review</p>
                <h2>{activeMilestone.title}</h2>
                <p className="modal-subtitle-saas">Review the live milestone details, check the student submission, and update status or feedback without losing your place.</p>
              </div>
              <button className="close-btn-saas" onClick={closeModals}>&times;</button>
            </div>
            <form className="review-content" onSubmit={updateMilestoneReview}>
              <div className="modal-scroll-saas">
                <section className="review-section-card">
                  <div className="review-section-head">
                    <div>
                      <h3>Overview</h3>
                      <p>Keep the milestone metadata aligned with the latest review decision.</p>
                    </div>
                    <span className={`status-badge-lg ${statusClassName(reviewForm.status)}`}>{labelize(reviewForm.status)}</span>
                  </div>
                  <div className="review-grid">
                    <div className="form-group form-group-full">
                      <label>Milestone Title</label>
                      <input type="text" value={reviewForm.title} onChange={(event) => setReviewForm((current) => ({ ...current, title: event.target.value }))} required />
                    </div>
                    <div className="form-group">
                      <label>Deadline</label>
                      <input type="date" value={reviewForm.deadlineDate} onChange={(event) => setReviewForm((current) => ({ ...current, deadlineDate: event.target.value }))} />
                    </div>
                    <div className="form-group">
                      <label>Status</label>
                      <select value={reviewForm.status} onChange={(event) => setReviewForm((current) => ({ ...current, status: event.target.value }))}>
                        {MILESTONE_STATUSES.map((status) => <option key={status} value={status}>{labelize(status)}</option>)}
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Completed Date</label>
                      <input type="date" value={reviewForm.completedDate} onChange={(event) => setReviewForm((current) => ({ ...current, completedDate: event.target.value }))} />
                    </div>
                    <div className="review-readonly-card">
                      <span>Current Submission</span>
                      {activeMilestone.submissionFilePath ? (
                        <a href={activeMilestone.submissionFilePath} target="_blank" rel="noreferrer">{activeMilestone.submissionFileName || 'Download file'}</a>
                      ) : (
                        <strong>No submission yet</strong>
                      )}
                    </div>
                  </div>
                </section>

                <section className="review-section-card">
                  <div className="review-section-head">
                    <div>
                      <h3>Milestone Content</h3>
                      <p>Update the student-facing brief and deliverables with clear, readable language.</p>
                    </div>
                  </div>
                  <div className="review-grid">
                    <div className="form-group form-group-full">
                      <label>Description / Notes</label>
                      <textarea rows="4" value={reviewForm.description} onChange={(event) => setReviewForm((current) => ({ ...current, description: event.target.value }))} />
                    </div>
                    <div className="form-group form-group-full">
                      <label>Key Requirements / Deliverables</label>
                      <textarea rows="4" value={reviewForm.keyRequirements} onChange={(event) => setReviewForm((current) => ({ ...current, keyRequirements: event.target.value }))} />
                    </div>
                  </div>
                </section>

                <section className="review-section-card">
                  <div className="review-section-head">
                    <div>
                      <h3>Supervisor Feedback</h3>
                      <p>Record the decision and next step so the student can act without follow-up clarification.</p>
                    </div>
                  </div>
                  <div className="review-grid">
                    <div className="form-group form-group-full">
                      <label>Supervisor Feedback</label>
                      <textarea rows="5" value={reviewForm.reviewFeedback} onChange={(event) => setReviewForm((current) => ({ ...current, reviewFeedback: event.target.value }))} />
                    </div>
                  </div>
                </section>
              </div>
              <div className="modal-footer-saas">
                <button type="button" className="btn-cancel-saas" onClick={closeModals} disabled={isSaving}>Cancel</button>
                <button type="button" className="btn-cancel-saas btn-danger-saas" onClick={() => void handleDelete()} disabled={isSaving}>Delete</button>
                <button type="submit" className="btn-submit-saas" disabled={isSaving}>{isSaving ? 'Saving...' : 'Update Review'}</button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      <FeedbackToast message={toast?.message} type={toast?.type} onClose={() => setToast(null)} />
    </div>
  );
};

export default MilestoneManagement;
