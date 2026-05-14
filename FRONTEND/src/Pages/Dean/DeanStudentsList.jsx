import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getAllStudents } from '../../api/deanService';
import ProjectStatusBadge from '../../components/ProjectStatusBadge';
import SearchBar from '../../components/SearchBar';
import UserPreviewModal from '../../components/UserPreviewModal';
import { formatDepartmentLabel, getUserInitials, resolveProfilePhotoUrl } from '../../utils/userMeta';
import StyledSelect from '../../components/StyledSelect';

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
  .std-icon-wrapper { width: 45px; height: 45px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 14px; font-weight: 900; transition: 0.3s; }
  .std-icon-wrapper.total { background: #f1f5f9; color: #475569; }
  .std-icon-wrapper.active { background: #e0e7ff; color: #4f46e5; }
  .std-icon-wrapper.grad { background: #d1fae5; color: #059669; }
  .std-icon-wrapper.delay { background: #fef3c7; color: #d97706; }
  .std-icon-wrapper.risk { background: #fee2e2; color: #ef4444; }
  .std-stat-info h4 { margin: 0; font-size: 11px; color: #64748b; text-transform: uppercase; font-weight: 800; letter-spacing: 0.5px;}
  .std-stat-info p { margin: 5px 0 0 0; font-size: 24px; font-weight: 900; color: #0f172a; line-height: 1; }
  .std-toolbar { display: flex; gap: 15px; background: white; padding: 15px; border-radius: 16px; border: 1px solid #e2e8f0; margin-bottom: 25px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.02); }
  .std-search { flex-grow: 1; }
  .std-filter { padding: 10px 15px; border: 1px solid #e2e8f0; border-radius: 10px; font-size: 13px; font-weight: 700; color: #475569; background: #f8fafc; outline: none; cursor: pointer; min-width: 150px; font-family: inherit;}
  .std-table-card { background: white; border: 1px solid #e2e8f0; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.02); }
  .students-table { width: 100%; border-collapse: collapse; }
  .students-table th { padding: 18px 25px; background: #f8fafc; font-size: 11px; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 1px; border-bottom: 1px solid #e2e8f0; text-align: left; }
  .students-table td { padding: 15px 25px; border-bottom: 1px solid #f1f5f9; font-size: 14px; font-weight: 600; color: #1e293b; vertical-align: middle; }
  .students-table tr:hover td { background: #fafafa; }
  .std-profile-wrapper { cursor: pointer; display: flex; align-items: center; gap: 15px; padding: 8px; border-radius: 12px; transition: 0.2s; border: 1px solid transparent; background: transparent; color: inherit; text-align: left; font-family: inherit; width: 100%; }
  .std-profile-wrapper:hover { background: white; border-color: #e2e8f0; box-shadow: 0 4px 6px rgba(0,0,0,0.04); transform: translateX(5px);}
  .std-avatar { width: 44px; height: 44px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 16px; font-weight: 800; color: white; box-shadow: 0 2px 4px rgba(0,0,0,0.1); overflow: hidden; flex: 0 0 auto; }
  .std-avatar img { width: 100%; height: 100%; object-fit: cover; }
  .std-name { font-size: 15px; font-weight: 900; color: #0f172a; margin-bottom: 2px; display: block; }
  .std-id { font-size: 12px; color: #94a3b8; font-weight: 700; display: block; }
  .team-link { font-size: 14px; font-weight: 800; color: #0f172a; cursor: pointer; display: inline-flex; align-items: center; gap: 5px; transition: 0.2s;}
  .team-link:hover { color: #4f46e5; text-decoration: underline; transform: translateX(3px); }
  .proj-link { font-size: 12px; color: #64748b; font-weight: 700; display: inline-flex; align-items: center; gap: 5px; margin-top: 4px; cursor: pointer; transition: 0.2s;}
  .proj-link:hover { color: #d97706; text-decoration: underline; transform: translateX(3px); }
  .std-badge { padding: 6px 12px; border-radius: 8px; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px;}
  .badge-active { background: #e0e7ff; color: #4f46e5; }
  .badge-grad { background: #d1fae5; color: #059669; }
  .badge-delay { background: #fef3c7; color: #d97706; }
  .badge-risk { background: #fee2e2; color: #ef4444; }
  .actions-cell { display: flex; gap: 10px; align-items: center; flex-wrap: wrap; }
  .btn-action-icon { width: 35px; height: 35px; border-radius: 10px; border: 1px solid #e2e8f0; background: white; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: 0.2s; color: #475569; }
  .btn-action-icon:hover { background: #f8fafc; border-color: #cbd5e1; color: #0f172a; transform: translateY(-2px); }
  .btn-view-text { background: #f8fafc; border: 1px solid #e2e8f0; color: #0f172a; font-weight: 800; font-size: 12px; cursor: pointer; transition: 0.2s; padding: 8px 16px; border-radius: 10px; display: inline-flex; align-items: center; gap: 6px;}
  .btn-view-text:hover { background: #0f172a; color: white; border-color: #0f172a; transform: translateY(-2px); box-shadow: 0 4px 6px rgba(0,0,0,0.1); text-decoration: none; }
`;

const colorFor = (department = '') => {
  if (department.includes('SOFTWARE')) return '#3b82f6';
  if (department.includes('COMPUTER_INFORMATION')) return '#ec4899';
  if (department.includes('COMPUTER_SCIENCE')) return '#8b5cf6';
  return '#10b981';
};

const projectBucket = (student) => {
  if (!student.projectId) return 'No Project';
  if (student.projectStatus === 'ARCHIVED') return 'Archived';
  if (student.teamId) return 'With Team';
  return 'With Project';
};

const DeanStudentsList = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [deptFilter, setDeptFilter] = useState('All');
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const scope = location.pathname.startsWith('/admin') ? 'admin' : 'dean';
  const basePath = scope === 'admin' ? '/admin' : '/dean';

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    setSearchTerm(params.get('search') || location.state?.studentTarget || '');
  }, [location]);

  useEffect(() => {
    let cancelled = false;
    const loadStudents = async () => {
      setIsLoading(true);
      setError('');
      try {
        const data = await getAllStudents(scope);
        if (!cancelled) setStudents(data);
      } catch {
        if (!cancelled) {
          setError('Could not load students right now.');
          setStudents([]);
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };
    void loadStudents();
    return () => { cancelled = true; };
  }, [scope]);

  const departments = useMemo(() => [...new Set(students.map((student) => student.department).filter(Boolean))], [students]);
  const filteredStudents = students.filter((student) => {
    const searchable = [student.name, student.email, student.universityId, student.teamName, student.projectTitle, student.supervisorName, formatDepartmentLabel(student.department, '')].join(' ').toLowerCase();
    return searchable.includes(searchTerm.toLowerCase())
      && (statusFilter === 'All' || projectBucket(student) === statusFilter)
      && (deptFilter === 'All' || student.department === deptFilter);
  });

  const previewUser = (student) => ({ ...student, role: 'ROLE_STUDENT' });

  return (
    <div className="dean-std-container">
      <style>{studentStyles}</style>

      <div className="std-header-box">
        <div>
          <p className="std-kicker">Faculty Student Registry</p>
          <h1 className="std-title">All Registered Students</h1>
        </div>
        <div className="std-header-actions">
          <button className="btn-std-outline" onClick={() => navigate(`${basePath}/dashboard`)}>Back to Dashboard</button>
        </div>
      </div>

      <div className="std-stats-bar">
        <div className={`std-stat-pill ${statusFilter === 'All' ? 'active-filter' : ''}`} onClick={() => setStatusFilter('All')}><div className="std-icon-wrapper total">All</div><div className="std-stat-info"><h4>All</h4><p>{students.length}</p></div></div>
        <div className={`std-stat-pill ${statusFilter === 'With Team' ? 'active-filter' : ''}`} onClick={() => setStatusFilter('With Team')}><div className="std-icon-wrapper active">Team</div><div className="std-stat-info"><h4>With Team</h4><p>{students.filter((student) => projectBucket(student) === 'With Team').length}</p></div></div>
        <div className={`std-stat-pill ${statusFilter === 'With Project' ? 'active-filter' : ''}`} onClick={() => setStatusFilter('With Project')}><div className="std-icon-wrapper grad">Proj</div><div className="std-stat-info"><h4>Project</h4><p>{students.filter((student) => projectBucket(student) === 'With Project').length}</p></div></div>
        <div className={`std-stat-pill ${statusFilter === 'No Project' ? 'active-filter' : ''}`} onClick={() => setStatusFilter('No Project')}><div className="std-icon-wrapper delay">None</div><div className="std-stat-info"><h4>No Project</h4><p>{students.filter((student) => projectBucket(student) === 'No Project').length}</p></div></div>
        <div className={`std-stat-pill ${statusFilter === 'Archived' ? 'active-filter' : ''}`} onClick={() => setStatusFilter('Archived')}><div className="std-icon-wrapper risk">Arch</div><div className="std-stat-info"><h4>Archived</h4><p>{students.filter((student) => projectBucket(student) === 'Archived').length}</p></div></div>
      </div>

      <div className="std-toolbar">
        <SearchBar className="std-search" placeholder="Search students by name, ID, team, or project..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} onClear={() => setSearchTerm('')} />
        <StyledSelect className="std-filter" value={deptFilter} onChange={(e) => setDeptFilter(e.target.value)}>
          <option value="All">All Majors</option>
          {departments.map((department) => <option key={department} value={department}>{formatDepartmentLabel(department)}</option>)}
        </StyledSelect>
      </div>

      <div className="std-table-card">
        <table className="students-table">
          <thead>
            <tr><th>Student Profile</th><th>Major</th><th>Team & Project</th><th>Project Status</th><th>Supervisor</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan="6" style={{ textAlign: 'center', padding: '60px', color: '#64748b', fontWeight: 800 }}>Loading students...</td></tr>
            ) : error ? (
              <tr><td colSpan="6" style={{ textAlign: 'center', padding: '60px', color: '#ef4444', fontWeight: 800 }}>{error}</td></tr>
            ) : filteredStudents.length === 0 ? (
              <tr><td colSpan="6" style={{ textAlign: 'center', padding: '60px', color: '#94a3b8', fontWeight: 600 }}>No students found.</td></tr>
            ) : filteredStudents.map((student) => {
              const photoUrl = resolveProfilePhotoUrl(student.profilePhotoUrl);
              return (
                <tr key={student.id}>
                  <td>
                    <button type="button" className="std-profile-wrapper" onClick={() => setSelectedStudent(previewUser(student))}>
                      <span className="std-avatar" style={{ background: colorFor(student.department) }}>{photoUrl ? <img src={photoUrl} alt={student.name} /> : getUserInitials(student.name)}</span>
                      <span><span className="std-name">{student.name}</span><span className="std-id">{student.universityId || 'University ID not assigned'}</span></span>
                    </button>
                  </td>
                  <td style={{ fontWeight: 700, color: '#475569' }}>{formatDepartmentLabel(student.department, 'Major not assigned')}</td>
                  <td>
                    {student.teamName ? (
                      <div className="team-link" onClick={() => navigate(`${basePath}/teams?search=${encodeURIComponent(student.teamName)}`)}>{student.teamName}</div>
                    ) : <span style={{ color: '#94a3b8', fontWeight: 800 }}>No team linked</span>}
                    <br />
                    {student.projectTitle ? (
                      <div className="proj-link" onClick={() => navigate(`${basePath}/projects`, { state: { targetProj: student.projectTitle } })}>{student.projectTitle}</div>
                    ) : <span style={{ color: '#94a3b8', fontSize: 12, fontWeight: 800 }}>No project linked</span>}
                  </td>
                  <td>{student.projectStatus ? <ProjectStatusBadge status={student.projectStatus} /> : <span className="std-badge badge-delay">No Project</span>}</td>
                  <td>{student.supervisorName || <span style={{ color: '#94a3b8', fontWeight: 800 }}>Not assigned</span>}</td>
                  <td>
                    <div className="actions-cell">
                      {student.email ? <button className="btn-action-icon" title="Email Student" onClick={() => { window.location.href = `mailto:${student.email}`; }}>@</button> : <span style={{ fontSize: 12, color: '#94a3b8', fontWeight: 800 }}>Email not provided</span>}
                      <button className="btn-view-text" onClick={() => setSelectedStudent(previewUser(student))}>View Profile</button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <UserPreviewModal open={Boolean(selectedStudent)} onClose={() => setSelectedStudent(null)} userId={selectedStudent?.id} user={selectedStudent} title="Student Profile" />
    </div>
  );
};

export default DeanStudentsList;

