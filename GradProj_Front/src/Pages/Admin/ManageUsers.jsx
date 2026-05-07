import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * 💡 Manage Users - Premium Master Edition (Dark Mode)
 * شاشة إدارة المستخدمين بصلاحيات الروت، تشمل فلاتر، نوافذ منبثقة تفاعلية، وتصدير PDF.
 */

const usersStyles = `
  .admin-users-container {
    padding: 20px 30px 60px 30px;
    font-family: 'Plus Jakarta Sans', -apple-system, sans-serif;
    color: #f8fafc;
    background: #0b1121;
    min-height: 100vh;
    animation: fadeInPage 0.4s ease-out;
    text-align: left;
  }

  @keyframes fadeInPage { from { opacity: 0; transform: translateY(15px); } to { opacity: 1; transform: translateY(0); } }

  /* --- Premium Header --- */
  .ad-header-box { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 30px; background: #0f172a; padding: 25px 30px; border-radius: 20px; border: 1px solid #1e293b; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.5); }
  .ad-kicker { color: #06b6d4; font-size: 13px; font-weight: 800; text-transform: uppercase; letter-spacing: 1.5px; margin: 0 0 5px 0; display: flex; align-items: center; gap: 8px;}
  .ad-kicker::before { content: ''; display: inline-block; width: 8px; height: 8px; background: #06b6d4; border-radius: 50%; box-shadow: 0 0 8px #06b6d4;}
  .ad-title { font-size: 32px; font-weight: 900; margin: 0; color: #f8fafc; letter-spacing: -1px; }
  
  .ad-header-actions { display: flex; gap: 12px; }
  .btn-ad-outline { background: #1e293b; border: 1px solid #334155; color: #f8fafc; padding: 12px 20px; border-radius: 12px; font-weight: 800; font-size: 13px; cursor: pointer; transition: 0.2s; display: flex; align-items: center; gap: 8px; }
  .btn-ad-outline:hover { background: #334155; border-color: #475569; transform: translateY(-2px); }
  .btn-ad-primary { background: linear-gradient(135deg, #06b6d4, #3b82f6); color: white; border: none; box-shadow: 0 4px 15px rgba(6, 182, 212, 0.3); }
  .btn-ad-primary:hover { box-shadow: 0 8px 25px rgba(6, 182, 212, 0.5); background: linear-gradient(135deg, #0891b2, #2563eb); transform: translateY(-2px); }

  /* --- Top KPI Cards --- */
  .ad-stats-bar { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin-bottom: 30px; }
  .ad-stat-pill { background: #0f172a; border: 1px solid #1e293b; border-radius: 20px; padding: 20px 25px; display: flex; align-items: center; gap: 18px; cursor: pointer; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); position: relative; overflow: hidden; }
  .ad-stat-pill:hover { transform: translateY(-5px); border-color: #3b82f6; box-shadow: 0 10px 20px -5px rgba(59, 130, 246, 0.2); }
  .ad-stat-pill.active-filter { border-color: #06b6d4; background: #172033; }
  .ad-icon-wrapper { width: 50px; height: 50px; border-radius: 14px; display: flex; align-items: center; justify-content: center; font-size: 22px; transition: 0.3s; background: #1e293b; }
  .ad-stat-pill:hover .ad-icon-wrapper { transform: scale(1.1); }
  
  .icon-cyan { color: #22d3ee; } .icon-purple { color: #c084fc; } .icon-emerald { color: #34d399; } .icon-rose { color: #fb7185; }
  .ad-stat-info h4 { margin: 0; font-size: 12px; color: #94a3b8; text-transform: uppercase; font-weight: 800; letter-spacing: 0.5px;}
  .ad-stat-info p { margin: 5px 0 0 0; font-size: 28px; font-weight: 900; color: #f8fafc; line-height: 1; }

  /* --- Toolbar --- */
  .ad-toolbar { display: flex; gap: 15px; background: #0f172a; padding: 15px; border-radius: 16px; border: 1px solid #1e293b; margin-bottom: 25px; box-shadow: 0 10px 20px -5px rgba(0,0,0,0.3); }
  .ad-search { flex-grow: 1; position: relative; display: flex; align-items: center; }
  .ad-search-icon { position: absolute; left: 15px; color: #64748b; }
  .ad-search input { width: 100%; padding: 12px 12px 12px 45px; border: 1px solid #334155; background: #1e293b; color: white; border-radius: 10px; font-size: 14px; font-weight: 600; outline: none; transition: 0.2s; box-sizing: border-box; font-family: inherit;}
  .ad-search input:focus { border-color: #06b6d4; box-shadow: 0 0 0 3px rgba(6, 182, 212, 0.15); }
  .ad-search input::placeholder { color: #64748b; }
  .ad-filter { padding: 10px 15px; border: 1px solid #334155; background: #1e293b; color: #f8fafc; border-radius: 10px; font-size: 13px; font-weight: 700; outline: none; cursor: pointer; min-width: 150px; font-family: inherit;}
  .ad-filter:focus { border-color: #06b6d4; }

  /* --- Table --- */
  .ad-table-card { background: #0f172a; border: 1px solid #1e293b; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.5); }
  .ad-table { width: 100%; border-collapse: collapse; text-align: left; }
  .ad-table th { padding: 18px 25px; background: #1e293b; font-size: 11px; font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px; border-bottom: 1px solid #334155; }
  .ad-table td { padding: 15px 25px; border-bottom: 1px solid #1e293b; font-size: 14px; font-weight: 600; color: #cbd5e1; vertical-align: middle; transition: 0.2s;}
  .ad-table tr:hover td { background: #172033; }
  .ad-table tr:last-child td { border-bottom: none; }

  /* User Profile Cell */
  .user-profile-wrapper { display: flex; align-items: center; gap: 15px; cursor: pointer; padding: 5px; border-radius: 12px; transition: 0.2s;}
  .user-profile-wrapper:hover { background: #1e293b; transform: translateX(5px); }
  .user-avatar { width: 40px; height: 40px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 16px; font-weight: 900; color: white; }
  .user-name { font-size: 15px; font-weight: 800; color: #f8fafc; margin-bottom: 2px;}
  .user-id { font-size: 12px; color: #64748b; font-weight: 700; }

  /* Badges */
  .role-badge { padding: 6px 12px; border-radius: 8px; font-size: 11px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.5px; border: 1px solid transparent; display: inline-block;}
  .role-admin { background: rgba(6, 182, 212, 0.1); color: #22d3ee; border-color: rgba(6, 182, 212, 0.2); }
  .role-dean { background: rgba(245, 158, 11, 0.1); color: #fbbf24; border-color: rgba(245, 158, 11, 0.2); }
  .role-supervisor { background: rgba(139, 92, 246, 0.1); color: #c084fc; border-color: rgba(139, 92, 246, 0.2); }
  .role-student { background: rgba(59, 130, 246, 0.1); color: #60a5fa; border-color: rgba(59, 130, 246, 0.2); }

  .status-badge { display: inline-flex; align-items: center; gap: 5px; font-size: 12px; font-weight: 800; }
  .status-active { color: #34d399; }
  .status-active::before { content:''; width:8px; height:8px; border-radius:50%; background:#34d399; box-shadow: 0 0 8px #34d399;}
  .status-suspended { color: #fb7185; }
  .status-suspended::before { content:''; width:8px; height:8px; border-radius:50%; background:#fb7185; box-shadow: 0 0 8px #fb7185;}

  /* Action Buttons */
  .actions-cell { display: flex; gap: 8px; }
  .btn-icon { width: 35px; height: 35px; border-radius: 10px; background: #1e293b; border: 1px solid #334155; color: #94a3b8; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: 0.2s; }
  .btn-icon:hover { background: #334155; color: #f8fafc; border-color: #475569; transform: translateY(-2px); }
  .btn-icon.danger:hover { background: rgba(239, 68, 68, 0.1); color: #f87171; border-color: rgba(239, 68, 68, 0.3); }

  /* --- Modals --- */
  .modal-overlay { position: fixed; inset: 0; background: rgba(2, 6, 23, 0.8); backdrop-filter: blur(8px); display: flex; align-items: center; justify-content: center; z-index: 1000; animation: fadeIn 0.2s; }
  .modal-content { background: #0f172a; border: 1px solid #1e293b; border-radius: 24px; width: 90%; max-width: 500px; overflow: hidden; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5); animation: slideUp 0.3s ease-out; }
  .modal-header { padding: 25px 30px; border-bottom: 1px solid #1e293b; display: flex; justify-content: space-between; align-items: center; }
  .modal-header h2 { margin: 0; font-size: 20px; font-weight: 900; color: #f8fafc; }
  .modal-close { background: none; border: none; color: #94a3b8; font-size: 20px; cursor: pointer; transition: 0.2s; }
  .modal-close:hover { color: #f8fafc; }
  .modal-body { padding: 30px; }
  
  .form-group { margin-bottom: 20px; }
  .form-group label { display: block; margin-bottom: 8px; font-size: 13px; font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px;}
  .form-control { width: 100%; padding: 12px 15px; background: #1e293b; border: 1px solid #334155; border-radius: 10px; color: white; font-size: 14px; outline: none; transition: 0.2s; box-sizing: border-box; font-family: inherit;}
  .form-control:focus { border-color: #06b6d4; box-shadow: 0 0 0 3px rgba(6, 182, 212, 0.15); }
  
  .modal-footer { padding: 20px 30px; background: #1e293b; border-top: 1px solid #334155; display: flex; justify-content: flex-end; gap: 10px; }

  /* 💡 Print Media Magic */
  @media print {
    .sidebar-wrapper, .top-header, .ad-header-actions, .ad-toolbar, .actions-cell, .modal-overlay { display: none !important; }
    .admin-users-container { background: white !important; color: black !important; padding: 0; min-height: auto; }
    .ad-header-box { border: none; box-shadow: none; padding: 0; margin-bottom: 30px; background: transparent; }
    .ad-title { color: black !important; font-size: 28px; }
    .ad-kicker { color: black !important; } .ad-kicker::before { display: none; }
    .ad-stats-bar { grid-template-columns: repeat(4, 1fr); gap: 10px; }
    .ad-stat-pill { border: 1px solid #ccc !important; box-shadow: none !important; padding: 15px; background: white !important; }
    .ad-stat-info p, .ad-stat-info h4 { color: black !important; }
    .ad-table-card { border: 1px solid #ccc !important; box-shadow: none !important; border-radius: 0; background: white !important; }
    .ad-table th { background: #f1f5f9 !important; color: black !important; border-bottom: 2px solid #aaa !important; }
    .ad-table td { color: black !important; border-bottom: 1px solid #ccc !important; background: white !important;}
    .user-name, .user-id { color: black !important; }
    body { background: white !important; -webkit-print-color-adjust: exact; }
  }
`;

const ManageUsers = () => {
  const navigate = useNavigate();

  // States
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  
  // Modals States
  const [showAddModal, setShowAddModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(null); // Holds user object

  // Mock Data
  const [users, setUsers] = useState([
    { id: 'ADM-001', name: 'System Admin', email: 'admin@root.sys', role: 'Admin', status: 'Active', lastLogin: 'Just now', color: '#06b6d4' },
    { id: 'DEAN-01', name: 'Prof. Salem', email: 'dean@bau.edu', role: 'Dean', status: 'Active', lastLogin: 'Yesterday', color: '#f59e0b' },
    { id: 'FAC-091', name: 'Dr. Ahmad Ali', email: 'ahmad@bau.edu', role: 'Supervisor', status: 'Active', lastLogin: '2 hours ago', color: '#8b5cf6' },
    { id: 'FAC-092', name: 'Dr. Sarah Khaled', email: 'sarah@bau.edu', role: 'Supervisor', status: 'Active', lastLogin: '5 hours ago', color: '#ec4899' },
    { id: 'ST-20221001', name: 'Ali Mansour', email: 'ali@student.bau.edu', role: 'Student', status: 'Active', lastLogin: '10 mins ago', color: '#3b82f6' },
    { id: 'ST-20222005', name: 'Omar Khalid', email: 'omar@student.bau.edu', role: 'Student', status: 'Suspended', lastLogin: '2 weeks ago', color: '#ef4444' },
    { id: 'ST-20223011', name: 'Leen Rami', email: 'leen@student.bau.edu', role: 'Student', status: 'Active', lastLogin: '1 day ago', color: '#10b981' },
  ]);

  // Filtering Logic
  const filteredUsers = users.filter(u => {
    const matchSearch = u.name.toLowerCase().includes(searchTerm.toLowerCase()) || u.id.toLowerCase().includes(searchTerm.toLowerCase()) || u.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchRole = roleFilter === 'All' || u.role === roleFilter;
    const matchStatus = statusFilter === 'All' || u.status === statusFilter;
    return matchSearch && matchRole && matchStatus;
  });

  // Handlers (No Dead Buttons)
  const handleExportPDF = () => {
    window.print();
  };

  const handleToggleStatus = (userId) => {
    setUsers(users.map(u => {
      if (u.id === userId) {
        const newStatus = u.status === 'Active' ? 'Suspended' : 'Active';
        alert(`User ${u.name} is now ${newStatus}.`);
        return { ...u, status: newStatus };
      }
      return u;
    }));
  };

  const handleDeleteUser = (userId, userName) => {
    if (window.confirm(`⚠️ DANGER: Are you sure you want to completely delete ${userName} from the system? This action is irreversible.`)) {
      setUsers(users.filter(u => u.id !== userId));
      setShowProfileModal(null);
    }
  };

  const handleResetPassword = (userName) => {
    alert(`🔑 Password reset link has been sent to ${userName}'s email.`);
  };

  const handleSaveNewUser = (e) => {
    e.preventDefault();
    alert('✅ New user has been created successfully!');
    setShowAddModal(false);
  };

  // Helpers
  const getRoleClass = (role) => {
    if(role === 'Admin') return 'role-admin';
    if(role === 'Dean') return 'role-dean';
    if(role === 'Supervisor') return 'role-supervisor';
    return 'role-student';
  };

  return (
    <div className="admin-users-container">
      <style>{usersStyles}</style>

      {/* Header */}
      <div className="ad-header-box">
        <div>
          <p className="ad-kicker">Access Control & Security</p>
          <h1 className="ad-title">User Management 👥</h1>
        </div>
        <div className="ad-header-actions">
          <button className="btn-ad-outline" onClick={() => navigate('/admin/dashboard')}>← Back</button>
          <button className="btn-ad-outline btn-ad-primary" onClick={() => setShowAddModal(true)}>
            <span style={{fontSize:'16px'}}>+</span> Add New User
          </button>
          <button className="btn-ad-outline" onClick={handleExportPDF}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
            Export PDF
          </button>
        </div>
      </div>

      {/* KPI Cards (Clickable Filters) */}
      <div className="ad-stats-bar">
        <div className={`ad-stat-pill ${statusFilter === 'All' && roleFilter === 'All' ? 'active-filter' : ''}`} onClick={() => {setStatusFilter('All'); setRoleFilter('All');}}>
          <div className="ad-icon-wrapper icon-cyan">👥</div>
          <div className="ad-stat-info"><h4>Total Users</h4><p>{users.length}</p></div>
        </div>
        <div className={`ad-stat-pill ${roleFilter === 'Student' ? 'active-filter' : ''}`} onClick={() => {setRoleFilter('Student'); setStatusFilter('All');}}>
          <div className="ad-icon-wrapper icon-purple">🎓</div>
          <div className="ad-stat-info"><h4>Students</h4><p>{users.filter(u => u.role === 'Student').length}</p></div>
        </div>
        <div className={`ad-stat-pill ${roleFilter === 'Supervisor' ? 'active-filter' : ''}`} onClick={() => {setRoleFilter('Supervisor'); setStatusFilter('All');}}>
          <div className="ad-icon-wrapper icon-emerald">👨‍🏫</div>
          <div className="ad-stat-info"><h4>Faculty Staff</h4><p>{users.filter(u => u.role === 'Supervisor' || u.role === 'Dean').length}</p></div>
        </div>
        <div className={`ad-stat-pill ${statusFilter === 'Suspended' ? 'active-filter' : ''}`} onClick={() => {setStatusFilter('Suspended'); setRoleFilter('All');}}>
          <div className="ad-icon-wrapper icon-rose">⚠️</div>
          <div className="ad-stat-info"><h4>Suspended</h4><p>{users.filter(u => u.status === 'Suspended').length}</p></div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="ad-toolbar">
        <div className="ad-search">
          <span className="ad-search-icon">🔍</span>
          <input type="text" placeholder="Search by name, ID, or email..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          {searchTerm && <button onClick={()=>setSearchTerm('')} style={{position:'absolute', right:'15px', background:'none', border:'none', color:'#fb7185', fontWeight:800, cursor:'pointer'}}>✕</button>}
        </div>
        <select className="ad-filter" value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
          <option value="All">All Roles</option>
          <option value="Student">Student</option>
          <option value="Supervisor">Supervisor</option>
          <option value="Dean">Dean</option>
          <option value="Admin">System Admin</option>
        </select>
        <select className="ad-filter" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="All">All Statuses</option>
          <option value="Active">Active</option>
          <option value="Suspended">Suspended</option>
        </select>
      </div>

      {/* Table */}
      <div className="ad-table-card">
        <table className="ad-table">
          <thead>
            <tr><th>User Details</th><th>Role</th><th>Status</th><th>Last Login</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {filteredUsers.length > 0 ? filteredUsers.map(user => (
              <tr key={user.id}>
                <td>
                  <div className="user-profile-wrapper" onClick={() => setShowProfileModal(user)} title="View User Profile">
                    <div className="user-avatar" style={{background: user.color}}>{user.name.charAt(0)}</div>
                    <div>
                      <div className="user-name">{user.name}</div>
                      <div className="user-id">{user.id} • {user.email}</div>
                    </div>
                  </div>
                </td>
                <td><span className={`role-badge ${getRoleClass(user.role)}`}>{user.role}</span></td>
                <td><span className={`status-badge ${user.status === 'Active' ? 'status-active' : 'status-suspended'}`}>{user.status}</span></td>
                <td>{user.lastLogin}</td>
                <td>
                  <div className="actions-cell">
                    <button className="btn-icon" title="Edit User" onClick={() => setShowProfileModal(user)}>✏️</button>
                    <button className={`btn-icon ${user.status === 'Active' ? 'danger' : ''}`} title={user.status === 'Active' ? 'Suspend User' : 'Activate User'} onClick={() => handleToggleStatus(user.id)}>
                      {user.status === 'Active' ? '🛑' : '✅'}
                    </button>
                    <button className="btn-icon danger" title="Delete User" onClick={() => handleDeleteUser(user.id, user.name)}>🗑️</button>
                  </div>
                </td>
              </tr>
            )) : (
              <tr><td colSpan="5" style={{textAlign: 'center', padding: '50px', color: '#64748b'}}>No users found matching your criteria.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* 🚀 MODAL: Add New User */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Add New User</h2>
              <button className="modal-close" onClick={() => setShowAddModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSaveNewUser}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Full Name</label>
                  <input type="text" className="form-control" placeholder="e.g., John Doe" required />
                </div>
                <div className="form-group">
                  <label>Email Address</label>
                  <input type="email" className="form-control" placeholder="john@bau.edu" required />
                </div>
                <div style={{display: 'flex', gap: '15px'}}>
                  <div className="form-group" style={{flex: 1}}>
                    <label>Role</label>
                    <select className="form-control" required>
                      <option value="Student">Student</option>
                      <option value="Supervisor">Supervisor</option>
                      <option value="Dean">Dean Office</option>
                      <option value="Admin">System Admin</option>
                    </select>
                  </div>
                  <div className="form-group" style={{flex: 1}}>
                    <label>ID Number</label>
                    <input type="text" className="form-control" placeholder="e.g., 20221001" required />
                  </div>
                </div>
                <p style={{fontSize: '12px', color: '#64748b', margin: 0}}>* A temporary password will be sent to the user's email.</p>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-ad-outline" onClick={() => setShowAddModal(false)}>Cancel</button>
                <button type="submit" className="btn-ad-outline btn-ad-primary">Save User</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 🚀 MODAL: View/Edit User Profile */}
      {showProfileModal && (
        <div className="modal-overlay" onClick={() => setShowProfileModal(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header" style={{borderBottom: 'none', paddingBottom: 0}}>
              <button className="modal-close" style={{marginLeft: 'auto'}} onClick={() => setShowProfileModal(null)}>✕</button>
            </div>
            <div className="modal-body" style={{textAlign: 'center', paddingTop: 0}}>
              <div style={{width: '90px', height: '90px', borderRadius: '24px', background: showProfileModal.color, color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '36px', fontWeight: 900, margin: '0 auto 15px auto', boxShadow: '0 10px 20px rgba(0,0,0,0.3)'}}>
                {showProfileModal.name.charAt(0)}
              </div>
              <h2 style={{margin: '0 0 5px 0', fontSize: '24px', color: '#f8fafc', fontWeight: 900}}>{showProfileModal.name}</h2>
              <span className={`role-badge ${getRoleClass(showProfileModal.role)}`} style={{marginBottom: '20px'}}>{showProfileModal.role}</span>
              
              <div style={{background: '#1e293b', borderRadius: '16px', padding: '20px', marginTop: '20px', textAlign: 'left'}}>
                <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '15px', borderBottom: '1px solid #334155', paddingBottom: '10px'}}>
                  <span style={{color: '#94a3b8', fontSize: '13px', fontWeight: 700}}>ID Number</span>
                  <span style={{color: '#f8fafc', fontSize: '14px', fontWeight: 800}}>{showProfileModal.id}</span>
                </div>
                <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '15px', borderBottom: '1px solid #334155', paddingBottom: '10px'}}>
                  <span style={{color: '#94a3b8', fontSize: '13px', fontWeight: 700}}>Email Address</span>
                  <span style={{color: '#22d3ee', fontSize: '14px', fontWeight: 800}}>{showProfileModal.email}</span>
                </div>
                <div style={{display: 'flex', justifyContent: 'space-between'}}>
                  <span style={{color: '#94a3b8', fontSize: '13px', fontWeight: 700}}>Account Status</span>
                  <span className={`status-badge ${showProfileModal.status === 'Active' ? 'status-active' : 'status-suspended'}`}>{showProfileModal.status}</span>
                </div>
              </div>

              <div style={{display: 'flex', gap: '10px', marginTop: '25px'}}>
                <button className="btn-ad-outline" style={{flex: 1, justifyContent: 'center'}} onClick={() => handleResetPassword(showProfileModal.name)}>🔑 Reset Pass</button>
                <button className="btn-ad-outline" style={{flex: 1, justifyContent: 'center'}} onClick={() => { handleToggleStatus(showProfileModal.id); setShowProfileModal(null);}}>
                  {showProfileModal.status === 'Active' ? '🛑 Suspend' : '✅ Activate'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default ManageUsers;