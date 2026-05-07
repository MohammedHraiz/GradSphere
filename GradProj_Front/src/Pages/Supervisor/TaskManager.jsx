import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const styles = `
/* =========================================================
   TASK MANAGER (KANBAN) - PREMIUM SAAS EDITION
========================================================= */

.task-manager-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  animation: fadeIn 0.4s ease-out;
  padding: 30px; /* 💡 Added subtle padding for better framing */
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

/* --- 1. Page Header & Actions --- */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  border-bottom: 1px solid #E2E8F0;
  padding-bottom: 20px;
  margin-bottom: 25px;
  flex-wrap: wrap;
  gap: 20px;
}

.subtitle {
  font-size: 13px;
  font-weight: 700;
  color: #4F46E5;
  text-transform: uppercase;
  letter-spacing: 1px;
  margin-bottom: 5px;
}

.title {
  font-size: 28px;
  font-weight: 800;
  color: #0F172A;
  letter-spacing: -0.5px;
  margin: 0;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 15px;
}

.btn-primary-saas {
  background: #4F46E5;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
  transition: 0.2s ease;
  box-shadow: 0 4px 6px -1px rgba(79, 70, 229, 0.2);
}

.btn-primary-saas:hover {
  background: #4338CA;
  transform: translateY(-2px);
  box-shadow: 0 6px 10px -1px rgba(79, 70, 229, 0.3);
}

/* 💡 NEW: Unified Filter Bar (Matches Image & Projects Page) */
.filter-bar-saas-unified {
  display: flex; gap: 15px; background: white; padding: 15px; border-radius: 12px; border: 1px solid #E2E8F0;
  margin-bottom: 30px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.02); flex-wrap: wrap; align-items: center;
}

.search-wrapper-saas {
  position: relative;
  display: flex;
  align-items: center;
}

.search-input-saas {
  padding: 11px 15px 11px 40px;
  border: 1px solid #E2E8F0;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  outline: none;
  transition: 0.2s;
  font-family: inherit;
  color: #0F172A;
  background-color: #F8FAFC;
}

.search-input-saas:focus {
  border-color: #4F46E5;
  background-color: white;
  box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
}

.search-icon-saas {
  position: absolute;
  left: 15px;
  color: #94A3B8;
  font-size: 16px;
}

.saas-select-unified {
  padding: 11px 15px; border: 1px solid #E2E8F0; border-radius: 8px; font-size: 13px; font-weight: 600;
  outline: none; background-color: #F8FAFC; color: #475569; cursor: pointer; transition: 0.2s; font-family: inherit;
}

.saas-select-unified:focus {
  border-color: #4F46E5;
  background-color: white;
}

/* --- Old Filter Dropdown (Kept for CSS safety, unused in UI) --- */
.filter-wrapper { position: relative; }
.filter-btn-saas { background: white; border: 1px solid #CBD5E1; color: #475569; padding: 11px 20px; border-radius: 8px; font-weight: 600; font-size: 14px; cursor: pointer; transition: 0.2s ease; display: flex; align-items: center; gap: 8px; }
.filter-btn-saas:hover { background: #F8FAFC; border-color: #94A3B8; }
.filter-dropdown { position: absolute; top: calc(100% + 10px); right: 0; width: 280px; background: white; border: 1px solid #E2E8F0; border-radius: 12px; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1); padding: 20px; z-index: 1000; animation: dropdownFade 0.2s ease-out forwards; transform-origin: top right; }
@keyframes dropdownFade { from { opacity: 0; transform: scale(0.95) translateY(-10px); } to { opacity: 1; transform: scale(1) translateY(0); } }
.filter-section { display: flex; flex-direction: column; gap: 8px; margin-bottom: 15px; }
.filter-section span { font-size: 11px; font-weight: 700; color: #64748B; text-transform: uppercase; }
.filter-section select { padding: 10px; border-radius: 6px; border: 1px solid #E2E8F0; font-size: 13px; font-weight: 600; outline: none; background-color: #F8FAFC; transition: 0.2s; color: #0F172A; }
.filter-section select:focus { border-color: #4F46E5; background-color: white; }
.filter-footer { display: flex; justify-content: space-between; align-items: center; margin-top: 20px; padding-top: 15px; border-top: 1px solid #F1F5F9; }
.clear-link { background: none; border: none; color: #EF4444; font-size: 13px; font-weight: 600; cursor: pointer; transition: 0.2s; }
.clear-link:hover { text-decoration: underline; }
.apply-btn { background: #0F172A; color: white; border: none; padding: 8px 16px; border-radius: 6px; font-size: 13px; font-weight: 600; cursor: pointer; transition: 0.2s; }
.apply-btn:hover { background: #334155; }

/* --- 2. Kanban Board (The Core) --- */
.kanban-board {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 25px;
  align-items: start;
  min-height: 60vh;
}

.kanban-column {
  background-color: #F1F5F9; 
  padding: 20px;
  border-radius: 12px;
  border: 1px solid #E2E8F0;
  display: flex;
  flex-direction: column;
  min-height: 400px;
}

.column-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 12px;
  border-bottom: 2px solid #CBD5E1;
}

.column-header h3 {
  font-size: 13px;
  color: #475569;
  text-transform: uppercase;
  font-weight: 900;
  letter-spacing: 0.5px;
  margin: 0;
}

.task-count {
  background: #E2E8F0;
  color: #475569;
  font-size: 12px;
  font-weight: 800;
  padding: 2px 8px;
  border-radius: 12px;
}

.tasks-stack {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

/* --- 3. Task Cards (Jira Style) --- */
.task-card {
  background: white;
  padding: 18px;
  border: 1px solid #E2E8F0;
  border-radius: 8px;
  cursor: pointer;
  position: relative;
  transition: all 0.2s ease;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
  border-left: 4px solid transparent; 
}

.task-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1);
  border-color: #CBD5E1;
}

.task-card:active { transform: scale(0.98); }

.task-card.priority-high { border-left-color: #EF4444; }
.task-card.priority-medium { border-left-color: #F59E0B; }
.task-card.priority-low { border-left-color: #10B981; }

.task-title {
  margin: 0 0 8px 0;
  font-size: 14px;
  color: #1E293B;
  font-weight: 800;
  line-height: 1.4;
}

.task-project {
  font-size: 11px;
  color: #4F46E5;
  font-weight: 700;
  background: #EEF2FF;
  display: inline-block;
  padding: 2px 6px;
  border-radius: 4px;
  margin-bottom: 12px;
}

.task-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
}

/* 💡 NEW: Clickable Task Assignee Pill */
.task-assignee-clickable {
  display: flex; align-items: center; gap: 6px; color: #64748B; font-weight: 700;
  background: #F8FAFC; padding: 4px 10px 4px 4px; border-radius: 20px; border: 1px solid transparent; 
  cursor: pointer; transition: 0.2s;
}
.task-assignee-clickable:hover {
  background: white; border-color: #4F46E5; color: #4F46E5; box-shadow: 0 4px 6px rgba(79,70,229,0.1); transform: translateY(-2px);
}
.task-assignee-clickable .assignee-name { transition: 0.2s; }

.avatar-micro {
  width: 24px;
  height: 24px;
  background: #4F46E5;
  color: white;
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 10px;
  font-weight: 900;
}

.task-due {
  display: flex;
  align-items: center;
  gap: 4px;
  color: #94A3B8;
  font-weight: 600;
}
.task-due.overdue { color: #EF4444; font-weight: 800; }
.btn-cancel-saas:hover { background: #F8FAFC; border-color: #CBD5E1;}
.btn-submit-saas { background: #4F46E5; color: white; border: none; padding: 12px 24px; border-radius: 12px; font-weight: 800; cursor: pointer; transition: 0.2s; box-shadow: 0 4px 10px rgba(79,70,229,0.2); }
.btn-submit-saas:hover { background: #4338CA; transform: translateY(-2px); }

/* 💡 NEW: Advanced Task Detail Cards (Matches Uploaded Image) */
.td-card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  position: relative;
  transition: 0.2s;
}
.td-card.clickable:hover {
  border-color: #4F46E5;
  box-shadow: 0 4px 12px rgba(79, 70, 229, 0.08);
  transform: translateY(-2px);
  cursor: pointer;
}
.td-card-label {
  font-size: 11px;
  font-weight: 800;
  color: #64748B;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
.td-card-value {
  font-size: 16px;
  font-weight: 700;
  color: #0F172A;
}
.td-card-value.primary {
  color: #4F46E5;
  font-size: 20px;
}
.td-input-seamless {
  border: 1px solid transparent;
  background: transparent;
  font-size: 15px;
  font-weight: 700;
  color: #0F172A;
  padding: 4px 8px;
  margin-left: -8px;
  border-radius: 6px;
  width: calc(100% + 16px);
  font-family: inherit;
  transition: 0.2s;
}
.td-input-seamless:hover { background: #F8FAFC; border-color: #E2E8F0; }
.td-input-seamless:focus { background: #FFFFFF; border-color: #4F46E5; outline: none; box-shadow: 0 0 0 3px rgba(79,70,229,0.1); }
.td-textarea-seamless {
  width: calc(100% + 16px);
  min-height: 60px;
  resize: vertical;
  font-weight: 500;
  color: #475569;
  line-height: 1.5;
}
.btn-complete-task {
  background: #10B981;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 8px;
  font-weight: 700;
  font-size: 14px;
  cursor: pointer;
  transition: 0.2s;
  display: flex;
  align-items: center;
  gap: 8px;
  box-shadow: 0 4px 6px rgba(16, 185, 129, 0.2);
}
.btn-complete-task:hover { background: #059669; transform: translateY(-1px); box-shadow: 0 6px 10px rgba(16, 185, 129, 0.3); }
`;

const TaskManager = () => {
  const location = useLocation();
  const navigate = useNavigate(); // 💡 أضفنا useNavigate للتنقل لصفحة الطلاب

  const [showModal, setShowModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);

  // حالات الفلترة والبحث
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStudent, setFilterStudent] = useState('All Students');
  const [filterPriority, setFilterPriority] = useState('All Priorities');
  const [filterProject, setFilterProject] = useState('All Projects');

  // Auto-Search Logic
  useEffect(() => {
    if (location.state && location.state.targetProject) {
      setSearchQuery(location.state.targetProject);
    }
    if (location.state && location.state.targetStudent) {
      setSearchQuery(location.state.targetStudent);
    }
  }, [location]);

  const initialColumns = [
    {
      title: 'TO DO',
      tasks: [
        { id: 1, title: 'Design Database Schema', student: 'Ali M.', project: 'Smart Campus', due: 'Mar 15', priority: 'High', overdue: true, desc: 'Create the ERD for the IoT sensors database.' },
        { id: 2, title: 'Setup Node.js Server', student: 'Sara A.', project: 'Smart Campus', due: 'Mar 20', priority: 'Medium', overdue: false, desc: 'Initialize the Express server and connect it to MongoDB.' },
        { id: 3, title: 'Write Project Proposal', student: 'Omar K.', project: 'AI Chatbot', due: 'Mar 25', priority: 'Low', overdue: false, desc: 'Draft the initial IEEE proposal for the AI project.' },
      ]
    },
    {
      title: 'IN PROGRESS',
      tasks: [
        { id: 4, title: 'Implement Login API', student: 'Ali M.', project: 'Smart Campus', due: 'Mar 18', priority: 'High', overdue: false, desc: 'Setup JWT authentication and secure the main endpoints.' },
        { id: 5, title: 'Create UI Wireframes', student: 'Mona Z.', project: 'AI Chatbot', due: 'Mar 19', priority: 'Medium', overdue: false, desc: 'Design Figma screens for the chatbot interface.' },
      ]
    },
    {
      title: 'DONE',
      tasks: [
        { id: 6, title: 'Project Initiation Meeting', student: 'Ali M.', project: 'Smart Campus', due: 'Mar 01', priority: 'High', overdue: false, desc: 'Kickoff meeting with all stakeholders.' },
        { id: 7, title: 'Requirement Gathering', student: 'Huda Y.', project: 'Voting System', due: 'Mar 10', priority: 'Low', overdue: false, desc: 'Gather all functional and non-functional requirements.' },
      ]
    }
  ];

  // تطبيق نظام الفلترة
  const filteredColumns = initialColumns.map(col => {
    const filteredTasks = col.tasks.filter(task => {
      const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            task.student.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            task.project.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStudent = filterStudent === 'All Students' || task.student === filterStudent;
      const matchesPriority = filterPriority === 'All Priorities' || task.priority === filterPriority;
      const matchesProject = filterProject === 'All Projects' || task.project === filterProject;

      return matchesSearch && matchesStudent && matchesPriority && matchesProject;
    });

    return { ...col, tasks: filteredTasks };
  });

  return (
    <>
      <style>{styles}</style>
      <div className="task-manager-container">
        
        {/* --- 1. Page Header --- */}
        <div className="page-header">
          <div>
            <p className="subtitle">Supervisor / Tasks</p>
            <h1 className="title">Task Management (Kanban)</h1>
          </div>
          
          <div className="header-actions">
            <button className="btn-primary-saas" onClick={() => setShowModal(true)}>
              + Assign Task
            </button>
          </div>
        </div>

        {/* --- 2. 💡 Unified Search & Filter Bar (Matched with image_27da8a.png) --- */}
        <div className="filter-bar-saas-unified">
          
          <div className="search-wrapper-saas" style={{ flexGrow: 1 }}>
            <span className="search-icon-saas">🔍</span>
            <input 
              type="text" 
              className="search-input-saas" 
              style={{ width: '100%', boxSizing: 'border-box' }}
              placeholder="Search tasks, projects, or students..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} style={{position:'absolute', right:'15px', background:'none', border:'none', color:'#EF4444', fontWeight: '800', cursor:'pointer'}}>✕</button>
            )}
          </div>

          <select className="saas-select-unified" value={filterProject} onChange={(e) => setFilterProject(e.target.value)}>
            <option value="All Projects">All Projects</option>
            <option value="Smart Campus">Smart Campus</option>
            <option value="AI Chatbot">AI Chatbot</option>
            <option value="Voting System">Voting System</option>
          </select>

          <select className="saas-select-unified" value={filterStudent} onChange={(e) => setFilterStudent(e.target.value)}>
            <option value="All Students">All Students</option>
            <option value="Ali M.">Ali M.</option>
            <option value="Sara A.">Sara A.</option>
            <option value="Omar K.">Omar K.</option>
            <option value="Mona Z.">Mona Z.</option>
            <option value="Huda Y.">Huda Y.</option>
          </select>

          <select className="saas-select-unified" value={filterPriority} onChange={(e) => setFilterPriority(e.target.value)}>
            <option value="All Priorities">All Priorities</option>
            <option value="High">🔴 High Priority</option>
            <option value="Medium">🟡 Medium Priority</option>
            <option value="Low">🟢 Low Priority</option>
          </select>
        </div>

        {/* --- 3. Kanban Board --- */}
        <div className="kanban-board">
          {filteredColumns.map((col, idx) => (
            <div key={idx} className="kanban-column">
              <div className="column-header">
                <h3>{col.title}</h3>
                <span className="task-count">{col.tasks.length}</span>
              </div>
              
              <div className="tasks-stack">
                {col.tasks.map(task => (
                  <div 
                    key={task.id} 
                    className={`task-card priority-${task.priority.toLowerCase()}`}
                    onClick={() => setSelectedTask(task)} /* 💡 يفتح المودال فقط إذا لم ننقر على الطالب */
                  >
                    <h4 className="task-title">{task.title}</h4>
                    <span className="task-project">{task.project}</span>
                    <div className="task-meta">
                      
                      {/* 💡 الطالب كزر تفاعلي يوجه לصفحة الطلاب (بدون فتح المودال) */}
                      <div 
                        className="task-assignee-clickable"
                        onClick={(e) => {
                          e.stopPropagation(); // منع النقر من الوصول لـ task-card وفتح המودال
                          navigate('/supervisor/students', { state: { targetStudent: task.student } });
                        }}
                        title={`View ${task.student}'s Profile`}
                      >
                        <div className="avatar-micro" style={{background: task.priority === 'High' ? '#EF4444' : task.priority === 'Medium' ? '#F59E0B' : '#10B981'}}>
                          {task.student.charAt(0)}
                        </div>
                        <span className="assignee-name">{task.student}</span>
                      </div>

                      <div className={`task-due ${task.overdue ? 'overdue' : ''}`}>
                        <span>📅</span> {task.due}
                      </div>
                    </div>
                  </div>
                ))}
                {col.tasks.length === 0 && (
                  <div style={{textAlign: 'center', padding: '20px', color: '#94A3B8', fontSize: '13px', fontWeight: '600'}}>No tasks found.</div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* ========================================================= */}
        {/* 4. نافذة إضافة مهمة (Create Task Modal) */}
        {/* ========================================================= */}
        {showModal && (
          <div className="modal-overlay" onClick={() => setShowModal(false)}>
            <div className="saas-modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header-saas">
                <h2>Assign New Task</h2>
                <button className="close-btn-saas" onClick={() => setShowModal(false)}>&times;</button>
              </div>

              <form className="saas-form" onSubmit={(e) => { e.preventDefault(); setShowModal(false); alert('Task Assigned Successfully!'); }}>
                <div className="form-group">
                  <label>Task Title</label>
                  <input type="text" placeholder="e.g., Implement Login Authentication" required />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Project</label>
                    <select required>
                      <option>Smart Campus</option>
                      <option>AI Chatbot</option>
                      <option>Voting System</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Assign to Student</label>
                    <select required>
                      <option>Ali M.</option>
                      <option>Sara A.</option>
                      <option>Omar K.</option>
                    </select>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Priority</label>
                    <select>
                      <option value="High">🔴 High Priority</option>
                      <option value="Medium">🟡 Medium Priority</option>
                      <option value="Low">🟢 Low Priority</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Due Date</label>
                    <input type="date" required />
                  </div>
                </div>

                <div className="form-group">
                  <label>Task Description & Instructions</label>
                  <textarea placeholder="Describe the task requirements, acceptance criteria..." required></textarea>
                </div>

                <div className="modal-footer-saas">
                  <button type="button" className="btn-cancel-saas" onClick={() => setShowModal(false)}>Cancel</button>
                  <button type="submit" className="btn-primary-saas">🚀 Create Task</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* 5. نافذة تفاصيل المهمة (View/Edit Task Modal) */}
        {/* ========================================================= */}
        {selectedTask && (
          <div className="modal-overlay" onClick={() => setSelectedTask(null)}>
            <div className="saas-modal" onClick={(e) => e.stopPropagation()} style={{maxWidth: '700px', padding: '30px 40px', backgroundColor: '#F8FAFC'}}>
              
              <div className="modal-header-saas" style={{borderBottom: 'none', marginBottom: '15px', paddingBottom: '0'}}>
                <h2 style={{fontSize: '22px'}}>Task Details</h2>
                <button className="close-btn-saas" onClick={() => setSelectedTask(null)}>✕</button>
              </div>
              
              <div style={{height: '1px', background: '#E2E8F0', margin: '0 -40px 25px -40px'}}></div>

              <div style={{display: 'flex', flexDirection: 'column', gap: '20px'}}>
                
                {/* 💡 Task Title (Editable) */}
                <div className="td-card">
                  <span className="td-card-label">Task Title</span>
                  <input 
                    type="text"
                    className="td-input-seamless td-card-value primary"
                    value={selectedTask.title}
                    onChange={(e) => setSelectedTask({...selectedTask, title: e.target.value})}
                  />
                </div>

                <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px'}}>
                  
                  {/* 💡 Assigned To (Clickable -> Students) */}
                  <div className="td-card clickable" onClick={() => navigate('/supervisor/students', { state: { targetStudent: selectedTask.student } })} title="View Student Profile">
                    <span className="td-card-label">Assigned To</span>
                    <div style={{display: 'flex', alignItems:'center', gap: '10px', marginTop: '6px'}}>
                      <div className="avatar-micro" style={{background: '#0F172A', width: '28px', height: '28px', fontSize: '12px'}}>{selectedTask.student.charAt(0)}</div>
                      <span className="td-card-value">{selectedTask.student}</span>
                    </div>
                  </div>

                  {/* 💡 Project (Clickable -> Projects) */}
                  <div className="td-card clickable" onClick={() => navigate('/supervisor/projects', { state: { targetProject: selectedTask.project } })} title="View Project Details">
                    <span className="td-card-label">Project</span>
                    <div className="td-card-value" style={{marginTop: '10px'}}>{selectedTask.project}</div>
                  </div>

                  {/* 💡 Priority (Editable) */}
                  <div className="td-card">
                    <span className="td-card-label">Priority</span>
                    <div style={{display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px'}}>
                      <div style={{
                        width: '16px', height: '16px', borderRadius: '50%', border: '2px solid #1E293B',
                        background: selectedTask.priority === 'High' ? '#EF4444' : selectedTask.priority === 'Medium' ? '#F59E0B' : '#10B981'
                      }}></div>
                      <select 
                        className="td-input-seamless" 
                        value={selectedTask.priority}
                        onChange={(e) => setSelectedTask({...selectedTask, priority: e.target.value})}
                        style={{padding: '4px', marginLeft: 0}}
                      >
                        <option value="High">High</option>
                        <option value="Medium">Medium</option>
                        <option value="Low">Low</option>
                      </select>
                    </div>
                  </div>

                  {/* 💡 Due Date (Editable) */}
                  <div className="td-card">
                    <span className="td-card-label">Due Date</span>
                    <input 
                      type="text" 
                      className="td-input-seamless"
                      value={selectedTask.due}
                      onChange={(e) => setSelectedTask({...selectedTask, due: e.target.value})}
                      style={{marginTop: '6px'}}
                    />
                  </div>

                </div>

                {/* 💡 Description (Editable) */}
                <div className="td-card">
                  <span className="td-card-label">Description</span>
                  <textarea 
                    className="td-input-seamless td-textarea-seamless"
                    value={selectedTask.desc}
                    onChange={(e) => setSelectedTask({...selectedTask, desc: e.target.value})}
                  />
                </div>

              </div>

              <div style={{height: '1px', background: '#E2E8F0', margin: '30px -40px 20px -40px'}}></div>

              <div className="modal-footer-saas" style={{borderTop: 'none', margin: 0, padding: 0}}>
                <button className="btn-cancel-saas" onClick={() => setSelectedTask(null)} style={{borderRadius: '8px', padding: '10px 20px', background: 'white'}}>Close</button>
                <button className="btn-complete-task" onClick={() => { setSelectedTask(null); alert('Task marked as Completed!'); }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                  Mark as Completed
                </button>
              </div>

            </div>
          </div>
        )}

      </div>
    </>
  );
};

export default TaskManager;