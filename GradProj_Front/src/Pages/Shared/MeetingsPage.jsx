import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../auth/AuthContext';
import {
  createProjectMeeting,
  deleteProjectMeeting,
  getProjectMeetings,
  updateProjectMeeting,
  getMyMeetings,
  getSupervisorMeetings,
  requestProjectMeeting,
  approveMeeting,
  rejectMeeting,
  completeMeeting,
  cancelMeeting
} from '../../api/meetingService';
import { downloadSingleMeetingForm, getAssignedProjects, getDeanProjects, getMyProject } from '../../api/projectService';
import ConfirmDialog from '../../components/ConfirmDialog';
import FeedbackToast from '../../components/FeedbackToast';
import ProjectStatusBadge from '../../components/ProjectStatusBadge';
import { formatProjectStatus, normalizeProjectStatus } from '../../utils/projectStatus';
import './MeetingsPage.css';

const ATTENDANCE_OPTIONS = ['PRESENT', 'ABSENT', 'EXCUSED'];

const MEETING_STATUS = {
  REQUESTED: 'REQUESTED',
  SCHEDULED: 'SCHEDULED',
  COMPLETED: 'COMPLETED',
  CANCELED: 'CANCELED',
  REJECTED: 'REJECTED',
};

const MEETING_TYPE = {
 
  REVIEW: 'REVIEW',
  CHECK_IN: 'CHECK_IN',
  MILESTONE: 'MILESTONE',
};
const MEETING_TYPE_OPTIONS = [
  { value: 'REVIEW', label: 'Review', helper: 'Deep feedback and progress evaluation.' },
  { value: 'CHECK_IN', label: 'Check-In', helper: 'Regular sync for updates and blockers.' },
  { value: 'MILESTONE', label: 'Milestone', helper: 'Focused review around a major delivery.' },
 
];

const emptyForm = {
  title: '',
  meetingDate: '',
  meetingType: MEETING_TYPE.REVIEW,
  locationOrLink: '',
  requestMessage: '',
  summary: '',
  progressDiscussed: '',
  tasksAssigned: '',
  nextSteps: '',
  nextMeetingDate: '',
  attendance: [],
};

const formatDateTime = (value) => {
  if (!value) return 'Not scheduled';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
};

const toInputDateTime = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60000);
  return local.toISOString().slice(0, 16);
};

const isArchivedProject = (project) => normalizeProjectStatus(project?.status) === 'ARCHIVED';

const normalizeTeamMember = (member, index) => ({
  id: member?.id ?? member?.studentId ?? `student-${index}`,
  name: member?.name ?? 'Unnamed Student',
  email: member?.email ?? '',
  universityId: member?.universityId ?? member?.studentUniversityId ?? '',
  role: member?.role ?? 'MEMBER',
});

const normalizeProject = (project) => ({
  ...project,
  id: project?.id ?? '',
  title: project?.title ?? 'Untitled project',
  status: project?.status ?? 'SUBMITTED',
  teamName: project?.teamName ?? 'Not linked',
  supervisorName: project?.supervisorName ?? project?.supervisor?.name ?? '',
  teamMembers: Array.isArray(project?.teamMembers) ? project.teamMembers.map(normalizeTeamMember) : [],
  studentId: project?.studentId ?? null,
  studentName: project?.studentName ?? '',
  studentEmail: project?.studentEmail ?? '',
});

const normalizeMeeting = (meeting) => ({
  ...meeting,
  id: meeting?.id ?? '',
  projectId: meeting?.projectId ?? null,
  title: meeting?.title ?? 'Untitled meeting',
  status: meeting?.status ?? 'UNKNOWN',
  meetingType: meeting?.meetingType ?? MEETING_TYPE.REVIEW,
  supervisorName: meeting?.supervisorName ?? '',
  requestedByName: meeting?.requestedByName ?? '',
  requestMessage: meeting?.requestMessage ?? '',
  locationOrLink: meeting?.locationOrLink ?? '',
  attendance: Array.isArray(meeting?.attendance) ? meeting.attendance : [],
});

const extractResponsePayload = (response) => response?.data?.data ?? response?.data ?? null;

const getProjectRoster = (project) => {
  const roster = Array.isArray(project?.teamMembers) ? project.teamMembers.map(normalizeTeamMember) : [];
  if (roster.length > 0) return roster;

  if (project?.studentId || project?.studentName || project?.studentEmail) {
    return [{
      id: project?.studentId ?? 'student-fallback',
      name: project?.studentName ?? 'Project Student',
      email: project?.studentEmail ?? '',
      universityId: project?.studentUniversityId ?? '',
      role: 'LEADER',
    }];
  }

  return [];
};

const getMeetingsArray = (response) => {
  const payload = response?.data?.data ?? response?.data ?? [];
  if (Array.isArray(payload)) return payload;
  return [];
};

const getErrorMessage = (err, fallback) => {
  const apiMessage = err?.response?.data?.message || err?.response?.data?.error;
  return apiMessage || err?.message || fallback;
};

const getUserId = (user) => user?.id ?? user?.userId ?? user?.sub ?? user?.claims?.sub ?? null;

const buildDefaultAttendance = (project) => getProjectRoster(project).map((member) => ({
  studentId: member.id,
  status: 'PRESENT',
  absenceReason: '',
}));

const buildProjectLabel = (project) => {
  const teamName = project?.teamName ? `Team: ${project.teamName}` : null;
  const status = formatProjectStatus(project?.status);
  return [project?.title || 'Untitled project', teamName, status].filter(Boolean).join(' · ');
};

const truncateText = (value, fallback) => {
  const text = String(value || '').trim();
  if (!text) return fallback;
  return text.length > 170 ? `${text.slice(0, 167)}...` : text;
};

const getAttendanceSummary = (attendance) => {
  const base = { PRESENT: 0, ABSENT: 0, EXCUSED: 0 };
  (attendance || []).forEach((item) => {
    if (base[item?.status] !== undefined) {
      base[item.status] += 1;
    }
  });
  return base;
};

const buildAttendanceView = (attendance, teamMembers) => {
  const byId = new Map((attendance || []).map((item) => [item.studentId, item]));

  return (teamMembers || []).map((member) => {
    const record = byId.get(member.id);
    return {
      studentId: member.id,
      studentName: record?.studentName ?? member.name,
      studentEmail: record?.studentEmail ?? member.email,
      studentUniversityId: record?.studentUniversityId ?? member.universityId,
      status: record?.status ?? 'PRESENT',
      absenceReason: record?.absenceReason ?? '',
    };
  });
};

const buildAttendanceRoster = (project, meetingAttendance = []) => {
  const projectMembers = getProjectRoster(project);
  if (!meetingAttendance?.length) return projectMembers;

  const members = new Map(projectMembers.map((member) => [member.id, member]));
  meetingAttendance.forEach((item, index) => {
    const fallbackId = item?.studentId ?? `meeting-student-${index}`;
    if (!members.has(fallbackId)) {
      members.set(fallbackId, normalizeTeamMember({
        id: fallbackId,
        name: item?.studentName,
        email: item?.studentEmail,
        universityId: item?.studentUniversityId,
        role: 'MEMBER',
      }, index));
    }
  });
  return Array.from(members.values());
};

const normalizeDraftPayload = (form) => ({
  title: form.title.trim(),
  meetingDate: form.meetingDate || null,
  meetingType: form.meetingType || null,
  locationOrLink: form.locationOrLink?.trim() || null,
  requestMessage: form.requestMessage?.trim() || null,
  summary: form.summary.trim() || null,
  progressDiscussed: form.progressDiscussed.trim() || null,
  tasksAssigned: form.tasksAssigned.trim() || null,
  nextSteps: form.nextSteps.trim() || null,
  nextMeetingDate: form.nextMeetingDate || null,
});

const normalizeRequestPayload = (form) => ({
  title: form.title.trim(),
  meetingDate: form.meetingDate || null,
  meetingType: form.meetingType || null,
  locationOrLink: form.locationOrLink?.trim() || null,
  requestMessage: form.requestMessage?.trim() || null,
});

const normalizeCompletionPayload = (form) => ({
  ...normalizeDraftPayload(form),
  attendance: (form.attendance || []).map((item) => ({
    studentId: item.studentId,
    status: item.status,
    absenceReason: item.status === 'PRESENT' ? '' : item.absenceReason?.trim() || '',
  })),
});

const MeetingTypeSelector = ({ value, onChange }) => (
  <div className="meetings-type-grid">
    {MEETING_TYPE_OPTIONS.map((option) => (
      <button
        key={option.value}
        type="button"
        className={`meetings-type-card ${value === option.value ? 'active' : ''}`}
        onClick={() => onChange(option.value)}
      >
        <strong>{option.label}</strong>
        <span>{option.helper}</span>
      </button>
    ))}
  </div>
);

const validateForm = (form, selectedProject, options = {}) => {
  const { requireAttendance = false } = options;
  const nextErrors = {};

  if (!form.title.trim()) {
    nextErrors.title = 'Meeting title is required.';
  }

  if (!form.meetingDate) {
    nextErrors.meetingDate = 'Meeting date is required.';
  }
  
  if (requireAttendance) {
    const expectedMemberIds = new Set(buildAttendanceRoster(selectedProject).map((member) => member.id));
    if (!form.attendance.length || form.attendance.some((item) => !item.status) || form.attendance.length !== expectedMemberIds.size) {
      nextErrors.attendance = 'Attendance status is required.';
    }
  }

  return nextErrors;
};

const openBlob = (blob, fileName) => {
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.URL.revokeObjectURL(url);
};

const MeetingsPage = () => {
  const { role, currentUser } = useAuth();
  const roleName = String(role || '').replace(/^ROLE_/i, '').toLowerCase();
  const isStudent = roleName === 'student';
  const canManage = roleName === 'supervisor';
  const isDeanOrAdmin = roleName === 'dean_office' || roleName === 'admin';
  const storageProjectKey = `meetings:selectedProject:${roleName || 'guest'}`;
  const selectedProjectIdFromUrl = typeof window !== 'undefined'
    ? new URLSearchParams(window.location.search).get('projectId') || ''
    : '';
  const currentUserId = getUserId(currentUser);

  const [projects, setProjects] = useState([]);
  const [meetings, setMeetings] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [loadingMeetings, setLoadingMeetings] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState(null);
  const [formState, setFormState] = useState(emptyForm);
  const [editingMeeting, setEditingMeeting] = useState(null);
  const [showFormModal, setShowFormModal] = useState(false);
  const [meetingToDelete, setMeetingToDelete] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [projectSearch, setProjectSearch] = useState('');
  const [meetingSearch, setMeetingSearch] = useState('');
  const [formErrors, setFormErrors] = useState({});
  const [activeTab, setActiveTab] = useState(() => {
    if (isStudent) return 'SCHEDULED';
    if (canManage) return 'REQUESTED';
    return 'ALL';
  });
  const [showRequestModal, setShowRequestModal] = useState(false);

  const pageTitle = useMemo(() => {
    if (canManage) return 'Project Meetings';
    if (isStudent) return 'My Meetings';
    return 'Meetings Directory';
  }, [canManage, isStudent]);

  const pageKicker = useMemo(() => {
    if (isStudent) return 'Student Portal / Meetings';
    if (canManage) return 'Supervisor Workspace / Meetings';
    return 'Project Directory / Meetings';
  }, [canManage, isStudent]);

  const pageSubtitle = useMemo(() => {
    if (isStudent) {
      return 'Review scheduled sessions, track pending requests, and keep your project communication in one clear timeline.';
    }
    if (canManage) {
      return 'Track project conversations, record attendance, and keep meeting progress tidy in one place.';
    }
    return 'Review official meeting records, attendance, and download the signed PDF for each project meeting.';
  }, [canManage, isStudent]);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.location.search) return;
    const nextUrl = `${window.location.pathname}${window.location.hash || ''}`;
    window.history.replaceState({}, document.title, nextUrl);
  }, []);

  useEffect(() => {
    let cancelled = false;

    const loadProjects = async () => {
      setLoadingProjects(true);
      setError('');
      try {
        let loadedProjects = [];
        if (isStudent) {
          const response = await getMyProject();
          loadedProjects = response?.data ? [response.data] : [];
        } else if (canManage) {
          const response = await getAssignedProjects();
          loadedProjects = response?.data ?? [];
        } else if (isDeanOrAdmin) {
          const response = await getDeanProjects();
          loadedProjects = response?.data ?? [];
        }

        if (cancelled) return;

        const normalizedProjects = loadedProjects.map(normalizeProject);
        setProjects(normalizedProjects);
        const storedProjectId = !isStudent && typeof window !== 'undefined'
          ? window.localStorage.getItem(storageProjectKey) || ''
          : '';
        const preferredProjectId = storedProjectId || selectedProjectIdFromUrl;
        const resolvedProject =
          normalizedProjects.find((project) => String(project.id) === preferredProjectId)
          || normalizedProjects[0]
          || null;

        setSelectedProject(resolvedProject);
        if (typeof window !== 'undefined' && !isStudent) {
          if (resolvedProject?.id) {
            window.localStorage.setItem(storageProjectKey, String(resolvedProject.id));
          } else {
            window.localStorage.removeItem(storageProjectKey);
          }
        }

        if (!resolvedProject) {
          setMeetings([]);
        }
      } catch (err) {
        if (cancelled) return;
        if (isStudent && err?.status === 404) {
          setProjects([]);
          setSelectedProject(null);
          setMeetings([]);
        } else {
          setError(getErrorMessage(err, 'Unable to load projects.'));
        }
      } finally {
        if (!cancelled) setLoadingProjects(false);
      }
    };

    loadProjects();
    return () => {
      cancelled = true;
    };
  }, [canManage, isDeanOrAdmin, isStudent, selectedProjectIdFromUrl, storageProjectKey]);

  useEffect(() => {
    let cancelled = false;
    const loadMeetings = async () => {
      setLoadingMeetings(true);
      setError('');
      try {
        let response;
        if (isStudent) {
          response = await getMyMeetings();
        } else if (canManage) {
          response = await getSupervisorMeetings();
        } else if (selectedProject) {
          response = await getProjectMeetings(selectedProject.id);
        } else {
          return;
        }

        if (!cancelled) {
          let fetched = getMeetingsArray(response);
          if (selectedProject?.id && (canManage || isStudent)) {
             fetched = fetched.filter((meeting) => !meeting?.projectId || meeting.projectId === selectedProject.id);
          }
          setMeetings(fetched.map(normalizeMeeting));
        }
      } catch (err) {
        if (!cancelled) {
          const message = getErrorMessage(err, 'Unable to load meetings.');
          console.error('Failed to load meetings', err);
          setError(message);
        }
      } finally {
        if (!cancelled) setLoadingMeetings(false);
      }
    };

    if (isStudent || canManage || selectedProject) {
       loadMeetings();
    }
    return () => {
      cancelled = true;
    };
  }, [selectedProject, isStudent, canManage]);

  useEffect(() => {
    if (!showFormModal) {
      setFormErrors({});
    }
  }, [showFormModal]);

  useEffect(() => {
    if (!showFormModal && !meetingToDelete) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [meetingToDelete, showFormModal]);

  const filteredProjects = useMemo(() => {
    const query = projectSearch.trim().toLowerCase();
    if (!query) return projects;

    return projects.filter((project) => (
      [
        project?.title,
        project?.teamName,
        formatProjectStatus(project?.status),
        project?.supervisorName,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query))
    ));
  }, [projectSearch, projects]);

  const sortedMeetings = useMemo(() => (
    [...meetings].sort((left, right) => {
      const leftTime = new Date(left?.meetingDate || 0).getTime();
      const rightTime = new Date(right?.meetingDate || 0).getTime();
      return rightTime - leftTime;
    })
  ), [meetings]);

  const filteredMeetings = useMemo(() => {
    let base = sortedMeetings;

    if (isStudent && activeTab !== 'ALL') {
       if (activeTab === 'SCHEDULED') base = sortedMeetings.filter(m => m.status === 'SCHEDULED');
       else if (activeTab === 'REQUESTED') base = sortedMeetings.filter(m => m.status === 'REQUESTED');
       else if (activeTab === 'PAST') base = sortedMeetings.filter(m => ['COMPLETED', 'CANCELED', 'REJECTED'].includes(m.status));
    } else if (canManage && activeTab !== 'ALL') {
       if (activeTab === 'SCHEDULED') base = sortedMeetings.filter(m => m.status === 'SCHEDULED');
       else if (activeTab === 'REQUESTED') base = sortedMeetings.filter(m => m.status === 'REQUESTED');
       else if (activeTab === 'COMPLETED') base = sortedMeetings.filter(m => m.status === 'COMPLETED');
       else if (activeTab === 'OTHER') base = sortedMeetings.filter(m => ['CANCELED', 'REJECTED'].includes(m.status));
    }

    const query = meetingSearch.trim().toLowerCase();
    if (!query) return base;

    return base.filter((meeting) => (
      [
        meeting?.title,
        meeting?.summary,
        meeting?.progressDiscussed,
        meeting?.tasksAssigned,
        meeting?.nextSteps,
        meeting?.meetingDate,
        ...(meeting?.attendance ?? []).map((item) => [item.studentName, item.studentEmail, item.studentUniversityId, item.status, item.absenceReason]).flat(),
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query))
    ));
  }, [meetingSearch, sortedMeetings, activeTab, isStudent, canManage]);

  const selectedProjectArchived = isArchivedProject(selectedProject);
  const canCreateMeeting = canManage && selectedProject && !selectedProjectArchived;
  const canRequestMeeting = isStudent && selectedProject && !selectedProjectArchived && selectedProject.supervisorName;
  const noProjectsMessage = isStudent ? 'Your team does not have a project yet.' : 'No assigned projects found.';

  const handleSelectProject = (project) => {
    setSelectedProject(project);
    setMeetingSearch('');
    if (typeof window !== 'undefined' && !isStudent) {
      window.localStorage.setItem(storageProjectKey, String(project.id));
    }
  };

  const handleFieldChange = (field, value) => {
    setFormState((current) => ({ ...current, [field]: value }));
    setFormErrors((current) => {
      if (!current[field]) return current;
      return { ...current, [field]: '' };
    });
  };

  const handleFormChange = (event) => {
    const { name, value } = event.target;
    handleFieldChange(name, value);
  };

  const handleAttendanceChange = (studentId, field, value) => {
    setFormState((current) => ({
      ...current,
      attendance: current.attendance.map((item) => {
        if (item.studentId !== studentId) return item;
        if (field === 'status' && value === 'PRESENT') {
          return { ...item, status: value, absenceReason: '' };
        }
        return { ...item, [field]: value };
      }),
    }));
    setFormErrors((current) => {
      if (!current.attendance) return current;
      return { ...current, attendance: '' };
    });
  };

  const closeFormModal = () => {
    if (submitting) return;
    setShowFormModal(false);
    setEditingMeeting(null);
    setFormState(emptyForm);
  };

  const openCreateModal = () => {
    setEditingMeeting(null);
    setFormState({
      ...emptyForm,
      attendance: buildDefaultAttendance(selectedProject),
    });
    setFormErrors({});
    setShowFormModal(true);
  };

  const openEditModal = (meeting) => {
    setEditingMeeting(meeting);
    setFormErrors({});
    setFormState({
      title: meeting.title || '',
      meetingDate: toInputDateTime(meeting.meetingDate),
      meetingType: meeting.meetingType || MEETING_TYPE.REVIEW,
      locationOrLink: meeting.locationOrLink || '',
      summary: meeting.summary || '',
      progressDiscussed: meeting.progressDiscussed || '',
      tasksAssigned: meeting.tasksAssigned || '',
      nextSteps: meeting.nextSteps || '',
      nextMeetingDate: toInputDateTime(meeting.nextMeetingDate),
      attendance: buildAttendanceView(meeting.attendance, buildAttendanceRoster(selectedProject, meeting.attendance)).map((item) => ({
        studentId: item.studentId,
        status: item.status || 'PRESENT',
        absenceReason: item.absenceReason || '',
      })),
    });
    setShowFormModal(true);
  };
  
  const openRequestModal = () => {
    if (!selectedProject?.id || !canRequestMeeting) return;
    setEditingMeeting(null);
    setFormErrors({});
    setFormState({ ...emptyForm });
    setShowRequestModal(true);
  };

  const closeRequestModal = () => {
    setShowRequestModal(false);
    setFormState(emptyForm);
  };

  const handleRequestSubmit = async (event) => {
    event.preventDefault();
    if (!selectedProject?.id) return;

    const nextErrors = validateForm(formState, selectedProject);
    setFormErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setSubmitting(true);
    try {
      const payload = normalizeRequestPayload(formState);
      const response = await requestProjectMeeting(selectedProject.id, payload);
      setMeetings((current) => [normalizeMeeting(extractResponsePayload(response)), ...current]);
      setToast({ message: 'Meeting request sent successfully.' });
      closeRequestModal();
    } catch (err) {
      const message = getErrorMessage(err, 'Unable to send meeting request.');
      console.error('Failed to send meeting request', err);
      setToast({ message, type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleAction = async (meeting, actionType) => {
    try {
      let response;
      if (actionType === 'APPROVE') response = await approveMeeting(meeting.id);
      else if (actionType === 'REJECT') response = await rejectMeeting(meeting.id);
      else if (actionType === 'CANCEL') response = await cancelMeeting(meeting.id);
      
      setMeetings((current) => current.map((m) => (m.id === meeting.id ? normalizeMeeting(extractResponsePayload(response)) : m)));
      setToast({ message: `Meeting ${actionType.toLowerCase()}ed successfully.` });
    } catch (err) {
      setToast({ message: err?.message || `Unable to ${actionType.toLowerCase()} meeting.`, type: 'error' });
    }
  };

  const canStudentCancelMeeting = (meeting) => (
    isStudent
    && meeting?.status === 'REQUESTED'
    && Boolean(currentUserId)
    && meeting?.requestedById === currentUserId
  );

  const draftAttendanceSummary = useMemo(() => getAttendanceSummary(formState.attendance), [formState.attendance]);

  const handleSubmit = async (event, isCompleting = false) => {
    event.preventDefault();
    if (!selectedProject?.id) return;

    const nextErrors = validateForm(formState, selectedProject, { requireAttendance: isCompleting });
    setFormErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setSubmitting(true);
    try {
      const payload = isCompleting ? normalizeCompletionPayload(formState) : normalizeDraftPayload(formState);
      if (editingMeeting?.id) {
        let response;
        if (isCompleting) {
           response = await completeMeeting(editingMeeting.id, payload);
           setToast({ message: 'Meeting completed successfully.' });
        } else {
           response = await updateProjectMeeting(editingMeeting.id, payload);
           setToast({ message: 'Meeting updated successfully.' });
        }
        setMeetings((current) => current.map((meeting) => (meeting.id === editingMeeting.id ? normalizeMeeting(extractResponsePayload(response)) : meeting)));
      } else {
        const response = await createProjectMeeting(selectedProject.id, payload);
        setMeetings((current) => [normalizeMeeting(extractResponsePayload(response)), ...current]);
        setToast({ message: 'Meeting created successfully.' });
      }
      setShowFormModal(false);
      setEditingMeeting(null);
      setFormState(emptyForm);
    } catch (err) {
      setToast({ message: err?.message || 'Unable to save meeting.', type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteMeeting = async () => {
    if (!meetingToDelete?.id) return;
    try {
      await deleteProjectMeeting(meetingToDelete.id);
      setMeetings((current) => current.filter((meeting) => meeting.id !== meetingToDelete.id));
      setMeetingToDelete(null);
      setToast({ message: 'Meeting deleted successfully.' });
    } catch (err) {
      setToast({ message: err?.message || 'Unable to delete meeting.', type: 'error' });
    }
  };

  const handleDownload = async (meeting) => {
    try {
      const response = await downloadSingleMeetingForm(meeting.id);
      openBlob(response.data, `${meeting.title || 'meeting'}.pdf`);
    } catch (err) {
      setToast({ message: err?.message || 'Unable to download meeting PDF.', type: 'error' });
    }
  };

  return (
    <div className="meetings-shell">
      <div className="meetings-hero">
        <div>
          <p className="meetings-kicker">{pageKicker}</p>
          <h1 className="meetings-title">{pageTitle}</h1>
          <p className="meetings-subtitle">{pageSubtitle}</p>
        </div>
        {canManage ? (
          <div className="meetings-actions">
            <button
              type="button"
              className="meetings-btn"
              onClick={openCreateModal}
              disabled={!canCreateMeeting}
            >
              Create Meeting
            </button>
          </div>
        ) : canRequestMeeting ? (
          <div className="meetings-actions">
            <button
              type="button"
              className="meetings-btn"
              onClick={openRequestModal}
            >
              Request New Meeting
            </button>
          </div>
        ) : null}
      </div>

      <section className="meetings-card meetings-project-panel">
        <div className="meetings-panel-header">
          <div>
            <p className="meetings-section-kicker">{isStudent ? 'Current Project' : 'Project Selector'}</p>
            <h2 className="meetings-panel-title">{isStudent ? 'Project Overview' : 'Choose a project'}</h2>
          </div>
          {selectedProject ? <ProjectStatusBadge status={selectedProject.status} /> : null}
        </div>

        {loadingProjects ? (
          <div className="meetings-inline-state">
            <h3>Loading projects...</h3>
            <p>Preparing your meeting workspace.</p>
          </div>
        ) : projects.length === 0 ? (
          <div className="meetings-inline-state">
            <h3>No assigned projects found.</h3>
            <p>{noProjectsMessage}</p>
          </div>
        ) : (
          <div className="meetings-project-layout">
            <div className="meetings-selector">
              {!isStudent ? (
                <div className="meetings-search-wrap">
                  <label className="meetings-search-label" htmlFor="project-search">Search projects</label>
                  <input
                    id="project-search"
                    type="search"
                    className="meetings-input meetings-search-input"
                    placeholder="Filter by title, team, status, or supervisor"
                    value={projectSearch}
                    onChange={(event) => setProjectSearch(event.target.value)}
                  />
                </div>
              ) : null}

              <div className="meetings-project-list" role="list" aria-label="Project list">
                {filteredProjects.length > 0 ? (
                  filteredProjects.map((project) => {
                    const active = selectedProject?.id === project.id;

                    return (
                      <button
                        key={project.id}
                        type="button"
                        className={`meetings-project-option ${active ? 'active' : ''}`}
                        onClick={() => handleSelectProject(project)}
                      >
                        <div className="meetings-project-option-top">
                          <strong>{project.title}</strong>
                          <ProjectStatusBadge status={project.status} className="meetings-inline-badge" />
                        </div>
                        <p>{project.teamName ? `Team: ${project.teamName}` : 'Team information not available'}</p>
                        {project.supervisorName ? <span className="meetings-project-meta">Supervisor: {project.supervisorName}</span> : null}
                      </button>
                    );
                  })
                ) : (
                  <div className="meetings-empty-filter">
                    <strong>No matching projects</strong>
                    <p>Try a different search term.</p>
                  </div>
                )}
              </div>
            </div>

            <div className="meetings-project-summary">
              <div className="meetings-summary-card">
                <p className="meetings-section-kicker">Selected Project</p>
                <h3>{selectedProject?.title || 'No project selected'}</h3>
                <p>{selectedProject ? buildProjectLabel(selectedProject) : 'Choose a project to review its meetings.'}</p>
              </div>

              <div className="meetings-summary-grid">
                <div className="meetings-summary-stat">
                  <span>Team</span>
                  <strong>{selectedProject?.teamName || 'Not linked'}</strong>
                </div>
                <div className="meetings-summary-stat">
                  <span>Members</span>
                  <strong>{selectedProject?.teamMembers?.length || 0}</strong>
                </div>
                <div className="meetings-summary-stat">
                  <span>Meetings</span>
                  <strong>{meetings.length}</strong>
                </div>
                <div className="meetings-summary-stat">
                  <span>Access</span>
                  <strong>{selectedProjectArchived ? 'Read only' : canManage ? 'Manage' : 'View only'}</strong>
                </div>
              </div>

              {selectedProject?.teamMembers?.length ? (
                <div className="meetings-team-list">
                  <span className="meetings-team-list-label">Team roster</span>
                  <div className="meetings-team-chips">
                    {selectedProject.teamMembers.map((member) => (
                      <span key={member.id} className="meetings-team-chip">
                        {member.name}
                      </span>
                    ))}
                  </div>
                </div>
              ) : null}

              {selectedProjectArchived ? (
                <div className="meetings-readonly-note">
                  Archived projects are read-only. You can still review records, attendance, and download PDFs.
                </div>
              ) : null}
            </div>
          </div>
        )}
      </section>

      {loadingMeetings ? (
        <div className="meetings-state">
          <h3>Loading meetings...</h3>
          <p>Fetching real meeting records from the backend.</p>
        </div>
      ) : null}

      {!loadingProjects && !loadingMeetings && error ? (
        <div className="meetings-state">
          <h3>Could not load meetings</h3>
          <p className="meetings-error">{error}</p>
        </div>
      ) : null}

      {!loadingProjects && !loadingMeetings && !error && !selectedProject ? (
        <div className="meetings-state">
          <h3>No project available</h3>
          <p>{noProjectsMessage}</p>
        </div>
      ) : null}

      {!loadingProjects && !loadingMeetings && !error && selectedProject ? (
        <section className="meetings-results">
          <div className="meetings-results-header">
            <div>
              <p className="meetings-section-kicker">Meeting Records</p>
              <h2 className="meetings-panel-title">{selectedProject.title}</h2>
              <p className="meetings-results-subtitle">{buildProjectLabel(selectedProject)}</p>
            </div>

            {isStudent ? (
              <div className="meetings-tabs">
                <button className={`meetings-tab ${activeTab === 'SCHEDULED' ? 'active' : ''}`} onClick={() => setActiveTab('SCHEDULED')}>Upcoming Scheduled</button>
                <button className={`meetings-tab ${activeTab === 'REQUESTED' ? 'active' : ''}`} onClick={() => setActiveTab('REQUESTED')}>Pending Requests</button>
                <button className={`meetings-tab ${activeTab === 'PAST' ? 'active' : ''}`} onClick={() => setActiveTab('PAST')}>Past Records</button>
                <button className={`meetings-tab ${activeTab === 'ALL' ? 'active' : ''}`} onClick={() => setActiveTab('ALL')}>All</button>
              </div>
            ) : canManage ? (
              <div className="meetings-tabs">
                <button className={`meetings-tab ${activeTab === 'REQUESTED' ? 'active' : ''}`} onClick={() => setActiveTab('REQUESTED')}>New Requests</button>
                <button className={`meetings-tab ${activeTab === 'SCHEDULED' ? 'active' : ''}`} onClick={() => setActiveTab('SCHEDULED')}>Scheduled</button>
                <button className={`meetings-tab ${activeTab === 'COMPLETED' ? 'active' : ''}`} onClick={() => setActiveTab('COMPLETED')}>Completed</button>
                <button className={`meetings-tab ${activeTab === 'OTHER' ? 'active' : ''}`} onClick={() => setActiveTab('OTHER')}>Canceled/Rejected</button>
                <button className={`meetings-tab ${activeTab === 'ALL' ? 'active' : ''}`} onClick={() => setActiveTab('ALL')}>All</button>
              </div>
            ) : null}

            {meetings.length > 0 ? (
              <div className="meetings-results-tools">
                <label className="meetings-search-label" htmlFor="meeting-search">Search meetings</label>
                <input
                  id="meeting-search"
                  type="search"
                  className="meetings-input meetings-search-input"
                  placeholder="Filter by title, notes, attendance, or date"
                  value={meetingSearch}
                  onChange={(event) => setMeetingSearch(event.target.value)}
                />
              </div>
            ) : null}
          </div>

          {meetings.length === 0 ? (
            <div className="meetings-state">
              <h3>No meetings recorded yet.</h3>
              <p>{canManage ? 'Create the first meeting for this project to start the record.' : 'The supervisor has not recorded any meetings for this project yet.'}</p>
            </div>
          ) : filteredMeetings.length === 0 ? (
            <div className="meetings-state">
              <h3>No matching meetings</h3>
              <p>Try a broader search to see more meeting records.</p>
            </div>
          ) : (
            <div className="meetings-grid">
              {filteredMeetings.map((meeting) => {
                const attendanceSummary = getAttendanceSummary(meeting.attendance);
                const attendanceRows = buildAttendanceView(meeting.attendance, buildAttendanceRoster(selectedProject, meeting.attendance));

                return (
                  <article key={meeting.id} className="meetings-card meeting-item">
                    <div className="meeting-item-header">
                      <div>
                        <div className="meetings-inline-badge-group">
                           <h3 className="meeting-item-title">{meeting.title}</h3>
                           <span className={`meeting-attendance-badge ${String(meeting.status).toLowerCase()}`}>{meeting.status}</span>
                        </div>
                        <p className="meeting-item-date">{formatDateTime(meeting.meetingDate)}</p>
                      </div>
                      {meeting.supervisorName ? <span className="meeting-owner-badge">{meeting.supervisorName}</span> : null}
                    </div>

                    {meeting.status === 'REQUESTED' ? (
                       <div className="meeting-meta">
                          <div className="meeting-meta-block">
                             <h4>Requested By</h4>
                             <p>{meeting.requestedByName || 'Unknown'}</p>
                          </div>
                          <div className="meeting-meta-block">
                             <h4>Meeting Type</h4>
                             <p>{meeting.meetingType || 'Unknown'}</p>
                          </div>
                          <div className="meeting-meta-block full">
                             <h4>Message</h4>
                             <p>{meeting.requestMessage || 'No message provided.'}</p>
                          </div>
                          {meeting.locationOrLink ? (
                             <div className="meeting-meta-block full">
                               <h4>Location / Link</h4>
                               <p>{meeting.locationOrLink}</p>
                             </div>
                          ) : null}
                       </div>
                    ) : (
                      <>
                        <div className="meeting-highlights">
                          {meeting.nextMeetingDate ? (
                            <div className="meeting-highlight">
                              <span>Next meeting</span>
                              <strong>{formatDateTime(meeting.nextMeetingDate)}</strong>
                            </div>
                          ) : null}
                          <div className="meeting-highlight">
                            <span>Present</span>
                            <strong>{attendanceSummary.PRESENT}</strong>
                          </div>
                          <div className="meeting-highlight">
                            <span>Absent</span>
                            <strong>{attendanceSummary.ABSENT}</strong>
                          </div>
                          <div className="meeting-highlight">
                            <span>Excused</span>
                            <strong>{attendanceSummary.EXCUSED}</strong>
                          </div>
                        </div>

                        <div className="meeting-meta">
                          <div className="meeting-meta-block">
                            <h4>Meeting Type</h4>
                            <p>{meeting.meetingType || 'Unknown'}</p>
                          </div>
                          {meeting.locationOrLink ? (
                            <div className="meeting-meta-block">
                              <h4>Location / Link</h4>
                              <p>{meeting.locationOrLink}</p>
                            </div>
                          ) : null}
                          <div className="meeting-meta-block full">
                            <h4>Summary</h4>
                            <p>{truncateText(meeting.summary, 'No summary provided.')}</p>
                          </div>
                          <div className="meeting-meta-block">
                            <h4>Progress Discussed</h4>
                            <p>{truncateText(meeting.progressDiscussed, 'No progress notes provided.')}</p>
                          </div>
                          <div className="meeting-meta-block">
                            <h4>Tasks Assigned</h4>
                            <p>{truncateText(meeting.tasksAssigned, 'No tasks assigned.')}</p>
                          </div>
                          <div className="meeting-meta-block">
                            <h4>Next Steps</h4>
                            <p>{truncateText(meeting.nextSteps, 'No next steps recorded.')}</p>
                          </div>
                        </div>

                        <div className="meeting-attendance-card">
                          <div className="meeting-attendance-header">
                            <h4>Attendance</h4>
                            <span>{attendanceRows.length || 0} students</span>
                          </div>
                          <div className="meeting-attendance-list">
                            {attendanceRows.length ? attendanceRows.map((item) => (
                              <div key={item.studentId} className="meeting-attendance-row">
                                <div>
                                  <strong>{item.studentName}</strong>
                                  <p>{item.studentUniversityId || item.studentEmail || 'Student details unavailable'}</p>
                                </div>
                                <div className="meeting-attendance-status">
                                  <span className={`meeting-attendance-badge ${String(item.status || 'PRESENT').toLowerCase()}`}>{item.status}</span>
                                  {item.absenceReason ? <small>{item.absenceReason}</small> : null}
                                </div>
                              </div>
                            )) : (
                              <div className="meeting-attendance-empty">Attendance has not been recorded for this meeting yet.</div>
                            )}
                          </div>
                        </div>
                      </>
                    )}

                    <div className="meeting-item-footer">
                      {meeting.status === 'COMPLETED' || meeting.status === 'SCHEDULED' ? (
                        <button type="button" className="meetings-btn-ghost" onClick={() => handleDownload(meeting)}>
                          Download PDF
                        </button>
                      ) : null}

                      {canStudentCancelMeeting(meeting) ? (
                         <button type="button" className="meetings-btn-danger" onClick={() => handleAction(meeting, 'CANCEL')}>
                            Cancel Request
                         </button>
                      ) : null}

                      {canManage && meeting.status === 'REQUESTED' && !selectedProjectArchived ? (
                         <>
                           <button type="button" className="meetings-btn" onClick={() => handleAction(meeting, 'APPROVE')}>Approve</button>
                           <button type="button" className="meetings-btn-danger" onClick={() => handleAction(meeting, 'REJECT')}>Reject</button>
                         </>
                      ) : null}

                      {canManage && meeting.status === 'SCHEDULED' && !selectedProjectArchived ? (
                         <>
                           <button type="button" className="meetings-btn-danger" onClick={() => handleAction(meeting, 'CANCEL')}>Cancel Meeting</button>
                         </>
                      ) : null}

                      {canManage && meeting.canEdit && !selectedProjectArchived && meeting.status !== 'REJECTED' && meeting.status !== 'CANCELED' ? (
                        <button type="button" className="meetings-btn-ghost" onClick={() => openEditModal(meeting)}>
                          Edit / Progress
                        </button>
                      ) : null}
                      {canManage && meeting.canDelete && !selectedProjectArchived ? (
                        <button type="button" className="meetings-btn-danger" onClick={() => setMeetingToDelete(meeting)}>
                          Delete
                        </button>
                      ) : null}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      ) : null}

      {showFormModal ? (
        <div className="meetings-modal" onClick={closeFormModal} role="presentation">
          <div className="meetings-modal-card" onClick={(event) => event.stopPropagation()}>
            <div className="meetings-modal-header">
              <div>
                <p className="meetings-section-kicker">{editingMeeting ? 'Edit Record' : 'New Record'}</p>
                <h2 className="meetings-modal-title">{editingMeeting ? 'Edit Meeting' : 'Create Meeting'}</h2>
                <p className="meetings-subtitle meetings-modal-subtitle">
                  {selectedProject?.title || 'Selected project'}
                </p>
              </div>
              <button
                type="button"
                className="meetings-close meetings-btn-ghost"
                onClick={closeFormModal}
                disabled={submitting}
              >
                Close
              </button>
            </div>

            <form className="meetings-form" onSubmit={handleSubmit}>
              <div className="meetings-modal-body">
                <section className="meetings-form-section">
                  <div className="meetings-form-section-head">
                    <h3>Basic Information</h3>
                    <p>Capture the core meeting details first, then choose the meeting format that best matches the goal.</p>
                  </div>
                  <div className="meetings-form-grid">
                    <div className="meetings-field full">
                      <label htmlFor="meeting-title">Meeting Title <span className="meetings-required">*</span></label>
                      <input
                        id="meeting-title"
                        className={`meetings-input ${formErrors.title ? 'has-error' : ''}`}
                        value={formState.title}
                        onChange={(event) => handleFieldChange('title', event.target.value)}
                        placeholder="Example: Weekly progress review"
                        aria-invalid={Boolean(formErrors.title)}
                        aria-describedby={formErrors.title ? 'meeting-title-error' : undefined}
                      />
                      {formErrors.title ? <p id="meeting-title-error" className="meetings-field-error">{formErrors.title}</p> : null}
                    </div>

                    <div className="meetings-field">
                      <label htmlFor="meeting-date">Meeting Date <span className="meetings-required">*</span></label>
                      <input
                        id="meeting-date"
                        type="datetime-local"
                        className={`meetings-input ${formErrors.meetingDate ? 'has-error' : ''}`}
                        value={formState.meetingDate}
                        onChange={(event) => handleFieldChange('meetingDate', event.target.value)}
                        aria-invalid={Boolean(formErrors.meetingDate)}
                        aria-describedby={formErrors.meetingDate ? 'meeting-date-error' : undefined}
                      />
                      {formErrors.meetingDate ? <p id="meeting-date-error" className="meetings-field-error">{formErrors.meetingDate}</p> : null}
                    </div>

                    <div className="meetings-field">
                      <label htmlFor="meeting-next-date">Next Meeting Date</label>
                      <input
                        id="meeting-next-date"
                        type="datetime-local"
                        className="meetings-input"
                        value={formState.nextMeetingDate}
                        onChange={(event) => handleFieldChange('nextMeetingDate', event.target.value)}
                      />
                    </div>

                    <div className="meetings-field full">
                      <label>Meeting Type</label>
                      <MeetingTypeSelector value={formState.meetingType} onChange={(nextType) => handleFieldChange('meetingType', nextType)} />
                    </div>

                    <div className="meetings-field full">
                      <label htmlFor="meeting-location-link">Location / Link</label>
                      <input
                        id="meeting-location-link"
                        className="meetings-input"
                        value={formState.locationOrLink}
                        onChange={(event) => handleFieldChange('locationOrLink', event.target.value)}
                        placeholder="Office room, lab, Google Meet, Zoom, or another preferred channel"
                      />
                    </div>
                  </div>
                </section>

                <section className="meetings-form-section">
                  <div className="meetings-form-section-head">
                    <h3>Meeting Notes</h3>
                    <p>Summarize the discussion in a way students and supervisors can revisit quickly.</p>
                  </div>
                  <div className="meetings-form-grid">
                    <div className="meetings-field full">
                      <label htmlFor="meeting-summary">Summary</label>
                      <textarea
                        id="meeting-summary"
                        className="meetings-textarea meetings-textarea-medium"
                        value={formState.summary}
                        onChange={(event) => handleFieldChange('summary', event.target.value)}
                        placeholder="Outline the purpose of the meeting and the main outcome."
                      />
                    </div>

                    <div className="meetings-field full">
                      <label htmlFor="meeting-progress">Progress Discussed</label>
                      <textarea
                        id="meeting-progress"
                        className="meetings-textarea"
                        value={formState.progressDiscussed}
                        onChange={(event) => handleFieldChange('progressDiscussed', event.target.value)}
                        placeholder="Capture milestone updates, blockers, or completed work."
                      />
                    </div>

                    <div className="meetings-field full">
                      <label htmlFor="meeting-tasks">Tasks Assigned</label>
                      <textarea
                        id="meeting-tasks"
                        className="meetings-textarea"
                        value={formState.tasksAssigned}
                        onChange={(event) => handleFieldChange('tasksAssigned', event.target.value)}
                        placeholder="List action items, owners, and expected follow-ups."
                      />
                    </div>

                    <div className="meetings-field full">
                      <label htmlFor="meeting-next-steps">Next Steps</label>
                      <textarea
                        id="meeting-next-steps"
                        className="meetings-textarea"
                        value={formState.nextSteps}
                        onChange={(event) => handleFieldChange('nextSteps', event.target.value)}
                        placeholder="Describe what should happen before the next meeting."
                      />
                    </div>
                  </div>
                </section>

                <section className="meetings-form-section">
                  <div className="meetings-form-section-head">
                    <h3>Attendance</h3>
                    <p>Mark each project member as present, absent, or excused before saving the meeting.</p>
                  </div>
                  {formErrors.attendance ? <p className="meetings-field-error">{formErrors.attendance}</p> : null}
                  <div className="meetings-attendance-summary">
                    <div className="meetings-attendance-summary-item">
                      <span>Expected Roster</span>
                      <strong>{buildAttendanceRoster(selectedProject, editingMeeting?.attendance).length}</strong>
                    </div>
                    <div className="meetings-attendance-summary-item">
                      <span>Marked Present</span>
                      <strong>{draftAttendanceSummary.PRESENT}</strong>
                    </div>
                    <div className="meetings-attendance-summary-item">
                      <span>Marked Absent</span>
                      <strong>{draftAttendanceSummary.ABSENT + draftAttendanceSummary.EXCUSED}</strong>
                    </div>
                  </div>
                  <div className="meetings-attendance-editor">
                    {buildAttendanceRoster(selectedProject, editingMeeting?.attendance).map((member) => {
                      const attendance = formState.attendance.find((item) => item.studentId === member.id) || {
                        studentId: member.id,
                        status: 'PRESENT',
                        absenceReason: '',
                      };
                      const needsReason = attendance.status === 'ABSENT' || attendance.status === 'EXCUSED';

                      return (
                        <div key={member.id} className="meetings-attendance-editor-row">
                          <div className="meetings-attendance-student">
                            <strong>{member.name}</strong>
                            <p>{member.universityId || member.email || 'Student details unavailable'}</p>
                          </div>

                          <div className="meetings-attendance-controls">
                            <select
                              className="meetings-input"
                              value={attendance.status}
                              onChange={(event) => handleAttendanceChange(member.id, 'status', event.target.value)}
                            >
                              {ATTENDANCE_OPTIONS.map((option) => (
                                <option key={option} value={option}>{option.charAt(0)}{option.slice(1).toLowerCase()}</option>
                              ))}
                            </select>

                            {needsReason ? (
                              <input
                                className="meetings-input"
                                type="text"
                                placeholder="Optional reason"
                                value={attendance.absenceReason || ''}
                                onChange={(event) => handleAttendanceChange(member.id, 'absenceReason', event.target.value)}
                              />
                            ) : (
                              <div className="meetings-attendance-placeholder">Present students do not need a reason.</div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>
              </div>

              <div className="meetings-modal-footer">
                <button type="button" className="meetings-btn-ghost" onClick={closeFormModal} disabled={submitting}>
                  Cancel
                </button>
                {editingMeeting?.status === 'SCHEDULED' && canManage ? (
                  <button type="button" className="meetings-btn" onClick={(e) => handleSubmit(e, true)} disabled={submitting}>
                    {submitting ? 'Saving...' : 'Complete Meeting'}
                  </button>
                ) : null}
                <button type="submit" className="meetings-btn" disabled={submitting}>
                  {submitting ? (editingMeeting ? 'Saving...' : 'Creating...') : editingMeeting ? 'Save Changes' : 'Create Meeting'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      <ConfirmDialog
        open={Boolean(meetingToDelete)}
        title="Delete Meeting"
        message={meetingToDelete ? `Delete "${meetingToDelete.title}" from the meeting history for ${selectedProject?.title || 'this project'}?` : ''}
        confirmLabel="Delete Meeting"
        loadingLabel="Deleting..."
        tone="danger"
        onCancel={() => setMeetingToDelete(null)}
        onConfirm={handleDeleteMeeting}
      />

      <FeedbackToast message={toast?.message} type={toast?.type} onClose={() => setToast(null)} />
      {/* REQUEST MODAL for Students */}
      {showRequestModal && canRequestMeeting && selectedProject ? (
        <div className="meetings-modal" onClick={closeRequestModal} role="presentation">
          <div className="meetings-modal-card meetings-modal-card-request" onClick={(event) => event.stopPropagation()}>
            <div className="meetings-modal-header">
              <div>
                <p className="meetings-section-kicker">Student Request</p>
                <h2 className="meetings-modal-title">Request New Meeting</h2>
                <p className="meetings-subtitle meetings-modal-subtitle">
                  {selectedProject.title}
                </p>
              </div>
              <button type="button" className="meetings-close meetings-btn-ghost" onClick={closeRequestModal} disabled={submitting}>
                Close
              </button>
            </div>
            <form onSubmit={handleRequestSubmit} className="meetings-form">
              <div className="meetings-modal-body">
                <section className="meetings-form-section">
                  <div className="meetings-form-section-head">
                    <h3>Request Details</h3>
                    <p>Send a clear meeting request with the preferred time, format, and discussion goal.</p>
                  </div>
                  <div className="meetings-form-grid">
                    <div className="meetings-field full">
                      <label htmlFor="request-meeting-title">Meeting Title <span className="meetings-required">*</span></label>
                      <input
                        id="request-meeting-title"
                        type="text"
                        name="title"
                        className={`meetings-input ${formErrors.title ? 'has-error' : ''}`}
                        value={formState.title}
                        onChange={handleFormChange}
                        placeholder="Example: Weekly sync about proposal progress"
                      />
                      {formErrors.title ? <p className="meetings-field-error">{formErrors.title}</p> : null}
                    </div>

                    <div className="meetings-field">
                      <label htmlFor="request-meeting-date">Requested Date & Time <span className="meetings-required">*</span></label>
                      <input
                        id="request-meeting-date"
                        type="datetime-local"
                        name="meetingDate"
                        className={`meetings-input ${formErrors.meetingDate ? 'has-error' : ''}`}
                        value={formState.meetingDate}
                        onChange={handleFormChange}
                      />
                      {formErrors.meetingDate ? <p className="meetings-field-error">{formErrors.meetingDate}</p> : null}
                    </div>

                    <div className="meetings-field">
                      <label>Meeting Type <span className="meetings-required">*</span></label>
                      <MeetingTypeSelector value={formState.meetingType} onChange={(nextType) => handleFieldChange('meetingType', nextType)} />
                    </div>

                    <div className="meetings-field full">
                      <label htmlFor="request-location-link">Location / Link</label>
                      <input
                        id="request-location-link"
                        type="text"
                        name="locationOrLink"
                        className="meetings-input"
                        value={formState.locationOrLink}
                        onChange={handleFormChange}
                        placeholder="Office room, lab, Google Meet, Zoom, or another preferred channel"
                      />
                    </div>

                    <div className="meetings-field full">
                      <label htmlFor="request-message">Request Message / Purpose</label>
                      <textarea
                        id="request-message"
                        name="requestMessage"
                        className="meetings-textarea meetings-textarea-medium"
                        value={formState.requestMessage}
                        onChange={handleFormChange}
                        placeholder="Briefly explain what you want to discuss so the supervisor can prepare."
                      />
                    </div>
                  </div>
                </section>
              </div>

              <div className="meetings-modal-footer">
                <button type="button" className="meetings-btn-ghost" onClick={closeRequestModal} disabled={submitting}>Cancel</button>
                <button type="submit" className="meetings-btn" disabled={submitting}>
                  {submitting ? 'Sending Request...' : 'Send Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

    </div>
  );
};

export default MeetingsPage;
