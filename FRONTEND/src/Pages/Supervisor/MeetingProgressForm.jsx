import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import StyledSelect from '../../components/StyledSelect';

const formStyles = `
  .progress-form-container { 
    max-width: 850px; 
    margin: 0 auto; 
    background: white; 
    padding: 40px; 
    border-radius: 24px; 
    box-shadow: 0 20px 40px -10px rgba(0,0,0,0.08); 
    font-family: 'Plus Jakarta Sans', sans-serif; 
    text-align: left; 
    animation: slideUp 0.4s ease;
    border: 1px solid #e2e8f0;
  }
  @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }

  .pf-header-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;}
  .btn-back { background: white; border: 1px solid #e2e8f0; padding: 10px 20px; border-radius: 12px; font-weight: 800; color: #475569; cursor: pointer; transition: 0.2s; display: flex; align-items: center; gap: 8px;}
  .btn-back:hover { background: #f8fafc; color: #0f172a; transform: translateX(-4px);}

  /* 💡 University Official Header */
  .uni-header { text-align: center; border-bottom: 2px solid #0f172a; padding-bottom: 25px; margin-bottom: 30px; position: relative;}
  .uni-logo-placeholder { width: 60px; height: 60px; background: #f1f5f9; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 15px auto; border: 2px solid #e2e8f0; color: #4f46e5; font-weight: 900;}
  .uni-title { font-size: 16px; font-weight: 900; color: #0f172a; margin: 0 0 5px 0;}
  .faculty-title { font-size: 13px; color: #475569; font-weight: 700; margin: 0 0 15px 0;}
  .form-official-title { font-size: 20px; font-weight: 900; color: #4f46e5; text-transform: uppercase; letter-spacing: 1px; margin: 0;}

  /* Form Elements */
  .pf-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 25px; }
  .pf-group { display: flex; flex-direction: column; gap: 8px; }
  .pf-label { font-size: 12px; font-weight: 800; color: #334155; text-transform: uppercase; letter-spacing: 0.5px;}
  .pf-input { padding: 14px 16px; border: 1px solid #cbd5e1; border-radius: 12px; font-size: 14px; font-family: inherit; font-weight: 600; outline: none; transition: 0.2s; background: #f8fafc; color: #0f172a;}
  .pf-input:focus { border-color: #4f46e5; box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1); background: white;}
  .pf-textarea { padding: 16px; border: 1px solid #cbd5e1; border-radius: 12px; font-size: 14px; font-family: inherit; outline: none; min-height: 120px; resize: vertical; background: #f8fafc; font-weight: 500; color: #0f172a;}
  .pf-textarea:focus { border-color: #4f46e5; background: white;}

  /* 💡 Automated Attendance Table */
  .attendance-section { margin-bottom: 30px; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.02);}
  .attendance-table { width: 100%; border-collapse: collapse; text-align: left; }
  .attendance-table th { background: #0f172a; color: white; padding: 12px 15px; font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px;}
  .attendance-table td { padding: 12px 15px; border-bottom: 1px solid #f1f5f9; font-size: 14px; font-weight: 600; color: #1e293b; background: white;}
  .attendance-table tr:last-child td { border-bottom: none; }
  
  /* 💡 Student Link (Auto Search) */
  .student-link { color: #4f46e5; cursor: pointer; font-weight: 800; transition: 0.2s; display: inline-flex; align-items: center; gap: 4px; padding: 4px 8px; border-radius: 6px; margin-left: -8px;}
  .student-link:hover { background: #e0e7ff; color: #3730a3; }

  .attend-toggles { display: flex; gap: 10px; }
  .toggle-btn { padding: 6px 12px; border-radius: 8px; font-size: 12px; font-weight: 800; border: 1px solid transparent; cursor: pointer; transition: 0.2s; background: #f1f5f9; color: #64748b;}
  .toggle-btn.present.active { background: #d1fae5; color: #059669; border-color: #a7f3d0; box-shadow: 0 2px 4px rgba(5,150,105,0.1);}
  .toggle-btn.absent.active { background: #fee2e2; color: #ef4444; border-color: #fecaca; box-shadow: 0 2px 4px rgba(239,68,68,0.1);}

  /* 💡 Save Attendance Button */
  .attendance-footer { background: #f8fafc; padding: 12px 15px; border-top: 1px solid #f1f5f9; display: flex; justify-content: flex-end; }
  .btn-save-attendance { background: white; border: 1px solid #cbd5e1; color: #0f172a; padding: 8px 16px; border-radius: 8px; font-weight: 800; font-size: 12px; cursor: pointer; transition: 0.2s; box-shadow: 0 1px 2px rgba(0,0,0,0.05);}
  .btn-save-attendance:hover { background: #f1f5f9; border-color: #94a3b8; }

  /* Assessment Section */
  .pf-status-box { background: #f8fafc; padding: 25px; border-radius: 16px; border: 1px solid #e2e8f0; margin-bottom: 30px;}
  .radio-group { display: flex; flex-wrap: wrap; gap: 15px; margin-top: 15px;}
  .radio-label { display: flex; align-items: center; gap: 8px; font-size: 13px; font-weight: 800; color: #334155; cursor: pointer; background: white; padding: 12px 16px; border-radius: 12px; border: 1px solid #cbd5e1; transition: 0.2s;}
  .radio-label:hover { border-color: #94a3b8; transform: translateY(-2px);}
  .radio-label input[type="radio"] { accent-color: #4f46e5; width: 16px; height: 16px;}
  .radio-label.selected { border-color: #4f46e5; background: #eef2ff; color: #4f46e5; box-shadow: 0 4px 6px rgba(79,70,229,0.1);}

  .warning-box { background: #fef2f2; border: 1px solid #fecaca; padding: 20px; border-radius: 12px; margin-top: 20px; animation: slideDown 0.3s ease;}
  @keyframes slideDown { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }

  /* 💡 Schedule Next Meeting Button */
  .btn-schedule-next { background: white; border: 2px solid #e2e8f0; color: #4f46e5; padding: 12px 16px; border-radius: 12px; font-size: 14px; font-weight: 800; cursor: pointer; width: 100%; transition: 0.2s; display: flex; justify-content: center; align-items: center; gap: 8px;}
  .btn-schedule-next:hover { background: #f8fafc; border-color: #cbd5e1; color: #3730a3; }

  /* 💡 Action Buttons Row */
  .form-actions-row { display: flex; gap: 15px; margin-top: 30px; }
  .btn-export-pdf { background: #ef4444; color: white; border: none; padding: 16px 24px; border-radius: 12px; font-size: 14px; font-weight: 800; cursor: pointer; transition: 0.2s; display: flex; align-items: center; gap: 8px; box-shadow: 0 4px 10px rgba(239,68,68,0.2);}
  .btn-export-pdf:hover { background: #dc2626; transform: translateY(-2px); box-shadow: 0 6px 15px rgba(239,68,68,0.3);}
  
  .btn-submit { background: #4f46e5; color: white; border: none; padding: 16px 24px; border-radius: 12px; font-size: 15px; font-weight: 900; cursor: pointer; flex: 1; transition: 0.2s; box-shadow: 0 4px 12px rgba(79, 70, 229, 0.25); display: flex; justify-content: center; align-items: center; gap: 10px;}
  .btn-submit:hover { background: #4338ca; transform: translateY(-2px); box-shadow: 0 8px 20px rgba(79, 70, 229, 0.3);}

  /* 💡 Print Styles (SaaS Magic) */
  @media print {
    body * { visibility: hidden; }
    .progress-form-container, .progress-form-container * { visibility: visible; }
    .progress-form-container { position: absolute; left: 0; top: 0; box-shadow: none; border: none; padding: 0; margin: 0; width: 100%; }
    .pf-header-top, .form-actions-row, .btn-save-attendance, .btn-schedule-next, .attend-toggles { display: none !important; }
    .attendance-table th, .attendance-table td { border: 1px solid #000; }
    .pf-input, .pf-textarea { border: 1px solid #000; background: white; }
    .radio-label { border: 1px solid #000; }
    .radio-label.selected { background: #e2e8f0 !important; color: #000 !important; -webkit-print-color-adjust: exact; }
    .student-link { color: #000; text-decoration: none; }
  }
`;

const MeetingProgressForm = () => {
  const navigate = useNavigate();

  // 💡 قاعدة بيانات وهمية للمشاريع وطلابها (Automated Data)
  const projectsData = {
    'PRJ-101': {
      name: 'Smart Campus',
      students: [
        { id: '320190111', name: 'Ali Mansour' },
        { id: '320190112', name: 'Sara Ahmed' },
        { id: '320190113', name: 'Omar Zaid' }
      ]
    },
    'PRJ-102': {
      name: 'AI Academic Advisor',
      students: [
        { id: '320190222', name: 'Mona Rami' },
        { id: '320190223', name: 'Ahmad Omar' }
      ]
    }
  };

  const [selectedProject, setSelectedProject] = useState('');
  const [attendance, setAttendance] = useState({});
  const [assessment, setAssessment] = useState('');

  // دالة لتحديث الحضور والغياب
  const handleAttendance = (studentId, status) => {
    setAttendance(prev => ({ ...prev, [studentId]: status }));
  };

  // عندما يتغير المشروع، نقوم بتفريغ الحضور القديم
  const handleProjectChange = (e) => {
    setSelectedProject(e.target.value);
    setAttendance({});
  };

  const currentStudents = selectedProject ? projectsData[selectedProject].students : [];

  return (
    <div style={{ padding: '30px', animation: 'fadeInPage 0.4s ease' }}>
      <style>{formStyles}</style>
      <div className="progress-form-container">
        
        <div className="pf-header-top">
          <button className="btn-back" onClick={() => navigate(-1)}>
            <span>←</span> Back to Scheduler
          </button>
        </div>

        {/* الترويسة الرسمية للجامعة */}
        <div className="uni-header">
          <div className="uni-logo-placeholder">BAU</div>
          <h2 className="uni-title">Al-Balqa Applied University</h2>
          <p className="faculty-title">Prince Abdullah bin Ghazi Faculty of Information Technology</p>
          <h1 className="form-official-title">Project Meeting Attendance & Progress Form</h1>
        </div>

        <form onSubmit={(e) => { e.preventDefault(); alert('Official Report Submitted & Archived Successfully!'); navigate(-1); }}>
          
          <div className="pf-grid">
            <div className="pf-group">
              <label className="pf-label">Project Group ID</label>
              {/* اختيار المشروع يجلب الطلاب تلقائياً */}
              <StyledSelect className="pf-input" value={selectedProject} onChange={handleProjectChange} required>
                <option value="" disabled>Select Project Group...</option>
                <option value="PRJ-101">PRJ-101 (Smart Campus)</option>
                <option value="PRJ-102">PRJ-102 (AI Academic Advisor)</option>
              </StyledSelect>
            </div>
            <div className="pf-group">
              <label className="pf-label">Meeting Date</label>
              <input type="date" className="pf-input" required defaultValue={new Date().toISOString().split('T')[0]} />
            </div>
          </div>

          {/* 💡 جدول الحضور والغياب المؤتمت */}
          {selectedProject && (
            <div className="attendance-section">
              <table className="attendance-table">
                <thead>
                  <tr>
                    <th>Student Name</th>
                    <th>Student ID</th>
                    <th style={{textAlign: 'center'}}>Present / Absent</th>
                  </tr>
                </thead>
                <tbody>
                  {currentStudents.map(student => (
                    <tr key={student.id}>
                      <td>
                        {/* 💡 رابط الطالب المربوط بصفحة الطلاب (Auto Search) */}
                        <span 
                          className="student-link" 
                          onClick={() => navigate('/supervisor/students', { state: { targetStudent: student.name } })}
                          title={`View ${student.name}'s Profile`}
                        >
                          {student.name} ↗
                        </span>
                      </td>
                      <td style={{color: '#64748b', fontFamily: 'monospace', fontSize: '13px'}}>{student.id}</td>
                      <td>
                        <div className="attend-toggles" style={{justifyContent: 'center'}}>
                          <button 
                            type="button" 
                            className={`toggle-btn present ${attendance[student.id] === 'present' ? 'active' : ''}`}
                            onClick={() => handleAttendance(student.id, 'present')}
                          >
                            ✓ Present
                          </button>
                          <button 
                            type="button" 
                            className={`toggle-btn absent ${attendance[student.id] === 'absent' ? 'active' : ''}`}
                            onClick={() => handleAttendance(student.id, 'absent')}
                          >
                            ✕ Absent
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {/* 💡 زر حفظ الحضور */}
              <div className="attendance-footer">
                <button type="button" className="btn-save-attendance" onClick={() => alert('Attendance Saved Successfully!')}>
                  💾 Save Attendance
                </button>
              </div>
            </div>
          )}

          <div className="pf-group" style={{ marginBottom: '25px' }}>
            <label className="pf-label">Summary of Discussion and Outcomes</label>
            <textarea className="pf-textarea" placeholder="Document the main points discussed during the meeting..." required></textarea>
          </div>

          <div className="pf-group" style={{ marginBottom: '25px' }}>
            <label className="pf-label">Tasks to be completed before the next meeting</label>
            <textarea className="pf-textarea" style={{ minHeight: '100px' }} placeholder="E.g., 1. Finalize ER diagram. 2. Submit literature review draft..." required></textarea>
          </div>

          {/* التقييم العام مع الحقل الشرطي */}
          <div className="pf-status-box">
            <label className="pf-label">Overall rating of the student research progress to date</label>
            <div className="radio-group">
              <label className={`radio-label ${assessment === 'Excellent' ? 'selected' : ''}`}>
                <input type="radio" name="assessment" value="Excellent" onChange={(e) => setAssessment(e.target.value)} required /> 
                ⭐ Excellent
              </label>
              <label className={`radio-label ${assessment === 'Satisfactory' ? 'selected' : ''}`}>
                <input type="radio" name="assessment" value="Satisfactory" onChange={(e) => setAssessment(e.target.value)} /> 
                ✅ Satisfactory
              </label>
              <label className={`radio-label ${assessment === 'Improvement' ? 'selected' : ''}`}>
                <input type="radio" name="assessment" value="Improvement" onChange={(e) => setAssessment(e.target.value)} /> 
                ⚠️ Requires Improvement
              </label>
              <label className={`radio-label ${assessment === 'Concern' ? 'selected' : ''}`}>
                <input type="radio" name="assessment" value="Concern" onChange={(e) => setAssessment(e.target.value)} /> 
                🚨 Giving cause for concern
              </label>
            </div>

            {/* الحقل الشرطي يظهر فقط إذا كان التقييم مقلقاً */}
            {assessment === 'Concern' && (
              <div className="warning-box">
                <label className="pf-label" style={{color: '#b91c1c'}}>In case of "Giving cause for concern" please state clearly the steps that the student should take to reach the satisfactory progress level:</label>
                <textarea 
                  className="pf-textarea" 
                  style={{background: 'white', borderColor: '#fca5a5', marginTop: '10px', minHeight: '80px'}} 
                  placeholder="Required remedial actions..."
                  required
                ></textarea>
              </div>
            )}
          </div>

          <div className="pf-grid" style={{alignItems: 'end', borderTop: '2px dashed #e2e8f0', paddingTop: '25px'}}>
            <div className="pf-group">
              <label className="pf-label">Supervisor Name & Signature</label>
              <input type="text" className="pf-input" value="Dr. Ahmad Ali (Signed Digitally)" readOnly style={{background: '#f1f5f9', color: '#4f46e5'}} />
            </div>
            
            {/* 💡 تغيير حقل التاريخ لزر حجز موعد جديد */}
            <div className="pf-group">
              <label className="pf-label">Next Meeting Action</label>
              <button 
                type="button" 
                className="btn-schedule-next" 
                onClick={() => navigate('/supervisor/new-meeting')}
              >
                📅 Schedule Next Meeting
              </button>
            </div>
          </div>

          {/* 💡 أزرار الإرسال والطباعة */}
          <div className="form-actions-row">
            <button 
              type="button" 
              className="btn-export-pdf" 
              onClick={() => window.print()}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
              Save as PDF
            </button>
            
            <button type="submit" className="btn-submit">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg>
              Save & Archive Report
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

export default MeetingProgressForm;
