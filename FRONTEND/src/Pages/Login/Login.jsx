import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../../api/apiClient';
import { useAuth } from '../../auth/AuthContext';
import bauLogo from '../../assets/bau_logo.png';
import FeedbackToast from '../../components/FeedbackToast';
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
const OTP_LENGTH = 6;
const OTP_STEPS = {
  REQUEST: 1,
  VERIFY: 2,
  PASSWORD: 3,
};
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/i;

const OtpCodeInput = ({ value, onChange, disabled = false, autoFocus = false }) => {
  const inputRefs = useRef([]);
  const digits = Array.from({ length: OTP_LENGTH }, (_, index) => value[index] ?? '');

  const focusDigit = (index) => {
    const boundedIndex = Math.max(0, Math.min(index, OTP_LENGTH - 1));
    inputRefs.current[boundedIndex]?.focus();
  };

  const updateValue = (nextDigits) => {
    onChange(nextDigits.join('').replace(/\D/g, '').slice(0, OTP_LENGTH));
  };

  const applyDigits = (startIndex, rawValue) => {
    const cleanValue = rawValue.replace(/\D/g, '');
    if (!cleanValue) {
      return;
    }

    const nextDigits = [...digits];
    cleanValue
      .slice(0, OTP_LENGTH - startIndex)
      .split('')
      .forEach((digit, offset) => {
        nextDigits[startIndex + offset] = digit;
      });

    updateValue(nextDigits);
    const nextFocusIndex = Math.min(startIndex + cleanValue.length, OTP_LENGTH - 1);
    requestAnimationFrame(() => focusDigit(nextFocusIndex));
  };

  const handleDigitChange = (index, event) => {
    const nextRawValue = event.target.value;
    const cleanValue = nextRawValue.replace(/\D/g, '');

    if (!cleanValue) {
      const nextDigits = [...digits];
      nextDigits[index] = '';
      updateValue(nextDigits);
      return;
    }

    applyDigits(index, cleanValue);
  };

  const handleKeyDown = (index, event) => {
    if (event.key === 'Backspace') {
      event.preventDefault();

      if (digits[index]) {
        const nextDigits = [...digits];
        nextDigits[index] = '';
        updateValue(nextDigits);
        return;
      }

      if (index > 0) {
        const nextDigits = [...digits];
        nextDigits[index - 1] = '';
        updateValue(nextDigits);
        requestAnimationFrame(() => focusDigit(index - 1));
      }
      return;
    }

    if (event.key === 'Delete') {
      event.preventDefault();
      const nextDigits = [...digits];
      nextDigits[index] = '';
      updateValue(nextDigits);
      return;
    }

    if (event.key === 'ArrowLeft' && index > 0) {
      event.preventDefault();
      focusDigit(index - 1);
      return;
    }

    if (event.key === 'ArrowRight' && index < OTP_LENGTH - 1) {
      event.preventDefault();
      focusDigit(index + 1);
    }
  };

  const handlePaste = (event) => {
    const pastedValue = event.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LENGTH);
    if (!pastedValue) {
      return;
    }

    event.preventDefault();
    const nextDigits = Array.from({ length: OTP_LENGTH }, (_, index) => pastedValue[index] ?? '');
    updateValue(nextDigits);
    requestAnimationFrame(() => focusDigit(Math.min(pastedValue.length - 1, OTP_LENGTH - 1)));
  };

  useEffect(() => {
    if (!autoFocus || disabled) {
      return;
    }

    const firstEmptyIndex = digits.findIndex((digit) => !digit);
    const targetIndex = firstEmptyIndex >= 0 ? firstEmptyIndex : OTP_LENGTH - 1;
    const frame = window.requestAnimationFrame(() => focusDigit(targetIndex));

    return () => window.cancelAnimationFrame(frame);
  }, [autoFocus, disabled]);

  return (
    <div className="otp-code-group" role="group" aria-label="One-time password">
      {digits.map((digit, index) => (
        <input
          key={`otp-digit-${index}`}
          id={`otp-digit-${index}`}
          ref={(element) => {
            inputRefs.current[index] = element;
          }}
          type="text"
          className="otp-digit-input"
          inputMode="numeric"
          pattern="[0-9]*"
          autoComplete={index === 0 ? 'one-time-code' : 'off'}
          enterKeyHint="done"
          maxLength={1}
          value={digit}
          onChange={(event) => handleDigitChange(index, event)}
          onKeyDown={(event) => handleKeyDown(index, event)}
          onPaste={handlePaste}
          onFocus={(event) => event.target.select()}
          aria-label={`OTP digit ${index + 1}`}
          disabled={disabled}
        />
      ))}
    </div>
  );
};

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

const getReadableOtpError = (error, fallbackMessage) => {
  const status = error?.status || error?.response?.status;
  const rawMessage = String(error?.response?.data?.message || error?.message || '').trim();

  if (status === 404 || rawMessage === 'EMAIL_NOT_FOUND') {
    return 'This email is not registered by the admin.';
  }

  if (rawMessage === 'INVALID_OTP' || /invalid otp/i.test(rawMessage)) {
    return 'The code you entered is incorrect.';
  }

  if (rawMessage === 'EXPIRED_OTP' || /expired otp/i.test(rawMessage)) {
    return 'This code has expired. Please request a new one.';
  }

  return error?.message || fallbackMessage;
};

const Login = () => {
  const navigate = useNavigate();
 

  const [isForgotMode, setIsForgotMode] = useState(false);
  const [isOtpMode, setIsOtpMode] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [redirectCountdown, setRedirectCountdown] = useState(3);
  const [toast, setToast] = useState(null);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isPasswordFieldFocused, setIsPasswordFieldFocused] = useState(false);

  const [otpEmail, setOtpEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [otpStep, setOtpStep] = useState(OTP_STEPS.REQUEST);
  const [verifiedOtp, setVerifiedOtp] = useState('');
  const [otpBusyAction, setOtpBusyAction] = useState('');
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
    Boolean(verifiedOtp) && isPasswordValid && doPasswordsMatch
  ), [doPasswordsMatch, isPasswordValid, verifiedOtp]);
  const isOtpRequestStep = otpStep === OTP_STEPS.REQUEST;
  const isOtpVerifyStep = otpStep === OTP_STEPS.VERIFY;
  const showToast = (message, type = 'success') => setToast({ message, type });

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

  const requestOtpForEmail = async (targetEmail, successMessage) => {
    const { data: payload } = await apiClient.post('/v1/auth/request-otp', { email: targetEmail });
    return successMessage || getReadableOtpSuccess(payload?.message);
  };

  const openOtpMode = (e) => {
    e.stopPropagation();
    setToast(null);
    setOtpEmail('');
    setOtp('');
    setVerifiedOtp('');
    setNewPassword('');
    setConfirmPassword('');
    setShowOtpPass(false);
    setShowConfirmPass(false);
    setOtpBusyAction('');
    setOtpStep(OTP_STEPS.REQUEST);
    setIsForgotMode(false);
    setIsOtpMode(true);
  };

  const handleRequestOtp = async (e) => {
    e.preventDefault();
    const normalizedEmail = otpEmail.trim().toLowerCase();

    if (!normalizedEmail) {
      showToast('Please enter your university email.', 'error');
      return;
    }

    if (!EMAIL_PATTERN.test(normalizedEmail)) {
      showToast('Please enter a valid university email address.', 'error');
      return;
    }

    setIsLoading(true);
    setOtpBusyAction('request');

    try {
      showToast(await requestOtpForEmail(normalizedEmail));
      setOtpEmail(normalizedEmail);
      setOtp('');
      setVerifiedOtp('');
      setOtpStep(OTP_STEPS.VERIFY);
    } catch (err) {
      showToast(getReadableOtpError(err, 'We could not send a verification code. Please try again.'), 'error');
    } finally {
      setIsLoading(false);
      setOtpBusyAction('');
    }
  };

  const handleResendOtp = async () => {
    const normalizedEmail = otpEmail.trim();

    setOtp('');
    setVerifiedOtp('');

    if (!normalizedEmail) {
      showToast('Return to login and enter your university email to request a new code.', 'error');
      return;
    }

    setIsLoading(true);
    setOtpBusyAction('resend');

    try {
      showToast(await requestOtpForEmail(normalizedEmail, 'A fresh verification code has been sent to your email.'));
    } catch (err) {
      showToast(getReadableOtpError(err, 'Could not send a new verification code. Please try again.'), 'error');
    } finally {
      setIsLoading(false);
      setOtpBusyAction('');
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();

    if (!new RegExp(`^\\d{${OTP_LENGTH}}$`).test(otp.trim())) {
      showToast('OTP must be exactly 6 digits.', 'error');
      return;
    }

    setIsLoading(true);
    setOtpBusyAction('verify');

    try {
      await apiClient.post('/v1/auth/verify-otp', {
        email: otpEmail.trim(),
        otp: otp.trim(),
      });

      setVerifiedOtp(otp.trim());
      showToast('OTP verified successfully. You can now set a new password.');
      setOtpStep(OTP_STEPS.PASSWORD);
    } catch (err) {
      showToast(getReadableOtpError(err, 'Verification failed. Please check OTP and try again.'), 'error');
    } finally {
      setIsLoading(false);
      setOtpBusyAction('');
    }
  };

  const handleSetOtpPassword = async (e) => {
    e.preventDefault();

    if (!newPassword.trim() || !confirmPassword.trim()) {
      showToast('Please fill in all fields.', 'error');
      return;
    }

    if (!verifiedOtp) {
      showToast('Verify your OTP before setting a password.', 'error');
      setOtpStep(OTP_STEPS.VERIFY);
      return;
    }

    if (!isPasswordValid) {
      showToast('Password must satisfy all password rules.', 'error');
      return;
    }

    if (!doPasswordsMatch) {
      showToast('Passwords do not match.', 'error');
      return;
    }

    setIsLoading(true);
    setOtpBusyAction('submit');

    try {
      await apiClient.post('/v1/auth/setup-password', {
        email: otpEmail.trim(),
        otp: verifiedOtp,
        password: newPassword,
      });

      setShowSuccessModal(true);
      setRedirectCountdown(3);
    } catch (err) {
      showToast(getReadableOtpError(err, 'Password setup failed. Please try again.'), 'error');
    } finally {
      setIsLoading(false);
      setOtpBusyAction('');
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
      setOtpStep(OTP_STEPS.REQUEST);
      setOtpEmail('');
      setOtp('');
      setVerifiedOtp('');
      setNewPassword('');
      setConfirmPassword('');
      setShowOtpPass(false);
      setShowConfirmPass(false);
      setOtpBusyAction('');
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
    setOtpStep(OTP_STEPS.REQUEST);
    setLoginError('');
    setOtp('');
    setVerifiedOtp('');
    setNewPassword('');
    setConfirmPassword('');
    setShowOtpPass(false);
    setShowConfirmPass(false);
    setShowSuccessModal(false);
    setOtpEmail('');
    setOtpBusyAction('');
  };

  const goBackToOtpVerification = (e) => {
    e.stopPropagation();
    setOtpStep(OTP_STEPS.VERIFY);
    setVerifiedOtp('');
    setShowOtpPass(false);
    setShowConfirmPass(false);
  };

  const handleOtpChange = (nextOtp) => {
    setOtp(String(nextOtp || '').replace(/\D/g, '').slice(0, OTP_LENGTH));
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
              <h1 id="otp-title" className="panel-title">
                {isOtpRequestStep ? 'Request OTP' : isOtpVerifyStep ? 'Verify OTP' : 'Set New Password'}
              </h1>
              <p className="panel-subtitle">
                {isOtpRequestStep ? (
                  <>
                    Enter your university email to receive a one-time verification code for first-time password setup.
                  </>
                ) : isOtpVerifyStep ? (
                  <>
                    Enter the 6-digit code sent to <strong className="otp-inline-emphasis">{otpEmail}</strong>. We will verify it before allowing password creation.
                  </>
                ) : (
                  <>
                    OTP verified for <strong className="otp-inline-emphasis">{otpEmail}</strong>. Create a strong password to activate your portal access.
                  </>
                )}
              </p>
            </div>

            {isOtpRequestStep ? (
              <form onSubmit={handleRequestOtp} className="auth-form" noValidate>
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
                    }}
                    autoComplete="email"
                    required
                    disabled={isLoading}
                  />
                </div>

                <button type="submit" className="btn-submit" disabled={isLoading}>
                  {isLoading && otpBusyAction === 'request' ? <span className="spinner" aria-label="Sending OTP" /> : 'Send OTP'}
                </button>

                <button type="button" className="auth-back-link" onClick={goBackToLogin}>
                  <ArrowLeftIcon />
                  Back to Login
                </button>
              </form>
            ) : isOtpVerifyStep ? (
              <form onSubmit={handleVerifyOtp} className="auth-form">
                <div className="input-box">
                  <label className="input-label" htmlFor="otp-digit-0">One-Time Password</label>
                  <div>
                    <OtpCodeInput
                      value={otp}
                      onChange={handleOtpChange}
                      disabled={isLoading}
                      autoFocus={isOtpVerifyStep}
                    />
                  </div>
                </div>

                <button type="submit" className="btn-submit" disabled={isLoading}>
                  {isLoading && otpBusyAction === 'verify' ? <span className="spinner" aria-label="Verifying OTP" /> : 'Verify OTP'}
                </button>

                <div className="otp-secondary-actions">
                  <button type="button" className="login-helper-link" onClick={handleResendOtp} disabled={isLoading}>
                    {isLoading && otpBusyAction === 'resend' ? 'Resending OTP...' : 'Resend OTP'}
                  </button>

                  <button type="button" className="auth-back-link" onClick={goBackToLogin}>
                    <ArrowLeftIcon />
                    Back to Login
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleSetOtpPassword} className="auth-form">
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
                  {isLoading && otpBusyAction === 'submit' ? <span className="spinner" aria-label="Setting password" /> : 'Set Password'}
                </button>

                <button type="button" className="auth-back-link" onClick={goBackToOtpVerification}>
                  <ArrowLeftIcon />
                  Back to Verify OTP
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

      <FeedbackToast message={toast?.message} type={toast?.type} onClose={() => setToast(null)} />
    </div>
  );
};

export default Login;
