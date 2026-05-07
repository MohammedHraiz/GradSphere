import { createPortal } from 'react-dom';

const confirmStyles = `
.confirm-backdrop { position: fixed; inset: 0; z-index: 10040; display: flex; align-items: center; justify-content: center; padding: 20px; background: rgba(2, 6, 23, .68); backdrop-filter: blur(10px); }
.confirm-card { width: min(460px, 100%); max-height: min(88vh, 760px); overflow: auto; border-radius: 24px; background: linear-gradient(180deg, rgba(255,255,255,0.98), rgba(248,250,252,0.98)); border: 1px solid rgba(226, 232, 240, 0.95); box-shadow: 0 36px 80px -34px rgba(2, 6, 23, .92); padding: 22px; color: #0f172a; text-align: left; }
.confirm-top { display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; margin-bottom: 10px; }
.confirm-title-wrap { display: grid; gap: 4px; }
.confirm-eyebrow { margin: 0; color: #4f46e5; font-size: 12px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.08em; }
.confirm-card h3 { margin: 0; font-size: 21px; font-weight: 900; letter-spacing: -0.02em; }
.confirm-card p { margin: 0 0 22px; color: #64748b; font-size: 14px; line-height: 1.65; font-weight: 600; }
.confirm-actions { display: flex; justify-content: flex-end; gap: 10px; flex-wrap: wrap; }
.confirm-btn { border: 1px solid #cbd5e1; background: white; color: #0f172a; border-radius: 14px; padding: 11px 15px; min-width: 104px; font-weight: 900; cursor: pointer; transition: transform 0.18s ease, box-shadow 0.18s ease, background 0.18s ease, border-color 0.18s ease; }
.confirm-btn:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 14px 22px -18px rgba(15,23,42,.35); }
.confirm-btn.primary { border-color: #0f172a; background: #0f172a; color: white; }
.confirm-btn.primary:hover:not(:disabled) { background: #111827; }
.confirm-btn.danger { border-color: rgba(239,68,68,0.2); background: #fee2e2; color: #b91c1c; }
.confirm-btn.danger:hover:not(:disabled) { background: #fecaca; border-color: rgba(239,68,68,0.28); }
.confirm-btn:disabled { opacity: .65; cursor: not-allowed; transform: none; box-shadow: none; }
.confirm-btn.secondary { background: #f8fafc; }
.confirm-close { width: 34px; height: 34px; border-radius: 9999px; border: 1px solid rgba(203,213,225,0.9); background: white; color: #64748b; cursor: pointer; font-size: 18px; display: flex; align-items: center; justify-content: center; flex: 0 0 auto; transition: 0.18s ease; }
.confirm-close:hover { color: #0f172a; border-color: #cbd5e1; }
.confirm-tint { width: 44px; height: 44px; border-radius: 16px; display: flex; align-items: center; justify-content: center; flex: 0 0 auto; font-size: 20px; font-weight: 900; background: rgba(79,70,229,0.12); color: #4f46e5; }
.confirm-tint.danger { background: rgba(239,68,68,0.12); color: #dc2626; }
`;

const ConfirmDialog = ({
  open,
  title = 'Confirm action',
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  tone = 'primary',
  isLoading = false,
  loadingLabel = 'Working...',
  onConfirm,
  onCancel,
}) => {
  if (!open) return null;

  const tintClass = tone === 'danger' ? 'danger' : 'primary';

  return createPortal(
    <div className="confirm-backdrop" onClick={isLoading ? undefined : onCancel} role="presentation">
      <style>{confirmStyles}</style>
      <div className="confirm-card" onClick={(event) => event.stopPropagation()}>
        <div className="confirm-top">
          <div className="confirm-title-wrap">
            <p className="confirm-eyebrow">Please confirm</p>
            <h3>{title}</h3>
          </div>
          <div className={`confirm-tint ${tintClass}`} aria-hidden="true">!</div>
        </div>
        <p>{message}</p>
        <div className="confirm-actions">
          <button type="button" className="confirm-btn secondary" disabled={isLoading} onClick={onCancel}>{cancelLabel}</button>
          <button type="button" className={`confirm-btn ${tone}`} disabled={isLoading} onClick={onConfirm}>
            {isLoading ? loadingLabel : confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
};

export default ConfirmDialog;
