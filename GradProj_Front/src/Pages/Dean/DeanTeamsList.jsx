import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const premiumTeamsStyles = `
  .dean-teams-container { padding: 20px 30px 60px 30px; font-family: 'Plus Jakarta Sans', -apple-system, sans-serif; color: #0f172a; animation: fadeInPage 0.4s ease-out; text-align: left; background: #f8fafc; min-height: 100vh; }
  @keyframes fadeInPage { from { opacity: 0; transform: translateY(15px); } to { opacity: 1; transform: translateY(0); } }

  .dt-header-box { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 30px; background: white; padding: 25px 30px; border-radius: 20px; border: 1px solid #e2e8f0; box-shadow: 0 4px 15px -5px rgba(0,0,0,0.02); }
  .dt-kicker { color: #d97706; font-size: 13px; font-weight: 800; text-transform: uppercase; letter-spacing: 1.5px; margin: 0 0 5px 0; }
  .dt-title { font-size: 32px; font-weight: 900; margin: 0; color: #0f172a; letter-spacing: -1px; }
  .dt-header-actions { display: flex; gap: 12px; }
  .btn-dt-outline { background: white; border: 1px solid #cbd5e1; color: #475569; padding: 12px 20px; border-radius: 12px; font-weight: 800; font-size: 13px; cursor: pointer; transition: 0.2s; display: flex; align-items: center; gap: 8px; }
  .btn-dt-outline:hover { background: #f8fafc; border-color: #94a3b8; color: #0f172a; transform: translateY(-2px); }

  .dt-stats-bar { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin-bottom: 30px; }
  .dt-stat-pill { background: white; border: 2px solid #e2e8f0; border-radius: 20px; padding: 20px 25px; display: flex; align-items: center; gap: 18px; cursor: pointer; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); box-shadow: 0 4px 6px -1px rgba(0,0,0,0.02); position: relative; overflow: hidden; }
  .dt-stat-pill:hover { transform: translateY(-6px); box-shadow: 0 15px 30px -5px rgba(0,0,0,0.08); border-color: #cbd5e1; }
  .dt-stat-pill.active-filter { border-color: #0f172a; box-shadow: 0 10px 20px -5px rgba(15, 23, 42, 0.15); }
  .dt-stat-pill.active-filter::before { content: ''; position: absolute; top: 0; left: 0; width: 100%; height: 4px; background: #0f172a; }
  .dt-icon-wrapper { width: 50px; height: 50px; border-radius: 14px; display: flex; align-items: center; justify-content: center; font-size: 24px; transition: 0.3s; }
  .dt-stat-pill:hover .dt-icon-wrapper { transform: scale(1.1); }
  .dt-icon-wrapper.total { background: #f1f5f9; color: #475569; }
  .dt-icon-wrapper.good { background: #d1fae5; color: #059669; }
  .dt-icon-wrapper.warn { background: #fef3c7; color: #d97706; }
  .dt-icon-wrapper.danger { background: #fee2e2; color: #ef4444; }
  .dt-stat-info h4 { margin: 0; font-size: 13px; color: #64748b; text-transform: uppercase; font-weight: 800; letter-spacing: 0.5px;}
  .dt-stat-info p { margin: 5px 0 0 0; font-size: 32px; font-weight: 900; color: #0f172a; line-height: 1; }

  .dt-toolbar { display: flex; gap: 15px; background: white; padding: 15px; border-radius: 16px; border: 1px solid #e2e8f0; margin-bottom: 25px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.02); }
  .dt-search { flex-grow: 1; position: relative; display: flex; align-items: center; }
  .dt-search-icon { position: absolute; left: 15px; color: #94a3b8; }
  .dt-search input { width: 100%; padding: 12px 12px 12px 45px; border: 1px solid #e2e8f0; border-radius: 10px; font-size: 14px; font-weight: 600; outline: none; transition: 0.2s; box-sizing: border-box; font-family: inherit;}
  .dt-search input:focus { border-color: #0f172a; box-shadow: 0 0 0 3px rgba(15, 23, 42, 0.1); }

  .dt-table-card { background: white; border: 1px solid #e2e8f0; border-radius: 20px; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.02); overflow: hidden; }
  .teams-table { width: 100%; border-collapse: collapse; }
  .teams-table th { padding: 18px 25px; background: #f8fafc; font-size: 11px; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 1px; border-bottom: 1px solid #e2e8f0; text-align: left; }
  .teams-table td { padding: 20px 25px; border-bottom: 1px solid #f1f5f9; font-size: 14px; font-weight: 600; color: #1e293b; vertical-align: middle; }
  .teams-table tr:hover td { background: #fafafa; }
  .teams-table tr:last-child td { border-bottom: none; }

  .team-name { font-size: 15px; font-weight: 900; color: #0f172a; margin-bottom: 2px;}
  .team-id { font-size: 12px; color: #94a3b8; font-weight: 700; }
  
  .proj-assigned { font-size: 13px; font-weight: 700; color: #4f46e5; margin-bottom: 4px; display: inline-flex; align-items: center; gap: 5px; cursor: pointer; transition: 0.2s;}
  .proj-assigned:hover { color: #d97706; text-decoration: underline; }
  .proj-domain { font-size: 11px; color: #64748b; font-weight: 700; text-transform: uppercase; background: #f1f5f9; padding: 2px 6px; border-radius: 4px; display: inline-block;}

  .avatar-group { display: flex; align-items: center; }
  .avatar-circle { width: 32px; height: 32px; border-radius: 50%; border: 2px solid white; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 800; color: white; margin-left: -10px; transition: 0.2s; cursor: pointer; box-shadow: 0 2px 4px rgba(0,0,0,0.1);}
  .avatar-circle:first-child { margin-left: 0; }
  .avatar-circle:hover { transform: translateY(-6px) scale(1.1); z-index: 10; box-shadow: 0 10px 15px rgba(0,0,0,0.15);}
  .avatar-more { background: #f1f5f9; color: #475569; border-color: white; }

  .sup-pill-wrapper { position: relative; display: inline-block; cursor: pointer; }
  .sup-pill { display: inline-flex; align-items: center; gap: 8px; background: #f1f5f9; padding: 6px 12px; border-radius: 10px; font-size: 13px; font-weight: 700; color: #334155; transition: 0.2s; border: 1px solid transparent; }
  .sup-pill-wrapper:hover .sup-pill { background: white; border-color: #cbd5e1; box-shadow: 0 2px 4px rgba(0,0,0,0.05); color: #4f46e5; }
  .sup-avatar { width: 22px; height: 22px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 10px; color: white; font-weight: bold;}

  /* 💡 REVAMPED: Premium Supervisor Hover Card */
  .smart-hover-card {
    position: absolute; top: 50%; left: calc(100% + 15px); transform: translateY(-50%) translateX(-10px);
    background: white; border: 1px solid #e2e8f0; border-radius: 20px; width: 280px; padding: 25px;
    box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1);
    opacity: 0; visibility: hidden; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); z-index: 100; pointer-events: none;
  }
  .smart-hover-card::after {
    content: ''; position: absolute; top: 50%; left: -6px; transform: translateY(-50%) rotate(45deg);
    width: 12px; height: 12px; background: white; border-left: 1px solid #e2e8f0; border-bottom: 1px solid #e2e8f0;
  }
  .sup-pill-wrapper:hover .smart-hover-card { opacity: 1; visibility: visible; transform: translateY(-50%) translateX(0); }
  
  .hc-header { display: flex; align-items: center; gap: 15px; margin-bottom: 20px; }
  .hc-avatar-lg { width: 50px; height: 50px; border-radius: 14px; display: flex; align-items: center; justify-content: center; font-size: 18px; color: white; font-weight: 800; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
  .hc-name { font-size: 16px; font-weight: 900; color: #0f172a; margin: 0 0 2px 0; }
  .hc-role { font-size: 12px; font-weight: 700; color: #64748b; margin: 0; }
  .hc-divider { height: 1px; background: #f1f5f9; margin: 15px 0; }
  
  .hc-stats-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
  .hc-stat-box { background: #f8fafc; padding: 12px; border-radius: 12px; border: 1px solid #f1f5f9; text-align: center; transition: 0.2s; }
  .hc-stat-box:hover { background: white; border-color: #cbd5e1; transform: translateY(-2px); }
  .hc-stat-title { font-size: 10px; font-weight: 800; color: #94a3b8; text-transform: uppercase; margin-bottom: 4px; letter-spacing: 0.5px; }
  .hc-stat-value { font-size: 16px; font-weight: 900; color: #0f172a; }

  .health-badge { padding: 6px 12px; border-radius: 8px; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; display: inline-flex; align-items: center; gap: 5px;}
  .hb-good { background: #d1fae5; color: #059669; }
  .hb-warn { background: #fef3c7; color: #d97706; }
  .hb-danger { background: #fee2e2; color: #ef4444; }

  .btn-view-details { background: #f8fafc; border: 1px solid #e2e8f0; color: #0f172a; font-weight: 800; font-size: 12px; cursor: pointer; transition: 0.2s; padding: 8px 16px; border-radius: 10px; display: inline-flex; align-items: center; gap: 6px;}
  .btn-view-details:hover { background: #0f172a; color: white; border-color: #0f172a; transform: translateY(-2px); box-shadow: 0 4px 6px rgba(0,0,0,0.1); }

  /* 💡 ميزة التصدير السحرية PDF */
  @media print {
    .sidebar-wrapper, .top-header, .dt-header-actions, .dt-toolbar, .btn-view-details, .smart-hover-card, .modal-overlay, .btn-dt-outline { 
      display: none !important; 
    }
    .dean-teams-container { padding: 0; background: white; }
    .dt-header-box { border: none; box-shadow: none; padding: 0; margin-bottom: 50px; text-align: center; display: block; }
    .dt-title { font-size: 28px; }
    .dt-stats-bar { grid-template-columns: repeat(4, 1fr); gap: 10px; }
    .dt-stat-pill { border: 1px solid #eee; box-shadow: none; padding: 15px; cursor: default; }
    .dt-table-card { border: 1px solid #eee; box-shadow: none; border-radius: 0; }
    .teams-table th { background: #eee !important; color: black; border: 1px solid #ddd; }
    body { background: white !important; -webkit-print-color-adjust: exact; }
  }

  /* MODAL STYLES */
  .modal-overlay { position: fixed; inset: 0; background: rgba(15, 23, 42, 0.6); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: 1000; animation: fadeIn 0.2s; }
  .modal-content { background: white; border-radius: 24px; width: 90%; max-width: 650px; overflow: hidden; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25); animation: slideUp 0.3s ease-out; text-align: left;}
  @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
  .modal-header-bg { background: linear-gradient(135deg, #0f172a, #1e293b); padding: 30px; color: white; position: relative;}
  .modal-close-btn { position: absolute; top: 15px; right: 15px; background: rgba(255,255,255,0.1); border: none; color: white; width: 30px; height: 30px; border-radius: 50%; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: 0.2s; }
  .modal-close-btn:hover { background: rgba(255,255,255,0.2); }
  .modal-body { padding: 30px; max-height: 60vh; overflow-y: auto;}
  .member-list { display: flex; flex-direction: column; gap: 15px; margin-top: 20px;}
  .member-row { display: flex; align-items: center; justify-content: space-between; padding: 15px; background: #f8fafc; border: 1px solid #f1f5f9; border-radius: 14px; transition: 0.2s; cursor: pointer; }
  .member-row:hover { border-color: #4f46e5; background: white; box-shadow: 0 10px 15px -5px rgba(79, 70, 229, 0.1); transform: translateX(5px); }
  .member-avatar { width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-weight: 800; font-size: 14px;}
  .member-role { font-size: 11px; font-weight: 800; color: #4f46e5; text-transform: uppercase; background: #e0e7ff; padding: 3px 8px; border-radius: 6px; }
`;

const DeanTeamsList = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [searchTerm, setSearchTerm] = useState('');
  const [healthFilter, setHealthFilter] = useState('All');
  const [selectedTeam, setSelectedTeam] = useState(null);

  useEffect(() => {
    if (location.state && location.state.targetTeam) {
      setSearchTerm(location.state.targetTeam);
    }
  }, [location]);

  const supervisorDetails = {
    'Dr. Ahmad Ali': { role: 'Assoc. Professor', rating: '4.8', activeProj: 4, color: '#3b82f6' },
    'Dr. Sarah Khaled': { role: 'Assistant Prof.', rating: '4.9', activeProj: 5, color: '#ec4899' },
    'Dr. Omar Zaid': { role: 'Professor', rating: '4.5', activeProj: 6, color: '#8b5cf6' },
  };

  const allTeams = [
    { id: 'TM-01', name: 'Team Alpha', project: 'Smart University Campus', domain: 'IoT', supervisor: 'Dr. Ahmad Ali', health: 'On Track', progress: 85, members: [{ name: 'Ali Mansour', role: 'Team Leader', id: '20221001', color: '#f59e0b' }, { name: 'Sara Ahmed', role: 'Frontend Dev', id: '20221002', color: '#3b82f6' }, { name: 'Omar Khalid', role: 'Hardware Eng', id: '20221003', color: '#10b981' }] },
    { id: 'TM-02', name: 'Team Beta', project: 'AI Academic Advisor', domain: 'AI/ML', supervisor: 'Dr. Sarah Khaled', health: 'At Risk', progress: 30, members: [{ name: 'Leen Rami', role: 'Data Scientist', id: '20222001', color: '#ec4899' }, { name: 'Ahmad Zaid', role: 'Backend Dev', id: '20222002', color: '#8b5cf6' }] },
    { id: 'TM-03', name: 'Team Gamma', project: 'Blockchain Voting', domain: 'Cybersecurity', supervisor: 'Dr. Omar Zaid', health: 'Excellent', progress: 95, members: [{ name: 'Khaled Youssef', role: 'Smart Contracts', id: '20223001', color: '#14b8a6' }, { name: 'Nour Fadel', role: 'Security Analyst', id: '20223002', color: '#f43f5e' }] },
    { id: 'TM-04', name: 'Team Delta', project: 'E-Learning App', domain: 'Software Eng.', supervisor: 'Dr. Ahmad Ali', health: 'Delayed', progress: 60, members: [{ name: 'Sami Nader', role: 'Mobile Dev', id: '20224001', color: '#0ea5e9' }] },
  ];

  const handleSaveAsPDF = () => {
    window.print();
  };

  const filteredTeams = allTeams.filter(t => {
    const matchSearch = t.name.toLowerCase().includes(searchTerm.toLowerCase()) || t.project.toLowerCase().includes(searchTerm.toLowerCase());
    let matchHealth = true;
    if (healthFilter === 'Good') matchHealth = ['On Track', 'Excellent'].includes(t.health);
    if (healthFilter === 'Warn') matchHealth = t.health === 'Delayed';
    if (healthFilter === 'Danger') matchHealth = t.health === 'At Risk';
    return matchSearch && matchHealth;
  });

  const getHealthBadge = (health) => {
    if (['On Track', 'Excellent'].includes(health)) return { class: 'hb-good', icon: '✅' };
    if (health === 'Delayed') return { class: 'hb-warn', icon: '⏳' };
    return { class: 'hb-danger', icon: '⚠️' };
  };

  return (
    <div className="dean-teams-container">
      <style>{premiumTeamsStyles}</style>
      
      <div className="dt-header-box">
        <div>
          <p className="dt-kicker">Student Groups Overview</p>
          <h1 className="dt-title">All Project Teams</h1>
        </div>
        <div className="dt-header-actions">
          <button className="btn-dt-outline" onClick={() => navigate('/dean/dashboard')}>← Back to Dashboard</button>
          <button className="btn-dt-outline" style={{background: '#0f172a', color: 'white', borderColor: '#0f172a'}} onClick={handleSaveAsPDF}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
            Save as PDF
          </button>
        </div>
      </div>

      <div className="dt-stats-bar">
        <div className={`dt-stat-pill ${healthFilter === 'All' ? 'active-filter' : ''}`} onClick={() => setHealthFilter('All')}><div className="dt-icon-wrapper total">👥</div><div className="dt-stat-info"><h4>Total Teams</h4><p>{allTeams.length}</p></div></div>
        <div className={`dt-stat-pill ${healthFilter === 'Good' ? 'active-filter' : ''}`} onClick={() => setHealthFilter('Good')}><div className="dt-icon-wrapper good">✅</div><div className="dt-stat-info"><h4>Healthy</h4><p>{allTeams.filter(t => ['On Track', 'Excellent'].includes(t.health)).length}</p></div></div>
        <div className={`dt-stat-pill ${healthFilter === 'Warn' ? 'active-filter' : ''}`} onClick={() => setHealthFilter('Warn')}><div className="dt-icon-wrapper warn">⏳</div><div className="dt-stat-info"><h4>Delayed</h4><p>{allTeams.filter(t => t.health === 'Delayed').length}</p></div></div>
        <div className={`dt-stat-pill ${healthFilter === 'Danger' ? 'active-filter' : ''}`} onClick={() => setHealthFilter('Danger')}><div className="dt-icon-wrapper danger">⚠️</div><div className="dt-stat-info"><h4>At Risk</h4><p>{allTeams.filter(t => t.health === 'At Risk').length}</p></div></div>
      </div>

      <div className="dt-toolbar">
        <div className="dt-search">
          <span className="dt-search-icon">🔍</span>
          <input type="text" placeholder="Search teams or projects..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          {searchTerm && <button onClick={()=>setSearchTerm('')} style={{position:'absolute', right:'15px', background:'none', border:'none', cursor:'pointer', color:'#ef4444', fontWeight:800}}>✕ Clear</button>}
        </div>
      </div>

      <div className="dt-table-card">
        <table className="teams-table">
          <thead>
            <tr><th>Team Info</th><th>Assigned Project</th><th>Supervisor</th><th>Members</th><th>Team Health</th><th>Action</th></tr>
          </thead>
          <tbody>
            {filteredTeams.map(team => {
              const supInfo = supervisorDetails[team.supervisor] || {};
              const supInitials = team.supervisor.split(' ')[1]?.charAt(0) + (team.supervisor.split(' ')[2]?.charAt(0) || '');
              const healthData = getHealthBadge(team.health);

              return (
              <tr key={team.id}>
                <td><div className="team-name">{team.name}</div><div className="team-id">{team.id}</div></td>
                <td><div className="proj-assigned" onClick={() => navigate('/dean/projects', { state: { targetProj: team.project } })}>📁 {team.project}</div><br/><div className="proj-domain">{team.domain}</div></td>
                <td>
                  <div className="sup-pill-wrapper">
                    <div className="sup-pill" onClick={() => navigate('/dean/supervisors', { state: { targetSup: team.supervisor } })}>
                      <div className="sup-avatar" style={{background: supInfo?.color || '#0f172a'}}>{supInitials}</div>
                      {team.supervisor}
                    </div>
                    {/* 💡 REVAMPED: Premium Hover Card Logic */}
                    <div className="smart-hover-card">
                       <div className="hc-header">
                          <div className="hc-avatar-lg" style={{background: supInfo?.color || '#0f172a'}}>{supInitials}</div>
                          <div><h4 className="hc-name">{team.supervisor}</h4><p className="hc-role">{supInfo?.role || 'Faculty Member'}</p></div>
                       </div>
                       <div className="hc-divider"></div>
                       <div className="hc-stats-grid">
                          <div className="hc-stat-box">
                             <div className="hc-stat-title">Active Proj.</div>
                             <div className="hc-stat-value">{supInfo?.activeProj || 0}</div>
                          </div>
                          <div className="hc-stat-box">
                             <div className="hc-stat-title">Rating</div>
                             <div className="hc-stat-value" style={{color: '#d97706'}}>⭐ {supInfo?.rating || 'N/A'}</div>
                          </div>
                       </div>
                    </div>
                  </div>
                </td>
                <td>
                  <div className="avatar-group">
                    {team.members.slice(0, 3).map((m, i) => (
                      <div key={i} className="avatar-circle" style={{background: m.color, zIndex: 10 - i}} onClick={() => navigate('/dean/students', { state: { studentTarget: m.name } })}>{m.name.charAt(0)}</div>
                    ))}
                    {team.members.length > 3 && <div className="avatar-circle avatar-more">+{team.members.length - 3}</div>}
                  </div>
                </td>
                <td><span className={`health-badge ${healthData.class}`}>{healthData.icon} {team.health}</span></td>
                <td><button className="btn-view-details" onClick={() => setSelectedTeam(team)}>View Team →</button></td>
              </tr>
            )})}
          </tbody>
        </table>
      </div>

      {selectedTeam && (
        <div className="modal-overlay" onClick={() => setSelectedTeam(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-bg">
              <button className="modal-close-btn" onClick={() => setSelectedTeam(null)}>✕</button>
              <div style={{background: 'rgba(255,255,255,0.2)', display: 'inline-block', padding: '4px 10px', borderRadius: '8px', fontSize: '12px', fontWeight: 800, marginBottom: '10px'}}>{selectedTeam.id}</div>
              <h2 style={{margin: '0 0 5px 0', fontSize: '28px', fontWeight: 900}}>{selectedTeam.name}</h2>
              <p style={{margin: 0, fontSize: '15px', opacity: 0.9, cursor: 'pointer'}} onClick={() => navigate('/dean/projects', { state: { targetProj: selectedTeam.project } })}>📁 {selectedTeam.project} →</p>
            </div>
            <div className="modal-body">
              <h3 style={{fontSize: '16px', fontWeight: 900, color: '#0f172a', margin: '0 0 15px 0'}}>Team Members ({selectedTeam.members.length})</h3>
              <div className="member-list">
                {selectedTeam.members.map((m, idx) => (
                  <div key={idx} className="member-row" onClick={() => { setSelectedTeam(null); navigate('/dean/students', { state: { studentTarget: m.name } }); }}>
                    <div className="member-info"><div className="member-avatar" style={{background: m.color}}>{m.name.charAt(0)}</div><div><div style={{fontSize: '15px', fontWeight: 800}}>{m.name}</div><div style={{fontSize: '12px', color: '#64748b'}}>ID: {m.id}</div></div></div>
                    <div style={{display: 'flex', alignItems: 'center', gap: '15px'}}><div className="member-role">{m.role}</div><div style={{color: '#94a3b8'}}>→</div></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DeanTeamsList;