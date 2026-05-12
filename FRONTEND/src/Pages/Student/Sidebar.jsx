import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './Sidebar.css';

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    { name: 'Overview', path: '/student/overview' },
    { name: 'Tasks', path: '/student/tasks' },
    { name: 'Milestones', path: '/student/milestones' },
    { name: 'Meetings', path: '/student/meetings' },
    { name: 'My Team', path: '/student/my-team' },
    { name: 'Invitations', path: '/student/invitations' },
    { name: 'Project Proposal', path: '/student/project' },
  ];

  return (
    <aside className="student-sidebar">
      <div className="st-logo-container">
        <div className="st-logo-icon">GP</div>
        <div className="st-logo-text">
          <h2>STUDENT</h2>
          <p>DASHBOARD</p>
        </div>
      </div>

      <nav className="st-nav-menu">
        {menuItems.map((item) => {
          const isActive = location.pathname.includes(item.path);

          return (
            <button
              key={item.name}
              className={`st-nav-item ${isActive ? 'active' : ''}`}
              onClick={() => navigate(item.path)}
            >
              <span className="st-nav-label">{item.name}</span>
              {isActive && <div className="st-active-dot" />}
            </button>
          );
        })}
      </nav>

      <div className="st-sidebar-footer">
        <p>BAU IT Faculty</p>
      </div>
    </aside>
  );
};

export default Sidebar;
