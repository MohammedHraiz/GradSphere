import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * 💡 AI Allocation Engine - System Admin
 * Premium Master Edition - Light Dashboard
 * Includes AI Simulation Terminal, Match Score Progress Bars, and PDF Export.
 */

const aiStyles = `
  .ad-ai-container {
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

  /* --- AI Engine Runner Panel --- */
  .ai-runner-card {
    background: linear-gradient(145deg, rgba(255,255,255,0.98), rgba(248,250,252,0.96));
    border: 1px solid #e2e8f0;
    border-radius: 24px;
    padding: 30px;
    margin-bottom: 30px;
    box-shadow: 0 24px 48px -34px rgba(79, 70, 229, 0.28);
    position: relative;
    overflow: hidden;
  }
  .ai-runner-card::before {
    content: ''; position: absolute; top: -50%; left: -50%; width: 200%; height: 200%;
    background: radial-gradient(circle, rgba(99, 102, 241, 0.1) 0%, transparent 60%);
    pointer-events: none;
  }

  .btn-run-ai {
    background: linear-gradient(135deg, #6366f1, #ec4899);
    color: white; border: none; padding: 15px 30px; border-radius: 14px; font-weight: 900; font-size: 16px;
    cursor: pointer; transition: 0.3s; display: inline-flex; align-items: center; gap: 10px;
    box-shadow: 0 10px 25px rgba(99, 102, 241, 0.4); text-transform: uppercase; letter-spacing: 1px;
  }
  .btn-run-ai:hover { transform: translateY(-3px); box-shadow: 0 15px 35px rgba(99, 102, 241, 0.6); }
  .btn-run-ai:disabled { opacity: 0.7; cursor: not-allowed; transform: none; animation: pulse 1.5s infinite; }

  @keyframes pulse { 0% { opacity: 0.7; } 50% { opacity: 1; } 100% { opacity: 0.7; } }

  /* Terminal Simulation */
  .terminal-box {
    background: #f8fafc; border: 1px solid #dbe2ea; border-radius: 12px; padding: 15px; margin-top: 20px;
    font-family: 'Fira Code', monospace; font-size: 12px; color: #34d399; max-height: 150px; overflow-y: auto;
  }
  .term-line { margin-bottom: 5px; opacity: 0; animation: typeLine 0.1s forwards; }
  @keyframes typeLine { to { opacity: 1; } }

  /* --- KPI Stats Cards --- */
  .ad-stats-bar { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin-bottom: 30px; }
  .ad-stat-pill { background: white; border: 1px solid #e2e8f0; border-radius: 20px; padding: 20px 25px; display: flex; align-items: center; gap: 18px; position: relative; overflow: hidden; box-shadow: 0 16px 30px -26px rgba(15,23,42,0.18);}
  .ad-icon-wrapper { width: 50px; height: 50px; border-radius: 14px; display: flex; align-items: center; justify-content: center; font-size: 22px; background: #f8fafc; }
  .icon-indigo { color: #818cf8; } .icon-emerald { color: #34d399; } .icon-rose { color: #fb7185; }
  .ad-stat-info h4 { margin: 0; font-size: 12px; color: #64748b; text-transform: uppercase; font-weight: 800; letter-spacing: 0.5px;}
  .ad-stat-info p { margin: 5px 0 0 0; font-size: 28px; font-weight: 900; color: #0f172a; line-height: 1; }

  /* --- Table --- */
  .ad-table-card { background: white; border: 1px solid #e2e8f0; border-radius: 20px; overflow: hidden; box-shadow: 0 20px 40px -30px rgba(15,23,42,0.18); }
  .ad-table { width: 100%; border-collapse: collapse; text-align: left; }
  .ad-table th { padding: 18px 25px; background: #f8fafc; font-size: 11px; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 1px; border-bottom: 1px solid #e2e8f0; }
  .ad-table td { padding: 18px 25px; border-bottom: 1px solid #f1f5f9; font-size: 14px; font-weight: 600; color: #475569; vertical-align: middle; transition: 0.2s;}
  .ad-table tr:hover td { background: #f8fafc; }
  .ad-table tr:last-child td { border-bottom: none; }

  .team-name { font-size: 15px; font-weight: 900; color: #0f172a; margin-bottom: 4px; }
  .proj-domain { font-size: 11px; font-weight: 800; color: #c084fc; background: rgba(192, 132, 252, 0.1); padding: 2px 8px; border-radius: 6px; text-transform: uppercase; margin-top: 4px; display: inline-block;}

  /* Match Score Progress */
  .score-container { width: 100%; max-width: 120px; }
  .score-text { display: flex; justify-content: space-between; font-size: 11px; font-weight: 900; margin-bottom: 5px; }
  .score-track { width: 100%; height: 6px; background: #e2e8f0; border-radius: 4px; overflow: hidden; }
  .score-fill { height: 100%; border-radius: 4px; }

  /* Badges */
  .status-badge { padding: 6px 12px; border-radius: 8px; font-size: 11px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.5px; display: inline-block;}
  .status-pending { background: rgba(245, 158, 11, 0.1); color: #fbbf24; border: 1px solid rgba(245, 158, 11, 0.2); }
  .status-approved { background: rgba(16, 185, 129, 0.1); color: #34d399; border: 1px solid rgba(16, 185, 129, 0.2); }
  .status-conflict { background: rgba(239, 68, 68, 0.1); color: #f87171; border: 1px solid rgba(239, 68, 68, 0.2); }

  /* Action Buttons */
  .actions-cell { display: flex; gap: 8px; }
  .btn-icon { width: 36px; height: 36px; border-radius: 10px; background: white; border: 1px solid #d1d5db; color: #475569; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: 0.2s; font-size: 14px;}
  .btn-icon:hover { background: #f8fafc; color: #0f172a; border-color: #94a3b8; transform: translateY(-2px); }
  .btn-icon.approve:hover { background: rgba(16, 185, 129, 0.1); color: #10b981; border-color: #10b981; }

  /* --- Modals --- */
  .modal-overlay { position: fixed; inset: 0; background: rgba(15, 23, 42, 0.42); backdrop-filter: blur(8px); display: flex; align-items: center; justify-content: center; z-index: 1000; animation: fadeIn 0.2s; }
  .modal-content { background: white; border: 1px solid #e2e8f0; border-radius: 24px; width: 90%; max-width: 550px; overflow: hidden; box-shadow: 0 25px 50px -22px rgba(15,23,42,0.28); animation: slideUp 0.3s ease-out; }
  .modal-header { padding: 25px 30px; border-bottom: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center; background: white; }
  .modal-header h2 { margin: 0; font-size: 20px; font-weight: 900; color: #0f172a; display: flex; align-items: center; gap: 10px;}
  .modal-close { background: none; border: none; color: #64748b; font-size: 20px; cursor: pointer; transition: 0.2s; }
  .modal-close:hover { color: #0f172a; }
  .modal-body { padding: 30px; line-height: 1.6; color: #475569; font-size: 14px;}

  /* 💡 Print Media Magic */
  @media print {
    .sidebar-wrapper, .top-header, .ad-header-actions, .ai-runner-card, .actions-cell, .modal-overlay { display: none !important; }
    .ad-ai-container { background: white !important; color: black !important; padding: 0; min-height: auto; }
    .ad-header-box { border: none; box-shadow: none; padding: 0; margin-bottom: 30px; background: transparent; }
    .ad-title { color: black !important; font-size: 28px; }
    .ad-kicker { color: black !important; } .ad-kicker::before { display: none; }
    .ad-stats-bar { grid-template-columns: repeat(4, 1fr); gap: 10px; }
    .ad-stat-pill { border: 1px solid #ccc !important; box-shadow: none !important; padding: 15px; background: white !important; }
    .ad-stat-info p, .ad-stat-info h4 { color: black !important; }
    .ad-table-card { border: 1px solid #ccc !important; box-shadow: none !important; border-radius: 0; background: white !important; }
    .ad-table th { background: #f1f5f9 !important; color: black !important; border-bottom: 2px solid #aaa !important; }
    .ad-table td { color: black !important; border-bottom: 1px solid #ccc !important; background: white !important;}
    body { background: white !important; -webkit-print-color-adjust: exact; }
  }
`;

const AIRecommendations = () => {
  const navigate = useNavigate();
  const terminalRef = useRef(null);

  // States
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [terminalLogs, setTerminalLogs] = useState([]);
  const [hasRun, setHasRun] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState(null);

  // Mock Allocations Data
  const [allocations, setAllocations] = useState([
    { id: 'ALC-01', team: 'Team Alpha', project: 'Smart Campus IoT', supervisor: 'Dr. Ahmad Ali', domain: 'IoT', score: 98, status: 'Pending', reason: 'Team has strong Python/IoT background. Supervisor has high expertise and 1 slot available.' },
    { id: 'ALC-02', team: 'Team Beta', project: 'AI Predictor', supervisor: 'Dr. Sarah Khaled', domain: 'AI / ML', score: 95, status: 'Pending', reason: 'High correlation between team skills (TensorFlow) and Supervisor research area.' },
    { id: 'ALC-03', team: 'Team Gamma', project: 'Crypto Wallet DApp', supervisor: 'Dr. Omar Zaid', domain: 'Cybersecurity', score: 88, status: 'Pending', reason: 'Blockchain requirement matched perfectly with supervisor profile.' },
    { id: 'ALC-04', team: 'Team Delta', project: 'E-Learning App', supervisor: 'Dr. Mona Rami', domain: 'Software Eng.', score: 65, status: 'Conflict', reason: 'Supervisor is currently at full capacity (5/5). Manual adjustment recommended or override required.' },
  ]);

  // Terminal Simulation Logic
  const handleRunEngine = () => {
    if(!window.confirm("Run the AI Allocation Engine? This will calculate new matches based on latest database inputs.")) return;
    
    setIsRunning(true);
    setHasRun(false);
    setProgress(0);
    setTerminalLogs(['[SYSTEM] Initializing Neural Allocation Engine v2.4...']);

    const steps = [
      '[DATA] Fetching Student Skills Matrix...',
      '[DATA] Mapping Supervisor Domains & Capacity...',
      '[AI] Running Optimization Algorithm (Epoch 1/5)...',
      '[AI] Balancing Loads & Resolving Constraints...',
      '[AI] Calculating Match Probability Scores...',
      '[SYSTEM] Finalizing Allocation Matrix...',
      '[SUCCESS] Algorithm completed in 2.4s. Displaying Results.'
    ];

    let currentStep = 0;
    const interval = setInterval(() => {
      setProgress((prev) => {
        const next = prev + 15;
        if (next >= 100) {
          clearInterval(interval);
          setIsRunning(false);
          setHasRun(true);
          return 100;
        }
        return next;
      });

      if (currentStep < steps.length) {
        setTerminalLogs(prev => [...prev, steps[currentStep]]);
        currentStep++;
        if(terminalRef.current) {
          terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
        }
      }
    }, 600);
  };

  // Handlers
  const handleApprove = (id) => {
    setAllocations(allocations.map(a => a.id === id ? { ...a, status: 'Approved' } : a));
    alert('✅ Recommendation Approved and Locked.');
  };

  const handleApproveAll = () => {
    if(window.confirm('Approve all pending recommendations automatically?')) {
      setAllocations(allocations.map(a => a.status === 'Pending' ? { ...a, status: 'Approved' } : a));
    }
  };

  const getScoreColor = (score) => {
    if (score >= 90) return '#10b981'; // Green
    if (score >= 75) return '#f59e0b'; // Yellow
    return '#ef4444'; // Red
  };

  return (
    <div className="ad-ai-container">
      <style>{aiStyles}</style>

      {/* Header */}
      <div className="ad-header-box">
        <div>
          <p className="ad-kicker">Automated Assignment System</p>
          <h1 className="ad-title">AI Allocation Engine 🧠</h1>
        </div>
        <div className="ad-header-actions">
          <button className="btn-ad-outline" onClick={() => navigate('/admin/dashboard')}>← Back to Dashboard</button>
          <button className="btn-ad-outline" onClick={() => window.print()}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
            Export Results PDF
          </button>
        </div>
      </div>

      {/* AI Runner Panel */}
      <div className="ai-runner-card">
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start'}}>
          <div style={{maxWidth: '60%'}}>
            <h2 style={{margin: '0 0 10px 0', fontSize: '24px', fontWeight: 900, color: '#0f172a'}}>Smart Distribution Engine</h2>
            <p style={{margin: '0 0 20px 0', color: '#64748b', fontSize: '14px', lineHeight: 1.5}}>
              Our proprietary AI evaluates student skills, project requirements, and supervisor workloads to generate the most optimal, conflict-free assignments in seconds.
            </p>
            <button className="btn-run-ai" onClick={handleRunEngine} disabled={isRunning}>
              {isRunning ? 'Processing Algorithm...' : '▶ Run AI Engine Now'}
            </button>
          </div>
          
          {/* Progress Ring (Visual flair) */}
          <div style={{position: 'relative', width: '100px', height: '100px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(99, 102, 241, 0.08)', borderRadius: '50%', border: '4px solid rgba(99, 102, 241, 0.18)'}}>
             <span style={{fontSize: '24px', fontWeight: 900, color: '#818cf8'}}>{progress}%</span>
          </div>
        </div>

        {isRunning && (
          <div className="terminal-box" ref={terminalRef}>
            {terminalLogs.map((log, index) => (
              <div key={index} className="term-line">{log}</div>
            ))}
            <div className="term-line animate-pulse">_</div>
          </div>
        )}
      </div>

      {/* Stats Cards (Show after run) */}
      <div className="ad-stats-bar" style={{ opacity: hasRun ? 1 : 0.4, pointerEvents: hasRun ? 'auto' : 'none', transition: '0.5s' }}>
        <div className="ad-stat-pill">
          <div className="ad-icon-wrapper icon-indigo">🤖</div>
          <div className="ad-stat-info"><h4>Algorithm Accuracy</h4><p>94.2%</p></div>
        </div>
        <div className="ad-stat-pill">
          <div className="ad-icon-wrapper icon-emerald">✅</div>
          <div className="ad-stat-info"><h4>Optimal Matches</h4><p>38 / 42</p></div>
        </div>
        <div className="ad-stat-pill">
          <div className="ad-icon-wrapper icon-rose">⚠️</div>
          <div className="ad-stat-info"><h4>Conflicts Found</h4><p>4</p></div>
        </div>
        <div className="ad-stat-pill">
          <div className="ad-icon-wrapper icon-indigo" style={{color: 'white', background: 'linear-gradient(135deg, #4f46e5, #2563eb)', cursor: 'pointer'}} onClick={handleApproveAll}>
            💾
          </div>
          <div className="ad-stat-info"><h4>Action</h4><p style={{fontSize: '16px', marginTop:'8px'}}>Approve All</p></div>
        </div>
      </div>

      {/* Recommendations Table */}
      <div className="ad-table-card" style={{ opacity: hasRun ? 1 : 0.4, pointerEvents: hasRun ? 'auto' : 'none', transition: '0.5s' }}>
        <div style={{padding: '20px 25px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
          <h3 style={{margin: 0, fontSize: '18px', fontWeight: 900, color: '#0f172a'}}>AI Recommendations Matrix</h3>
        </div>
        <table className="ad-table">
          <thead>
            <tr><th>Team / Project</th><th>Proposed Supervisor</th><th>Match Score</th><th>Status</th><th>Action</th></tr>
          </thead>
          <tbody>
            {allocations.map(alc => (
              <tr key={alc.id}>
                <td>
                  <div className="team-name">{alc.team}</div>
                  <div style={{fontSize: '12px', color: '#64748b'}}>📁 {alc.project}</div>
                  <div className="proj-domain">{alc.domain}</div>
                </td>
                <td style={{fontWeight: 800}}>{alc.supervisor}</td>
                <td>
                  <div className="score-container">
                    <div className="score-text"><span>Confidence</span><span style={{color: getScoreColor(alc.score)}}>{alc.score}%</span></div>
                    <div className="score-track">
                      <div className="score-fill" style={{width: `${alc.score}%`, background: getScoreColor(alc.score)}}></div>
                    </div>
                  </div>
                </td>
                <td><span className={`status-badge ${alc.status === 'Approved' ? 'status-approved' : alc.status === 'Conflict' ? 'status-conflict' : 'status-pending'}`}>{alc.status}</span></td>
                <td>
                  <div className="actions-cell">
                    <button className="btn-icon" title="View AI Reasoning" onClick={() => setSelectedMatch(alc)}>🧠</button>
                    {alc.status === 'Pending' && (
                      <button className="btn-icon approve" title="Approve Match" onClick={() => handleApprove(alc.id)}>✅</button>
                    )}
                    {alc.status === 'Conflict' && (
                      <button className="btn-icon" style={{background: '#eef2ff', color: '#4338ca', borderColor: '#c7d2fe'}} title="Manual Reassign" onClick={() => alert('Opening manual assignment override...')}>✏️</button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 🚀 MODAL: AI Reasoning Details */}
      {selectedMatch && (
        <div className="modal-overlay" onClick={() => setSelectedMatch(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>🧠 AI Decision Breakdown</h2>
              <button className="modal-close" onClick={() => setSelectedMatch(null)}>✕</button>
            </div>
            
            <div className="modal-body">
              <div style={{display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '20px'}}>
                 <div style={{width: '60px', height: '60px', borderRadius: '50%', background: 'rgba(99, 102, 241, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: `3px solid ${getScoreColor(selectedMatch.score)}`}}>
                    <span style={{fontSize: '18px', fontWeight: 900, color: getScoreColor(selectedMatch.score)}}>{selectedMatch.score}%</span>
                 </div>
                 <div>
                   <h3 style={{margin: '0 0 5px 0', fontSize: '18px', color: '#0f172a'}}>{selectedMatch.team} → {selectedMatch.supervisor}</h3>
                   <span className={`status-badge ${selectedMatch.status === 'Approved' ? 'status-approved' : selectedMatch.status === 'Conflict' ? 'status-conflict' : 'status-pending'}`}>{selectedMatch.status}</span>
                 </div>
              </div>

              <div style={{background: '#f8fafc', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0'}}>
                <h4 style={{margin: '0 0 10px 0', fontSize: '12px', color: '#64748b', textTransform: 'uppercase'}}>Algorithm Rationale:</h4>
                <p style={{margin: 0}}>{selectedMatch.reason}</p>
              </div>

              {selectedMatch.status === 'Conflict' && (
                <div style={{marginTop: '15px', padding: '15px', background: '#fff1f2', border: '1px solid #fecaca', borderRadius: '12px', color: '#be123c', fontSize: '13px'}}>
                  <strong>Action Required:</strong> The engine cannot automatically approve this due to hard constraints (e.g., workload limits). Please manually reassign or override capacity rules.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default AIRecommendations;
