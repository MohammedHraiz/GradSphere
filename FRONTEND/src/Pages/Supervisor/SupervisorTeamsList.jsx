import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getMySupervisorProjects } from '../../api/projectService';
import ProjectHealthBadge from '../../components/ProjectHealthBadge';
import ProjectStatusBadge from '../../components/ProjectStatusBadge';
import SearchBar from '../../components/SearchBar';
import StyledSelect from '../../components/StyledSelect';
import {
  coerceProjectDomainFilter,
  getProjectDomainLabel,
  getProjectDomainOptions,
  resolveProjectDomainValue,
} from '../../utils/projectDomain';
import { formatProjectHealth, normalizeProjectHealth } from '../../utils/projectHealth';
import { normalizeProjectStatus } from '../../utils/projectStatus';

const ALL_CATEGORIES = 'All Categories';
const ALL_HEALTH = 'All Health';

const pageStyles = `
  .sup-teams-page { padding: 20px 30px 60px; font-family: 'Plus Jakarta Sans', -apple-system, sans-serif; color: #0f172a; background: #f8fafc; min-height: 100vh; text-align: left; }
  .sup-teams-header { display: flex; justify-content: space-between; align-items: center; gap: 20px; margin-bottom: 28px; background: white; padding: 24px 28px; border-radius: 22px; border: 1px solid #e2e8f0; box-shadow: 0 10px 22px -24px rgba(15,23,42,.7); }
  .sup-teams-hero-content { flex: 1 1 auto; min-width: 0; }
  .sup-teams-kicker { color: #2563eb; font-size: 12px; font-weight: 900; text-transform: uppercase; letter-spacing: .08em; margin: 0 0 6px; }
  .sup-teams-title { margin: 0; font-size: 32px; font-weight: 900; color: #0f172a; letter-spacing: -0.04em; }
  .sup-teams-subtitle { margin: 8px 0 0; color: #64748b; font-size: 14px; font-weight: 600; max-width: 700px; line-height: 1.6; }
  .sup-teams-actions { display: flex; align-items: center; justify-content: flex-end; gap: 12px; flex: 0 0 auto; flex-wrap: nowrap; }
  .sup-teams-btn { min-height: 46px; border: 1px solid #cbd5e1; background: white; color: #334155; border-radius: 12px; padding: 11px 18px; font-size: 13px; font-weight: 800; cursor: pointer; white-space: nowrap; transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease; }
  .sup-teams-btn:hover { transform: translateY(-2px); border-color: #94a3b8; box-shadow: 0 12px 24px -18px rgba(15,23,42,.35); color: #0f172a; }
  .sup-teams-btn.secondary { background: #ffffff; color: #334155; }
  .sup-teams-btn.primary { color: white; border-color: transparent; background: linear-gradient(135deg, #4f46e5, #2563eb); box-shadow: 0 18px 26px -18px rgba(79,70,229,.65); }
  .sup-teams-grid { display: grid; grid-template-columns: repeat(6, minmax(0, 1fr)); gap: 18px; margin-bottom: 24px; }
  .sup-teams-stat { position: relative; overflow: hidden; background: white; border: 2px solid #e2e8f0; border-radius: 20px; padding: 18px; cursor: pointer; box-shadow: 0 10px 22px -24px rgba(15,23,42,.65); transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease, background 0.2s ease; }
  .sup-teams-stat::before { content: ''; position: absolute; inset: 0 0 auto 0; height: 4px; background: var(--card-accent, #818cf8); opacity: 0; transition: opacity 0.2s ease; }
  .sup-teams-stat:hover { transform: translateY(-4px); box-shadow: 0 16px 30px rgba(15, 23, 42, 0.12); border-color: var(--card-accent-soft, #cbd5e1); }
  .sup-teams-stat:hover::before, .sup-teams-stat.active::before { opacity: 1; }
  .sup-teams-stat.active { border-color: var(--card-accent, #818cf8); background: linear-gradient(180deg, var(--card-tint, rgba(238,242,255,.92)), white); box-shadow: 0 18px 34px -24px rgba(79,70,229,.55); }
  .sup-teams-stat-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 14px; margin-bottom: 12px; }
  .sup-teams-stat-badge { width: 46px; height: 46px; border-radius: 14px; display: inline-flex; align-items: center; justify-content: center; background: var(--card-badge-bg, #eef2ff); color: var(--card-accent, #4338ca); font-size: 18px; box-shadow: inset 0 0 0 1px rgba(255,255,255,.65); }
  .sup-teams-stat-copy { min-width: 0; }
  .sup-teams-stat-label { margin: 0 0 10px; font-size: 11px; color: #64748b; text-transform: uppercase; font-weight: 900; letter-spacing: .08em; }
  .sup-teams-stat-value { margin: 0; font-size: 30px; color: #0f172a; font-weight: 900; }
  .sup-teams-stat-note { margin: 8px 0 0; color: #64748b; font-size: 12px; font-weight: 700; line-height: 1.5; }
  .sup-teams-stat.total { --card-accent: #4f46e5; --card-accent-soft: #c7d2fe; --card-badge-bg: #eef2ff; --card-tint: rgba(238,242,255,.94); }
  .sup-teams-stat.active-projects { --card-accent: #16a34a; --card-accent-soft: #bbf7d0; --card-badge-bg: #dcfce7; --card-tint: rgba(240,253,244,.96); }
  .sup-teams-stat.pending { --card-accent: #d97706; --card-accent-soft: #fde68a; --card-badge-bg: #fef3c7; --card-tint: rgba(255,251,235,.98); }
  .sup-teams-stat.feedback { --card-accent: #2563eb; --card-accent-soft: #bfdbfe; --card-badge-bg: #dbeafe; --card-tint: rgba(239,246,255,.98); }
  .sup-teams-stat.risk { --card-accent: #dc2626; --card-accent-soft: #fecaca; --card-badge-bg: #fee2e2; --card-tint: rgba(255,241,242,.98); }
  .sup-teams-stat.archived { --card-accent: #475569; --card-accent-soft: #cbd5e1; --card-badge-bg: #e2e8f0; --card-tint: rgba(248,250,252,.98); }
  .sup-teams-toolbar { display: flex; gap: 14px; align-items: center; background: white; border: 1px solid #e2e8f0; border-radius: 18px; padding: 14px; margin-bottom: 22px; box-shadow: 0 10px 22px -24px rgba(15,23,42,.65); }
  .sup-teams-search { flex: 1 1 320px; }
  .sup-teams-filter { min-width: 210px; }
  .sup-teams-table-card { background: white; border: 1px solid #e2e8f0; border-radius: 22px; box-shadow: 0 10px 22px -24px rgba(15,23,42,.7); overflow: hidden; }
  .sup-teams-table-wrap { overflow-x: auto; }
  .sup-teams-table { width: 100%; border-collapse: collapse; min-width: 1060px; }
  .sup-teams-table th { padding: 17px 20px; background: #f8fafc; color: #64748b; font-size: 11px; font-weight: 900; text-transform: uppercase; letter-spacing: .08em; border-bottom: 1px solid #e2e8f0; text-align: left; }
  .sup-teams-table td { padding: 18px 20px; border-bottom: 1px solid #f1f5f9; vertical-align: middle; font-size: 14px; color: #0f172a; font-weight: 600; }
  .sup-teams-table tbody tr:hover td { background: #fafcff; }
  .sup-team-project { display: grid; gap: 6px; }
  .sup-team-project strong { font-size: 15px; color: #0f172a; }
  .sup-team-project small { color: #64748b; font-size: 12px; font-weight: 700; }
  .sup-domain-pill { display: inline-flex; width: fit-content; align-items: center; gap: 6px; padding: 5px 10px; border-radius: 999px; background: #eef2ff; color: #4338ca; font-size: 11px; font-weight: 900; text-transform: uppercase; letter-spacing: .06em; }
  .sup-members-cell { display: grid; gap: 6px; }
  .sup-members-count { color: #0f172a; font-weight: 800; font-size: 13px; }
  .sup-members-list { color: #64748b; font-size: 12px; font-weight: 700; line-height: 1.5; }
  .sup-health-pill { display: inline-flex; align-items: center; gap: 6px; padding: 6px 10px; border-radius: 999px; font-size: 11px; font-weight: 900; text-transform: uppercase; letter-spacing: .06em; }
  .sup-health-pill.archived { background: #f1f5f9; color: #475569; border: 1px solid #cbd5e1; }
  .sup-feedback-cell { display: grid; gap: 6px; }
  .sup-feedback-text { color: #0f172a; font-size: 13px; font-weight: 700; line-height: 1.55; }
  .sup-feedback-muted { color: #64748b; font-size: 12px; font-weight: 700; }
  .sup-feedback-empty { color: #94a3b8; font-size: 12px; font-weight: 700; }
  .sup-teams-actions-col { display: flex; flex-wrap: wrap; gap: 8px; }
  .sup-action-btn { border: 1px solid #cbd5e1; background: white; color: #0f172a; border-radius: 10px; padding: 8px 12px; font-size: 12px; font-weight: 900; cursor: pointer; transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease, background 0.2s ease; }
  .sup-action-btn:hover { transform: translateY(-2px); border-color: #818cf8; box-shadow: 0 12px 24px -18px rgba(79,70,229,.55); }
  .sup-action-btn.primary { color: white; border-color: transparent; background: linear-gradient(135deg, #4f46e5, #2563eb); }
  .sup-table-state { padding: 60px 24px; text-align: center; color: #64748b; font-size: 14px; font-weight: 700; }
  .sup-table-state.error { color: #be123c; background: #fff1f2; }
  @media (max-width: 1280px) { .sup-teams-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); } }
  @media (max-width: 980px) {
    .sup-teams-page { padding-inline: 20px; }
    .sup-teams-header { flex-direction: column; align-items: flex-start; }
    .sup-teams-actions { width: 100%; flex-wrap: wrap; justify-content: flex-start; }
    .sup-teams-btn { flex: 1 1 220px; }
    .sup-teams-toolbar { flex-direction: column; align-items: stretch; }
    .sup-teams-filter { width: 100%; min-width: 0; }
    .sup-teams-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  }
  @media (max-width: 640px) {
    .sup-teams-grid { grid-template-columns: 1fr; }
    .sup-teams-title { font-size: 28px; }
    .sup-teams-btn { width: 100%; }
  }
`;

const deriveProjectHealth = (project) => {
  const explicitHealth = String(project?.projectHealth || '').trim();
  if (explicitHealth) {
    return normalizeProjectHealth(explicitHealth);
  }

  const status = normalizeProjectStatus(project?.status);
  if (status === 'ARCHIVED') return 'ARCHIVED';
  if (status === 'REJECTED' || status === 'NEEDS_CHANGES') return 'AT_RISK';
  return 'ON_TRACK';
};

const deriveSummaryFilterMatch = (project, filterKey) => {
  const status = project.normalizedStatus;
  const health = project.projectHealth;

  if (filterKey === 'ALL') return true;
  if (filterKey === 'ACTIVE') return !['ARCHIVED', 'REJECTED'].includes(status);
  if (filterKey === 'PENDING') return ['PENDING', 'SUBMITTED'].includes(status);
  if (filterKey === 'NEEDS_FEEDBACK') return ['UNDER_REVIEW', 'NEEDS_CHANGES'].includes(status);
  if (filterKey === 'AT_RISK') return ['AT_RISK', 'DELAYED'].includes(health) || status === 'REJECTED';
  if (filterKey === 'ARCHIVED') return ['ARCHIVED', 'COMPLETED'].includes(status) || health === 'ARCHIVED';
  return true;
};

const buildProjectSummary = (project) => {
  const names = (project.teamMembers || [])
    .map((member) => member?.name)
    .filter(Boolean);

  if (!names.length) {
    return 'No student members linked yet';
  }

  if (names.length <= 3) {
    return names.join(', ');
  }

  return `${names.slice(0, 3).join(', ')} +${names.length - 3} more`;
};

const normalizeSupervisorProject = (project) => {
  const projectDomain = getProjectDomainLabel(resolveProjectDomainValue(project));
  const normalizedStatus = normalizeProjectStatus(project?.status);
  const projectHealth = deriveProjectHealth(project);

  return {
    ...project,
    projectDomain,
    normalizedStatus,
    projectHealth,
    latestUpdate: project?.updatedAt || project?.submittedAt || project?.createdAt || '',
    latestFeedbackText: String(project?.latestFeedback || '').trim(),
    membersSummary: buildProjectSummary(project),
    membersCount: Array.isArray(project?.teamMembers) ? project.teamMembers.length : 0,
  };
};

const summaryCards = [
  { key: 'ALL', title: 'Total Assigned Teams', note: 'Every team you can supervise on this workspace.', icon: '👥', toneClass: 'total' },
  { key: 'ACTIVE', title: 'Active Projects', note: 'Current teams still moving through the workflow.', icon: '✅', toneClass: 'active-projects' },
  { key: 'PENDING', title: 'Pending Proposals', note: 'Waiting for your review or response.', icon: '📝', toneClass: 'pending' },
  { key: 'NEEDS_FEEDBACK', title: 'Needs Feedback', note: 'Projects currently in a review or revision stage.', icon: '💬', toneClass: 'feedback' },
  { key: 'AT_RISK', title: 'Delayed / At Risk', note: 'Projects that need quick attention.', icon: '⚠️', toneClass: 'risk' },
  { key: 'ARCHIVED', title: 'Completed / Archived', note: 'Closed or archived project work.', icon: '📦', toneClass: 'archived' },
];

const SupervisorTeamsList = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState(ALL_CATEGORIES);
  const [healthFilter, setHealthFilter] = useState(ALL_HEALTH);
  const [summaryFilter, setSummaryFilter] = useState('ALL');
  const [projects, setProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    setSearchTerm(params.get('search') || location.state?.targetProject || '');
  }, [location.search, location.state]);

  useEffect(() => {
    let cancelled = false;

    const loadProjects = async () => {
      setIsLoading(true);
      setError('');
      try {
        const response = await getMySupervisorProjects();
        const items = Array.isArray(response?.data) ? response.data : [];
        if (!cancelled) {
          setProjects(items.map(normalizeSupervisorProject));
        }
      } catch (err) {
        if (!cancelled) {
          setProjects([]);
          setError(err?.response?.data?.message || err?.message || 'Unable to load your assigned teams.');
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    void loadProjects();
    return () => {
      cancelled = true;
    };
  }, []);

  const categoryOptions = useMemo(
    () => [ALL_CATEGORIES, ...getProjectDomainOptions(projects, (project) => project.projectDomain)],
    [projects],
  );

  useEffect(() => {
    const requestedCategory = new URLSearchParams(location.search).get('category') || '';
    setCategoryFilter(coerceProjectDomainFilter(requestedCategory, categoryOptions, ALL_CATEGORIES));
  }, [location.search, categoryOptions]);

  const counts = useMemo(() => (
    summaryCards.reduce((accumulator, card) => {
      accumulator[card.key] = projects.filter((project) => deriveSummaryFilterMatch(project, card.key)).length;
      return accumulator;
    }, {})
  ), [projects]);

  const filteredProjects = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    return projects.filter((project) => {
      const matchesSearch = !query || [
        project.title,
        project.teamName,
        project.projectDomain,
        project.latestFeedbackText,
        ...(project.teamMembers || []).map((member) => member?.name),
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query));

      const matchesCategory = categoryFilter === ALL_CATEGORIES || project.projectDomain === categoryFilter;
      const matchesHealth = healthFilter === ALL_HEALTH
        || (healthFilter === 'ARCHIVED'
          ? project.projectHealth === 'ARCHIVED'
          : project.projectHealth === healthFilter);
      const matchesSummary = deriveSummaryFilterMatch(project, summaryFilter);

      return matchesSearch && matchesCategory && matchesHealth && matchesSummary;
    });
  }, [categoryFilter, healthFilter, projects, searchTerm, summaryFilter]);

  const updateCategoryFilter = (nextCategory) => {
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

  return (
    <div className="sup-teams-page">
      <style>{pageStyles}</style>

      <div className="sup-teams-header">
        <div className="sup-teams-hero-content">
          <p className="sup-teams-kicker">Supervisor / Team Workspace</p>
          <h1 className="sup-teams-title">My Teams</h1>
          <p className="sup-teams-subtitle">Track only the teams and projects assigned to you, filter by category or health, and jump straight into proposal review when a project needs attention.</p>
        </div>
        <div className="sup-teams-actions">
          <button className="sup-teams-btn secondary" onClick={() => navigate('/supervisor/dashboard')}>Back to Dashboard</button>
          <button className="sup-teams-btn primary" onClick={() => navigate('/supervisor/projects')}>Open Proposal Review</button>
        </div>
      </div>

      <div className="sup-teams-grid">
        {summaryCards.map((card) => (
          <button
            key={card.key}
            type="button"
            className={`sup-teams-stat ${card.toneClass} ${summaryFilter === card.key ? 'active' : ''}`}
            onClick={() => setSummaryFilter(card.key)}
          >
            <div className="sup-teams-stat-head">
              <div className="sup-teams-stat-copy">
                <p className="sup-teams-stat-label">{card.title}</p>
                <p className="sup-teams-stat-value">{counts[card.key] ?? 0}</p>
              </div>
              <span className="sup-teams-stat-badge" aria-hidden="true">{card.icon}</span>
            </div>
            <p className="sup-teams-stat-note">{card.note}</p>
          </button>
        ))}
      </div>

      <div className="sup-teams-toolbar">
        <SearchBar
          className="sup-teams-search"
          placeholder="Search teams, projects, students, or feedback..."
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          onClear={() => setSearchTerm('')}
        />
        <StyledSelect className="sup-teams-filter" value={categoryFilter} onChange={(event) => updateCategoryFilter(event.target.value)}>
          {categoryOptions.map((option) => <option key={option} value={option}>{option}</option>)}
        </StyledSelect>
        <StyledSelect className="sup-teams-filter" value={healthFilter} onChange={(event) => setHealthFilter(event.target.value)}>
          <option value={ALL_HEALTH}>All Health</option>
          <option value="ON_TRACK">On Track</option>
          <option value="AT_RISK">At Risk</option>
          <option value="DELAYED">Delayed</option>
          <option value="ARCHIVED">Archived</option>
        </StyledSelect>
      </div>

      <div className="sup-teams-table-card">
        <div className="sup-teams-table-wrap">
          <table className="sup-teams-table">
            <thead>
              <tr>
                <th>Team / Project</th>
                <th>Members</th>
                <th>Project Category</th>
                <th>Proposal Status</th>
                <th>Project Health</th>
                <th>Latest Feedback / Last Update</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan="7" className="sup-table-state">Loading your teams...</td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan="7" className="sup-table-state error">{error}</td>
                </tr>
              ) : filteredProjects.length === 0 ? (
                <tr>
                  <td colSpan="7" className="sup-table-state">
                    {projects.length === 0
                      ? 'No assigned teams are linked to your supervisor account yet.'
                      : 'No teams match the current search and filter selection.'}
                  </td>
                </tr>
              ) : filteredProjects.map((project) => (
                <tr key={project.id}>
                  <td>
                    <div className="sup-team-project">
                      <strong>{project.title || 'Untitled Project'}</strong>
                      <small>Team: {project.teamName || 'Not linked'}</small>
                    </div>
                  </td>
                  <td>
                    <div className="sup-members-cell">
                      <span className="sup-members-count">{project.membersCount} member{project.membersCount === 1 ? '' : 's'}</span>
                      <span className="sup-members-list">{project.membersSummary}</span>
                    </div>
                  </td>
                  <td>
                    <span className="sup-domain-pill">{project.projectDomain}</span>
                  </td>
                  <td>
                    <ProjectStatusBadge status={project.status} />
                  </td>
                  <td>
                    {project.projectHealth === 'ARCHIVED' ? (
                      <span className="sup-health-pill archived">Archived</span>
                    ) : (
                      <ProjectHealthBadge health={project.projectHealth} reason={project.projectHealthReason || formatProjectHealth(project.projectHealth)} />
                    )}
                  </td>
                  <td>
                    <div className="sup-feedback-cell">
                      {project.latestFeedbackText ? (
                        <span className="sup-feedback-text">{project.latestFeedbackText}</span>
                      ) : (
                        <span className="sup-feedback-empty">No feedback recorded yet.</span>
                      )}
                      <span className="sup-feedback-muted">
                        {project.latestUpdate ? `Updated ${new Date(project.latestUpdate).toLocaleDateString()}` : 'No recent update timestamp'}
                      </span>
                    </div>
                  </td>
                  <td>
                    <div className="sup-teams-actions-col">
                      <button
                        type="button"
                        className="sup-action-btn primary"
                        onClick={() => navigate('/supervisor/projects', { state: { targetProject: project.title } })}
                      >
                        Open Project
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SupervisorTeamsList;
