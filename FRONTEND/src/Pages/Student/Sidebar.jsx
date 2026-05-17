import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import bauLogo from '../../assets/bau_logo.png';
import './Sidebar.css';

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    { name: 'Overview', path: '/student/overview', icon: '📊' },
    { name: 'Tasks', path: '/student/tasks', icon: '✅' },
    { name: 'Milestones', path: '/student/milestones', icon: '🚩' },
    { name: 'Meetings', path: '/student/meetings', icon: '🗓️' },
    { name: 'My Team', path: '/student/my-team', icon: '👥' },
    { name: 'Invitations', path: '/student/invitations', icon: '✉️' },
    { name: 'Project Proposal', path: '/student/project', icon: '📄' },
  ];

  return (
    <aside className="student-sidebar">
      <div className="st-logo-container">
        <div className="st-logo-icon">
          <img src={bauLogo} alt="BAU logo" className="st-logo-image" />
        </div>
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
              <span className="st-nav-icon" aria-hidden="true">{item.icon}</span>
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
