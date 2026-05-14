import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import SearchBar from '../../components/SearchBar';

/**
 * 💡 Project Approvals (Admin Forms) - System Admin
 * Premium Master Edition - Dark Mode
 * Includes interactive approval workflows, detailed modals, and PDF Export.
 */

const formsStyles = `
  .ad-forms-container {
    padding: 20px 30px 60px 30px;
    font-family: 'Plus Jakarta Sans', -apple-system, sans-serif;
    color: #0f172a;
    background: #f8fafc;
    min-height: 100vh;
    animation: fadeInPage 0.4s ease-out;
    text-align: left;
  }

  @keyframes fadeInPage { from { opacity: 0; transform: translateY(15px); } to { opacity: 1; transform: translateY(0); } }

  /* --- Premium Header --- */
  .ad-header-box { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 30px; background: transparent; padding: 0; border-radius: 0; border: none; box-shadow: none; }
  .ad-kicker { color: #d97706; font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 1.5px; margin: 0 0 8px 0; display: flex; align-items: center; gap: 8px;}
  .ad-kicker::before { content: ''; display: inline-block; width: 6px; height: 6px; background: #d97706; border-radius: 50%; }
  .ad-title { font-size: 34px; font-weight: 900; margin: 0; color: #0f172a; letter-spacing: -1px; }
  
  .ad-header-actions { display: flex; gap: 12px; }
  .btn-ad-outline { background: white; border: 1px solid #d1d5db; color: #0f172a; padding: 10px 20px; border-radius: 10px; font-weight: 700; font-size: 14px; cursor: pointer; transition: 0.2s; display: flex; align-items: center; gap: 8px; }
  .btn-ad-outline:hover { background: #f3f4f6; border-color: #9ca3af; transform: translateY(-2px); }

  /* --- KPI Stats Cards --- */
  .ad-stats-bar { display: grid; grid-template-columns: repeat(4, 1fr); gap: 24px; margin-bottom: 30px; }
  .ad-stat-pill { background: white; border: 1px solid #e2e8f0; border-radius: 16px; padding: 24px; display: flex; align-items: center; gap: 18px; cursor: pointer; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); position: relative; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.02); }
  .ad-stat-pill:hover { transform: translateY(-5px); border-color: #cbd5e1; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.05); }
  .ad-stat-pill.active-filter { border-color: #4f46e5; background: rgba(79, 70, 229, 0.05); }
  .ad-icon-wrapper { width: 50px; height: 50px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 22px; transition: 0.3s; background: #f9fafb; }
  .ad-stat-pill:hover .ad-icon-wrapper { transform: scale(1.1); }
  
  .icon-blue { color: #3b82f6; } .icon-yellow { color: #f59e0b; } .icon-green { color: #10b981; } .icon-red { color: #ef4444; }
  .ad-stat-info h4 { margin: 0; font-size: 11px; color: #64748b; text-transform: uppercase; font-weight: 700; letter-spacing: 0.5px;}
  .ad-stat-info p { margin: 8px 0 0 0; font-size: 28px; font-weight: 900; color: #0f172a; line-height: 1; }

  /* --- Toolbar --- */
  .ad-toolbar { display: flex; gap: 15px; background: white; padding: 16px; border-radius: 16px; border: 1px solid #e2e8f0; margin-bottom: 25px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.02); }
  .ad-search { flex-grow: 1; }
  
  /* --- Table --- */
  .ad-table-card { background: white; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.02); }
  .ad-table { width: 100%; border-collapse: collapse; text-align: left; }
  .ad-table th { padding: 18px 24px; background: #f9fafb; font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid #e2e8f0; }
  .ad-table td { padding: 18px 24px; border-bottom: 1px solid #f3f4f6; font-size: 14px; font-weight: 600; color: #475569; vertical-align: middle; transition: 0.2s;}
  .ad-table tr:hover td { background: #f9fafb; }
  .ad-table tr:last-child td { border-bottom: none; }

  .proj-title { font-size: 15px; font-weight: 900; color: #0f172a; margin-bottom: 4px; display: flex; align-items: center; gap: 8px;}
  .proj-domain { font-size: 11px; font-weight: 700; color: #4f46e5; background: rgba(79, 70, 229, 0.1); padding: 4px 10px; border-radius: 8px; text-transform: uppercase;}
  .submitter-info { font-size: 12px; color: #64748b; font-weight: 600; }

  /* Badges */
  .status-badge { padding: 6px 12px; border-radius: 8px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; border: 1px solid transparent; display: inline-block;}
  .status-pending { background: rgba(245, 158, 11, 0.1); color: #d97706; border-color: rgba(245, 158, 11, 0.2); }
  .status-approved { background: rgba(16, 185, 129, 0.1); color: #059669; border-color: rgba(16, 185, 129, 0.2); }
  .status-rejected { background: rgba(239, 68, 68, 0.1); color: #dc2626; border-color: rgba(239, 68, 68, 0.2); }

  /* Action Buttons */
  .actions-cell { display: flex; gap: 8px; }
  .btn-icon { width: 36px; height: 36px; border-radius: 10px; background: white; border: 1px solid #d1d5db; color: #475569; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: 0.2s; font-size: 14px;}
  .btn-icon:hover { background: #f9fafb; color: #0f172a; border-color: #9ca3af; transform: translateY(-2px); }
  .btn-icon.approve:hover { background: rgba(16, 185, 129, 0.1); color: #059669; border-color: #059669; }
  .btn-icon.reject:hover { background: rgba(239, 68, 68, 0.1); color: #dc2626; border-color: #dc2626; }

  /* --- Modals --- */
  .modal-overlay { position: fixed; inset: 0; background: rgba(15, 23, 42, 0.4); backdrop-filter: blur(8px); display: flex; align-items: center; justify-content: center; z-index: 1000; animation: fadeIn 0.2s; }
  .modal-content { background: white; border: 1px solid #e2e8f0; border-radius: 16px; width: 90%; max-width: 700px; max-height: 90vh; display: flex; flex-direction: column; overflow: hidden; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.1); animation: slideUp 0.3s ease-out; }
  .modal-header { padding: 24px; background: white; border-bottom: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center; }
  .modal-header h2 { margin: 0; font-size: 20px; font-weight: 900; color: #0f172a; }
  .modal-close { background: none; border: none; color: #64748b; font-size: 20px; cursor: pointer; transition: 0.2s; }
  .modal-close:hover { color: #0f172a; }
  
  .modal-body { padding: 24px; overflow-y: auto; }
  .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 25px; }
  .info-item { background: #f9fafb; padding: 15px; border-radius: 12px; border: 1px solid #e2e8f0;}
  .info-label { font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; margin-bottom: 5px; }
  .info-val { font-size: 14px; font-weight: 700; color: #0f172a; }
  
  .desc-box { background: #f9fafb; padding: 20px; border-radius: 12px; border: 1px solid #e2e8f0; color: #475569; font-size: 14px; line-height: 1.6; }

  .modal-footer { padding: 20px 24px; background: white; border-top: 1px solid #e2e8f0; display: flex; justify-content: flex-end; gap: 15px; }
  .btn-modal { padding: 10px 24px; border-radius: 10px; font-weight: 700; font-size: 13px; cursor: pointer; transition: 0.2s; border: none;}
  .btn-modal.approve { background: #10b981; color: white; box-shadow: 0 4px 10px rgba(16, 185, 129, 0.2);}
  .btn-modal.approve:hover { background: #059669; transform: translateY(-2px);}
  .btn-modal.reject { background: #ef4444; color: white; box-shadow: 0 4px 10px rgba(239, 68, 68, 0.2);}
  .btn-modal.reject:hover { background: #dc2626; transform: translateY(-2px);}

  /* 💡 Print Media Magic */
  @media print {
    .sidebar-wrapper, .top-header, .ad-header-actions, .ad-toolbar, .actions-cell, .modal-overlay { display: none !important; }
    .ad-forms-container { background: white !important; color: black !important; padding: 0; min-height: auto; }
    .ad-header-box { border: none; box-shadow: none; padding: 0; margin-bottom: 30px; background: transparent; }
    .ad-title { color: black !important; font-size: 28px; }
    .ad-kicker { color: black !important; } .ad-kicker::before { display: none; }
    .ad-stats-bar { grid-template-columns: repeat(4, 1fr); gap: 10px; }
    .ad-stat-pill { border: 1px solid #ccc !important; box-shadow: none !important; padding: 15px; background: white !important; }
    .ad-stat-info p, .ad-stat-info h4 { color: black !important; }
    .ad-table-card { border: 1px solid #ccc !important; box-shadow: none !important; border-radius: 0; background: white !important; }
    .ad-table th { background: #f1f5f9 !important; color: black !important; border-bottom: 2px solid #aaa !important; }
    .ad-table td { color: black !important; border-bottom: 1px solid #ccc !important; background: white !important;}
    .proj-title { color: black !important; }
    body { background: white !important; -webkit-print-color-adjust: exact; }
  }
`;

const AdminForms = () => {
  const navigate = useNavigate();

  // States
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [selectedForm, setSelectedForm] = useState(null);

  // Mock Forms Data
  const [forms, setForms] = useState([
    { 
      id: 'REQ-1042', title: 'Smart Campus IoT Network', domain: 'IoT', submitter: 'Team Alpha (Ali Mansour)', date: 'Oct 18, 2025', 
      status: 'Pending', supervisor: 'Dr. Ahmad Ali', teamSize: 4, 
      description: 'A comprehensive IoT system to manage campus lighting and HVAC systems automatically to save energy. Requires Raspberry Pi and Arduino kits.' 
    },
    { 
      id: 'REQ-1043', title: 'AI Academic Predictor', domain: 'AI / ML', submitter: 'Team Beta (Leen Rami)', date: 'Oct 17, 2025', 
      status: 'Approved', supervisor: 'Dr. Sarah Khaled', teamSize: 3, 
      description: 'Machine learning model predicting student performance based on past grades and attendance to provide early intervention.' 
    },
    { 
      id: 'REQ-1044', title: 'Decentralized Voting DApp', domain: 'Cybersecurity', submitter: 'Team Gamma (Khaled Y)', date: 'Oct 15, 2025', 
      status: 'Rejected', supervisor: 'Dr. Omar Zaid', teamSize: 3, 
      description: 'Blockchain-based voting app for university council elections. Rejected due to insufficient detailing on the encryption protocols used.' 
    },
    { 
      id: 'REQ-1045', title: 'E-Learning Mobile App', domain: 'Software Eng.', submitter: 'Team Delta (Sami Nader)', date: 'Oct 19, 2025', 
      status: 'Pending', supervisor: 'Dr. Ahmad Ali', teamSize: 2, 
      description: 'A mobile application built with React Native for online course management and offline video caching for students.' 
    },
  ]);

  // Derived Stats
  const counts = {
    total: forms.length,
    pending: forms.filter(f => f.status === 'Pending').length,
    approved: forms.filter(f => f.status === 'Approved').length,
    rejected: forms.filter(f => f.status === 'Rejected').length,
  };

  // Filter Logic
  const filteredForms = forms.filter(f => {
    const matchSearch = f.title.toLowerCase().includes(searchTerm.toLowerCase()) || f.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = statusFilter === 'All' || f.status === statusFilter;
    return matchSearch && matchStatus;
  });

  // Action Handlers (No Dead Buttons)
  const handleApprove = (id) => {
    setForms(forms.map(f => f.id === id ? { ...f, status: 'Approved' } : f));
    setSelectedForm(null);
    alert('✅ Project proposal has been Officially Approved.');
  };

  const handleReject = (id) => {
    const reason = window.prompt("Enter rejection reason (will be sent to the team):");
    if(reason !== null) {
      setForms(forms.map(f => f.id === id ? { ...f, status: 'Rejected' } : f));
      setSelectedForm(null);
      alert('🛑 Project proposal has been Rejected.');
    }
  };

  const getStatusClass = (status) => {
    if (status === 'Approved') return 'status-approved';
    if (status === 'Rejected') return 'status-rejected';
    return 'status-pending';
  };

  return (
    <div className="ad-forms-container">
      <style>{formsStyles}</style>

      {/* Header */}
      <div className="ad-header-box">
        <div>
          <p className="ad-kicker">Review & Authorization</p>
          <h1 className="ad-title">Project Approvals 📝</h1>
        </div>
        <div className="ad-header-actions">
          <button className="btn-ad-outline" onClick={() => navigate('/admin/dashboard')}>← Back</button>
          <button className="btn-ad-outline" onClick={() => window.print()}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
            Export to PDF
          </button>
        </div>
      </div>

      {/* KPI Cards (Clickable Filters) */}
      <div className="ad-stats-bar">
        <div className={`ad-stat-pill ${statusFilter === 'All' ? 'active-filter' : ''}`} onClick={() => setStatusFilter('All')}>
          <div className="ad-icon-wrapper icon-blue">📋</div>
          <div className="ad-stat-info"><h4>Total Requests</h4><p>{counts.total}</p></div>
        </div>
        <div className={`ad-stat-pill ${statusFilter === 'Pending' ? 'active-filter' : ''}`} onClick={() => setStatusFilter('Pending')}>
          <div className="ad-icon-wrapper icon-yellow">⏳</div>
          <div className="ad-stat-info"><h4>Pending Review</h4><p>{counts.pending}</p></div>
        </div>
        <div className={`ad-stat-pill ${statusFilter === 'Approved' ? 'active-filter' : ''}`} onClick={() => setStatusFilter('Approved')}>
          <div className="ad-icon-wrapper icon-green">✅</div>
          <div className="ad-stat-info"><h4>Approved</h4><p>{counts.approved}</p></div>
        </div>
        <div className={`ad-stat-pill ${statusFilter === 'Rejected' ? 'active-filter' : ''}`} onClick={() => setStatusFilter('Rejected')}>
          <div className="ad-icon-wrapper icon-red">🛑</div>
          <div className="ad-stat-info"><h4>Rejected</h4><p>{counts.rejected}</p></div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="ad-toolbar">
        <SearchBar
          className="ad-search"
          variant="light"
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          onClear={() => setSearchTerm('')}
          placeholder="Search by Project Title or ID..."
        />
      </div>

      {/* Table */}
      <div className="ad-table-card">
        <table className="ad-table">
          <thead>
            <tr><th>Project Proposal</th><th>Submitted By</th><th>Date</th><th>Status</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {filteredForms.length > 0 ? filteredForms.map(form => (
              <tr key={form.id}>
                <td>
                  <div className="proj-title">
                    {form.title} <span className="proj-domain">{form.domain}</span>
                  </div>
                  <div style={{fontSize: '11px', color: '#64748b'}}>ID: {form.id}</div>
                </td>
                <td>
                  <div className="submitter-info">{form.submitter}</div>
                </td>
                <td>{form.date}</td>
                <td><span className={`status-badge ${getStatusClass(form.status)}`}>{form.status}</span></td>
                <td>
                  <div className="actions-cell">
                    <button className="btn-icon" title="View Full Details" onClick={() => setSelectedForm(form)}>👁️</button>
                    {form.status === 'Pending' && (
                      <>
                        <button className="btn-icon approve" title="Approve" onClick={() => handleApprove(form.id)}>✅</button>
                        <button className="btn-icon reject" title="Reject" onClick={() => handleReject(form.id)}>✖</button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            )) : (
              <tr><td colSpan="5" style={{textAlign: 'center', padding: '50px', color: '#64748b'}}>No proposals found matching criteria.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* 🚀 MODAL: View Form Details */}
      {selectedForm && (
        <div className="modal-overlay" onClick={() => setSelectedForm(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Project Proposal Review</h2>
              <button className="modal-close" onClick={() => setSelectedForm(null)}>✕</button>
            </div>
            
            <div className="modal-body">
              <div style={{marginBottom: '20px'}}>
                <span style={{background: '#eef2ff', border: '1px solid #c7d2fe', padding: '4px 10px', borderRadius: '999px', fontSize: '11px', fontWeight: 800, color: '#4338ca', marginRight: '10px'}}>{selectedForm.id}</span>
                <h3 style={{fontSize: '22px', fontWeight: 900, color: '#0f172a', margin: '10px 0 5px 0'}}>{selectedForm.title}</h3>
                <span className={`status-badge ${getStatusClass(selectedForm.status)}`}>{selectedForm.status}</span>
              </div>

              <div className="info-grid">
                <div className="info-item">
                  <div className="info-label">Domain Area</div>
                  <div className="info-val" style={{color: '#4f46e5'}}>{selectedForm.domain}</div>
                </div>
                <div className="info-item">
                  <div className="info-label">Proposed Supervisor</div>
                  <div className="info-val">{selectedForm.supervisor}</div>
                </div>
                <div className="info-item">
                  <div className="info-label">Submitted By</div>
                  <div className="info-val">{selectedForm.submitter}</div>
                </div>
                <div className="info-item">
                  <div className="info-label">Team Size</div>
                  <div className="info-val">{selectedForm.teamSize} Members</div>
                </div>
              </div>

              <div className="info-label" style={{marginBottom: '10px'}}>Executive Summary & Description</div>
              <div className="desc-box">
                {selectedForm.description}
              </div>
            </div>

            <div className="modal-footer">
              {selectedForm.status === 'Pending' ? (
                <>
                  <button className="btn-modal reject" onClick={() => handleReject(selectedForm.id)}>Reject Proposal</button>
                  <button className="btn-modal approve" onClick={() => handleApprove(selectedForm.id)}>Approve Project</button>
                </>
              ) : (
                <button className="btn-ad-outline" onClick={() => setSelectedForm(null)}>Close Window</button>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminForms;
