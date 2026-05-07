import React, { useState } from 'react';
import './Meetings.css';

const Meetings = () => {
  // التبويبات المتاحة: upcoming, pending, past
  const [activeTab, setActiveTab] = useState('upcoming');
  const [activeModal, setActiveModal] = useState(null); // 'request' or 'minutes'
  const [selectedMeeting, setSelectedMeeting] = useState(null);
  
  // حالة الفورم لطلب اجتماع جديد
  const [newMeeting, setNewMeeting] = useState({ topic: '', date: '', time: '', type: 'Online', notes: '' });

  // بيانات الاجتماعات (تمت إضافة حالة pending)
  const [meetings, setMeetings] = useState([
    { 
      id: 1, 
      topic: "Project Proposal Review", 
      date: "Feb 20, 2026", 
      time: "10:00 AM", 
      type: "Online", 
      status: "past", 
      minutes: "Discussed the main objectives. Supervisor approved the React & Node.js tech stack. Action item: Start UI wireframes for the dashboard." 
    },
    { 
      id: 2, 
      topic: "Database Schema Discussion", 
      date: "Mar 05, 2026", 
      time: "11:30 AM", 
      type: "In-Person", 
      status: "past", 
      location: "Lab 3, IT Faculty", 
      minutes: "Refined the ERD. Added 'role' column to users table and normalized the tasks table. Action item: Create SQL script and seed data." 
    },
    { 
      id: 3, 
      topic: "Midterm Progress Check", 
      date: "Apr 25, 2026", 
      time: "02:00 PM", 
      type: "Online", 
      status: "upcoming", 
      link: "https://zoom.us/j/12345" 
    },
    { 
      id: 4, 
      topic: "Code Review: Authentication", 
      date: "May 02, 2026", 
      time: "01:00 PM", 
      type: "Online", 
      status: "pending", 
      notes: "Need help reviewing the JWT implementation." 
    }
  ]);

  // إرسال طلب اجتماع جديد
  const handleRequestSubmit = (e) => {
    e.preventDefault();
    if(!newMeeting.topic || !newMeeting.date) return;

    const addedMeeting = {
      id: Date.now(),
      topic: newMeeting.topic,
      date: newMeeting.date,
      time: newMeeting.time,
      type: newMeeting.type,
      status: "pending", // ينزل كطلب معلق وليس قادم
      notes: newMeeting.notes
    };

    setMeetings([...meetings, addedMeeting]);
    setActiveModal(null);
    setNewMeeting({ topic: '', date: '', time: '', type: 'Online', notes: '' });
    setActiveTab('pending'); // تحويل المستخدم لتبويب الطلبات
  };

  // إلغاء طلب اجتماع معلق
  const cancelRequest = (id) => {
    if(window.confirm("Are you sure you want to cancel this meeting request?")) {
      setMeetings(meetings.filter(m => m.id !== id));
    }
  };

  // فتح محضر الاجتماع (MoM)
  const openMinutes = (meeting) => {
    setSelectedMeeting(meeting);
    setActiveModal('minutes');
  };

  const filteredMeetings = meetings.filter(m => m.status === activeTab);

  return (
    <div className="meetings-page-wrapper">
      
      <div className="meetings-hero-header">
        <div>
          <p className="kicker-text">Student Portal / Communication</p>
          <h1 className="main-page-title">Meetings & Sessions</h1>
        </div>
        <button className="btn-primary-action" onClick={() => setActiveModal('request')}>
          📅 Request New Meeting
        </button>
      </div>

      <div className="custom-tabs-container">
        <button className={`custom-tab-btn ${activeTab === 'upcoming' ? 'active' : ''}`} onClick={() => setActiveTab('upcoming')}>
          Upcoming Scheduled
          <span className="tab-badge">{meetings.filter(m => m.status === 'upcoming').length}</span>
        </button>
        <button className={`custom-tab-btn ${activeTab === 'pending' ? 'active' : ''}`} onClick={() => setActiveTab('pending')}>
          Pending Requests
          {meetings.filter(m => m.status === 'pending').length > 0 && (
            <span className="tab-badge orange">{meetings.filter(m => m.status === 'pending').length}</span>
          )}
        </button>
        <button className={`custom-tab-btn ${activeTab === 'past' ? 'active' : ''}`} onClick={() => setActiveTab('past')}>
          Past Records (MoM)
        </button>
      </div>

      <div className="meetings-cards-grid">
        {filteredMeetings.length > 0 ? (
          filteredMeetings.map(meeting => (
            <div key={meeting.id} className="meeting-info-card">
              <div className="card-top-header">
                <span className={`type-pill ${meeting.type.toLowerCase()}`}>
                  {meeting.type === 'Online' ? '🌐 Virtual' : '🏢 On-Campus'}
                </span>
                {meeting.status === 'pending' && (
                  <span className="status-label-orange">Waiting for Approval</span>
                )}
              </div>
              
              <h3 className="meeting-topic-title">{meeting.topic}</h3>
              
              <div className="meeting-meta-data">
                <div className="meta-info-row">
                  <div className="icon-box">📅</div>
                  <span>{meeting.date}</span>
                </div>
                <div className="meta-info-row">
                  <div className="icon-box">⏰</div>
                  <span>{meeting.time}</span>
                </div>
                {meeting.type === 'In-Person' && meeting.location && (
                  <div className="meta-info-row">
                    <div className="icon-box">📍</div>
                    <span>{meeting.location}</span>
                  </div>
                )}
              </div>

              <div className="card-bottom-actions">
                {meeting.status === 'upcoming' && (
                  <button 
                    className="btn-join-room" 
                    onClick={() => meeting.link ? window.open(meeting.link, '_blank') : alert('Doctor has not provided the link yet.')}
                  >
                    Join Virtual Room
                  </button>
                )}
                {meeting.status === 'past' && (
                  <button className="btn-view-mom" onClick={() => openMinutes(meeting)}>
                    View Minutes (MoM)
                  </button>
                )}
                {meeting.status === 'pending' && (
                  <button className="btn-cancel-req" onClick={() => cancelRequest(meeting.id)}>
                    Cancel Request
                  </button>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="meetings-empty-state">
            <div className="empty-icon">📁</div>
            <h3>No {activeTab} meetings found.</h3>
            <p>
              {activeTab === 'upcoming' && "You have no officially scheduled meetings with your supervisor."}
              {activeTab === 'pending' && "You haven't requested any new meetings."}
              {activeTab === 'past' && "No past meeting records or minutes available."}
            </p>
          </div>
        )}
      </div>

      {/* --- Modals --- */}
      
      {/* 1. Request Meeting Modal */}
      {activeModal === 'request' && (
        <div className="saas-modal-backdrop" onClick={() => setActiveModal(null)}>
          <div className="saas-modal-box" onClick={e => e.stopPropagation()}>
            <div className="saas-modal-header">
              <h2>Request Supervisor Meeting</h2>
              <button className="btn-close-modal" onClick={() => setActiveModal(null)}>✕</button>
            </div>
            <form onSubmit={handleRequestSubmit}>
              <div className="saas-modal-body">
                <div className="alert-blue-box">
                  <strong>Note:</strong> Your request will be sent to the supervisor for approval. It will appear in "Pending Requests" until confirmed.
                </div>
                <div className="input-group">
                  <label>Discussion Topic</label>
                  <input type="text" className="input-field" placeholder="e.g., Code Review for Backend" required value={newMeeting.topic} onChange={e => setNewMeeting({...newMeeting, topic: e.target.value})} />
                </div>
                <div className="input-row">
                  <div className="input-group">
                    <label>Preferred Date</label>
                    <input type="date" className="input-field" required value={newMeeting.date} onChange={e => setNewMeeting({...newMeeting, date: e.target.value})} />
                  </div>
                  <div className="input-group">
                    <label>Preferred Time</label>
                    <input type="time" className="input-field" required value={newMeeting.time} onChange={e => setNewMeeting({...newMeeting, time: e.target.value})} />
                  </div>
                </div>
                <div className="input-group">
                  <label>Meeting Type</label>
                  <select className="input-field" value={newMeeting.type} onChange={e => setNewMeeting({...newMeeting, type: e.target.value})}>
                    <option value="Online">Online (Zoom/Teams)</option>
                    <option value="In-Person">In-Person (Campus)</option>
                  </select>
                </div>
                <div className="input-group">
                  <label>Additional Notes (Optional)</label>
                  <textarea className="input-field" rows="2" placeholder="Briefly describe what you want to discuss..." value={newMeeting.notes} onChange={e => setNewMeeting({...newMeeting, notes: e.target.value})}></textarea>
                </div>
              </div>
              <div className="saas-modal-footer">
                <button type="button" className="btn-cancel" onClick={() => setActiveModal(null)}>Cancel</button>
                <button type="submit" className="btn-confirm-req">Send Request</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. View Minutes Modal */}
      {activeModal === 'minutes' && selectedMeeting && (
        <div className="saas-modal-backdrop" onClick={() => setActiveModal(null)}>
          <div className="saas-modal-box" onClick={e => e.stopPropagation()}>
            <div className="saas-modal-header">
              <h2>Minutes of Meeting (MoM)</h2>
              <button className="btn-close-modal" onClick={() => setActiveModal(null)}>✕</button>
            </div>
            <div className="saas-modal-body">
              <div className="mom-header-info">
                <h3>{selectedMeeting.topic}</h3>
                <span>Conducted on {selectedMeeting.date} at {selectedMeeting.time}</span>
              </div>
              
              <div className="mom-content-box">
                <h4>Meeting Summary & Decisions</h4>
                <p>{selectedMeeting.minutes}</p>
              </div>
            </div>
            <div className="saas-modal-footer">
              <button className="btn-cancel" onClick={() => setActiveModal(null)}>Close Record</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Meetings;