import React, { useState, useRef } from 'react';

/**
 * 💡 Milestones Component - Premium Master Edition
 * تحديث نموذج التسليم ليشمل شريط الرفع والحقول الإضافية كما في الصور
 */

const styles = `
.milestones-wrapper {
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

.m-header { margin-bottom: 40px; }
.m-kicker { color: #4f46e5; font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 5px; }
.m-title { font-size: 32px; font-weight: 900; margin: 0; color: #0f172a; letter-spacing: -1px; }

/* Overall Progress Card */
.overall-progress-card {
  background: white; border: 1px solid #e2e8f0; padding: 25px; border-radius: 24px;
  margin-top: 25px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.02);
}
.progress-text-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; }
.progress-text-row h3 { font-size: 18px; font-weight: 800; margin: 0; }
.progress-subtext { font-size: 13px; color: #64748b; font-weight: 600; margin-top: 4px; }
.progress-percentage { font-size: 28px; font-weight: 900; color: #4f46e5; }

.progress-bar-bg { height: 10px; background: #f1f5f9; border-radius: 10px; overflow: hidden; }
.progress-bar-fill { height: 100%; background: linear-gradient(90deg, #4f46e5, #7c3aed); border-radius: 10px; transition: 1s ease-out; }

/* Timeline Section */
.timeline-container { position: relative; padding-left: 50px; margin-top: 50px; }
.timeline-container::before {
  content: ''; position: absolute; left: 24px; top: 0; height: 100%; width: 2px;
  background: #e2e8f0; border-radius: 2px;
}

.timeline-item { position: relative; margin-bottom: 40px; }

/* Timeline Dot Icons */
.timeline-dot {
  position: absolute; left: -50px; top: 15px; width: 34px; height: 34px;
  border-radius: 50%; background: white; border: 2px solid #e2e8f0;
  display: flex; align-items: center; justify-content: center; z-index: 2; font-weight: 900; font-size: 14px;
}
.timeline-item.completed .timeline-dot { border-color: #10b981; color: #10b981; box-shadow: 0 0 10px rgba(16, 185, 129, 0.2); }
.timeline-item.current .timeline-dot { border-color: #4f46e5; color: #4f46e5; box-shadow: 0 0 10px rgba(79, 70, 229, 0.2); animation: pulse 2s infinite; }

@keyframes pulse { 0% { transform: scale(1); } 50% { transform: scale(1.1); } 100% { transform: scale(1); } }

/* Clickable Milestone Card Styling */
.milestone-card {
  background: white; border: 1px solid #e2e8f0; border-radius: 24px; padding: 30px;
  box-shadow: 0 4px 6px -1px rgba(0,0,0,0.02); transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  cursor: pointer; position: relative;
}
.milestone-card:hover {
  transform: translateY(-5px) scale(1.01);
  border-color: #4f46e5;
  box-shadow: 0 20px 25px -5px rgba(79, 70, 229, 0.1);
}
.timeline-item.locked .milestone-card { opacity: 0.6; cursor: not-allowed; }
.timeline-item.locked .milestone-card:hover { transform: none; border-color: #e2e8f0; box-shadow: none; }

.m-card-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; }
.m-card-title { font-size: 20px; font-weight: 800; margin: 0 0 5px 0; color: #0f172a; }
.m-card-date { font-size: 13px; font-weight: 700; color: #64748b; }

.status-badge { padding: 6px 12px; border-radius: 20px; font-size: 11px; font-weight: 800; text-transform: uppercase; }
.status-badge.completed { background: #d1fae5; color: #059669; }
.status-badge.current { background: #eef2ff; color: #4f46e5; }
.status-badge.locked { background: #f1f5f9; color: #94a3b8; }

.m-card-desc { font-size: 14px; color: #475569; line-height: 1.6; margin-bottom: 25px; }

.deliverables-section { margin-bottom: 25px; }
.deliverables-title { display: block; font-size: 12px; font-weight: 800; color: #94a3b8; text-transform: uppercase; margin-bottom: 10px; }
.deliverables-list { display: flex; gap: 10px; flex-wrap: wrap; }
.d-tag { background: #f8fafc; border: 1px solid #e2e8f0; padding: 8px 14px; border-radius: 8px; font-size: 12px; font-weight: 700; color: #1e293b; }

.m-action-row { display: flex; justify-content: flex-end; padding-top: 15px; border-top: 1px dashed #e2e8f0; }
.btn-view, .btn-submit { border: none; background: transparent; color: #4f46e5; font-weight: 800; font-size: 13px; display: flex; align-items: center; gap: 5px; }

/* Modal Background */
.modal-backdrop {
  position: fixed; inset: 0; background: rgba(15, 23, 42, 0.6); backdrop-filter: blur(4px);
  display: flex; justify-content: center; align-items: center; z-index: 1000; animation: fadeIn 0.2s;
}
.modal-content {
  background: white; width: 90%; max-width: 650px; border-radius: 28px;
  box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25); position: relative; text-align: left;
  animation: slideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}
@keyframes slideIn { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }

.close-btn { position: absolute; top: 20px; right: 25px; background: #f1f5f9; border: none; width: 36px; height: 36px; border-radius: 50%; cursor: pointer; font-size: 18px; color: #64748b; transition: 0.2s;}
.close-btn:hover { background: #fee2e2; color: #ef4444; }

.sub-meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 25px 0; }
.meta-box { background: #f8fafc; padding: 15px; border-radius: 12px; border: 1px solid #e2e8f0; }
.meta-box label { display: block; font-size: 11px; font-weight: 800; color: #94a3b8; text-transform: uppercase; margin-bottom: 5px; }
.meta-box span { font-weight: 800; color: #0f172a; font-size: 14px; }
.grade-text { color: #10b981 !important; font-size: 18px !important; }

.feedback-box { background: #fffcf0; border: 1px solid #fde68a; padding: 20px; border-radius: 16px; margin-top: 20px; }
.feedback-box h4 { margin: 0 0 10px 0; color: #b45309; }

/* 💡 Submission Form Styling Updates */
.modal-body { padding: 30px; }
.modal-header { padding: 25px 30px; border-bottom: 1px solid #f1f5f9; }
.modal-header h2 { margin: 0; font-size: 22px; font-weight: 800; }

.alert-info { background: #eff6ff; border-left: 4px solid #3b82f6; padding: 15px; border-radius: 12px; font-size: 13px; color: #1e40af; margin-bottom: 25px; line-height: 1.6; }
.form-group { margin-bottom: 20px; }
.form-group label { display: block; font-size: 12px; font-weight: 800; color: #475569; text-transform: uppercase; margin-bottom: 8px; }
.form-input, .form-textarea { width: 100%; box-sizing: border-box; padding: 14px 18px; border: 1px solid #e2e8f0; border-radius: 12px; font-size: 15px; outline: none; transition: 0.2s; font-family: inherit;}
.form-input:focus, .form-textarea:focus { border-color: #4f46e5; box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1); }

.drag-drop-area {
  border: 2px dashed #cbd5e1; border-radius: 16px; padding: 40px; text-align: center;
  cursor: pointer; transition: 0.2s; background: #f8fafc;
}
.drag-drop-area:hover { border-color: #4f46e5; background: #f5f3ff; }
.upload-icon { font-size: 32px; display: block; margin-bottom: 10px; }

/* 💡 NEW: Green Upload Progress Bar Styles */
.upload-progress-wrapper { margin-top: 25px; }
.progress-bar-bg-small { background: #f1f5f9; height: 8px; border-radius: 10px; width: 100%; overflow: hidden; margin-bottom: 8px;}
.progress-bar-fill-green { background: #10b981; height: 100%; border-radius: 10px; transition: width 0.3s ease; }
.progress-text-small { display: block; text-align: center; font-size: 12px; font-weight: 700; color: #64748b; }

.modal-footer { display: flex; justify-content: flex-end; gap: 12px; padding: 20px 30px; border-top: 1px solid #f1f5f9; background: #f8fafc; border-bottom-left-radius: 28px; border-bottom-right-radius: 28px; }
.btn-secondary-modal { background: #fff; border: 1px solid #e2e8f0; color: #475569; padding: 12px 24px; border-radius: 12px; font-weight: 700; cursor: pointer; transition: 0.2s; }
.btn-submit-final-saas { background: #4f46e5; color: white; border: none; padding: 12px 30px; border-radius: 12px; font-weight: 800; cursor: pointer; transition: 0.2s; box-shadow: 0 4px 10px rgba(79,70,229,0.2); }
.btn-submit-final-saas:hover:not(:disabled) { background: #4338ca; transform: translateY(-2px); }
.btn-submit-final-saas:disabled { opacity: 0.8; cursor: not-allowed; }
`;

const Milestones = () => {
  const [activeModal, setActiveModal] = useState(null); 
  const [selectedMilestone, setSelectedMilestone] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef(null);

  const [milestones, setMilestones] = useState([
    {
      id: 1, title: "Project Proposal & Planning", status: "completed", date: "Feb 15, 2026",
      description: "Submit the initial project proposal including the problem statement, objectives, proposed solution, and technology stack.",
      deliverables: ["Proposal Document (PDF)", "Gantt Chart"],
      submissionData: {
        submittedOn: "Feb 14, 2026 at 09:30 AM",
        files: ["Smart_Campus_Proposal_v2.pdf", "Timeline_Gantt.xlsx"],
        grade: "95/100",
        supervisorFeedback: "Excellent proposal. The problem statement is very clear."
      }
    },
    {
      id: 2, title: "Midterm Evaluation (Phase 1)", status: "current", date: "Apr 28, 2026",
      description: "Present the core system architecture, database design, and a working prototype of the user interface.",
      deliverables: ["UI Prototype", "Database ERD", "Midterm Report"],
      submissionData: null
    },
    {
      id: 3, title: "Final Implementation & Testing", status: "locked", date: "May 30, 2026",
      description: "Complete the backend development, integrate all APIs, and perform comprehensive system testing.",
      deliverables: ["Source Code", "Testing Report"],
      submissionData: null
    },
    {
      id: 4, title: "Final Defense & Submission", status: "locked", date: "Jun 15, 2026",
      description: "Submit the final graduation project book and defend your work before the examination committee.",
      deliverables: ["Final Project Book", "Presentation Slides"],
      submissionData: null
    }
  ]);

  const completedCount = milestones.filter(m => m.status === 'completed').length;
  const progressPercentage = Math.round((completedCount / milestones.length) * 100);

  const openSubmitModal = (milestone) => {
    setSelectedMilestone(milestone);
    setActiveModal('submit');
    setUploadProgress(0);
  };

  const openViewModal = (milestone) => {
    setSelectedMilestone(milestone);
    setActiveModal('view');
  };

  const closeModal = () => {
    if (uploadProgress > 0 && uploadProgress < 100) return; // منع الإغلاق أثناء التحميل
    setActiveModal(null);
    setTimeout(() => setSelectedMilestone(null), 300);
  };

  const handleCardClick = (milestone) => {
    if (milestone.status === 'completed') {
      openViewModal(milestone);
    } else if (milestone.status === 'current') {
      openSubmitModal(milestone);
    }
  };

  const handleFinalSubmit = (e) => {
    e.preventDefault();
    setUploadProgress(10);
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setMilestones(prevM => prevM.map(m => {
            if (m.id === selectedMilestone.id) {
              return { ...m, status: 'completed', submissionData: { submittedOn: "Just Now", files: ["Submission_Files.zip"], grade: "Pending Review", supervisorFeedback: "Waiting for review." } };
            }
            if (m.id === selectedMilestone.id + 1) return { ...m, status: 'current' };
            return m;
          }));
          setTimeout(() => closeModal(), 1000);
          return 100;
        }
        return prev + 15;
      });
    }, 300);
  };

  return (
    <div className="milestones-wrapper">
      <style>{styles}</style>
      
      <div className="m-header">
        <p className="m-kicker">Student Portal / Roadmap</p>
        <h1 className="m-title">Project Milestones</h1>
        
        <div className="overall-progress-card">
          <div className="progress-text-row">
            <div>
              <h3>Overall Progress</h3>
              <p className="progress-subtext">You have completed {completedCount} out of {milestones.length} milestones.</p>
            </div>
            <div className="progress-percentage">{progressPercentage}%</div>
          </div>
          <div className="progress-bar-bg">
            <div className="progress-bar-fill" style={{ width: `${progressPercentage}%` }}></div>
          </div>
        </div>
      </div>

      <div className="timeline-container">
        {milestones.map((milestone) => (
          <div key={milestone.id} className={`timeline-item ${milestone.status}`}>
            
            <div className="timeline-dot">
              <span className="dot-icon">{milestone.status === 'completed' ? '✓' : milestone.status === 'current' ? '●' : '🔒'}</span>
            </div>

            <div className="milestone-card" onClick={() => handleCardClick(milestone)}>
              <div className="m-card-header">
                <div>
                  <h2 className="m-card-title">{milestone.title}</h2>
                  <span className="m-card-date">🗓️ Deadline: {milestone.date}</span>
                </div>
                <div className={`status-badge ${milestone.status}`}>
                  {milestone.status === 'current' ? 'In Progress' : milestone.status}
                </div>
              </div>

              <p className="m-card-desc">{milestone.description}</p>

              <div className="deliverables-section">
                <span className="deliverables-title">Required Deliverables</span>
                <div className="deliverables-list">
                  {milestone.deliverables.map((item, idx) => (
                    <span key={idx} className="d-tag">📄 {item}</span>
                  ))}
                </div>
              </div>

              <div className="m-action-row">
                {milestone.status === 'completed' && (
                  <span className="btn-view">👁️ View Details →</span>
                )}
                {milestone.status === 'current' && (
                  <span className="btn-submit">📤 Open Submission Drawer →</span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* --- View Modal --- */}
      {activeModal === 'view' && selectedMilestone && (
        <div className="modal-backdrop" onClick={closeModal}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Submission Details</h2>
              <button className="close-btn" onClick={closeModal}>✕</button>
            </div>
            <div className="modal-body">
              <div className="sub-meta-grid">
                <div className="meta-box"><label>Submitted On</label><span>{selectedMilestone.submissionData.submittedOn}</span></div>
                <div className="meta-box success"><label>Grade</label><span className="grade-text">{selectedMilestone.submissionData.grade}</span></div>
              </div>
              <div className="feedback-box">
                <h4>Supervisor Feedback</h4>
                <p>"{selectedMilestone.submissionData.supervisorFeedback}"</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 💡 --- Submit Modal UPDATED (Matches Images) --- */}
      {activeModal === 'submit' && selectedMilestone && (
        <div className="modal-backdrop" onClick={closeModal}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Submit: {selectedMilestone.title}</h2>
              <button className="close-btn" onClick={closeModal}>✕</button>
            </div>
            
            <div className="modal-body">
              <div className="alert-info">
                <strong>Reminder:</strong> Make sure you have included all required deliverables: {selectedMilestone.deliverables.join(', ')}.
              </div>

              <form onSubmit={handleFinalSubmit}>
                <div className="form-group">
                  <label>Upload Files (ZIP, PDF, DOCX)</label>
                  <div className="drag-drop-area" onClick={() => fileInputRef.current.click()}>
                    <span className="upload-icon">☁️</span>
                    <p>Click to browse or drag files here</p>
                    <input type="file" ref={fileInputRef} multiple style={{display: 'none'}} />
                  </div>
                </div>

                <div className="form-group">
                  <label>External Links (GitHub, Figma, Google Drive)</label>
                  <input type="url" placeholder="https://github.com/..." className="form-input" />
                </div>

                <div className="form-group">
                  <label>Additional Notes for Supervisor</label>
                  <textarea rows="3" placeholder="Add any comments about this submission..." className="form-textarea"></textarea>
                </div>

                {/* 💡 شريط الرفع الأخضر */}
                {uploadProgress > 0 && (
                  <div className="upload-progress-wrapper">
                    <div className="progress-bar-bg-small">
                      <div className="progress-bar-fill-green" style={{ width: `${uploadProgress}%` }}></div>
                    </div>
                    <span className="progress-text-small">{uploadProgress}% Uploading...</span>
                  </div>
                )}

                <div className="modal-footer" style={{margin: '30px -30px -30px -30px'}}>
                  <button type="button" className="btn-secondary-modal" onClick={closeModal} disabled={uploadProgress > 0}>Cancel</button>
                  <button type="submit" className="btn-submit-final-saas" disabled={uploadProgress > 0}>
                    {uploadProgress > 0 ? 'Submitting...' : 'Confirm Submission'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Milestones;