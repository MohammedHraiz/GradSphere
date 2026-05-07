import { createPortal } from 'react-dom';
import { useEffect } from 'react';

const toastStyles = `
.feedback-toast-wrap { position: fixed; top: 82px; left: 50%; transform: translateX(-50%); z-index: 10050; width: min(480px, calc(100vw - 32px)); pointer-events: none; }
.feedback-toast { pointer-events: auto; display: flex; align-items: flex-start; gap: 12px; border-radius: 18px; padding: 14px 16px; font-size: 14px; font-weight: 700; box-shadow: 0 28px 60px -34px rgba(15, 23, 42, .82); border: 1px solid rgba(226, 232, 240, 0.9); background: rgba(255, 255, 255, 0.96); color: #0f172a; backdrop-filter: blur(14px); }
.feedback-toast::before { content: ''; width: 4px; align-self: stretch; border-radius: 9999px; background: #4f46e5; flex: 0 0 auto; }
.feedback-toast.success::before { background: #10b981; }
.feedback-toast.error::before { background: #ef4444; }
.feedback-toast.warning::before { background: #f59e0b; }
.feedback-toast.info::before { background: #4f46e5; }
.feedback-toast__icon { width: 32px; height: 32px; border-radius: 12px; display: flex; align-items: center; justify-content: center; flex: 0 0 auto; font-size: 16px; font-weight: 900; }
.feedback-toast.success .feedback-toast__icon { background: rgba(16,185,129,0.12); color: #059669; }
.feedback-toast.error .feedback-toast__icon { background: rgba(239,68,68,0.12); color: #dc2626; }
.feedback-toast.warning .feedback-toast__icon { background: rgba(245,158,11,0.12); color: #d97706; }
.feedback-toast.info .feedback-toast__icon { background: rgba(79,70,229,0.12); color: #4f46e5; }
.feedback-toast__body { min-width: 0; flex: 1; padding-top: 1px; }
.feedback-toast__title { margin: 0 0 4px; font-size: 12px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.08em; color: #475569; }
.feedback-toast__message { margin: 0; color: inherit; line-height: 1.55; font-weight: 700; overflow-wrap: anywhere; }
.feedback-toast__close { width: 32px; height: 32px; margin-left: 4px; border: 1px solid rgba(203,213,225,0.9); border-radius: 9999px; background: rgba(248,250,252,0.96); color: #64748b; cursor: pointer; font-size: 18px; display: flex; align-items: center; justify-content: center; line-height: 1; transition: transform 0.2s ease, background 0.2s ease, color 0.2s ease; flex: 0 0 auto; pointer-events: auto; }
.feedback-toast__close:hover { transform: scale(1.04); background: white; color: #0f172a; }
.feedback-toast.success { border-color: rgba(187,247,208,0.95); }
.feedback-toast.error { border-color: rgba(254,202,202,0.95); }
.feedback-toast.warning { border-color: rgba(253,230,138,0.95); }
.feedback-toast.info { border-color: rgba(199,210,254,0.95); }
@media (max-width: 640px) { .feedback-toast-wrap { top: 72px; } .feedback-toast { padding: 13px 14px; } }
`;

const toastMeta = {
  success: { icon: '✓', title: 'Success' },
  error: { icon: '!', title: 'Error' },
  warning: { icon: '!', title: 'Warning' },
  info: { icon: 'i', title: 'Info' },
};

const FeedbackToast = ({ message, type = 'success', title, duration = 3200, onClose }) => {
  useEffect(() => {
    if (!message || !onClose || duration <= 0) return undefined;

    const timeoutId = window.setTimeout(() => onClose(), duration);
    return () => window.clearTimeout(timeoutId);
  }, [message, duration, onClose]);

  if (!message) return null;

  const meta = toastMeta[type] ?? toastMeta.info;

  return createPortal(
    <div className="feedback-toast-wrap" role="status" aria-live="polite" aria-atomic="true">
      <style>{toastStyles}</style>
      <div className={`feedback-toast ${type}`}>
        <div className="feedback-toast__icon" aria-hidden="true">{meta.icon}</div>
        <div className="feedback-toast__body">
          <p className="feedback-toast__title">{title ?? meta.title}</p>
          <p className="feedback-toast__message">{message}</p>
        </div>
        {onClose ? (
          <button type="button" className="feedback-toast__close" aria-label="Dismiss notification" onClick={onClose}>
            ×
          </button>
        ) : null}
      </div>
    </div>,
    document.body,
  );
};

export default FeedbackToast;
