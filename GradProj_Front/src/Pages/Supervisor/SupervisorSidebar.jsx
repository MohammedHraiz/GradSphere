import React from 'react';
import { NavLink } from 'react-router-dom';

const sidebarStyles = `
  .sidebar { width: 260px; height: 100vh; background: #0f172a; color: white; display: flex; flex-direction: column; padding: 25px 15px; box-sizing: border-box; font-family: 'Plus Jakarta Sans', sans-serif; border-right: 1px solid #1e293b; text-align: left; }
  .sidebar-header { display: flex; align-items: center; gap: 15px; margin-bottom: 40px; padding-left: 10px; }
  .logo-icon { background: linear-gradient(135deg, #4f46e5, #3b82f6); color: white; width: 40px; height: 40px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-weight: 900; font-size: 16px; box-shadow: 0 4px 10px rgba(79, 70, 229, 0.4); }
  .sidebar-header h2 { font-size: 20px; font-weight: 800; margin: 0; letter-spacing: -0.5px; color: white; }
  .sidebar-nav { display: flex; flex-direction: column; gap: 8px; flex-grow: 1; overflow-y: auto; padding-right: 5px;}
  .sidebar-nav::-webkit-scrollbar { width: 4px; }
  .sidebar-nav::-webkit-scrollbar-thumb { background: #334155; border-radius: 4px; }
  .nav-item { display: flex; align-items: center; gap: 15px; padding: 12px 15px; border-radius: 12px; color: #94a3b8; text-decoration: none; font-size: 14px; font-weight: 700; transition: 0.3s; }
  .nav-item:hover { background: rgba(255, 255, 255, 0.05); color: white; transform: translateX(5px); }
  .nav-item.active { background: rgba(79, 70, 229, 0.1); color: #818cf8; box-shadow: inset 3px 0 0 0 #818cf8; }
  .nav-icon { font-size: 18px; width: 24px; text-align: center; }
  .sidebar-footer { padding-top: 20px; border-top: 1px solid #1e293b; margin-top: auto; }
  .btn-support { width: 100%; background: rgba(255,255,255,0.05); border: 1px solid #334155; color: #cbd5e1; padding: 12px; border-radius: 10px; font-weight: 700; cursor: pointer; transition: 0.2s; font-size: 13px;}
  .btn-support:hover { background: rgba(255,255,255,0.1); color: white; border-color: #475569;}
`;

const SupervisorSidebar = () => {
  return (
    <aside className="sidebar">
      <style>{sidebarStyles}</style>
      <div className="sidebar-header">
        <div className="logo-icon">GP</div>
        <h2>GP Portal</h2>
      </div>
      <nav className="sidebar-nav">
        <NavLink to="/supervisor/dashboard" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}><span className="nav-icon">📊</span><span className="nav-label">Dashboard</span></NavLink>
        <NavLink to="/supervisor/students" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}><span className="nav-icon">👨‍🎓</span><span className="nav-label">My Students</span></NavLink>
        <NavLink to="/supervisor/projects" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}><span className="nav-icon">📁</span><span className="nav-label">Projects</span></NavLink>
        <NavLink to="/supervisor/tasks" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}><span className="nav-icon">✅</span><span className="nav-label">Task Manager</span></NavLink>
        <NavLink to="/supervisor/milestones" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}><span className="nav-icon">🚩</span><span className="nav-label">Milestones</span></NavLink>
        <NavLink to="/supervisor/meetings" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}><span className="nav-icon">📅</span><span className="nav-label">Meetings</span></NavLink>
        <NavLink to="/supervisor/chat" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}><span className="nav-icon">💬</span><span className="nav-label">Messages</span></NavLink>
      </nav>
      <div className="sidebar-footer">
        <button className="btn-support">Get Support</button>
      </div>
    </aside>
  );
};

export default SupervisorSidebar;