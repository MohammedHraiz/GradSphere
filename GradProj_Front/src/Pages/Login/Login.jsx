import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../auth/AuthContext';
import { apiClient } from '../../api/apiClient';
import { useNavigate } from 'react-router-dom';

/**
 * 💡 Premium Master Master Master - Cyber Login
 * Features: 
 * - Relative Eye-tracking Mascot (Follows cursor relative to its own position)
 * - Mascot dynamically attached to the Login Panel (Moves with the card)
 * - Blindfold interaction (Covers eyes when password is shown)
 * - Standard Eye / Eye-slash toggle
 * - Layered Glassmorphism Panels
 * - Perfect Center Alignment
 */

const loginStyles = `
  .login-page-container {
    width: 100vw;
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background: #020617;
    font-family: 'Plus Jakarta Sans', sans-serif;
    position: relative;
    overflow-x: hidden;
    color: white;
  }

  /* --- Ambient Background --- */
  .bg-glow { position: absolute; width: 600px; height: 600px; background: radial-gradient(circle, rgba(59, 130, 246, 0.15) 0%, transparent 70%); border-radius: 50%; filter: blur(60px); z-index: 0; animation: pulseGlow 8s infinite alternate; }
  .glow-top { top: -200px; right: -100px; background: radial-gradient(circle, rgba(6, 182, 212, 0.2) 0%, transparent 70%); }
  .glow-bottom { bottom: -200px; left: -100px; background: radial-gradient(circle, rgba(139, 92, 246, 0.15) 0%, transparent 70%); animation-delay: -4s; }

  @keyframes pulseGlow {
    0% { transform: scale(1); opacity: 0.8; }
    100% { transform: scale(1.1); opacity: 1; }
  }

  /* --- Mascot Container --- */
  .mascot-container {
    position: absolute;
    top: -110px;
    left: 50%;
    transform: translateX(-50%);
    width: 150px;
    height: 150px;
    z-index: 30;
    display: flex;
    justify-content: center;
  }

  /* --- Layered Cards Logic --- */
  .cards-stack {
    position: relative;
    width: 420px;
    height: 520px;
    z-index: 10;
    margin-top: 80px; /* Space for the attached mascot */
  }

  .panel {
    position: absolute;
    inset: 0;
    background: rgba(15, 23, 42, 0.7);
    backdrop-filter: blur(24px);
    -webkit-backdrop-filter: blur(24px);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 32px;
    padding: 40px;
    display: flex;
    flex-direction: column;
    transition: all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
  }

  .panel-front { transform: translate(0, 0) scale(1); z-index: 20; opacity: 1; pointer-events: auto; }
  .panel-back-right { transform: translate(40px, 15px) scale(0.92); z-index: 5; opacity: 0.4; pointer-events: none; cursor: pointer; }
  .panel-back-left { transform: translate(-40px, 15px) scale(0.92); z-index: 5; opacity: 0.4; pointer-events: none; cursor: pointer; }

  .panel-back-right:hover, .panel-back-left:hover { opacity: 0.7; transform: translate(calc(var(--translate-x) * 1.1), 10px) scale(0.94); }

  /* --- Form Styling --- */
  .panel-title { font-size: 28px; font-weight: 900; margin: 10px 0 5px 0; text-align: center; background: linear-gradient(to right, #fff, #94a3b8); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
  .panel-subtitle { font-size: 14px; color: #64748b; text-align: center; margin-bottom: 35px; font-weight: 500; }

  .input-box { margin-bottom: 25px; position: relative; text-align: left; }
  .input-label { display: block; font-size: 11px; font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px; padding-left: 5px;}
  .input-field { width: 100%; padding: 15px 18px; background: rgba(30, 41, 59, 0.6); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 14px; color: white; font-size: 14px; font-weight: 600; outline: none; transition: 0.3s; box-sizing: border-box; font-family: inherit;}
  .input-field:focus { border-color: #06b6d4; background: rgba(30, 41, 59, 0.9); box-shadow: 0 0 0 4px rgba(6, 182, 212, 0.15); }
  .input-field::placeholder { color: #475569; }

  /* Standard Eye Icon Button */
  .pass-toggle { position: absolute; right: 15px; top: 36px; background: none; border: none; color: #64748b; cursor: pointer; transition: 0.2s; z-index: 10; padding: 5px; display: flex; align-items: center; justify-content: center;}
  .pass-toggle:hover { color: #06b6d4; }

  .btn-submit { width: 100%; padding: 16px; background: linear-gradient(135deg, #06b6d4, #3b82f6); color: white; border: none; border-radius: 16px; font-weight: 800; font-size: 15px; cursor: pointer; transition: 0.3s; margin-top: 10px; box-shadow: 0 10px 20px -5px rgba(6, 182, 212, 0.4); display: flex; align-items: center; justify-content: center;}
  .btn-submit:hover { transform: translateY(-2px); box-shadow: 0 15px 30px -5px rgba(6, 182, 212, 0.6); }
  .btn-submit:disabled { opacity: 0.7; cursor: not-allowed; transform: none; }

  /* --- Dev Quick Access --- */
  .dev-pills { margin-top: 50px; display: flex; flex-wrap: wrap; gap: 10px; justify-content: center; z-index: 20; max-width: 600px; padding: 0 20px; }
  .pill { padding: 8px 18px; background: rgba(30, 41, 59, 0.4); border: 1px solid rgba(255, 255, 255, 0.05); border-radius: 50px; color: #94a3b8; font-size: 12px; font-weight: 700; cursor: pointer; transition: 0.2s; display: flex; align-items: center; gap: 8px; }
  .pill:hover { background: rgba(255, 255, 255, 0.1); color: white; border-color: #06b6d4; transform: translateY(-2px); }
  .pill span { font-size: 16px; }

  .spinner { width: 20px; height: 20px; border: 3px solid rgba(255,255,255,0.3); border-top-color: white; border-radius: 50%; animation: spin 1s linear infinite; }
  @keyframes spin { to { transform: rotate(360deg); } }
`;

// ==========================================
// 🤖 Smart Cyber Mascot (Relative Eye Tracking & Blindfold)
// ==========================================
const SmartMascot = ({ isHiding, mousePos }) => {
  // 💡 التتبع صار مبني على الزاوية والمسافة بالنسبة لمركز الروبوت نفسه
  const pupilOffsetX = isHiding ? 0 : mousePos.x * 8;
  const pupilOffsetY = isHiding ? 0 : mousePos.y * 8;

  return (
    <svg viewBox="0 0 200 200" width="100%" height="100%" style={{ overflow: 'visible', pointerEvents: 'none' }}>
      {/* Antenna */}
      <line x1="100" y1="30" x2="100" y2="50" stroke="#334155" strokeWidth="4" />
      <circle cx="100" cy="30" r="6" fill={isHiding ? "#ef4444" : "#06b6d4"}>
        <animate attributeName="opacity" values="1;0.4;1" dur="2s" repeatCount="indefinite" />
      </circle>

      {/* Main Head Base */}
      <rect x="40" y="50" width="120" height="100" rx="24" fill="#1e293b" stroke="#334155" strokeWidth="3" />
      
      {/* Face Screen */}
      <rect x="50" y="60" width="100" height="80" rx="16" fill="#0f172a" />

      {/* Eye Sockets */}
      <circle cx="75" cy="95" r="14" fill="#020617" />
      <circle cx="125" cy="95" r="14" fill="#020617" />

      {/* Pupils (Tracking Mouse Globally but mapped relative to Mascot) */}
      <circle 
        cx={75 + pupilOffsetX} 
        cy={95 + pupilOffsetY} 
        r="5" 
        fill="#06b6d4" 
        style={{ transition: 'cx 0.1s ease-out, cy 0.1s ease-out' }}
      />
      <circle 
        cx={125 + pupilOffsetX} 
        cy={95 + pupilOffsetY} 
        r="5" 
        fill="#06b6d4" 
        style={{ transition: 'cx 0.1s ease-out, cy 0.1s ease-out' }}
      />

      {/* Robot Mouth / Status Line */}
      <rect 
        x="90" y="120" width="20" height="3" rx="1.5" 
        fill={isHiding ? "#ef4444" : "#06b6d4"} 
        opacity="0.6" 
      />

      {/* Hands / Blindfold Interaction */}
      <g>
        {/* Left Hand */}
        <rect
          x={isHiding ? 50 : 20}
          y={isHiding ? 80 : 130}
          width="45"
          height="30"
          rx="15"
          fill="#3b82f6"
          stroke="#2563eb"
          strokeWidth="2"
          style={{ 
            transition: 'all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)',
            transformOrigin: '50px 130px',
            transform: isHiding ? 'rotate(15deg)' : 'rotate(-20deg)'
          }}
        />
        
        {/* Right Hand */}
        <rect
          x={isHiding ? 105 : 135}
          y={isHiding ? 80 : 130}
          width="45"
          height="30"
          rx="15"
          fill="#3b82f6"
          stroke="#2563eb"
          strokeWidth="2"
          style={{ 
            transition: 'all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)',
            transformOrigin: '150px 130px',
            transform: isHiding ? 'rotate(-15deg)' : 'rotate(20deg)'
          }}
        />
      </g>
    </svg>
  );
};

// ==========================================
// 👁️ Standard Icons
// ==========================================
const EyeIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
    <circle cx="12" cy="12" r="3"></circle>
  </svg>
);

const EyeOffIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
    <line x1="1" y1="1" x2="23" y2="23"></line>
  </svg>
);

// ==========================================
// 🚀 Main Login Component
// ==========================================
const Login = () => {
  const navigate = useNavigate();
  const [isForgotMode, setIsForgotMode] = useState(false);
  const [isOtpMode, setIsOtpMode] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [otpError, setOtpError] = useState('');
  const [otpSuccess, setOtpSuccess] = useState('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [redirectCountdown, setRedirectCountdown] = useState(3);
  
  // Mouse tracking state for the Mascot
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  
  // OTP flow states
  const [otpEmail, setOtpEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [otpStep, setOtpStep] = useState(1); // 1: request OTP, 2: verify and set password
  const [showOtpPass, setShowOtpPass] = useState(false);
  
  // Ref لمعرفة مكان الروبوت على الشاشة بدقة
  const mascotRef = useRef(null);

  const { login } = useAuth();

  const loginAsRole = (role) => {
    // Mock JWT token for development (dev-only bypass for testing)
    const mockToken = 'dev-jwt-token-' + role + '-' + Date.now();
    login({ 
      token: mockToken,
      user: { userName: 'Developer', role }, 
      role 
    });
  };

  // 💡 السحر الفعلي: تتبع الماوس بناءً على موقع الروبوت نفسه
  useEffect(() => {
    const handleGlobalMouseMove = (e) => {
      if (!mascotRef.current) return;
      
      const rect = mascotRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      const deltaX = e.clientX - centerX;
      const deltaY = e.clientY - centerY;

      // حساب المسافة عشان الحركة تكون طبيعية ومش مبالغ فيها
      const maxDist = Math.max(window.innerWidth, window.innerHeight) / 2;
      const distance = Math.min(Math.sqrt(deltaX * deltaX + deltaY * deltaY), maxDist);
      const ratio = distance / maxDist;

      // حساب الزاوية اللي بتوجه الماوس
      const angle = Math.atan2(deltaY, deltaX);

      setMousePos({ 
        x: Math.cos(angle) * ratio, 
        y: Math.sin(angle) * ratio 
      });
    };

    window.addEventListener('mousemove', handleGlobalMouseMove);
    return () => window.removeEventListener('mousemove', handleGlobalMouseMove);
  }, []);

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLoginError('');
    setIsLoading(true);

    try {
      const { data: payload } = await apiClient.post('/v1/auth/login', {
        email: email.trim(),
        password,
      });

      const backendRole = (
        payload?.role ||
        payload?.user?.role ||
        (Array.isArray(payload?.roles) ? payload.roles[0] : null) ||
        (Array.isArray(payload?.authorities) ? payload.authorities[0] : null) ||
        'STUDENT'
      );

      const normalizedRole = String(backendRole)
        .replace(/^ROLE_/i, '')
        .toLowerCase();

      const userInfo = {
        ...payload,
        userName:
          payload?.userName ||
          payload?.username ||
          payload?.name ||
          payload?.user?.userName ||
          payload?.user?.username ||
          payload?.user?.name ||
          email.trim().split('@')[0],
        email: email.trim(),
        role: normalizedRole,
      };

      const token = payload?.token || payload?.accessToken || payload?.jwt || payload?.data?.token || null;

      if (!token) {
        setLoginError('Login succeeded but no access token was returned. Please contact support.');
        return;
      }

      login({ token, user: userInfo, role: userInfo.role });

      const routeRole = normalizedRole.replace(/[^a-z]/g, '');
      if (routeRole === 'student') {
        navigate('/student/overview', { replace: true });
      } else if (routeRole === 'supervisor') {
        navigate('/supervisor/dashboard', { replace: true });
      } else if (routeRole === 'deanoffice' || routeRole === 'dean') {
        navigate('/dean/dashboard', { replace: true });
      } else if (routeRole === 'admin') {
        navigate('/admin/dashboard', { replace: true });
      } else {
        navigate('/', { replace: true });
      }
    } catch (err) {
      const status = err?.status || err?.response?.status;
      if (status === 401) {
        setLoginError('Invalid email or password.');
      } else {
        setLoginError(err?.message || 'Login failed. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetSubmit = (e) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      alert('Recovery link sent to your email!');
      setIsForgotMode(false);
    }, 1500);
  };

  // OTP FLOW HANDLERS
  const handleRequestOtp = async (e) => {
    e.preventDefault();
    setOtpError('');
    setOtpSuccess('');

    if (!otpEmail.trim()) {
      setOtpError('Please enter your university email.');
      return;
    }

    setIsLoading(true);

    try {
      const { data: payload } = await apiClient.post('/v1/auth/request-otp', { email: otpEmail.trim() });

      setOtpSuccess(payload.message || 'OTP sent successfully. Please check your email.');
      setOtpStep(2);
    } catch (err) {
      setOtpError(err?.message || 'Could not connect to the server. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtpAndSetPassword = async (e) => {
    e.preventDefault();
    setOtpError('');
    setOtpSuccess('');

    if (!otp.trim() || !newPassword.trim() || !confirmPassword.trim()) {
      setOtpError('Please fill in all fields.');
      return;
    }

    if (!/^\d{6}$/.test(otp.trim())) {
      setOtpError('OTP must be exactly 6 digits.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setOtpError('Passwords do not match.');
      return;
    }

    if (newPassword.length < 8) {
      setOtpError('Password must be at least 8 characters.');
      return;
    }

    setIsLoading(true);

    try {
      await apiClient.post('/v1/auth/setup-password', {
        email: otpEmail.trim(),
        otp: otp.trim(),
        password: newPassword,
      });

      // Success: show modal and start countdown
      setOtpSuccess('Password has been set successfully!');
      setShowSuccessModal(true);
      setRedirectCountdown(3);
    } catch (err) {
      const status = err?.status || err?.response?.status;
      const payload = err?.response?.data || {};
      if (status === 404) {
        setOtpError('This email is not registered by the admin.');
      } else if (status === 400) {
        const msg = payload?.message || err?.message || '';
        if (msg.includes('Invalid OTP')) {
          setOtpError('The code you entered is incorrect.');
        } else if (msg.includes('Expired OTP')) {
          setOtpError('This code has expired. Please request a new one.');
        } else {
          setOtpError(msg || 'Verification failed. Please check OTP and try again.');
        }
      } else {
        setOtpError(err?.message || 'Verification failed. Please check OTP and try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-redirect after successful password setup
  useEffect(() => {
    if (!showSuccessModal) return;

    const interval = setInterval(() => {
      setRedirectCountdown((prev) => prev - 1);
    }, 1000);

    const timeout = setTimeout(() => {
      clearInterval(interval);
      setShowSuccessModal(false);
      setIsOtpMode(false);
      setOtpStep(1);
      setOtpEmail('');
      setOtp('');
      setNewPassword('');
      setConfirmPassword('');
      setShowOtpPass(false);
      setOtpError('');
      setOtpSuccess('');
    }, 3000);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [showSuccessModal]);

  const goBackToLogin = (e) => {
    e.stopPropagation();
    setIsOtpMode(false);
    setIsForgotMode(false);
    setOtpStep(1);
    setOtpError('');
    setOtpSuccess('');
    setOtp('');
    setNewPassword('');
    setConfirmPassword('');
    setShowOtpPass(false);
    setShowSuccessModal(false);
    setOtpEmail('');
  };

  return (
    <div className="login-page-container">
      <style>{loginStyles}</style>

      {/* Ambient Glow */}
      <div className="bg-glow glow-top"></div>
      <div className="bg-glow glow-bottom"></div>

      <div className="cards-stack">
        {!isOtpMode && (
        <>
        {/* ================================================= */}
        {/* PANEL 1: LOGIN (Front by default)                 */}
        {/* ================================================= */}
        <div 
          className={`panel ${!isForgotMode ? 'panel-front' : 'panel-back-right'}`} 
          style={{ '--translate-x': '40px' }}
          onClick={() => isForgotMode && setIsForgotMode(false)}
        >
          {/* 🤖 The Smart Mascot - Tracks globally, hides eyes on showPass */}
          <div className="mascot-container" ref={mascotRef}>
            <SmartMascot isHiding={showPass} mousePos={mousePos} />
          </div>

          <h1 className="panel-title" style={{marginTop: '30px'}}>Welcome Back</h1>
          <p className="panel-subtitle">Sign in to your secure workspace</p>

          <form onSubmit={handleLoginSubmit} style={{flexGrow: 1, display: 'flex', flexDirection: 'column'}}>
            <div className="input-box">
              <label className="input-label">University Email</label>
              <input 
                type="email" className="input-field" placeholder="id@student.bau.edu" 
                value={email} onChange={(e) => { setEmail(e.target.value); if (loginError) setLoginError(''); }} required 
                disabled={isForgotMode || isOtpMode} tabIndex={!isForgotMode && !isOtpMode ? 1 : -1}
              />
            </div>

            <div className="input-box">
              <label className="input-label">Security Key (Password)</label>
              <input 
                type={showPass ? "text" : "password"} className="input-field" placeholder="••••••••" 
                value={password} onChange={(e) => { setPassword(e.target.value); if (loginError) setLoginError(''); }} required 
                disabled={isForgotMode || isOtpMode} tabIndex={!isForgotMode && !isOtpMode ? 2 : -1}
              />
              <button 
                type="button" className="pass-toggle" 
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowPass(!showPass); }}
                tabIndex={!isForgotMode && !isOtpMode ? 3 : -1}
                title={showPass ? "Hide Password" : "Show Password"}
              >
                {showPass ? <EyeIcon /> : <EyeOffIcon />}
              </button>
            </div>

            {loginError && (
              <div style={{
                marginTop: '-6px',
                marginBottom: '12px',
                borderRadius: '12px',
                border: '1px solid rgba(248, 113, 113, 0.35)',
                background: 'rgba(239, 68, 68, 0.12)',
                color: '#fca5a5',
                padding: '10px 12px',
                fontSize: '13px',
                fontWeight: 700,
              }}>
                {loginError}
              </div>
            )}

            <div style={{marginTop: 'auto'}}>
              <button type="submit" className="btn-submit" disabled={isLoading || isForgotMode || isOtpMode} tabIndex={!isForgotMode && !isOtpMode ? 4 : -1}>
                {isLoading ? <div className="spinner"></div> : "ACCESS PORTAL"}
              </button>

              <div style={{textAlign: 'center', marginTop: '20px'}}>
                <span 
                  style={{color: '#06b6d4', fontSize: '13px', fontWeight: 700, cursor: 'pointer'}}
                  onClick={(e) => { e.stopPropagation(); setIsForgotMode(true); }}
                  tabIndex={!isForgotMode ? 5 : -1}
                >
                  Forgot Security Key?
                </span>
                <span style={{color: '#64748b', margin: '0 10px'}}>|</span>
                <span 
                  style={{color: '#06b6d4', fontSize: '13px', fontWeight: 700, cursor: 'pointer'}}
                  onClick={(e) => { e.stopPropagation(); setOtpError(''); setOtpSuccess(''); setOtpStep(1); setIsOtpMode(true); }}
                  tabIndex={!isForgotMode ? 6 : -1}
                >
                  Set Password via OTP
                </span>
              </div>
            </div>
          </form>
        </div>

        {/* ================================================= */}
        {/* PANEL 2: FORGOT PASSWORD (Back by default)        */}
        {/* ================================================= */}
        <div 
          className={`panel ${isForgotMode ? 'panel-front' : 'panel-back-left'}`}
          style={{ '--translate-x': '-40px' }}
          onClick={() => !isForgotMode && setIsForgotMode(true)}
        >
          <h1 className="panel-title" style={{background: 'linear-gradient(to right, #fff, #c084fc)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginTop: '30px'}}>Reset Access</h1>
          <p className="panel-subtitle">We'll send recovery instructions</p>

          <form onSubmit={handleResetSubmit} style={{flexGrow: 1, display: 'flex', flexDirection: 'column'}}>
            <div className="input-box">
              <label className="input-label">Registered Email</label>
              <input 
                type="email" className="input-field" placeholder="Enter your university email" 
                required disabled={!isForgotMode} tabIndex={isForgotMode && !isOtpMode ? 1 : -1} 
              />
            </div>

            <div style={{background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.2)', padding: '15px', borderRadius: '12px', margin: 'auto 0'}}>
               <p style={{margin: 0, fontSize: '12px', color: '#93c5fd', lineHeight: 1.5}}>
                 If you lost access to your university email, please contact the IT Support Desk directly for manual verification.
               </p>
            </div>

            <div style={{marginTop: 'auto'}}>
              <button type="submit" className="btn-submit" style={{background: 'linear-gradient(135deg, #8b5cf6, #ec4899)', boxShadow: '0 10px 20px -5px rgba(236, 72, 153, 0.4)'}} disabled={isLoading || !isForgotMode} tabIndex={isForgotMode && !isOtpMode ? 2 : -1}>
                {isLoading ? <div className="spinner"></div> : 'SEND RECOVERY LINK'}
              </button>

              <div style={{textAlign: 'center', marginTop: '20px'}}>
                <span 
                  style={{color: '#c084fc', fontSize: '13px', fontWeight: 700, cursor: 'pointer'}}
                  onClick={(e) => { e.stopPropagation(); setIsForgotMode(false); }}
                  tabIndex={isForgotMode && !isOtpMode ? 3 : -1}
                >
                  ← Back to Sign In
                </span>
              </div>
            </div>
          </form>
        </div>
        </>
        )}

        {/* ================================================= */}
        {/* PANEL 3: OTP FLOW                                 */}
        {/* ================================================= */}
        {isOtpMode && (
        <div className="panel panel-front" style={{ '--translate-x': '0px' }}>
          <h1 className="panel-title" style={{background: 'linear-gradient(to right, #fff, #34d399)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginTop: '30px'}}>Set Password</h1>
          <p className="panel-subtitle">{otpStep === 1 ? 'Request OTP to your university email' : 'Verify OTP and set your password'}</p>

          {otpError && (
            <div className="mb-4 rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
              {otpError}
            </div>
          )}

          {otpSuccess && (
            <div className="mb-4 rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
              {otpSuccess}
            </div>
          )}

          {otpStep === 1 ? (
            // STEP 1: Request OTP
            <form onSubmit={handleRequestOtp} style={{flexGrow: 1, display: 'flex', flexDirection: 'column'}}>
              <div className="input-box">
                <label className="input-label">University Email</label>
                <input 
                  type="email" className="input-field" placeholder="id@student.bau.edu"
                  value={otpEmail} onChange={(e) => setOtpEmail(e.target.value)} required 
                  disabled={isLoading} tabIndex={1}
                />
              </div>

              <div className="rounded-xl border border-emerald-400/30 bg-emerald-500/10 p-4 text-xs leading-relaxed text-emerald-200" style={{margin: 'auto 0'}}>
                <p style={{margin: 0, fontSize: '12px', color: '#86efac', lineHeight: 1.5}}>
                  📧 We'll send a one-time password to your email. Admin has already assigned your role.
                </p>
              </div>

              <div style={{marginTop: 'auto'}}>
                <button type="submit" className="btn-submit" style={{background: 'linear-gradient(135deg, #10b981, #34d399)', boxShadow: '0 10px 20px -5px rgba(16, 185, 129, 0.4)'}} disabled={isLoading} tabIndex={2}>
                  {isLoading ? <div className="spinner"></div> : 'SEND OTP'}
                </button>

                <div style={{textAlign: 'center', marginTop: '20px'}}>
                  <span 
                    style={{color: '#34d399', fontSize: '13px', fontWeight: 700, cursor: 'pointer'}}
                    onClick={goBackToLogin}
                    tabIndex={3}
                  >
                    ← Back to Login
                  </span>
                </div>
              </div>
            </form>
          ) : (
            // STEP 2: Verify OTP and Set Password
            <form onSubmit={handleVerifyOtpAndSetPassword} style={{flexGrow: 1, display: 'flex', flexDirection: 'column'}}>
              <div className="input-box">
                <label className="input-label">One-Time Password</label>
                <input 
                  type="text" className="input-field" placeholder="Enter 6-digit OTP" 
                  value={otp} onChange={(e) => setOtp(e.target.value)} required maxLength="6"
                  disabled={isLoading} tabIndex={1}
                />
              </div>

              <div className="input-box">
                <label className="input-label">New Password</label>
                <input 
                  type={showOtpPass ? "text" : "password"} className="input-field" placeholder="••••••••" 
                  value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required 
                  disabled={isLoading} tabIndex={2}
                />
                <button 
                  type="button" className="pass-toggle" 
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowOtpPass(!showOtpPass); }}
                  tabIndex={3}
                  title={showOtpPass ? "Hide Password" : "Show Password"}
                >
                  {showOtpPass ? <EyeIcon /> : <EyeOffIcon />}
                </button>
              </div>

              <div className="input-box">
                <label className="input-label">Confirm Password</label>
                <input 
                  type={showOtpPass ? "text" : "password"} className="input-field" placeholder="••••••••" 
                  value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required 
                  disabled={isLoading} tabIndex={4}
                />
              </div>

              <div style={{fontSize: '11px', color: '#94a3b8', padding: '12px', background: 'rgba(16, 185, 129, 0.08)', borderRadius: '8px', marginBottom: '15px', marginTop: 'auto'}}>
                <p style={{margin: 0}}>✓ Min 8 characters</p>
                <p style={{margin: '4px 0 0 0'}}>✓ Use uppercase, numbers & symbols</p>
              </div>

              <button type="submit" className="btn-submit" style={{background: 'linear-gradient(135deg, #10b981, #34d399)', boxShadow: '0 10px 20px -5px rgba(16, 185, 129, 0.4)'}} disabled={isLoading} tabIndex={5}>
                {isLoading ? <div className="spinner"></div> : 'VERIFY & SET PASSWORD'}
              </button>

              <div style={{textAlign: 'center', marginTop: '20px'}}>
                <span 
                  style={{color: '#34d399', fontSize: '13px', fontWeight: 700, cursor: 'pointer'}}
                  onClick={goBackToLogin}
                  tabIndex={6}
                >
                  ← Back to Login
                </span>
              </div>
            </form>
          )}
        </div>
        )}

      </div>

      {/* ================================================= */}
      {/* SUCCESS MODAL - Shows after password setup        */}
      {/* ================================================= */}
      {showSuccessModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(2, 6, 23, 0.9)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
        }}>
          <div style={{
            background: 'rgba(15, 23, 42, 0.8)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            borderRadius: '28px',
            padding: '40px',
            textAlign: 'center',
            maxWidth: '400px',
            backdropFilter: 'blur(24px)',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
          }}>
            <div style={{fontSize: '64px', marginBottom: '20px'}}>✅</div>
            <h2 style={{
              fontSize: '24px',
              fontWeight: 900,
              color: '#10b981',
              margin: '0 0 10px 0',
              background: 'linear-gradient(to right, #fff, #34d399)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}>
              Success!
            </h2>
            <p style={{
              fontSize: '14px',
              color: '#86efac',
              margin: '0 0 25px 0',
              lineHeight: '1.6',
            }}>
              Your password has been set successfully. You can now sign in with your email and password.
            </p>
            <p style={{
              fontSize: '12px',
              color: '#64748b',
              margin: 0,
            }}>
              Redirecting to login in <span style={{fontWeight: 800, color: '#34d399'}}>{redirectCountdown}</span> seconds...
            </p>
          </div>
        </div>
      )}

      {/* ================================================= */}
      {/* DEV QUICK ACCESS (Backend Team Pills)               */}
      {/* ================================================= */}
      <div className="dev-pills">
        <div style={{width: '100%', fontSize: '10px', color: '#475569', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '2px', margin: '15px 0 5px 0', textAlign: 'center'}}>
          Developer Fast-Track Access
        </div>
        <button className="pill" onClick={() => loginAsRole('admin')} title="Login as Root Admin"><span>⚙️</span> Admin</button>
        <button className="pill" onClick={() => loginAsRole('dean')} title="Login as Dean Office"><span>🎓</span> Dean</button>
        <button className="pill" onClick={() => loginAsRole('supervisor')} title="Login as Faculty Supervisor"><span>👨‍🏫</span> Supervisor</button>
        <button className="pill" onClick={() => loginAsRole('student')} title="Login as Graduate Student"><span>💻</span> Student</button>
      </div>

    </div>
  );
};

export default Login;
