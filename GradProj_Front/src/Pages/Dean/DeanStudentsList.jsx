import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const studentStyles = `
  .dean-std-container { padding: 20px 30px 60px 30px; font-family: 'Plus Jakarta Sans', -apple-system, sans-serif; color: #0f172a; animation: fadeInPage 0.4s ease-out; text-align: left; background: #f8fafc; min-height: 100vh; }
  @keyframes fadeInPage { from { opacity: 0; transform: translateY(15px); } to { opacity: 1; transform: translateY(0); } }

  .std-header-box { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 30px; background: white; padding: 25px 30px; border-radius: 20px; border: 1px solid #e2e8f0; box-shadow: 0 4px 15px -5px rgba(0,0,0,0.02); }
  .std-kicker { color: #d97706; font-size: 13px; font-weight: 800; text-transform: uppercase; letter-spacing: 1.5px; margin: 0 0 5px 0; }
  .std-title { font-size: 32px; font-weight: 900; margin: 0; color: #0f172a; letter-spacing: -1px; }
  .std-header-actions { display: flex; gap: 12px; }
  .btn-std-outline { background: white; border: 1px solid #cbd5e1; color: #475569; padding: 12px 20px; border-radius: 12px; font-weight: 800; font-size: 13px; cursor: pointer; transition: 0.2s; display: flex; align-items: center; gap: 8px; }
  .btn-std-outline:hover { background: #f8fafc; border-color: #94a3b8; color: #0f172a; transform: translateY(-2px); }

  .std-stats-bar { display: grid; grid-template-columns: repeat(5, 1fr); gap: 15px; margin-bottom: 30px; }
  .std-stat-pill { background: white; border: 2px solid #e2e8f0; border-radius: 20px; padding: 15px 20px; display: flex; align-items: center; gap: 15px; cursor: pointer; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); box-shadow: 0 4px 6px -1px rgba(0,0,0,0.02); position: relative; overflow: hidden; }
  .std-stat-pill:hover { transform: translateY(-6px); box-shadow: 0 15px 30px -5px rgba(0,0,0,0.08); border-color: #cbd5e1; }
  .std-stat-pill.active-filter { border-color: #0f172a; box-shadow: 0 10px 20px -5px rgba(15, 23, 42, 0.15); }
  .std-stat-pill.active-filter::before { content: ''; position: absolute; top: 0; left: 0; width: 100%; height: 4px; background: #0f172a; }
  .std-icon-wrapper { width: 45px; height: 45px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 20px; transition: 0.3s; }
  .std-stat-pill:hover .std-icon-wrapper { transform: scale(1.1); }
  
  .std-icon-wrapper.total { background: #f1f5f9; color: #475569; }
  .std-icon-wrapper.active { background: #e0e7ff; color: #4f46e5; }
  .std-icon-wrapper.grad { background: #d1fae5; color: #059669; }
  .std-icon-wrapper.delay { background: #fef3c7; color: #d97706; }
  .std-icon-wrapper.risk { background: #fee2e2; color: #ef4444; }
  .std-stat-info h4 { margin: 0; font-size: 11px; color: #64748b; text-transform: uppercase; font-weight: 800; letter-spacing: 0.5px;}
  .std-stat-info p { margin: 5px 0 0 0; font-size: 24px; font-weight: 900; color: #0f172a; line-height: 1; }

  /* --- Toolbar & Filters --- */
  .std-toolbar { display: flex; gap: 15px; background: white; padding: 15px; border-radius: 16px; border: 1px solid #e2e8f0; margin-bottom: 25px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.02); }
  .std-search { flex-grow: 1; position: relative; display: flex; align-items: center; }
  .std-search-icon { position: absolute; left: 15px; color: #94a3b8; }
  .std-search input { width: 100%; padding: 12px 12px 12px 45px; border: 1px solid #e2e8f0; border-radius: 10px; font-size: 14px; font-weight: 600; outline: none; transition: 0.2s; box-sizing: border-box; font-family: inherit;}
  .std-search input:focus { border-color: #0f172a; box-shadow: 0 0 0 3px rgba(15, 23, 42, 0.1); }
  /* 💡 تصميم الفلتر المضاف حديثاً */
  .std-filter { padding: 10px 15px; border: 1px solid #e2e8f0; border-radius: 10px; font-size: 13px; font-weight: 700; color: #475569; background: #f8fafc; outline: none; cursor: pointer; min-width: 150px; font-family: inherit;}
  .std-filter:focus { border-color: #0f172a; }

  /* --- Master Table --- */
  .std-table-card { background: white; border: 1px solid #e2e8f0; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.02); }
  .students-table { width: 100%; border-collapse: collapse; }
  .students-table th { padding: 18px 25px; background: #f8fafc; font-size: 11px; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 1px; border-bottom: 1px solid #e2e8f0; text-align: left; }
  .students-table td { padding: 15px 25px; border-bottom: 1px solid #f1f5f9; font-size: 14px; font-weight: 600; color: #1e293b; vertical-align: middle; }
  .students-table tr:hover td { background: #fafafa; }
  
  .std-profile-wrapper { cursor: pointer; display: flex; align-items: center; gap: 15px; padding: 8px; border-radius: 12px; transition: 0.2s; border: 1px solid transparent;}
  .std-profile-wrapper:hover { background: white; border-color: #e2e8f0; box-shadow: 0 4px 6px rgba(0,0,0,0.04); transform: translateX(5px);}
  .std-avatar { width: 44px; height: 44px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 16px; font-weight: 800; color: white; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
  .std-name { font-size: 15px; font-weight: 900; color: #0f172a; margin-bottom: 2px;}
  .std-id { font-size: 12px; color: #94a3b8; font-weight: 700; }

  /* 💡 الروابط التفاعلية (فرق ومشاريع) */
  .team-link { font-size: 14px; font-weight: 800; color: #0f172a; cursor: pointer; display: inline-flex; align-items: center; gap: 5px; transition: 0.2s;}
  .team-link:hover { color: #4f46e5; text-decoration: underline; transform: translateX(3px); }
  .proj-link { font-size: 12px; color: #64748b; font-weight: 700; display: inline-flex; align-items: center; gap: 5px; margin-top: 4px; cursor: pointer; transition: 0.2s;}
  .proj-link:hover { color: #d97706; text-decoration: underline; transform: translateX(3px); }

  /* Badges */
  .gpa-badge { background: #f1f5f9; padding: 6px 12px; border-radius: 8px; font-weight: 900; color: #0f172a; border: 1px solid #e2e8f0;}
  .gpa-high { background: #fffbeb; color: #d97706; border-color: #fde68a;}
  .std-badge { padding: 6px 12px; border-radius: 8px; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px;}
  .badge-active { background: #e0e7ff; color: #4f46e5; }
  .badge-grad { background: #d1fae5; color: #059669; }
  .badge-delay { background: #fef3c7; color: #d97706; }
  .badge-risk { background: #fee2e2; color: #ef4444; }

  .actions-cell { display: flex; gap: 10px; align-items: center; }
  .btn-action-icon { width: 35px; height: 35px; border-radius: 10px; border: 1px solid #e2e8f0; background: white; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: 0.2s; color: #475569; }
  .btn-action-icon:hover { background: #f8fafc; border-color: #cbd5e1; color: #0f172a; transform: translateY(-2px); }
  .btn-view-details, .btn-view-text { background: #f8fafc; border: 1px solid #e2e8f0; color: #0f172a; font-weight: 800; font-size: 12px; cursor: pointer; transition: 0.2s; padding: 8px 16px; border-radius: 10px; display: inline-flex; align-items: center; gap: 6px;}
  .btn-view-details:hover, .btn-view-text:hover { background: #0f172a; color: white; border-color: #0f172a; transform: translateY(-2px); box-shadow: 0 4px 6px rgba(0,0,0,0.1); text-decoration: none; }

  /* 🚀 MODAL STYLES */
  .modal-overlay { position: fixed; inset: 0; background: rgba(15, 23, 42, 0.6); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: 1000; animation: fadeIn 0.2s; }
  .modal-content { background: white; border-radius: 24px; width: 90%; max-width: 600px; overflow: hidden; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25); animation: slideUp 0.3s ease-out; }
  @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
  @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
  .modal-header-bg { background: linear-gradient(135deg, #0f172a, #1e293b); padding: 40px 30px 20px 30px; color: white; display: flex; gap: 20px; position: relative;}
  .modal-close-btn { position: absolute; top: 15px; right: 15px; background: rgba(255,255,255,0.1); border: none; color: white; width: 30px; height: 30px; border-radius: 50%; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: 0.2s; }
  .modal-close-btn:hover { background: rgba(255,255,255,0.2); }
  .modal-avatar { width: 80px; height: 80px; border-radius: 20px; display: flex; align-items: center; justify-content: center; font-size: 32px; font-weight: 900; background: white; color: #0f172a; box-shadow: 0 10px 15px rgba(0,0,0,0.2); border: 4px solid #1e293b; margin-top: -10px;}
  .modal-body { padding: 30px; max-height: 60vh; overflow-y: auto;}
  .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px; }
  .info-item { background: #f8fafc; padding: 15px; border-radius: 14px; border: 1px solid #f1f5f9;}
  .info-label { font-size: 11px; font-weight: 800; color: #94a3b8; text-transform: uppercase; margin-bottom: 5px; }
  .info-val { font-size: 14px; font-weight: 700; color: #0f172a; }

  .quick-links-box { background: white; border: 1px solid #e2e8f0; border-radius: 16px; padding: 20px; }
  .ql-title { font-size: 13px; font-weight: 800; color: #64748b; text-transform: uppercase; margin-bottom: 15px; }
  .ql-btn { width: 100%; display: flex; justify-content: space-between; align-items: center; padding: 15px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; cursor: pointer; transition: 0.2s; margin-bottom: 10px; font-weight: 800; color: #0f172a; }
  .ql-btn:hover { background: white; border-color: #4f46e5; color: #4f46e5; transform: translateX(5px); box-shadow: 0 4px 6px rgba(0,0,0,0.02);}

  /* 💡 ميزة التصدير السحرية PDF */
  @media print {
    .sidebar-wrapper, .top-header, .std-header-actions, .std-toolbar, .actions-cell, .modal-overlay, .btn-std-outline { 
      display: none !important; 
    }
    .dean-std-container { padding: 0; background: white; }
    .std-header-box { border: none; box-shadow: none; padding: 0; margin-bottom: 50px; text-align: center; display: block; }
    .std-title { font-size: 28px; }
    .std-stats-bar { grid-template-columns: repeat(5, 1fr); gap: 10px; }
    .std-stat-pill { border: 1px solid #eee; box-shadow: none; padding: 15px; cursor: default; }
    .std-table-card { border: 1px solid #eee; box-shadow: none; border-radius: 0; }
    .students-table th { background: #eee !important; color: black; border: 1px solid #ddd; }
    body { background: white !important; -webkit-print-color-adjust: exact; }
  }
`;

const DeanStudentsList = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [deptFilter, setDeptFilter] = useState('All'); 
  const [selectedStd, setSelectedStd] = useState(null);

  // السحر: قراءة Auto-Search من الراوت (اذا اجينا من صفحات تانية)
  useEffect(() => {
    if (location.state && location.state.studentTarget) {
      setSearchTerm(location.state.studentTarget);
    }
  }, [location]);

  const allStudents = [
    { id: '20221001', name: 'Ali Mansour', dept: 'Software Eng.', team: 'Team Alpha', project: 'Smart University Campus', gpa: 3.8, status: 'Active', color: '#f59e0b', email: 'ali@student.bau.edu', phone: '+962 79 123 4567' },
    { id: '20221002', name: 'Sara Ahmed', dept: 'Software Eng.', team: 'Team Alpha', project: 'Smart University Campus', gpa: 3.9, status: 'Active', color: '#3b82f6', email: 'sara@student.bau.edu', phone: '+962 79 234 5678' },
    { id: '20224001', name: 'Sami Nader', dept: 'Software Eng.', team: 'Team Delta', project: 'E-Learning App', gpa: 2.4, status: 'Delayed', color: '#0ea5e9', email: 'sami@student.bau.edu', phone: '+962 79 345 6789' }, 
    { id: '20222001', name: 'Leen Rami', dept: 'AI / ML', team: 'Team Beta', project: 'AI Academic Advisor', gpa: 2.1, status: 'At Risk', color: '#ec4899', email: 'leen@student.bau.edu', phone: '+962 79 456 7890' },
    { id: '20223001', name: 'Khaled Youssef', dept: 'Cybersecurity', team: 'Team Gamma', project: 'Blockchain Voting', gpa: 3.5, status: 'Graduated', color: '#14b8a6', email: 'khaled@student.bau.edu', phone: '+962 79 567 8901' },
    { id: '20225001', name: 'Yazan Ali', dept: 'Cybersecurity', team: 'Team Gamma', project: 'Blockchain Voting', gpa: 2.8, status: 'Active', color: '#6366f1', email: 'yazan@student.bau.edu', phone: '+962 79 678 9012' },
  ];

  // 💡 وظيفة الحفظ كـ PDF (Save as PDF)
  const handleExportPDF = () => {
    window.print();
  };

  // 💡 فلترة مدمجة (بحث + حالة + قسم)
  const filteredStudents = allStudents.filter(std => {
    const matchSearch = std.name.toLowerCase().includes(searchTerm.toLowerCase()) || std.id.includes(searchTerm) || std.team.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = statusFilter === 'All' || std.status === statusFilter;
    const matchDept = deptFilter === 'All' || std.dept === deptFilter;
    return matchSearch && matchStatus && matchDept;
  });

  const getStatusBadge = (status) => {
    if (status === 'Active') return 'badge-active';
    if (status === 'Graduated') return 'badge-grad';
    if (status === 'Delayed') return 'badge-delay';
    return 'badge-risk';
  };

  return (
    <div className="dean-std-container">
      <style>{studentStyles}</style>

      <div className="std-header-box">
        <div>
          <p className="std-kicker">Faculty Student Registry</p>
          <h1 className="std-title">All Registered Students</h1>
        </div>
        <div className="std-header-actions">
          <button className="btn-std-outline" onClick={() => navigate('/dean/dashboard')}>← Back to Dashboard</button>
          {/* 💡 زر التصدير كـ PDF المحدث مع الحفاظ على الكود */}
          <button className="btn-std-outline" style={{background: '#0f172a', color: 'white', borderColor: '#0f172a'}} onClick={handleExportPDF}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
            Save as PDF
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="std-stats-bar">
        <div className={`std-stat-pill ${statusFilter === 'All' ? 'active-filter' : ''}`} onClick={() => setStatusFilter('All')}>
          <div className="std-icon-wrapper total">🎓</div><div className="std-stat-info"><h4>All</h4><p>{allStudents.length}</p></div>
        </div>
        <div className={`std-stat-pill ${statusFilter === 'Active' ? 'active-filter' : ''}`} onClick={() => setStatusFilter('Active')}>
          <div className="std-icon-wrapper active">💻</div><div className="std-stat-info"><h4>Active</h4><p>{allStudents.filter(s=>s.status==='Active').length}</p></div>
        </div>
        <div className={`std-stat-pill ${statusFilter === 'Delayed' ? 'active-filter' : ''}`} onClick={() => setStatusFilter('Delayed')}>
          <div className="std-icon-wrapper delay">⏳</div><div className="std-stat-info"><h4>Delayed</h4><p>{allStudents.filter(s=>s.status==='Delayed').length}</p></div>
        </div>
        <div className={`std-stat-pill ${statusFilter === 'At Risk' ? 'active-filter' : ''}`} onClick={() => setStatusFilter('At Risk')}>
          <div className="std-icon-wrapper risk">⚠️</div><div className="std-stat-info"><h4>At Risk</h4><p>{allStudents.filter(s=>s.status==='At Risk').length}</p></div>
        </div>
        <div className={`std-stat-pill ${statusFilter === 'Graduated' ? 'active-filter' : ''}`} onClick={() => setStatusFilter('Graduated')}>
          <div className="std-icon-wrapper grad">🏆</div><div className="std-stat-info"><h4>Grad</h4><p>{allStudents.filter(s=>s.status==='Graduated').length}</p></div>
        </div>
      </div>

      {/* 💡 Toolbar with added Dropdown Filter */}
      <div className="std-toolbar">
        <div className="std-search">
          <span className="std-search-icon">🔍</span>
          <input type="text" placeholder="Search students by name, ID, or Team..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          {searchTerm && <button onClick={()=>setSearchTerm('')} style={{position:'absolute', right:'15px', background:'none', border:'none', cursor:'pointer', color:'#ef4444', fontWeight:800}}>✕ Clear</button>}
        </div>
        <select className="std-filter" value={deptFilter} onChange={(e) => setDeptFilter(e.target.value)}>
          <option value="All">All Departments</option>
          <option value="Software Eng.">Software Eng.</option>
          <option value="AI / ML">AI / ML</option>
          <option value="Cybersecurity">Cybersecurity</option>
        </select>
      </div>

      <div className="std-table-card">
        <table className="students-table">
          <thead>
            <tr><th>Student Profile</th><th>Department</th><th>Team & Project</th><th>GPA</th><th>Status</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {filteredStudents.length > 0 ? filteredStudents.map(std => (
              <tr key={std.id}>
                
                {/* Clickable Profile */}
                <td>
                  <div className="std-profile-wrapper" onClick={() => setSelectedStd(std)} title="View Full Details">
                    <div className="std-avatar" style={{background: std.color}}>{std.name.charAt(0)}</div>
                    <div><div className="std-name">{std.name}</div><div className="std-id">{std.id}</div></div>
                  </div>
                </td>
                
                <td style={{fontWeight: 700, color: '#475569'}}>{std.dept}</td>
                
                {/* 💡 Clickable Team & Project (Auto-Search targets) */}
                <td>
                  <div className="team-link" title={`View ${std.team} Details`} onClick={() => navigate('/dean/teams', { state: { targetTeam: std.team } })}>
                    👥 {std.team}
                  </div>
                  <br />
                  <div className="proj-link" title={`View ${std.project}`} onClick={() => navigate('/dean/projects', { state: { targetProj: std.project } })}>
                    📁 {std.project}
                  </div>
                </td>

                <td><span className={`gpa-badge ${std.gpa >= 3.5 ? 'gpa-high' : ''}`}>{std.gpa}</span></td>
                <td><span className={`std-badge ${getStatusBadge(std.status)}`}>{std.status}</span></td>
                
                {/* Enhanced Actions */}
                <td>
                  <div className="actions-cell">
                    <button className="btn-action-icon" title="Email Student" onClick={()=>window.location.href=`mailto:${std.email}`}>✉️</button>
                    <button className="btn-view-text" onClick={() => setSelectedStd(std)}>View Profile</button>
                  </div>
                </td>
              </tr>
            )) : (
              <tr><td colSpan="6" style={{textAlign: 'center', padding: '60px', color: '#94a3b8', fontWeight: 600}}>No students found matching your filters.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* 🚀 STUDENT PROFILE MODAL */}
      {selectedStd && (
        <div className="modal-overlay" onClick={() => setSelectedStd(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-bg">
              <button className="modal-close-btn" onClick={() => setSelectedStd(null)}>✕</button>
              <div className="modal-avatar" style={{color: selectedStd.color}}>{selectedStd.name.charAt(0)}</div>
              <div style={{marginTop: '10px'}}>
                <h2 style={{margin: '0 0 5px 0', fontSize: '24px', fontWeight: 900}}>{selectedStd.name}</h2>
                <p style={{margin: 0, fontSize: '14px', opacity: 0.8}}>{selectedStd.dept} • {selectedStd.id}</p>
              </div>
            </div>

            <div className="modal-body">
              <div className="info-grid">
                <div className="info-item">
                  <div className="info-label">Email Address</div>
                  <div className="info-val" style={{color: '#4f46e5'}}>{selectedStd.email}</div>
                </div>
                <div className="info-item">
                  <div className="info-label">Phone Number</div>
                  <div className="info-val">{selectedStd.phone}</div>
                </div>
                <div className="info-item">
                  <div className="info-label">Cumulative GPA</div>
                  <div className="info-val" style={{color: selectedStd.gpa >= 3.5 ? '#d97706' : '#0f172a'}}>⭐ {selectedStd.gpa} / 4.0</div>
                </div>
                <div className="info-item">
                  <div className="info-label">Academic Status</div>
                  <div className="info-val"><span className={`std-badge ${getStatusBadge(selectedStd.status)}`} style={{padding:'4px 8px'}}>{selectedStd.status}</span></div>
                </div>
              </div>

              <div className="quick-links-box">
                 <div className="ql-title">Project & Team Assignments</div>
                 
                 {/* 💡 أزرار بتعمل Auto-Search لصفحة المشاريع والفرق */}
                 <div className="ql-btn" onClick={() => navigate('/dean/projects', { state: { targetProj: selectedStd.project } })}>
                   <span>📁 Project: {selectedStd.project}</span><span>→</span>
                 </div>
                 <div className="ql-btn" onClick={() => navigate('/dean/teams', { state: { targetTeam: selectedStd.team } })}>
                   <span>👥 Team: {selectedStd.team}</span><span>→</span>
                 </div>
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default DeanStudentsList;