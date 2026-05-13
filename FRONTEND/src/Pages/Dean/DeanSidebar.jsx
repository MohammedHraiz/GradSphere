import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import bauLogo from '../../assets/bau_logo.png';

const deanSidebarStyles = `
  .dean-sidebar { width: 260px; height: 100vh; background: #0f172a; color: white; display: flex; flex-direction: column; padding: 30px 15px; box-sizing: border-box; font-family: 'Plus Jakarta Sans', sans-serif; border-right: 1px solid rgba(255, 255, 255, 0.05); text-align: left; }
  .dean-logo-container { display: flex; align-items: center; gap: 15px; margin-bottom: 50px; padding-left: 10px; }
  .dean-logo-icon { width: 58px; height: 58px; display: flex; align-items: center; justify-content: center; overflow: hidden; background: transparent; border-radius: 0; padding: 0; flex: 0 0 auto; }
  .dean-logo-icon img { width: 100%; height: 100%; object-fit: contain; display: block; }
  .dean-logo-text h2 { font-size: 16px; font-weight: 900; margin: 0; letter-spacing: 1px; color: white; }
  .dean-logo-text p { font-size: 10px; font-weight: 700; margin: 0; opacity: 0.5; text-transform: uppercase; }
  .dean-nav-menu { display: flex; flex-direction: column; gap: 8px; flex-grow: 1; }
  .dean-nav-item { background: transparent; border: none; outline: none; display: flex; align-items: center; gap: 15px; padding: 14px 20px; border-radius: 16px; color: #94a3b8; font-size: 15px; font-weight: 700; cursor: pointer; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); position: relative; width: 100%; text-align: left; }
  .dean-nav-item:hover { background: rgba(255, 255, 255, 0.05); color: white; transform: translateX(5px); }
  .dean-nav-item.active { background: linear-gradient(135deg, #d97706, #b45309); color: white; box-shadow: 0 10px 20px -5px rgba(217, 119, 6, 0.3); }
  .dean-nav-icon { font-size: 18px; display: flex; align-items: center; justify-content: center; width: 24px; }
  .dean-active-dot { position: absolute; right: 15px; width: 6px; height: 6px; background: white; border-radius: 50%; box-shadow: 0 0 10px white; }
  .dean-sidebar-footer { padding-top: 20px; border-top: 1px solid rgba(255, 255, 255, 0.1); font-size: 12px; font-weight: 600; color: #64748b; text-align: center; }
`;

const DeanSidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    { name: 'Analytics Hub', path: '/dean/dashboard', icon: '📈' },
    { name: 'All Projects', path: '/dean/projects', icon: '📑' },
    { name: 'Supervisor Requests', path: '/dean/supervisor-requests', icon: '📨' },
    { name: 'Meetings', path: '/dean/meetings', icon: '🗓️' },
    { name: 'Supervisors', path: '/dean/supervisors', icon: '👨‍🏫' },
    { name: 'All Teams', path: '/dean/teams', icon: '👥' },
    { name: 'All Students', path: '/dean/students', icon: '🎓' },
    { name: 'Reports', path: '/dean/reports', icon: '📊' },
  ];

  return (
    <aside className="dean-sidebar">
      <style>{deanSidebarStyles}</style>

      <div className="dean-logo-container">
        <div className="dean-logo-icon"><img src={bauLogo} alt="BAU logo" /></div>
        <div className="dean-logo-text">
          <h2>DEAN OFFICE</h2>
          <p>GP PORTAL</p>
        </div>
      </div>

      <nav className="dean-nav-menu">
        {menuItems.map((item) => {
          const isActive = location.pathname.includes(item.path);
          return (
            <button
              key={item.name}
              className={`dean-nav-item ${isActive ? 'active' : ''}`}
              onClick={() => navigate(item.path)}
            >
              <span className="dean-nav-icon">{item.icon}</span>
              <span className="dean-nav-label">{item.name}</span>
              {isActive ? <div className="dean-active-dot" /> : null}
            </button>
          );
        })}
      </nav>

      <div className="dean-sidebar-footer">
        <p>BAU IT Faculty</p>
      </div>
    </aside>
  );
};

export default DeanSidebar;
