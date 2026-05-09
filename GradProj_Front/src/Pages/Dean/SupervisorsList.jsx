import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { getSupervisors as getDirectorySupervisors } from '../../api/deanService';
import SearchBar from '../../components/SearchBar';
import UserPreviewModal from '../../components/UserPreviewModal';
import { openTeamsChat } from '../../utils/teamsLink';
import { formatDepartmentLabel, getUserInitials, resolveProfilePhotoUrl } from '../../utils/userMeta';
import { getSupervisorCapacityMeta } from '../../utils/supervisorCapacity';

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
  .ds-icon-wrapper { width: 50px; height: 50px; border-radius: 14px; display: flex; align-items: center; justify-content: center; font-size: 22px; transition: 0.3s; }
  .ds-icon-wrapper.total { background: #f1f5f9; color: #475569; }
  .ds-icon-wrapper.avail { background: #d1fae5; color: #059669; }
  .ds-icon-wrapper.full { background: #fef3c7; color: #d97706; }
  .ds-icon-wrapper.over { background: #fee2e2; color: #ef4444; }
  .ds-stat-info h4 { margin: 0; font-size: 13px; color: #64748b; text-transform: uppercase; font-weight: 800; letter-spacing: 0.5px;}
  .ds-stat-info p { margin: 5px 0 0 0; font-size: 32px; font-weight: 900; color: #0f172a; line-height: 1; }
  .ds-toolbar { display: flex; gap: 15px; background: white; padding: 15px; border-radius: 16px; border: 1px solid #e2e8f0; margin-bottom: 25px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.02); }
  .ds-search { flex-grow: 1; }
  .ds-filter { padding: 10px 15px; border: 1px solid #e2e8f0; border-radius: 10px; font-size: 13px; font-weight: 700; color: #475569; background: #f8fafc; outline: none; cursor: pointer; min-width: 140px; font-family: inherit;}
  .ds-table-card { background: white; border: 1px solid #e2e8f0; border-radius: 20px; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.02); overflow: hidden; }
  .sup-table { width: 100%; border-collapse: collapse; }
  .sup-table th { padding: 18px 25px; background: #f8fafc; font-size: 11px; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 1px; border-bottom: 1px solid #e2e8f0; text-align: left;}
  .sup-table td { padding: 20px 25px; border-bottom: 1px solid #f1f5f9; font-size: 14px; font-weight: 600; color: #1e293b; vertical-align: middle; }
  .sup-table tr:hover td { background: #fafafa; }
  .sup-profile-wrapper { position: relative; display: inline-block; }
  .sup-profile-cell { display: flex; align-items: center; gap: 15px; padding: 10px 15px; border-radius: 14px; border: 1px solid transparent; transition: 0.2s; cursor: pointer; background: transparent; }
  .sup-profile-cell:hover { background: white; border-color: #e2e8f0; }
  .sup-avatar-large { width: 44px; height: 44px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 16px; font-weight: 800; color: white; box-shadow: 0 2px 4px rgba(0,0,0,0.1); overflow: hidden; }
  .sup-avatar-large img, .hc-avatar img { width: 100%; height: 100%; object-fit: cover; }
  .sup-name { font-size: 15px; font-weight: 900; color: #0f172a; margin-bottom: 2px;}
  .sup-id { font-size: 12px; color: #94a3b8; font-weight: 700; }
  .smart-hover-card { position: absolute; top: 50%; left: calc(100% + 15px); transform: translateY(-50%) translateX(-10px); background: white; border: 1px solid #e2e8f0; border-radius: 16px; width: 280px; padding: 20px; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1); opacity: 0; visibility: hidden; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); z-index: 100; pointer-events: none; }
  .sup-profile-wrapper:hover .smart-hover-card { opacity: 1; visibility: visible; transform: translateY(-50%) translateX(0); }
  .hc-header { display: flex; align-items: center; gap: 15px; margin-bottom: 15px; }
  .hc-avatar { width: 45px; height:45px; border-radius:12px; color:white; display:flex; align-items:center; justify-content:center; font-weight:800; overflow:hidden; }
  .hc-name { font-size: 15px; font-weight: 900; color: #0f172a; margin: 0 0 2px 0; }
  .hc-role { font-size: 12px; font-weight: 700; color: #64748b; margin: 0; }
  .hc-divider { height: 1px; background: #f1f5f9; margin: 0 0 15px 0; }
  .hc-stats-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
  .hc-stat-box { background: #f8fafc; padding: 10px; border-radius: 10px; border: 1px solid #f1f5f9; text-align: center; }
  .hc-stat-title { font-size: 10px; font-weight: 800; color: #94a3b8; text-transform: uppercase; margin-bottom: 4px; }
  .hc-stat-value { font-size: 16px; font-weight: 900; color: #0f172a; }
  .ds-progress-container { width: 100%; max-width: 150px; }
  .ds-progress-text { display: flex; justify-content: space-between; font-size: 11px; font-weight: 800; margin-bottom: 5px; color: #475569;}
  .ds-progress-track { width: 100%; height: 6px; background: #e2e8f0; border-radius: 4px; overflow: hidden; }
  .ds-progress-fill { height: 100%; border-radius: 4px; transition: 0.5s ease-out; background: #10b981; }
  .ds-badge { padding: 6px 12px; border-radius: 8px; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px;}
  .badge-avail { background: #d1fae5; color: #059669; }
  .badge-full { background: #fef3c7; color: #d97706; }
  .badge-over { background: #fee2e2; color: #ef4444; }
  .btn-view-text { background: #f8fafc; border: 1px solid #e2e8f0; color: #0f172a; font-weight: 800; font-size: 12px; cursor: pointer; transition: 0.2s; padding: 8px 16px; border-radius: 10px; }
  .btn-view-text:hover { background: #0f172a; color: white; border-color: #0f172a; transform: translateY(-2px); }
`;

const getAvatarColor = (department = '') => {
  if (department.includes('SOFTWARE')) return '#3b82f6';
  if (department.includes('COMPUTER_INFORMATION')) return '#ec4899';
  if (department.includes('COMPUTER_SCIENCE')) return '#8b5cf6';
  return '#10b981';
};

const SupervisorsList = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user: currentUser } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [deptFilter, setDeptFilter] = useState('All');
  const [selectedSup, setSelectedSup] = useState(null);
  const [supervisors, setSupervisors] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const scope = location.pathname.startsWith('/admin') ? 'admin' : 'dean';
  const basePath = scope === 'admin' ? '/admin' : '/dean';

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    setSearchTerm(params.get('search') || location.state?.targetSup || '');
  }, [location]);

  useEffect(() => {
    let cancelled = false;
    const loadSupervisors = async () => {
      setIsLoading(true);
      setError('');
      try {
        const data = await getDirectorySupervisors(scope);
        if (!cancelled) setSupervisors(data);
      } catch {
        if (!cancelled) {
          setError('Could not load supervisors right now.');
          setSupervisors([]);
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };
    void loadSupervisors();
    return () => { cancelled = true; };
  }, [scope]);

  const departments = useMemo(() => [...new Set(supervisors.map((sup) => sup.department).filter(Boolean))], [supervisors]);
  const getSupervisorStatus = (sup) => sup.capacityStatus || 'AVAILABLE';
  const filteredSupervisors = supervisors.filter((sup) => {
    const searchable = [sup.name, sup.email, sup.universityId, formatDepartmentLabel(sup.department, '')].join(' ').toLowerCase();
    return searchable.includes(searchTerm.toLowerCase())
      && (statusFilter === 'All' || getSupervisorStatus(sup) === statusFilter)
      && (deptFilter === 'All' || sup.department === deptFilter);
  });

  const previewUser = (sup) => ({ ...sup, role: 'ROLE_SUPERVISOR' });
  const isSelf = (profile) => Boolean(
    (profile?.id && (currentUser?.id || currentUser?.userId || currentUser?.studentId) && String(profile.id) === String(currentUser.id ?? currentUser.userId ?? currentUser.studentId))
      || (profile?.email && currentUser?.email && String(profile.email).toLowerCase() === String(currentUser.email).toLowerCase())
  );

  return (
    <div className="dean-sup-container">
      <style>{premiumSupervisorsStyles}</style>
      <div className="ds-header-box">
        <div>
          <p className="ds-kicker">Human Resources & Faculty Load</p>
          <h1 className="ds-title">Supervisors Directory</h1>
        </div>
        <div className="ds-header-actions">
          <button className="btn-ds-outline" onClick={() => navigate(`${basePath}/dashboard`)}>Back</button>
          <button className="btn-ds-outline" style={{ background: '#0f172a', color: 'white', borderColor: '#0f172a' }} onClick={() => window.print()}>Save as PDF</button>
        </div>
      </div>

      <div className="ds-stats-bar">
        <div className={`ds-stat-pill ${statusFilter === 'All' ? 'active-filter' : ''}`} onClick={() => setStatusFilter('All')}><div className="ds-icon-wrapper total">All</div><div className="ds-stat-info"><h4>Total Faculty</h4><p>{supervisors.length}</p></div></div>
        <div className={`ds-stat-pill ${statusFilter === 'AVAILABLE' ? 'active-filter' : ''}`} onClick={() => setStatusFilter('AVAILABLE')}><div className="ds-icon-wrapper avail">●</div><div className="ds-stat-info"><h4>Available</h4><p>{supervisors.filter((sup) => getSupervisorStatus(sup) === 'AVAILABLE').length}</p></div></div>
        <div className={`ds-stat-pill ${statusFilter === 'FULL_CAPACITY' ? 'active-filter' : ''}`} onClick={() => setStatusFilter('FULL_CAPACITY')}><div className="ds-icon-wrapper full">●</div><div className="ds-stat-info"><h4>Full</h4><p>{supervisors.filter((sup) => getSupervisorStatus(sup) === 'FULL_CAPACITY').length}</p></div></div>
        <div className={`ds-stat-pill ${statusFilter === 'OVERLOADED' ? 'active-filter' : ''}`} onClick={() => setStatusFilter('OVERLOADED')}><div className="ds-icon-wrapper over">●</div><div className="ds-stat-info"><h4>Overloaded</h4><p>{supervisors.filter((sup) => getSupervisorStatus(sup) === 'OVERLOADED').length}</p></div></div>
      </div>

      <div className="ds-toolbar">
        <SearchBar className="ds-search" placeholder="Search supervisors..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} onClear={() => setSearchTerm('')} />
        <select className="ds-filter" value={deptFilter} onChange={(e) => setDeptFilter(e.target.value)}>
          <option value="All">All Departments</option>
          {departments.map((department) => <option key={department} value={department}>{formatDepartmentLabel(department)}</option>)}
        </select>
      </div>

      <div className="ds-table-card">
        <table className="sup-table">
          <thead>
            <tr><th>Supervisor Details</th><th>Department</th><th>Load</th><th>Status</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan="5" style={{ textAlign: 'center', padding: '60px', color: '#64748b', fontWeight: 800 }}>Loading supervisors...</td></tr>
            ) : error ? (
              <tr><td colSpan="5" style={{ textAlign: 'center', padding: '60px', color: '#ef4444', fontWeight: 800 }}>{error}</td></tr>
            ) : filteredSupervisors.length === 0 ? (
              <tr><td colSpan="5" style={{ textAlign: 'center', padding: '60px', color: '#94a3b8', fontWeight: 600 }}>No supervisors found.</td></tr>
            ) : filteredSupervisors.map((sup) => {
              const active = sup.activeProjectsCount ?? 0;
              const assigned = sup.assignedTeamsCount ?? sup.activeProjectsCount ?? 0;
              const limit = sup.capacityLimit ?? 5;
              const completed = sup.completedProjectsCount ?? 0;
              const status = getSupervisorStatus(sup);
              const capacity = getSupervisorCapacityMeta(status);
              const photoUrl = resolveProfilePhotoUrl(sup.profilePhotoUrl);
              const initials = getUserInitials(sup.name);
              return (
                <tr key={sup.id}>
                  <td>
                    <div className="sup-profile-wrapper">
                      <button type="button" className="sup-profile-cell" onClick={() => setSelectedSup(previewUser(sup))}>
                        <span className="sup-avatar-large" style={{ background: getAvatarColor(sup.department) }}>{photoUrl ? <img src={photoUrl} alt={sup.name} /> : initials}</span>
                        <span><span className="sup-name">{sup.name}</span><span className="sup-id">{sup.universityId || sup.email || 'University ID not assigned'}</span></span>
                      </button>
                      <div className="smart-hover-card">
                        <div className="hc-header">
                          <div className="hc-avatar" style={{ background: getAvatarColor(sup.department) }}>{photoUrl ? <img src={photoUrl} alt={sup.name} /> : initials}</div>
                          <div><h4 className="hc-name">{sup.name}</h4><p className="hc-role">{sup.specialty || 'Not provided'}</p></div>
                        </div>
                        <div className="hc-divider"></div>
                        <div className="hc-stats-grid">
                          <div className="hc-stat-box"><div className="hc-stat-title">Active</div><div className="hc-stat-value">{active}</div></div>
                          <div className="hc-stat-box"><div className="hc-stat-title">Completed</div><div className="hc-stat-value">{completed}</div></div>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td style={{ fontWeight: 700 }}>{formatDepartmentLabel(sup.department, 'Department not assigned')}</td>
                  <td>
                    <div className="ds-progress-container">
                      <div className="ds-progress-text"><span>{assigned} / {limit} teams</span></div>
                      <div className="ds-progress-track"><div className="ds-progress-fill" style={{ width: `${Math.min((assigned / limit) * 100, 100)}%` }} /></div>
                    </div>
                  </td>
                  <td><span className={`ds-badge ${capacity.className}`}>{capacity.icon} {capacity.label}</span></td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <button className="btn-view-text" onClick={() => setSelectedSup(previewUser(sup))}>Profile</button>
                      {!isSelf(sup) && sup.email ? <button className="btn-view-text" onClick={() => openTeamsChat(sup.email)}>Contact</button> : null}
                      {!isSelf(sup) && !sup.email ? <span style={{ fontSize: 12, color: '#94a3b8', fontWeight: 800 }}>Email not provided</span> : null}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <UserPreviewModal open={Boolean(selectedSup)} onClose={() => setSelectedSup(null)} userId={selectedSup?.id} user={selectedSup} title="Supervisor Profile" />
    </div>
  );
};

export default SupervisorsList;
