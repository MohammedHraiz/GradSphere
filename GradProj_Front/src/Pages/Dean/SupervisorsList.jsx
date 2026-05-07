import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const premiumSupervisorsStyles = `
  .dean-sup-container { padding: 20px 30px 60px 30px; font-family: 'Plus Jakarta Sans', -apple-system, sans-serif; color: #0f172a; animation: fadeInPage 0.4s ease-out; text-align: left; background: #f8fafc; min-height: 100vh; }
  @keyframes fadeInPage { from { opacity: 0; transform: translateY(15px); } to { opacity: 1; transform: translateY(0); } }

  .ds-header-box { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 30px; background: white; padding: 25px 30px; border-radius: 20px; border: 1px solid #e2e8f0; box-shadow: 0 4px 15px -5px rgba(0,0,0,0.02); }
  .ds-kicker { color: #d97706; font-size: 13px; font-weight: 800; text-transform: uppercase; letter-spacing: 1.5px; margin: 0 0 5px 0; }
  .ds-title { font-size: 32px; font-weight: 900; margin: 0; color: #0f172a; letter-spacing: -1px; }
  .ds-header-actions { display: flex; gap: 12px; }
  .btn-ds-outline { background: white; border: 1px solid #cbd5e1; color: #475569; padding: 12px 20px; border-radius: 12px; font-weight: 800; font-size: 13px; cursor: pointer; transition: 0.2s; display: flex; align-items: center; gap: 8px; }
  .btn-ds-outline:hover { background: #f8fafc; border-color: #94a3b8; color: #0f172a; transform: translateY(-2px); }

  .ds-stats-bar { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin-bottom: 30px; }
  .ds-stat-pill { background: white; border: 2px solid #e2e8f0; border-radius: 20px; padding: 20px 25px; display: flex; align-items: center; gap: 18px; cursor: pointer; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); box-shadow: 0 4px 6px -1px rgba(0,0,0,0.02); position: relative; overflow: hidden; }
  .ds-stat-pill:hover { transform: translateY(-6px); box-shadow: 0 15px 30px -5px rgba(0,0,0,0.08); border-color: #cbd5e1; }
  .ds-stat-pill.active-filter { border-color: #0f172a; box-shadow: 0 10px 20px -5px rgba(15, 23, 42, 0.15); }
  .ds-stat-pill.active-filter::before { content: ''; position: absolute; top: 0; left: 0; width: 100%; height: 4px; background: #0f172a; }
  .ds-icon-wrapper { width: 50px; height: 50px; border-radius: 14px; display: flex; align-items: center; justify-content: center; font-size: 24px; transition: 0.3s; }
  .ds-stat-pill:hover .ds-icon-wrapper { transform: scale(1.1); }
  .ds-icon-wrapper.total { background: #f1f5f9; color: #475569; }
  .ds-icon-wrapper.avail { background: #d1fae5; color: #059669; }
  .ds-icon-wrapper.full { background: #fef3c7; color: #d97706; }
  .ds-icon-wrapper.over { background: #fee2e2; color: #ef4444; }
  .ds-stat-info h4 { margin: 0; font-size: 13px; color: #64748b; text-transform: uppercase; font-weight: 800; letter-spacing: 0.5px;}
  .ds-stat-info p { margin: 5px 0 0 0; font-size: 32px; font-weight: 900; color: #0f172a; line-height: 1; }

  .ds-toolbar { display: flex; gap: 15px; background: white; padding: 15px; border-radius: 16px; border: 1px solid #e2e8f0; margin-bottom: 25px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.02); }
  .ds-search { flex-grow: 1; position: relative; display: flex; align-items: center; }
  .ds-search-icon { position: absolute; left: 15px; color: #94a3b8; }
  .ds-search input { width: 100%; padding: 12px 12px 12px 45px; border: 1px solid #e2e8f0; border-radius: 10px; font-size: 14px; font-weight: 600; outline: none; transition: 0.2s; box-sizing: border-box; font-family: inherit;}
  .ds-search input:focus { border-color: #0f172a; box-shadow: 0 0 0 3px rgba(15, 23, 42, 0.1); }
  .ds-filter { padding: 10px 15px; border: 1px solid #e2e8f0; border-radius: 10px; font-size: 13px; font-weight: 700; color: #475569; background: #f8fafc; outline: none; cursor: pointer; min-width: 140px; font-family: inherit;}

  .ds-table-card { background: white; border: 1px solid #e2e8f0; border-radius: 20px; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.02); overflow: hidden; }
  .sup-table { width: 100%; border-collapse: collapse; }
  .sup-table th { padding: 18px 25px; background: #f8fafc; font-size: 11px; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 1px; border-bottom: 1px solid #e2e8f0; text-align: left;}
  .sup-table td { padding: 20px 25px; border-bottom: 1px solid #f1f5f9; font-size: 14px; font-weight: 600; color: #1e293b; vertical-align: middle; }
  .sup-table tr:hover td { background: #fafafa; }

  .sup-profile-cell { display: flex; align-items: center; gap: 15px; padding: 10px 15px; border-radius: 14px; border: 1px solid transparent; transition: 0.2s; cursor: pointer; }
  .sup-avatar-large { width: 44px; height: 44px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 16px; font-weight: 800; color: white; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
  .sup-name { font-size: 15px; font-weight: 900; color: #0f172a; margin-bottom: 2px;}
  .sup-id { font-size: 12px; color: #94a3b8; font-weight: 700; }

  .smart-hover-card {
    position: absolute; top: 50%; left: calc(100% + 15px); transform: translateY(-50%) translateX(-10px);
    background: white; border: 1px solid #e2e8f0; border-radius: 16px; width: 280px; padding: 20px;
    box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1);
    opacity: 0; visibility: hidden; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); z-index: 100; pointer-events: none;
  }
  .smart-hover-card::after {
    content: ''; position: absolute; top: 50%; left: -6px; transform: translateY(-50%) rotate(45deg);
    width: 12px; height: 12px; background: white; border-left: 1px solid #e2e8f0; border-bottom: 1px solid #e2e8f0;
  }
  .sup-profile-wrapper { position: relative; display: inline-block; }
  .sup-profile-wrapper:hover .smart-hover-card { opacity: 1; visibility: visible; transform: translateY(-50%) translateX(0); }

  .hc-header { display: flex; align-items: center; gap: 15px; margin-bottom: 15px; }
  .hc-name { font-size: 15px; font-weight: 900; color: #0f172a; margin: 0 0 2px 0; }
  .hc-role { font-size: 12px; font-weight: 700; color: #64748b; margin: 0; }
  .hc-divider { height: 1px; background: #f1f5f9; margin: 0 0 15px 0; }
  .hc-stats-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
  .hc-stat-box { background: #f8fafc; padding: 10px; border-radius: 10px; border: 1px solid #f1f5f9; text-align: center; }
  .hc-stat-title { font-size: 10px; font-weight: 800; color: #94a3b8; text-transform: uppercase; margin-bottom: 4px; }
  .hc-stat-value { font-size: 16px; font-weight: 900; color: #0f172a; }

  .ds-progress-container { width: 100%; max-width: 140px; }
  .ds-progress-text { display: flex; justify-content: space-between; font-size: 11px; font-weight: 800; margin-bottom: 5px; color: #475569;}
  .ds-progress-track { width: 100%; height: 6px; background: #e2e8f0; border-radius: 4px; overflow: hidden; }
  .ds-progress-fill { height: 100%; border-radius: 4px; transition: 0.5s ease-out; }
  .cap-avail { background: #10b981; }
  .cap-full { background: #f59e0b; }
  .cap-over { background: #ef4444; }

  .rating-badge { display: inline-flex; align-items: center; gap: 4px; background: #fffbeb; color: #d97706; padding: 6px 10px; border-radius: 8px; font-weight: 900; font-size: 13px; border: 1px solid #fde68a;}
  .ds-badge { padding: 6px 12px; border-radius: 8px; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px;}
  .badge-avail { background: #d1fae5; color: #059669; }
  .badge-full { background: #fef3c7; color: #d97706; }
  .badge-over { background: #fee2e2; color: #ef4444; }

  .btn-view-text { background: #f8fafc; border: 1px solid #e2e8f0; color: #0f172a; font-weight: 800; font-size: 12px; cursor: pointer; transition: 0.2s; padding: 8px 16px; border-radius: 10px; }
  .btn-view-text:hover { background: #0f172a; color: white; border-color: #0f172a; transform: translateY(-2px); }

  /* 💡 ميزة التصدير السحرية PDF */
  @media print {
    .sidebar-wrapper, .top-header, .ds-header-actions, .ds-toolbar, .btn-action-icon, .btn-view-text, .smart-hover-card, .modal-overlay, .btn-ds-outline { 
      display: none !important; 
    }
    .dean-sup-container { padding: 0; background: white; }
    .ds-header-box { border: none; box-shadow: none; padding: 0; margin-bottom: 50px; text-align: center; display: block; }
    .ds-title { font-size: 28px; }
    .ds-stats-bar { grid-template-columns: repeat(4, 1fr); gap: 10px; }
    .ds-stat-pill { border: 1px solid #eee; box-shadow: none; padding: 15px; cursor: default; }
    .ds-table-card { border: 1px solid #eee; box-shadow: none; border-radius: 0; }
    .sup-table th { background: #eee !important; color: black; border: 1px solid #ddd; }
    body { background: white !important; -webkit-print-color-adjust: exact; }
  }

  /* MODAL STYLES */
  .modal-overlay { position: fixed; inset: 0; background: rgba(15, 23, 42, 0.6); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: 1000; animation: fadeIn 0.2s; }
  .modal-content { background: white; border-radius: 24px; width: 90%; max-width: 600px; overflow: hidden; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25); animation: slideUp 0.3s ease-out; }
  .modal-header-bg { background: linear-gradient(135deg, #0f172a, #1e293b); padding: 40px 30px 20px 30px; color: white; display: flex; gap: 20px; position: relative;}
  .modal-close-btn { position: absolute; top: 15px; right: 15px; background: rgba(255,255,255,0.1); border: none; color: white; width: 30px; height: 30px; border-radius: 50%; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: 0.2s; }
  .modal-avatar { width: 80px; height: 80px; border-radius: 20px; display: flex; align-items: center; justify-content: center; font-size: 32px; font-weight: 900; background: white; color: #0f172a; box-shadow: 0 10px 15px rgba(0,0,0,0.2); border: 4px solid #1e293b; margin-top: -10px;}
  .modal-body { padding: 30px; max-height: 60vh; overflow-y: auto;}
  .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px; }
  .info-item { background: #f8fafc; padding: 15px; border-radius: 14px; border: 1px solid #f1f5f9;}
  .info-label { font-size: 11px; font-weight: 800; color: #94a3b8; text-transform: uppercase; margin-bottom: 5px; }
  .info-val { font-size: 14px; font-weight: 700; color: #0f172a; }
  .modal-list-title { font-size: 16px; font-weight: 900; color: #0f172a; margin: 0 0 15px 0; border-bottom: 2px solid #f1f5f9; padding-bottom: 10px;}
  
  /* 💡 الميزة المفقودة: تأثير الـ Hover على قائمة المشاريع داخل الكارد */
  .proj-list { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 10px; }
  .proj-item { display: flex; align-items: center; justify-content: space-between; font-size: 14px; font-weight: 700; color: #334155; background: white; border: 1px solid #e2e8f0; padding: 12px 15px; border-radius: 12px; cursor: pointer; transition: 0.2s; }
  .proj-item:hover { background: #f8fafc; border-color: #4f46e5; color: #4f46e5; transform: translateX(4px); box-shadow: 0 4px 6px rgba(0,0,0,0.02);}
  .proj-item-name { display: flex; align-items: center; gap: 10px; }
  .proj-item-name::before { content: '📁'; }
`;

const SupervisorsList = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [deptFilter, setDeptFilter] = useState('All');
  const [selectedSup, setSelectedSup] = useState(null);

  useEffect(() => {
    if (location.state && location.state.targetSup) {
      setSearchTerm(location.state.targetSup);
    }
  }, [location]);

  const allSupervisors = [
    { id: 'FAC-091', name: 'Dr. Ahmad Ali', dept: 'Software Eng.', projects: 4, maxProjects: 5, rating: 4.8, email: 'ahmad@bau.edu', role: 'Assoc. Professor', joined: '2015', office: 'IT-302', phone: '+962 79 111 2222', activeProjectsList: ['Smart University Campus', 'E-Learning Mobile App', 'Library Management System', 'Faculty Rating System'] },
    { id: 'FAC-092', name: 'Dr. Sarah Khaled', dept: 'AI / ML', projects: 5, maxProjects: 5, rating: 4.9, email: 'sarah@bau.edu', role: 'Assistant Prof.', joined: '2018', office: 'IT-410', phone: '+962 79 333 4444', activeProjectsList: ['AI Academic Advisor', 'Medical Image Predictor', 'NLP Chatbot', 'Stock Market AI', 'Traffic Analyzer'] },
    { id: 'FAC-093', name: 'Dr. Omar Zaid', dept: 'Cybersecurity', projects: 6, maxProjects: 5, rating: 4.5, email: 'omar@bau.edu', role: 'Professor', joined: '2010', office: 'IT-105', phone: '+962 79 555 6666', activeProjectsList: ['Blockchain Voting', 'Network Intrusion', 'Crypto Wallet App', 'Phishing Detector', 'Zero-Trust Architecture', 'Ransomware Blocker'] },
    { id: 'FAC-094', name: 'Dr. Mona Rami', dept: 'Software Eng.', projects: 2, maxProjects: 5, rating: 4.2, email: 'mona@bau.edu', role: 'Assistant Prof.', joined: '2021', office: 'IT-220', phone: '+962 79 777 8888', activeProjectsList: ['E-Commerce Platform', 'Student Portal Redesign'] },
    { id: 'FAC-095', name: 'Dr. Youssef Fadel', dept: 'IoT', projects: 1, maxProjects: 4, rating: 3.8, email: 'youssef@bau.edu', role: 'Lecturer', joined: '2023', office: 'IT-112', phone: '+962 79 999 0000', activeProjectsList: ['Smart Home Automation'] },
  ];

  const getSupervisorStatus = (projects, max) => {
    if (projects > max) return 'Overloaded';
    if (projects === max) return 'Full Capacity';
    return 'Available';
  };

  const filteredSupervisors = allSupervisors.filter(sup => {
    const status = getSupervisorStatus(sup.projects, sup.maxProjects);
    const matchSearch = sup.name.toLowerCase().includes(searchTerm.toLowerCase()) || sup.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = statusFilter === 'All' || status === statusFilter;
    const matchDept = deptFilter === 'All' || sup.dept === deptFilter;
    return matchSearch && matchStatus && matchDept;
  });

  const handleSaveAsPDF = () => {
    window.print();
  };

  const getAvatarColor = (dept) => {
    if(dept.includes('Software')) return '#3b82f6';
    if(dept.includes('AI')) return '#ec4899';
    if(dept.includes('Cyber')) return '#8b5cf6';
    return '#10b981';
  };

  const getStatusBadgeClass = (status) => { return status === 'Available' ? 'badge-avail' : status === 'Full Capacity' ? 'badge-full' : 'badge-over'; };
  const getCapacityBarClass = (projects, max) => { const r = projects/max; return r > 1 ? 'cap-over' : r === 1 ? 'cap-full' : 'cap-avail'; };

  return (
    <div className="dean-sup-container">
      <style>{premiumSupervisorsStyles}</style>
      
      <div className="ds-header-box">
        <div>
          <p className="ds-kicker">Human Resources & Faculty Load</p>
          <h1 className="ds-title">Supervisors Directory</h1>
        </div>
        <div className="ds-header-actions">
          <button className="btn-ds-outline" onClick={() => navigate('/dean/dashboard')}>← Back</button>
          <button className="btn-ds-outline" style={{background: '#0f172a', color: 'white', borderColor: '#0f172a'}} onClick={handleSaveAsPDF}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
            Save as PDF
          </button>
        </div>
      </div>

      <div className="ds-stats-bar">
        <div className={`ds-stat-pill ${statusFilter === 'All' ? 'active-filter' : ''}`} onClick={() => setStatusFilter('All')}>
          <div className="ds-icon-wrapper total">👨‍🏫</div>
          <div className="ds-stat-info"><h4>Total Faculty</h4><p>{allSupervisors.length}</p></div>
        </div>
        <div className={`ds-stat-pill ${statusFilter === 'Available' ? 'active-filter' : ''}`} onClick={() => setStatusFilter('Available')}>
          <div className="ds-icon-wrapper avail">✅</div>
          <div className="ds-stat-info"><h4>Available</h4><p>{allSupervisors.filter(s => getSupervisorStatus(s.projects, s.maxProjects) === 'Available').length}</p></div>
        </div>
        <div className={`ds-stat-pill ${statusFilter === 'Full Capacity' ? 'active-filter' : ''}`} onClick={() => setStatusFilter('Full Capacity')}>
          <div className="ds-icon-wrapper full">⚖️</div>
          <div className="ds-stat-info"><h4>Full</h4><p>{allSupervisors.filter(s => getSupervisorStatus(s.projects, s.maxProjects) === 'Full Capacity').length}</p></div>
        </div>
        <div className={`ds-stat-pill ${statusFilter === 'Overloaded' ? 'active-filter' : ''}`} onClick={() => setStatusFilter('Overloaded')}>
          <div className="ds-icon-wrapper over">⚠️</div>
          <div className="ds-stat-info"><h4>Overloaded</h4><p>{allSupervisors.filter(s => getSupervisorStatus(s.projects, s.maxProjects) === 'Overloaded').length}</p></div>
        </div>
      </div>

      <div className="ds-toolbar">
        <div className="ds-search">
          <span className="ds-search-icon">🔍</span>
          <input type="text" placeholder="Search supervisors..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>
        <select className="ds-filter" value={deptFilter} onChange={(e) => setDeptFilter(e.target.value)}>
          <option value="All">All Departments</option>
          <option value="Software Eng.">Software Eng.</option>
          <option value="AI / ML">AI / ML</option>
          <option value="Cybersecurity">Cybersecurity</option>
        </select>
      </div>

      <div className="ds-table-card">
        <table className="sup-table">
          <thead>
            <tr><th>Supervisor Details</th><th>Department</th><th>Load</th><th>Rating</th><th>Status</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {filteredSupervisors.map(sup => {
              const status = getSupervisorStatus(sup.projects, sup.maxProjects);
              const progressPercentage = Math.min((sup.projects / sup.maxProjects) * 100, 100); 
              const initials = sup.name.split(' ')[1].charAt(0) + (sup.name.split(' ')[2]?.charAt(0) || '');
              
              return (
                <tr key={sup.id}>
                  <td>
                    <div className="sup-profile-wrapper">
                      <div className="sup-profile-cell" onClick={() => setSelectedSup(sup)}>
                        <div className="sup-avatar-large" style={{background: getAvatarColor(sup.dept)}}>{initials}</div>
                        <div><div className="sup-name">{sup.name}</div><div className="sup-id">{sup.id}</div></div>
                      </div>
                      <div className="smart-hover-card">
                         <div className="hc-header">
                            <div style={{width: '45px', height:'45px', borderRadius:'12px', background: getAvatarColor(sup.dept), color:'white', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:800}}>{initials}</div>
                            <div><h4 className="hc-name">{sup.name}</h4><p className="hc-role">{sup.role}</p></div>
                         </div>
                         <div className="hc-divider"></div>
                         <div className="hc-stats-grid"><div className="hc-stat-box"><div className="hc-stat-title">Active</div><div className="hc-stat-value">{sup.projects}</div></div><div className="hc-stat-box"><div className="hc-stat-title">Rating</div><div className="hc-stat-value">⭐ {sup.rating}</div></div></div>
                      </div>
                    </div>
                  </td>
                  <td style={{fontWeight: 700}}>{sup.dept}</td>
                  <td>
                    <div className="ds-progress-container">
                      <div className="ds-progress-text"><span>{sup.projects}/{sup.maxProjects}</span></div>
                      <div className="ds-progress-track"><div className={`ds-progress-fill ${getCapacityBarClass(sup.projects, sup.maxProjects)}`} style={{width: `${progressPercentage}%`}}></div></div>
                    </div>
                  </td>
                  <td><span className="rating-badge">⭐ {sup.rating}</span></td>
                  <td><span className={`ds-badge ${getStatusBadgeClass(status)}`}>{status}</span></td>
                  <td><button className="btn-view-text" onClick={() => setSelectedSup(sup)}>Profile</button></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {selectedSup && (
        <div className="modal-overlay" onClick={() => setSelectedSup(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-bg">
              <button className="modal-close-btn" onClick={() => setSelectedSup(null)}>✕</button>
              <div className="modal-avatar" style={{color: getAvatarColor(selectedSup.dept)}}>{selectedSup.name.split(' ')[1].charAt(0)}</div>
              <div style={{marginTop: '10px'}}><h2 style={{margin: '0', fontSize: '24px'}}>{selectedSup.name}</h2><p style={{margin: 0, opacity: 0.8}}>{selectedSup.role}</p></div>
            </div>
            <div className="modal-body">
              <div className="info-grid">
                <div className="info-item"><div className="info-label">Email</div><div className="info-val">{selectedSup.email}</div></div>
                <div className="info-item"><div className="info-label">Office</div><div className="info-val">{selectedSup.office}</div></div>
              </div>
              <h3 className="modal-list-title">Supervised Projects ({selectedSup.activeProjectsList.length})</h3>
              <ul className="proj-list">
                {selectedSup.activeProjectsList.map((proj, idx) => (
                  <li key={idx} className="proj-item" onClick={() => navigate('/dean/projects', { state: { targetProj: proj } })}><div className="proj-item-name">{proj}</div><div style={{color: '#94a3b8'}}>→</div></li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SupervisorsList;