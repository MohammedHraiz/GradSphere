import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import StyledSelect from '../../components/StyledSelect';

const formStyles = `
  .nm-viewport {
    padding: 40px 20px;
    font-family: 'Plus Jakarta Sans', -apple-system, sans-serif;
    color: #0f172a;
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    animation: fadeIn 0.4s ease-out;
  }

  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  .nm-header {
    width: 100%;
    max-width: 750px;
    margin-bottom: 20px;
  }

  /* 💡 Premium Card Styling */
  .nm-card {
    background: white;
    width: 100%;
    max-width: 750px;
    border-radius: 24px;
    box-shadow: 0 20px 40px -15px rgba(0,0,0,0.05);
    border: 1px solid #e2e8f0;
    overflow: hidden;
    animation: slideUpCard 0.5s cubic-bezier(0.16, 1, 0.3, 1);
    text-align: left;
  }

  @keyframes slideUpCard {
    from { opacity: 0; transform: translateY(30px); }
    to { opacity: 1; transform: translateY(0); }
  }

  .nm-card-header {
    background: linear-gradient(135deg, #0f172a, #1e293b);
    padding: 30px 40px;
    color: white;
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
  }
  
  .nm-card-title { font-size: 24px; font-weight: 900; margin: 0 0 5px 0; letter-spacing: -0.5px; }
  .nm-card-subtitle { font-size: 14px; color: #94a3b8; margin: 0; font-weight: 500; }

  /* 💡 زر الإغلاق الفخم الجديد */
  .btn-close-card {
    background: rgba(255, 255, 255, 0.1);
    border: none;
    color: white;
    width: 36px;
    height: 36px;
    border-radius: 50%;
    cursor: pointer;
    transition: 0.2s;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 16px;
    font-weight: bold;
  }
  .btn-close-card:hover {
    background: rgba(239, 68, 68, 0.9);
    transform: scale(1.1);
  }

  .nm-card-body {
    padding: 40px;
  }

  .form-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 20px;
    margin-bottom: 25px;
  }

  .form-group {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .form-group.full-width { grid-column: 1 / -1; }

  .fg-label {
    font-size: 12px;
    font-weight: 800;
    color: #475569;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .fg-input, .fg-select, .fg-textarea {
    padding: 14px 16px;
    border: 1px solid #cbd5e1;
    border-radius: 12px;
    font-size: 14px;
    font-weight: 600;
    font-family: inherit;
    background: #f8fafc;
    color: #0f172a;
    transition: 0.2s;
    outline: none;
  }
  
  .fg-input:focus, .fg-select:focus, .fg-textarea:focus {
    background: white;
    border-color: #4f46e5;
    box-shadow: 0 0 0 4px rgba(79, 70, 229, 0.1);
  }

  .fg-textarea { resize: vertical; min-height: 100px; }

  /* 💡 Interactive Meeting Type Selector */
  .type-selector-group {
    display: flex;
    gap: 15px;
    margin-top: 5px;
  }

  .type-card {
    flex: 1;
    border: 2px solid #e2e8f0;
    border-radius: 14px;
    padding: 15px;
    text-align: center;
    cursor: pointer;
    transition: 0.2s;
    background: white;
  }
  .type-card:hover { border-color: #cbd5e1; background: #f8fafc; transform: translateY(-2px); }
  
  .type-card.active {
    border-color: #4f46e5;
    background: #eef2ff;
    box-shadow: 0 4px 10px rgba(79, 70, 229, 0.1);
  }

  .type-icon { font-size: 24px; margin-bottom: 8px; display: block; }
  .type-title { font-size: 13px; font-weight: 800; color: #1e293b; display: block;}

  .nm-card-footer {
    padding: 30px 40px;
    background: #f8fafc;
    border-top: 1px solid #e2e8f0;
    display: flex;
    justify-content: flex-end;
    align-items: center;
  }

  .btn-submit {
    background: #4f46e5;
    color: white;
    border: none;
    padding: 14px 30px;
    border-radius: 12px;
    font-weight: 800;
    font-size: 15px;
    cursor: pointer;
    transition: 0.2s;
    display: flex;
    align-items: center;
    gap: 10px;
    box-shadow: 0 4px 12px rgba(79, 70, 229, 0.25);
  }
  .btn-submit:hover:not(:disabled) { background: #4338ca; transform: translateY(-2px); box-shadow: 0 8px 20px rgba(79, 70, 229, 0.3); }
  .btn-submit:disabled { opacity: 0.7; cursor: not-allowed; }

  /* Success Animation */
  .success-overlay {
    position: absolute; inset: 0; background: rgba(255,255,255,0.9);
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    z-index: 10; animation: fadeIn 0.3s; border-radius: 24px;
  }
  .check-circle {
    width: 80px; height: 80px; background: #10b981; border-radius: 50%;
    display: flex; align-items: center; justify-content: center; color: white; font-size: 40px;
    margin-bottom: 20px; animation: popIn 0.5s cubic-bezier(0.16, 1, 0.3, 1);
  }
  @keyframes popIn { 0% { transform: scale(0); } 70% { transform: scale(1.2); } 100% { transform: scale(1); } }
`;

const NewMeetingForm = () => {
  const navigate = useNavigate();

  // States
  const [meetingType, setMeetingType] = useState('Review');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    // محاكاة إرسال البيانات للسيرفر (1.5 ثانية)
    setTimeout(() => {
      setIsSubmitting(false);
      setShowSuccess(true);
      
      // التوجيه لصفحة الاجتماعات بعد إظهار رسالة النجاح (1.5 ثانية)
      setTimeout(() => {
        navigate('/supervisor/meetings');
      }, 1500);
    }, 1500);
  };

  return (
    <div className="nm-viewport">
      <style>{formStyles}</style>

      <div className="nm-header">
        {/* تم إزالة زر الرجوع القديم من هنا بناءً على طلبك */}
      </div>

      <div className="nm-card">
        {/* شاشة النجاح اللي بتطلع فوق الفورم */}
        {showSuccess && (
          <div className="success-overlay">
            <div className="check-circle">✓</div>
            <h2 style={{color: '#0f172a', fontWeight: 900, fontSize: '24px', margin: '0 0 10px 0'}}>Meeting Scheduled!</h2>
            <p style={{color: '#64748b', fontWeight: 600}}>Redirecting to scheduler...</p>
          </div>
        )}

        <div className="nm-card-header">
          <div>
            <h2 className="nm-card-title">Schedule New Meeting</h2>
            <p className="nm-card-subtitle">Set up a session with your students or teams.</p>
          </div>
          {/* 💡 زر الإغلاق الفخم على اليمين */}
          <button className="btn-close-card" onClick={() => navigate(-1)} title="Close">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="nm-card-body">
            
            <div className="form-grid">
              {/* 💡 Project Selection */}
              <div className="form-group">
                <label className="fg-label">Select Project</label>
                <StyledSelect className="fg-select" required defaultValue="">
                  <option value="" disabled>Choose a project...</option>
                  <option value="p1">Smart University Campus</option>
                  <option value="p2">AI Academic Advisor</option>
                  <option value="p3">Blockchain Voting System</option>
                </StyledSelect>
              </div>

              {/* 💡 Attendees Selection */}
              <div className="form-group">
                <label className="fg-label">Attendees (Team / Student)</label>
                <StyledSelect className="fg-select" required defaultValue="">
                  <option value="" disabled>Choose attendees...</option>
                  <option value="t1">Team Alpha (All Members)</option>
                  <option value="t2">Team Beta (All Members)</option>
                  <option value="s1">Ali Mansour (Individual)</option>
                  <option value="s2">Sara Ahmed (Individual)</option>
                </StyledSelect>
              </div>

              {/* 💡 Date & Time */}
              <div className="form-group">
                <label className="fg-label">Date</label>
                <input type="date" className="fg-input" required />
              </div>
              <div className="form-group">
                <label className="fg-label">Time</label>
                <input type="time" className="fg-input" required />
              </div>

              {/* 💡 Interactive Meeting Type */}
              <div className="form-group full-width">
                <label className="fg-label">Meeting Type</label>
                <div className="type-selector-group">
                  
                  <div className={`type-card ${meetingType === 'Review' ? 'active' : ''}`} onClick={() => setMeetingType('Review')}>
                    <span className="type-icon">🔍</span>
                    <span className="type-title">Review</span>
                  </div>
                  
                  <div className={`type-card ${meetingType === 'Check-in' ? 'active' : ''}`} onClick={() => setMeetingType('Check-in')}>
                    <span className="type-icon">🤝</span>
                    <span className="type-title">Check-in</span>
                  </div>
                  
                  <div className={`type-card ${meetingType === 'Milestone' ? 'active' : ''}`} onClick={() => setMeetingType('Milestone')}>
                    <span className="type-icon">🏁</span>
                    <span className="type-title">Milestone</span>
                  </div>

                </div>
              </div>

              {/* 💡 Agenda / Notes */}
              <div className="form-group full-width" style={{marginTop: '10px'}}>
                <label className="fg-label">Meeting Agenda / Notes</label>
                <textarea 
                  className="fg-textarea" 
                  placeholder="Outline the topics to be discussed, required preparations, or links..."
                  required
                ></textarea>
              </div>

            </div>
          </div>

          <div className="nm-card-footer">
            <button type="submit" className="btn-submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <svg className="spinner" style={{width: '20px', height: '20px', animation: 'spin 1s linear infinite'}} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" strokeOpacity="0.3"></circle>
                    <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="4" strokeLinecap="round"></path>
                  </svg>
                  Scheduling...
                </>
              ) : (
                <>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                  Confirm Schedule
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      <style>
        {`@keyframes spin { 100% { transform: rotate(360deg); } }`}
      </style>
    </div>
  );
};

export default NewMeetingForm;
