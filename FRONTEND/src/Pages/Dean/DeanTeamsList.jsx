import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getAllTeams } from '../../api/deanService';
import { getDeanProjects } from '../../api/projectService';
import ProjectHealthBadge from '../../components/ProjectHealthBadge';
import SearchBar from '../../components/SearchBar';
import StyledSelect from '../../components/StyledSelect';
import UserPreviewModal from '../../components/UserPreviewModal';
import {
  ALL_PROJECT_DOMAINS_OPTION,
  getProjectDomain,
  getProjectDomainLabel,
  PROJECT_DOMAIN_FILTER_OPTIONS,
  normalizeProjectDomainValue,
} from '../../utils/projectDomain';
import { formatDepartmentLabel, getUserInitials, resolveProfilePhotoUrl } from '../../utils/userMeta';

const ALL_CATEGORIES = ALL_PROJECT_DOMAINS_OPTION.value;

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
  .dt-stat-pill { background: white; border: 2px solid #e2e8f0; border-radius: 20px; padding: 20px 25px; display: flex; align-items: center; gap: 18px; cursor: pointer; transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease, background 0.2s ease; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.02); position: relative; overflow: hidden; }
  .dt-stat-pill:hover { transform: translateY(-6px); box-shadow: 0 15px 30px -5px rgba(0,0,0,0.08); border-color: #cbd5e1; }
  .dt-stat-pill.active-filter { border-color: #0f172a; box-shadow: 0 10px 20px -5px rgba(15, 23, 42, 0.15); }
  .dt-stat-pill.active-filter::before { content: ''; position: absolute; top: 0; left: 0; width: 100%; height: 4px; background: #0f172a; }
  .dt-icon-wrapper { width: 50px; height: 50px; border-radius: 14px; display: flex; align-items: center; justify-content: center; font-size: 18px; transition: 0.3s; font-weight: 900; }
  .dt-icon-wrapper.total { background: #f1f5f9; color: #475569; }
  .dt-icon-wrapper.good { background: #d1fae5; color: #059669; }
  .dt-icon-wrapper.warn { background: #fef3c7; color: #d97706; }
  .dt-icon-wrapper.danger { background: #fee2e2; color: #ef4444; }
  .dt-stat-info h4 { margin: 0; font-size: 13px; color: #64748b; text-transform: uppercase; font-weight: 800; letter-spacing: 0.5px; }
  .dt-stat-info p { margin: 5px 0 0 0; font-size: 32px; font-weight: 900; color: #0f172a; line-height: 1; }
  .dt-toolbar { display: flex; gap: 15px; background: white; padding: 15px; border-radius: 16px; border: 1px solid #e2e8f0; margin-bottom: 25px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.02); }
  .dt-search { flex-grow: 1; }
  .dt-filter { min-width: 220px; }
  .dt-table-card { background: white; border: 1px solid #e2e8f0; border-radius: 20px; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.02); overflow: hidden; }
  .teams-table { width: 100%; border-collapse: collapse; }
  .teams-table th { padding: 18px 25px; background: #f8fafc; font-size: 11px; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 1px; border-bottom: 1px solid #e2e8f0; text-align: left; }
  .teams-table td { padding: 20px 25px; border-bottom: 1px solid #f1f5f9; font-size: 14px; font-weight: 600; color: #1e293b; vertical-align: middle; }
  .teams-table tr:hover td { background: #fafafa; }
  .team-name { font-size: 15px; font-weight: 900; color: #0f172a; margin-bottom: 2px; }
  .team-id { font-size: 12px; color: #64748b; font-weight: 700; }
  .proj-assigned { font-size: 13px; font-weight: 700; color: #4f46e5; margin-top: 6px; display: inline-flex; align-items: center; gap: 5px; cursor: pointer; transition: 0.2s; }
  .proj-assigned:hover { color: #d97706; text-decoration: underline; }
  .proj-domain { font-size: 11px; color: #4338ca; font-weight: 800; text-transform: uppercase; background: #eef2ff; padding: 4px 10px; border-radius: 999px; display: inline-flex; width: fit-content; margin-top: 8px; }
  .avatar-group { display: flex; align-items: center; }
  .avatar-circle { width: 32px; height: 32px; border-radius: 50%; border: 2px solid white; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 800; color: white; margin-left: -10px; transition: 0.2s; cursor: pointer; box-shadow: 0 2px 4px rgba(0,0,0,0.1); overflow: hidden; }
  .avatar-circle:first-child { margin-left: 0; }
  .avatar-circle:hover { transform: translateY(-2px); z-index: 10; box-shadow: 0 10px 15px rgba(0,0,0,0.12); }
  .avatar-circle img, .sup-avatar img, .hc-avatar-lg img, .member-avatar img { width: 100%; height: 100%; object-fit: cover; }
  .avatar-more { background: #f1f5f9; color: #475569; border-color: white; }
  .sup-pill-wrapper { position: relative; display: inline-block; }
  .sup-pill { display: inline-flex; align-items: center; gap: 8px; background: #f1f5f9; padding: 6px 12px; border-radius: 10px; font-size: 13px; font-weight: 700; color: #334155; transition: 0.2s; border: 1px solid transparent; cursor: pointer; }
  .sup-pill-wrapper:hover .sup-pill { background: white; border-color: #cbd5e1; box-shadow: 0 2px 4px rgba(0,0,0,0.05); color: #4f46e5; }
  .sup-avatar { width: 22px; height: 22px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 10px; color: white; font-weight: bold; overflow: hidden; }
  .smart-hover-card { position: absolute; top: 50%; left: calc(100% + 15px); transform: translateY(-50%) translateX(-10px); background: white; border: 1px solid #e2e8f0; border-radius: 20px; width: 280px; padding: 25px; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1); opacity: 0; visibility: hidden; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); z-index: 100; pointer-events: none; }
  .sup-pill-wrapper:hover .smart-hover-card { opacity: 1; visibility: visible; transform: translateY(-50%) translateX(0); }
  .hc-header { display: flex; align-items: center; gap: 15px; margin-bottom: 20px; }
  .hc-avatar-lg { width: 50px; height: 50px; border-radius: 14px; display: flex; align-items: center; justify-content: center; font-size: 18px; color: white; font-weight: 800; box-shadow: 0 4px 6px rgba(0,0,0,0.1); overflow: hidden; }
  .hc-name { font-size: 16px; font-weight: 900; color: #0f172a; margin: 0 0 2px 0; }
  .hc-role { font-size: 12px; font-weight: 700; color: #64748b; margin: 0; }
  .hc-divider { height: 1px; background: #f1f5f9; margin: 15px 0; }
  .hc-stats-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
  .hc-stat-box { background: #f8fafc; padding: 12px; border-radius: 12px; border: 1px solid #f1f5f9; text-align: center; }
  .hc-stat-title { font-size: 10px; font-weight: 800; color: #94a3b8; text-transform: uppercase; margin-bottom: 4px; letter-spacing: 0.5px; }
  .hc-stat-value { font-size: 16px; font-weight: 900; color: #0f172a; }
  .btn-view-details { background: #f8fafc; border: 1px solid #e2e8f0; color: #0f172a; font-weight: 800; font-size: 12px; cursor: pointer; transition: 0.2s; padding: 8px 16px; border-radius: 10px; display: inline-flex; align-items: center; gap: 6px; }
  .btn-view-details:hover { background: #0f172a; color: white; border-color: #0f172a; transform: translateY(-2px); box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
  .modal-overlay { position: fixed; inset: 0; background: rgba(15, 23, 42, 0.6); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: 1000; animation: fadeIn 0.2s; }
  .modal-content { background: white; border-radius: 24px; width: 90%; max-width: 650px; overflow: hidden; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25); animation: slideUp 0.3s ease-out; text-align: left; }
  .modal-header-bg { background: linear-gradient(135deg, #0f172a, #1e293b); padding: 30px; color: white; position: relative; }
  .modal-close-btn { position: absolute; top: 15px; right: 15px; background: rgba(255,255,255,0.1); border: none; color: white; width: 30px; height: 30px; border-radius: 50%; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: 0.2s; }
  .modal-body { padding: 30px; max-height: 60vh; overflow-y: auto; }
  .member-list { display: flex; flex-direction: column; gap: 15px; margin-top: 20px; }
  .member-row { display: flex; align-items: center; justify-content: space-between; padding: 15px; background: #f8fafc; border: 1px solid #f1f5f9; border-radius: 14px; transition: 0.2s; cursor: pointer; }
  .member-row:hover { border-color: #4f46e5; background: white; box-shadow: 0 10px 15px -5px rgba(79, 70, 229, 0.1); transform: translateX(5px); }
  .member-info { display: flex; align-items: center; gap: 12px; }
  .member-avatar { width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-weight: 800; font-size: 14px; overflow: hidden; }
  .member-role { font-size: 11px; font-weight: 800; color: #4f46e5; text-transform: uppercase; background: #e0e7ff; padding: 3px 8px; border-radius: 6px; }
  @media (max-width: 980px) {
    .dt-header-box { align-items: flex-start; flex-direction: column; }
    .dt-stats-bar { grid-template-columns: repeat(2, 1fr); }
    .dt-toolbar { flex-direction: column; }
    .dt-filter { width: 100%; min-width: 0; }
  }
`;

const userForPreview = (user, role) => user ? { ...user, id: user.id ?? user.userId, role } : null;

const colorFor = (value = '') => {
  if (value.includes('SOFTWARE')) return '#3b82f6';
  if (value.includes('COMPUTER_INFORMATION')) return '#ec4899';
  if (value.includes('COMPUTER_SCIENCE')) return '#8b5cf6';
  return '#10b981';
};

const hasLinkedProject = (team) => Boolean(team?.projectId || team?.projectTitle);

const normalizeLookupKey = (value) => String(value || '').trim().toLowerCase();

const buildProjectDomainIndex = (projects) => {
  const byProjectId = new Map();
  const byProjectTitle = new Map();
  const byTeamName = new Map();

  projects.forEach((project) => {
    const projectDomain = getProjectDomain(project, '');
    if (!projectDomain) return;

    if (project?.id) {
      byProjectId.set(String(project.id), projectDomain);
    }

    if (project?.title) {
      byProjectTitle.set(normalizeLookupKey(project.title), projectDomain);
    }

    if (project?.teamName) {
      byTeamName.set(normalizeLookupKey(project.teamName), projectDomain);
    }
  });

  return { byProjectId, byProjectTitle, byTeamName };
};

const getCategoryLabelFromIndex = (team, domainIndex) => {
  if (!hasLinkedProject(team)) {
    return '';
  }

  const topLevelDomain = getProjectDomain(team, '');
  if (topLevelDomain) {
    return topLevelDomain;
  }

  const byProjectId = team?.projectId ? domainIndex.byProjectId.get(String(team.projectId)) : '';
  if (byProjectId) {
    return getProjectDomainLabel(byProjectId);
  }

  const byProjectTitle = team?.projectTitle ? domainIndex.byProjectTitle.get(normalizeLookupKey(team.projectTitle)) : '';
  if (byProjectTitle) {
    return getProjectDomainLabel(byProjectTitle);
  }

  const byTeamName = team?.teamName ? domainIndex.byTeamName.get(normalizeLookupKey(team.teamName)) : '';
  return byTeamName ? getProjectDomainLabel(byTeamName) : getProjectDomainLabel('');
};

const enrichTeamProjectDomain = (team, domainIndex) => ({
  ...team,
  projectDomain: getCategoryLabelFromIndex(team, domainIndex),
});

const resolveTeamProjectDomain = (team) => {
  if (!hasLinkedProject(team)) {
    return '';
  }

  return getProjectDomainLabel(team?.projectDomain, '');
};

const DeanTeamsList = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('All');
  const [categoryFilter, setCategoryFilter] = useState(ALL_CATEGORIES);
  const [teams, setTeams] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const scope = location.pathname.startsWith('/admin') ? 'admin' : 'dean';
  const basePath = scope === 'admin' ? '/admin' : '/dean';

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    setSearchTerm(params.get('search') || location.state?.targetTeam || '');
  }, [location.search, location.state]);

  useEffect(() => {
    let cancelled = false;

    const loadTeams = async () => {
      setIsLoading(true);
      setError('');
      try {
        const [teamsData, projectsResponse] = await Promise.all([
          getAllTeams(scope),
          getDeanProjects(),
        ]);
        const projectsPayload = projectsResponse?.data;
        const projects = Array.isArray(projectsPayload)
          ? projectsPayload
          : Array.isArray(projectsPayload?.projects)
            ? projectsPayload.projects
            : [];
        const domainIndex = buildProjectDomainIndex(projects);
        if (!cancelled) {
          const items = Array.isArray(teamsData) ? teamsData : [];
          setTeams(items.map((team) => enrichTeamProjectDomain(team, domainIndex)));
        }
      } catch {
        if (!cancelled) {
          setError('Could not load teams right now.');
          setTeams([]);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    void loadTeams();
    return () => {
      cancelled = true;
    };
  }, [scope]);

  const categoryOptions = PROJECT_DOMAIN_FILTER_OPTIONS;

  useEffect(() => {
    const requestedCategory = new URLSearchParams(location.search).get('category') || '';
    const normalizedCategory = normalizeProjectDomainValue(requestedCategory, '');
    const matchingOption = categoryOptions.find((option) => option.value === normalizedCategory);
    setCategoryFilter(matchingOption ? matchingOption.value : ALL_CATEGORIES);
  }, [location.search, categoryOptions]);

  const filteredTeams = useMemo(() => teams.filter((team) => {
    const searchable = [
      team.teamName,
      team.projectTitle,
      resolveTeamProjectDomain(team),
      team.supervisor?.name,
      team.leader?.name,
      ...(team.members ?? []).map((member) => member.name),
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();

    const matchesSearch = searchable.includes(searchTerm.toLowerCase());
    const matchesFilter = filter === 'All'
      || (filter === 'With Project' && team.projectId)
      || (filter === 'No Project' && !team.projectId)
      || (filter === 'No Supervisor' && !team.supervisor);
    const teamCategory = normalizeProjectDomainValue(resolveTeamProjectDomain(team));
    const matchesCategory = categoryFilter === ALL_CATEGORIES || teamCategory === categoryFilter;

    return matchesSearch && matchesFilter && matchesCategory;
  }), [categoryFilter, filter, searchTerm, teams]);

  const goToStudent = (member) => {
    const query = encodeURIComponent(member?.name || member?.universityId || member?.id || member?.userId || '');
    navigate(`${basePath}/students?search=${query}`);
  };

  const setCategoryAndUrl = (nextCategory) => {
    setCategoryFilter(nextCategory);
    const params = new URLSearchParams(location.search);

    if (!nextCategory || nextCategory === ALL_CATEGORIES) {
      params.delete('category');
    } else {
      params.set('category', nextCategory);
    }

    const search = params.toString();
    navigate(`${location.pathname}${search ? `?${search}` : ''}`, { replace: true });
  };

  const renderAvatar = (user, index = 0, onClick) => {
    const photoUrl = resolveProfilePhotoUrl(user?.profilePhotoUrl);
    return (
      <button
        type="button"
        key={user?.id ?? user?.userId ?? index}
        className="avatar-circle"
        style={{ background: colorFor(user?.department), zIndex: 10 - index }}
        onClick={onClick}
        title={user?.name || 'Not provided'}
      >
        {photoUrl ? <img src={photoUrl} alt={user?.name || 'User'} /> : getUserInitials(user?.name)}
      </button>
    );
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
          <button className="btn-dt-outline" onClick={() => navigate(`${basePath}/dashboard`)}>Back to Dashboard</button>
        </div>
      </div>

      <div className="dt-stats-bar">
        <div className={`dt-stat-pill ${filter === 'All' ? 'active-filter' : ''}`} onClick={() => setFilter('All')}><div className="dt-icon-wrapper total">All</div><div className="dt-stat-info"><h4>Total Teams</h4><p>{teams.length}</p></div></div>
        <div className={`dt-stat-pill ${filter === 'With Project' ? 'active-filter' : ''}`} onClick={() => setFilter('With Project')}><div className="dt-icon-wrapper good">P</div><div className="dt-stat-info"><h4>With Project</h4><p>{teams.filter((team) => team.projectId).length}</p></div></div>
        <div className={`dt-stat-pill ${filter === 'No Project' ? 'active-filter' : ''}`} onClick={() => setFilter('No Project')}><div className="dt-icon-wrapper warn">0</div><div className="dt-stat-info"><h4>No Project</h4><p>{teams.filter((team) => !team.projectId).length}</p></div></div>
        <div className={`dt-stat-pill ${filter === 'No Supervisor' ? 'active-filter' : ''}`} onClick={() => setFilter('No Supervisor')}><div className="dt-icon-wrapper danger">S</div><div className="dt-stat-info"><h4>No Supervisor</h4><p>{teams.filter((team) => !team.supervisor).length}</p></div></div>
      </div>

      <div className="dt-toolbar">
        <SearchBar className="dt-search" placeholder="Search teams, projects, supervisors, or members..." value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} onClear={() => setSearchTerm('')} />
        <StyledSelect className="dt-filter" value={categoryFilter} onChange={(event) => setCategoryAndUrl(event.target.value)}>
          {categoryOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
        </StyledSelect>
      </div>

      <div className="dt-table-card">
        <table className="teams-table">
          <thead>
            <tr><th>Team / Project</th><th>Supervisor</th><th>Members</th><th>Project Health</th><th>Action</th></tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan="5" style={{ textAlign: 'center', padding: '60px', color: '#64748b', fontWeight: 800 }}>Loading teams...</td></tr>
            ) : error ? (
              <tr><td colSpan="5" style={{ textAlign: 'center', padding: '60px', color: '#ef4444', fontWeight: 800 }}>{error}</td></tr>
            ) : filteredTeams.length === 0 ? (
              <tr><td colSpan="5" style={{ textAlign: 'center', padding: '60px', color: '#94a3b8', fontWeight: 600 }}>{teams.length === 0 ? 'No teams found.' : 'No teams match the selected filters.'}</td></tr>
            ) : filteredTeams.map((team) => {
              const supervisor = userForPreview(team.supervisor, 'ROLE_SUPERVISOR');
              const supervisorPhoto = resolveProfilePhotoUrl(supervisor?.profilePhotoUrl);
              const projectDomain = resolveTeamProjectDomain(team);

              return (
                <tr key={team.teamId}>
                  <td>
                    <div className="team-name">{team.teamName || 'Unnamed team'}</div>
                    <div className="team-id">{team.projectTitle ? `Project: ${team.projectTitle}` : 'No project linked'}</div>
                    {projectDomain ? <div className="proj-domain">{projectDomain}</div> : null}
                    {team.projectTitle ? <div className="proj-assigned" onClick={() => navigate(`${basePath}/projects`, { state: { targetProj: team.projectTitle } })}>Open project</div> : null}
                  </td>
                  <td>
                    {supervisor ? (
                      <div className="sup-pill-wrapper">
                        <button type="button" className="sup-pill" onClick={() => setSelectedUser(supervisor)}>
                          <span className="sup-avatar" style={{ background: colorFor(supervisor.department) }}>{supervisorPhoto ? <img src={supervisorPhoto} alt={supervisor.name} /> : getUserInitials(supervisor.name)}</span>
                          {supervisor.name}
                        </button>
                        <div className="smart-hover-card">
                          <div className="hc-header">
                            <div className="hc-avatar-lg" style={{ background: colorFor(supervisor.department) }}>{supervisorPhoto ? <img src={supervisorPhoto} alt={supervisor.name} /> : getUserInitials(supervisor.name)}</div>
                            <div><h4 className="hc-name">{supervisor.name}</h4><p className="hc-role">{formatDepartmentLabel(supervisor.department, 'Not provided')}</p></div>
                          </div>
                          <div className="hc-divider"></div>
                          <div className="hc-stats-grid">
                            <div className="hc-stat-box"><div className="hc-stat-title">Email</div><div className="hc-stat-value" style={{ fontSize: 12 }}>{supervisor.email || 'Not provided'}</div></div>
                            <div className="hc-stat-box"><div className="hc-stat-title">Office</div><div className="hc-stat-value" style={{ fontSize: 12 }}>{supervisor.officeHours || 'Not provided'}</div></div>
                          </div>
                        </div>
                      </div>
                    ) : <span style={{ color: '#94a3b8', fontWeight: 800 }}>Not assigned</span>}
                  </td>
                  <td>
                    <div className="avatar-group">
                      {(team.members ?? []).slice(0, 3).map((member, index) => renderAvatar(member, index, () => goToStudent(member)))}
                      {(team.members ?? []).length > 3 ? <div className="avatar-circle avatar-more">+{team.members.length - 3}</div> : null}
                    </div>
                  </td>
                  <td>{team.projectHealth ? <ProjectHealthBadge health={team.projectHealth} reason={team.projectHealthReason} /> : <span className="proj-domain">No project linked</span>}</td>
                  <td><button className="btn-view-details" onClick={() => setSelectedTeam(team)}>View Team</button></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {selectedTeam ? (
        <div className="modal-overlay" onClick={() => setSelectedTeam(null)}>
          <div className="modal-content" onClick={(event) => event.stopPropagation()}>
            <div className="modal-header-bg">
              <button className="modal-close-btn" onClick={() => setSelectedTeam(null)}>x</button>
              <h2 style={{ margin: '0 0 5px 0', fontSize: '28px', fontWeight: 900 }}>{selectedTeam.teamName}</h2>
              <p style={{ margin: 0, fontSize: '15px', opacity: 0.9 }}>{selectedTeam.projectTitle ? `Project: ${selectedTeam.projectTitle}` : 'No project linked'}</p>
            </div>
            <div className="modal-body">
              <h3 style={{ fontSize: '16px', fontWeight: 900, color: '#0f172a', margin: '0 0 15px 0' }}>Team Members ({selectedTeam.members?.length ?? 0})</h3>
              <div className="member-list">
                {(selectedTeam.members ?? []).map((member) => {
                  const photoUrl = resolveProfilePhotoUrl(member.profilePhotoUrl);
                  return (
                    <div key={member.id ?? member.userId} className="member-row" onClick={() => { setSelectedTeam(null); goToStudent(member); }}>
                      <div className="member-info">
                        <div className="member-avatar" style={{ background: colorFor(member.department) }}>{photoUrl ? <img src={photoUrl} alt={member.name} /> : getUserInitials(member.name)}</div>
                        <div><div style={{ fontSize: '15px', fontWeight: 800 }}>{member.name}</div><div style={{ fontSize: '12px', color: '#64748b' }}>{member.universityId || 'University ID not assigned'}</div></div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}><div className="member-role">{member.roleInTeam || 'MEMBER'}</div><div style={{ color: '#94a3b8' }}>→</div></div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      ) : null}

      <UserPreviewModal open={Boolean(selectedUser)} onClose={() => setSelectedUser(null)} userId={selectedUser?.id} user={selectedUser} />
    </div>
  );
};

export default DeanTeamsList;
