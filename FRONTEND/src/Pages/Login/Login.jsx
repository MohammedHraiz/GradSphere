import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../../api/apiClient';
import { useAuth } from '../../auth/AuthContext';
import bauLogo from '../../assets/bau_logo.png';
import './Login.css';

const EyeIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const EyeOffIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
    <line x1="1" y1="1" x2="23" y2="23" />
  </svg>
);

const ArrowLeftIcon = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="m12 19-7-7 7-7" />
    <path d="M19 12H5" />
  </svg>
);

const AuthBrand = () => (
  <div className="auth-brand" aria-label="AL-BALQA APPLIED UNIVERSITY Graduation Project Portal">
    <span className="auth-brand-logo">
      <img src={bauLogo} alt="" />
    </span>
    <span className="auth-brand-copy">
      <span>AL-BALQA APPLIED UNIVERSITY</span>
      <strong>Graduation Project Portal</strong>
    </span>
  </div>
);

const PasswordRule = ({ label, valid, warning }) => (
  <li className={`password-rule ${valid ? 'is-valid' : ''} ${warning ? 'is-warning' : ''}`}>
    <span className="password-rule-mark" aria-hidden="true">{valid ? '\u2713' : ''}</span>
    <span>{label}</span>
  </li>
);

const SHOW_DEV_ACCESS = false;

const getReadableOtpSuccess = (message) => {
  const fallback = 'A verification code has been sent to your email.';
  const rawMessage = String(message || '').trim();

  if (!rawMessage || rawMessage === 'OTP_SENT_SUCCESSFULLY') {
    return fallback;
  }

  if (/^[A-Z0-9_]+$/.test(rawMessage)) {
    return rawMessage
      .toLowerCase()
      .split('_')
      .map((part, index) => (index === 0 ? part.charAt(0).toUpperCase() + part.slice(1) : part))
      .join(' ');
  }

  return rawMessage;
};

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

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isPasswordFieldFocused, setIsPasswordFieldFocused] = useState(false);

  const [otpEmail, setOtpEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [otpStep, setOtpStep] = useState(1);
  const [showOtpPass, setShowOtpPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  
  // Ref لمعرفة مكان الروبوت على الشاشة بدقة

  const { login, refreshUserProfile } = useAuth();

  const isPasswordValid = useMemo(() => (
    newPassword.length >= 8
    && /[A-Z]/.test(newPassword)
    && /\d/.test(newPassword)
    && /[^A-Za-z0-9]/.test(newPassword)
  ), [newPassword]);

  const doPasswordsMatch = useMemo(() => (
    confirmPassword.length > 0 && newPassword === confirmPassword
  ), [confirmPassword, newPassword]);

  const passwordRules = useMemo(() => ([
    { id: 'length', label: 'At least 8 characters', valid: newPassword.length >= 8 },
    { id: 'uppercase', label: 'At least one uppercase letter', valid: /[A-Z]/.test(newPassword) },
    { id: 'number', label: 'At least one number', valid: /\d/.test(newPassword) },
    { id: 'symbol', label: 'At least one special character', valid: /[^A-Za-z0-9]/.test(newPassword) },
    {
      id: 'match',
      label: 'Passwords match',
      valid: doPasswordsMatch,
      warning: confirmPassword.length > 0 && !doPasswordsMatch,
    },
  ]), [confirmPassword.length, doPasswordsMatch, newPassword]);

  const canSubmitOtpPassword = useMemo(() => (
    /^\d{6}$/.test(otp.trim()) && isPasswordValid && doPasswordsMatch
  ), [doPasswordsMatch, isPasswordValid, otp]);

  const loginAsRole = async (role) => {
    const demoCredentials = {
      admin: { email: 'admin@demo.local', password: 'password' },
      dean: { email: 'dean@demo.local', password: 'password' },
      supervisor: { email: 'supervisor@demo.local', password: 'password' },
      student: { email: 'student.leader@demo.local', password: 'password' },
    };

    const credentials = demoCredentials[role];
    if (!credentials) return;

    setLoginError('');
    setIsLoading(true);

    try {
      const { data: payload } = await apiClient.post('/v1/auth/login', credentials);
      const backendRole = (
        payload?.role ||
        payload?.user?.role ||
        (Array.isArray(payload?.roles) ? payload.roles[0] : null) ||
        'ROLE_STUDENT'
      );

      const normalizedRole = String(backendRole).replace(/^ROLE_/i, '').toLowerCase();
      const token = payload?.token || payload?.accessToken || payload?.jwt || null;

      login({
        token,
        user: {
          ...payload,
          userName: payload?.userName || payload?.name || credentials.email,
          email: payload?.email || credentials.email,
          role: normalizedRole,
        },
        role: normalizedRole,
      });
    } catch (err) {
      setLoginError(err?.message || 'Quick access login failed.');
    } finally {
      setIsLoading(false);
    }
  };

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

      if (typeof refreshUserProfile === 'function') {
        try {
          await refreshUserProfile();
        } catch {
          // Keep the existing login flow intact if the profile sync request fails.
        }
      }

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

      setOtpSuccess(getReadableOtpSuccess(payload?.message));
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

    if (!isPasswordValid) {
      setOtpError('Password must satisfy all password rules.');
      return;
    }

    if (!doPasswordsMatch) {
      setOtpError('Passwords do not match.');
      return;
    }

    setIsLoading(true);

    try {
      await apiClient.post('/v1/auth/setup-password', {
        email: otpEmail.trim(),
        otp: otp.trim(),
        password: newPassword,
      });

      setOtpSuccess('Password has been set successfully.');
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

  useEffect(() => {
    if (!showSuccessModal) return undefined;

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
      setShowConfirmPass(false);
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
    setShowConfirmPass(false);
    setShowSuccessModal(false);
    setOtpEmail('');
  };

  const openOtpMode = (e) => {
    e.stopPropagation();
    setOtpError('');
    setOtpSuccess('');
    setOtpStep(1);
    setIsForgotMode(false);
    setIsOtpMode(true);
  };

  const handleOtpChange = (e) => {
    setOtp(e.target.value.replace(/\D/g, '').slice(0, 6));
    if (otpError) setOtpError('');
  };

  return (
    <div className="login-page-container">
      <div className="auth-bg-glow auth-bg-glow-top" />
      <div className="auth-bg-glow auth-bg-glow-bottom" />
      <AuthBrand />

      <main className={`auth-shell ${isOtpMode ? 'auth-shell-otp' : ''}`}>
        {!isOtpMode && !isForgotMode && (
          <section className="auth-card login-auth-card" aria-labelledby="login-title">
            <div className="auth-card-heading">
              <p className="auth-kicker">Secure university access</p>
              <h1 id="login-title" className="panel-title">Welcome Back</h1>
              <p className="panel-subtitle">Sign in to continue to your graduation project workspace.</p>
            </div>

            <form onSubmit={handleLoginSubmit} className="auth-form">
              <div className="input-box">
                <label className="input-label" htmlFor="login-email">University Email</label>
                <input
                  id="login-email"
                  type="email"
                  className="input-field"
                  placeholder="id@student.bau.edu"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (loginError) setLoginError('');
                  }}
                  autoComplete="email"
                  required
                />
              </div>

              <div className="input-box">
                <label className="input-label" htmlFor="login-password">Password</label>
                <div className="password-input-wrap">
                  <input
                    id="login-password"
                    type={showPass ? 'text' : 'password'}
                    className="input-field"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (loginError) setLoginError('');
                    }}
                    autoComplete="current-password"
                    required
                  />
                  <button
                    type="button"
                    className="pass-toggle"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setShowPass(!showPass);
                    }}
                    aria-label={showPass ? 'Hide password' : 'Show password'}
                    title={showPass ? 'Hide password' : 'Show password'}
                  >
                    {showPass ? <EyeIcon /> : <EyeOffIcon />}
                  </button>
                </div>
                {/* <button
                  type="button"
                  className="login-helper-link"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsForgotMode(true);
                  }}
                >
                  Forgot password?
                </button> */}
              </div>

              {loginError && (
                <div className="auth-alert auth-alert-error" role="alert">
                  {loginError}
                </div>
              )}

              <button type="submit" className="btn-submit" disabled={isLoading}>
                {isLoading ? <span className="spinner" aria-label="Signing in" /> : 'Access Portal'}
              </button>

              <div className="login-post-submit-action">
                <span className="login-post-submit-copy">First time logging in?</span>
                <button type="button" className="login-helper-link" onClick={openOtpMode}>
                  Set Password via OTP
                </button>
              </div>
            </form>
          </section>
        )}

        {!isOtpMode && isForgotMode && (
          <section className="auth-card" aria-labelledby="reset-title">
            <div className="auth-card-heading auth-card-heading-spacious">
              <p className="auth-kicker">Account recovery</p>
              <h1 id="reset-title" className="panel-title">Reset Access</h1>
              <p className="panel-subtitle">We will send recovery instructions to your university email.</p>
            </div>

            <form onSubmit={handleResetSubmit} className="auth-form">
              <div className="input-box">
                <label className="input-label" htmlFor="reset-email">Registered Email</label>
                <input
                  id="reset-email"
                  type="email"
                  className="input-field"
                  placeholder="Enter your university email"
                  required
                  disabled={isLoading}
                />
              </div>

              <div className="auth-note">
                If you lost access to your university email, please contact the IT Support Desk directly for manual verification.
              </div>

              <button type="submit" className="btn-submit" disabled={isLoading}>
                {isLoading ? <span className="spinner" aria-label="Sending recovery link" /> : 'Send Recovery Link'}
              </button>

              <button type="button" className="auth-back-link" onClick={(e) => {
                e.stopPropagation();
                setIsForgotMode(false);
              }}>
                <ArrowLeftIcon />
                Back to Login
              </button>
            </form>
          </section>
        )}

        {isOtpMode && (
          <section className="auth-card otp-auth-card" aria-labelledby="otp-title">
            <div className="auth-card-heading">
              <p className="auth-kicker">First-time access</p>
              <h1 id="otp-title" className="panel-title">Set Password</h1>
              <p className="panel-subtitle">
                {otpStep === 1 ? 'Request an OTP to your university email.' : 'Verify your OTP and create a new password.'}
              </p>
            </div>

            {otpError && (
              <div className="auth-alert auth-alert-error" role="alert">
                {otpError}
              </div>
            )}

            {otpSuccess && (
              <div className="auth-alert auth-alert-success" role="status">
                {otpSuccess}
              </div>
            )}

            {otpStep === 1 ? (
              <form onSubmit={handleRequestOtp} className="auth-form">
                <div className="input-box">
                  <label className="input-label" htmlFor="otp-email">University Email</label>
                  <input
                    id="otp-email"
                    type="email"
                    className="input-field"
                    placeholder="id@student.bau.edu"
                    value={otpEmail}
                    onChange={(e) => {
                      setOtpEmail(e.target.value);
                      if (otpError) setOtpError('');
                    }}
                    autoComplete="email"
                    required
                    disabled={isLoading}
                  />
                </div>

                <div className="auth-note auth-note-success">
                  We will send a 6-digit code to your email. Your role must already be assigned by an administrator.
                </div>

                <button type="submit" className="btn-submit" disabled={isLoading}>
                  {isLoading ? <span className="spinner" aria-label="Sending OTP" /> : 'Send OTP'}
                </button>

                <button type="button" className="auth-back-link" onClick={goBackToLogin}>
                  <ArrowLeftIcon />
                  Back to Login
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtpAndSetPassword} className="auth-form">
                <div className="input-box">
                  <label className="input-label" htmlFor="otp-code">One-Time Password</label>
                  <input
                    id="otp-code"
                    type="text"
                    className="input-field otp-field"
                    placeholder="Enter 6-digit OTP"
                    value={otp}
                    onChange={handleOtpChange}
                    inputMode="numeric"
                    pattern="\d{6}"
                    maxLength="6"
                    autoComplete="one-time-code"
                    required
                    disabled={isLoading}
                  />
                </div>

                <div className="input-box">
                  <label className="input-label" htmlFor="new-password">New Password</label>
                  <div className="password-input-wrap">
                    <input
                      id="new-password"
                      type={showOtpPass ? 'text' : 'password'}
                      className="input-field"
                      placeholder="Create a strong password"
                      value={newPassword}
                      onChange={(e) => {
                        setNewPassword(e.target.value);
                        if (otpError) setOtpError('');
                      }}
                      autoComplete="new-password"
                      required
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      className="pass-toggle"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setShowOtpPass(!showOtpPass);
                      }}
                      aria-label={showOtpPass ? 'Hide new password' : 'Show new password'}
                      title={showOtpPass ? 'Hide new password' : 'Show new password'}
                    >
                      {showOtpPass ? <EyeIcon /> : <EyeOffIcon />}
                    </button>
                  </div>
                </div>

                <div className="input-box">
                  <label className="input-label" htmlFor="confirm-password">Confirm Password</label>
                  <div className="password-input-wrap">
                    <input
                      id="confirm-password"
                      type={showConfirmPass ? 'text' : 'password'}
                      className="input-field"
                      placeholder="Repeat your password"
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        if (otpError) setOtpError('');
                      }}
                      autoComplete="new-password"
                      required
                      disabled={isLoading}
                      aria-invalid={confirmPassword.length > 0 && confirmPassword !== newPassword}
                    />
                    <button
                      type="button"
                      className="pass-toggle"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setShowConfirmPass(!showConfirmPass);
                      }}
                      aria-label={showConfirmPass ? 'Hide confirmed password' : 'Show confirmed password'}
                      title={showConfirmPass ? 'Hide confirmed password' : 'Show confirmed password'}
                    >
                      {showConfirmPass ? <EyeIcon /> : <EyeOffIcon />}
                    </button>
                  </div>
                </div>

                <div className="password-rules-panel" aria-label="Password requirements">
                  <p>Password requirements</p>
                  <ul>
                    {passwordRules.map((rule) => (
                      <PasswordRule key={rule.id} label={rule.label} valid={rule.valid} warning={rule.warning} />
                    ))}
                  </ul>
                </div>

                <button type="submit" className="btn-submit" disabled={isLoading || !canSubmitOtpPassword}>
                  {isLoading ? <span className="spinner" aria-label="Verifying OTP" /> : 'Verify & Set Password'}
                </button>

                <button type="button" className="auth-back-link" onClick={goBackToLogin}>
                  <ArrowLeftIcon />
                  Back to Login
                </button>
              </form>
            )}
          </section>
        )}
      </main>

      {showSuccessModal && (
        <div className="success-modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="password-success-title">
          <div className="success-modal-card">
            <div className="success-modal-icon" aria-hidden="true">✓</div>
            <h2 id="password-success-title">Password Set</h2>
            <p>Your password has been set successfully. You can now sign in with your email and password.</p>
            <p className="success-modal-countdown">
              Redirecting to login in <strong>{redirectCountdown}</strong> seconds...
            </p>
          </div>
        </div>
      )}

      {SHOW_DEV_ACCESS ? (
        <div className="dev-pills">
          <div className="dev-pills-label">Developer Fast-Track Access</div>
          <button className="pill" onClick={() => loginAsRole('admin')} title="Login as Root Admin">Admin</button>
          <button className="pill" onClick={() => loginAsRole('dean')} title="Login as Dean Office">Dean</button>
          <button className="pill" onClick={() => loginAsRole('supervisor')} title="Login as Faculty Supervisor">Supervisor</button>
          <button className="pill" onClick={() => loginAsRole('student')} title="Login as Graduate Student">Student</button>
        </div>
      ) : null}
    </div>
  );
};

export default Login;
