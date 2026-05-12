import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getSupervisorMyStudents } from '../../api/userService';
import ProjectStatusBadge from '../../components/ProjectStatusBadge';
import SearchBar from '../../components/SearchBar';
import UserPreviewModal from '../../components/UserPreviewModal';
import { openTeamsChat } from '../../utils/teamsLink';
import {
  formatMajorLabel,
  getRoleTheme,
  getUserInitials,
  resolveProfilePhotoUrl,
} from '../../utils/userMeta';
import StyledSelect from '../../components/StyledSelect';

const styles = `
.students-container { display: flex; flex-direction: column; gap: 24px; animation: fadeIn 0.4s ease-out; width: 100%; text-align: left; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
.students-header { display: flex; justify-content: space-between; align-items: flex-end; border-bottom: 1px solid #e2e8f0; padding-bottom: 20px; flex-wrap: wrap; gap: 20px; }
.breadcrumb-text { font-size: 13px; font-weight: 800; color: #4f46e5; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 5px; }
.page-title { font-size: 28px; font-weight: 900; color: #0f172a; margin: 0; letter-spacing: -0.5px; }
.students-header-copy { margin: 8px 0 0; color: #64748b; font-size: 14px; font-weight: 600; line-height: 1.6; max-width: 760px; }
.students-count-pill { display: inline-flex; align-items: center; padding: 8px 12px; border-radius: 999px; border: 1px solid #c7d2fe; background: #eef2ff; color: #4f46e5; font-size: 12px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.08em; }
.filter-bar-saas { display: flex; gap: 16px; background: white; padding: 15px; border-radius: 16px; border: 1px solid #e2e8f0; flex-wrap: wrap; box-shadow: 0 14px 32px -28px rgba(15,23,42,0.28); }
.search-wrapper { flex: 1; min-width: 280px; }
.saas-select { padding: 10px 14px; border: 1px solid #e2e8f0; border-radius: 12px; background: #f8fafc; font: inherit; font-weight: 800; color: #475569; min-width: 210px; }
.students-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 20px; }
.student-card-saas { background: white; border: 1px solid #e2e8f0; border-radius: 18px; padding: 22px; transition: transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease; box-shadow: 0 10px 28px -24px rgba(15,23,42,0.3); cursor: pointer; display: grid; gap: 18px; }
.student-card-saas:hover { transform: translateY(-3px); border-color: #c7d2fe; box-shadow: 0 18px 36px -28px rgba(79,70,229,0.42); }
.student-card-saas:focus-visible { outline: 3px solid rgba(79,70,229,0.22); outline-offset: 3px; }
.card-header { display: flex; align-items: center; gap: 14px; min-width: 0; }
.avatar-large { width: 52px; height: 52px; border-radius: 16px; color: white; font-size: 18px; font-weight: 900; display: flex; align-items: center; justify-content: center; overflow: hidden; flex: 0 0 auto; }
.avatar-large img { width: 100%; height: 100%; object-fit: cover; }
.student-info { min-width: 0; }
.student-info h3 { margin: 0; font-size: 16px; font-weight: 900; color: #0f172a; overflow-wrap: anywhere; }
.student-id { display: block; margin-top: 4px; font-size: 12px; color: #64748b; font-weight: 800; }
.student-major { display: block; margin-top: 4px; font-size: 12px; color: #475569; font-weight: 700; }
.student-meta-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }
.student-meta-item { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 14px; padding: 11px 12px; min-width: 0; }
.student-meta-item span { display: block; color: #64748b; font-size: 10px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 5px; }
.student-meta-item strong { display: block; color: #0f172a; font-size: 13px; font-weight: 900; line-height: 1.45; overflow-wrap: anywhere; }
.project-tag-box { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
.project-tag { background: #eef2ff; color: #4f46e5; padding: 7px 11px; border-radius: 999px; font-size: 12px; font-weight: 900; cursor: pointer; transition: background 0.18s ease, transform 0.18s ease; border: none; font: inherit; }
.project-tag:hover { background: #c7d2fe; transform: translateY(-1px); }
.progress-section { display: grid; gap: 8px; }
.progress-labels { display: flex; justify-content: space-between; gap: 12px; font-size: 12px; font-weight: 900; color: #64748b; }
.saas-progress-bar { height: 8px; background: #f1f5f9; border-radius: 999px; overflow: hidden; }
.progress-fill { height: 100%; border-radius: 999px; transition: width 0.4s ease; }
.card-actions { display: flex; gap: 10px; align-items: center; flex-wrap: wrap; }
.card-actions button { padding: 10px 12px; border-radius: 12px; font: inherit; font-weight: 900; font-size: 13px; cursor: pointer; transition: background 0.18s ease, border-color 0.18s ease, color 0.18s ease, transform 0.18s ease; }
.btn-secondary-saas { background: white; border: 1px solid #e2e8f0; color: #475569; }
.btn-secondary-saas:hover { background: #f8fafc; border-color: #cbd5e1; transform: translateY(-1px); }
.btn-primary-saas { background: #4f46e5; border: 1px solid #4f46e5; color: white; }
.btn-primary-saas:hover { background: #4338ca; border-color: #4338ca; transform: translateY(-1px); }
.missing-note { color: #64748b; font-size: 12px; font-weight: 800; }
.students-state { padding: 26px; border-radius: 18px; border: 1px dashed #cbd5e1; background: #f8fafc; color: #64748b; }
.students-state h3 { margin: 0 0 8px; color: #0f172a; font-size: 18px; font-weight: 900; }
.students-state p { margin: 0; line-height: 1.6; font-size: 14px; font-weight: 600; }
.students-state.error { border-color: #fecaca; background: #fff1f2; color: #be123c; }
.students-state.error h3 { color: #9f1239; }
.student-skeleton { min-height: 282px; border-radius: 18px; border: 1px solid #e2e8f0; background: linear-gradient(90deg, #f8fafc 0%, #eef2ff 50%, #f8fafc 100%); background-size: 200% 100%; animation: skeletonPulse 1.1s ease-in-out infinite; }
@keyframes skeletonPulse { from { background-position: 200% 0; } to { background-position: -200% 0; } }
@media (max-width: 720px) { .student-meta-grid { grid-template-columns: 1fr; } .students-header { align-items: flex-start; } }
`;

const normalizeStudent = (student) => {
  const taskCount = Number(student?.taskCount ?? 0);
  const completedTaskCount = Number(student?.completedTaskCount ?? 0);
  const progress = taskCount > 0 ? Math.round((completedTaskCount / taskCount) * 100) : 0;

  return {
    id: student?.studentId ?? student?.id ?? '',
    name: student?.name ?? 'Unnamed Student',
    email: student?.email ?? '',
    universityId: student?.universityId ?? '',
    department: student?.department ?? '',
    profilePhotoUrl: student?.profilePhotoUrl ?? '',
    role: 'ROLE_STUDENT',
    teamName: student?.teamName ?? 'Not provided',
    projectId: student?.projectId ?? '',
    projectTitle: student?.projectTitle ?? 'Untitled project',
    projectStatus: student?.projectStatus ?? '',
    taskCount,
    completedTaskCount,
    progress,
    meetingCount: Number(student?.meetingCount ?? 0),
    lastCompletedMeetingDate: student?.lastCompletedMeetingDate ?? null,
  };
};

const formatLastMeeting = (value) => {
  if (!value) return 'Not provided';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Not provided' : date.toLocaleDateString();
};

const StudentsList = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [students, setStudents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterProject, setFilterProject] = useState('All Projects');
  const [previewStudent, setPreviewStudent] = useState(null);

  useEffect(() => {
    if (location.state?.targetStudent) {
      setSearchTerm(location.state.targetStudent);
    }
  }, [location.state]);

  useEffect(() => {
    let cancelled = false;

    const loadStudents = async () => {
      setIsLoading(true);
      setError('');
      try {
        const payload = await getSupervisorMyStudents();
        if (!cancelled) {
          setStudents(payload.map(normalizeStudent));
        }
      } catch (err) {
        if (!cancelled) {
          setStudents([]);
          setError(err?.response?.data?.message || 'Unable to load your assigned students right now.');
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    void loadStudents();
    return () => {
      cancelled = true;
    };
  }, []);

  const projectOptions = useMemo(() => (
    ['All Projects', ...Array.from(new Set(students.map((student) => student.projectTitle).filter(Boolean))).sort()]
  ), [students]);

  const filteredStudents = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    return students.filter((student) => {
      const matchesSearch = !query || [
        student.name,
        student.email,
        student.universityId,
        student.teamName,
        student.projectTitle,
        formatMajorLabel(student),
      ].filter(Boolean).some((value) => String(value).toLowerCase().includes(query));
      const matchesProject = filterProject === 'All Projects' || student.projectTitle === filterProject;
      return matchesSearch && matchesProject;
    });
  }, [filterProject, searchTerm, students]);

  const openProfile = (student) => {
    setPreviewStudent(student);
  };

  const openProject = (event, student) => {
    event.stopPropagation();
    navigate('/supervisor/projects', { state: { targetProject: student.projectTitle } });
  };

  const contactStudent = (event, student) => {
    event.stopPropagation();
    openTeamsChat(student.email);
  };

  return (
    <div className="students-container">
      <style>{styles}</style>

      <div className="students-header">
        <div className="header-left">
          <p className="breadcrumb-text">Supervisor / Directory</p>
          <h1 className="page-title">My Students</h1>
          <p className="students-header-copy">Students appear here after you are assigned to their project.</p>
        </div>
        <span className="students-count-pill">{students.length} Students</span>
      </div>

      <div className="filter-bar-saas">
        <SearchBar className="search-wrapper" placeholder="Search by student name, ID, email, team, or project..." value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} onClear={() => setSearchTerm('')} />
        <StyledSelect
          className="saas-select"
          value={filterProject}
          onChange={(event) => setFilterProject(event.target.value)}
        >
          {projectOptions.map((project) => (
            <option key={project} value={project}>{project}</option>
          ))}
        </StyledSelect>
      </div>

      {isLoading ? (
        <div className="students-grid">
          {[0, 1, 2].map((item) => <div key={item} className="student-skeleton" />)}
        </div>
      ) : null}

      {!isLoading && error ? (
        <div className="students-state error">
          <h3>Could not load students</h3>
          <p>{error}</p>
        </div>
      ) : null}

      {!isLoading && !error && students.length === 0 ? (
        <div className="students-state">
          <h3>No students assigned yet.</h3>
          <p>Students will appear here after you are assigned to their project.</p>
        </div>
      ) : null}

      {!isLoading && !error && students.length > 0 && filteredStudents.length === 0 ? (
        <div className="students-state">
          <h3>No matching students</h3>
          <p>Try a different search term or project filter.</p>
        </div>
      ) : null}

      {!isLoading && !error && filteredStudents.length > 0 ? (
        <div className="students-grid">
          {filteredStudents.map((student) => {
            const theme = getRoleTheme(student.role);
            const photoUrl = resolveProfilePhotoUrl(student.profilePhotoUrl);

            return (
              <article
                className="student-card-saas"
                key={`${student.projectId}-${student.id}`}
                role="button"
                tabIndex={0}
                onClick={() => openProfile(student)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    openProfile(student);
                  }
                }}
              >
                <div className="card-header">
                  <div className="avatar-large" style={{ background: `linear-gradient(135deg, ${theme.accent}, #0f172a)` }}>
                    {photoUrl ? <img src={photoUrl} alt={student.name} /> : getUserInitials(student.name)}
                  </div>
                  <div className="student-info">
                    <h3>{student.name}</h3>
                    <span className="student-id">{student.universityId || 'Not provided'}</span>
                    <span className="student-major">{formatMajorLabel(student)}</span>
                  </div>
                </div>

                <div className="project-tag-box">
                  <button
                    type="button"
                    className="project-tag"
                    onClick={(event) => openProject(event, student)}
                    title="Open project list filtered to this project"
                  >
                    {student.projectTitle}
                  </button>
                  <ProjectStatusBadge status={student.projectStatus} />
                </div>

                <div className="student-meta-grid">
                  <div className="student-meta-item">
                    <span>Email</span>
                    <strong>{student.email || 'Email not provided'}</strong>
                  </div>
                  <div className="student-meta-item">
                    <span>Team</span>
                    <strong>{student.teamName || 'Not provided'}</strong>
                  </div>
                  <div className="student-meta-item">
                    <span>Meetings</span>
                    <strong>{student.meetingCount}</strong>
                  </div>
                  <div className="student-meta-item">
                    <span>Last Meeting</span>
                    <strong>{formatLastMeeting(student.lastCompletedMeetingDate)}</strong>
                  </div>
                </div>

                <div className="progress-section">
                  <div className="progress-labels">
                    <span>Task Progress</span>
                    <span>{student.completedTaskCount}/{student.taskCount} completed</span>
                  </div>
                  <div className="saas-progress-bar">
                    <div className="progress-fill" style={{ width: `${student.progress}%`, background: theme.accent }} />
                  </div>
                </div>

                <div className="card-actions">
                  <button type="button" className="btn-secondary-saas" onClick={(event) => { event.stopPropagation(); openProfile(student); }}>
                    View Profile
                  </button>
                  {student.email ? (
                    <button type="button" className="btn-primary-saas" onClick={(event) => contactStudent(event, student)}>
                      Contact Student
                    </button>
                  ) : (
                    <span className="missing-note">Email not provided</span>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      ) : null}

      <UserPreviewModal
        open={Boolean(previewStudent)}
        userId={previewStudent?.id}
        user={previewStudent}
        title="Student Profile"
        onClose={() => setPreviewStudent(null)}
      />
    </div>
  );
};

export default StudentsList;

