import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const adminSidebarStyles = `
  .admin-sidebar { width: 260px; height: 100vh; background: #020617; color: white; display: flex; flex-direction: column; padding: 30px 15px; box-sizing: border-box; font-family: 'Plus Jakarta Sans', sans-serif; border-right: 1px solid rgba(255, 255, 255, 0.05); text-align: left; }
  .admin-logo-container { display: flex; align-items: center; gap: 15px; margin-bottom: 40px; padding-left: 10px; }
  .admin-logo-icon { font-size: 20px; background: linear-gradient(135deg, #06b6d4, #3b82f6); width: 45px; height: 45px; display: flex; align-items: center; justify-content: center; border-radius: 12px; box-shadow: 0 0 20px rgba(6, 182, 212, 0.4); color: white; }
  .admin-logo-text h2 { font-size: 16px; font-weight: 900; margin: 0; letter-spacing: 1px; color: white; }
  .admin-logo-text p { font-size: 10px; font-weight: 700; margin: 0; color: #06b6d4; text-transform: uppercase; letter-spacing: 2px; }
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
    { name: 'Meetings', path: '/admin/meetings', icon: '📅' },
    { name: 'Project Approvals', path: '/admin/forms', icon: '📝' },
     { name: 'Import / Export Data', path: '/admin/import', icon: '🗄️' },
    { section: 'AI Engine' },
    { name: 'AI Allocation Engine', path: '/admin/ai-recommendations', icon: '🧠' },
    
  ];

  return (
    <aside className="admin-sidebar">
      <style>{adminSidebarStyles}</style>

      <div className="admin-logo-container">
        <div className="admin-logo-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="8" rx="2" ry="2" /><rect x="2" y="14" width="20" height="8" rx="2" ry="2" /><line x1="6" y1="6" x2="6.01" y2="6" /><line x1="6" y1="18" x2="6.01" y2="18" /></svg>
        </div>
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
