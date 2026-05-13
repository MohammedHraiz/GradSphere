import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import bauLogo from '../../assets/bau_logo.png';

const adminSidebarStyles = `
  .admin-sidebar { width: 260px; height: 100vh; background: #020617; color: white; display: flex; flex-direction: column; padding: 30px 15px; box-sizing: border-box; font-family: 'Plus Jakarta Sans', sans-serif; border-right: 1px solid rgba(255, 255, 255, 0.05); text-align: left; }
  .admin-logo-container { display: flex; align-items: center; gap: 16px; margin-bottom: 40px; padding-left: 10px; }
  .admin-logo-icon { background: linear-gradient(135deg, #ecfeff, #ffffff); width: 56px; height: 56px; display: flex; align-items: center; justify-content: center; border-radius: 18px; box-shadow: 0 18px 28px -18px rgba(15, 23, 42, 0.44); overflow: hidden; padding: 3px; flex: 0 0 auto; }
  .admin-logo-icon img { width: 100%; height: 100%; object-fit: contain; display: block; }
  .admin-logo-text { display: grid; gap: 4px; min-width: 0; }
  .admin-logo-text h2 { font-size: 18px; font-weight: 900; margin: 0; letter-spacing: 0.08em; line-height: 1.1; color: white; }
  .admin-logo-text p { font-size: 11px; font-weight: 700; margin: 0; color: #06b6d4; text-transform: uppercase; letter-spacing: 0.18em; line-height: 1.1; }
  .admin-nav-menu { display: flex; flex-direction: column; gap: 6px; flex-grow: 1; overflow-y: auto; }
  .admin-nav-menu::-webkit-scrollbar { width: 4px; }
  .admin-nav-menu::-webkit-scrollbar-thumb { background: #1e293b; border-radius: 4px; }
  .nav-section-title { font-size: 10px; font-weight: 800; color: #475569; text-transform: uppercase; letter-spacing: 1px; margin: 20px 0 5px 15px; }
  .admin-nav-item { background: transparent; border: none; outline: none; display: flex; align-items: center; gap: 15px; padding: 12px 15px; border-radius: 12px; color: #94a3b8; font-size: 14px; font-weight: 700; cursor: pointer; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); position: relative; width: 100%; text-align: left; }
  .admin-nav-item:hover { background: rgba(255, 255, 255, 0.05); color: white; transform: translateX(5px); }
  .admin-nav-item.active { background: rgba(6, 182, 212, 0.1); color: #22d3ee; box-shadow: inset 2px 0 0 0 #06b6d4; }
  .admin-nav-icon { font-size: 18px; display: flex; align-items: center; justify-content: center; width: 24px; }
  .admin-sidebar-footer { padding-top: 20px; border-top: 1px solid rgba(255, 255, 255, 0.05); font-size: 12px; font-weight: 600; color: #64748b; text-align: center; }
  .admin-sidebar-footer p { margin: 0; }
`;

const AdminSidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    { section: 'Core Overview' },
    { name: 'System Dashboard', path: '/admin/dashboard', icon: '💻' },
    { section: 'User Management' },
    { name: 'Supervisors', path: '/admin/supervisors', icon: 'SUP' },
    { name: 'All Teams', path: '/admin/teams', icon: 'TM' },
    { name: 'All Students', path: '/admin/students', icon: 'ST' },
    { name: 'Manage Users', path: '/admin/users', icon: '👥' },
    { section: 'Data & Projects' },
    { name: 'All Projects', path: '/admin/projects', icon: '📑' },
    { name: 'Supervisor Requests', path: '/admin/supervisor-requests', icon: '📨' },
    { name: 'Meetings', path: '/admin/meetings', icon: '🗓️' },
    { name: 'Project Approvals', path: '/admin/forms', icon: '📝' },
    { name: 'Import / Export Data', path: '/admin/import', icon: '🗄️' },
    { section: 'AI Engine' },
    { name: 'AI Allocation Engine', path: '/admin/ai-recommendations', icon: '🧠' },
  ];

  return (
    <aside className="admin-sidebar">
      <style>{adminSidebarStyles}</style>

      <div className="admin-logo-container">
        <div className="admin-logo-icon"><img src={bauLogo} alt="BAU logo" /></div>
        <div className="admin-logo-text">
          <h2>SYSTEM ADMIN</h2>
          <p>Root Access</p>
        </div>
      </div>

      <nav className="admin-nav-menu">
        {menuItems.map((item, idx) => {
          if (item.section) {
            return <div key={idx} className="nav-section-title">{item.section}</div>;
          }

          const isActive = location.pathname.includes(item.path);
          return (
            <button
              key={item.name}
              className={`admin-nav-item ${isActive ? 'active' : ''}`}
              onClick={() => navigate(item.path)}
            >
              <span className="admin-nav-icon">{item.icon}</span>
              <span className="admin-nav-label">{item.name}</span>
            </button>
          );
        })}
      </nav>

      <div className="admin-sidebar-footer">
        <p>BAU IT Faculty</p>
      </div>
    </aside>
  );
};

export default AdminSidebar;
