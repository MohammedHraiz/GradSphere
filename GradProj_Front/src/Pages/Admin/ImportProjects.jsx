import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * 💡 Import / Export Data - System Admin
 * Premium Master Edition - Dark Mode
 * Includes Drag & Drop, Upload Progress Simulation, and PDF Export.
 */

const importStyles = `
  .ad-import-container {
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
  .ad-kicker { color: #06b6d4; font-size: 13px; font-weight: 800; text-transform: uppercase; letter-spacing: 1.5px; margin: 0 0 5px 0; display: flex; align-items: center; gap: 8px;}
  .ad-kicker::before { content: ''; display: inline-block; width: 8px; height: 8px; background: #06b6d4; border-radius: 50%; box-shadow: 0 0 8px #06b6d4;}
  .ad-title { font-size: 32px; font-weight: 900; margin: 0; color: #f8fafc; letter-spacing: -1px; }
  
  .ad-header-actions { display: flex; gap: 12px; }
  .btn-ad-outline { background: #1e293b; border: 1px solid #334155; color: #f8fafc; padding: 12px 20px; border-radius: 12px; font-weight: 800; font-size: 13px; cursor: pointer; transition: 0.2s; display: flex; align-items: center; gap: 8px; }
  .btn-ad-outline:hover { background: #334155; border-color: #475569; transform: translateY(-2px); }

  /* --- Stats Pill --- */
  .ad-stats-bar { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-bottom: 30px; }
  .ad-stat-pill { background: #0f172a; border: 1px solid #1e293b; border-radius: 20px; padding: 20px; display: flex; align-items: center; gap: 15px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.2); }
  .ad-icon-wrapper { width: 45px; height: 45px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 20px; background: #1e293b; }
  .icon-cyan { color: #22d3ee; } .icon-emerald { color: #34d399; } .icon-purple { color: #c084fc; }
  .ad-stat-info h4 { margin: 0; font-size: 12px; color: #94a3b8; text-transform: uppercase; font-weight: 800; }
  .ad-stat-info p { margin: 5px 0 0 0; font-size: 22px; font-weight: 900; color: #f8fafc; }

  /* --- Grid Layout --- */
  .ad-grid { display: grid; grid-template-columns: 1.5fr 1fr; gap: 25px; margin-bottom: 30px; }
  .ad-card { background: #0f172a; border: 1px solid #1e293b; border-radius: 24px; padding: 25px; box-shadow: 0 10px 30px -10px rgba(0,0,0,0.5); }
  .ad-card-title { font-size: 16px; font-weight: 900; color: #f8fafc; margin: 0 0 20px 0; display: flex; align-items: center; gap: 8px;}

  /* --- Drag & Drop Zone --- */
  .drag-zone { 
    border: 2px dashed #334155; border-radius: 16px; padding: 40px 20px; text-align: center; 
    transition: 0.3s; background: #1e293b; cursor: pointer; position: relative; overflow: hidden;
  }
  .drag-zone:hover, .drag-zone.active { border-color: #06b6d4; background: rgba(6, 182, 212, 0.05); }
  .drag-icon { font-size: 40px; margin-bottom: 15px; color: #94a3b8; transition: 0.3s; }
  .drag-zone:hover .drag-icon, .drag-zone.active .drag-icon { color: #06b6d4; transform: translateY(-5px); }
  .drag-title { font-size: 16px; font-weight: 800; color: #f8fafc; margin: 0 0 5px 0; }
  .drag-subtitle { font-size: 13px; color: #64748b; margin: 0; }
  .hidden-input { position: absolute; top: 0; left: 0; width: 100%; height: 100%; opacity: 0; cursor: pointer; }

  /* --- Form Elements --- */
  .form-group { margin-bottom: 20px; }
  .form-label { display: block; margin-bottom: 8px; font-size: 12px; font-weight: 800; color: #94a3b8; text-transform: uppercase; }
  .ad-select { width: 100%; padding: 12px 15px; background: #1e293b; border: 1px solid #334155; color: white; border-radius: 10px; font-size: 14px; font-weight: 600; outline: none; transition: 0.2s; cursor: pointer; font-family: inherit;}
  .ad-select:focus { border-color: #06b6d4; box-shadow: 0 0 0 3px rgba(6, 182, 212, 0.15); }

  .btn-upload { width: 100%; padding: 14px; background: linear-gradient(135deg, #06b6d4, #3b82f6); color: white; border: none; border-radius: 12px; font-weight: 800; font-size: 14px; cursor: pointer; transition: 0.2s; box-shadow: 0 4px 15px rgba(6, 182, 212, 0.3); }
  .btn-upload:hover { box-shadow: 0 8px 25px rgba(6, 182, 212, 0.5); transform: translateY(-2px); }
  .btn-upload:disabled { background: #334155; color: #94a3b8; cursor: not-allowed; box-shadow: none; transform: none; }

  /* --- Progress Bar --- */
  .progress-container { margin-top: 20px; background: #1e293b; padding: 15px; border-radius: 12px; border: 1px solid #334155; }
  .progress-text { display: flex; justify-content: space-between; font-size: 12px; font-weight: 800; color: #cbd5e1; margin-bottom: 8px; }
  .progress-track { width: 100%; height: 8px; background: #0f172a; border-radius: 4px; overflow: hidden; }
  .progress-fill { height: 100%; background: #06b6d4; border-radius: 4px; transition: width 0.3s ease; }

  /* --- Export Buttons --- */
  .export-btn { width: 100%; display: flex; justify-content: space-between; align-items: center; padding: 15px; background: #1e293b; border: 1px solid #334155; border-radius: 12px; cursor: pointer; transition: 0.2s; margin-bottom: 12px; font-weight: 800; color: #f8fafc; }
  .export-btn:hover { background: #334155; border-color: #06b6d4; transform: translateX(5px); }

  /* --- History Table --- */
  .ad-table { width: 100%; border-collapse: collapse; text-align: left; }
  .ad-table th { padding: 15px; background: #1e293b; font-size: 11px; font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px; border-bottom: 1px solid #334155; }
  .ad-table td { padding: 15px; border-bottom: 1px solid #1e293b; font-size: 13px; font-weight: 600; color: #cbd5e1; }
  .ad-table tr:hover td { background: #172033; color: white; }
  .ad-table tr:last-child td { border-bottom: none; }

  .status-badge { padding: 4px 8px; border-radius: 6px; font-size: 10px; font-weight: 900; text-transform: uppercase; }
  .status-success { background: rgba(52, 211, 153, 0.1); color: #34d399; border: 1px solid rgba(52, 211, 153, 0.2); }
  .status-fail { background: rgba(244, 63, 94, 0.1); color: #fb7185; border: 1px solid rgba(244, 63, 94, 0.2); }

  /* 💡 Print Media Magic */
  @media print {
    .sidebar-wrapper, .top-header, .ad-header-actions, .drag-zone, .btn-upload, .export-btn { display: none !important; }
    .ad-import-container { background: white !important; color: black !important; padding: 0; min-height: auto; }
    .ad-header-box, .ad-card, .ad-stat-pill { background: white !important; border: 1px solid #ccc !important; box-shadow: none !important; color: black !important; break-inside: avoid; }
    .ad-title, .ad-card-title, .ad-stat-info p, .ad-table td { color: black !important; }
    .ad-table th { background: #f1f5f9 !important; color: black !important; border-bottom: 2px solid #ccc !important;}
    .ad-kicker::before { box-shadow: none; background: #000; }
    body { background: white !important; -webkit-print-color-adjust: exact; }
  }
`;

const ImportProjects = () => {
  const navigate = useNavigate();
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [importType, setImportType] = useState('students');
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const [history, setHistory] = useState([
    { id: 1, file: 'students_fall_2025.csv', type: 'Students Data', date: 'Oct 15, 2025 09:30 AM', status: 'Success', records: 452 },
    { id: 2, file: 'faculty_directory.xlsx', type: 'Supervisors Data', date: 'Oct 14, 2025 02:15 PM', status: 'Success', records: 45 },
    { id: 3, file: 'projects_list_v1.csv', type: 'Projects Data', date: 'Oct 10, 2025 11:00 AM', status: 'Failed', records: 0 },
  ]);

  // Drag & Drop Handlers
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
    else if (e.type === "dragleave") setDragActive(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  // Upload Simulation (No Dead Buttons)
  const handleUpload = () => {
    if (!selectedFile) {
      alert("Please select a file first.");
      return;
    }
    setUploading(true);
    setProgress(0);
    
    // Simulate upload progress
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setUploading(false);
          // Add to history
          setHistory([{
            id: Date.now(),
            file: selectedFile.name,
            type: importType === 'students' ? 'Students Data' : importType === 'supervisors' ? 'Supervisors Data' : 'Projects Data',
            date: new Date().toLocaleString(),
            status: 'Success',
            records: Math.floor(Math.random() * 200) + 10
          }, ...history]);
          setSelectedFile(null);
          setTimeout(() => alert('✅ Data Imported Successfully! Database has been updated.'), 100);
          return 100;
        }
        return prev + 10;
      });
    }, 200);
  };

  const handleBackupExport = (type) => {
    alert(`⬇️ Generating Backup: ${type}...\nThe download will start automatically.`);
  };

  return (
    <div className="ad-import-container">
      <style>{importStyles}</style>

      {/* Header */}
      <div className="ad-header-box">
        <div>
          <p className="ad-kicker">Database Management</p>
          <h1 className="ad-title">Import & Export Data 🗄️</h1>
        </div>
        <div className="ad-header-actions">
          <button className="btn-ad-outline" onClick={() => navigate('/admin/dashboard')}>← Back</button>
          <button className="btn-ad-outline" onClick={() => window.print()}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
            Print Log
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="ad-stats-bar">
        <div className="ad-stat-pill">
          <div className="ad-icon-wrapper icon-cyan">📁</div>
          <div className="ad-stat-info"><h4>Total DB Size</h4><p>84.2 GB</p></div>
        </div>
        <div className="ad-stat-pill">
          <div className="ad-icon-wrapper icon-emerald">✅</div>
          <div className="ad-stat-info"><h4>Successful Imports</h4><p>{history.filter(h => h.status === 'Success').length}</p></div>
        </div>
        <div className="ad-stat-pill">
          <div className="ad-icon-wrapper icon-purple">🔄</div>
          <div className="ad-stat-info"><h4>Last Backup</h4><p>2 Hrs Ago</p></div>
        </div>
      </div>

      <div className="ad-grid">
        
        {/* Left Column: Import Zone */}
        <div className="ad-card">
          <h3 className="ad-card-title">📥 Bulk Data Import</h3>
          
          <div className="form-group">
            <label className="form-label">Select Data Type to Import</label>
            <select className="ad-select" value={importType} onChange={(e) => setImportType(e.target.value)} disabled={uploading}>
              <option value="students">Students Registry (CSV/Excel)</option>
              <option value="supervisors">Supervisors Directory (CSV/Excel)</option>
              <option value="projects">Previous Projects Archive (CSV)</option>
            </select>
          </div>

          <div 
            className={`drag-zone ${dragActive ? 'active' : ''}`} 
            onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop}
          >
            <input type="file" className="hidden-input" accept=".csv, .xlsx, .xls" onChange={handleFileSelect} disabled={uploading} />
            <div className="drag-icon">📁</div>
            {selectedFile ? (
              <>
                <h4 className="drag-title" style={{color: '#06b6d4'}}>{selectedFile.name}</h4>
                <p className="drag-subtitle">Ready to upload ({(selectedFile.size / 1024).toFixed(1)} KB)</p>
              </>
            ) : (
              <>
                <h4 className="drag-title">Drag & Drop your file here</h4>
                <p className="drag-subtitle">or click to browse from your computer</p>
                <p className="drag-subtitle" style={{marginTop:'10px', fontSize:'11px', opacity:0.6}}>Supported files: .CSV, .XLSX (Max 50MB)</p>
              </>
            )}
          </div>

          {uploading && (
            <div className="progress-container">
              <div className="progress-text">
                <span>Validating & Uploading...</span>
                <span style={{color: '#06b6d4'}}>{progress}%</span>
              </div>
              <div className="progress-track">
                <div className="progress-fill" style={{width: `${progress}%`}}></div>
              </div>
            </div>
          )}

          <button 
            className="btn-upload" 
            style={{marginTop: '20px'}} 
            onClick={handleUpload}
            disabled={!selectedFile || uploading}
          >
            {uploading ? 'Processing Data...' : 'Begin Secure Import'}
          </button>
        </div>

        {/* Right Column: Export & Backups */}
        <div className="ad-card">
          <h3 className="ad-card-title">📤 System Backups & Exports</h3>
          
          <div style={{marginBottom: '20px'}}>
            <p style={{fontSize: '13px', color: '#94a3b8', lineHeight: 1.5, marginBottom: '15px'}}>
              Generate and download secure copies of the system database. Ensure you comply with the university's data privacy policies.
            </p>
            
            <button className="export-btn" onClick={() => handleBackupExport('Complete Database Backup')}>
              <div style={{display:'flex', alignItems:'center', gap:'10px'}}>
                <span style={{fontSize:'18px', color: '#06b6d4'}}>📦</span> Full System Backup (.SQL)
              </div>
              <span>↓</span>
            </button>

            <button className="export-btn" onClick={() => handleBackupExport('All Users Directory')}>
              <div style={{display:'flex', alignItems:'center', gap:'10px'}}>
                <span style={{fontSize:'18px', color: '#c084fc'}}>👥</span> Export All Users (.CSV)
              </div>
              <span>↓</span>
            </button>

            <button className="export-btn" onClick={() => handleBackupExport('Projects Master List')}>
              <div style={{display:'flex', alignItems:'center', gap:'10px'}}>
                <span style={{fontSize:'18px', color: '#34d399'}}>📁</span> Export All Projects (.CSV)
              </div>
              <span>↓</span>
            </button>
          </div>
          
          <div style={{background: 'rgba(6, 182, 212, 0.1)', border: '1px solid rgba(6, 182, 212, 0.2)', padding: '15px', borderRadius: '12px'}}>
            <h4 style={{margin: '0 0 5px 0', fontSize: '13px', color: '#22d3ee'}}>Auto-Backup is Active</h4>
            <p style={{margin: 0, fontSize: '12px', color: '#cbd5e1'}}>The system automatically backs up data every 24 hours at 00:00 GMT.</p>
          </div>
        </div>

      </div>

      {/* History Table */}
      <div className="ad-card" style={{padding: 0, overflow: 'hidden'}}>
        <div style={{padding: '20px 25px', borderBottom: '1px solid #1e293b'}}>
          <h3 className="ad-card-title" style={{margin: 0}}>📜 Import / Export Activity Log</h3>
        </div>
        <table className="ad-table">
          <thead>
            <tr><th>File Name</th><th>Data Type</th><th>Timestamp</th><th>Records Added</th><th>Status</th></tr>
          </thead>
          <tbody>
            {history.map(log => (
              <tr key={log.id}>
                <td style={{fontWeight: 800, color: '#f8fafc'}}>{log.file}</td>
                <td>{log.type}</td>
                <td>{log.date}</td>
                <td>{log.records > 0 ? `+${log.records} Rows` : '-'}</td>
                <td>
                  <span className={`status-badge ${log.status === 'Success' ? 'status-success' : 'status-fail'}`}>
                    {log.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  );
};

export default ImportProjects;