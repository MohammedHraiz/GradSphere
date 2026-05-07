import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

const styles = `
.tasks-viewport {
  padding: 10px 20px 40px 20px;
  font-family: 'Plus Jakarta Sans', sans-serif;
  color: #0f172a;
  animation: fadeIn 0.4s ease-out;
  text-align: left;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

/* --- Hero Header & Stats --- */
.tasks-hero-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-bottom: 30px;
  flex-wrap: wrap;
  gap: 20px;
}

.hero-title { font-size: 32px; font-weight: 900; margin: 0; color: #0f172a; letter-spacing: -1px; }
.kicker { color: #4f46e5; font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 5px; }

.stats-glass-container { display: flex; gap: 15px; }
.glass-stat {
  background: white; border: 1px solid #e2e8f0; padding: 15px 25px; border-radius: 20px;
  display: flex; flex-direction: column; gap: 5px; cursor: pointer; transition: 0.3s;
  box-shadow: 0 4px 6px -1px rgba(0,0,0,0.02);
}
.glass-stat:hover { transform: translateY(-3px); border-color: #4f46e5; box-shadow: 0 10px 15px -3px rgba(79, 70, 229, 0.1); }
.glass-stat.active { background: #4f46e5; border-color: #4f46e5; }
.glass-stat.active .s-label, .glass-stat.active .s-value { color: white; }

.s-label { font-size: 11px; font-weight: 800; color: #64748b; text-transform: uppercase; }
.s-value { font-size: 24px; font-weight: 900; color: #0f172a; }

/* --- Search Bar --- */
.search-filter-bar {
  display: flex; gap: 15px; background: white; padding: 15px; border-radius: 16px; border: 1px solid #E2E8F0;
  margin-bottom: 25px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.02);
}
.search-wrapper {
  flex: 1; display: flex; align-items: center; background: #F8FAFC; border: 1px solid #E2E8F0;
  border-radius: 10px; padding: 0 15px; position: relative;
}
.search-wrapper input {
  width: 100%; padding: 12px 10px; border: none; background: transparent; outline: none;
  font-size: 14px; font-weight: 600; font-family: inherit;
}

/* --- Table Styles --- */
.table-card-premium { background: white; border-radius: 24px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.02); }
.premium-table { width: 100%; border-collapse: collapse; text-align: left; }
.premium-table th { padding: 20px; background: #f8fafc; font-size: 12px; font-weight: 800; color: #64748b; text-transform: uppercase; border-bottom: 1px solid #e2e8f0; }
.premium-table td { padding: 20px; border-bottom: 1px solid #f1f5f9; font-size: 14px; font-weight: 600; color: #1e293b; vertical-align: middle; }

.row-animated { cursor: pointer; transition: 0.2s; }
.row-animated:hover { background-color: #f5f3ff !important; }
.row-animated:hover .task-name-main { color: #4f46e5; }

.prio-badge-sq { padding: 4px 10px; border-radius: 6px; font-size: 11px; font-weight: 800; text-transform: uppercase; }
.prio-badge-sq.high { background: #fee2e2; color: #ef4444; }
.prio-badge-sq.medium { background: #fef3c7; color: #d97706; }
.prio-badge-sq.low { background: #d1fae5; color: #059669; }

.status-pill-saas { padding: 6px 12px; border-radius: 20px; font-size: 12px; font-weight: 700; }
.status-pill-saas.done { background: #d1fae5; color: #059669; }
.status-pill-saas.inprogress { background: #e0e7ff; color: #4f46e5; }
.status-pill-saas.todo { background: #f1f5f9; color: #64748b; }

.btn-action-update { background: white; border: 1px solid #cbd5e1; padding: 8px 16px; border-radius: 10px; font-weight: 700; font-size: 12px; cursor: pointer; transition: 0.2s; }
.btn-action-update:hover { background: #f8fafc; border-color: #4f46e5; color: #4f46e5; }

/* --- 💡 Task Modal (Pop-up Card) --- */
.modal-overlay {
  position: fixed; inset: 0; background: rgba(15, 23, 42, 0.6); backdrop-filter: blur(4px);
  display: flex; justify-content: center; align-items: center; z-index: 1000; animation: fadeIn 0.2s;
}
.task-modal-card {
  background: white; width: 90%; max-width: 900px; max-height: 90vh; border-radius: 28px;
  position: relative;
  overflow: hidden; display: flex; flex-direction: column; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25);
  animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}
@keyframes slideUp { from { transform: translateY(30px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }

.modal-content-scroll { overflow-y: auto; padding: 40px; }

/* 💡 Close Button Position Fixed to Header */
.modal-close-btn { position: absolute; top: 20px; right: 25px; background: #f1f5f9; border: none; width: 36px; height: 36px; border-radius: 50%; cursor: pointer; font-size: 18px; color: #64748b; transition: 0.2s; z-index: 1001; display: flex; align-items: center; justify-content: center;}
.modal-close-btn:hover { background: #fee2e2; color: #ef4444; transform: rotate(90deg); }

.main-details-card { text-align: left; }
.category-tag { background: #f1f5f9; color: #64748b; padding: 4px 10px; border-radius: 6px; font-size: 11px; font-weight: 800; text-transform: uppercase; }
.detail-h1 { font-size: 28px; font-weight: 900; margin: 15px 0; color: #0f172a; }
.detail-desc { font-size: 15px; color: #475569; line-height: 1.6; margin-bottom: 30px; }
.section-divider { height: 1px; background: #e2e8f0; margin: 30px 0; }

.file-pill { display: flex; align-items: center; gap: 15px; background: #f8fafc; padding: 12px 18px; border-radius: 12px; border: 1px solid #e2e8f0; margin-bottom: 10px;}
.f-icon-red { background: #fee2e2; color: #ef4444; padding: 8px; border-radius: 8px; font-size: 10px; font-weight: 900;}
.f-name { font-weight: 700; font-size: 14px; color: #1e293b; display: block;}
.f-size { font-size: 11px; color: #94a3b8; font-weight: 600;}

/* 💡 NEW: Delete File Button */
.btn-delete-file { background: none; border: none; color: #cbd5e1; cursor: pointer; transition: 0.2s; font-size: 14px; padding: 5px; }
.btn-delete-file:hover { color: #ef4444; transform: scale(1.1); }

/* Comments Area */
.comment-v-bubble { display: flex; gap: 15px; margin-bottom: 20px; }
.c-avatar-box { width: 35px; height: 35px; background: #4f46e5; color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 14px; flex-shrink: 0; }
.c-content-box { background: #f8fafc; padding: 15px; border-radius: 16px; border: 1px solid #e2e8f0; flex-grow: 1; transition: 0.2s;}
.c-content-box:hover { border-color: #cbd5e1; background: white; }
.c-top { display: flex; justify-content: space-between; margin-bottom: 5px; }
.c-user { font-weight: 800; font-size: 13px; color: #0f172a; }
.c-date { font-size: 11px; color: #94a3b8; font-weight: 600; }
.c-text-val { font-size: 14px; color: #475569; margin: 0; line-height: 1.5; }

/* 💡 NEW: Comment Actions */
.c-actions-row { display: flex; gap: 12px; margin-top: 8px; opacity: 0; transition: 0.2s; }
.c-content-box:hover .c-actions-row { opacity: 1; }
.btn-c-action { background: none; border: none; font-size: 11px; font-weight: 800; cursor: pointer; color: #4f46e5; padding: 0; }
.btn-c-action.danger { color: #ef4444; }
.btn-c-action:hover { text-decoration: underline; }

.comment-input-area { display: flex; gap: 10px; margin-top: 25px; padding: 15px; background: white; border: 1px solid #e2e8f0; border-radius: 14px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
.comment-input-area input { flex: 1; border: none; outline: none; font-size: 14px; font-family: inherit; }
.btn-submit-comment { background: #0f172a; color: white; border: none; padding: 8px 24px; border-radius: 8px; font-weight: 800; cursor: pointer; transition: 0.2s; }
.btn-submit-comment:hover { background: #4f46e5; transform: translateY(-1px); }
`;

const Tasks = () => {
  const location = useLocation();
  const [selectedTask, setSelectedTask] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState(null); 
  const [commentText, setCommentText] = useState("");
  const [editingCommentId, setEditingCommentId] = useState(null);
  const fileInputRef = useRef(null);

  const [tasks, setTasks] = useState([
    { 
      id: 1, title: "System Architecture Design", priority: "High", status: "Done", dueDate: "Apr 10, 2026", category: "Documentation",
      description: "Define the overall structure of the system, including backend services, frontend components, and database relations.",
      assignedTo: "Ali Mansour",
      files: [{ id: 501, name: "cloud computing (updated).pdf", size: "17.5 MB" }],
      comments: [{ id: 101, author: "Dr. Ahmad", text: "Please review the security layers.", date: "2 days ago" }]
    },
    { 
      id: 2, title: "Frontend Development - Phase 1", priority: "Medium", status: "In Progress", dueDate: "Apr 25, 2026", category: "Development",
      description: "Develop the core student dashboard layouts using React and Tailwind CSS.",
      assignedTo: "Sara Ahmed", files: [], comments: []
    },
    { 
      id: 3, title: "Database Schema Design", priority: "High", status: "To Do", dueDate: "May 02, 2026", category: "Database",
      description: "Design the database schema for the graduation project portal.",
      assignedTo: "Ali Mansour", files: [], comments: []
    }
  ]);

  // 💡 Auto-Search Logic
  useEffect(() => {
    if (location.state && location.state.searchQuery) {
      setSearchTerm(location.state.searchQuery);
    }
  }, [location]);

  // --- Handlers ---
  const toggleQuickStatus = (id, e) => {
    e.stopPropagation();
    setTasks(prev => prev.map(t => {
      if (t.id === id) {
        const statuses = ["To Do", "In Progress", "Done"];
        const currentIndex = statuses.indexOf(t.status);
        return { ...t, status: statuses[(currentIndex + 1) % statuses.length] };
      }
      return t;
    }));
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file && selectedTask) {
      const newFile = { id: Date.now(), name: file.name, size: (file.size / (1024 * 1024)).toFixed(1) + " MB" };
      const updated = { ...selectedTask, files: [...selectedTask.files, newFile] };
      updateTaskGlobalState(updated);
    }
  };

  // 💡 NEW: Delete File Handler
  const deleteFile = (fileId, e) => {
    e.stopPropagation();
    const filteredFiles = selectedTask.files.filter(f => f.id !== fileId);
    const updated = { ...selectedTask, files: filteredFiles };
    updateTaskGlobalState(updated);
  };

  // 💡 Updated: Submit Comment (Supports Edit)
  const submitComment = () => {
    if (!commentText.trim()) return;
    
    let updatedComments;
    if (editingCommentId) {
      updatedComments = selectedTask.comments.map(c => 
        c.id === editingCommentId ? { ...c, text: commentText } : c
      );
      setEditingCommentId(null);
    } else {
      const newComment = { id: Date.now(), author: "Me", text: commentText, date: "Just now" };
      updatedComments = [...selectedTask.comments, newComment];
    }

    const updated = { ...selectedTask, comments: updatedComments };
    updateTaskGlobalState(updated);
    setCommentText("");
  };

  // 💡 NEW: Delete Comment Handler
  const deleteComment = (commentId) => {
    const filtered = selectedTask.comments.filter(c => c.id !== commentId);
    const updated = { ...selectedTask, comments: filtered };
    updateTaskGlobalState(updated);
  };

  const updateTaskGlobalState = (updatedTask) => {
    setSelectedTask(updatedTask);
    setTasks(prev => prev.map(t => t.id === updatedTask.id ? updatedTask : t));
  };

  // Filtering Logic
  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase()) || task.category.toLowerCase().includes(searchTerm.toLowerCase());
    if (statusFilter === 'Done') return matchesSearch && task.status === 'Done';
    if (statusFilter === 'Pending') return matchesSearch && task.status !== 'Done';
    return matchesSearch;
  });

  return (
    <div className="tasks-viewport">
      <style>{styles}</style>
      
      {/* --- Header --- */}
      <div className="tasks-hero-header">
        <div className="title-group">
          <p className="kicker">Student Portal / Workflow</p>
          <h1 className="hero-title">Project Tasks</h1>
        </div>
        
        <div className="stats-glass-container">
          <div 
            className={`glass-stat ${statusFilter === 'Pending' ? 'active' : ''}`}
            onClick={() => setStatusFilter(statusFilter === 'Pending' ? null : 'Pending')}
          >
            <span className="s-label">Pending</span>
            <span className="s-value">{tasks.filter(t => t.status !== 'Done').length}</span>
          </div>
          <div 
            className={`glass-stat ${statusFilter === 'Done' ? 'active' : ''}`}
            onClick={() => setStatusFilter(statusFilter === 'Done' ? null : 'Done')}
          >
            <span className="s-label">Completed</span>
            <span className="s-value">{tasks.filter(t => t.status === 'Done').length}</span>
          </div>
        </div>
      </div>

      {/* --- Search Bar --- */}
      <div className="search-filter-bar">
        <div className="search-wrapper">
          <span>🔍</span>
          <input 
            type="text" 
            placeholder="Search by task title or category..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && <button onClick={() => setSearchTerm('')} style={{background:'none', border:'none', color:'#ef4444', fontWeight:800, cursor:'pointer', position:'absolute', right:'15px'}}>✕</button>}
        </div>
      </div>

      {/* --- Table View --- */}
      <div className="table-card-premium">
        <table className="premium-table">
          <thead>
            <tr>
              <th>Task Name</th>
              <th>Priority</th>
              <th>Status</th>
              <th>Deadline</th>
              <th className="text-center">Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredTasks.map(task => (
              <tr key={task.id} className="row-animated" onClick={() => setSelectedTask(task)}>
                <td className="task-name-main">{task.title}</td>
                <td><span className={`prio-badge-sq ${task.priority.toLowerCase()}`}>{task.priority}</span></td>
                <td><span className={`status-pill-saas ${task.status.toLowerCase().replace(' ', '')}`}>{task.status}</span></td>
                <td className="deadline-txt">{task.dueDate}</td>
                <td className="text-center" onClick={e => e.stopPropagation()}>
                  <button className="btn-action-update" onClick={(e) => toggleQuickStatus(task.id, e)}>Quick Update</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredTasks.length === 0 && <div style={{padding:'40px', textAlign:'center', color:'#64748b'}}>No tasks found matching your filters.</div>}
      </div>

      {/* --- 💡 TASK MODAL CARD (Pop-up View) --- */}
      {selectedTask && (
        <div className="modal-overlay" onClick={() => { setSelectedTask(null); setEditingCommentId(null); setCommentText(""); }}>
          <div className="task-modal-card" onClick={e => e.stopPropagation()}>
            <button className="modal-close-btn" onClick={() => { setSelectedTask(null); setEditingCommentId(null); setCommentText(""); }} title="Close Details">✕</button>
            
            <div className="modal-content-scroll">
              <div className="main-details-card">
                <span className="category-tag">{selectedTask.category}</span>
                <h1 className="detail-h1">{selectedTask.title}</h1>
                <p className="detail-desc">{selectedTask.description}</p>
                
                <div style={{display:'flex', gap:'40px', marginBottom:'30px', flexWrap:'wrap'}}>
                  <div>
                    <label className="s-label" style={{display:'block', marginBottom:'5px'}}>Status</label>
                    <span className={`status-pill-saas ${selectedTask.status.toLowerCase().replace(' ', '')}`}>{selectedTask.status}</span>
                  </div>
                  <div>
                    <label className="s-label" style={{display:'block', marginBottom:'5px'}}>Priority</label>
                    <span className={`prio-badge-sq ${selectedTask.priority.toLowerCase()}`}>{selectedTask.priority}</span>
                  </div>
                  <div>
                    <label className="s-label" style={{display:'block', marginBottom:'5px'}}>Assignee</label>
                    <span style={{fontWeight:800, fontSize:'14px'}}>{selectedTask.assignedTo}</span>
                  </div>
                </div>

                <div className="section-divider"></div>

                {/* Files Section */}
                <div className="attachments-hub">
                  <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'15px'}}>
                    <h3 style={{margin:0, fontSize:'18px', fontWeight:900}}>Files & Assets</h3>
                    <button className="btn-action-update" style={{color:'#4f46e5', fontWeight:800}} onClick={() => fileInputRef.current.click()}>+ Upload PDF</button>
                    <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept=".pdf" style={{display: 'none'}} />
                  </div>
                  <div className="files-stack">
                    {selectedTask.files.map(file => (
                      <div key={file.id} className="file-pill">
                        <div className="f-icon-red">PDF</div>
                        <div className="f-info"><span className="f-name">{file.name}</span><span className="f-size">{file.size}</span></div>
                        <div style={{marginLeft:'auto', display:'flex', gap:'10px'}}>
                          <button className="btn-action-update">View</button>
                          {/* 💡 Delete File Button */}
                          <button className="btn-delete-file" onClick={(e) => deleteFile(file.id, e)} title="Delete File">✕</button>
                        </div>
                      </div>
                    ))}
                    {selectedTask.files.length === 0 && <p style={{color:'#94a3b8', fontSize:'13px', fontStyle:'italic'}}>No documents attached yet.</p>}
                  </div>
                </div>

                <div className="section-divider"></div>

                {/* Discussion Area */}
                <div className="discussion-hub">
                  <h3 style={{fontSize:'18px', marginBottom:'20px', fontWeight:900}}>Team Discussion</h3>
                  <div className="comments-scroller">
                    {selectedTask.comments.map(c => (
                      <div key={c.id} className="comment-v-bubble">
                        <div className="c-avatar-box">{c.author.charAt(0)}</div>
                        <div className="c-content-box">
                          <div className="c-top">
                            <span className="c-user">{c.author}</span>
                            <span className="c-date">{c.date}</span>
                          </div>
                          <p className="c-text-val">{c.text}</p>
                          
                          {/* 💡 Comment Actions (Edit/Delete) */}
                          <div className="c-actions-row">
                            <button className="btn-c-action" onClick={() => { setCommentText(c.text); setEditingCommentId(c.id); }}>Edit</button>
                            <button className="btn-c-action danger" onClick={() => deleteComment(c.id)}>Delete</button>
                          </div>
                        </div>
                      </div>
                    ))}
                    {selectedTask.comments.length === 0 && <p style={{color:'#94a3b8', fontSize:'13px', fontStyle:'italic'}}>No comments yet.</p>}
                  </div>
                  
                  <div className="comment-input-area">
                    <input 
                      type="text" 
                      placeholder={editingCommentId ? "Update your comment..." : "Add your feedback..."} 
                      value={commentText} 
                      onChange={(e) => setCommentText(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && submitComment()}
                    />
                    <button className="btn-submit-comment" onClick={submitComment}>
                      {editingCommentId ? 'Update' : 'Post'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Tasks;