import React from 'react';
import { NavLink } from 'react-router-dom';
import bauLogo from '../../assets/bau_logo.png';

const sidebarStyles = `
  .sidebar { width: 260px; height: 100vh; background: #0f172a; color: white; display: flex; flex-direction: column; padding: 25px 15px; box-sizing: border-box; font-family: 'Plus Jakarta Sans', sans-serif; border-right: 1px solid #1e293b; text-align: left; }
  .sidebar-header { display: flex; align-items: center; gap: 15px; margin-bottom: 40px; padding-left: 10px; }
  .logo-icon { background: linear-gradient(135deg, #ffffff, #e0f2fe); width: 40px; height: 40px; border-radius: 12px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 10px rgba(15, 23, 42, 0.26); overflow: hidden; padding: 5px; }
  .logo-icon img { width: 100%; height: 100%; object-fit: contain; display: block; }
  .sidebar-header h2 { font-size: 20px; font-weight: 800; margin: 0; letter-spacing: -0.5px; color: white; }
  .sidebar-nav { display: flex; flex-direction: column; gap: 8px; flex-grow: 1; overflow-y: auto; padding-right: 5px;}
  .sidebar-nav::-webkit-scrollbar { width: 4px; }
  .sidebar-nav::-webkit-scrollbar-thumb { background: #334155; border-radius: 4px; }
  .nav-item { display: flex; align-items: center; gap: 15px; padding: 12px 15px; border-radius: 12px; color: #94a3b8; text-decoration: none; font-size: 14px; font-weight: 700; transition: 0.3s; }
  .nav-item:hover { background: rgba(255, 255, 255, 0.05); color: white; transform: translateX(5px); }
  .nav-item.active { background: rgba(79, 70, 229, 0.1); color: #818cf8; box-shadow: inset 3px 0 0 0 #818cf8; }
  .nav-icon { font-size: 18px; width: 24px; text-align: center; }
  .sidebar-footer { padding-top: 20px; border-top: 1px solid #1e293b; margin-top: auto; font-size: 12px; font-weight: 600; color: #64748b; text-align: center; }
  .sidebar-footer p { margin: 0; }
`;

const SupervisorSidebar = () => {
  return (
    <aside className="sidebar">
      <style>{sidebarStyles}</style>
      <div className="sidebar-header">
        <div className="logo-icon"><img src={bauLogo} alt="BAU logo" /></div>
        <h2>GP Portal</h2>
      </div>
      <nav className="sidebar-nav">
        <NavLink to="/supervisor/dashboard" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}><span className="nav-icon">📊</span><span className="nav-label">Dashboard</span></NavLink>
        <NavLink to="/supervisor/students" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}><span className="nav-icon">👨‍🎓</span><span className="nav-label">My Students</span></NavLink>
        <NavLink to="/supervisor/projects" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}><span className="nav-icon">📁</span><span className="nav-label">Projects</span></NavLink>
        <NavLink to="/supervisor/tasks" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}><span className="nav-icon">✅</span><span className="nav-label">Task Manager</span></NavLink>
        <NavLink to="/supervisor/milestones" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}><span className="nav-icon">🚩</span><span className="nav-label">Milestones</span></NavLink>
        <NavLink to="/supervisor/meetings" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}><span className="nav-icon">📅</span><span className="nav-label">Meetings</span></NavLink>
      </nav>
      <div className="sidebar-footer">
        <p>BAU IT Faculty</p>
      </div>
    </aside>
  );
};

export default SupervisorSidebar;
