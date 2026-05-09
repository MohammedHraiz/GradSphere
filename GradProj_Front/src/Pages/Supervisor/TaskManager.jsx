import React, { useEffect, useMemo, useState } from 'react';
import { getAssignedProjects } from '../../api/projectService';
import { createProjectTask, deleteTask, getProjectTasks, updateTask } from '../../api/workflowService';
import FeedbackToast from '../../components/FeedbackToast';
import SearchBar from '../../components/SearchBar';

const styles = `
.task-manager-container { display: flex; flex-direction: column; height: 100%; animation: fadeIn 0.4s ease-out; padding: 30px; text-align: left; font-family: 'Plus Jakarta Sans', sans-serif; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
.page-header { display: flex; justify-content: space-between; align-items: flex-end; border-bottom: 1px solid #E2E8F0; padding-bottom: 20px; margin-bottom: 25px; flex-wrap: wrap; gap: 20px; }
.subtitle { font-size: 13px; font-weight: 700; color: #4F46E5; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 5px; }
.title { font-size: 28px; font-weight: 800; color: #0F172A; letter-spacing: -0.5px; margin: 0; }
.btn-primary-saas { background: #4F46E5; color: white; border: none; padding: 12px 24px; border-radius: 12px; font-weight: 700; cursor: pointer; }
.btn-primary-saas:disabled { opacity: .6; cursor: not-allowed; }
.filter-bar { display: grid; grid-template-columns: 1.2fr repeat(3, minmax(180px, 1fr)); gap: 15px; background: white; padding: 15px; border-radius: 18px; border: 1px solid #E2E8F0; margin-bottom: 28px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.02); }
.filter-bar select { border: 1px solid #E2E8F0; border-radius: 12px; background: #F8FAFC; padding: 12px 14px; font: inherit; color: #0F172A; }
.kanban-board { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 20px; align-items: start; }
.kanban-column { background-color: #F1F5F9; padding: 18px; border-radius: 18px; border: 1px solid #E2E8F0; min-height: 380px; }
.column-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; padding-bottom: 12px; border-bottom: 2px solid #CBD5E1; }
.column-header h3 { font-size: 13px; color: #475569; text-transform: uppercase; font-weight: 900; letter-spacing: 0.5px; margin: 0; }
.task-count { background: #E2E8F0; color: #475569; font-size: 12px; font-weight: 800; padding: 2px 8px; border-radius: 12px; }
.tasks-stack { display: grid; gap: 14px; }
.task-card { background: white; padding: 18px; border: 1px solid #E2E8F0; border-radius: 14px; cursor: pointer; transition: all 0.2s ease; box-shadow: 0 1px 3px rgba(0,0,0,0.05); display: grid; gap: 12px; }
.task-card:hover { transform: translateY(-3px); box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1); border-color: #c7d2fe; }
.task-title { margin: 0; font-size: 14px; color: #1E293B; font-weight: 800; line-height: 1.4; }
.task-project { font-size: 11px; color: #4F46E5; font-weight: 700; background: #EEF2FF; display: inline-block; padding: 3px 8px; border-radius: 999px; }
.task-meta { display: flex; justify-content: space-between; gap: 12px; font-size: 12px; color: #64748B; font-weight: 700; }
.task-badges { display: flex; gap: 8px; flex-wrap: wrap; }
.badge { display: inline-flex; align-items: center; justify-content: center; border-radius: 999px; padding: 6px 10px; font-size: 11px; font-weight: 900; letter-spacing: .05em; text-transform: uppercase; }
.badge.status-not_started { background: #f1f5f9; color: #475569; }
.badge.status-in_progress { background: #e0e7ff; color: #3730a3; }
.badge.status-blocked { background: #fff7ed; color: #c2410c; }
.badge.status-completed { background: #dcfce7; color: #15803d; }
.badge.priority-low { background: #eff6ff; color: #1d4ed8; }
.badge.priority-medium { background: #ede9fe; color: #6d28d9; }
.badge.priority-high { background: #fef3c7; color: #b45309; }
.badge.priority-critical { background: #fee2e2; color: #b91c1c; }
.badge.overdue { background: #fff1f2; color: #be123c; }
.empty-card { text-align: center; padding: 24px; color: #94A3B8; font-size: 13px; font-weight: 600; }
.state { padding: 22px; border: 1px dashed #cbd5e1; border-radius: 18px; background: #f8fafc; color: #64748b; font-weight: 700; margin-bottom: 20px; }
.state.error { border-color: #fecaca; background: #fff1f2; color: #be123c; }
.modal-overlay { position: fixed; inset: 0; background: rgba(15, 23, 42, 0.6); backdrop-filter: blur(4px); display: flex; justify-content: center; align-items: center; z-index: 1000; padding: 24px; }
.saas-modal { background: white; width: 100%; max-width: 760px; max-height: 88vh; border-radius: 24px; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25); overflow: hidden; display: flex; flex-direction: column; }
.modal-header-saas { padding: 24px 28px; border-bottom: 1px solid #f1f5f9; display: flex; justify-content: space-between; align-items: center; }
.close-btn-saas { border: none; background: #f1f5f9; color: #64748b; width: 36px; height: 36px; border-radius: 999px; cursor: pointer; font-size: 18px; }
.saas-form, .detail-body { padding: 28px; display: grid; gap: 18px; overflow-y: auto; }
.form-row { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; }
.form-group { display: grid; gap: 8px; }
.form-group label { font-size: 11px; font-weight: 900; color: #64748b; text-transform: uppercase; letter-spacing: .08em; }
.form-group input, .form-group select, .form-group textarea { width: 100%; box-sizing: border-box; border: 1px solid #E2E8F0; border-radius: 12px; padding: 12px 14px; font: inherit; background: #F8FAFC; }
.form-group textarea { min-height: 120px; resize: vertical; }
.modal-footer-saas { display: flex; justify-content: flex-end; gap: 12px; padding: 20px 28px; border-top: 1px solid #f1f5f9; background: #f8fafc; }
.btn-cancel-saas { background: white; border: 1px solid #E2E8F0; color: #475569; padding: 12px 20px; border-radius: 12px; font-weight: 700; cursor: pointer; }
.btn-danger { background: #fff1f2; border: 1px solid #fecdd3; color: #be123c; padding: 12px 18px; border-radius: 12px; font-weight: 800; cursor: pointer; margin-right: auto; }
.detail-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 14px; }
.detail-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 16px; padding: 15px; }
.detail-card span { display: block; font-size: 11px; text-transform: uppercase; color: #94a3b8; font-weight: 900; margin-bottom: 6px; }
.detail-card strong { color: #0f172a; }
@media (max-width: 980px) { .filter-bar, .kanban-board, .form-row, .detail-grid { grid-template-columns: 1fr; } }
`;

const TASK_STATUSES = ['NOT_STARTED', 'IN_PROGRESS', 'BLOCKED', 'COMPLETED'];
const TASK_PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];

const emptyForm = {
  title: '',
  description: '',
  assignedToId: '',
  dueDate: '',
  priority: 'MEDIUM',
};

const columns = [
  { key: 'NOT_STARTED', label: 'Not Started' },
  { key: 'IN_PROGRESS', label: 'In Progress' },
  { key: 'BLOCKED', label: 'Blocked' },
  { key: 'COMPLETED', label: 'Completed' },
];

const labelize = (value) => String(value || '').replaceAll('_', ' ');
const memberId = (member) => member?.id ?? member?.userId ?? '';

const TaskManager = () => {
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [tasks, setTasks] = useState([]);
  const [selectedTask, setSelectedTask] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStudent, setFilterStudent] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');

  const selectedProject = useMemo(
    () => projects.find((project) => project.id === selectedProjectId) ?? null,
    [projects, selectedProjectId],
  );

  const teamMembers = selectedProject?.teamMembers ?? [];

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

  const loadTasks = async (projectId) => {
    if (!projectId) {
      setTasks([]);
      return;
    }
    try {
      const workflowTasks = await getProjectTasks(projectId);
      setTasks(workflowTasks);
    } catch (err) {
      setToast({ type: 'error', message: err?.message || 'Unable to load tasks for this project.' });
    }
  };

  useEffect(() => {
    void loadProjects();
  }, []);

  useEffect(() => {
    void loadTasks(selectedProjectId);
  }, [selectedProjectId]);

  const filteredTasks = useMemo(() => tasks.filter((task) => {
    const query = searchQuery.trim().toLowerCase();
    const matchesSearch = !query
      || task.title?.toLowerCase().includes(query)
      || task.description?.toLowerCase().includes(query)
      || task.assignedToName?.toLowerCase().includes(query);
    const matchesStudent = filterStudent === 'ALL' || task.assignedToId === filterStudent;
    const matchesStatus = filterStatus === 'ALL' || task.status === filterStatus;
    return matchesSearch && matchesStudent && matchesStatus;
  }), [tasks, searchQuery, filterStudent, filterStatus]);

  const tasksByColumn = useMemo(() => columns.map((column) => ({
    ...column,
    tasks: filteredTasks.filter((task) => task.status === column.key),
  })), [filteredTasks]);

  const openCreateModal = () => {
    setForm(emptyForm);
    setShowCreateModal(true);
  };

  const openDetailModal = (task) => {
    setSelectedTask(task);
    setForm({
      title: task.title ?? '',
      description: task.description ?? '',
      assignedToId: task.assignedToId ?? '',
      dueDate: task.dueDate ?? '',
      priority: task.priority ?? 'MEDIUM',
    });
  };

  const closeModals = () => {
    setSelectedTask(null);
    setShowCreateModal(false);
    setForm(emptyForm);
  };

  const handleSave = async (event) => {
    event.preventDefault();
    if (!selectedProjectId) return;
    setIsSaving(true);
    try {
      const payload = {
        title: form.title.trim(),
        description: form.description.trim(),
        assignedToId: form.assignedToId || null,
        dueDate: form.dueDate || null,
        priority: form.priority,
      };

      if (selectedTask?.id) {
        const updated = await updateTask(selectedTask.id, payload);
        setTasks((current) => current.map((task) => (task.id === updated.id ? updated : task)));
        setToast({ type: 'success', message: 'Task details updated successfully.' });
      } else {
        const created = await createProjectTask(selectedProjectId, payload);
        setTasks((current) => [...current, created]);
        setToast({ type: 'success', message: 'Task assigned successfully.' });
      }
      closeModals();
    } catch (err) {
      setToast({ type: 'error', message: err?.response?.data?.message || err?.message || 'Unable to save the task.' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedTask?.id) return;
    setIsSaving(true);
    try {
      await deleteTask(selectedTask.id);
      setTasks((current) => current.filter((task) => task.id !== selectedTask.id));
      setToast({ type: 'success', message: 'Task deleted successfully.' });
      closeModals();
    } catch (err) {
      setToast({ type: 'error', message: err?.response?.data?.message || err?.message || 'Unable to delete the task.' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <style>{styles}</style>
      <div className="task-manager-container">
        <div className="page-header">
          <div>
            <p className="subtitle">Supervisor / Tasks</p>
            <h1 className="title">Task Management</h1>
          </div>
          <button type="button" className="btn-primary-saas" onClick={openCreateModal} disabled={!selectedProjectId}>+ Assign Task</button>
        </div>

        <div className="filter-bar">
          <SearchBar className="search-box" placeholder="Search tasks, descriptions, or students..." value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} onClear={() => setSearchQuery('')} />
          <select value={selectedProjectId} onChange={(event) => setSelectedProjectId(event.target.value)}>
            <option value="">Select project</option>
            {projects.map((project) => <option key={project.id} value={project.id}>{project.title}</option>)}
          </select>
          <select value={filterStudent} onChange={(event) => setFilterStudent(event.target.value)}>
            <option value="ALL">All students</option>
            {teamMembers.map((member) => <option key={memberId(member)} value={memberId(member)}>{member.name}</option>)}
          </select>
          <select value={filterStatus} onChange={(event) => setFilterStatus(event.target.value)}>
            <option value="ALL">All statuses</option>
            {TASK_STATUSES.map((status) => <option key={status} value={status}>{labelize(status)}</option>)}
          </select>
        </div>

        {isLoading ? <div className="state">Loading assigned projects...</div> : null}
        {error ? <div className="state error">{error}</div> : null}
        {!isLoading && !error && !projects.length ? <div className="state">No assigned projects yet, so task management is still empty.</div> : null}

        {!isLoading && !error && projects.length ? (
          <div className="kanban-board">
            {tasksByColumn.map((column) => (
              <div key={column.key} className="kanban-column">
                <div className="column-header">
                  <h3>{column.label}</h3>
                  <span className="task-count">{column.tasks.length}</span>
                </div>
                <div className="tasks-stack">
                  {column.tasks.map((task) => (
                    <div key={task.id} className="task-card" onClick={() => openDetailModal(task)}>
                      <div>
                        <h4 className="task-title">{task.title}</h4>
                        <span className="task-project">{selectedProject?.title}</span>
                      </div>
                      <div className="task-badges">
                        <span className={`badge priority-${String(task.priority || '').toLowerCase()}`}>{labelize(task.priority)}</span>
                        {task.overdue ? <span className="badge overdue">Overdue</span> : null}
                      </div>
                      <div className="task-meta">
                        <span><strong>{task.assignedToName || 'Unassigned'}</strong></span>
                        <span>{task.dueDate || 'No due date'}</span>
                      </div>
                    </div>
                  ))}
                  {!column.tasks.length ? <div className="empty-card">No tasks in this lane.</div> : null}
                </div>
              </div>
            ))}
          </div>
        ) : null}
      </div>

      {showCreateModal ? (
        <div className="modal-overlay" onClick={closeModals}>
          <div className="saas-modal" onClick={(event) => event.stopPropagation()}>
            <div className="modal-header-saas">
              <h2>Assign New Task</h2>
              <button type="button" className="close-btn-saas" onClick={closeModals}>×</button>
            </div>
            <form className="saas-form" onSubmit={handleSave}>
              <div className="form-group">
                <label htmlFor="task-title">Task Title</label>
                <input id="task-title" value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} placeholder="Add a clear task title" required />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="task-assignee">Assign to Student</label>
                  <select id="task-assignee" value={form.assignedToId} onChange={(event) => setForm((current) => ({ ...current, assignedToId: event.target.value }))}>
                    <option value="">Unassigned</option>
                    {teamMembers.map((member) => <option key={memberId(member)} value={memberId(member)}>{member.name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="task-priority">Priority</label>
                  <select id="task-priority" value={form.priority} onChange={(event) => setForm((current) => ({ ...current, priority: event.target.value }))}>
                    {TASK_PRIORITIES.map((priority) => <option key={priority} value={priority}>{labelize(priority)}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="task-due-date">Due Date</label>
                  <input id="task-due-date" type="date" value={form.dueDate} onChange={(event) => setForm((current) => ({ ...current, dueDate: event.target.value }))} />
                </div>
              </div>
              <div className="form-group">
                <label htmlFor="task-description">Task Description & Instructions</label>
                <textarea id="task-description" value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} placeholder="Define the expected outcome, scope, and handoff details." required />
              </div>
              <div className="modal-footer-saas">
                <button type="button" className="btn-cancel-saas" onClick={closeModals} disabled={isSaving}>Cancel</button>
                <button type="submit" className="btn-primary-saas" disabled={isSaving}>{isSaving ? 'Assigning...' : 'Assign Task'}</button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {selectedTask ? (
        <div className="modal-overlay" onClick={closeModals}>
          <div className="saas-modal" onClick={(event) => event.stopPropagation()}>
            <div className="modal-header-saas">
              <h2>Task Details</h2>
              <button type="button" className="close-btn-saas" onClick={closeModals}>×</button>
            </div>
            <form onSubmit={handleSave}>
              <div className="detail-body">
                <div className="detail-grid">
                  <div className="detail-card"><span>Project</span><strong>{selectedProject?.title || 'Project'}</strong></div>
                  <div className="detail-card"><span>Assignee</span><strong>{selectedTask.assignedToName || 'Unassigned'}</strong></div>
                  <div className="detail-card"><span>Status</span><strong>{labelize(selectedTask.status)}</strong></div>
                  <div className="detail-card"><span>Priority</span><strong>{labelize(selectedTask.priority)}</strong></div>
                </div>
                <div className="form-group">
                  <label htmlFor="detail-title">Task Title</label>
                  <input id="detail-title" value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} required />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="detail-assignee">Assigned To</label>
                    <select id="detail-assignee" value={form.assignedToId} onChange={(event) => setForm((current) => ({ ...current, assignedToId: event.target.value }))}>
                      <option value="">Unassigned</option>
                      {teamMembers.map((member) => <option key={memberId(member)} value={memberId(member)}>{member.name}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label htmlFor="detail-priority">Priority</label>
                    <select id="detail-priority" value={form.priority} onChange={(event) => setForm((current) => ({ ...current, priority: event.target.value }))}>
                      {TASK_PRIORITIES.map((priority) => <option key={priority} value={priority}>{labelize(priority)}</option>)}
                    </select>
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="detail-date">Due Date</label>
                    <input id="detail-date" type="date" value={form.dueDate} onChange={(event) => setForm((current) => ({ ...current, dueDate: event.target.value }))} />
                  </div>
                </div>
                <div className="form-group">
                  <label htmlFor="detail-description">Description</label>
                  <textarea id="detail-description" value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} />
                </div>
              </div>
              <div className="modal-footer-saas">
                <button type="button" className="btn-danger" onClick={() => void handleDelete()} disabled={isSaving}>Delete</button>
                <button type="button" className="btn-cancel-saas" onClick={closeModals} disabled={isSaving}>Close</button>
                <button type="submit" className="btn-primary-saas" disabled={isSaving}>{isSaving ? 'Saving...' : 'Save Details'}</button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      <FeedbackToast message={toast?.message} type={toast?.type} onClose={() => setToast(null)} />
    </>
  );
};

export default TaskManager;
