import React, { useState, useEffect, useRef } from 'react';
import { Routes, Route, useNavigate, Navigate, useLocation } from 'react-router-dom';
import './App.css';

import { useAuth } from './auth/AuthContext';

// --- Imports: Landing Page ---
import Landing from './Pages/Landing/Landing';

// --- Imports: Authentication ---
import Login from './Pages/Login/Login';

// --- Imports: Supervisor ---
import SupervisorSidebar from './Pages/Supervisor/SupervisorSidebar';
import SupervisorDashboard from './Pages/Supervisor/SupervisorDashboard';
import StudentsList from './Pages/Supervisor/StudentsList';
import ProjectsList from './Pages/Supervisor/ProjectsList';
import SupervisorTeamsList from './Pages/Supervisor/SupervisorTeamsList';
import TaskManager from './Pages/Supervisor/TaskManager';
import MilestoneManagement from './Pages/Supervisor/MilestoneManagement';

// --- Imports: Student ---
import Sidebar from './Pages/Student/Sidebar';
import Overview from './Pages/Student/Overview';
import Milestones from './Pages/Student/Milestones';
import Tasks from './Pages/Student/Tasks';
import TeamManagement from './Pages/Student/TeamManagement';
import InvitationsInbox from './Pages/Student/InvitationsInbox';
import ProjectProposal from './Pages/Student/ProjectProposal';

// --- Imports: Dean ---
import DeanDashboard from './Pages/Dean/DeanDashboard';
import DeanProjectsList from './Pages/Dean/DeanProjectsList';
import DeanSidebar from './Pages/Dean/DeanSidebar';
import DeanStudentsList from './Pages/Dean/DeanStudentsList';
import DeanTeamsList from './Pages/Dean/DeanTeamsList';
import SupervisorsList from './Pages/Dean/SupervisorsList';
import DeanReports from './Pages/Dean/DeanReports'; 
import DeanSupervisorRequests from './Pages/Dean/DeanSupervisorRequests';

// --- Imports: Admin ---
import AdminSidebar from './Pages/Admin/AdminSidebar';
import AdminDashboard from './Pages/Admin/AdminDashboard';
import ManageUsers from './Pages/Admin/ManageUsers';
import ImportProjects from './Pages/Admin/ImportProjects';
import AdminForms from './Pages/Admin/AdminForms';
import AIRecommendations from './Pages/Admin/AIRecommendations';
import SystemLogs from './Pages/Admin/SystemLogs';
import Settings from './Pages/Admin/Settings';
import MeetingsPage from './Pages/Shared/MeetingsPage';
import NotificationsPage from './Pages/Shared/NotificationsPage';
import { getNotifications, getUnreadNotificationCount, markAllNotificationsAsRead, markNotificationAsRead } from './api/notificationService';
import { resolveNotificationLink } from './utils/appLinks';
import { getUserInitials, resolveProfilePhotoUrl } from './utils/userMeta';
import UserProfileModal from './components/UserProfileModal';

// ==========================================
// 💡 Premium Top Header Component (Chameleon + Modals)
// ==========================================
const TopHeader = ({ userRole, onLogout, globalTheme, setGlobalTheme, globalLang, setGlobalLang }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, role: authRole } = useAuth();
  const isAdmin = userRole === 'admin'; 
  
  const [activeDropdown, setActiveDropdown] = useState(null);
  
  // 💡 Modals States
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notificationsLoading, setNotificationsLoading] = useState(false);

  const headerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (headerRef.current && !headerRef.current.contains(e.target)) {
        setActiveDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getDisplayName = () => {
    return user?.name || user?.userName || 'User';
  };

  const profileAvatarSrc = resolveProfilePhotoUrl(user?.profilePhotoUrl);

  const getRoleColor = () => {
    if (isAdmin) return '#4f46e5';
    if (userRole === 'dean') return '#f59e0b';
    if (userRole === 'supervisor') return '#3b82f6';
    return '#4f46e5';
  };

  const mockNotifs = [
    { id: 1, title: 'Project Approved', desc: 'Your final project phase was approved.', time: 'Just now', icon: '✅', bg: '#d1fae5', c: '#059669' },
    { id: 2, title: 'Meeting Reminder', desc: 'Sync meeting with supervisor in 30 mins.', time: '30m ago', icon: '📅', bg: '#e0e7ff', c: '#4f46e5' },
    { id: 3, title: 'Storage Warning', desc: 'Database storage is at 84% capacity.', time: '2h ago', icon: '⚠️', bg: '#fef3c7', c: '#d97706' },
  ];

  const formatNotificationTime = (value) => {
    if (!value) return 'Unknown time';
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
  };

  const loadUnreadCount = async () => {
    try {
      const response = await getUnreadNotificationCount();
      setUnreadCount(response?.data?.unreadCount ?? 0);
    } catch {
      setUnreadCount(0);
    }
  };

  const loadNotifications = async () => {
    setNotificationsLoading(true);
    try {
      const response = await getNotifications();
      setNotifications(response?.data ?? []);
    } catch {
      setNotifications([]);
    } finally {
      setNotificationsLoading(false);
    }
  };

  useEffect(() => {
    loadUnreadCount();
  }, [location.pathname]);

  useEffect(() => {
    if (activeDropdown === 'notifs') {
      loadNotifications();
    }
  }, [activeDropdown]);

  const openNotification = async (notification) => {
    try {
      if (!notification.read) {
        await markNotificationAsRead(notification.id);
        setNotifications((current) => current.map((item) => (item.id === notification.id ? { ...item, read: true } : item)));
        setUnreadCount((current) => Math.max(0, current - 1));
      }
    } catch {
      // Ignore header read failures and continue to navigation.
    }

    setActiveDropdown(null);
    const target = resolveNotificationLink(authRole || userRole, notification.link);
    if (target) {
      navigate(target);
    }
  };

  const handleMarkAllNotificationsRead = async () => {
    try {
      await markAllNotificationsAsRead();
      setNotifications((current) => current.map((item) => ({ ...item, read: true })));
      setUnreadCount(0);
    } catch {
      // Full notification page still exposes retry state.
    }
  };

  const handleSaveSettings = () => {
    setIsSavingSettings(true);
    setTimeout(() => {
      setIsSavingSettings(false);
      setShowSettingsModal(false);
    }, 1000);
  };

  // Header Colors
  const isDark = globalTheme === 'dark' && !isAdmin;
  const headerBg = isDark ? '#0b1121' : 'white';
  const headerBorder = isDark ? '1px solid #1e293b' : '1px solid #e2e8f0';
  const textColor = isDark ? '#f8fafc' : '#0f172a';
  const iconColor = isDark ? '#94a3b8' : 'currentColor';
  const modalBg = isDark ? '#0f172a' : '#ffffff';
  const modalBorder = isDark ? '#1e293b' : '#e2e8f0';

  // 💡 Premium CSS for Header Modals
  const headerModalsStyles = `
    .th-modal-overlay { position: fixed; inset: 0; background: rgba(2, 6, 23, 0.7); backdrop-filter: blur(10px); display: flex; align-items: center; justify-content: center; z-index: 10000; animation: fadeIn 0.3s ease; }
    .th-modal-card { background: ${modalBg}; border: 1px solid ${modalBorder}; border-radius: 24px; width: 90%; max-width: 420px; overflow: hidden; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5); animation: slideUp 0.3s ease; position: relative; color: ${textColor}; }
    .th-cover-photo { height: 120px; background: linear-gradient(135deg, ${getRoleColor()}, #8b5cf6); position: relative; }
    .th-close-btn { position: absolute; top: 15px; right: 15px; background: rgba(0,0,0,0.3); border: none; color: white; width: 30px; height: 30px; border-radius: 50%; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: 0.2s; backdrop-filter: blur(5px); }
    .th-close-btn:hover { background: rgba(0,0,0,0.6); transform: scale(1.1); }
    .th-avatar-wrapper { position: absolute; top: 70px; left: 50%; transform: translateX(-50%); width: 80px; height: 80px; background: ${modalBg}; border-radius: 20px; padding: 5px; }
    .th-avatar { width: 100%; height: 100%; background: ${getRoleColor()}; border-radius: 16px; display: flex; align-items: center; justify-content: center; color: white; font-size: 32px; font-weight: 900; box-shadow: 0 10px 20px ${getRoleColor()}40; }
    .th-profile-body { padding: 50px 30px 30px 30px; text-align: center; }
    .th-name { font-size: 22px; font-weight: 900; margin: 0 0 5px 0; }
    .th-role-badge { display: inline-block; padding: 4px 12px; background: ${getRoleColor()}20; color: ${getRoleColor()}; border-radius: 8px; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 25px; }
    
    .th-info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; text-align: left; }
    .th-info-box { background: ${isDark ? '#1e293b' : '#f8fafc'}; padding: 15px; border-radius: 16px; border: 1px solid ${modalBorder}; }
    .th-info-label { font-size: 11px; font-weight: 800; color: #94a3b8; text-transform: uppercase; margin-bottom: 5px; }
    .th-info-val { font-size: 14px; font-weight: 800; color: ${textColor}; }
    
    .th-interactive-pill { display: flex; align-items: center; gap: 10px; padding: 12px 15px; background: ${isDark ? '#1e293b' : '#f8fafc'}; border: 1px solid ${modalBorder}; border-radius: 12px; margin-top: 15px; cursor: pointer; transition: 0.2s; text-align: left; }
    .th-interactive-pill:hover { border-color: ${getRoleColor()}; transform: translateY(-2px); box-shadow: 0 5px 15px ${getRoleColor()}20; }
    .th-interactive-icon { width: 35px; height: 35px; border-radius: 10px; background: ${getRoleColor()}20; color: ${getRoleColor()}; display: flex; align-items: center; justify-content: center; font-size: 16px; }

    /* Settings Specific */
    .th-settings-body { padding: 30px; }
    .th-settings-title { font-size: 20px; font-weight: 900; margin: 0 0 25px 0; display: flex; align-items: center; gap: 10px; }
    .seg-control { display: flex; background: ${isDark ? '#1e293b' : '#f1f5f9'}; padding: 5px; border-radius: 12px; margin-bottom: 25px; }
    .seg-btn { flex: 1; padding: 10px; border: none; background: transparent; color: #94a3b8; font-weight: 800; font-size: 13px; border-radius: 8px; cursor: pointer; transition: 0.3s; }
    .seg-btn.active { background: ${modalBg}; color: ${textColor}; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
  `;

  return (
    <>
      <style>{headerModalsStyles}</style>
      <header className="top-header" ref={headerRef} style={{position: 'relative', zIndex: 99, backgroundColor: headerBg, borderBottom: headerBorder, transition: 'background 0.3s'}}>
        <div className="header-right-actions">
          {/* 🔔 Notifications Dropdown */}
          <div style={{position: 'relative'}}>
            <button className="header-icon-btn" style={{color: iconColor}} onClick={() => setActiveDropdown(activeDropdown === 'notifs' ? null : 'notifs')}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
              {unreadCount > 0 ? <span className="icon-badge red">{unreadCount}</span> : null}
            </button>

            {activeDropdown === 'notifs' && (
              <div style={{position: 'absolute', top: '50px', right: '-20px', width: '320px', background: isDark ? '#0f172a' : 'white', borderRadius: '16px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)', border: headerBorder, overflow: 'hidden', textAlign: 'left', animation: 'fadeIn 0.2s ease'}}>
                <div style={{padding: '15px 20px', background: isDark ? '#1e293b' : '#f8fafc', borderBottom: headerBorder, display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                  <h4 style={{margin: 0, fontSize: '14px', fontWeight: 800, color: textColor}}>Notifications</h4>
                  <span style={{fontSize: '11px', color: isDark ? '#22d3ee' : '#4f46e5', fontWeight: 700, cursor: 'pointer'}} onClick={handleMarkAllNotificationsRead}>Mark all read</span>
                </div>
                <div style={{maxHeight: '300px', overflowY: 'auto'}}>
                  {notificationsLoading ? (
                    <div style={{padding: '18px 20px', color: '#64748b', fontSize: '13px', fontWeight: 700}}>Loading notifications...</div>
                  ) : notifications.length === 0 ? (
                    <div style={{padding: '18px 20px', color: '#64748b', fontSize: '13px', fontWeight: 700}}>No notifications yet.</div>
                  ) : notifications.slice(0, 6).map((notification) => (
                    <div key={notification.id} style={{padding: '15px 20px', borderBottom: headerBorder, display: 'flex', gap: '15px', cursor: 'pointer', transition: '0.2s', background: notification.read ? 'transparent' : (isDark ? 'rgba(79,70,229,0.12)' : '#eef2ff')}} onMouseOver={(e) => e.currentTarget.style.background = isDark ? '#1e293b' : '#f8fafc'} onMouseOut={(e) => e.currentTarget.style.background = notification.read ? 'transparent' : (isDark ? 'rgba(79,70,229,0.12)' : '#eef2ff')} onClick={() => openNotification(notification)}>
                      <div style={{width: '36px', height: '36px', borderRadius: '10px', background: isDark ? '#1e293b' : (notification.read ? '#f1f5f9' : '#e0e7ff'), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', flexShrink: 0}}>
                        {notification.read ? '•' : '🔔'}
                      </div>
                      <div>
                        <h5 style={{margin: '0 0 3px 0', fontSize: '13px', fontWeight: 800, color: textColor}}>{notification.title}</h5>
                        <p style={{margin: '0 0 5px 0', fontSize: '12px', color: '#64748b'}}>{notification.message}</p>
                        <span style={{fontSize: '10px', color: notification.read ? '#94a3b8' : '#4f46e5', fontWeight: 800}}>{formatNotificationTime(notification.createdAt)}</span>
                      </div>
                    </div>
                  ))}
                </div>
                <div style={{padding: '12px', textAlign: 'center', background: isDark ? '#1e293b' : '#f8fafc', borderTop: headerBorder, fontSize: '12px', fontWeight: 800, color: isDark ? '#22d3ee' : '#4f46e5', cursor: 'pointer'}} onClick={() => { setActiveDropdown(null); navigate(resolveNotificationLink(authRole || userRole, '/notifications')); }}>
                  View All Notifications →
                </div>
              </div>
            )}
          </div>

          <div className="header-divider" style={{background: isDark ? '#1e293b' : '#e2e8f0'}}></div>

          {/* 👤 Profile Dropdown */}
          <div style={{position: 'relative'}}>
            <div className="profile-trigger" onClick={() => setActiveDropdown(activeDropdown === 'profile' ? null : 'profile')} style={{cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px'}}>
              <div className="user-info-text" style={{textAlign: 'right'}}>
                <span className="user-name" style={{display: 'block', fontSize: '13px', fontWeight: 800, color: textColor}}>{getDisplayName()}</span>
                <span className="user-role" style={{display: 'block', fontSize: '11px', fontWeight: 700, color: getRoleColor(), textTransform: 'uppercase'}}>{(authRole || userRole)?.replace(/^ROLE_/i, '')}</span>
              </div>
              <div className="user-avatar" style={{width: '40px', height: '40px', borderRadius: '12px', background: getRoleColor(), color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '16px', boxShadow: isDark ? `0 0 10px ${getRoleColor()}40` : 'none', overflow: 'hidden'}}>
                {profileAvatarSrc ? (
                  <img src={profileAvatarSrc} alt={getDisplayName()} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  getUserInitials(user?.name)
                )}
              </div>
            </div>
            
            {activeDropdown === 'profile' && (
              <div style={{position: 'absolute', top: '55px', right: '0', width: '200px', background: isDark ? '#0f172a' : 'white', borderRadius: '14px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)', border: headerBorder, padding: '8px', textAlign: 'left', animation: 'fadeIn 0.2s ease'}}>
                <button style={{width: '100%', padding: '10px 12px', background: 'none', border: 'none', textAlign: 'left', fontSize: '13px', fontWeight: 700, color: textColor, borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px'}} onMouseOver={(e) => {e.currentTarget.style.background = isDark ? '#1e293b' : '#f8fafc';}} onMouseOut={(e) => {e.currentTarget.style.background = 'none';}} onClick={() => {setActiveDropdown(null); setShowProfileModal(true);}}>
                  <span style={{fontSize:'16px'}}>👤</span> My Profile
                </button>
                <div style={{height: '1px', background: isDark ? '#1e293b' : '#f1f5f9', margin: '5px 0'}}></div>
                
                <button style={{width: '100%', padding: '10px 12px', background: 'none', border: 'none', textAlign: 'left', fontSize: '13px', fontWeight: 800, color: '#ef4444', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px'}} onMouseOver={(e) => e.currentTarget.style.background = isDark ? 'rgba(239, 68, 68, 0.1)' : '#fee2e2'} onMouseOut={(e) => e.currentTarget.style.background = 'none'} onClick={() => {setActiveDropdown(null); onLogout();}}>
                  <span style={{fontSize:'16px'}}>🚪</span> Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <UserProfileModal open={showProfileModal} onClose={() => setShowProfileModal(false)} />

      {/* ================================================= */}
      {/* 🚀 PREMIUM MODAL: QUICK SETTINGS                    */}
      {/* ================================================= */}
      {showSettingsModal && (
        <div className="th-modal-overlay" onClick={() => setShowSettingsModal(false)}>
          <div className="th-modal-card" onClick={e => e.stopPropagation()} style={{padding: '0'}}>
            <div className="th-settings-body">
              <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px'}}>
                <h2 className="th-settings-title" style={{margin: 0}}>⚙️ Quick Preferences</h2>
                <button className="th-close-btn" style={{position: 'static', background: 'rgba(148, 163, 184, 0.2)', color: textColor}} onClick={() => setShowSettingsModal(false)}>✕</button>
              </div>

              <div className="th-info-label" style={{marginBottom: '10px'}}>Appearance Theme</div>
              <div className="seg-control">
                <button className={`seg-btn ${globalTheme === 'light' || isAdmin ? 'active' : ''}`} onClick={() => setGlobalTheme('light')}>
                  ☀️ Light
                </button>
                <button className={`seg-btn ${globalTheme === 'dark' && !isAdmin ? 'active' : ''}`} onClick={() => !isAdmin && setGlobalTheme('dark')} disabled={isAdmin} style={{opacity: isAdmin ? 0.5 : 1, cursor: isAdmin ? 'not-allowed' : 'pointer'}} title={isAdmin ? 'Admin uses the shared light dashboard theme' : ''}>
                  🌙 Dark
                </button>
              </div>

              <div className="th-info-label" style={{marginBottom: '10px'}}>Language / اللغة</div>
              <div className="seg-control">
                <button className={`seg-btn ${globalLang === 'en' ? 'active' : ''}`} onClick={() => setGlobalLang('en')}>
                  English
                </button>
                <button className={`seg-btn ${globalLang === 'ar' ? 'active' : ''}`} onClick={() => setGlobalLang('ar')} style={{fontFamily: 'Tajawal, sans-serif'}}>
                  العربية
                </button>
              </div>

              <button 
                onClick={handleSaveSettings} 
                disabled={isSavingSettings}
                style={{width: '100%', padding: '15px', background: `linear-gradient(135deg, ${getRoleColor()}, #8b5cf6)`, color: 'white', border: 'none', borderRadius: '14px', fontWeight: 900, fontSize: '14px', cursor: 'pointer', transition: '0.3s', marginTop: '10px', display: 'flex', justifyContent: 'center', alignItems: 'center'}}
              >
                {isSavingSettings ? <div className="spinner" style={{width:'18px', height:'18px', borderWidth:'2px'}}></div> : 'Apply Preferences'}
              </button>

              {isAdmin && (
                <div style={{textAlign: 'center', marginTop: '15px'}}>
                  <span style={{color: '#4f46e5', fontSize: '12px', fontWeight: 800, cursor: 'pointer'}} onClick={() => {setShowSettingsModal(false); navigate('/admin/settings');}}>
                    Advanced Admin Settings →
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

// ==========================================
// 🛡️ Safe Placeholder
// ==========================================
const SafeAdminPlaceholder = ({ title, icon }) => (
  <div style={{padding:'40px', background:'#f8fafc', minHeight:'100vh', borderRadius: '24px', textAlign: 'left', animation: 'fadeIn 0.4s ease', border: '1px solid #e2e8f0'}}>
    <h1 style={{fontSize: '32px', color: '#0f172a', margin: '0 0 10px 0', fontWeight: 900}}>{title} {icon}</h1>
    <p style={{color: '#64748b', margin: '0 0 30px 0', fontWeight: 500}}>This module is currently under active development.</p>
  </div>
);

// ==========================================
// 🚀 Main App Component & Routing
// ==========================================

// Small safe Navigate wrapper to avoid navigating to the same pathname
const SafeNavigate = ({ to, replace = false, state = null }) => {
  const location = useLocation();
  if (!to) return null;
  try {
    // avoid same-path navigation which can trigger ping-pong loops
    if (location?.pathname === to) return null;
  } catch (e) {
    // defensive: if location is unavailable, continue with normal Navigate
  }
  return <Navigate to={to} replace={replace} state={state} />;
};
function App() {
  const navigate = useNavigate();
  const { user: currentUser, role: userRole, logout: authLogout } = useAuth();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  // 💡 Global Settings State
  const [globalTheme, setGlobalTheme] = useState('light'); // 'light' or 'dark'
  const [globalLang, setGlobalLang] = useState('en'); // 'en' or 'ar'

  const mapRoleToRoute = (role) => {
    const r = String(role || '').replace(/^ROLE_/i, '').toLowerCase();
    // Map the specific office role to the dean route
    if (r === 'dean_office' || r === 'deanoffice' || r === 'dean-office') return 'dean';
    if (r.startsWith('dean')) return 'dean';
    return r;
  };

  const normalizedUserRole = mapRoleToRoute(userRole);

  const handleConfirmLogout = () => {
    authLogout();
    setShowLogoutConfirm(false);
    navigate('/login');
  };

  // 💡 Dynamic Background based on Global Theme and Role
  const isDark = globalTheme === 'dark' && normalizedUserRole !== 'admin' && String(currentUser?.role || '').replace(/^ROLE_/i, '').toLowerCase() !== 'admin';
  const wrapperBg = isDark ? '#0b1121' : '#f8fafc';

  return (
    <div className={`App ${isDark ? 'dark-theme' : 'light-theme'}`} dir={globalLang === 'ar' ? 'rtl' : 'ltr'}>
      <Routes>
        <Route path="/login" element={!normalizedUserRole ? <Login /> : <Navigate to="/" />} />

        {/* --- Student Routes --- */}
        <Route path="/student/*" element={
          normalizedUserRole === 'student' ? (
            <div className="app-layout">
              <div className="sidebar-wrapper"><Sidebar /></div>
              <div className="content-wrapper" style={{backgroundColor: wrapperBg, transition: 'background 0.3s'}}>
                <TopHeader userRole={normalizedUserRole} onLogout={() => setShowLogoutConfirm(true)} globalTheme={globalTheme} setGlobalTheme={setGlobalTheme} globalLang={globalLang} setGlobalLang={setGlobalLang} />
                <main className="main-content">
                  <Routes>
                    <Route path="overview" element={<Overview />} />
                    <Route path="tasks" element={<Tasks />} />
                    <Route path="milestones" element={<Milestones />} />
                    <Route path="meetings" element={<MeetingsPage />} />
                    <Route path="my-team" element={<TeamManagement />} />
                    <Route path="invitations" element={<InvitationsInbox />} />
                    <Route path="notifications" element={<NotificationsPage />} />
                    <Route path="project" element={<ProjectProposal />} />
                    <Route path="chat" element={<Navigate to="/student/overview" replace />} />
                    <Route path="*" element={<Navigate to="overview" />} />
                  </Routes>
                </main>
              </div>
            </div>
          ) : <Navigate to="/login" />
        } />

        <Route path="/my-team" element={<Navigate to="/student/my-team" replace />} />

        {/* --- Supervisor Routes --- */}
        <Route path="/supervisor/*" element={
          normalizedUserRole === 'supervisor' ? (
            <div className="app-layout">
              <div className="sidebar-wrapper"><SupervisorSidebar /></div>
              <div className="content-wrapper" style={{backgroundColor: wrapperBg, transition: 'background 0.3s'}}>
                <TopHeader userRole={normalizedUserRole} onLogout={() => setShowLogoutConfirm(true)} globalTheme={globalTheme} setGlobalTheme={setGlobalTheme} globalLang={globalLang} setGlobalLang={setGlobalLang} />
                <main className="main-content">
                  <Routes>
                    <Route path="dashboard" element={<SupervisorDashboard />} />
                    <Route path="students" element={<StudentsList />} />
                    <Route path="my-teams" element={<SupervisorTeamsList />} />
                    <Route path="projects" element={<ProjectsList />} />
                    <Route path="tasks" element={<TaskManager />} />
                    <Route path="milestones" element={<MilestoneManagement />} />
                    <Route path="meetings" element={<MeetingsPage />} />
                    <Route path="meeting-history" element={<Navigate to="../meetings" replace />} />
                    <Route path="meeting-progress" element={<Navigate to="../meetings" replace />} />
                    <Route path="new-meeting" element={<Navigate to="../meetings" replace />} />
                    <Route path="notifications" element={<NotificationsPage />} />
                    <Route path="chat" element={<Navigate to="/supervisor/dashboard" replace />} />
                    <Route path="*" element={<Navigate to="dashboard" />} />
                  </Routes>
                </main>
              </div>
            </div>
          ) : <Navigate to="/login" />
        } />

        {/* --- Dean Routes --- */}
        <Route path="/dean/*" element={
          normalizedUserRole === 'dean' ? (
            <div className="app-layout">
              <div className="sidebar-wrapper"><DeanSidebar /></div>
              <div className="content-wrapper" style={{backgroundColor: wrapperBg, transition: 'background 0.3s'}}>
                <TopHeader userRole={normalizedUserRole} onLogout={() => setShowLogoutConfirm(true)} globalTheme={globalTheme} setGlobalTheme={setGlobalTheme} globalLang={globalLang} setGlobalLang={setGlobalLang} />
                <main className="main-content">
                  <Routes>
                    <Route path="dashboard" element={<DeanDashboard />} />
                    <Route path="projects" element={<DeanProjectsList />} />
                    <Route path="supervisor-requests" element={<DeanSupervisorRequests />} />
                    <Route path="supervisors" element={<SupervisorsList />} />
                    <Route path="students" element={<DeanStudentsList />} />
                    <Route path="teams" element={<DeanTeamsList />} />
                    <Route path="meetings" element={<MeetingsPage />} />
                    <Route path="notifications" element={<NotificationsPage />} />
                    <Route path="reports" element={<DeanReports />} />
                    <Route path="chat" element={<Navigate to="/dean/dashboard" replace />} />
                    <Route path="*" element={<Navigate to="dashboard" />} />
                  </Routes>
                </main>
              </div>
            </div>
          ) : <Navigate to="/login" />
        } />

        {/* --- Admin Routes (Root Access) --- */}
        <Route path="/admin/*" element={
          normalizedUserRole === 'admin' ? (
            <div className="app-layout">
              <div className="sidebar-wrapper"><AdminSidebar /></div>
              <div className="content-wrapper" style={{backgroundColor: wrapperBg, minHeight: '100vh', transition: 'background 0.3s'}}> 
                <TopHeader userRole={normalizedUserRole} onLogout={() => setShowLogoutConfirm(true)} globalTheme={globalTheme} setGlobalTheme={setGlobalTheme} globalLang={globalLang} setGlobalLang={setGlobalLang} />
                <main className="main-content" style={{padding: 0}}>
                  <Routes>
                    <Route path="dashboard" element={<AdminDashboard />} />
                    <Route path="projects" element={<DeanProjectsList />} />
                    <Route path="supervisor-requests" element={<DeanSupervisorRequests />} />
                    <Route path="supervisors" element={<SupervisorsList />} />
                    <Route path="teams" element={<DeanTeamsList />} />
                    <Route path="students" element={<DeanStudentsList />} />
                    <Route path="users" element={<ManageUsers />} />
                    <Route path="import" element={<ImportProjects />} />
                    <Route path="forms" element={<AdminForms />} />
                    <Route path="meetings" element={<MeetingsPage />} />
                    <Route path="notifications" element={<NotificationsPage />} />
                    <Route path="ai-recommendations" element={<AIRecommendations />} />
                    <Route path="logs" element={<SystemLogs />} />
                    <Route path="settings" element={<Settings />} />
                    <Route path="chat" element={<Navigate to="/admin/dashboard" replace />} />
                    <Route path="*" element={<Navigate to="dashboard" replace />} />
                  </Routes>
                </main>
              </div>
            </div>
          ) : <Navigate to="/login" />
        } />

        <Route path="/" element={!normalizedUserRole ? <Landing /> : (
          normalizedUserRole === 'student' ? <Navigate to="/student/overview" /> : 
          normalizedUserRole === 'supervisor' ? <Navigate to="/supervisor/dashboard" /> : 
          normalizedUserRole === 'dean' ? <Navigate to="/dean/dashboard" /> : 
          normalizedUserRole === 'admin' ? <Navigate to="/admin/dashboard" /> : <Landing />
        )} />
      </Routes>

      {/* Shared Premium Logout Modal */}
      {showLogoutConfirm && (
        <div className="modal-overlay" style={{position:'fixed', inset:0, background:'rgba(15,23,42,0.7)', backdropFilter:'blur(5px)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:99999}}>
          <div className="logout-modal" style={{background: isDark ? '#0f172a' : 'white', padding:'35px', borderRadius:'24px', width:'90%', maxWidth:'400px', textAlign:'center', boxShadow:'0 25px 50px -12px rgba(0,0,0,0.5)', border: isDark ? '1px solid #1e293b' : 'none', animation:'slideUp 0.3s ease-out'}}>
            <div style={{width:'60px', height:'60px', background: isDark ? 'rgba(239, 68, 68, 0.1)' : '#fee2e2', color:'#ef4444', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'28px', margin:'0 auto 20px auto'}}>🚪</div>
            <h3 style={{margin:'0 0 10px 0', fontSize:'22px', fontWeight:900, color: isDark ? '#f8fafc' : '#0f172a'}}>Sign Out?</h3>
            <p style={{margin:'0 0 30px 0', color:'#94a3b8', fontSize:'14px', fontWeight:600}}>Are you sure you want to securely log out of the GP Portal?</p>
            <div style={{display:'flex', gap:'15px'}}>
              <button onClick={() => setShowLogoutConfirm(false)} style={{flex:1, padding:'14px', background: isDark ? '#1e293b' : '#f1f5f9', border: isDark ? '1px solid #334155' : 'none', borderRadius:'12px', fontWeight:800, color: isDark ? '#f8fafc' : '#475569', cursor:'pointer'}}>Cancel</button>
              <button onClick={handleConfirmLogout} style={{flex:1, padding:'14px', background:'#ef4444', border:'none', borderRadius:'12px', fontWeight:800, color:'white', cursor:'pointer', boxShadow:'0 4px 10px rgba(239, 68, 68, 0.2)'}}>Yes, Sign Out</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
