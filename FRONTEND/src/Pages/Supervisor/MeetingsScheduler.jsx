import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * 💡 ملاحظة:
 * التنسيقات مدمجة لتعمل المعاينة، في مشروعك قم بإزالة التعليق عن الـ import أدناه
 * وانقل التنسيقات لملف MeetingsScheduler.css
 */
// import './MeetingsScheduler.css';

const schedulerStyles = `
  /* ... التنسيقات الأصلية كما هي بدون حذف ... */
  .meetings-viewport { padding: 10px 20px 40px 20px; font-family: 'Plus Jakarta Sans', -apple-system, sans-serif; color: #0f172a; animation: fadeInPage 0.4s ease-out; text-align: left;}
  @keyframes fadeInPage { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
  .page-header-row { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 30px; }
  .kicker { color: #64748b; font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 5px 0; }
  .page-title { font-size: 32px; font-weight: 900; margin: 0; color: #0f172a; letter-spacing: -1px; }
  .header-actions { display: flex; gap: 12px; flex-wrap: wrap;}
  .btn-outline { background: white; border: 1px solid #cbd5e1; color: #475569; padding: 10px 18px; border-radius: 12px; font-weight: 800; font-size: 13px; cursor: pointer; transition: 0.2s; display: flex; align-items: center; gap: 8px; }
  .btn-outline:hover { background: #f8fafc; border-color: #94a3b8; color: #0f172a; transform: translateY(-2px); box-shadow: 0 4px 6px rgba(0,0,0,0.02);}
  .btn-primary { background: #4f46e5; color: white; border: none; padding: 10px 20px; border-radius: 12px; font-weight: 800; font-size: 13px; cursor: pointer; transition: 0.2s; box-shadow: 0 4px 12px rgba(79, 70, 229, 0.25); display: flex; align-items: center; gap: 8px; }
  .btn-primary:hover { background: #4338ca; transform: translateY(-2px); box-shadow: 0 8px 20px rgba(79, 70, 229, 0.3); }
  .table-card { background: white; border: 1px solid #e2e8f0; border-radius: 20px; padding: 25px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.02); margin-bottom: 30px; overflow-x: auto;}
  .card-title { font-size: 18px; font-weight: 900; color: #0f172a; margin: 0 0 20px 0; }
  .premium-table { width: 100%; border-collapse: collapse; text-align: left; min-width: 800px;}
  .premium-table th { padding: 0 15px 15px 15px; font-size: 11px; font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid #f1f5f9; }
  .premium-table td { padding: 18px 15px; border-bottom: 1px solid #f1f5f9; font-size: 14px; color: #1e293b; font-weight: 600; vertical-align: middle; }
  .premium-table tr:last-child td { border-bottom: none; }
  .premium-table tr:hover td { background: #f8fafc; }
  .date-time-cell .date { display: block; font-weight: 800; color: #0f172a; margin-bottom: 4px;}
  .date-time-cell .time { display: block; font-size: 12px; color: #64748b; font-weight: 600;}
  .project-name { font-weight: 700; color: #334155; }
  .interactive-cell { position: relative; }
  .status-badge { padding: 6px 12px; border-radius: 20px; font-size: 11px; font-weight: 800; text-transform: uppercase; cursor: pointer; display: inline-flex; align-items: center; gap: 5px; border: 1px solid transparent; transition: 0.2s; }
  .status-badge:hover { filter: brightness(0.95); }
  .status-badge.confirmed { background: #d1fae5; color: #059669; border-color: #a7f3d0; }
  .status-badge.pending { background: #fef3c7; color: #d97706; border-color: #fde68a; }
  .status-badge.cancelled { background: #fee2e2; color: #ef4444; border-color: #fecaca; }
  .status-badge.completed { background: #e0e7ff; color: #4f46e5; border-color: #c7d2fe; }
  .type-badge { padding: 6px 12px; border-radius: 8px; font-size: 12px; font-weight: 700; background: #f1f5f9; color: #475569; cursor: pointer; display: inline-flex; align-items: center; gap: 5px; transition: 0.2s; }
  .type-badge:hover { background: #e2e8f0; color: #0f172a; }
  .action-dropdown { position: absolute; top: 100%; left: 0; margin-top: 8px; background: white; border: 1px solid #e2e8f0; border-radius: 12px; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.1); width: 150px; z-index: 20; overflow: hidden; }
  .dropdown-option { width: 100%; text-align: left; padding: 10px 15px; border: none; background: none; font-size: 12px; font-weight: 700; cursor: pointer; border-bottom: 1px solid #f8fafc; color: #475569; transition: 0.2s; }
  .dropdown-option:hover { background: #f1f5f9; color: #0f172a; }
  .attendee-pill { display: inline-flex; align-items: center; gap: 8px; background: #f8fafc; padding: 6px 12px 6px 6px; border-radius: 20px; border: 1px solid #e2e8f0; cursor: pointer; transition: 0.2s; }
  .attendee-pill:hover { background: white; border-color: #4f46e5; color: #4f46e5; transform: translateY(-2px); box-shadow: 0 4px 6px rgba(79,70,229,0.1); }
  .attendee-avatar { width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: 800; color: white; }
  .attendee-name { font-size: 13px; font-weight: 700; color: inherit; transition: 0.2s; }
  .notes-cell { font-size: 13px; color: #475569; line-height: 1.5; max-width: 300px; }

  /* 💡 تنسيقات رابط المشروع التفاعلي */
  .project-link-saas {
    color: #4f46e5;
    font-weight: 800;
    cursor: pointer;
    transition: 0.2s;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 4px 8px;
    border-radius: 6px;
    margin-left: -8px; /* Alignment adjustment */
  }
  .project-link-saas:hover {
    background: #e0e7ff;
    color: #3730a3;
  }

  /* 💡 NEW: Stacked Avatars (تيم الحضور) */
  .avatar-group { display: inline-flex; align-items: center; cursor: pointer; padding: 5px; border-radius: 20px; transition: 0.2s;}
  .avatar-group:hover { background: #f8fafc; }
  .avatar-circle { width: 32px; height: 32px; border-radius: 50%; border: 2px solid white; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 800; color: white; margin-left: -10px; transition: 0.2s; box-shadow: 0 2px 4px rgba(0,0,0,0.1);}
  .avatar-circle:first-child { margin-left: 0; }
  .avatar-group:hover .avatar-circle { transform: translateY(-4px); box-shadow: 0 6px 10px rgba(0,0,0,0.15);}
  .avatar-more { background: #f1f5f9; color: #475569; border-color: white; }

  /* 💡 NEW: Team Details Modal (البطاقة الذكية للتيم) */
  .modal-overlay { position: fixed; inset: 0; background: rgba(15, 23, 42, 0.6); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: 1000; animation: fadeIn 0.2s; }
  @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
  .team-card-modal { background: white; border-radius: 24px; width: 90%; max-width: 450px; overflow: hidden; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25); animation: slideUp 0.3s ease-out; text-align: left; }
  @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
  .tc-header { padding: 30px; background: linear-gradient(135deg, #0f172a, #1e293b); color: white; position: relative; }
  .tc-close { position: absolute; top: 15px; right: 15px; background: rgba(255,255,255,0.1); border: none; color: white; width: 30px; height: 30px; border-radius: 50%; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: 0.2s; font-size: 16px;}
  .tc-close:hover { background: rgba(255,255,255,0.2); transform: scale(1.1);}
  .tc-body { padding: 20px 30px 30px 30px; }
  .tm-row { display: flex; align-items: center; justify-content: space-between; padding: 12px 15px; background: #f8fafc; border: 1px solid #f1f5f9; border-radius: 14px; transition: 0.2s; cursor: pointer; margin-bottom: 10px; }
  .tm-row:hover { border-color: #4f46e5; background: white; box-shadow: 0 4px 6px rgba(79, 70, 229, 0.05); transform: translateX(5px); }
  .tm-info { display: flex; align-items: center; gap: 12px; }
  .tm-avatar { width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-weight: 800; font-size: 13px;}
`;

const MeetingsScheduler = () => {
  const navigate = useNavigate();

  // --- حالات لتتبع القوائم المنسدلة والـ Modals ---
  const [openStatusId, setOpenStatusId] = useState(null);
  const [openTypeId, setOpenTypeId] = useState(null);
  const [selectedTeamDetails, setSelectedTeamDetails] = useState(null); // 💡 للتحكم بظهور بطاقة التيم

  // --- بيانات محاكية (Mock Data) محدثة لتشمل أعضاء الفريق ---
  const [upcomingMeetings, setUpcomingMeetings] = useState([
    {
      id: 1, date: 'Mar 18, 2026', time: '10:00 AM', project: 'Smart Campus',
      attendees: { 
        name: 'Team Alpha', 
        project: 'Smart Campus',
        members: [
          { name: 'Ali Mansour', role: 'Team Leader', color: '#f59e0b' },
          { name: 'Sara Ahmed', role: 'Developer', color: '#3b82f6' },
          { name: 'Omar Khalid', role: 'UI/UX', color: '#10b981' }
        ]
      },
      type: 'Review', status: 'Confirmed'
    },
    {
      id: 2, date: 'Mar 20, 2026', time: '02:00 PM', project: 'AI Academic Advisor',
      attendees: { 
        name: 'Team Beta', 
        project: 'AI Academic Advisor',
        members: [
          { name: 'Mona Zaid', role: 'Data Scientist', color: '#ec4899' },
          { name: 'Ahmad Rami', role: 'Backend Dev', color: '#8b5cf6' }
        ]
      },
      type: 'Check-in', status: 'Pending'
    },
    {
      id: 3, date: 'Mar 22, 2026', time: '11:00 AM', project: 'Blockchain Voting',
      attendees: { 
        name: 'Team Gamma', 
        project: 'Blockchain Voting',
        members: [
          { name: 'Khaled Youssef', role: 'Smart Contracts', color: '#14b8a6' },
          { name: 'Nour Ali', role: 'Frontend Dev', color: '#f43f5e' }
        ]
      },
      type: 'Milestone', status: 'Confirmed'
    }
  ]);

  // --- بيانات الاجتماعات السابقة ---
  const pastMeetings = [
    { id: 101, date: 'Mar 10, 2026', project: 'Smart Campus', duration: '45 min', notes: 'Reviewed UI mockups and database schema. Approved next steps.' },
    { id: 102, date: 'Mar 08, 2026', project: 'AI Academic Advisor', duration: '30 min', notes: 'Discussed API design constraints and provided dataset sources.' }
  ];

  // --- Handlers للتعديل التفاعلي ---
  const handleStatusChange = (id, newStatus, e) => {
    e.stopPropagation();
    setUpcomingMeetings(upcomingMeetings.map(m => m.id === id ? { ...m, status: newStatus } : m));
    setOpenStatusId(null);
  };

  const handleTypeChange = (id, newType, e) => {
    e.stopPropagation();
    setUpcomingMeetings(upcomingMeetings.map(m => m.id === id ? { ...m, type: newType } : m));
    setOpenTypeId(null);
  };

  // وظيفة النقر على المشروع (توجيه مع Auto-Search)
  const handleProjectClick = (projectName) => {
    navigate('/supervisor/projects', { state: { targetProject: projectName } });
  };

  // Helper للـ CSS
  const getStatusClass = (status) => status.toLowerCase();

  return (
    <div className="meetings-viewport">
      <style>{schedulerStyles}</style>
      
      {/* --- Header & Top Actions --- */}
      <div className="page-header-row">
        <div>
          <p className="kicker">Supervisor / Meetings</p>
          <h1 className="page-title">Meetings Scheduler</h1>
        </div>
        <div className="header-actions">
          <button className="btn-outline" onClick={() => navigate('/supervisor/meeting-progress')}>
            📄 Meeting Progress Report
          </button>
          <button className="btn-outline" onClick={() => navigate('/supervisor/meeting-history')}>
            🕒 View Meetings History
          </button>
          <button className="btn-primary" onClick={() => navigate('/supervisor/new-meeting')}>
            + Schedule Meeting
          </button>
        </div>
      </div>

      {/* --- Upcoming Meetings Table --- */}
      <div className="table-card">
        <h3 className="card-title">Upcoming Meetings</h3>
        <table className="premium-table">
          <thead>
            <tr>
              <th>Date & Time</th>
              <th>Project</th>
              <th>Attendees</th>
              <th>Meeting Type</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {upcomingMeetings.map((meeting) => (
              <tr key={meeting.id}>
                
                <td className="date-time-cell">
                  <span className="date">{meeting.date}</span>
                  <span className="time">{meeting.time}</span>
                </td>
                
                {/* 💡 Clickable Project Link with Auto-Search */}
                <td className="project-name">
                  <span 
                    className="project-link-saas" 
                    onClick={() => handleProjectClick(meeting.project)}
                    title={`View ${meeting.project} Details`}
                  >
                    📁 {meeting.project}
                  </span>
                </td>
                
                {/* 💡 Stacked Avatars (Click to open Details Modal) */}
                <td>
                  <div 
                    className="avatar-group" 
                    onClick={() => setSelectedTeamDetails(meeting.attendees)}
                    title={`View ${meeting.attendees.name} Details`}
                  >
                    {meeting.attendees.members.slice(0,3).map((m, i) => (
                       <div key={i} className="avatar-circle" style={{background: m.color, zIndex: 10 - i}}>
                         {m.name.charAt(0)}
                       </div>
                    ))}
                    {meeting.attendees.members.length > 3 && (
                       <div className="avatar-circle avatar-more" style={{zIndex: 0}}>
                         +{meeting.attendees.members.length - 3}
                       </div>
                    )}
                  </div>
                </td>

                {/* Editable Meeting Type */}
                <td className="interactive-cell">
                  <div 
                    className="type-badge"
                    onClick={(e) => { e.stopPropagation(); setOpenTypeId(openTypeId === meeting.id ? null : meeting.id); setOpenStatusId(null); }}
                  >
                    {meeting.type} ▾
                  </div>
                  {openTypeId === meeting.id && (
                    <div className="action-dropdown">
                      <button className="dropdown-option" onClick={(e) => handleTypeChange(meeting.id, 'Review', e)}>🔍 Review</button>
                      <button className="dropdown-option" onClick={(e) => handleTypeChange(meeting.id, 'Check-in', e)}>🤝 Check-in</button>
                      <button className="dropdown-option" onClick={(e) => handleTypeChange(meeting.id, 'Milestone', e)}>🏁 Milestone</button>
                      <button className="dropdown-option" onClick={(e) => handleTypeChange(meeting.id, 'Urgent', e)}>⚠️ Urgent</button>
                    </div>
                  )}
                </td>

                {/* Editable Status */}
                <td className="interactive-cell">
                  <div 
                    className={`status-badge ${getStatusClass(meeting.status)}`}
                    onClick={(e) => { e.stopPropagation(); setOpenStatusId(openStatusId === meeting.id ? null : meeting.id); setOpenTypeId(null); }}
                  >
                    {meeting.status} ▾
                  </div>
                  {openStatusId === meeting.id && (
                    <div className="action-dropdown">
                      <button className="dropdown-option" onClick={(e) => handleStatusChange(meeting.id, 'Confirmed', e)}>🟢 Confirmed</button>
                      <button className="dropdown-option" onClick={(e) => handleStatusChange(meeting.id, 'Pending', e)}>🟡 Pending</button>
                      <button className="dropdown-option" onClick={(e) => handleStatusChange(meeting.id, 'Cancelled', e)}>🔴 Cancelled</button>
                      <button className="dropdown-option" onClick={(e) => handleStatusChange(meeting.id, 'Completed', e)}>✅ Completed</button>
                    </div>
                  )}
                </td>

              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* --- Past Meetings Table --- */}
      <div className="table-card">
        <h3 className="card-title">Past Meetings (Recent)</h3>
        <table className="premium-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Project</th>
              <th>Duration</th>
              <th>Key Notes</th>
            </tr>
          </thead>
          <tbody>
            {pastMeetings.map((meeting) => (
              <tr key={meeting.id}>
                <td style={{fontWeight: '800', color: '#0f172a'}}>{meeting.date}</td>
                
                {/* 💡 Clickable Project Link with Auto-Search in Past Meetings too */}
                <td className="project-name">
                  <span 
                    className="project-link-saas" 
                    onClick={() => handleProjectClick(meeting.project)}
                    title={`View ${meeting.project} Details`}
                  >
                    📁 {meeting.project}
                  </span>
                </td>

                <td style={{color: '#64748b', fontSize: '13px', fontWeight: '700'}}>{meeting.duration}</td>
                <td className="notes-cell">{meeting.notes}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 🚀 💡 NEW: TEAM DETAILS MODAL (بطاقة التيم الفخمة) */}
      {selectedTeamDetails && (
        <div className="modal-overlay" onClick={() => setSelectedTeamDetails(null)}>
          <div className="team-card-modal" onClick={e => e.stopPropagation()}>
             <div className="tc-header">
               <button className="tc-close" onClick={() => setSelectedTeamDetails(null)}>✕</button>
               <h2 style={{margin: '0 0 5px 0', fontSize: '24px', fontWeight: 900}}>{selectedTeamDetails.name}</h2>
               
               {/* 💡 Clickable Project Link Inside Modal */}
               <div
                 style={{display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '14px', color: '#cbd5e1', cursor: 'pointer', transition: '0.2s', fontWeight: 600}}
                 onClick={() => {
                   setSelectedTeamDetails(null);
                   navigate('/supervisor/projects', { state: { targetProject: selectedTeamDetails.project } });
                 }}
                 onMouseOver={(e) => e.currentTarget.style.color = 'white'}
                 onMouseOut={(e) => e.currentTarget.style.color = '#cbd5e1'}
                 title="View Project Details"
               >
                 📁 {selectedTeamDetails.project} <span style={{fontSize: '16px'}}>→</span>
               </div>
             </div>
             
             <div className="tc-body">
               <h3 style={{fontSize: '14px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 15px 0'}}>
                 Team Members ({selectedTeamDetails.members.length})
               </h3>
               
               {/* 💡 Clickable Student Rows */}
               {selectedTeamDetails.members.map((m, i) => (
                 <div
                   key={i}
                   className="tm-row"
                   onClick={() => {
                     setSelectedTeamDetails(null);
                     navigate('/supervisor/students', { state: { targetStudent: m.name } });
                   }}
                   title={`View ${m.name}'s Profile`}
                 >
                   <div className="tm-info">
                     <div className="tm-avatar" style={{background: m.color}}>{m.name.charAt(0)}</div>
                     <div>
                       <div style={{fontSize: '14px', fontWeight: 800, color: '#0f172a'}}>{m.name}</div>
                       <div style={{fontSize: '12px', fontWeight: 600, color: '#64748b'}}>{m.role}</div>
                     </div>
                   </div>
                   <div style={{color: '#94a3b8', fontWeight: 900}}>→</div>
                 </div>
               ))}
             </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default MeetingsScheduler;