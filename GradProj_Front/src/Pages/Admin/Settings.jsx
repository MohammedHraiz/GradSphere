import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * 💡 Global Settings - System Admin
 * Premium Master Edition - Dark Mode
 * Includes interactive Tabs, Toggle Switches, simulated saving, and PDF Export.
 */

const settingsStyles = `
  .ad-settings-container {
    padding: 20px 30px 60px 30px;
    font-family: 'Plus Jakarta Sans', -apple-system, sans-serif;
    color: #f8fafc;
    background: #0b1121;
    min-height: 100vh;
    animation: fadeInPage 0.4s ease-out;
    text-align: left;
  }

  @keyframes fadeInPage { from { opacity: 0; transform: translateY(15px); } to { opacity: 1; transform: translateY(0); } }

  /* --- Premium Header --- */
  .ad-header-box { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 30px; background: #0f172a; padding: 25px 30px; border-radius: 20px; border: 1px solid #1e293b; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.5); }
  .ad-kicker { color: #8b5cf6; font-size: 13px; font-weight: 800; text-transform: uppercase; letter-spacing: 1.5px; margin: 0 0 5px 0; display: flex; align-items: center; gap: 8px;}
  .ad-kicker::before { content: ''; display: inline-block; width: 8px; height: 8px; background: #8b5cf6; border-radius: 50%; box-shadow: 0 0 8px #8b5cf6;}
  .ad-title { font-size: 32px; font-weight: 900; margin: 0; color: #f8fafc; letter-spacing: -1px; }
  
  .ad-header-actions { display: flex; gap: 12px; }
  .btn-ad-outline { background: #1e293b; border: 1px solid #334155; color: #f8fafc; padding: 12px 20px; border-radius: 12px; font-weight: 800; font-size: 13px; cursor: pointer; transition: 0.2s; display: flex; align-items: center; gap: 8px; }
  .btn-ad-outline:hover { background: #334155; border-color: #475569; transform: translateY(-2px); }
  .btn-ad-primary { background: linear-gradient(135deg, #06b6d4, #3b82f6); color: white; border: none; box-shadow: 0 4px 15px rgba(6, 182, 212, 0.3); }
  .btn-ad-primary:hover { box-shadow: 0 8px 25px rgba(6, 182, 212, 0.5); background: linear-gradient(135deg, #0891b2, #2563eb); transform: translateY(-2px); }
  .btn-ad-primary:disabled { opacity: 0.7; cursor: not-allowed; transform: none; animation: pulse 1.5s infinite; }

  @keyframes pulse { 0% { opacity: 0.7; } 50% { opacity: 1; } 100% { opacity: 0.7; } }

  /* --- Layout: Sidebar + Content --- */
  .settings-layout { display: grid; grid-template-columns: 250px 1fr; gap: 30px; }

  /* Settings Sidebar (Tabs) */
  .settings-nav { background: #0f172a; border: 1px solid #1e293b; border-radius: 20px; padding: 15px; display: flex; flex-direction: column; gap: 8px; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.5); align-self: start; }
  .nav-tab { padding: 12px 18px; background: transparent; border: none; color: #94a3b8; font-size: 14px; font-weight: 800; text-align: left; border-radius: 12px; cursor: pointer; transition: 0.2s; display: flex; align-items: center; gap: 10px; }
  .nav-tab:hover { background: #1e293b; color: #f8fafc; }
  .nav-tab.active { background: rgba(6, 182, 212, 0.1); color: #22d3ee; border: 1px solid rgba(6, 182, 212, 0.2); }

  /* Settings Content Area */
  .settings-content { background: #0f172a; border: 1px solid #1e293b; border-radius: 20px; padding: 30px; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.5); }
  .section-title { font-size: 20px; font-weight: 900; color: #f8fafc; margin: 0 0 5px 0; border-bottom: 1px solid #1e293b; padding-bottom: 15px; margin-bottom: 25px; }
  .section-subtitle { font-size: 13px; color: #94a3b8; font-weight: 500; display: block; margin-top: 5px; }

  /* Form Elements */
  .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px; }
  .form-group { display: flex; flex-direction: column; gap: 8px; margin-bottom: 20px; }
  .form-label { font-size: 12px; font-weight: 800; color: #cbd5e1; text-transform: uppercase; letter-spacing: 0.5px; }
  .form-input, .form-select { width: 100%; padding: 12px 15px; background: #1e293b; border: 1px solid #334155; color: white; border-radius: 10px; font-size: 14px; font-weight: 600; outline: none; transition: 0.2s; box-sizing: border-box; font-family: inherit;}
  .form-input:focus, .form-select:focus { border-color: #06b6d4; box-shadow: 0 0 0 3px rgba(6, 182, 212, 0.15); }
  
  /* Toggle Switch */
  .toggle-row { display: flex; justify-content: space-between; align-items: center; padding: 15px; background: #1e293b; border: 1px solid #334155; border-radius: 12px; margin-bottom: 15px; }
  .toggle-info h4 { margin: 0 0 3px 0; font-size: 14px; font-weight: 800; color: #f8fafc; }
  .toggle-info p { margin: 0; font-size: 12px; color: #94a3b8; }
  
  .switch { position: relative; display: inline-block; width: 44px; height: 24px; }
  .switch input { opacity: 0; width: 0; height: 0; }
  .slider { position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background-color: #334155; transition: .3s; border-radius: 24px; }
  .slider:before { position: absolute; content: ""; height: 18px; width: 18px; left: 3px; bottom: 3px; background-color: white; transition: .3s; border-radius: 50%; box-shadow: 0 2px 4px rgba(0,0,0,0.2);}
  input:checked + .slider { background-color: #06b6d4; }
  input:checked + .slider:before { transform: translateX(20px); }

  /* Save Action Area */
  .save-area { margin-top: 30px; padding-top: 20px; border-top: 1px solid #1e293b; display: flex; justify-content: flex-end; }

  /* 💡 Print Media Magic */
  @media print {
    .sidebar-wrapper, .top-header, .ad-header-actions, .settings-nav, .save-area { display: none !important; }
    .ad-settings-container { background: white !important; color: black !important; padding: 0; min-height: auto; }
    .settings-layout { grid-template-columns: 1fr; }
    .ad-header-box { border: none; box-shadow: none; padding: 0; margin-bottom: 30px; background: transparent; }
    .ad-title { color: black !important; font-size: 28px; }
    .ad-kicker { color: black !important; } .ad-kicker::before { display: none; }
    .settings-content { border: 1px solid #ccc !important; box-shadow: none !important; border-radius: 0; background: white !important; padding: 20px; }
    .section-title, .toggle-info h4, .form-label { color: black !important; border-color: #ccc !important; }
    .form-input, .form-select, .toggle-row { background: white !important; color: black !important; border: 1px solid #ccc !important; }
    .slider { background-color: #ccc !important; }
    input:checked + .slider { background-color: #333 !important; }
    body { background: white !important; -webkit-print-color-adjust: exact; }
  }
`;

const Settings = () => {
  const navigate = useNavigate();

  // States
  const [activeTab, setActiveTab] = useState('general');
  const [isSaving, setIsSaving] = useState(false);

  // Settings State (Mock Data)
  const [config, setConfig] = useState({
    uniName: 'Al-Balqa Applied University',
    academicYear: '2025/2026',
    currentSemester: 'Fall Semester',
    maintenanceMode: false,
    sessionTimeout: '30',
    require2FA: true,
    maxProjectsPerSup: '5',
    emailAlerts: true,
    autoBackup: 'Daily',
  });

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setConfig({
      ...config,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleSaveChanges = () => {
    setIsSaving(true);
    // Simulate API Call
    setTimeout(() => {
      setIsSaving(false);
      alert('✅ System configurations have been successfully saved and applied.');
    }, 1500);
  };

  const handleExportPDF = () => {
    window.print();
  };

  return (
    <div className="ad-settings-container">
      <style>{settingsStyles}</style>

      {/* Header */}
      <div className="ad-header-box">
        <div>
          <p className="ad-kicker">System Core</p>
          <h1 className="ad-title">Global Settings ⚙️</h1>
        </div>
        <div className="ad-header-actions">
          <button className="btn-ad-outline" onClick={() => navigate('/admin/dashboard')}>← Back</button>
          <button className="btn-ad-outline" onClick={handleExportPDF}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
            Export Config
          </button>
        </div>
      </div>

      <div className="settings-layout">
        
        {/* Navigation Sidebar */}
        <div className="settings-nav">
          <button className={`nav-tab ${activeTab === 'general' ? 'active' : ''}`} onClick={() => setActiveTab('general')}>
            <span style={{fontSize: '18px'}}>🌍</span> General Setup
          </button>
          <button className={`nav-tab ${activeTab === 'security' ? 'active' : ''}`} onClick={() => setActiveTab('security')}>
            <span style={{fontSize: '18px'}}>🛡️</span> Security & Auth
          </button>
          <button className={`nav-tab ${activeTab === 'rules' ? 'active' : ''}`} onClick={() => setActiveTab('rules')}>
            <span style={{fontSize: '18px'}}>⚖️</span> Academic Rules
          </button>
          <button className={`nav-tab ${activeTab === 'database' ? 'active' : ''}`} onClick={() => setActiveTab('database')}>
            <span style={{fontSize: '18px'}}>🗄️</span> Database Config
          </button>
        </div>

        {/* Content Area */}
        <div className="settings-content">
          
          {/* Tab 1: General */}
          {activeTab === 'general' && (
            <div className="tab-pane">
              <h2 className="section-title">
                General Setup
                <span className="section-subtitle">Configure university details and core system availability.</span>
              </h2>
              
              <div className="form-group">
                <label className="form-label">Institution Name</label>
                <input type="text" className="form-input" name="uniName" value={config.uniName} onChange={handleInputChange} />
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Academic Year</label>
                  <select className="form-select" name="academicYear" value={config.academicYear} onChange={handleInputChange}>
                    <option value="2024/2025">2024/2025</option>
                    <option value="2025/2026">2025/2026</option>
                    <option value="2026/2027">2026/2027</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Current Semester</label>
                  <select className="form-select" name="currentSemester" value={config.currentSemester} onChange={handleInputChange}>
                    <option value="Fall Semester">Fall Semester</option>
                    <option value="Spring Semester">Spring Semester</option>
                    <option value="Summer Semester">Summer Semester</option>
                  </select>
                </div>
              </div>

              <div className="toggle-row">
                <div className="toggle-info">
                  <h4>Maintenance Mode</h4>
                  <p>Disable access for all users except Root Admins.</p>
                </div>
                <label className="switch">
                  <input type="checkbox" name="maintenanceMode" checked={config.maintenanceMode} onChange={handleInputChange} />
                  <span className="slider"></span>
                </label>
              </div>
            </div>
          )}

          {/* Tab 2: Security */}
          {activeTab === 'security' && (
            <div className="tab-pane">
              <h2 className="section-title">
                Security & Authentication
                <span className="section-subtitle">Manage session limits and user access protocols.</span>
              </h2>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Session Timeout (Minutes)</label>
                  <select className="form-select" name="sessionTimeout" value={config.sessionTimeout} onChange={handleInputChange}>
                    <option value="15">15 Minutes</option>
                    <option value="30">30 Minutes</option>
                    <option value="60">1 Hour</option>
                  </select>
                </div>
              </div>

              <div className="toggle-row">
                <div className="toggle-info">
                  <h4>Enforce 2FA (Two-Factor Authentication)</h4>
                  <p>Require OTP for Supervisors and Admins on login.</p>
                </div>
                <label className="switch">
                  <input type="checkbox" name="require2FA" checked={config.require2FA} onChange={handleInputChange} />
                  <span className="slider"></span>
                </label>
              </div>
            </div>
          )}

          {/* Tab 3: Academic Rules */}
          {activeTab === 'rules' && (
            <div className="tab-pane">
              <h2 className="section-title">
                Academic Rules
                <span className="section-subtitle">Configure constraints for the AI Allocation Engine and Faculty.</span>
              </h2>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Max Projects Per Supervisor</label>
                  <input type="number" className="form-input" name="maxProjectsPerSup" value={config.maxProjectsPerSup} onChange={handleInputChange} min="1" max="10" />
                </div>
              </div>

              <div className="toggle-row">
                <div className="toggle-info">
                  <h4>Automated Email Alerts</h4>
                  <p>Send emails to students/supervisors upon project approval/rejection.</p>
                </div>
                <label className="switch">
                  <input type="checkbox" name="emailAlerts" checked={config.emailAlerts} onChange={handleInputChange} />
                  <span className="slider"></span>
                </label>
              </div>
            </div>
          )}

          {/* Tab 4: Database Config */}
          {activeTab === 'database' && (
            <div className="tab-pane">
              <h2 className="section-title">
                Database Configuration
                <span className="section-subtitle">Manage backups and storage behavior.</span>
              </h2>

              <div className="form-group" style={{maxWidth: '50%'}}>
                <label className="form-label">Automated Backup Frequency</label>
                <select className="form-select" name="autoBackup" value={config.autoBackup} onChange={handleInputChange}>
                  <option value="Hourly">Hourly</option>
                  <option value="Daily">Daily</option>
                  <option value="Weekly">Weekly</option>
                  <option value="Manual">Manual Only</option>
                </select>
              </div>
              
              <div style={{background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.2)', padding: '15px', borderRadius: '12px', marginTop: '20px'}}>
                <h4 style={{margin: '0 0 5px 0', fontSize: '13px', color: '#fbbf24'}}>⚠️ Storage Notice</h4>
                <p style={{margin: 0, fontSize: '12px', color: '#cbd5e1', lineHeight: 1.5}}>
                  Database is approaching 85% capacity. Changing backup frequency to 'Hourly' may impact system performance. Consider archiving old projects via the 'Import/Export' module.
                </p>
              </div>
            </div>
          )}

          {/* Persistent Save Button Area */}
          <div className="save-area">
            <button className="btn-ad-primary" style={{padding: '14px 28px', borderRadius: '12px', fontWeight: 800, fontSize: '14px', cursor: 'pointer'}} onClick={handleSaveChanges} disabled={isSaving}>
              {isSaving ? 'Applying Config...' : 'Save System Changes'}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Settings;