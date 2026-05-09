import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { getMyProject } from '../../api/projectService';
import { getProjectTasks, updateTaskStatus } from '../../api/workflowService';
import FeedbackToast from '../../components/FeedbackToast';
import SearchBar from '../../components/SearchBar';
import { getPriorityIcon, getTaskStatusIcon } from '../../utils/statusIcons';

const styles = `
.tasks-viewport { padding: 10px 20px 40px 20px; font-family: 'Plus Jakarta Sans', sans-serif; color: #0f172a; animation: fadeIn 0.4s ease-out; text-align: left; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
.tasks-hero-header { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 26px; flex-wrap: wrap; gap: 20px; }
.hero-title { font-size: 32px; font-weight: 900; margin: 0; color: #0f172a; letter-spacing: -1px; }
.kicker { color: #4f46e5; font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 5px; }
.hero-subtitle { max-width: 760px; margin: 10px 0 0; color: #475569; font-size: 14px; font-weight: 600; line-height: 1.65; }
.stats-glass-container { display: flex; gap: 14px; flex-wrap: wrap; }
.glass-stat { background: linear-gradient(180deg, #ffffff, #f8fafc); border: 1px solid #e2e8f0; padding: 16px 22px; border-radius: 20px; display: flex; flex-direction: column; gap: 5px; min-width: 132px; box-shadow: 0 16px 32px -28px rgba(15,23,42,0.28); }
.s-label { font-size: 11px; font-weight: 800; color: #64748b; text-transform: uppercase; }
.s-value { font-size: 24px; font-weight: 900; color: #0f172a; }
.search-filter-bar { display: flex; gap: 15px; background: white; padding: 15px; border-radius: 18px; border: 1px solid #E2E8F0; margin-bottom: 24px; box-shadow: 0 14px 32px -28px rgba(15,23,42,0.28); flex-wrap: wrap; }
.search-wrapper { flex: 1; min-width: 260px; }
.search-filter-bar select { border: 1px solid #E2E8F0; border-radius: 14px; background: #F8FAFC; padding: 12px 14px; font: inherit; color: #0F172A; min-width: 200px; }
.table-card-premium { background: white; border-radius: 24px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 22px 42px -34px rgba(15,23,42,0.34); }
.premium-table { width: 100%; border-collapse: collapse; text-align: left; }
.premium-table th { padding: 18px 20px; background: #f8fafc; font-size: 12px; font-weight: 800; color: #64748b; text-transform: uppercase; border-bottom: 1px solid #e2e8f0; }
.premium-table td { padding: 18px 20px; border-bottom: 1px solid #f1f5f9; font-size: 14px; font-weight: 600; color: #1e293b; vertical-align: middle; }
.row-animated { cursor: pointer; transition: background-color 0.2s ease; }
.row-animated:hover { background-color: #f8faff !important; }
.task-cell { min-width: 300px; }
.task-cell-title { display: block; font-size: 15px; font-weight: 800; color: #0f172a; }
.task-cell-desc { display: block; margin-top: 6px; color: #64748b; font-size: 13px; font-weight: 600; line-height: 1.5; }
.task-cell-note { display: inline-flex; margin-top: 8px; color: #64748b; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 999px; padding: 4px 8px; font-size: 11px; font-weight: 800; }
.assignee-cell { min-width: 160px; }
.assignee-name { display: block; font-weight: 800; color: #0f172a; }
.assignee-note { display: block; margin-top: 4px; color: #64748b; font-size: 12px; font-weight: 700; }
.status-pill-saas, .priority-pill-saas { padding: 6px 12px; border-radius: 999px; font-size: 12px; font-weight: 700; text-transform: uppercase; display: inline-flex; }
.status-pill-saas.not_started { background: #f1f5f9; color: #475569; }
.status-pill-saas.in_progress { background: #e0e7ff; color: #3730a3; }
.status-pill-saas.blocked { background: #fff7ed; color: #c2410c; }
.status-pill-saas.completed { background: #dcfce7; color: #15803d; }
.priority-pill-saas.low { background: #eff6ff; color: #1d4ed8; }
.priority-pill-saas.medium { background: #ede9fe; color: #6d28d9; }
.priority-pill-saas.high { background: #fef3c7; color: #b45309; }
.priority-pill-saas.critical { background: #fee2e2; color: #b91c1c; }
.btn-action-update { background: white; border: 1px solid #cbd5e1; padding: 9px 14px; border-radius: 12px; font-weight: 800; font-size: 12px; cursor: pointer; transition: 0.2s; min-width: 112px; }
.btn-action-update:hover { background: #f8fafc; border-color: #4f46e5; color: #4f46e5; }
.page-state { padding: 28px; border-radius: 18px; border: 1px dashed #cbd5e1; background: #f8fafc; color: #64748b; font-weight: 700; }
.page-state.error { border-color: #fecaca; background: #fff1f2; color: #be123c; }
.empty-state-card { display: grid; gap: 10px; max-width: 620px; padding: 28px; border-radius: 22px; border: 1px solid #e2e8f0; background: linear-gradient(180deg, #ffffff, #f8fafc); box-shadow: 0 22px 42px -34px rgba(15,23,42,0.34); color: #475569; }
.empty-state-icon { width: 44px; height: 44px; border-radius: 14px; display: inline-flex; align-items: center; justify-content: center; background: #eef2ff; font-size: 22px; }
.empty-state-card h3 { margin: 0; color: #0f172a; font-size: 20px; font-weight: 900; }
.empty-state-card p { margin: 0; line-height: 1.6; font-weight: 600; }
.empty-state-card button { width: fit-content; margin-top: 8px; border: none; border-radius: 12px; background: #4f46e5; color: white; padding: 11px 15px; font: inherit; font-size: 13px; font-weight: 900; cursor: pointer; transition: transform 0.18s ease, box-shadow 0.18s ease; }
.empty-state-card button:hover { transform: translateY(-1px); box-shadow: 0 18px 30px -22px rgba(79,70,229,0.7); }
.modal-overlay { position: fixed; inset: 0; background: rgba(15, 23, 42, 0.6); backdrop-filter: blur(4px); display: flex; justify-content: center; align-items: center; z-index: 1000; animation: fadeIn 0.2s; padding: 24px; }
.task-modal-card { background: white; width: 100%; max-width: 920px; max-height: 90vh; border-radius: 28px; overflow: hidden; display: flex; flex-direction: column; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25); }
.modal-shell { display: flex; flex-direction: column; min-height: 0; height: 100%; }
.modal-header-row { position: sticky; top: 0; z-index: 2; background: rgba(255,255,255,0.98); padding: 26px 32px 18px; border-bottom: 1px solid #f1f5f9; display: flex; align-items: flex-start; justify-content: space-between; gap: 18px; }
.modal-content-scroll { overflow-y: auto; padding: 28px 32px 20px; }
.modal-close-btn { background: #f1f5f9; border: none; width: 38px; height: 38px; border-radius: 50%; cursor: pointer; font-size: 18px; color: #64748b; flex-shrink: 0; }
.modal-kicker { margin: 0 0 6px; color: #4f46e5; font-size: 11px; font-weight: 900; letter-spacing: .08em; text-transform: uppercase; }
.detail-h1 { font-size: 28px; font-weight: 900; margin: 0; color: #0f172a; }
.detail-desc { font-size: 15px; color: #475569; line-height: 1.7; margin: 0; }
.task-overview-card { background: linear-gradient(180deg, #ffffff, #f8fafc); border: 1px solid #e2e8f0; border-radius: 20px; padding: 20px; margin-bottom: 22px; }
.task-overview-card h3, .task-section h3 { margin: 0 0 12px; font-size: 15px; font-weight: 900; color: #0f172a; }
.task-overview-card p { margin: 0; color: #334155; line-height: 1.7; font-weight: 600; white-space: pre-wrap; }
.meta-strip { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 14px; margin-bottom: 22px; }
.meta-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 18px; padding: 16px; min-width: 0; }
.meta-card span { display: block; font-size: 11px; font-weight: 900; color: #94a3b8; text-transform: uppercase; margin-bottom: 6px; letter-spacing: .08em; }
.meta-card strong { font-size: 15px; color: #0f172a; display: block; line-height: 1.5; }
.task-section { display: grid; gap: 14px; }
.task-status-panel { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 20px; padding: 18px; }
.task-status-panel-header { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; margin-bottom: 14px; }
.task-status-panel-header p { margin: 6px 0 0; color: #64748b; font-size: 13px; font-weight: 600; line-height: 1.55; }
.form-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; }
.form-group { display: flex; flex-direction: column; gap: 8px; }
.form-group.full { grid-column: 1 / -1; }
.form-group label { font-size: 11px; font-weight: 900; color: #64748b; text-transform: uppercase; letter-spacing: .08em; }
.form-group select, .form-group textarea { border: 1px solid #e2e8f0; border-radius: 14px; padding: 13px 14px; font: inherit; background: white; color: #0f172a; }
.form-group textarea { min-height: 110px; resize: vertical; }
.modal-actions { display: flex; justify-content: flex-end; gap: 12px; padding: 18px 32px 24px; border-top: 1px solid #f1f5f9; background: #fff; }
.btn-secondary { background: #fff; border: 1px solid #cbd5e1; color: #334155; padding: 12px 18px; border-radius: 12px; font-weight: 800; cursor: pointer; }
.btn-primary { background: linear-gradient(135deg, #4f46e5, #4338ca); border: none; color: white; padding: 12px 18px; border-radius: 12px; font-weight: 800; cursor: pointer; min-width: 140px; box-shadow: 0 18px 30px -22px rgba(79,70,229,0.7); }
.btn-primary:disabled, .btn-secondary:disabled { opacity: .6; cursor: not-allowed; }
.empty-line { color: #94a3b8; font-style: italic; }
.muted-note { font-size: 13px; color: #64748b; font-weight: 700; }
.readonly-note { margin: 0 0 14px; padding: 12px 14px; border-radius: 14px; border: 1px solid #e2e8f0; background: white; color: #64748b; font-size: 13px; font-weight: 800; }
@media (max-width: 920px) { .meta-strip { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
@media (max-width: 760px) { .form-grid, .meta-strip { grid-template-columns: 1fr; } .modal-header-row, .modal-content-scroll, .modal-actions { padding-left: 20px; padding-right: 20px; } .premium-table th:nth-child(2), .premium-table td:nth-child(2), .premium-table th:nth-child(3), .premium-table td:nth-child(3) { display: none; } .task-cell { min-width: 220px; } }
`;

const TASK_STATUSES = ['NOT_STARTED', 'IN_PROGRESS', 'BLOCKED', 'COMPLETED'];
const statusLabel = (status) => String(status || '').replaceAll('_', ' ');
const getCurrentUserId = (user) => user?.id ?? user?.userId ?? user?.sub ?? user?.uuid ?? '';
const truncateText = (value, fallback = 'No description was added for this task yet.') => {
  const text = String(value || '').trim();
  if (!text) return fallback;
  return text.length > 120 ? `${text.slice(0, 117)}...` : text;
};

const Tasks = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [selectedTask, setSelectedTask] = useState(null);
  const [statusDraft, setStatusDraft] = useState('NOT_STARTED');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [toast, setToast] = useState(null);

  const currentUserId = getCurrentUserId(currentUser);

  const loadData = async () => {
    setIsLoading(true);
    setError('');
    try {
      const response = await getMyProject();
      const myProject = response?.data ?? null;
      if (!myProject?.id) {
        setProject(null);
        setTasks([]);
        return;
      }
      setProject(myProject);
      const workflowTasks = await getProjectTasks(myProject.id);
      setTasks(Array.isArray(workflowTasks) ? workflowTasks : []);
    } catch (err) {
      if (err?.status === 404 || err?.response?.status === 404) {
        setProject(null);
        setTasks([]);
        return;
      }
      setError(err?.response?.data?.message || err?.message || 'Unable to load project tasks.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  useEffect(() => {
    if (location.state?.searchQuery) {
      setSearchTerm(location.state.searchQuery);
    }
  }, [location.state]);

  const ownTasks = useMemo(() => (
    tasks.filter((task) => String(task.assignedToId || '') === String(currentUserId))
  ), [currentUserId, tasks]);

  const stats = useMemo(() => ({
    total: tasks.length,
    assignedToYou: ownTasks.length,
    completed: tasks.filter((task) => task.status === 'COMPLETED').length,
    overdue: tasks.filter((task) => task.overdue).length,
  }), [ownTasks, tasks]);

  const filteredTasks = useMemo(() => tasks.filter((task) => {
    const query = searchTerm.trim().toLowerCase();
    const matchesSearch = !query
      || task.title?.toLowerCase().includes(query)
      || task.description?.toLowerCase().includes(query)
      || task.assignedToName?.toLowerCase().includes(query)
      || task.priority?.toLowerCase().includes(query)
      || task.status?.toLowerCase().includes(query);
    const matchesStatus = statusFilter === 'ALL'
      || (statusFilter === 'OVERDUE' ? task.overdue : task.status === statusFilter);
    return matchesSearch && matchesStatus;
  }), [tasks, searchTerm, statusFilter]);

  const canUpdateStatus = useMemo(
    () => selectedTask?.assignedToId && String(selectedTask.assignedToId) === String(currentUserId),
    [currentUserId, selectedTask],
  );

  const openTaskModal = (task) => {
    setSelectedTask(task);
    setStatusDraft(task.status ?? 'NOT_STARTED');
  };

  const closeModal = () => {
    setSelectedTask(null);
    setStatusDraft('NOT_STARTED');
  };

  const saveStatus = async (event) => {
    event.preventDefault();
    if (!selectedTask?.id) return;
    if (!canUpdateStatus) {
      setToast({ type: 'error', message: 'Only the assigned student can update this task status.' });
      return;
    }
    setIsSaving(true);
    try {
      const updated = await updateTaskStatus(selectedTask.id, statusDraft);
      setTasks((current) => current.map((task) => (task.id === updated.id ? updated : task)));
      setSelectedTask(updated);
      setToast({ type: 'success', message: 'Task status updated successfully.' });
    } catch (err) {
      setToast({ type: 'error', message: err?.response?.data?.message || err?.message || 'Unable to update task status.' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="tasks-viewport">
      <style>{styles}</style>

      <div className="tasks-hero-header">
        <div className="title-group">
          <p className="kicker">Student Portal / Workflow</p>
          <h1 className="hero-title">Team Tasks</h1>
          <p className="hero-subtitle">
            Review your project team tasks in one place. You can update only tasks assigned directly to you.
          </p>
        </div>

        <div className="stats-glass-container">
          <div className="glass-stat">
            <span className="s-label">Team Tasks</span>
            <span className="s-value">{stats.total}</span>
          </div>
          <div className="glass-stat">
            <span className="s-label">Assigned To You</span>
            <span className="s-value">{stats.assignedToYou}</span>
          </div>
          <div className="glass-stat">
            <span className="s-label">Completed</span>
            <span className="s-value">{stats.completed}</span>
          </div>
          <div className="glass-stat">
            <span className="s-label">Overdue</span>
            <span className="s-value">{stats.overdue}</span>
          </div>
        </div>
      </div>

      <div className="search-filter-bar">
        <SearchBar className="search-wrapper" placeholder="Search by title, assignee, description, priority, or status..." value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} onClear={() => setSearchTerm('')} />
        <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
          <option value="ALL">All statuses</option>
          {TASK_STATUSES.map((status) => <option key={status} value={status}>{statusLabel(status)}</option>)}
          <option value="OVERDUE">Overdue</option>
        </select>
      </div>

      {isLoading ? <div className="page-state">Loading project tasks...</div> : null}
      {error ? <div className="page-state error">{error}</div> : null}
      {!isLoading && !error && !project ? (
        <div className="empty-state-card">
          <span className="empty-state-icon">Team</span>
          <h3>You are not part of a team yet.</h3>
          <p>Join or create a team before tasks can be assigned.</p>
          <button type="button" onClick={() => navigate('/student/my-team')}>Go to My Team</button>
        </div>
      ) : null}

      {!isLoading && !error && project ? (
        <div className="table-card-premium">
          <table className="premium-table">
            <thead>
              <tr>
                <th>Task</th>
                <th>Assignee</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Deadline</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredTasks.map((task) => {
                const isOwnTask = String(task.assignedToId || '') === String(currentUserId);

                return (
                  <tr key={task.id} className="row-animated" onClick={() => openTaskModal(task)}>
                    <td className="task-cell">
                      <span className="task-cell-title">{task.title}</span>
                      <span className="task-cell-desc">{truncateText(task.description)}</span>
                      {!isOwnTask ? <span className="task-cell-note">Read-only: assigned to another team member.</span> : null}
                    </td>
                    <td className="assignee-cell">
                      <span className="assignee-name">{task.assignedToName || 'Unassigned'}</span>
                      <span className="assignee-note">{isOwnTask ? 'Assigned to you' : 'View only'}</span>
                    </td>
                    <td><span className={`priority-pill-saas ${String(task.priority || '').toLowerCase()}`}>{getPriorityIcon(task.priority)} {statusLabel(task.priority)}</span></td>
                    <td><span className={`status-pill-saas ${String(task.status || '').toLowerCase()}`}>{getTaskStatusIcon(task.status)} {statusLabel(task.status)}</span></td>
                    <td>{task.dueDate || <span className="empty-line">No due date</span>}</td>
                    <td><button type="button" className="btn-action-update">{isOwnTask ? 'Update Status' : 'View Task'}</button></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {!filteredTasks.length ? (
            <div className="page-state" style={{ margin: 20 }}>
              {tasks.length ? 'No team tasks match the current filters.' : 'No tasks are assigned to your team yet.'}
            </div>
          ) : null}
        </div>
      ) : null}

      {selectedTask ? (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="task-modal-card" onClick={(event) => event.stopPropagation()}>
            <div className="modal-shell">
              <div className="modal-header-row">
                <div>
                  <p className="modal-kicker">Project Task</p>
                  <h2 className="detail-h1">{selectedTask.title}</h2>
                </div>
                <button type="button" className="modal-close-btn" onClick={closeModal}>x</button>
              </div>

              <div className="modal-content-scroll">
                <div className="meta-strip">
                  <div className="meta-card"><span>Created By</span><strong>{selectedTask.createdByName || 'System'}</strong></div>
                  <div className="meta-card"><span>Assignee</span><strong>{selectedTask.assignedToName || 'Unassigned'}</strong></div>
                  <div className="meta-card"><span>Priority</span><strong>{statusLabel(selectedTask.priority)}</strong></div>
                  <div className="meta-card"><span>Deadline</span><strong>{selectedTask.dueDate || 'No due date'}</strong></div>
                </div>

                <div className="task-overview-card">
                  <h3>Description</h3>
                  <p>{selectedTask.description || 'No description was added for this task yet.'}</p>
                </div>

                <div className="task-section">
                  <div className="task-status-panel">
                    <div className="task-status-panel-header">
                      <div>
                        <h3>Status Update</h3>
                        <p>
                          {canUpdateStatus
                            ? 'You can update the live workflow status for this task here.'
                            : 'This task is visible to you, but only the assigned student can change its status.'}
                        </p>
                      </div>
                    <span className={`status-pill-saas ${String(selectedTask.status || '').toLowerCase()}`}>{getTaskStatusIcon(selectedTask.status)} {statusLabel(selectedTask.status)}</span>
                    </div>

                    <form onSubmit={saveStatus}>
                      {canUpdateStatus ? (
                        <div className="form-grid">
                          <div className="form-group">
                            <label htmlFor="task-status">Current Status</label>
                            <select
                              id="task-status"
                              value={statusDraft}
                              onChange={(event) => setStatusDraft(event.target.value)}
                              disabled={isSaving}
                            >
                              {TASK_STATUSES.map((status) => <option key={status} value={status}>{statusLabel(status)}</option>)}
                            </select>
                          </div>
                          <div className="form-group">
                            <label>Overdue</label>
                            <textarea value={selectedTask.overdue ? 'This task is currently overdue and should be addressed as soon as possible.' : 'This task is still within its deadline window.'} disabled />
                          </div>
                        </div>
                      ) : (
                        <p className="readonly-note">Read-only: assigned to another team member.</p>
                      )}

                      <div className="modal-actions">
                        <button type="button" className="btn-secondary" onClick={closeModal} disabled={isSaving}>Close</button>
                        {canUpdateStatus ? (
                          <button type="submit" className="btn-primary" disabled={isSaving}>
                            {isSaving ? 'Saving...' : 'Save Status'}
                          </button>
                        ) : null}
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      <FeedbackToast message={toast?.message} type={toast?.type} onClose={() => setToast(null)} />
    </div>
  );
};

export default Tasks;
