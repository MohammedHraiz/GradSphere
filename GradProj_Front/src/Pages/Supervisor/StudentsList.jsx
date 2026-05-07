import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

// تجميع التنسيقات هنا لحل مشكلة استيراد الملفات الخارجية وضمان عمل الكود
const styles = `
.students-container {
  display: flex;
  flex-direction: column;
  gap: 30px;
  animation: fadeIn 0.4s ease-out;
  width: 100%;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.students-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  border-bottom: 1px solid #E2E8F0;
  padding-bottom: 20px;
  flex-wrap: wrap;
  gap: 20px;
}

.breadcrumb-text {
  font-size: 13px;
  font-weight: 700;
  color: #4F46E5;
  text-transform: uppercase;
  letter-spacing: 1px;
  margin: 0 0 5px 0;
}

.page-title {
  font-size: 28px;
  font-weight: 800;
  color: #0F172A;
  margin: 0;
  letter-spacing: -0.5px;
}

.btn-message-all {
  background: #4F46E5;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 10px;
  font-weight: 700;
  cursor: pointer;
  transition: 0.3s;
  display: flex;
  align-items: center;
  gap: 10px;
  box-shadow: 0 4px 6px -1px rgba(79, 70, 229, 0.2);
}

.btn-message-all:hover {
  background: #4338CA;
  transform: translateY(-2px);
}

.filter-bar-saas {
  display: flex;
  gap: 20px;
  background: white;
  padding: 15px;
  border-radius: 12px;
  border: 1px solid #E2E8F0;
  flex-wrap: wrap;
}

.search-wrapper {
  flex: 1;
  min-width: 280px;
  display: flex;
  align-items: center;
  background: #F8FAFC;
  border: 1px solid #E2E8F0;
  border-radius: 8px;
  padding: 0 15px;
  position: relative;
}

.search-wrapper input {
  width: 100%; 
  padding: 12px 10px; 
  border: none; 
  background: transparent; 
  outline: none; 
  font-size: 14px;
}

.saas-select {
  padding: 10px 15px; 
  border: 1px solid #E2E8F0; 
  border-radius: 8px; 
  background: white; 
  font-weight: 600; 
  color: #475569;
}

.students-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 25px;
}

.student-card-saas {
  background: white;
  border: 1px solid #E2E8F0;
  border-radius: 16px;
  padding: 24px;
  transition: 0.3s;
  box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);
}

.student-card-saas:hover {
  transform: translateY(-5px);
  box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1);
}

.card-header {
  display: flex;
  align-items: center;
  gap: 15px;
  margin-bottom: 20px;
}

.avatar-large {
  width: 50px; 
  height: 50px;
  border-radius: 12px;
  color: white;
  font-size: 20px;
  font-weight: 800;
  display: flex; 
  align-items: center; 
  justify-content: center;
  position: relative;
}

.online-indicator {
  position: absolute; 
  bottom: -2px; 
  right: -2px;
  width: 12px; 
  height: 12px;
  background: #10B981;
  border: 2px solid white;
  border-radius: 50%;
}

.student-info h3 { 
  margin: 0; 
  font-size: 16px; 
  font-weight: 800; 
  color: #0F172A; 
}

.student-id { 
  font-size: 12px; 
  color: #64748B; 
  font-weight: 600; 
}

.project-tag-box { 
  margin-bottom: 20px; 
}

/* 💡 تعديل كبسة المشروع عشان تصير قابلة للضغط (Clickable) */
.project-tag {
  background: #EEF2FF;
  color: #4F46E5;
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer; 
  transition: 0.2s;
  display: inline-block;
}
.project-tag:hover {
  background: #C7D2FE;
  transform: translateY(-1px);
}

.progress-section { 
  margin-bottom: 25px; 
}

.progress-labels {
  display: flex; 
  justify-content: space-between; 
  font-size: 12px; 
  font-weight: 700; 
  color: #64748B; 
  margin-bottom: 8px;
}

.saas-progress-bar {
  height: 8px; 
  background: #F1F5F9; 
  border-radius: 10px; 
  overflow: hidden;
}

.progress-fill { 
  height: 100%; 
  border-radius: 10px; 
  transition: 1s cubic-bezier(0.4, 0, 0.2, 1); 
}

.card-actions {
  display: flex; 
  gap: 12px;
}

.card-actions button {
  flex: 1; 
  padding: 10px; 
  border-radius: 8px; 
  font-weight: 700; 
  font-size: 13px; 
  cursor: pointer; 
  transition: 0.2s;
}

.btn-secondary-saas { 
  background: white; 
  border: 1px solid #E2E8F0; 
  color: #475569; 
}

.btn-secondary-saas:hover { 
  background: #F8FAFC; 
  border-color: #CBD5E1; 
}

.btn-primary-saas { 
  background: #EEF2FF; 
  border: 1px solid #C7D2FE; 
  color: #4F46E5; 
}

.btn-primary-saas:hover { 
  background: #4F46E5; 
  color: white; 
  border-color: #4F46E5; 
}

.modal-overlay {
  position: fixed; 
  top: 0; 
  left: 0; 
  width: 100%; 
  height: 100%;
  background: rgba(15, 23, 42, 0.6); 
  display: flex; 
  justify-content: center; 
  align-items: center;
  z-index: 9999; 
  backdrop-filter: blur(4px);
}

.message-modal {
  background: white; 
  width: 90%; 
  max-width: 500px; 
  padding: 30px; 
  border-radius: 16px;
  box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25);
  animation: modalIn 0.3s ease-out;
}

@keyframes modalIn { 
  from { opacity: 0; transform: scale(0.95); } 
  to { opacity: 1; transform: scale(1); } 
}

.modal-header-saas {
  display: flex; 
  justify-content: space-between; 
  align-items: center; 
  margin-bottom: 25px;
}

.modal-header-saas h2 { 
  font-size: 18px; 
  font-weight: 800; 
  color: #0F172A; 
  margin: 0; 
}

.close-btn { 
  background: none; 
  border: none; 
  font-size: 24px; 
  cursor: pointer; 
  color: #64748B; 
  transition: 0.2s;
}
.close-btn:hover { color: #EF4444; }

.form-group { 
  margin-bottom: 20px; 
  display: flex; 
  flex-direction: column; 
  gap: 8px; 
}

.form-group label { 
  font-size: 12px; 
  font-weight: 700; 
  color: #475569; 
  text-transform: uppercase; 
}

.form-group input, .form-group textarea {
  padding: 12px; 
  border: 1px solid #E2E8F0; 
  border-radius: 8px; 
  background: #F8FAFC; 
  font-family: inherit; 
  font-size: 14px;
}

.modal-footer-saas {
  display: flex; 
  justify-content: flex-end; 
  gap: 12px; 
  margin-top: 25px;
}

.btn-cancel { 
  background: #F1F5F9; 
  border: none; 
  padding: 10px 20px; 
  border-radius: 8px; 
  font-weight: 700; 
  cursor: pointer; 
}

.btn-send { 
  background: #4F46E5; 
  color: white; 
  border: none; 
  padding: 10px 25px; 
  border-radius: 8px; 
  font-weight: 700; 
  cursor: pointer; 
}

/* 💡 ستايلات إضافة Profile Modal الفخمة */
.profile-modal-container { background: white; width: 90%; max-width: 450px; border-radius: 20px; overflow: hidden; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25); animation: modalIn 0.3s ease-out; }
.profile-header-bg { height: 120px; position: relative; }
.profile-avatar-wrapper { position: absolute; bottom: -40px; left: 30px; width: 80px; height: 80px; border-radius: 20px; border: 4px solid white; display: flex; align-items: center; justify-content: center; font-size: 32px; font-weight: 900; color: white; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1);}
.profile-close-btn { position: absolute; top: 15px; right: 15px; background: rgba(255,255,255,0.2); border: none; color: white; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: 0.2s; font-size: 20px;}
.profile-close-btn:hover { background: rgba(255,255,255,0.4); transform: scale(1.1);}
.profile-body { padding: 50px 30px 30px 30px; }
.profile-name { font-size: 24px; font-weight: 900; color: #0F172A; margin: 0 0 5px 0;}
.profile-role { font-size: 14px; color: #4F46E5; font-weight: 800; margin: 0 0 20px 0; background: #EEF2FF; display: inline-block; padding: 4px 10px; border-radius: 6px;}
.profile-details-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 25px;}
.profile-detail-item { background: #F8FAFC; padding: 15px; border-radius: 12px; border: 1px solid #E2E8F0;}
.detail-label { font-size: 11px; font-weight: 800; color: #64748B; text-transform: uppercase; margin-bottom: 5px; display: block; letter-spacing: 0.5px;}
.detail-val { font-size: 13px; font-weight: 800; color: #0F172A; }
.profile-skills-title { font-size: 13px; font-weight: 800; color: #334155; margin-bottom: 10px;}
.profile-skills { display: flex; flex-wrap: wrap; gap: 8px;}
.skill-badge { background: white; color: #475569; padding: 6px 12px; border-radius: 8px; font-size: 12px; font-weight: 700; border: 1px solid #CBD5E1;}
`;

const StudentsList = ({ onMessageClick }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterProject, setFilterProject] = useState('All Projects');
  
  // حالات التحكم بنوافذ الرسائل والبروفايل
  const [showMsgModal, setShowMsgModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null); 
  const [showProfileModal, setShowProfileModal] = useState(false); // 💡 حالة البروفايل

  // 💡 ضفنا شوية بيانات إضافية للطلاب عشان البروفايل يكون مليان
  const students = [
    { id: '320190111', name: 'Ali Mansour', role: 'Team Leader', email: 'ali@std.uni.edu', phone: '+962 79 123 4567', project: 'Smart University Campus', progress: 80, tasks: '8/10', color: '#4F46E5', skills: ['React', 'Node.js', 'Leadership'] },
    { id: '320190112', name: 'Sara Ahmed', role: 'Backend Developer', email: 'sara@std.uni.edu', phone: '+962 79 987 6543', project: 'Smart University Campus', progress: 90, tasks: '9/10', color: '#9333EA', skills: ['Python', 'Django', 'PostgreSQL'] },
    { id: '320190113', name: 'Omar Khalid', role: 'AI Researcher', email: 'omar@std.uni.edu', phone: '+962 78 555 1234', project: 'AI Academic Advisor', progress: 40, tasks: '4/10', color: '#0EA5E9', skills: ['TensorFlow', 'Data Mining', 'Python'] },
    { id: '320190114', name: 'Laila Hassan', role: 'Blockchain Dev', email: 'laila@std.uni.edu', phone: '+962 77 444 9999', project: 'Blockchain Voting System', progress: 90, tasks: '9/10', color: '#10B981', skills: ['Solidity', 'Smart Contracts', 'Web3'] },
  ];

  // 💡 قراءة البحث التلقائي من الصفحة السابقة
  useEffect(() => {
    if (location.state && location.state.targetStudent) {
      setSearchTerm(location.state.targetStudent);
    }
  }, [location]);

  // دالة لفتح الشات لطالب معين (توجيه لمكون الشات)
  const openSingleMessage = (student) => {
    if(onMessageClick) {
      onMessageClick(student.name);
    } else {
      setSelectedStudent(student);
      setShowMsgModal(true);
    }
  };

  // دالة لفتح نافذة مراسلة الجميع
  const openMessageAll = () => {
    setSelectedStudent(null);
    setShowMsgModal(true);
  };

  // 💡 دالة لفتح بروفايل الطالب
  const openProfile = (student) => {
    setSelectedStudent(student);
    setShowProfileModal(true);
  };

  // 💡 الفلترة المزدوجة (البحث + تصنيف المشروع) شغالة 100%
  const filteredStudents = students.filter((student) => {
    const matchSearch = student.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                        student.id.includes(searchTerm) || 
                        student.project.toLowerCase().includes(searchTerm.toLowerCase());
    const matchProject = filterProject === 'All Projects' || student.project === filterProject;
    return matchSearch && matchProject;
  });

  return (
    <div className="students-container">
      <style>{styles}</style>
      
      {/* --- Header Area --- */}
      <div className="students-header">
        <div className="header-left">
          <p className="breadcrumb-text">Supervisor / Directory</p>
          <h1 className="page-title">My Students</h1>
        </div>
        <button className="btn-message-all" onClick={openMessageAll}>
          <span className="icon">✉️</span> Message All
        </button>
      </div>

      {/* --- Filter Bar --- */}
      <div className="filter-bar-saas">
        <div className="search-wrapper">
          <span className="search-icon">🔍</span>
          <input 
            type="text" 
            placeholder="Search by student name, ID, or project..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && <button onClick={() => setSearchTerm('')} style={{position:'absolute', right:'15px', background:'none', border:'none', color:'#ef4444', fontWeight:800, cursor:'pointer'}}>✕ Clear</button>}
        </div>
        <select 
          className="saas-select"
          value={filterProject}
          onChange={(e) => setFilterProject(e.target.value)}
        >
          <option>All Projects</option>
          <option>Smart University Campus</option>
          <option>AI Academic Advisor</option>
          <option>Blockchain Voting System</option>
        </select>
      </div>

      {/* --- Students Grid --- */}
      <div className="students-grid">
        {filteredStudents.map((student) => (
          <div className="student-card-saas" key={student.id}>
            <div className="card-header">
              <div className="avatar-large" style={{ background: student.color }}>
                {student.name.charAt(0)}
                <span className="online-indicator"></span>
              </div>
              <div className="student-info">
                <h3>{student.name}</h3>
                <span className="student-id">{student.id}</span>
              </div>
            </div>
            
            <div className="project-tag-box">
              {/* 💡 كبسة المشروع بتودي لصفحة Projects مع فلترة تلقائية */}
              <span 
                className="project-tag"
                onClick={() => navigate('/supervisor/projects', { state: { targetProject: student.project } })}
                title="Click to view project details"
              >
                {student.project}
              </span>
            </div>

            <div className="progress-section">
              <div className="progress-labels">
                <span>Task Progress</span>
                <span>{student.progress}% ({student.tasks})</span>
              </div>
              <div className="saas-progress-bar">
                <div className="progress-fill" style={{ width: `${student.progress}%`, background: student.color }}></div>
              </div>
            </div>

            <div className="card-actions">
              {/* 💡 كبسة عرض البروفايل */}
              <button className="btn-secondary-saas" onClick={() => openProfile(student)}>View Profile</button>
              <button className="btn-primary-saas" onClick={() => openSingleMessage(student)}>Message</button>
            </div>
          </div>
        ))}
      </div>

      {/* --- View Profile Modal (البطاقة الفخمة) --- */}
      {showProfileModal && selectedStudent && (
        <div className="modal-overlay" onClick={() => setShowProfileModal(false)}>
          <div className="profile-modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="profile-header-bg" style={{ background: `linear-gradient(135deg, ${selectedStudent.color}, #1E293B)` }}>
              <button className="profile-close-btn" onClick={() => setShowProfileModal(false)}>×</button>
              <div className="profile-avatar-wrapper" style={{ background: selectedStudent.color }}>
                {selectedStudent.name.charAt(0)}
              </div>
            </div>
            <div className="profile-body">
              <h2 className="profile-name">{selectedStudent.name}</h2>
              <p className="profile-role">{selectedStudent.role}</p>
              
              <div className="profile-details-grid">
                <div className="profile-detail-item">
                  <span className="detail-label">Student ID</span>
                  <span className="detail-val">{selectedStudent.id}</span>
                </div>
                <div className="profile-detail-item">
                  <span className="detail-label">Progress</span>
                  <span className="detail-val" style={{color: selectedStudent.color}}>{selectedStudent.progress}%</span>
                </div>
                <div className="profile-detail-item">
                  <span className="detail-label">Email Address</span>
                  <span className="detail-val" style={{fontSize: '11px'}}>{selectedStudent.email}</span>
                </div>
                <div className="profile-detail-item">
                  <span className="detail-label">Phone Number</span>
                  <span className="detail-val">{selectedStudent.phone}</span>
                </div>
              </div>

              <h4 className="profile-skills-title">Key Skills & Tools</h4>
              <div className="profile-skills">
                {selectedStudent.skills.map((skill, idx) => (
                  <span key={idx} className="skill-badge">{skill}</span>
                ))}
              </div>

              <button 
                className="btn-submit" 
                style={{marginTop: '25px', background: selectedStudent.color}}
                onClick={() => { setShowProfileModal(false); openSingleMessage(selectedStudent); }}
              >
                Send Direct Message
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- Message Modal (للمراسلة الجماعية) --- */}
      {showMsgModal && !selectedStudent && (
        <div className="modal-overlay">
          <div className="message-modal">
            <div className="modal-header-saas">
              <h2>Message All Students</h2>
              <button className="close-btn" onClick={() => setShowMsgModal(false)}>&times;</button>
            </div>
            
            <form className="message-form" onSubmit={(e) => { e.preventDefault(); alert('Message Sent Successfully!'); setShowMsgModal(false); }}>
              <div className="form-group">
                <label>Subject</label>
                <input type="text" placeholder="Announcement to all teams..." required />
              </div>
              
              <div className="form-group">
                <label>Message Content</label>
                <textarea rows="5" placeholder="Write your message here..." required></textarea>
              </div>

              <div className="modal-footer-saas">
                <button type="button" className="btn-cancel" onClick={() => setShowMsgModal(false)}>Cancel</button>
                <button type="submit" className="btn-send">🚀 Send Message</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default StudentsList;