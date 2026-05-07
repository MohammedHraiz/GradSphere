import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const styles = `
/* =========================================================
   MEETING HISTORY VIEW - PREMIUM SAAS EDITION
========================================================= */

.history-view-container {
  display: flex;
  flex-direction: column;
  gap: 30px;
  animation: fadeIn 0.4s ease-out;
  width: 100%;
  padding: 20px; /* 💡 Added subtle padding */
  box-sizing: border-box;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

/* --- Header Section --- */
.history-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  border-bottom: 1px solid #E2E8F0;
  padding-bottom: 20px;
  flex-wrap: wrap;
  gap: 20px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 15px;
}

.back-btn-saas {
  background: white;
  border: 1px solid #E2E8F0;
  color: #475569;
  width: 36px;
  height: 36px;
  border-radius: 8px;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  transition: 0.2s;
  font-size: 16px;
  box-shadow: 0 1px 2px rgba(0,0,0,0.05);
}

.back-btn-saas:hover {
  background: #F8FAFC;
  color: #0F172A;
  border-color: #CBD5E1;
  transform: translateX(-3px);
}

.header-text h1 {
  font-size: 24px;
  font-weight: 800;
  color: #0F172A;
  margin: 0 0 4px 0;
  letter-spacing: -0.5px;
}

.header-text p {
  font-size: 13px;
  color: #64748B;
  margin: 0;
}

.btn-outline-saas {
  background: white;
  border: 1px solid #E2E8F0;
  color: #0F172A;
  padding: 10px 18px;
  border-radius: 8px;
  font-weight: 600;
  font-size: 13px;
  cursor: pointer;
  transition: 0.2s;
  display: flex;
  align-items: center;
  gap: 8px;
  box-shadow: 0 1px 2px rgba(0,0,0,0.05);
}

.btn-outline-saas:hover {
  background: #F8FAFC;
  border-color: #CBD5E1;
  transform: translateY(-2px);
}

/* --- Filter Bar --- */
.history-filter-bar {
  display: flex;
  gap: 15px;
  background: white;
  padding: 15px;
  border-radius: 12px;
  border: 1px solid #E2E8F0;
  box-shadow: 0 1px 3px rgba(0,0,0,0.02);
  flex-wrap: wrap;
}

.search-box-history {
  flex: 1;
  min-width: 250px;
  display: flex;
  align-items: center;
  background: #F8FAFC;
  border: 1px solid #E2E8F0;
  border-radius: 8px;
  padding: 0 15px;
  transition: 0.2s;
  position: relative;
}

.search-box-history:focus-within {
  border-color: #4F46E5;
  background: white;
  box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.15);
}

.search-box-history span { color: #64748B; font-size: 14px; }
.search-box-history input {
  width: 100%; padding: 12px 10px; border: none; background: transparent; font-size: 13px; color: #0F172A; outline: none; font-family: inherit;
}

.saas-select-history {
  padding: 10px 15px; border: 1px solid #E2E8F0; border-radius: 8px; font-size: 13px; font-weight: 600; background-color: #FFFFFF; color: #0F172A; cursor: pointer; outline: none; transition: 0.2s; font-family: inherit;
}
.saas-select-history:hover, .saas-select-history:focus { border-color: #4F46E5; }

/* --- Timeline Layout --- */
.timeline-container {
  position: relative;
  padding-left: 30px;
  margin-top: 10px;
}

.timeline-container::before {
  content: '';
  position: absolute;
  top: 0; left: 15px;
  height: 100%; width: 2px;
  background: #E2E8F0;
  border-radius: 2px;
}

/* --- Timeline Card --- */
.timeline-item {
  position: relative;
  margin-bottom: 30px;
}

.timeline-dot {
  position: absolute;
  left: -30px;
  top: 20px;
  width: 12px; height: 12px;
  border-radius: 50%;
  background: white;
  border: 3px solid #4F46E5;
  transform: translateX(-50%);
  z-index: 2;
}

.timeline-card {
  background: white;
  border: 1px solid #E2E8F0;
  border-radius: 12px;
  padding: 20px 25px;
  box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);
  transition: 0.2s;
  margin-left: 20px;
}

.timeline-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 15px -3px rgba(0,0,0,0.08);
  border-color: #CBD5E1;
}

.card-top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 15px;
  border-bottom: 1px dashed #E2E8F0;
  padding-bottom: 15px;
}

.meeting-date {
  font-size: 16px;
  font-weight: 800;
  color: #0F172A;
  display: flex;
  align-items: center;
  gap: 8px;
}
.meeting-date span { font-size: 12px; font-weight: 600; color: #64748B; background: #F1F5F9; padding: 2px 8px; border-radius: 6px; }

.meeting-project {
  font-size: 13px;
  font-weight: 700;
  color: #4F46E5;
  background: #EEF2FF;
  padding: 6px 12px;
  border-radius: 6px;
  cursor: pointer;
  transition: 0.2s;
  border: 1px solid transparent;
}
.meeting-project:hover {
  background: #E0E7FF;
  border-color: #C7D2FE;
  transform: translateY(-2px);
}

.card-body {
  display: grid;
  grid-template-columns: 1fr;
  gap: 15px;
}

@media (min-width: 768px) {
  .card-body { grid-template-columns: 2fr 1fr; }
}

.info-block h4 {
  font-size: 11px;
  font-weight: 800;
  color: #64748B;
  text-transform: uppercase;
  margin: 0 0 8px 0;
  letter-spacing: 0.5px;
}

.info-block p {
  font-size: 14px;
  color: #1E293B;
  margin: 0;
  line-height: 1.5;
  font-weight: 500;
}

.assessment-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 50px;
  font-size: 12px;
  font-weight: 700;
}
.assessment-badge.excellent { background: #DCFCE7; color: #15803D; border: 1px solid #BBF7D0;}
.assessment-badge.good { background: #FEF3C7; color: #B45309; border: 1px solid #FDE68A;}
.assessment-badge.poor { background: #FEE2E2; color: #B91C1C; border: 1px solid #FECACA;}

.card-footer {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.btn-view-details {
  background: transparent;
  border: none;
  color: #4F46E5;
  font-size: 13px;
  font-weight: 800;
  cursor: pointer;
  transition: 0.2s;
  padding: 6px 12px;
  border-radius: 6px;
}
.btn-view-details:hover { background: #EEF2FF; color: #3730A3; }

/* 💡 Print Styles for Export to PDF */
@media print {
  .history-filter-bar, .header-actions, .back-btn-saas, .card-footer { display: none !important; }
  .history-view-container { animation: none; padding: 0; }
  .timeline-container::before { background: #cbd5e1; }
  .timeline-dot { border-color: #0f172a; }
  .timeline-card { border: 1px solid #cbd5e1; box-shadow: none; break-inside: avoid; margin-bottom: 20px;}
  .meeting-project { border: 1px solid #4F46E5; background: transparent;}
}
`;

const MeetingHistoryView = () => {
  const navigate = useNavigate();

  // 💡 حالات البحث والفلترة
  const [searchTerm, setSearchTerm] = useState('');
  const [filterProject, setFilterProject] = useState('All Projects');
  const [filterSort, setFilterSort] = useState('Newest First');

  // بيانات وهمية لسجل الاجتماعات
  const historyData = [
    { 
      id: 1, 
      date: 'Mar 10, 2026', 
      time: '10:00 AM - 11:00 AM',
      project: 'Smart Campus (Team Alpha)', 
      discussion: 'Reviewed UI mockups for the dashboard. Discussed the ER diagram and approved the database schema. Addressed minor concerns regarding the API response time.',
      tasks: '1. Finalize DB deployment\n2. Start Frontend integration.',
      assessment: 'excellent'
    },
    { 
      id: 2, 
      date: 'Mar 08, 2026', 
      time: '02:00 PM - 02:30 PM',
      project: 'AI Academic Advisor (Team Beta)', 
      discussion: 'Discussed NLP model constraints and dataset sourcing. Team is slightly behind schedule on data cleaning.',
      tasks: 'Clean dataset and provide initial accuracy report by next week.',
      assessment: 'good'
    },
    { 
      id: 3, 
      date: 'Mar 01, 2026', 
      time: '11:00 AM - 12:00 PM',
      project: 'IoT System (Team Gamma)', 
      discussion: 'Hardware components arrived. Initial testing showed some sensor failures. Need to order replacements urgently to avoid massive delays.',
      tasks: 'Contact supplier for replacements. Prepare testing environment.',
      assessment: 'poor'
    }
  ];

  // 💡 تطبيق الفلترة والبحث والترتيب بذكاء
  let processedData = historyData.filter(meeting => {
    const searchLower = searchTerm.toLowerCase();
    const matchSearch = meeting.project.toLowerCase().includes(searchLower) || 
                        meeting.discussion.toLowerCase().includes(searchLower) ||
                        meeting.date.toLowerCase().includes(searchLower);
    
    // استخراج اسم المشروع الأساسي للفلترة (مثلاً: "Smart Campus" من "Smart Campus (Team Alpha)")
    const baseProject = meeting.project.split(' (')[0];
    const matchProject = filterProject === 'All Projects' || baseProject === filterProject;

    return matchSearch && matchProject;
  });

  // ترتيب البيانات
  processedData.sort((a, b) => {
    const dateA = new Date(a.date).getTime();
    const dateB = new Date(b.date).getTime();
    return filterSort === 'Newest First' ? dateB - dateA : dateA - dateB;
  });

  // 💡 دالة لفتح مشروع معين (مع فصل الاسم عن القوس)
  const handleProjectClick = (fullProjectName) => {
    const baseName = fullProjectName.split(' (')[0]; // أخذ اسم المشروع بدون اسم الفريق
    navigate('/supervisor/projects', { state: { targetProject: baseName } });
  };

  // 💡 دالة طباعة الـ PDF (تستدعي نافذة النظام)
  const handleExportPDF = () => {
    window.print();
  };

  return (
    <>
      <style>{styles}</style>
      <div className="history-view-container">
        
        {/* --- 1. Header --- */}
        <div className="history-header">
          <div className="header-left">
            <button className="back-btn-saas" onClick={() => navigate('/supervisor/meetings')} title="Back to Scheduler">
              ←
            </button>
            <div className="header-text">
              <h1>Meeting History Log</h1>
              <p>Chronological record of all past project meetings</p>
            </div>
          </div>
          <div className="header-actions">
            {/* 💡 زر التصدير يعمل الآن! */}
            <button className="btn-outline-saas" onClick={handleExportPDF}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
              Export to PDF
            </button>
          </div>
        </div>

        {/* --- 2. Filter Bar --- */}
        <div className="history-filter-bar">
          <div className="search-box-history">
            <span>🔍</span>
            <input 
              type="text" 
              placeholder="Search by keyword, project, or date..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && <button onClick={() => setSearchTerm('')} style={{position:'absolute', right:'10px', background:'none', border:'none', color:'#EF4444', fontWeight: '800', cursor:'pointer'}}>✕</button>}
          </div>
          
          <select className="saas-select-history" value={filterProject} onChange={(e) => setFilterProject(e.target.value)}>
            <option value="All Projects">All Projects</option>
            <option value="Smart Campus">Smart Campus</option>
            <option value="AI Academic Advisor">AI Academic Advisor</option>
            <option value="IoT System">IoT System</option>
          </select>
          
          <select className="saas-select-history" value={filterSort} onChange={(e) => setFilterSort(e.target.value)}>
            <option value="Newest First">Sort: Newest First</option>
            <option value="Oldest First">Sort: Oldest First</option>
          </select>
        </div>

        {/* --- 3. Timeline --- */}
        <div className="timeline-container">
          {processedData.length === 0 ? (
             <div style={{padding: '30px', textAlign: 'center', color: '#64748B', fontWeight: 600}}>No meeting records found.</div>
          ) : (
            processedData.map((meeting) => (
              <div className="timeline-item" key={meeting.id}>
                <div className="timeline-dot"></div>
                <div className="timeline-card">
                  
                  <div className="card-top">
                    <div className="meeting-date">
                      📅 {meeting.date} <span>{meeting.time}</span>
                    </div>
                    {/* 💡 اسم المشروع أصبح Clickable ويوجه للـ Auto-Search */}
                    <div 
                      className="meeting-project" 
                      onClick={() => handleProjectClick(meeting.project)}
                      title="View Project in Directory"
                    >
                      {meeting.project} ↗
                    </div>
                  </div>

                  <div className="card-body">
                    <div className="body-left">
                      <div className="info-block" style={{marginBottom: '15px'}}>
                        <h4>Discussion & Outcomes</h4>
                        <p>{meeting.discussion}</p>
                      </div>
                      <div className="info-block">
                        <h4>Assigned Tasks</h4>
                        <p style={{whiteSpace: 'pre-line'}}>{meeting.tasks}</p>
                      </div>
                    </div>
                    
                    <div className="body-right">
                      <div className="info-block">
                        <h4>Supervisor Assessment</h4>
                        <span className={`assessment-badge ${meeting.assessment}`}>
                          {meeting.assessment === 'excellent' && '🟢 Excellent Progress'}
                          {meeting.assessment === 'good' && '🟡 Satisfactory'}
                          {meeting.assessment === 'poor' && '🔴 Cause for Concern'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="card-footer">
                    {/* 💡 يوجهك لصفحة التقرير الفخمة التي قمنا ببنائها سابقاً */}
                    <button className="btn-view-details" onClick={() => navigate('/supervisor/meeting-progress')}>
                      View Full Report →
                    </button>
                  </div>

                </div>
              </div>
            ))
          )}
        </div>

      </div>
    </>
  );
};

export default MeetingHistoryView;