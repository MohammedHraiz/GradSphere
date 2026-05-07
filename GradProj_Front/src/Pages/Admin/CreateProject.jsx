import React from 'react';
import './CreateProject.css';

const CreateProject = () => {
  return (
    <div className="admin-dashboard-container">
      <header className="dashboard-header">
        <div className="breadcrumb-nav">Admin / Projects / Create</div>
        <div className="header-right">Create Project Form</div>
      </header>

      <section className="dashboard-section">
        <div className="form-card">
          <small className="section-label">NEW PROJECT</small>
          
          <form className="admin-project-form" onSubmit={(e) => e.preventDefault()}>
            <div className="input-group full">
              <label>PROJECT TITLE <span className="req">*</span></label>
              <input type="text" placeholder="Enter project title..." />
            </div>

            <div className="input-group full">
              <label>DESCRIPTION <span className="req">*</span></label>
              <textarea placeholder="Enter description..." rows="5"></textarea>
            </div>

            <div className="form-grid">
              <div className="input-group">
                <label>DEPARTMENT <span className="req">*</span></label>
                <select defaultValue="">
                  <option value="" disabled>Select...</option>
                  <option value="cs">Computer Science</option>
                  <option value="se">Software Engineering</option>
                </select>
              </div>
              <div className="input-group">
                <label>SEMESTER <span className="req">*</span></label>
                <select defaultValue="">
                  <option value="" disabled>Select...</option>
                  <option value="fall">Fall 2025</option>
                  <option value="spring">Spring 2026</option>
                </select>
              </div>
            </div>

            <div className="input-group full">
              <label>SUPERVISOR <span className="req">*</span></label>
              <select defaultValue="">
                <option value="" disabled>Select supervisor...</option>
                <option value="1">Dr. Sara Hassan</option>
                <option value="2">Dr. Ahmed Ali</option>
              </select>
            </div>

            <div className="input-group full">
              <label>MAX TEAM SIZE <span className="req">*</span></label>
              <input type="number" defaultValue="3" />
            </div>

            {/* تم التعديل هنا ليصبح التقويم ظاهراً */}
            <div className="form-grid">
              <div className="input-group">
                <label>START DATE <span className="req">*</span></label>
                <input type="date" className="calendar-input" />
              </div>
              <div className="input-group">
                <label>END DATE <span className="req">*</span></label>
                <input type="date" className="calendar-input" />
              </div>
            </div>

            <div className="input-group full">
              <label>ATTACHMENTS</label>
              <input type="text" placeholder="Enter attachments link or info..." />
            </div>

            <div className="form-actions">
              <button type="submit" className="btn-create-admin">Create Project</button>
              <button type="button" className="btn-cancel-admin">Save Draft</button>
            </div>
          </form>
        </div>
      </section>
    </div>
  );
};

export default CreateProject;