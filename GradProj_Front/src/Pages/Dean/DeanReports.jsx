import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * 💡 ملاحظة:
 * تم دمج التنسيقات (CSS) داخل هذا الملف لضمان عمل المعاينة (Preview) بشكل مثالي 
 * ولتجنب خطأ (Could not resolve). تم الحفاظ على الكود كاملاً وإضافة الميزات المطلوبة:
 * (Clickable KPI Cards, Supervisor Hover Card, Auto-Search Redirect).
 */

const premiumReportsStyles = `
  .dean-reports-master {
    padding: 20px 30px 60px 30px;
    font-family: 'Plus Jakarta Sans', -apple-system, sans-serif;
    color: #0f172a;
    animation: fadeInPage 0.5s ease-out;
    text-align: left;
    background: #f8fafc;
    min-height: 100vh;
  }

  @keyframes fadeInPage {
    from { opacity: 0; transform: translateY(15px); }
    to { opacity: 1; transform: translateY(0); }
  }

  /* --- Premium Header --- */
  .dr-header-box {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    margin-bottom: 35px;
    background: white;
    padding: 30px;
    border-radius: 24px;
    border: 1px solid #e2e8f0;
    box-shadow: 0 10px 30px -10px rgba(0,0,0,0.03);
  }

  .dr-kicker { color: #d97706; font-size: 13px; font-weight: 800; text-transform: uppercase; letter-spacing: 1.5px; margin: 0 0 8px 0; display: flex; align-items: center; gap: 8px;}
  .dr-kicker::before { content: ''; display: inline-block; width: 8px; height: 8px; background: #d97706; border-radius: 50%; }
  .dr-title { font-size: 36px; font-weight: 900; margin: 0; color: #0f172a; letter-spacing: -1px; }
  .dr-subtitle { font-size: 15px; color: #64748b; margin: 8px 0 0 0; font-weight: 500; }

  .btn-export-master {
    background: linear-gradient(135deg, #ef4444, #b91c1c);
    color: white;
    border: none;
    padding: 14px 28px;
    border-radius: 14px;
    font-weight: 800;
    font-size: 14px;
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    display: flex;
    align-items: center;
    gap: 10px;
    box-shadow: 0 10px 20px -5px rgba(239, 68, 68, 0.4);
  }
  .btn-export-master:hover { transform: translateY(-3px); box-shadow: 0 15px 25px -5px rgba(239, 68, 68, 0.5); }

  /* --- Executive KPI Grid --- */
  .dr-kpi-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 20px;
    margin-bottom: 35px;
  }

  .dr-kpi-card {
    background: white;
    border: 1px solid #e2e8f0;
    border-radius: 20px;
    padding: 25px;
    position: relative;
    overflow: hidden;
    box-shadow: 0 4px 6px -1px rgba(0,0,0,0.02);
    transition: 0.3s;
    cursor: pointer; /* 💡 تمت إضافة الـ Cursor Pointer */
  }
  .dr-kpi-card:hover { transform: translateY(-5px); box-shadow: 0 15px 30px -5px rgba(0,0,0,0.05); border-color: #cbd5e1; }

  .kpi-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 15px; }
  .kpi-icon { width: 45px; height: 45px; border-radius: 14px; display: flex; align-items: center; justify-content: center; font-size: 20px; }
  .kpi-title { font-size: 12px; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; margin: 0; }
  .kpi-value { font-size: 32px; font-weight: 900; color: #0f172a; margin: 0; line-height: 1.2; }
  .kpi-trend { font-size: 13px; font-weight: 700; display: flex; align-items: center; gap: 5px; margin-top: 10px; }
  
  .trend-up { color: #10b981; }
  .trend-down { color: #ef4444; }
  .trend-neutral { color: #f59e0b; }

  /* --- Advanced Analytics Charts --- */
  .dr-charts-layout {
    display: grid;
    grid-template-columns: 2fr 1fr;
    gap: 30px;
    margin-bottom: 40px;
  }

  .premium-chart-card {
    background: white;
    border: 1px solid #e2e8f0;
    border-radius: 24px;
    padding: 30px;
    box-shadow: 0 10px 20px -5px rgba(0,0,0,0.02);
  }

  .chart-header-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; }
  .chart-header-row h3 { margin: 0; font-size: 18px; font-weight: 900; color: #0f172a; }
  .chart-filter { background: #f8fafc; border: 1px solid #e2e8f0; padding: 8px 15px; border-radius: 10px; font-size: 13px; font-weight: 700; color: #475569; outline: none; cursor: pointer;}

  /* --- Enhanced Tables --- */
  .dr-tables-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 30px;
  }

  .table-card {
    background: white;
    border: 1px solid #e2e8f0;
    border-radius: 24px;
    overflow: hidden;
    box-shadow: 0 4px 6px -1px rgba(0,0,0,0.02);
  }

  .table-card-header {
    background: #ffffff;
    padding: 25px 30px;
    border-bottom: 1px solid #f1f5f9;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .table-card-header h3 { margin: 0; font-size: 18px; font-weight: 900; color: #0f172a; }

  .exec-table { width: 100%; border-collapse: collapse; }
  .exec-table th { padding: 15px 30px; background: #f8fafc; font-size: 11px; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 1px; border-bottom: 1px solid #e2e8f0; text-align: left; }
  .exec-table td { padding: 20px 30px; border-bottom: 1px solid #f1f5f9; font-size: 14px; font-weight: 600; color: #1e293b; vertical-align: middle; }
  .exec-table tr:hover td { background: #fafafa; }
  .exec-table tr:last-child td { border-bottom: none; }

  .progress-wrapper { width: 100%; max-width: 150px; }
  .prog-bar-bg { width: 100%; height: 8px; background: #f1f5f9; border-radius: 4px; overflow: hidden; margin-top: 5px;}
  .prog-bar-fill { height: 100%; border-radius: 4px; }

  .btn-download-sm { 
    background: #f8fafc; color: #0f172a; border: 1px solid #e2e8f0; padding: 8px 15px; border-radius: 10px; font-weight: 800; font-size: 12px; cursor: pointer; transition: 0.2s; display: inline-flex; align-items: center; gap: 8px;
  }
  .btn-download-sm:hover { background: #0f172a; color: white; border-color: #0f172a; transform: translateY(-2px); box-shadow: 0 4px 10px rgba(0,0,0,0.1); }

  /* 💡 NEW: Supervisor Clickable Pill & Hover Card */
  .sup-pill-wrapper { position: relative; display: inline-block; cursor: pointer; margin-top: 6px; }
  .sup-pill { display: inline-flex; align-items: center; gap: 8px; background: #f1f5f9; padding: 4px 10px 4px 4px; border-radius: 20px; font-size: 12px; font-weight: 700; color: #475569; transition: 0.2s; border: 1px solid transparent; }
  .sup-pill-wrapper:hover .sup-pill { background: white; border-color: #cbd5e1; box-shadow: 0 2px 4px rgba(0,0,0,0.05); color: #4f46e5; }
  .sup-avatar { width: 22px; height: 22px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 10px; color: white; font-weight: bold;}

  .smart-hover-card {
    position: absolute; top: 50%; left: calc(100% + 15px); transform: translateY(-50%) translateX(-10px);
    background: white; border: 1px solid #e2e8f0; border-radius: 16px; width: 260px; padding: 20px;
    box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1);
    opacity: 0; visibility: hidden; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); z-index: 100; pointer-events: none;
  }
  .smart-hover-card::after {
    content: ''; position: absolute; top: 50%; left: -6px; transform: translateY(-50%) rotate(45deg);
    width: 12px; height: 12px; background: white; border-left: 1px solid #e2e8f0; border-bottom: 1px solid #e2e8f0;
  }
  .sup-pill-wrapper:hover .smart-hover-card { opacity: 1; visibility: visible; transform: translateY(-50%) translateX(0); }
  
  .hc-header { display: flex; align-items: center; gap: 15px; margin-bottom: 15px; }
  .hc-avatar-lg { width: 45px; height: 45px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 16px; color: white; font-weight: 800; }
  .hc-name { font-size: 15px; font-weight: 900; color: #0f172a; margin: 0 0 2px 0; }
  .hc-role { font-size: 12px; font-weight: 700; color: #64748b; margin: 0; }
  .hc-divider { height: 1px; background: #f1f5f9; margin: 0 0 15px 0; }
  .hc-stats-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
  .hc-stat-box { background: #f8fafc; padding: 10px; border-radius: 10px; border: 1px solid #f1f5f9; text-align: center; }
  .hc-stat-title { font-size: 10px; font-weight: 800; color: #94a3b8; text-transform: uppercase; margin-bottom: 4px; }
  .hc-stat-value { font-size: 16px; font-weight: 900; color: #0f172a; }

  /* 💡 ميزة التصدير السحرية PDF مع إخفاء الكروت التفاعلية أثناء الطباعة */
  @media print {
    .sidebar-wrapper, .top-header, .btn-export-master, .btn-download-sm, .chart-filter, .smart-hover-card { 
      display: none !important; 
    }
    .dean-reports-master { padding: 0; background: white; min-height: auto; }
    .dr-header-box { border: none; box-shadow: none; padding: 0; margin-bottom: 40px; text-align: center; display: block; background: transparent; }
    .dr-title { font-size: 28px; }
    .dr-kpi-grid { grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 30px; }
    .dr-kpi-card { border: 1px solid #eee; box-shadow: none; padding: 15px; }
    .dr-charts-layout { grid-template-columns: 1fr; gap: 20px; margin-bottom: 30px; }
    .premium-chart-card, .table-card { border: 1px solid #eee; box-shadow: none; break-inside: avoid; padding: 20px; border-radius: 0; }
    .exec-table th { background: #f8fafc !important; color: black; border-bottom: 2px solid #ddd; }
    .exec-table td { border-bottom: 1px solid #eee; }
    body { background: white !important; -webkit-print-color-adjust: exact; }
  }
`;

const DeanReports = () => {
  const navigate = useNavigate();

  // 💡 بيانات إضافية للمشرفين (Hover Cards)
  const supervisorDetails = {
    'Dr. Khaled Rami': { role: 'Head of Software Eng.', rating: '4.8', activeProj: 8, color: '#3b82f6' },
    'Dr. Sarah Ahmad': { role: 'Head of AI', rating: '4.9', activeProj: 5, color: '#ec4899' },
    'Dr. Mona Zaid': { role: 'Head of Cybersecurity', rating: '4.6', activeProj: 4, color: '#8b5cf6' },
  };

  // Expanded Mock Data suitable for a Dean
  const departmentReports = [
    { id: 'DEP-01', name: 'Software Engineering', head: 'Dr. Khaled Rami', score: 92, completion: 95, projects: 20, status: 'Excellent' },
    { id: 'DEP-02', name: 'Artificial Intelligence', head: 'Dr. Sarah Ahmad', score: 88, completion: 82, projects: 14, status: 'Good' },
    { id: 'DEP-03', name: 'Cybersecurity', head: 'Dr. Mona Zaid', score: 76, completion: 60, projects: 8, status: 'Needs Attention' },
  ];

  const topSupervisors = [
    { name: 'Dr. Ahmad Ali', dept: 'Software Eng.', projects: 4, rating: 4.9 },
    { name: 'Dr. Omar Zaid', dept: 'Cybersecurity', projects: 3, rating: 4.7 },
  ];

  // دالة تحميل التقرير (محتفظ بها كما طلبت تماماً دون حذف)
  const handleDownloadReport = (fileName) => {
    const content = `=================================================\nDEAN OFFICE - FACULTY OF IT\nOFFICIAL PERFORMANCE REPORT\n=================================================\n\nReport Subject: ${fileName}\nGenerated Date: ${new Date().toLocaleString()}\nStatus: CONFIDENTIAL\n\n-------------------------------------------------\nSUMMARY OF METRICS:\n- Overall Faculty Performance: 88.4%\n- Milestone Completion Rate: 92%\n- At-Risk Projects: 3\n\nSystem Generated via GP Portal.`;
    
    const blob = new Blob(['\uFEFF' + content], { type: 'text/plain;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${fileName.replace(/\s+/g, '_')}_Analytics_2026.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="dean-reports-master">
      <style>{premiumReportsStyles}</style>

      {/* 1. Master Header */}
      <div className="dr-header-box">
        <div>
          <p className="dr-kicker">Analytics & Intelligence Hub</p>
          <h1 className="dr-title">Executive Faculty Reports</h1>
          <p className="dr-subtitle">Comprehensive data, trends, and evaluations across all IT departments.</p>
        </div>
        <button className="btn-export-master" onClick={() => window.print()}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="12" y1="18" x2="12" y2="12"></line><line x1="9" y1="15" x2="15" y2="15"></line></svg>
          Export Master PDF Report
        </button>
      </div>

      {/* 2. Executive KPIs (4 Cards) */}
      <div className="dr-kpi-grid">
        {/* 💡 كبسات الإحصائيات مربوطة بالتوجيه */}
        <div className="dr-kpi-card" onClick={() => navigate('/dean/supervisors')}>
          <div className="kpi-header">
            <h4 className="kpi-title">Faculty Performance</h4>
            <div className="kpi-icon" style={{background: '#e0e7ff', color: '#4f46e5'}}>📈</div>
          </div>
          <h2 className="kpi-value">88.4<span style={{fontSize:'18px', color:'#94a3b8'}}>%</span></h2>
          <div className="kpi-trend trend-up">↑ +2.4% vs last year</div>
        </div>

        <div className="dr-kpi-card" onClick={() => navigate('/dean/projects')}>
          <div className="kpi-header">
            <h4 className="kpi-title">Milestone Completion</h4>
            <div className="kpi-icon" style={{background: '#d1fae5', color: '#059669'}}>⏱️</div>
          </div>
          <h2 className="kpi-value">92.0<span style={{fontSize:'18px', color:'#94a3b8'}}>%</span></h2>
          <div className="kpi-trend trend-up">↑ On Track</div>
        </div>

        <div className="dr-kpi-card" onClick={() => navigate('/dean/projects')}>
          <div className="kpi-header">
            <h4 className="kpi-title">Critical / At Risk</h4>
            <div className="kpi-icon" style={{background: '#fee2e2', color: '#ef4444'}}>⚠️</div>
          </div>
          <h2 className="kpi-value">3 <span style={{fontSize:'16px', color:'#64748b', fontWeight: 600}}>Projects</span></h2>
          <div className="kpi-trend trend-down">↓ Needs Intervention</div>
        </div>

        <div className="dr-kpi-card" onClick={() => navigate('/dean/supervisors')}>
          <div className="kpi-header">
            <h4 className="kpi-title">Supervisor Engagement</h4>
            <div className="kpi-icon" style={{background: '#fef3c7', color: '#d97706'}}>👨‍🏫</div>
          </div>
          <h2 className="kpi-value">98<span style={{fontSize:'18px', color:'#94a3b8'}}>%</span></h2>
          <div className="kpi-trend trend-neutral">→ High Activity Rate</div>
        </div>
      </div>

      {/* 3. Advanced SVG Charts Section */}
      <div className="dr-charts-layout">
        
        {/* Beautiful Area Chart for Trends */}
        <div className="premium-chart-card">
          <div className="chart-header-row">
            <h3>5-Year Performance Trend</h3>
            <select className="chart-filter">
              <option>All Departments</option>
              <option>Software Eng.</option>
              <option>AI / ML</option>
            </select>
          </div>
          
          <div style={{ width: '100%', height: '250px', position: 'relative' }}>
            <svg viewBox="0 0 600 250" width="100%" height="100%" preserveAspectRatio="none">
              <defs>
                <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#4f46e5" stopOpacity="0.3"/>
                  <stop offset="100%" stopColor="#4f46e5" stopOpacity="0"/>
                </linearGradient>
                <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#8b5cf6"/>
                  <stop offset="100%" stopColor="#4f46e5"/>
                </linearGradient>
              </defs>

              {/* Grid Lines */}
              <line x1="40" y1="50" x2="580" y2="50" stroke="#f1f5f9" strokeWidth="1"/>
              <line x1="40" y1="100" x2="580" y2="100" stroke="#f1f5f9" strokeWidth="1"/>
              <line x1="40" y1="150" x2="580" y2="150" stroke="#f1f5f9" strokeWidth="1"/>
              <line x1="40" y1="200" x2="580" y2="200" stroke="#cbd5e1" strokeWidth="2"/>

              {/* Y Axis */}
              <text x="30" y="55" fontSize="11" fill="#94a3b8" textAnchor="end" fontWeight="800">90</text>
              <text x="30" y="105" fontSize="11" fill="#94a3b8" textAnchor="end" fontWeight="800">80</text>
              <text x="30" y="155" fontSize="11" fill="#94a3b8" textAnchor="end" fontWeight="800">70</text>

              {/* X Axis */}
              <text x="80" y="225" fontSize="12" fill="#64748b" textAnchor="middle" fontWeight="800">2022</text>
              <text x="200" y="225" fontSize="12" fill="#64748b" textAnchor="middle" fontWeight="800">2023</text>
              <text x="320" y="225" fontSize="12" fill="#64748b" textAnchor="middle" fontWeight="800">2024</text>
              <text x="440" y="225" fontSize="12" fill="#64748b" textAnchor="middle" fontWeight="800">2025</text>
              <text x="560" y="225" fontSize="12" fill="#0f172a" textAnchor="middle" fontWeight="900">2026</text>

              {/* Data Path (Area) */}
              <path d="M 80 160 C 140 160, 140 110, 200 110 C 260 110, 260 130, 320 130 C 380 130, 380 70, 440 70 C 500 70, 500 40, 560 40 L 560 200 L 80 200 Z" fill="url(#areaGradient)" />
              
              {/* Data Path (Line) */}
              <path d="M 80 160 C 140 160, 140 110, 200 110 C 260 110, 260 130, 320 130 C 380 130, 380 70, 440 70 C 500 70, 500 40, 560 40" fill="none" stroke="url(#lineGradient)" strokeWidth="4" strokeLinecap="round" />

              {/* Data Points */}
              <circle cx="80" cy="160" r="5" fill="white" stroke="#4f46e5" strokeWidth="3" />
              <circle cx="200" cy="110" r="5" fill="white" stroke="#4f46e5" strokeWidth="3" />
              <circle cx="320" cy="130" r="5" fill="white" stroke="#4f46e5" strokeWidth="3" />
              <circle cx="440" cy="70" r="5" fill="white" stroke="#4f46e5" strokeWidth="3" />
              <circle cx="560" cy="40" r="6" fill="#4f46e5" stroke="white" strokeWidth="3" />
            </svg>
          </div>
        </div>

        {/* Status Distribution (Stacked Progress) */}
        <div className="premium-chart-card">
          <div className="chart-header-row">
            <h3>Project Status Distribution</h3>
          </div>
          
          <div style={{marginTop: '20px'}}>
             {/* Total Projects */}
             <div style={{display:'flex', justifyContent:'space-between', marginBottom:'10px'}}>
                <span style={{fontWeight: 800, color: '#0f172a'}}>All Projects (42)</span>
             </div>
             
             {/* Large Stacked Bar */}
             <div style={{width: '100%', height: '30px', borderRadius: '15px', display: 'flex', overflow: 'hidden', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.1)'}}>
                <div style={{width: '65%', background: '#10b981', display:'flex', alignItems:'center', justifyContent:'center', color:'white', fontWeight:800, fontSize:'12px'}} title="Completed">65%</div>
                <div style={{width: '25%', background: '#f59e0b', display:'flex', alignItems:'center', justifyContent:'center', color:'white', fontWeight:800, fontSize:'12px'}} title="In Progress">25%</div>
                <div style={{width: '10%', background: '#ef4444', display:'flex', alignItems:'center', justifyContent:'center', color:'white', fontWeight:800, fontSize:'12px'}} title="At Risk">10%</div>
             </div>

             {/* Legend */}
             <div style={{display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '30px'}}>
                <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                   <div style={{display:'flex', alignItems:'center', gap:'10px'}}><div style={{width:'12px', height:'12px', borderRadius:'4px', background:'#10b981'}}></div><span style={{fontWeight:700, color:'#475569'}}>Completed successfully</span></div>
                   <span style={{fontWeight:900, color:'#0f172a'}}>27</span>
                </div>
                <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                   <div style={{display:'flex', alignItems:'center', gap:'10px'}}><div style={{width:'12px', height:'12px', borderRadius:'4px', background:'#f59e0b'}}></div><span style={{fontWeight:700, color:'#475569'}}>Active & On Track</span></div>
                   <span style={{fontWeight:900, color:'#0f172a'}}>12</span>
                </div>
                <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                   <div style={{display:'flex', alignItems:'center', gap:'10px'}}><div style={{width:'12px', height:'12px', borderRadius:'4px', background:'#ef4444'}}></div><span style={{fontWeight:700, color:'#475569'}}>At Risk / Delayed</span></div>
                   <span style={{fontWeight:900, color:'#0f172a'}}>3</span>
                </div>
             </div>
          </div>
        </div>

      </div>

      {/* 4. Detailed Data Tables */}
      <div className="dr-tables-grid">
        
        {/* Department Reports Table */}
        <div className="table-card">
          <div className="table-card-header">
            <h3>Department Evaluation Reports</h3>
            <button className="btn-download-sm" onClick={() => window.print()}>
              ⬇ Download All
            </button>
          </div>
          <table className="exec-table">
            <thead>
              <tr>
                <th>Department / Head</th>
                <th>Projects Handled</th>
                <th>Completion Rate</th>
                <th>Avg. Evaluation Score</th>
                <th>Status</th>
                <th>Report</th>
              </tr>
            </thead>
            <tbody>
              {departmentReports.map(dept => {
                const supInfo = supervisorDetails[dept.head] || { role: 'Head of Dept', rating: 'N/A', activeProj: 0, color: '#0f172a' };
                const initials = dept.head.split(' ')[1]?.charAt(0) + (dept.head.split(' ')[2]?.charAt(0) || '');

                return (
                <tr key={dept.id}>
                  <td>
                    <div style={{fontWeight: 900, color: '#0f172a', fontSize: '15px', marginBottom: '4px'}}>{dept.name}</div>
                    
                    {/* 💡 Hover Card and Clickable Supervisor Pill in Table */}
                    <div className="sup-pill-wrapper">
                      <div className="sup-pill" onClick={() => navigate('/dean/supervisors', { state: { targetSup: dept.head } })}>
                        <div className="sup-avatar" style={{background: supInfo.color}}>{initials}</div>
                        {dept.head}
                      </div>
                      
                      <div className="smart-hover-card">
                         <div className="hc-header">
                            <div className="hc-avatar-lg" style={{background: supInfo.color}}>{initials}</div>
                            <div>
                              <h4 className="hc-name">{dept.head}</h4>
                              <p className="hc-role">{supInfo.role}</p>
                            </div>
                         </div>
                         <div className="hc-divider"></div>
                         <div className="hc-stats-grid">
                            <div className="hc-stat-box">
                               <div className="hc-stat-title">Active Proj.</div>
                               <div className="hc-stat-value">{supInfo.activeProj}</div>
                            </div>
                            <div className="hc-stat-box">
                               <div className="hc-stat-title">Rating</div>
                               <div className="hc-stat-value" style={{color: '#d97706'}}>⭐ {supInfo.rating}</div>
                            </div>
                         </div>
                      </div>
                    </div>

                  </td>
                  <td style={{fontWeight: 800}}>{dept.projects}</td>
                  <td>
                    <div className="progress-wrapper">
                      <div style={{display:'flex', justifyContent:'space-between', fontSize:'12px', fontWeight:800, marginBottom:'4px'}}>
                         <span>Rate</span><span>{dept.completion}%</span>
                      </div>
                      <div className="prog-bar-bg">
                         <div className="prog-bar-fill" style={{width: `${dept.completion}%`, background: dept.completion > 80 ? '#10b981' : '#f59e0b'}}></div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span style={{background: '#f8fafc', border: '1px solid #e2e8f0', padding: '6px 12px', borderRadius: '8px', fontWeight: 900, color: '#0f172a'}}>
                      {dept.score} / 100
                    </span>
                  </td>
                  <td>
                    <span style={{
                      padding: '6px 12px', borderRadius: '8px', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase',
                      background: dept.status === 'Excellent' ? '#d1fae5' : dept.status === 'Good' ? '#e0e7ff' : '#fee2e2',
                      color: dept.status === 'Excellent' ? '#059669' : dept.status === 'Good' ? '#4f46e5' : '#ef4444'
                    }}>
                      {dept.status}
                    </span>
                  </td>
                  <td>
                    <button className="btn-download-sm" onClick={() => window.print()}>
                      ⬇ Get PDF
                    </button>
                  </td>
                </tr>
              )})}
            </tbody>
          </table>
        </div>

      </div>

    </div>
  );
};

export default DeanReports;