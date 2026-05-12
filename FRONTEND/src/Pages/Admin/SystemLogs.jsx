import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import SearchBar from '../../components/SearchBar';
import StyledSelect from '../../components/StyledSelect';

/**
 * 💡 System Logs - System Admin
 * Premium Master Edition - Dark Mode
 * Includes Server Live Feed simulation, JSON Trace Modals, and PDF Export.
 */

const logsStyles = `
  .ad-logs-container {
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
  .ad-kicker { color: #34d399; font-size: 13px; font-weight: 800; text-transform: uppercase; letter-spacing: 1.5px; margin: 0 0 5px 0; display: flex; align-items: center; gap: 8px;}
  .live-dot { width: 10px; height: 10px; background: #34d399; border-radius: 50%; box-shadow: 0 0 10px #34d399; animation: pulseDot 1.5s infinite; }
  @keyframes pulseDot { 0% { opacity: 0.5; transform: scale(0.8); } 50% { opacity: 1; transform: scale(1.2); } 100% { opacity: 0.5; transform: scale(0.8); } }
  .ad-title { font-size: 32px; font-weight: 900; margin: 0; color: #f8fafc; letter-spacing: -1px; }
  
  .ad-header-actions { display: flex; gap: 12px; }
  .btn-ad-outline { background: #1e293b; border: 1px solid #334155; color: #f8fafc; padding: 12px 20px; border-radius: 12px; font-weight: 800; font-size: 13px; cursor: pointer; transition: 0.2s; display: flex; align-items: center; gap: 8px; }
  .btn-ad-outline:hover { background: #334155; border-color: #475569; transform: translateY(-2px); }

  /* --- KPI Stats Cards --- */
  .ad-stats-bar { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin-bottom: 30px; }
  .ad-stat-pill { background: #0f172a; border: 1px solid #1e293b; border-radius: 20px; padding: 20px 25px; display: flex; align-items: center; gap: 18px; cursor: pointer; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); position: relative; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.2); }
  .ad-stat-pill:hover { transform: translateY(-5px); border-color: #3b82f6; box-shadow: 0 10px 20px -5px rgba(59, 130, 246, 0.2); }
  .ad-stat-pill.active-filter { border-color: #06b6d4; background: #172033; }
  .ad-icon-wrapper { width: 50px; height: 50px; border-radius: 14px; display: flex; align-items: center; justify-content: center; font-size: 22px; transition: 0.3s; background: #1e293b; }
  .ad-stat-pill:hover .ad-icon-wrapper { transform: scale(1.1); }
  
  .icon-blue { color: #3b82f6; } .icon-yellow { color: #fbbf24; } .icon-red { color: #ef4444; } .icon-purple { color: #c084fc; }
  .ad-stat-info h4 { margin: 0; font-size: 12px; color: #94a3b8; text-transform: uppercase; font-weight: 800; letter-spacing: 0.5px;}
  .ad-stat-info p { margin: 5px 0 0 0; font-size: 28px; font-weight: 900; color: #f8fafc; line-height: 1; }

  /* --- Toolbar --- */
  .ad-toolbar { display: flex; gap: 15px; background: #0f172a; padding: 15px; border-radius: 16px; border: 1px solid #1e293b; margin-bottom: 25px; box-shadow: 0 10px 20px -5px rgba(0,0,0,0.3); }
  .ad-search { flex-grow: 1; }
  .ad-filter { padding: 10px 15px; border: 1px solid #334155; background: #1e293b; color: #f8fafc; border-radius: 10px; font-size: 13px; font-weight: 700; outline: none; cursor: pointer; min-width: 150px; font-family: inherit;}
  .ad-filter:focus { border-color: #06b6d4; }

  /* --- Table --- */
  .ad-table-card { background: #0f172a; border: 1px solid #1e293b; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.5); }
  .ad-table { width: 100%; border-collapse: collapse; text-align: left; }
  .ad-table th { padding: 18px 25px; background: #1e293b; font-size: 11px; font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px; border-bottom: 1px solid #334155; }
  .ad-table td { padding: 18px 25px; border-bottom: 1px solid #1e293b; font-size: 13px; font-weight: 600; color: #cbd5e1; vertical-align: middle; transition: 0.2s;}
  .ad-table tr:hover td { background: #172033; }
  .ad-table tr:last-child td { border-bottom: none; }

  .log-id { font-family: 'Fira Code', monospace; color: #94a3b8; font-size: 12px;}
  .log-message { font-size: 14px; font-weight: 700; color: #f8fafc; margin-bottom: 4px; }
  .log-module { font-size: 11px; font-weight: 800; color: #06b6d4; background: rgba(6, 182, 212, 0.1); padding: 2px 8px; border-radius: 6px; text-transform: uppercase; display: inline-block;}

  /* Badges */
  .status-badge { padding: 6px 12px; border-radius: 8px; font-size: 11px; font-weight: 900; text-transform: uppercase; letter-spacing: 1px; display: inline-block; border: 1px solid transparent;}
  .badge-info { background: rgba(59, 130, 246, 0.1); color: #60a5fa; border-color: rgba(59, 130, 246, 0.2); }
  .badge-warn { background: rgba(245, 158, 11, 0.1); color: #fbbf24; border-color: rgba(245, 158, 11, 0.2); }
  .badge-error { background: rgba(239, 68, 68, 0.1); color: #f87171; border-color: rgba(239, 68, 68, 0.2); }
  .badge-fatal { background: rgba(153, 27, 27, 0.2); color: #fca5a5; border-color: rgba(220, 38, 38, 0.5); box-shadow: 0 0 10px rgba(220, 38, 38, 0.3);}

  /* Action Buttons */
  .btn-icon { width: 100%; padding: 8px 12px; border-radius: 10px; background: #1e293b; border: 1px solid #334155; color: #94a3b8; display: flex; align-items: center; justify-content: center; gap: 8px; cursor: pointer; transition: 0.2s; font-size: 12px; font-weight: 800;}
  .btn-icon:hover { background: #334155; color: #f8fafc; border-color: #475569; transform: translateY(-2px); }

  /* --- Modals (Trace Inspector) --- */
  .modal-overlay { position: fixed; inset: 0; background: rgba(2, 6, 23, 0.85); backdrop-filter: blur(8px); display: flex; align-items: center; justify-content: center; z-index: 1000; animation: fadeIn 0.2s; }
  .modal-content { background: #0f172a; border: 1px solid #1e293b; border-radius: 24px; width: 90%; max-width: 700px; overflow: hidden; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5); animation: slideUp 0.3s ease-out; }
  .modal-header { padding: 20px 30px; border-bottom: 1px solid #1e293b; display: flex; justify-content: space-between; align-items: center; background: #1e293b;}
  .modal-header h2 { margin: 0; font-size: 18px; font-weight: 900; color: #f8fafc; display: flex; align-items: center; gap: 10px;}
  .modal-close { background: none; border: none; color: #94a3b8; font-size: 20px; cursor: pointer; transition: 0.2s; }
  .modal-close:hover { color: #f8fafc; }
  
  .modal-body { padding: 30px; }
  .terminal-trace { background: #020617; border: 1px solid #1e293b; border-radius: 12px; padding: 20px; font-family: 'Fira Code', monospace; font-size: 13px; color: #cbd5e1; overflow-x: auto; white-space: pre-wrap; line-height: 1.5; box-shadow: inset 0 0 20px rgba(0,0,0,0.5);}
  .json-key { color: #38bdf8; }
  .json-string { color: #a3e635; }
  .json-number { color: #f472b6; }

  /* 💡 Print Media Magic */
  @media print {
    .sidebar-wrapper, .top-header, .ad-header-actions, .ad-toolbar, .actions-cell, .modal-overlay { display: none !important; }
    .ad-logs-container { background: white !important; color: black !important; padding: 0; min-height: auto; }
    .ad-header-box { border: none; box-shadow: none; padding: 0; margin-bottom: 30px; background: transparent; }
    .ad-title { color: black !important; font-size: 28px; }
    .ad-kicker { color: black !important; } .live-dot { display: none; }
    .ad-stats-bar { grid-template-columns: repeat(4, 1fr); gap: 10px; }
    .ad-stat-pill { border: 1px solid #ccc !important; box-shadow: none !important; padding: 15px; background: white !important; }
    .ad-stat-info p, .ad-stat-info h4 { color: black !important; }
    .ad-table-card { border: 1px solid #ccc !important; box-shadow: none !important; border-radius: 0; background: white !important; }
    .ad-table th { background: #f1f5f9 !important; color: black !important; border-bottom: 2px solid #aaa !important; }
    .ad-table td { color: black !important; border-bottom: 1px solid #ccc !important; background: white !important;}
    .log-message, .log-id { color: black !important; }
    body { background: white !important; -webkit-print-color-adjust: exact; }
  }
`;

const SystemLogs = () => {
  const navigate = useNavigate();

  const [searchTerm, setSearchTerm] = useState('');
  const [levelFilter, setLevelFilter] = useState('All');
  const [moduleFilter, setModuleFilter] = useState('All');
  const [selectedTrace, setSelectedTrace] = useState(null);

  // Mock Logs Data
  const initialLogs = [
    { id: 'LOG-8842', timestamp: '2025-10-18 14:32:01', level: 'FATAL', module: 'Database', message: 'Connection timeout to Primary Cluster DB_01.', payload: '{"errorCode": 504, "db_host": "cluster-aws-east", "retryCount": 5, "stackTrace": "TimeoutError: connection lost at db.connect()"}' },
    { id: 'LOG-8841', timestamp: '2025-10-18 14:28:15', level: 'ERROR', module: 'Auth', message: 'Failed login attempt (Invalid Token).', payload: '{"userId": null, "ip": "192.168.1.105", "reason": "JWT Expired", "endpoint": "/api/v1/auth/verify"}' },
    { id: 'LOG-8840', timestamp: '2025-10-18 13:45:00', level: 'WARN', module: 'Storage', message: 'AWS S3 Bucket approaching 85% capacity threshold.', payload: '{"bucket": "grad-projects-assets", "currentSize": "850GB", "maxLimit": "1TB", "actionRequired": true}' },
    { id: 'LOG-8839', timestamp: '2025-10-18 12:10:22', level: 'INFO', module: 'AI Engine', message: 'Allocation algorithm executed successfully.', payload: '{"executionTime": "2.4s", "studentsProcessed": 124, "conflictsFound": 4, "triggeredBy": "Admin_Root"}' },
    { id: 'LOG-8838', timestamp: '2025-10-18 11:05:10', level: 'INFO', module: 'API Gateway', message: 'New user registered via bulk import.', payload: '{"batchId": "BATCH-099", "recordsAdded": 45, "status": "Success"}' },
    { id: 'LOG-8837', timestamp: '2025-10-18 09:30:00', level: 'WARN', module: 'Security', message: 'Multiple failed login attempts detected.', payload: '{"ip": "45.22.11.9", "attempts": 8, "action": "IP Temporarily Blocked for 30 mins"}' },
  ];

  const filteredLogs = initialLogs.filter(log => {
    const matchSearch = log.message.toLowerCase().includes(searchTerm.toLowerCase()) || log.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchLevel = levelFilter === 'All' || log.level === levelFilter;
    const matchModule = moduleFilter === 'All' || log.module === moduleFilter;
    return matchSearch && matchLevel && matchModule;
  });

  const getLevelBadge = (level) => {
    if(level === 'INFO') return 'badge-info';
    if(level === 'WARN') return 'badge-warn';
    if(level === 'ERROR') return 'badge-error';
    if(level === 'FATAL') return 'badge-fatal';
    return '';
  };

  const handleExportPDF = () => {
    window.print();
  };

  // Helper to colorize JSON for the Trace Modal
  const colorizeJson = (jsonString) => {
    try {
      const obj = JSON.parse(jsonString);
      const formatted = JSON.stringify(obj, null, 2);
      // Simple regex replacement for styling (fake syntax highlighting)
      return formatted
        .replace(/"([^"]+)":/g, '<span class="json-key">"$1"</span>:')
        .replace(/: "([^"]+)"/g, ': <span class="json-string">"$1"</span>')
        .replace(/: ([0-9]+)/g, ': <span class="json-number">$1</span>')
        .replace(/: (true|false)/g, ': <span style="color:#fbbf24">$1</span>')
        .replace(/: null/g, ': <span style="color:#ef4444">null</span>');
    } catch (e) {
      return jsonString; // Return raw if not valid JSON
    }
  };

  return (
    <div className="ad-logs-container">
      <style>{logsStyles}</style>

      {/* Header */}
      <div className="ad-header-box">
        <div>
          <p className="ad-kicker"><div className="live-dot"></div> Security & Audit Trail</p>
          <h1 className="ad-title">System Logs 📟</h1>
        </div>
        <div className="ad-header-actions">
          <button className="btn-ad-outline" onClick={() => navigate('/admin/dashboard')}>← Back</button>
          <button className="btn-ad-outline" onClick={() => { alert('Refreshing Logs...'); }}>🔄 Refresh Feed</button>
          <button className="btn-ad-outline" style={{background: '#0f172a', color: 'white', borderColor: '#0f172a'}} onClick={handleExportPDF}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
            Export Logs PDF
          </button>
        </div>
      </div>

      {/* KPI Cards (Clickable Filters) */}
      <div className="ad-stats-bar">
        <div className={`ad-stat-pill ${levelFilter === 'All' ? 'active-filter' : ''}`} onClick={() => setLevelFilter('All')}>
          <div className="ad-icon-wrapper icon-blue">📋</div>
          <div className="ad-stat-info"><h4>Total Logs</h4><p>{initialLogs.length}</p></div>
        </div>
        <div className={`ad-stat-pill ${levelFilter === 'ERROR' || levelFilter === 'FATAL' ? 'active-filter' : ''}`} onClick={() => setLevelFilter('ERROR')}>
          <div className="ad-icon-wrapper icon-red">🚨</div>
          <div className="ad-stat-info"><h4>Errors & Fatal</h4><p>{initialLogs.filter(l => l.level === 'ERROR' || l.level === 'FATAL').length}</p></div>
        </div>
        <div className={`ad-stat-pill ${levelFilter === 'WARN' ? 'active-filter' : ''}`} onClick={() => setLevelFilter('WARN')}>
          <div className="ad-icon-wrapper icon-yellow">⚠️</div>
          <div className="ad-stat-info"><h4>Warnings</h4><p>{initialLogs.filter(l => l.level === 'WARN').length}</p></div>
        </div>
        <div className={`ad-stat-pill ${levelFilter === 'INFO' ? 'active-filter' : ''}`} onClick={() => setLevelFilter('INFO')}>
          <div className="ad-icon-wrapper icon-purple">ℹ️</div>
          <div className="ad-stat-info"><h4>System Info</h4><p>{initialLogs.filter(l => l.level === 'INFO').length}</p></div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="ad-toolbar">
        <SearchBar
          className="ad-search"
          variant="dark"
          value={searchTerm}
          onChange={setSearchTerm}
          onClear={() => setSearchTerm('')}
          placeholder="Search by Message or Log ID..."
        />
        <StyledSelect className="ad-filter" value={levelFilter} onChange={(e) => setLevelFilter(e.target.value)}>
          <option value="All">All Levels</option>
          <option value="INFO">INFO</option>
          <option value="WARN">WARN</option>
          <option value="ERROR">ERROR</option>
          <option value="FATAL">FATAL</option>
        </StyledSelect>
        <StyledSelect className="ad-filter" value={moduleFilter} onChange={(e) => setModuleFilter(e.target.value)}>
          <option value="All">All Modules</option>
          <option value="Auth">Auth</option>
          <option value="Database">Database</option>
          <option value="API Gateway">API Gateway</option>
          <option value="Storage">Storage</option>
          <option value="Security">Security</option>
          <option value="AI Engine">AI Engine</option>
        </StyledSelect>
      </div>

      {/* Logs Table */}
      <div className="ad-table-card">
        <table className="ad-table">
          <thead>
            <tr><th>Timestamp / ID</th><th>Level</th><th>Module</th><th>Event Message</th><th>Trace</th></tr>
          </thead>
          <tbody>
            {filteredLogs.length > 0 ? filteredLogs.map(log => (
              <tr key={log.id}>
                <td>
                  <div style={{fontWeight: 800, color: '#f8fafc', marginBottom: '4px'}}>{log.timestamp}</div>
                  <div className="log-id">{log.id}</div>
                </td>
                <td><span className={`status-badge ${getLevelBadge(log.level)}`}>{log.level}</span></td>
                <td><span className="log-module">{log.module}</span></td>
                <td>
                  <div className="log-message" style={{color: log.level === 'FATAL' || log.level === 'ERROR' ? '#fca5a5' : '#f8fafc'}}>{log.message}</div>
                </td>
                <td className="actions-cell">
                  <button className="btn-icon" onClick={() => setSelectedTrace(log)}>
                    <span>🔍</span> View Trace
                  </button>
                </td>
              </tr>
            )) : (
              <tr><td colSpan="5" style={{textAlign: 'center', padding: '50px', color: '#64748b'}}>No logs found matching your filters.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* 🚀 MODAL: JSON Payload Trace */}
      {selectedTrace && (
        <div className="modal-overlay" onClick={() => setSelectedTrace(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2><span className="icon-blue">🔍</span> Event Trace: {selectedTrace.id}</h2>
              <button className="modal-close" onClick={() => setSelectedTrace(null)}>✕</button>
            </div>
            
            <div className="modal-body">
              <div style={{display: 'flex', gap: '15px', marginBottom: '20px'}}>
                <span className={`status-badge ${getLevelBadge(selectedTrace.level)}`}>{selectedTrace.level}</span>
                <span className="log-module">{selectedTrace.module}</span>
                <span style={{fontSize: '12px', color: '#94a3b8', fontWeight: 600, display: 'flex', alignItems: 'center'}}>{selectedTrace.timestamp}</span>
              </div>
              
              <div style={{background: '#1e293b', padding: '15px', borderRadius: '12px', border: '1px solid #334155', marginBottom: '20px', fontSize: '14px', fontWeight: 700, color: '#f8fafc'}}>
                {selectedTrace.message}
              </div>

              <div style={{fontSize: '12px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '1px'}}>Raw JSON Payload</div>
              <div 
                className="terminal-trace" 
                dangerouslySetInnerHTML={{ __html: colorizeJson(selectedTrace.payload) }}
              />
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default SystemLogs;

