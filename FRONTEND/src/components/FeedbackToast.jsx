import { createPortal } from 'react-dom';
import { useCallback, useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from 'react';

const EXIT_DURATION = 220;
const STACK_GAP = 10;

const activeToastIds = [];
const stackSubscribers = new Set();
const toastHeights = new Map();

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

const setToastHeight = (toastId, height) => {
  const nextHeight = Math.max(0, Math.round(height));
  if (toastHeights.get(toastId) !== nextHeight) {
    toastHeights.set(toastId, nextHeight);
    notifyStackSubscribers();
  }
};

const clearToastHeight = (toastId) => {
  if (toastHeights.delete(toastId)) {
    notifyStackSubscribers();
  }
};

const getToastStackOffset = (toastId) => {
  const index = activeToastIds.indexOf(toastId);
  if (index <= 0) {
    return 0;
  }

  return activeToastIds.slice(0, index).reduce((total, id) => {
    return total + (toastHeights.get(id) ?? 0) + STACK_GAP;
  }, 0);
};

const toastStyles = `
.feedback-toast-layer {
  position: fixed;
  bottom: calc(env(safe-area-inset-bottom, 0px) + clamp(12px, 1.8vw, 18px));
  right: clamp(12px, 1.8vw, 20px);
  z-index: 12080;
  width: min(368px, calc(100vw - 24px));
  pointer-events: none;
  opacity: 0;
  will-change: transform, opacity;
  transform: translate3d(18px, calc(var(--feedback-toast-offset, 0px) * -1 + 8px), 0) scale(0.985);
  transition: transform 320ms cubic-bezier(.16,1,.3,1), opacity 220ms ease;
}

.feedback-toast-layer.is-visible {
  opacity: 1;
  transform: translate3d(0, calc(var(--feedback-toast-offset, 0px) * -1), 0) scale(var(--feedback-toast-scale, 1));
}

.feedback-toast-layer.is-leaving {
  opacity: 0;
  transform: translate3d(18px, calc(var(--feedback-toast-offset, 0px) * -1 + 6px), 0) scale(0.98);
}

.feedback-toast {
  position: relative;
  overflow: hidden;
  pointer-events: auto;
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  gap: 12px;
  align-items: start;
  padding: 14px 14px 15px;
  border-radius: 22px;
  border: 1px solid var(--feedback-toast-border, rgba(99, 102, 241, 0.32));
  background:
    radial-gradient(circle at top left, var(--feedback-toast-glow, rgba(79, 70, 229, 0.18)), transparent 46%),
    linear-gradient(180deg, rgba(15, 23, 42, 0.98), rgba(2, 6, 23, 0.98));
  backdrop-filter: blur(18px);
  -webkit-backdrop-filter: blur(18px);
  color: #f8fafc;
  box-shadow:
    0 28px 52px -28px rgba(2, 6, 23, 0.82),
    0 18px 34px -24px var(--feedback-toast-shadow, rgba(79, 70, 229, 0.34)),
    inset 0 1px 0 rgba(255, 255, 255, 0.06);
}

.feedback-toast::before {
  content: '';
  position: absolute;
  inset: 0 0 auto;
  height: 2px;
  background: linear-gradient(90deg, var(--feedback-toast-accent), rgba(255, 255, 255, 0.96));
}

.feedback-toast__icon {
  position: relative;
  width: 40px;
  height: 40px;
  border-radius: 13px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
  color: var(--feedback-toast-accent);
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: var(--feedback-toast-icon-bg, rgba(79, 70, 229, 0.18));
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.05);
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
  gap: 4px;
  padding-top: 1px;
}

.feedback-toast__eyebrow {
  margin: 0;
  color: rgba(226, 232, 240, 0.74);
  font-size: 10.5px;
  font-weight: 900;
  letter-spacing: 0.2em;
  text-transform: uppercase;
}

.feedback-toast__message {
  margin: 0;
  color: #f8fafc;
  font-size: 14px;
  line-height: 1.5;
  font-weight: 780;
  overflow-wrap: anywhere;
}

.feedback-toast__close {
  width: 32px;
  height: 32px;
  margin-top: 0;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 999px;
  background: rgba(15, 23, 42, 0.72);
  color: rgba(226, 232, 240, 0.72);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: transform 180ms ease, background-color 180ms ease, border-color 180ms ease, color 180ms ease, box-shadow 180ms ease;
}

.feedback-toast__close:hover {
  transform: translateY(-1px);
  background: rgba(30, 41, 59, 0.96);
  border-color: rgba(148, 163, 184, 0.24);
  color: #f8fafc;
  box-shadow: 0 14px 24px -20px rgba(2, 6, 23, 0.9);
}

.feedback-toast__close:focus-visible {
  outline: none;
  border-color: var(--feedback-toast-accent);
  box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.18);
}

.feedback-toast__close svg {
  width: 14px;
  height: 14px;
}

.feedback-toast__meter {
  position: absolute;
  left: 14px;
  right: 14px;
  bottom: 0;
  height: 3px;
  overflow: hidden;
  background: rgba(148, 163, 184, 0.16);
  border-radius: 999px;
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
    bottom: calc(env(safe-area-inset-bottom, 0px) + 10px);
    right: 10px;
    width: min(348px, calc(100vw - 20px));
  }

  .feedback-toast {
    padding: 13px 13px 14px;
    gap: 11px;
    border-radius: 20px;
  }

  .feedback-toast__message {
    font-size: 13.5px;
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
    border: 'rgba(16, 185, 129, 0.28)',
    glow: 'rgba(16, 185, 129, 0.22)',
    shadow: 'rgba(16, 185, 129, 0.42)',
    iconBg: 'rgba(16, 185, 129, 0.16)',
  },
  error: {
    title: 'Error',
    accent: '#ef4444',
    border: 'rgba(239, 68, 68, 0.28)',
    glow: 'rgba(239, 68, 68, 0.2)',
    shadow: 'rgba(239, 68, 68, 0.38)',
    iconBg: 'rgba(239, 68, 68, 0.16)',
  },
  warning: {
    title: 'Warning',
    accent: '#f59e0b',
    border: 'rgba(245, 158, 11, 0.28)',
    glow: 'rgba(245, 158, 11, 0.2)',
    shadow: 'rgba(245, 158, 11, 0.36)',
    iconBg: 'rgba(245, 158, 11, 0.18)',
  },
  info: {
    title: 'Info',
    accent: '#4f46e5',
    border: 'rgba(99, 102, 241, 0.28)',
    glow: 'rgba(99, 102, 241, 0.22)',
    shadow: 'rgba(79, 70, 229, 0.42)',
    iconBg: 'rgba(79, 70, 229, 0.18)',
  },
  loading: {
    title: 'Working',
    accent: '#0ea5e9',
    border: 'rgba(14, 165, 233, 0.28)',
    glow: 'rgba(14, 165, 233, 0.22)',
    shadow: 'rgba(14, 165, 233, 0.4)',
    iconBg: 'rgba(14, 165, 233, 0.18)',
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
  const toastElementRef = useRef(null);
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
  const [stackMetrics, setStackMetrics] = useState({ index: 0, offset: 0 });

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
      setStackMetrics({
        index: getToastStackIndex(toastId),
        offset: getToastStackOffset(toastId),
      });
    };

    registerToast(toastId);
    syncStackIndex();
    const unsubscribe = subscribeToStack(syncStackIndex);

    return () => {
      unsubscribe();
      unregisterToast(toastId);
    };
  }, [renderedToast, toastId]);

  useLayoutEffect(() => {
    if (!renderedToast || !toastElementRef.current) {
      return undefined;
    }

    const element = toastElementRef.current;

    const measure = () => {
      setToastHeight(toastId, element.getBoundingClientRect().height);
    };

    measure();

    let resizeObserver = null;
    if (typeof ResizeObserver === 'function') {
      resizeObserver = new ResizeObserver(() => {
        measure();
      });
      resizeObserver.observe(element);
    } else {
      window.addEventListener('resize', measure);
    }

    return () => {
      resizeObserver?.disconnect();
      if (!resizeObserver) {
        window.removeEventListener('resize', measure);
      }
      clearToastHeight(toastId);
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
  const stackOffset = stackMetrics.offset;
  const stackScale = 1;
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
        zIndex: 10050 + stackMetrics.index,
      }}
    >
      <style>{toastStyles}</style>
      <div
        ref={toastElementRef}
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
