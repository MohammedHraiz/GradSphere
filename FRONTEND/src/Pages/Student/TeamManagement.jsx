import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { apiClient } from '../../api/apiClient';
import { getMyProject } from '../../api/projectService';
import ConfirmDialog from '../../components/ConfirmDialog';
import FeedbackToast from '../../components/FeedbackToast';
import InviteModal from '../../components/InviteModal';
import ProjectStatusBadge from '../../components/ProjectStatusBadge';
import ClickableUser from '../../components/ClickableUser';
import { openTeamsChat } from '../../utils/teamsLink';
import { normalizeProjectStatus } from '../../utils/projectStatus';
import { formatMajorLabel, getUserDepartment } from '../../utils/userMeta';

const styles = `
.team-page-container {
  padding: 10px 20px 40px 20px;
  font-family: 'Plus Jakarta Sans', sans-serif;
  color: #0f172a;
  animation: fadeIn 0.4s ease-out;
  text-align: left;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.team-header-wrapper { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 30px; }
.breadcrumb-text { color: #4f46e5; font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 5px; }
.main-page-title { font-size: 32px; font-weight: 900; margin: 0; color: #0f172a; letter-spacing: -1px; }

.btn-invite-new {
  background: #4f46e5; color: white; border: none; padding: 12px 24px; border-radius: 12px;
  font-weight: 800; font-size: 14px; cursor: pointer; transition: 0.2s; box-shadow: 0 4px 12px rgba(79, 70, 229, 0.25);
  display: flex; align-items: center; gap: 8px;
}
.btn-invite-new:hover { background: #4338ca; transform: translateY(-2px); }
.btn-invite-new:disabled { cursor: not-allowed; opacity: 0.58; transform: none; box-shadow: none; }
.btn-invite-new:disabled:hover { background: #4f46e5; transform: none; }
.team-header-actions { display: flex; flex-direction: column; align-items: flex-end; gap: 6px; }
.team-full-helper { color: #7f1d1d; background: #fef2f2; border: 1px solid #fecaca; border-radius: 999px; padding: 5px 10px; font-size: 12px; font-weight: 800; }

.team-overview-grid { display: grid; grid-template-columns: 2.2fr 1fr; gap: 25px; margin-bottom: 40px; }

.team-card-main { background: white; border: 1px solid #e2e8f0; border-radius: 28px; padding: 35px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.02); position: relative; }
.card-header-row { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 25px; }
.card-header-row h2 { font-size: 24px; font-weight: 900; margin: 0; color: #0f172a; }
.badge-active { background: #d1fae5; color: #059669; padding: 6px 12px; border-radius: 20px; font-size: 11px; font-weight: 800; text-transform: uppercase; }

.team-meta-row { display: flex; justify-content: space-between; align-items: center; padding: 14px 0; border-bottom: 1px solid #f1f5f9; font-size: 14px; }
.team-meta-row:last-child { border-bottom: none; }
.team-meta-row .label { color: #64748b; font-weight: 700; }
.team-meta-row .value { color: #0f172a; font-weight: 800; }

.supervisor-pill {
  display: flex; align-items: center; gap: 10px; background: #f8fafc; padding: 8px 16px; border-radius: 14px;
  border: 1px solid #e2e8f0; cursor: pointer; transition: 0.2s; color: #4f46e5;
}
.supervisor-pill-button { width: 100%; border: none; text-align: left; font: inherit; }
.supervisor-pill:hover { border-color: #4f46e5; background: #eef2ff; transform: translateY(-2px); box-shadow: 0 4px 10px rgba(79, 70, 229, 0.08); }
.sup-avatar-small { width: 28px; height: 28px; border-radius: 50%; background: #0f172a; color: white; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 900; }

.team-stats-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 28px; padding: 35px; display: flex; flex-direction: column; justify-content: center; gap: 20px; cursor: pointer; transition: 0.3s; }
.team-stats-card:hover { border-color: #4f46e5; background: white; transform: translateY(-3px); box-shadow: 0 10px 20px rgba(79, 70, 229, 0.05); }
.stat-item-mini { display: flex; flex-direction: column; gap: 5px; }
.stat-item-mini span { font-size: 12px; color: #64748b; font-weight: 800; text-transform: uppercase; }
.stat-item-mini strong { font-size: 32px; font-weight: 900; color: #4f46e5; }
.stat-item-mini small { color: #64748b; font-size: 12px; font-weight: 700; line-height: 1.45; }
.stat-divider { height: 1px; background: #e2e8f0; }
.team-progress-track { width: 100%; height: 9px; border-radius: 999px; overflow: hidden; background: #e2e8f0; margin: 4px 0 2px; }
.team-progress-fill { height: 100%; border-radius: inherit; background: linear-gradient(90deg, #4f46e5, #10b981); transition: width 0.25s ease; }

.members-section-title { font-size: 20px; font-weight: 900; margin: 0 0 20px 0; }
.members-layout-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 20px; }

.member-profile-card {
  background: white; border: 1px solid #e2e8f0; border-radius: 24px; padding: 25px; transition: 0.3s;
  box-shadow: 0 4px 6px -1px rgba(0,0,0,0.02); cursor: pointer;
}
.member-profile-card:hover { transform: translateY(-5px); border-color: #4f46e5; box-shadow: 0 15px 30px -10px rgba(79, 70, 229, 0.12); }

.member-card-top { display: flex; align-items: center; gap: 15px; margin-bottom: 20px; }
.avatar-circle-main { width: 48px; height: 48px; border-radius: 14px; display: flex; align-items: center; justify-content: center; color: white; font-size: 18px; font-weight: 900; }
.member-details h4 { margin: 0 0 2px 0; font-size: 16px; font-weight: 800; color: #0f172a; }
.member-details p { margin: 0; font-size: 12px; color: #64748b; font-weight: 600; }

.status-badge-row { display: flex; align-items: center; gap: 8px; margin-bottom: 20px; background: #f8fafc; padding: 8px 12px; border-radius: 10px; width: fit-content; }
.status-dot { width: 8px; height: 8px; border-radius: 50%; }
.dot-active { background: #10b981; box-shadow: 0 0 8px #10b981; }
.dot-pending { background: #f59e0b; }
.status-text { font-size: 11px; font-weight: 800; color: #475569; }

.btn-send-message {
  width: 100%; padding: 10px; border-radius: 10px; border: 1px solid #e2e8f0; background: white;
  color: #0f172a; font-weight: 800; font-size: 13px; cursor: pointer; transition: 0.2s;
}
.btn-send-message:hover { background: #0f172a; color: white; border-color: #0f172a; }

.roster-section { margin-top: 28px; }
.roster-header { display: flex; align-items: flex-end; justify-content: space-between; gap: 16px; margin-bottom: 16px; }
.roster-title { margin: 0; font-size: 22px; font-weight: 900; color: #0f172a; letter-spacing: -0.02em; }
.roster-subtitle { margin: 6px 0 0; font-size: 13px; color: #64748b; line-height: 1.6; }
.roster-badge { display: inline-flex; align-items: center; gap: 8px; padding: 8px 12px; border-radius: 9999px; background: #eef2ff; color: #4f46e5; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.08em; }
.roster-list { display: grid; gap: 12px; }
.roster-card { display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 16px; align-items: center; padding: 16px 18px; border-radius: 20px; border: 1px solid #e2e8f0; background: linear-gradient(180deg, #ffffff, #f8fafc); box-shadow: 0 8px 24px rgba(15, 23, 42, 0.04); transition: transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease; }
.roster-card:hover { transform: translateY(-2px); border-color: #c7d2fe; box-shadow: 0 16px 30px -20px rgba(79, 70, 229, 0.18); }
.roster-left { display: flex; align-items: center; gap: 14px; min-width: 0; }
.roster-profile-button { width: 100%; border: none; background: transparent; padding: 0; cursor: pointer; }
.roster-avatar { width: 52px; height: 52px; border-radius: 16px; display: flex; align-items: center; justify-content: center; background: linear-gradient(135deg, #4f46e5, #7c3aed); color: white; font-weight: 900; font-size: 16px; flex: 0 0 auto; box-shadow: 0 10px 18px rgba(79, 70, 229, 0.18); }
.roster-info { min-width: 0; }
.roster-name-row { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
.roster-name { margin: 0; font-size: 16px; font-weight: 900; color: #0f172a; }
.roster-subline { margin-top: 5px; color: #64748b; font-size: 13px; line-height: 1.5; overflow-wrap: anywhere; }
.roster-leader-tag { display: inline-flex; align-items: center; padding: 5px 10px; border-radius: 9999px; background: #ede9fe; color: #6d28d9; font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.08em; }
.roster-meta { margin-top: 5px; display: flex; flex-wrap: wrap; gap: 10px; color: #64748b; font-size: 13px; line-height: 1.5; }
.roster-pill { display: inline-flex; align-items: center; gap: 6px; padding: 6px 10px; border-radius: 9999px; background: #f8fafc; border: 1px solid #e2e8f0; }
.roster-right { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; justify-content: flex-end; }
.roster-remove { border: 1px solid rgba(239,68,68,0.18); background: #fff1f2; color: #be123c; padding: 9px 14px; border-radius: 9999px; font-size: 12px; font-weight: 800; cursor: pointer; transition: transform 0.2s ease, background 0.2s ease, border-color 0.2s ease; }
.roster-remove:hover { transform: translateY(-1px); background: #fee2e2; border-color: rgba(239,68,68,0.28); }
.roster-empty { padding: 18px; border-radius: 18px; border: 1px dashed #e2e8f0; background: #f8fafc; color: #64748b; font-size: 14px; text-align: center; }
.pending-section { margin: 26px 0 8px; }
.pending-card { display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 14px; align-items: center; padding: 14px 16px; border: 1px solid #fde68a; border-radius: 18px; background: #fffbeb; }
.pending-title { margin: 0; font-size: 14px; font-weight: 900; color: #92400e; }
.pending-meta { margin: 4px 0 0; font-size: 12px; font-weight: 700; color: #a16207; }
.pending-cancel { border: 1px solid rgba(217,119,6,0.22); background: white; color: #92400e; padding: 9px 14px; border-radius: 9999px; font-size: 12px; font-weight: 800; cursor: pointer; }
.pending-cancel:disabled, .roster-remove:disabled { cursor: not-allowed; opacity: 0.65; transform: none; }

@media (max-width: 720px) {
  .roster-header { align-items: flex-start; flex-direction: column; }
  .roster-card { grid-template-columns: 1fr; }
  .roster-right { justify-content: flex-start; }
}

.modal-backdrop { position: fixed; inset: 0; background: rgba(15, 23, 42, 0.42); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: 10040; animation: fadeIn 0.2s; padding: 20px; }
.modal-box-saas { width: 100%; max-width: 760px; overflow: hidden; box-shadow: 0 32px 60px -16px rgba(2, 6, 23, 0.85); animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1); border: 1px solid rgba(148, 163, 184, 0.15); }
@keyframes slideUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }

.modal-shell { background: linear-gradient(180deg, rgba(15, 23, 42, 0.98), rgba(15, 23, 42, 0.94)); border-radius: 24px; }
.modal-header-saas { padding: 24px 24px 18px 24px; border-bottom: 1px solid rgba(148, 163, 184, 0.12); display: flex; justify-content: space-between; align-items: center; gap: 16px; }
.modal-title-block { display: flex; flex-direction: column; gap: 6px; }
.modal-header-saas h2 { font-size: 22px; font-weight: 900; color: #f8fafc; margin: 0; letter-spacing: -0.02em; }
.modal-subtitle { margin: 0; color: #94a3b8; font-size: 13px; }
.btn-close-circle { width: 38px; height: 38px; border-radius: 9999px; border: 1px solid rgba(148, 163, 184, 0.16); background: rgba(15, 23, 42, 0.9); color: #cbd5e1; cursor: pointer; font-size: 16px; display: flex; align-items: center; justify-content: center; transition: 0.2s; flex: 0 0 auto; }
.btn-close-circle:hover { background: rgba(30, 41, 59, 1); color: white; transform: rotate(90deg); }

.modal-body-saas { padding: 24px; display: grid; gap: 18px; }
.search-input-wrapper { position: relative; }
.search-input-wrapper input { width: 100%; padding: 15px 16px 15px 46px; border: 1px solid rgba(148, 163, 184, 0.16); border-radius: 16px; font-family: inherit; font-size: 14px; outline: none; transition: 0.2s; box-sizing: border-box; background: rgba(15, 23, 42, 0.9); color: #f8fafc; }
.search-input-wrapper input::placeholder { color: #64748b; }
.search-input-wrapper input:focus { border-color: rgba(99, 102, 241, 0.85); box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.16); }
.search-icon-fixed { position: absolute; left: 16px; top: 14px; color: #94a3b8; font-size: 16px; }

.results-list { max-height: 340px; overflow-y: auto; display: grid; gap: 12px; padding-right: 2px; }
.invite-card { display: flex; align-items: center; justify-content: space-between; gap: 16px; padding: 16px; border-radius: 18px; background: linear-gradient(180deg, rgba(30, 41, 59, 0.95), rgba(15, 23, 42, 0.98)); border: 1px solid rgba(148, 163, 184, 0.12); transition: transform 0.2s ease, border-color 0.2s ease, background 0.2s ease, box-shadow 0.2s ease; }
.invite-card:hover { transform: translateY(-2px); border-color: rgba(129, 140, 248, 0.45); box-shadow: 0 16px 30px -18px rgba(15, 23, 42, 0.9); }
.invite-student { display: flex; flex-direction: column; gap: 4px; min-width: 0; }
.invite-name { margin: 0; font-size: 15px; font-weight: 800; color: #f8fafc; line-height: 1.3; }
.invite-meta { margin: 0; font-size: 12px; color: #94a3b8; font-weight: 600; line-height: 1.4; }
.invite-actions { flex: 0 0 auto; display: flex; align-items: center; gap: 10px; }
.invite-button { border: none; color: white; padding: 10px 16px; border-radius: 9999px; font-weight: 800; font-size: 12px; cursor: pointer; transition: transform 0.2s ease, opacity 0.2s ease, box-shadow 0.2s ease; display: inline-flex; align-items: center; justify-content: center; gap: 8px; min-width: 94px; box-shadow: 0 10px 20px -14px rgba(99, 102, 241, 0.9); background: linear-gradient(135deg, #4f46e5, #7c3aed); }
.invite-button:hover { transform: translateY(-1px); box-shadow: 0 14px 24px -16px rgba(99, 102, 241, 0.95); }
.invite-button:disabled { cursor: not-allowed; opacity: 0.7; transform: none; }
.invite-button--sent { background: rgba(16,185,129,0.12); color: #34d399; box-shadow: 0 10px 20px -14px rgba(16, 185, 129, 0.12); border: 1px solid rgba(16,185,129,0.14); }
.invite-button { transition: background-color 200ms ease, color 200ms ease, transform 200ms ease, box-shadow 200ms ease; }
.invite-spinner { width: 14px; height: 14px; border-radius: 9999px; border: 2px solid rgba(255, 255, 255, 0.35); border-top-color: white; animation: inviteSpin 0.8s linear infinite; }
@keyframes inviteSpin { to { transform: rotate(360deg); } }
.invite-empty, .invite-loading { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px; min-height: 172px; color: #94a3b8; text-align: center; border: 1px dashed rgba(148, 163, 184, 0.18); border-radius: 18px; background: rgba(15, 23, 42, 0.6); }
.invite-empty-icon { font-size: 28px; }
.invite-empty-title { margin: 0; color: #e2e8f0; font-size: 14px; font-weight: 800; }
.invite-empty-copy { margin: 0; font-size: 13px; color: #94a3b8; }
.toast-error { background: rgba(239,68,68,0.08); color: #fecaca; border: 1px solid rgba(239,68,68,0.12); }

.create-team-panel { width: 100%; max-width: 560px; overflow: hidden; border-radius: 22px; border: 1px solid rgba(226, 232, 240, 0.95); box-shadow: 0 28px 70px -34px rgba(15, 23, 42, 0.72); background: #ffffff; }
.create-team-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 18px; padding: 22px 24px 18px; border-bottom: 1px solid #e2e8f0; background: linear-gradient(135deg, #4f46e5, #2563eb); }
.create-team-copy { display: grid; gap: 6px; }
.create-team-kicker { margin: 0; color: rgba(255,255,255,0.76); font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.08em; }
.create-team-title { margin: 0; color: #f8fafc; font-size: 24px; font-weight: 900; letter-spacing: -0.02em; }
.create-team-subtitle { margin: 0; color: rgba(255,255,255,0.82); font-size: 13px; line-height: 1.55; max-width: 420px; }
.create-team-body { padding: 24px; display: grid; gap: 18px; }
.create-team-info-card { display: grid; gap: 8px; padding: 14px 16px; border-radius: 16px; background: #eef2ff; border: 1px solid #c7d2fe; color: #3730a3; }
.create-team-info-card p { margin: 0; font-size: 13px; font-weight: 750; line-height: 1.55; }
.create-team-note { margin: 0; color: #64748b; font-size: 12px; line-height: 1.55; }
.create-team-form { display: grid; gap: 18px; }
.create-team-field { display: grid; gap: 8px; }
.create-team-field label { display: inline-flex; align-items: center; gap: 8px; color: #475569; font-size: 12px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.08em; }
.create-team-input, .create-team-number { width: 100%; border: 1px solid #cbd5e1; border-radius: 14px; background: #ffffff; color: #0f172a; padding: 14px 16px; font: inherit; font-size: 14px; outline: none; transition: border-color 0.18s ease, box-shadow 0.18s ease, background 0.18s ease; }
.create-team-input::placeholder, .create-team-number::placeholder { color: #94a3b8; }
.create-team-input:focus, .create-team-number:focus { border-color: rgba(79, 70, 229, 0.9); box-shadow: 0 0 0 4px rgba(79, 70, 229, 0.13); }
.create-team-input:disabled, .create-team-number:disabled { opacity: 0.7; cursor: not-allowed; }
.create-team-help { margin: 0; color: #64748b; font-size: 12px; line-height: 1.55; }
.create-team-error { margin: 0; color: #dc2626; font-size: 12px; font-weight: 800; line-height: 1.5; }
.create-team-actions { display: flex; flex-wrap: wrap; justify-content: flex-end; gap: 10px; padding-top: 4px; }
.create-team-btn { min-width: 120px; border-radius: 12px; border: 1px solid #dbe2ea; background: #ffffff; color: #0f172a; padding: 12px 16px; font: inherit; font-size: 13px; font-weight: 900; cursor: pointer; transition: transform 0.18s ease, background 0.18s ease, opacity 0.18s ease, box-shadow 0.18s ease; }
.create-team-btn:hover:not(:disabled) { transform: translateY(-1px); background: #f8fafc; box-shadow: 0 16px 24px -20px rgba(15, 23, 42, 0.24); }
.create-team-btn:disabled { cursor: not-allowed; opacity: 0.7; transform: none; box-shadow: none; }
.create-team-btn.primary { background: linear-gradient(135deg, #4f46e5, #7c3aed); color: white; border-color: transparent; box-shadow: 0 16px 26px -20px rgba(79, 70, 229, 0.9); }
.create-team-btn.primary:hover:not(:disabled) { background: linear-gradient(135deg, #4338ca, #6d28d9); }
.create-team-btn.secondary { background: #f8fafc; color: #334155; }
`;

const MEMBER_COLORS = ['#4F46E5', '#9333EA', '#F59E0B', '#10B981', '#0EA5E9', '#EF4444'];
const TEAM_MAX_MEMBERS = 5;

const getInitials = (value = '') => {
  const parts = value.trim().split(/\s+/).filter(Boolean);

  if (parts.length === 0) {
    return 'U';
  }

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return `${parts[0][0] ?? ''}${parts[parts.length - 1][0] ?? ''}`.toUpperCase();
};

const getFriendlyError = (error, fallback = 'Something went wrong. Please try again.') => {
  const message = error?.response?.data?.message || error?.message || fallback;
  if (/^Request failed/i.test(message) || /^AxiosError/i.test(message)) {
    return fallback;
  }
  return message;
};

const getStudentRole = (member) => {
  const role = String(member?.userRole ?? member?.role ?? '').trim();
  return role.startsWith('ROLE_') ? role : 'ROLE_STUDENT';
};

const normalizeStudentCandidate = (student, index) => ({
  id: student?.id ?? student?.studentId ?? student?.uuid ?? `${student?.name ?? 'student'}-${index}`,
  name: student?.name ?? student?.fullName ?? 'Unnamed Student',
  universityID: student?.universityID ?? student?.universityId ?? student?.studentNumber ?? '',
  email: student?.email ?? '',
  department: getUserDepartment(student),
  major: formatMajorLabel(student),
  profilePhotoUrl: student?.profilePhotoUrl ?? student?.photoUrl ?? '',
});

const normalizeTeamData = (payload) => {
  const rawTeam = payload?.team ?? payload?.data ?? payload;

  if (!rawTeam || typeof rawTeam !== 'object') {
    return null;
  }

  const membersSource = Array.isArray(rawTeam.members)
    ? rawTeam.members
    : Array.isArray(rawTeam.teamMembers)
      ? rawTeam.teamMembers
      : Array.isArray(rawTeam.students)
        ? rawTeam.students
        : [];

  const availableStudentsSource = Array.isArray(rawTeam.availableStudents)
    ? rawTeam.availableStudents
    : Array.isArray(rawTeam.invitableStudents)
      ? rawTeam.invitableStudents
      : Array.isArray(rawTeam.studentsDatabase)
        ? rawTeam.studentsDatabase
        : [];

  const supervisor = rawTeam.supervisor ?? rawTeam.projectSupervisor ?? rawTeam.supervisorDto ?? null;

  return {
    ...rawTeam,
    teamName: rawTeam.teamName ?? rawTeam.name ?? 'My Team',
    createdOn: rawTeam.createdOn ?? rawTeam.createdAt ?? rawTeam.createdDate ?? '',
    teamLeader: rawTeam.teamLeader ?? rawTeam.leaderName ?? rawTeam.leader ?? '',
    maxMembers: TEAM_MAX_MEMBERS,
    maxSize: TEAM_MAX_MEMBERS,
    membersCount: rawTeam.membersCount ?? rawTeam.memberCount ?? membersSource.length,
    totalTasks: Number(rawTeam.totalTasks ?? rawTeam.taskCount ?? rawTeam.tasks?.total ?? 0),
    completedTasks: Number(rawTeam.completedTasks ?? rawTeam.tasks?.completed ?? 0),
    completionRate: Number(rawTeam.completionRate ?? rawTeam.progressRate ?? rawTeam.progress ?? 0),
    supervisor: supervisor
      ? {
          ...supervisor,
          name: supervisor.name ?? supervisor.fullName ?? 'Supervisor',
          avatar: supervisor.avatar ?? getInitials(supervisor.name ?? supervisor.fullName ?? 'Supervisor'),
        }
      : null,
    members: membersSource.map((member, index) => ({
      ...member,
      id: member?.userId ?? member?.id ?? member?.studentId ?? member?.universityID ?? member?.universityId ?? `${member?.name ?? 'member'}-${index}`,
      userId: member?.userId ?? member?.id ?? member?.studentId ?? member?.universityID ?? member?.universityId ?? '',
      name: member?.name ?? member?.fullName ?? 'Unnamed Member',
      email: member?.email ?? '',
      role: getStudentRole(member),
      memberRole: String(member?.memberRole ?? member?.role ?? 'MEMBER').toUpperCase(),
      status: member?.status ?? 'Active',
      avatar: member?.avatar ?? getInitials(member?.name ?? member?.fullName ?? 'Member'),
      color: member?.color ?? MEMBER_COLORS[index % MEMBER_COLORS.length],
      universityID: member?.universityID ?? member?.universityId ?? member?.studentId ?? '',
      tasks: member?.tasks ?? member?.taskSummary ?? '—',
      department: getUserDepartment(member),
      major: formatMajorLabel(member),
      profilePhotoUrl: member?.profilePhotoUrl ?? member?.photoUrl ?? '',
    })),
    availableStudents: availableStudentsSource.map(normalizeStudentCandidate),
  };
};

const TeamManagement = () => {
  const navigate = useNavigate();
  const { user, refreshUserProfile } = useAuth();
  const userHasTeam = !!user?.hasTeam;
  const hasAuthenticatedUser = Boolean(user);
  const currentUserName = user?.name ?? user?.userName ?? user?.fullName ?? '';
  const currentUserId = user?.id ?? user?.userId ?? user?.studentId ?? user?.uuid ?? '';
  const [teamData, setTeamData] = useState(null);
  const [studentsDatabase, setStudentsDatabase] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameEditValue, setNameEditValue] = useState('');
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('success');
  const [isCreateTeamOpen, setIsCreateTeamOpen] = useState(false);
  const [teamForm, setTeamForm] = useState({ name: '' });
  const [teamErrors, setTeamErrors] = useState({});
  const [rosterMembers, setRosterMembers] = useState([]);
  const [rosterLoading, setRosterLoading] = useState(false);
  const [isCreatingTeam, setIsCreatingTeam] = useState(false);
  const [isSavingTeamName, setIsSavingTeamName] = useState(false);
  const [isLeavingTeam, setIsLeavingTeam] = useState(false);
  const [pendingInvitations, setPendingInvitations] = useState([]);
  const [pendingInvitationsLoading, setPendingInvitationsLoading] = useState(false);
  const [cancelingInvitationId, setCancelingInvitationId] = useState('');
  const [removingMemberId, setRemovingMemberId] = useState('');
  const [projectInfo, setProjectInfo] = useState(null);
  const [projectLoading, setProjectLoading] = useState(false);
  const [confirmState, setConfirmState] = useState(null);

  const showToast = useCallback((message, type = 'success', duration = 3000) => {
    setToastType(type);
    setToastMessage(message);
  }, []);

  const askConfirm = useCallback((config) => {
    setConfirmState(config);
  }, []);

  const closeConfirm = useCallback(() => {
    setConfirmState(null);
  }, []);

  const fetchMyTeam = useCallback(async () => {
    if (!hasAuthenticatedUser) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await apiClient.get('/v1/student/teams/my');
      
      const normalizedTeam = normalizeTeamData(response.data);
      setTeamData(normalizedTeam);
      setStudentsDatabase(normalizedTeam?.availableStudents ?? []);
    } catch (requestError) {
      if (requestError?.response?.status === 404) {
        setTeamData(null);
        setStudentsDatabase([]);
        setError('');
        setIsLoading(false);
        return;
      }

      if (requestError?.response?.status === 403) {
        setError('You do not have permission to access your team. Please log in again.');
      } else {
        const message = requestError?.message || 'Unable to load team data.';
        setError(message);
      }
      
      setTeamData(null);
      setStudentsDatabase([]);
    } finally {
      setIsLoading(false);
    }
  }, [hasAuthenticatedUser]);

  const fetchRosterMembers = useCallback(async (teamId) => {
    if (!hasAuthenticatedUser || !teamId) {
      setRosterLoading(false);
      return;
    }

    setRosterLoading(true);
    try {
      const res = await apiClient.get('/v1/teams/my/members');
      const payload = res?.data ?? [];
      const normalized = Array.isArray(payload)
        ? payload.map((m, i) => ({
            id: m?.userId ?? m?.id ?? m?.studentId ?? m?.universityID ?? m?.uuid ?? `${m?.name ?? 'member'}-${i}`,
            userId: m?.userId ?? m?.id ?? m?.studentId ?? m?.universityID ?? m?.uuid ?? '',
            name: m?.name ?? m?.fullName ?? 'Unnamed Member',
            email: m?.email ?? '',
            role: getStudentRole(m),
            universityID: m?.universityID ?? m?.universityId ?? m?.studentId ?? '',
            memberRole: String(m?.memberRole ?? m?.role ?? 'MEMBER').toUpperCase(),
            avatar: m?.avatar ?? getInitials(m?.name ?? m?.fullName ?? 'Member'),
            color: m?.color ?? MEMBER_COLORS[i % MEMBER_COLORS.length],
            status: m?.status ?? 'Active',
            department: getUserDepartment(m),
            major: formatMajorLabel(m),
            profilePhotoUrl: m?.profilePhotoUrl ?? m?.photoUrl ?? '',
          }))
        : [];
      setRosterMembers(normalized);
      setTeamData(prev => (prev ? { ...prev, membersCount: normalized.length, members: normalized } : prev));
    } catch {
      setRosterMembers([]);
    } finally {
      setRosterLoading(false);
    }
  }, [hasAuthenticatedUser]);

  useEffect(() => {
    if (!hasAuthenticatedUser) {
      setTeamData(null);
      setStudentsDatabase([]);
      setIsLoading(false);
      return;
    }

    setTeamData(null);
    setStudentsDatabase([]);
    void fetchMyTeam();
  }, [hasAuthenticatedUser, fetchMyTeam]);

  const teamId = teamData?.id ?? '';

  useEffect(() => {
    if (hasAuthenticatedUser && teamId) {
      void fetchRosterMembers(teamId);
    }
  }, [hasAuthenticatedUser, teamId, fetchRosterMembers]);

  useEffect(() => {
    const loadProjectInfo = async () => {
      if (!hasAuthenticatedUser || !teamId) {
        setProjectInfo(null);
        return;
      }

      setProjectLoading(true);
      try {
        const response = await getMyProject();
        setProjectInfo(response?.data ?? null);
      } catch (err) {
        if ((err?.status ?? err?.response?.status) === 404) {
          setProjectInfo(null);
        }
      } finally {
        setProjectLoading(false);
      }
    };

    void loadProjectInfo();
  }, [hasAuthenticatedUser, teamId]);

  useEffect(() => {
    setNameEditValue(teamData?.teamName ?? '');
  }, [teamData]);

  useEffect(() => {
    if (!isCreateTeamOpen) {
      setTeamErrors({});
    }
  }, [isCreateTeamOpen]);
  const hasTeam = teamData !== null;
  const teamMembers = teamData?.members ?? [];
  const roster = rosterMembers.length ? rosterMembers : teamMembers;
  const teamLeaderProfile = roster.find((member) => String(member?.memberRole ?? '').toLowerCase() === 'leader') ?? null;
  const supervisor = projectInfo?.supervisor
    ? {
        ...projectInfo.supervisor,
        avatar: getInitials(projectInfo.supervisor.name ?? 'Supervisor'),
      }
    : null;
  const supervisorLabel = projectLoading
    ? 'Loading...'
    : projectInfo
      ? supervisor?.name ?? 'Not assigned yet'
      : 'No project submitted yet';
  const teamMaxSize = TEAM_MAX_MEMBERS;
  const membersCount = Array.isArray(roster) && roster.length > 0
    ? roster.length
    : (Array.isArray(teamData?.members) ? teamData.members.length : Number(teamData?.membersCount ?? 0));
  const slotsRemaining = Math.max(teamMaxSize - membersCount, 0);
  const isTeamFull = membersCount >= teamMaxSize;
  const totalTasks = Number.isFinite(Number(teamData?.totalTasks)) ? Number(teamData?.totalTasks) : 0;
  const completedTasks = Number.isFinite(Number(teamData?.completedTasks)) ? Number(teamData?.completedTasks) : 0;
  const completionRate = Math.max(0, Math.min(100, Number.isFinite(Number(teamData?.completionRate)) ? Math.round(Number(teamData?.completionRate)) : 0));
  const isLeader = roster.find(m => String(m.userId).toLowerCase() === String(currentUserId).toLowerCase())?.memberRole === 'LEADER';
  const leaderCanDisband = isLeader && membersCount <= 1;
  const leaderCannotLeave = isLeader && membersCount > 1;
  const leaderLeaveMessage = 'Team leader cannot leave or disband the team while other members are still in the team.';
  const projectExists = Boolean(projectInfo);
  const projectArchived = normalizeProjectStatus(projectInfo?.status) === 'ARCHIVED';

  const fetchPendingInvitations = useCallback(async () => {
    if (!hasAuthenticatedUser || !isLeader) {
      setPendingInvitations([]);
      return;
    }

    setPendingInvitationsLoading(true);
    try {
      const response = await apiClient.get('/v1/invitations/sent/pending');
      const payload = Array.isArray(response?.data) ? response.data : [];
      setPendingInvitations(payload.map((invitation) => ({
        id: invitation?.invitationId ?? invitation?.id ?? '',
        receiverId: invitation?.receiverId ?? '',
        receiverName: invitation?.receiverName ?? 'Student',
        receiverEmail: invitation?.receiverEmail ?? '',
        receiverUniversityId: invitation?.receiverUniversityId ?? '',
        createdAt: invitation?.createdAt ?? '',
      })).filter(invitation => invitation.id));
    } catch (err) {
      showToast(err?.response?.data?.message || err?.message || 'Unable to load pending invitations', 'error', 4000);
      setPendingInvitations([]);
    } finally {
      setPendingInvitationsLoading(false);
    }
  }, [hasAuthenticatedUser, isLeader, showToast]);

  useEffect(() => {
    if (hasTeam && isLeader) {
      void fetchPendingInvitations();
    } else {
      setPendingInvitations([]);
    }
  }, [hasTeam, isLeader, fetchPendingInvitations]);

  const handleInviteSent = useCallback(async () => {
    await fetchPendingInvitations();
    await fetchMyTeam();
    if (teamId) {
      await fetchRosterMembers(teamId);
    }
  }, [fetchMyTeam, fetchPendingInvitations, fetchRosterMembers, teamId]);

  const handleCreateTeam = async (e) => {
    e.preventDefault();
    const trimmedName = String(teamForm.name || '').trim();
    const nextErrors = {};

    if (!trimmedName) {
      nextErrors.name = 'Team name is required.';
    } else if (trimmedName.length < 3) {
      nextErrors.name = 'Team name must be at least 3 characters.';
    }

    if (Object.keys(nextErrors).length) {
      setTeamErrors(nextErrors);
      return;
    }

    setIsCreatingTeam(true);
    setTeamErrors({});
    try {
      const response = await apiClient.post('/v1/student/teams', {
        name: trimmedName,
      });

      if (refreshUserProfile) {
        await refreshUserProfile();
      }

      const createdTeam = normalizeTeamData(response.data);
      if (createdTeam) {
        setTeamData(createdTeam);
        setStudentsDatabase(createdTeam.availableStudents ?? []);
      }
      await fetchMyTeam();

      setError('');
      setIsCreateTeamOpen(false);
      navigate('/my-team', { replace: true });
      setTeamForm({ name: '' });
      showToast('Team created successfully.');
    } catch (requestError) {
      const message = getFriendlyError(requestError, 'Could not create team. Please try again.');
      const fieldErrors = requestError?.fieldErrors || requestError?.validationErrors || {};
      setError(message);
      setTeamErrors({
        name: fieldErrors.name || fieldErrors.teamName || '',
      });
      showToast(message, 'error', 4000);
    } finally {
      setIsCreatingTeam(false);
    }
  };

  const handleLeaveTeam = async () => {
    const isCurrentUserLeader = isLeader;

    if (leaderCannotLeave) {
      setToastType('error');
      setToastMessage(leaderLeaveMessage);
      return;
    }

    const action = isCurrentUserLeader ? 'disband' : 'leave';
    askConfirm({
      title: isCurrentUserLeader ? 'Disband team?' : 'Leave team?',
      message: isCurrentUserLeader
        ? 'Disband this team? This action cannot be undone and the team will be removed for all members.'
        : 'Leave this team? You will no longer appear in the roster, but the team can continue without you.',
      confirmLabel: isCurrentUserLeader ? 'Disband Team' : 'Leave Team',
      tone: 'danger',
      loadingLabel: isCurrentUserLeader ? 'Disbanding...' : 'Leaving...',
      onConfirm: async () => {
        setIsLeavingTeam(true);
        try {
          await apiClient.delete('/v1/teams/my/leave');
          if (refreshUserProfile) await refreshUserProfile();
          setTeamData(null);
          setRosterMembers([]);
          showToast(isCurrentUserLeader ? 'Team disbanded successfully.' : 'Successfully left the team.');
          navigate('/my-team', { replace: true });
        } catch (err) {
          showToast(err?.response?.data?.message || 'An unexpected error occurred. Please try again.', 'error', 4000);
        } finally {
          setIsLeavingTeam(false);
          closeConfirm();
        }
      },
    });
  };

  const handleCancelInvitation = async (invitationId) => {
    if (!invitationId) return;
    askConfirm({
      title: 'Cancel pending invitation?',
      message: 'Cancel this pending invitation? The student can be invited again later if needed.',
      confirmLabel: 'Cancel Invitation',
      tone: 'danger',
      loadingLabel: 'Canceling...',
      onConfirm: async () => {
        setCancelingInvitationId(invitationId);
        try {
          const response = await apiClient.patch(`/v1/invitations/${invitationId}/cancel`);
          showToast(response?.data?.message || 'Invitation canceled');
          await fetchPendingInvitations();
        } catch (err) {
          showToast(err?.response?.data?.message || err?.message || 'Could not cancel invitation', 'error', 4000);
        } finally {
          setCancelingInvitationId('');
          closeConfirm();
        }
      },
    });
  };

  const normalizeRosterPayload = (payload) => payload.map((m, i) => ({
    id: m?.userId ?? m?.id ?? m?.studentId ?? m?.universityID ?? m?.uuid ?? `${m?.name ?? 'member'}-${i}`,
    userId: m?.userId ?? m?.id ?? m?.studentId ?? m?.universityID ?? m?.uuid ?? '',
    name: m?.name ?? m?.fullName ?? 'Unnamed Member',
    email: m?.email ?? '',
    role: getStudentRole(m),
    universityID: m?.universityID ?? m?.universityId ?? m?.studentId ?? '',
    memberRole: String(m?.memberRole ?? m?.role ?? 'MEMBER').toUpperCase(),
    avatar: m?.avatar ?? getInitials(m?.name ?? m?.fullName ?? 'Member'),
    color: m?.color ?? MEMBER_COLORS[i % MEMBER_COLORS.length],
    status: m?.status ?? 'Active',
    department: getUserDepartment(m),
    major: formatMajorLabel(m),
    profilePhotoUrl: m?.profilePhotoUrl ?? m?.photoUrl ?? '',
  }));

  const handleRemoveMember = async (member) => {
    const memberId = member?.userId ?? member?.id ?? '';
    if (!memberId) return;
    askConfirm({
      title: 'Remove team member?',
      message: `Remove ${member?.name ?? 'this student'} from the team? They may become eligible for other invitations again.`,
      confirmLabel: 'Remove Member',
      tone: 'danger',
      loadingLabel: 'Removing...',
      onConfirm: async () => {
        setRemovingMemberId(memberId);
        try {
          const response = await apiClient.delete(`/v1/teams/my/members/${memberId}`);
          const payload = Array.isArray(response?.data) ? response.data : [];
          const normalized = normalizeRosterPayload(payload);
          setRosterMembers(normalized);
          setTeamData(prev => (prev ? { ...prev, membersCount: normalized.length, members: normalized } : prev));
          showToast('Member removed from team.');
        } catch (err) {
          showToast(err?.response?.data?.message || err?.message || 'Could not remove member', 'error', 4000);
        } finally {
          setRemovingMemberId('');
          closeConfirm();
        }
      },
    });
  };

  const saveTeamName = async () => {
    if (!isLeader) {
      setToastType('error');
      setToastMessage('Only team leaders can update team name');
      setIsEditingName(false);
      return;
    }

    const newName = String(nameEditValue || '').trim();
    if (!newName) {
      setToastType('error');
      setToastMessage('Team name is required');
      return;
    }

    try {
      setIsSavingTeamName(true);
      const response = await apiClient.put('/v1/teams/my', { name: newName });
      const updatedTeam = normalizeTeamData(response?.data);
      setTeamData(prev => updatedTeam ?? (prev ? { ...prev, teamName: newName } : prev));
      if (updatedTeam?.members) {
        setRosterMembers(updatedTeam.members);
      }
      try {
        const projectResponse = await getMyProject();
        setProjectInfo(projectResponse?.data ?? null);
      } catch {
        setProjectInfo(prev => prev ? { ...prev, title: newName, teamName: newName } : prev);
      }
      setIsEditingName(false);
      showToast(projectExists ? 'Project name updated successfully.' : 'Team name updated.');
    } catch (err) {
      showToast(err?.response?.data?.message || 'Could not update team name', 'error', 4000);
    } finally {
      setIsSavingTeamName(false);
    }
  };

  if (isLoading && !teamData) {
    return (
      <div className="team-page-container">
        <style>{styles}</style>
        <div className="team-header-wrapper">
          <div className="team-header-info">
            <p className="breadcrumb-text">Student Portal / Collaboration</p>
            <h1 className="main-page-title">Team Management</h1>
          </div>
        </div>
        <div style={{ display: 'flex', minHeight: '55vh', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '52px', marginBottom: '16px' }}>⏳</div>
            <h2 style={{ fontSize: '24px', fontWeight: 900, color: '#0f172a', marginBottom: '8px' }}>Loading team data</h2>
            <p style={{ fontSize: '14px', color: '#64748b', margin: 0 }}>Fetching your current team from the server.</p>
          </div>
        </div>
      </div>
    );
  }

  const renderContent = () => {
    if (error && !teamData) {
      return (
        <div style={{ display: 'flex', minHeight: '55vh', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
          <div style={{ maxWidth: '520px', padding: '28px', borderRadius: '24px', border: '1px solid #fecaca', background: '#fff1f2' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</div>
            <h2 style={{ fontSize: '24px', fontWeight: 900, color: '#9f1239', marginBottom: '10px' }}>Unable to load your team</h2>
            <p style={{ fontSize: '14px', color: '#be123c', lineHeight: 1.6, marginBottom: '20px' }}>{error}</p>
            <button
              type="button"
              className="btn-invite-new"
              onClick={fetchMyTeam}
              style={{ width: '100%', justifyContent: 'center' }}
            >
              Retry
            </button>
          </div>
        </div>
      );
    }

    if (!hasTeam) {
      if (userHasTeam) {
        return (
          <div style={{ display: 'flex', minHeight: '55vh', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
            <div style={{ maxWidth: '520px', padding: '28px', borderRadius: '24px', border: '1px solid #e2e8f0', background: '#f8fafc' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>⏳</div>
              <h2 style={{ fontSize: '24px', fontWeight: 900, color: '#0f172a', marginBottom: '10px' }}>Loading your team</h2>
              <p style={{ fontSize: '14px', color: '#64748b', lineHeight: 1.6, marginBottom: '0' }}>Your membership is being refreshed. The create-team view stays hidden while we verify your team state.</p>
            </div>
          </div>
        );
      }

      return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', textAlign: 'center' }}>
          <div style={{ maxWidth: '450px' }}>
            <div style={{ fontSize: '64px', marginBottom: '20px' }}>👥</div>
            <h2 style={{ fontSize: '28px', fontWeight: 900, color: '#0f172a', marginBottom: '10px' }}>No Team Yet</h2>
            <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '30px', lineHeight: '1.6' }}>Create your first team to collaborate with classmates on your graduation project.</p>
            <button 
              className="btn-invite-new" 
              onClick={() => setIsCreateTeamOpen(true)}
              style={{ background: '#4f46e5', color: 'white', border: 'none', padding: '14px 32px', borderRadius: '12px', fontWeight: 800, fontSize: '15px', cursor: 'pointer', boxShadow: '0 4px 12px rgba(79, 70, 229, 0.25)', width: '100%', justifyContent: 'center' }}
            >
              + Create Your Team
            </button>
          </div>
        </div>
      );
    }

    return (
      <>
        {error && (
          <div style={{ marginBottom: '20px', padding: '14px 16px', borderRadius: '14px', border: '1px solid #fed7aa', background: '#fff7ed', color: '#9a3412', display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'center' }}>
            <span>{error}</span>
            <button type="button" onClick={fetchMyTeam} style={{ border: 'none', background: '#9a3412', color: 'white', borderRadius: '10px', padding: '8px 12px', fontWeight: 800, cursor: 'pointer' }}>
              Retry
            </button>
          </div>
        )}

        {isLoading && teamData && (
          <div style={{ marginBottom: '16px', fontSize: '13px', fontWeight: 700, color: '#4f46e5' }}>
            Refreshing team data...
          </div>
        )}

        <div className="team-overview-grid">
          <div className="team-card-main">
            <div className="card-header-row">
                  {!isEditingName || !isLeader || projectArchived ? (
                    <div style={{display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap'}}>
                      <h2>{teamData?.teamName ?? 'My Team'}</h2>
                      {isLeader && !projectArchived && (
                        <button type="button" aria-label="Edit team name" title="Edit team name" onClick={() => setIsEditingName(true)} style={{background: 'transparent', border: 'none', cursor: 'pointer', fontSize: 16, color: '#4f46e5', fontWeight: 900}}>✎</button>
                      )}
                    </div>
                  ) : (
                    <div style={{display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap'}}>
                      <input type="text" value={nameEditValue} onChange={(e) => setNameEditValue(e.target.value)} disabled={isSavingTeamName} style={{padding: '10px 12px', borderRadius: 12, border: '1px solid #dbe2ea', minWidth: 260, fontFamily: 'inherit', fontWeight: 700}} />
                      <button type="button" onClick={saveTeamName} disabled={isSavingTeamName || !nameEditValue.trim()} style={{background: '#4f46e5', color: 'white', border: 'none', padding: '10px 14px', borderRadius: 12, fontWeight: 900, cursor: isSavingTeamName || !nameEditValue.trim() ? 'not-allowed' : 'pointer'}}>{isSavingTeamName ? 'Saving...' : 'Save'}</button>
                      <button type="button" onClick={() => { setIsEditingName(false); setNameEditValue(teamData?.teamName ?? ''); }} disabled={isSavingTeamName} style={{background: '#e2e8f0', border: 'none', padding: '10px 14px', borderRadius: 12, fontWeight: 900, cursor: isSavingTeamName ? 'not-allowed' : 'pointer'}}>Cancel</button>
                    </div>
                  )}
                  <span className="badge-active">Active</span>
                </div>

            <div className="team-meta-row">
              <span className="label">Project Supervisor:</span>
              {supervisor ? (
                <ClickableUser
                  user={{ ...supervisor, role: 'ROLE_SUPERVISOR' }}
                  className="supervisor-pill supervisor-pill-button"
                  avatarClassName="sup-avatar-small"
                  nameClassName="value"
                  subtitle={supervisor?.email || supervisor?.specialty || 'View supervisor profile'}
                  subtitleClassName="roster-subline"
                />
              ) : (
                <div className="supervisor-pill">
                  <div className="sup-avatar-small">{getInitials('Supervisor')}</div>
                  <span className="value">{supervisorLabel}</span>
                </div>
              )}
            </div>

            {projectExists && (
              <div className="team-meta-row">
                <span className="label">Project Status:</span>
                <span className="value"><ProjectStatusBadge status={projectInfo?.status} /></span>
              </div>
            )}

            {projectExists && (
              <div className="team-meta-row">
                <span className="label">Project Name:</span>
                <span className="value">
                  {projectArchived
                    ? 'Archived project names cannot be changed.'
                    : 'Team name is used as the project name. Editing it will also update the project title.'}
                </span>
              </div>
            )}

            <div className="team-meta-row">
              <span className="label">Team Leader:</span>
              {teamLeaderProfile ? (
                <ClickableUser
                  user={{
                    ...teamLeaderProfile,
                    id: teamLeaderProfile?.userId ?? teamLeaderProfile?.id ?? null,
                    role: teamLeaderProfile?.role ?? 'ROLE_STUDENT',
                    universityId: teamLeaderProfile?.universityID ?? teamLeaderProfile?.universityId ?? '',
                    department: teamLeaderProfile?.department ?? '',
                  }}
                  className="supervisor-pill supervisor-pill-button"
                  avatarClassName="sup-avatar-small"
                  nameClassName="value"
                  subtitle={formatMajorLabel(teamLeaderProfile)}
                  subtitleClassName="roster-subline"
                />
              ) : (
                <span className="value">{teamData?.teamLeader ?? 'Not assigned yet'}</span>
              )}
            </div>
            <div className="team-meta-row">
              <span className="label">Established On:</span>
              <span className="value">{(() => { const d = teamData?.establishedOn ?? teamData?.createdOn ?? teamData?.createdAt; return d ? new Date(d).toLocaleDateString() : '—'; })()}</span>
            </div>
            <div className="team-meta-row">
              <span className="label">Members Count:</span>
              <span className="value">{membersCount} / {teamMaxSize}</span>
            </div>
          </div>

          <div className="team-stats-card" onClick={() => navigate('/student/tasks')} title="View All Project Tasks">
            <div className="stat-item-mini">
              <span>Total Tasks</span>
              <strong>{totalTasks}</strong>
            </div>
            <div className="stat-divider"></div>
            <div className="stat-item-mini">
              <span>Completion Rate</span>
              <strong>{completionRate}%</strong>
              <div className="team-progress-track" aria-hidden="true">
                <div className="team-progress-fill" style={{ width: `${completionRate}%` }} />
              </div>
              <small>{totalTasks > 0 ? `${completedTasks} of ${totalTasks} tasks completed` : 'Tasks will appear after your project workflow starts.'}</small>
            </div>
          </div>
        </div>

        {isLeader && (
          <section className="pending-section">
            <div className="roster-header">
              <div>
                <h2 className="roster-title">Pending Invitations</h2>
                <p className="roster-subtitle">Students invited by your team who have not accepted or rejected yet.</p>
              </div>
              <div className="roster-badge">{pendingInvitations.length} Pending</div>
            </div>

            {pendingInvitationsLoading ? (
              <div className="roster-empty">Loading pending invitations...</div>
            ) : pendingInvitations.length === 0 ? (
              <div className="roster-empty">No pending invitations.</div>
            ) : (
              <div className="roster-list">
                {pendingInvitations.map((invitation) => (
                  <div className="pending-card" key={invitation.id}>
                    <div>
                      <p className="pending-title">{invitation.receiverName}</p>
                      <p className="pending-meta">
                        {[invitation.receiverUniversityId, invitation.receiverEmail].filter(Boolean).join(' | ') || 'Pending student'}
                      </p>
                    </div>
                    <button
                      type="button"
                      className="pending-cancel"
                      disabled={cancelingInvitationId === invitation.id}
                      onClick={() => void handleCancelInvitation(invitation.id)}
                    >
                      {cancelingInvitationId === invitation.id ? 'Canceling...' : 'Cancel'}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        <section className="roster-section">
          <div className="roster-header">
            <div>
              <h2 className="roster-title">Team Roster</h2>
              <p className="roster-subtitle">Everyone in your team is listed below with their university ID and current status.</p>
            </div>
            <div className="roster-badge">{roster?.length ?? 0} Members</div>
          </div>

            {rosterLoading ? (
              <div className="roster-empty">Loading members...</div>
            ) : roster.length === 0 ? (
              <div className="roster-empty">No members have been added yet.</div>
            ) : (
              <div className="roster-list">
                {roster.map((member) => {
                  const memberId = member?.id ?? member?.studentId ?? member?.universityID ?? member?.universityId ?? '';
                  const memberUserId = member?.userId ?? memberId;
                  const isCurrentUser = Boolean(currentUserId && memberUserId && String(memberUserId).toLowerCase() === String(currentUserId).toLowerCase());
                  const isMemberLeader = String(member?.memberRole ?? '').toLowerCase() === 'leader';
                  const canRemoveMember = isLeader && !isCurrentUser && !isMemberLeader;

                return (
                  <div className="roster-card" key={memberId || member.name}>
                    <ClickableUser
                      user={{
                        ...member,
                        id: memberUserId,
                        role: member?.role ?? 'ROLE_STUDENT',
                        universityId: member?.universityID ?? member?.universityId ?? '',
                        department: member?.department ?? '',
                      }}
                      className="roster-left roster-profile-button"
                      avatarClassName="roster-avatar"
                      nameClassName="roster-name"
                      subtitle={formatMajorLabel(member)}
                      subtitleClassName="roster-subline"
                    />

                    <div className="roster-right">
                      {!isCurrentUser && member?.email ? (
                        <button
                          className="btn-send-message"
                          onClick={(event) => { event.stopPropagation(); openTeamsChat(member.email); }}
                        >
                          Contact on Teams
                        </button>
                      ) : null}
                      {canRemoveMember && (
                        <button
                          type="button"
                          className="roster-remove"
                          disabled={removingMemberId === memberUserId}
                          onClick={(event) => { event.stopPropagation(); void handleRemoveMember(member); }}
                        >
                          {removingMemberId === memberUserId ? 'Removing...' : 'Remove'}
                        </button>
                      )}
                    </div>
                    <div className="roster-meta" style={{ gridColumn: '1 / -1', marginTop: 0 }}>
                      {isCurrentUser ? <span className="roster-leader-tag">You</span> : null}
                      {isMemberLeader ? <span className="roster-leader-tag">Leader</span> : null}
                      <span className="roster-pill">University ID: {member?.universityID ?? member?.universityId ?? '—'}</span>
                      <span className="roster-pill">Major: {formatMajorLabel(member)}</span>
                      <span className="roster-pill">Status: {String(member?.status ?? '').toLowerCase() === 'active' ? 'Active' : 'Pending'}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          {hasTeam && (
            <div style={{ marginTop: 18, display: 'flex', justifyContent: 'flex-end', flexDirection: 'column', alignItems: 'flex-end', gap: 10 }}>
              {leaderCannotLeave && (
                <div style={{ maxWidth: 520, padding: '12px 14px', borderRadius: 12, background: '#fff7ed', border: '1px solid #fed7aa', color: '#9a3412', fontSize: 13, fontWeight: 700, lineHeight: 1.5 }}>
                  {leaderLeaveMessage}
                </div>
              )}
              <button disabled={leaderCannotLeave || isLeavingTeam} onClick={handleLeaveTeam} style={{ background: '#fee2e2', color: '#9f1239', border: '1px solid rgba(220,38,38,0.12)', padding: '10px 14px', borderRadius: 12, fontWeight: 800, cursor: leaderCannotLeave || isLeavingTeam ? 'not-allowed' : 'pointer', opacity: leaderCannotLeave || isLeavingTeam ? 0.65 : 1 }}>
                {isLeavingTeam ? (isLeader ? 'Disbanding...' : 'Leaving...') : (isLeader ? (leaderCanDisband ? 'Disband Team' : 'Leader Cannot Leave') : 'Leave Team')}
              </button>
            </div>
          )}
        </section>
      </>
    );
  };

  return (
    <div className="team-page-container">
      <style>{styles}</style>
      
      <div className="team-header-wrapper">
        <div className="team-header-info">
          <p className="breadcrumb-text">Student Portal / Collaboration</p>
          <h1 className="main-page-title">Team Management</h1>
        </div>
        {hasTeam && isLeader && (
          <div className="team-header-actions">
            <button
              className="btn-invite-new"
              onClick={() => setIsInviteOpen(true)}
              disabled={isTeamFull}
              title={isTeamFull ? 'Your team is full.' : `${slotsRemaining} slots remaining`}
            >
              + Invite Member
            </button>
            {isTeamFull ? <span className="team-full-helper">Your team is full.</span> : null}
          </div>
        )}
      </div>

      {renderContent()}

      <InviteModal
        isOpen={isInviteOpen}
        onClose={() => setIsInviteOpen(false)}
        onInviteSent={handleInviteSent}
        currentMembers={membersCount}
        maxMembers={teamMaxSize}
        isTeamFull={isTeamFull}
      />

      {isCreateTeamOpen && (
        <div className="modal-backdrop" onClick={() => !isCreatingTeam && setIsCreateTeamOpen(false)}>
          <div className="create-team-panel" onClick={e => e.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="create-team-title" aria-describedby="create-team-desc">
            <div className="create-team-header">
              <div className="create-team-copy">
                <p className="create-team-kicker">Student Portal / Collaboration</p>
                <h2 id="create-team-title" className="create-team-title">Create New Team</h2>
                <p id="create-team-desc" className="create-team-subtitle">Choose a clear team name for your graduation project workspace.</p>
              </div>
              <button type="button" className="btn-close-circle" onClick={() => setIsCreateTeamOpen(false)} aria-label="Close create team dialog" disabled={isCreatingTeam}>✕</button>
            </div>

            <div className="create-team-body">
              <div className="create-team-info-card">
                <p>Your team name will be used as your project name after proposal submission.</p>
                <p>Maximum team size: {TEAM_MAX_MEMBERS} members.</p>
              </div>

              <form className="create-team-form" onSubmit={handleCreateTeam}>
                <div className="create-team-field">
                  <label htmlFor="team-name">Team Name</label>
                  <input
                    id="team-name"
                    className="create-team-input"
                    type="text"
                    placeholder="e.g., Smart Campus Management System"
                    value={teamForm.name}
                    onChange={(e) => { setTeamForm({ ...teamForm, name: e.target.value }); if (teamErrors.name) setTeamErrors((current) => ({ ...current, name: '' })); }}
                    disabled={isCreatingTeam}
                    aria-invalid={Boolean(teamErrors.name)}
                    autoComplete="off"
                  />
                  {teamErrors.name ? <p className="create-team-error">{teamErrors.name}</p> : <p className="create-team-help">Teams can have up to {TEAM_MAX_MEMBERS} members.</p>}
                </div>

                <div className="create-team-actions">
                  <button type="button" className="create-team-btn secondary" onClick={() => setIsCreateTeamOpen(false)} disabled={isCreatingTeam}>Cancel</button>
                  <button type="submit" className="create-team-btn primary" disabled={isCreatingTeam || teamForm.name.trim().length < 3}>
                    {isCreatingTeam ? 'Creating...' : 'Create Team'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={Boolean(confirmState)}
        title={confirmState?.title}
        message={confirmState?.message}
        confirmLabel={confirmState?.confirmLabel}
        tone={confirmState?.tone}
        loadingLabel={confirmState?.loadingLabel}
        isLoading={isCreatingTeam || isSavingTeamName || isLeavingTeam || Boolean(cancelingInvitationId) || Boolean(removingMemberId)}
        onCancel={closeConfirm}
        onConfirm={confirmState?.onConfirm}
      />

      <FeedbackToast message={toastMessage} type={toastType} onClose={() => setToastMessage('')} />

    </div>
  );
};

export default TeamManagement;

