import { createPortal } from 'react-dom';
import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';

const EXIT_DURATION = 220;
const STACK_GAP = 14;

const activeToastIds = [];
const stackSubscribers = new Set();

const notifyStackSubscribers = () => {
  stackSubscribers.forEach((callback) => callback());
};

const subscribeToStack = (callback) => {
  stackSubscribers.add(callback);
  return () => {
    stackSubscribers.delete(callback);
  };
};

const registerToast = (toastId) => {
  if (!activeToastIds.includes(toastId)) {
    activeToastIds.push(toastId);
    notifyStackSubscribers();
  }
};

const unregisterToast = (toastId) => {
  const index = activeToastIds.indexOf(toastId);
  if (index >= 0) {
    activeToastIds.splice(index, 1);
    notifyStackSubscribers();
  }
};

const getToastStackIndex = (toastId) => {
  const index = activeToastIds.indexOf(toastId);
  return index >= 0 ? index : 0;
};

const toastStyles = `
.feedback-toast-layer {
  position: fixed;
  top: calc(env(safe-area-inset-top, 0px) + 14px);
  right: clamp(12px, 1.8vw, 20px);
  z-index: 12080;
  width: min(348px, calc(100vw - 24px));
  pointer-events: none;
  opacity: 0;
  will-change: transform, opacity;
  transform: translate3d(26px, calc(var(--feedback-toast-offset, 0px) - 4px), 0) scale(0.985);
  transition: transform 260ms cubic-bezier(.22,1,.36,1), opacity 180ms ease;
}

.feedback-toast-layer.is-visible {
  opacity: 1;
  transform: translate3d(0, var(--feedback-toast-offset, 0px), 0) scale(var(--feedback-toast-scale, 1));
}

.feedback-toast-layer.is-leaving {
  opacity: 0;
  transform: translate3d(18px, var(--feedback-toast-offset, 0px), 0) scale(0.98);
}

.feedback-toast {
  position: relative;
  overflow: hidden;
  pointer-events: auto;
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  gap: 12px;
  align-items: start;
  padding: 12px 12px 14px;
  border-radius: 18px;
  border: 1px solid var(--feedback-toast-border, rgba(199, 210, 254, 0.92));
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.995), rgba(248, 250, 252, 0.985));
  color: #0f172a;
  box-shadow:
    0 18px 40px -26px rgba(15, 23, 42, 0.34),
    0 10px 24px -22px var(--feedback-toast-shadow, rgba(79, 70, 229, 0.24));
}

.feedback-toast::before {
  content: '';
  position: absolute;
  inset: 0 0 auto;
  height: 3px;
  background: linear-gradient(90deg, var(--feedback-toast-accent), rgba(255, 255, 255, 0.96));
}

.feedback-toast__icon {
  position: relative;
  width: 36px;
  height: 36px;
  border-radius: 12px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
  color: var(--feedback-toast-accent);
  border: 1px solid rgba(226, 232, 240, 0.96);
  background: var(--feedback-toast-icon-bg, rgba(79, 70, 229, 0.12));
}

.feedback-toast__icon::after {
  display: none;
}

.feedback-toast__icon svg {
  width: 18px;
  height: 18px;
}

.feedback-toast__body {
  min-width: 0;
  display: grid;
  gap: 2px;
  padding-top: 1px;
}

.feedback-toast__eyebrow {
  margin: 0;
  color: #64748b;
  font-size: 10px;
  font-weight: 900;
  letter-spacing: 0.18em;
  text-transform: uppercase;
}

.feedback-toast__message {
  margin: 0;
  color: #0f172a;
  font-size: 13.5px;
  line-height: 1.45;
  font-weight: 800;
  overflow-wrap: anywhere;
}

.feedback-toast__close {
  width: 28px;
  height: 28px;
  margin-top: 1px;
  border: 1px solid rgba(226, 232, 240, 0.96);
  border-radius: 999px;
  background: #f8fafc;
  color: #64748b;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: transform 180ms ease, background-color 180ms ease, border-color 180ms ease, color 180ms ease, box-shadow 180ms ease;
}

.feedback-toast__close:hover {
  transform: translateY(-1px);
  background: #ffffff;
  border-color: rgba(148, 163, 184, 0.44);
  color: #0f172a;
  box-shadow: 0 10px 18px -18px rgba(15, 23, 42, 0.28);
}

.feedback-toast__close:focus-visible {
  outline: none;
  border-color: var(--feedback-toast-accent);
  box-shadow: 0 0 0 4px rgba(79, 70, 229, 0.14);
}

.feedback-toast__close svg {
  width: 13px;
  height: 13px;
}

.feedback-toast__meter {
  position: absolute;
  left: 12px;
  right: 12px;
  bottom: 0;
  height: 2px;
  overflow: hidden;
  background: rgba(226, 232, 240, 0.76);
}

.feedback-toast__meter::after {
  content: '';
  display: block;
  width: 100%;
  height: 100%;
  transform-origin: left center;
  background: linear-gradient(90deg, var(--feedback-toast-accent), rgba(255, 255, 255, 0.94));
  animation: feedbackToastMeter var(--feedback-toast-duration, 3200ms) linear forwards;
}

.feedback-toast.loading .feedback-toast__meter {
  display: none;
}

.feedback-toast.loading .feedback-toast__icon svg {
  animation: feedbackToastSpin 0.95s linear infinite;
}

@keyframes feedbackToastMeter {
  from { transform: scaleX(1); opacity: 1; }
  to { transform: scaleX(0); opacity: 0.22; }
}

@keyframes feedbackToastSpin {
  to { transform: rotate(360deg); }
}

@media (max-width: 640px) {
  .feedback-toast-layer {
    top: calc(env(safe-area-inset-top, 0px) + 12px);
    right: 12px;
    left: 12px;
    width: min(100%, calc(100vw - 24px));
  }

  .feedback-toast {
    padding: 12px 12px 14px;
    gap: 10px;
    border-radius: 16px;
  }

  .feedback-toast__message {
    font-size: 13px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .feedback-toast-layer {
    transition: opacity 120ms ease;
    transform: translate3d(0, var(--feedback-toast-offset, 0px), 0) scale(1);
  }

  .feedback-toast__close {
    transition: none;
  }

  .feedback-toast__meter::after,
  .feedback-toast.loading .feedback-toast__icon svg {
    animation: none;
  }
}
`;

const toastMeta = {
  success: {
    title: 'Success',
    accent: '#10b981',
    border: 'rgba(167, 243, 208, 0.95)',
    glow: 'rgba(16, 185, 129, 0.18)',
    shadow: 'rgba(16, 185, 129, 0.32)',
    iconBg: 'rgba(16, 185, 129, 0.12)',
  },
  error: {
    title: 'Error',
    accent: '#ef4444',
    border: 'rgba(254, 202, 202, 0.96)',
    glow: 'rgba(239, 68, 68, 0.18)',
    shadow: 'rgba(239, 68, 68, 0.28)',
    iconBg: 'rgba(239, 68, 68, 0.12)',
  },
  warning: {
    title: 'Warning',
    accent: '#f59e0b',
    border: 'rgba(253, 230, 138, 0.96)',
    glow: 'rgba(245, 158, 11, 0.18)',
    shadow: 'rgba(245, 158, 11, 0.28)',
    iconBg: 'rgba(245, 158, 11, 0.14)',
  },
  info: {
    title: 'Info',
    accent: '#4f46e5',
    border: 'rgba(199, 210, 254, 0.96)',
    glow: 'rgba(99, 102, 241, 0.18)',
    shadow: 'rgba(79, 70, 229, 0.28)',
    iconBg: 'rgba(79, 70, 229, 0.12)',
  },
  loading: {
    title: 'Working',
    accent: '#0ea5e9',
    border: 'rgba(186, 230, 253, 0.96)',
    glow: 'rgba(14, 165, 233, 0.18)',
    shadow: 'rgba(14, 165, 233, 0.28)',
    iconBg: 'rgba(14, 165, 233, 0.12)',
  },
};

const normalizeMessage = (value) => {
  if (value === null || value === undefined) {
    return '';
  }

  return String(value).trim();
};

const ToastIcon = ({ type }) => {
  if (type === 'success') {
    return (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M20 7L10 17l-5-5" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }

  if (type === 'error') {
    return (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M15 9l-6 6M9 9l6 6" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" opacity="0.35" />
      </svg>
    );
  }

  if (type === 'warning') {
    return (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M12 4l8 14H4l8-14z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
        <path d="M12 9v4" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
        <circle cx="12" cy="16.5" r="1.2" fill="currentColor" />
      </svg>
    );
  }

  if (type === 'loading') {
    return (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M20 12a8 8 0 0 0-8-8" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
        <path d="M4 12a8 8 0 0 0 8 8" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" opacity="0.32" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" opacity="0.35" />
      <path d="M12 10v5" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
      <circle cx="12" cy="7.2" r="1.2" fill="currentColor" />
    </svg>
  );
};

const CloseIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M15.5 8.5l-7 7M8.5 8.5l7 7" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" />
  </svg>
);

const FeedbackToast = ({ message, type = 'success', title, duration = 3200, onClose }) => {
  const generatedId = useId().replaceAll(':', '');
  const toastId = useRef(`feedback-toast-${generatedId}`).current;
  const closeTimeoutRef = useRef(null);
  const autoDismissRef = useRef(null);
  const animationFrameRef = useRef(0);
  const nextMessage = normalizeMessage(message);
  const nextDuration = Number.isFinite(duration) ? Math.max(0, duration) : 3200;
  const [renderedToast, setRenderedToast] = useState(() => (
    nextMessage
      ? { message: nextMessage, type, title, duration: nextDuration }
      : null
  ));
  const [isVisible, setIsVisible] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const [stackIndex, setStackIndex] = useState(0);

  const clearTimers = useCallback(() => {
    if (closeTimeoutRef.current) {
      window.clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }

    if (autoDismissRef.current) {
      window.clearTimeout(autoDismissRef.current);
      autoDismissRef.current = null;
    }

    if (animationFrameRef.current) {
      window.cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = 0;
    }
  }, []);

  const startExit = useCallback((notifyParent = false) => {
    if (!renderedToast || closeTimeoutRef.current) {
      return;
    }

    if (autoDismissRef.current) {
      window.clearTimeout(autoDismissRef.current);
      autoDismissRef.current = null;
    }

    setIsLeaving(true);
    setIsVisible(false);

    closeTimeoutRef.current = window.setTimeout(() => {
      closeTimeoutRef.current = null;
      setIsLeaving(false);
      setRenderedToast(null);
      if (notifyParent) {
        onClose?.();
      }
    }, EXIT_DURATION);
  }, [onClose, renderedToast]);

  useEffect(() => () => clearTimers(), [clearTimers]);

  useEffect(() => {
    if (nextMessage) {
      const isSameToast = (
        renderedToast
        && !isLeaving
        && renderedToast.message === nextMessage
        && renderedToast.type === type
        && renderedToast.title === title
        && renderedToast.duration === nextDuration
      );

      if (isSameToast) {
        return undefined;
      }

      clearTimers();
      setRenderedToast({
        message: nextMessage,
        type,
        title,
        duration: nextDuration,
      });
      setIsLeaving(false);
      setIsVisible(false);
      animationFrameRef.current = window.requestAnimationFrame(() => {
        animationFrameRef.current = window.requestAnimationFrame(() => {
          setIsVisible(true);
        });
      });
      return undefined;
    }

    if (renderedToast) {
      startExit(false);
    }

    return undefined;
  }, [clearTimers, nextDuration, nextMessage, renderedToast, startExit, title, type]);

  useEffect(() => {
    if (!renderedToast) {
      return undefined;
    }

    const syncStackIndex = () => {
      setStackIndex(getToastStackIndex(toastId));
    };

    registerToast(toastId);
    syncStackIndex();
    const unsubscribe = subscribeToStack(syncStackIndex);

    return () => {
      unsubscribe();
      unregisterToast(toastId);
    };
  }, [renderedToast, toastId]);

  useEffect(() => {
    if (!renderedToast || renderedToast.duration <= 0 || renderedToast.type === 'loading' || isLeaving) {
      return undefined;
    }

    autoDismissRef.current = window.setTimeout(() => {
      startExit(true);
    }, renderedToast.duration);

    return () => {
      if (autoDismissRef.current) {
        window.clearTimeout(autoDismissRef.current);
        autoDismissRef.current = null;
      }
    };
  }, [isLeaving, renderedToast, startExit]);

  const handleClose = useCallback(() => {
    startExit(true);
  }, [startExit]);

  const meta = useMemo(() => {
    const resolvedType = renderedToast?.type ?? type;
    return toastMeta[resolvedType] ?? toastMeta.info;
  }, [renderedToast?.type, type]);

  if (!renderedToast) {
    return null;
  }

  const resolvedType = toastMeta[renderedToast.type] ? renderedToast.type : 'info';
  const stackOffset = stackIndex * STACK_GAP;
  const stackScale = Math.max(0.94, 1 - (stackIndex * 0.018));
  const ariaLive = resolvedType === 'error' || resolvedType === 'warning' ? 'assertive' : 'polite';
  const role = resolvedType === 'error' ? 'alert' : 'status';

  return createPortal(
    <div
      className={`feedback-toast-layer ${isVisible ? 'is-visible' : ''} ${isLeaving ? 'is-leaving' : ''}`.trim()}
      role={role}
      aria-live={ariaLive}
      aria-atomic="true"
      style={{
        '--feedback-toast-offset': `${stackOffset}px`,
        '--feedback-toast-scale': String(stackScale),
        zIndex: 10050 + stackIndex,
      }}
    >
      <style>{toastStyles}</style>
      <div
        className={`feedback-toast ${resolvedType}`}
        style={{
          '--feedback-toast-accent': meta.accent,
          '--feedback-toast-border': meta.border,
          '--feedback-toast-glow': meta.glow,
          '--feedback-toast-shadow': meta.shadow,
          '--feedback-toast-icon-bg': meta.iconBg,
          '--feedback-toast-duration': `${renderedToast.duration}ms`,
        }}
      >
        <div className="feedback-toast__icon" aria-hidden="true">
          <ToastIcon type={resolvedType} />
        </div>

        <div className="feedback-toast__body">
          <p className="feedback-toast__eyebrow">{renderedToast.title ?? meta.title}</p>
          <p className="feedback-toast__message">{renderedToast.message}</p>
        </div>

        {onClose ? (
          <button type="button" className="feedback-toast__close" aria-label="Dismiss notification" onClick={handleClose}>
            <CloseIcon />
          </button>
        ) : null}

        {renderedToast.duration > 0 && resolvedType !== 'loading' ? <div className="feedback-toast__meter" aria-hidden="true" /> : null}
      </div>
    </div>,
    document.body,
  );
};

export default FeedbackToast;
