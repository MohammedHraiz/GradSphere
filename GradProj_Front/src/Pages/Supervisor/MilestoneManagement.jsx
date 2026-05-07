import React, { useState } from 'react';
import './MilestoneManagement.css';

const MilestoneManagement = () => {
  const [selectedProject, setSelectedProject] = useState('PRJ-101');
  const [activeMilestoneId, setActiveMilestoneId] = useState(2);
  
  // States للتحكم بالنوافذ المنبثقة
  const [showAddModal, setShowAddModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);

  const milestonesData = [
    {
      id: 1,
      title: 'Project Proposal',
      date: 'Feb 15, 2026',
      status: 'completed',
      description: 'Submission and approval of the initial project idea, objectives, and scope.',
      requirements: [
        'Define problem statement',
        'Identify target audience',
        'Submit official proposal document'
      ],
      progress: 100
    },
    {
      id: 2,
      title: 'System Design',
      date: 'Mar 30, 2026',
      status: 'in-progress',
      description: 'Creation of ER diagrams, UI/UX mockups, and software architecture.',
      requirements: [
        'Complete Database ERD',
        'Design wireframes for 5 main screens',
        'Select tech stack and tools'
      ],
      progress: 60
    },
    {
      id: 3,
      title: 'Alpha Release',
      date: 'May 10, 2026',
      status: 'pending',
      description: 'First working prototype with core functionalities implemented.',
      requirements: [
        'User Authentication',
        'Core CRUD operations',
        'Deploy to staging environment'
      ],
      progress: 0
    },
    {
      id: 4,
      title: 'Final Defense',
      date: 'Jun 20, 2026',
      status: 'pending',
      description: 'Final presentation, project delivery, and documentation submission.',
      requirements: [
        'Complete thesis documentation',
        'Prepare presentation slides',
        'Final code review and bug fixes'
      ],
      progress: 0
    }
  ];

  const completedCount = milestonesData.filter(m => m.status === 'completed').length;
  const fillPercentage = milestonesData.length > 1 ? (completedCount / (milestonesData.length - 1)) * 100 : 0;
  const activeMilestone = milestonesData.find(m => m.id === activeMilestoneId);

  return (
    <div className="milestone-container">
      
      {/* --- 1. Header --- */}
      <div className="page-header">
        <div>
          <p className="subtitle">Supervisor / Tracking</p>
          <h1 className="title">Milestone Management</h1>
        </div>
        <div className="header-actions">
          <button 
            className="btn-primary-saas"
            onClick={() => setShowAddModal(true)}
          >
            + Add Milestone
          </button>
        </div>
      </div>

      {/* --- 2. Project Selector --- */}
      <div className="project-selector-bar">
        <label>Select Project:</label>
        <select 
          className="saas-select-large" 
          value={selectedProject}
          onChange={(e) => setSelectedProject(e.target.value)}
        >
          <option value="PRJ-101">Smart University Campus (Team Alpha)</option>
          <option value="PRJ-102">AI Academic Advisor (Team Beta)</option>
          <option value="PRJ-103">IoT Security System (Team Gamma)</option>
        </select>
      </div>

      {/* --- 3. Interactive Horizontal Timeline --- */}
      <div className="timeline-wrapper">
        <div className="horizontal-timeline">
          <div className="timeline-track-bg"></div>
          <div className="timeline-track-fill" style={{ width: `${fillPercentage}%` }}></div>

          {milestonesData.map((milestone) => (
            <div 
              key={milestone.id}
              className={`timeline-node ${milestone.status} ${activeMilestoneId === milestone.id ? 'active' : ''}`}
              onClick={() => setActiveMilestoneId(milestone.id)}
            >
              <div className="node-point"></div>
              <span className="node-label">{milestone.title}</span>
              <span className="node-date">{milestone.date}</span>
            </div>
          ))}
        </div>
      </div>

      {/* --- 4. Milestone Detail Card --- */}
      {activeMilestone && (
        <div className="milestone-detail-card">
          <div className="detail-header">
            <div className="detail-title">
              <h2>{activeMilestone.title}</h2>
              <p>{activeMilestone.description}</p>
            </div>
            <div>
              <span className={`status-badge-lg ${activeMilestone.status}`}>
                {activeMilestone.status.replace('-', ' ')}
              </span>
            </div>
          </div>

          <div className="detail-content">
            <div className="requirements-list">
              <h4>Key Requirements</h4>
              {activeMilestone.requirements.map((req, idx) => (
                <div className="req-item" key={idx}>
                  <span className="req-icon">
                    {activeMilestone.status === 'completed' ? '✅' : '👉'}
                  </span>
                  <span>{req}</span>
                </div>
              ))}
            </div>

            <div className="stats-box">
              <h4>Milestone Stats</h4>
              <div className="stat-row">
                <span>Task Progress:</span>
                <span>{activeMilestone.progress}%</span>
              </div>
              <div className="stat-row due-date">
                <span>Target Deadline:</span>
                <span>{activeMilestone.date}</span>
              </div>
              <div className="stat-row">
                <span>Assigned To:</span>
                <span>Team Alpha</span>
              </div>
              
              {activeMilestone.status !== 'completed' && (
                <button 
                  className="btn-primary-saas" 
                  style={{width: '100%', marginTop: '15px'}}
                  onClick={() => setShowReviewModal(true)}
                >
                  Review Tasks & Update Progress
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* =========================================================
         5. MODALS (Popups for Backend Integration)
      ========================================================= */}

      {/* A. Add Milestone Modal */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="saas-modal">
            <div className="modal-header-saas">
              <h2>Create New Milestone</h2>
              <button className="close-btn-saas" onClick={() => setShowAddModal(false)}>&times;</button>
            </div>
            <form className="saas-form" onSubmit={(e) => e.preventDefault()}>
              <div className="form-group">
                <label>Milestone Title</label>
                <input type="text" placeholder="e.g., Beta Testing Phase" />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Target Date</label>
                  <input type="date" />
                </div>
                <div className="form-group">
                  <label>Initial Status</label>
                  <select>
                    <option value="pending">Pending (Not Started)</option>
                    <option value="in-progress">In Progress</option>
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea rows="2" placeholder="Briefly describe the goal of this milestone..."></textarea>
              </div>
              <div className="form-group">
                <label>Key Requirements (Deliverables)</label>
                <textarea rows="3" placeholder="1. Setup Server&#10;2. Create APIs&#10;3. ..."></textarea>
                <small className="help-text">List the main tasks required to complete this milestone.</small>
              </div>
              <div className="modal-footer-saas">
                <button className="btn-cancel-saas" onClick={() => setShowAddModal(false)}>Cancel</button>
                <button className="btn-submit-saas" onClick={() => { setShowAddModal(false); alert('Milestone Added!'); }}>Save Milestone</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* B. Review Tasks Modal */}
      {showReviewModal && (
        <div className="modal-overlay">
          <div className="saas-modal">
            <div className="modal-header-saas">
              <h2>Review: {activeMilestone?.title}</h2>
              <button className="close-btn-saas" onClick={() => setShowReviewModal(false)}>&times;</button>
            </div>
            <div className="review-content">
              <p className="review-desc">Check off the requirements that have been completed by the team:</p>
              <div className="checklist-container">
                {activeMilestone?.requirements.map((req, idx) => (
                  <label key={idx} className="checkbox-item">
                    <input type="checkbox" defaultChecked={idx === 0} />
                    <span className="checkmark"></span>
                    <span className="task-text">{req}</span>
                  </label>
                ))}
              </div>
              
              <div className="form-group" style={{ marginTop: '20px' }}>
                <label>Update Overall Milestone Status</label>
                <select defaultValue={activeMilestone?.status}>
                  <option value="pending">Pending</option>
                  <option value="in-progress">In Progress</option>
                  <option value="completed">Completed</option>
                </select>
              </div>

              <div className="form-group">
                <label>Supervisor Feedback / Notes</label>
                <textarea rows="2" placeholder="Add any notes regarding their progress..."></textarea>
              </div>

              <div className="modal-footer-saas">
                <button className="btn-cancel-saas" onClick={() => setShowReviewModal(false)}>Cancel</button>
                <button className="btn-submit-saas" onClick={() => { setShowReviewModal(false); alert('Progress Updated!'); }}>Update Progress</button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default MilestoneManagement;