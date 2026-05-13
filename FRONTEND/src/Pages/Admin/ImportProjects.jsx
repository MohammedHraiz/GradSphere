import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import StyledSelect from '../../components/StyledSelect';
import StyledFileInput from '../../components/StyledFileInput';
import FeedbackToast from '../../components/FeedbackToast';
import ConfirmDialog from '../../components/ConfirmDialog';
import { DEPARTMENT_OPTIONS, formatDepartmentLabel } from '../../utils/userMeta';
import { confirmStudentPdfImport, previewStudentPdfImport } from '../../api/userService';

/**
 * Import / Export Data - System Admin
 * BAU PDF student import flow with preview + confirm steps.
 */

const importStyles = `
  .ad-import-container {
    padding: 20px 30px 60px 30px;
    font-family: 'Plus Jakarta Sans', -apple-system, sans-serif;
    color: #f8fafc;
    background: #0b1121;
    min-height: 100vh;
    animation: fadeInPage 0.4s ease-out;
    text-align: left;
  }

  @keyframes fadeInPage { from { opacity: 0; transform: translateY(15px); } to { opacity: 1; transform: translateY(0); } }

  .ad-header-box { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 30px; background: #0f172a; padding: 25px 30px; border-radius: 20px; border: 1px solid #1e293b; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.5); }
  .ad-kicker { color: #06b6d4; font-size: 13px; font-weight: 800; text-transform: uppercase; letter-spacing: 1.5px; margin: 0 0 5px 0; display: flex; align-items: center; gap: 8px;}
  .ad-kicker::before { content: ''; display: inline-block; width: 8px; height: 8px; background: #06b6d4; border-radius: 50%; box-shadow: 0 0 8px #06b6d4;}
  .ad-title { font-size: 32px; font-weight: 900; margin: 0; color: #f8fafc; letter-spacing: -1px; }

  .ad-header-actions { display: flex; gap: 12px; }
  .btn-ad-outline { background: #1e293b; border: 1px solid #334155; color: #f8fafc; padding: 12px 20px; border-radius: 12px; font-weight: 800; font-size: 13px; cursor: pointer; transition: 0.2s; display: flex; align-items: center; gap: 8px; }
  .btn-ad-outline:hover { background: #334155; border-color: #475569; transform: translateY(-2px); }

  .ad-grid { display: grid; grid-template-columns: minmax(0, 1.3fr) minmax(0, 1fr); gap: 24px; margin-bottom: 28px; }
  @media (max-width: 1100px) { .ad-grid { grid-template-columns: 1fr; } }

  .ad-card { background: #0f172a; border: 1px solid #1e293b; border-radius: 24px; padding: 25px; box-shadow: 0 10px 30px -10px rgba(0,0,0,0.5); }
  .ad-card-title { font-size: 16px; font-weight: 900; color: #f8fafc; margin: 0 0 18px 0; display: flex; align-items: center; gap: 8px;}

  .ad-helper { margin: 0 0 18px; font-size: 13px; color: #94a3b8; line-height: 1.6; }
  .ad-upload-actions { display: grid; gap: 12px; }

  .btn-upload { width: 100%; padding: 14px; background: linear-gradient(135deg, #06b6d4, #3b82f6); color: white; border: none; border-radius: 12px; font-weight: 800; font-size: 14px; cursor: pointer; transition: 0.2s; box-shadow: 0 4px 15px rgba(6, 182, 212, 0.3); }
  .btn-upload:hover { box-shadow: 0 8px 25px rgba(6, 182, 212, 0.5); transform: translateY(-2px); }
  .btn-upload:disabled { background: #334155; color: #94a3b8; cursor: not-allowed; box-shadow: none; transform: none; }

  .ad-alert { margin-top: 14px; padding: 12px 14px; border-radius: 12px; background: rgba(239, 68, 68, 0.12); border: 1px solid rgba(239, 68, 68, 0.28); color: #fecaca; font-size: 12px; font-weight: 700; }
  .ad-preview-meta { margin-top: 12px; display: flex; gap: 10px; flex-wrap: wrap; font-size: 12px; font-weight: 700; color: #94a3b8; }

  .ad-summary-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px; }
  .ad-summary-card { background: #111c33; border: 1px solid #1e293b; border-radius: 18px; padding: 16px; }
  .ad-summary-card span { display: block; color: #94a3b8; font-size: 11px; font-weight: 900; letter-spacing: 0.08em; text-transform: uppercase; }
  .ad-summary-card strong { display: block; margin-top: 8px; color: #f8fafc; font-size: 24px; font-weight: 900; }
  .ad-summary-sub { margin-top: 6px; font-size: 11px; color: #64748b; font-weight: 700; }

  .ad-override { margin-top: 18px; display: grid; gap: 10px; }
  .ad-override label { color: #94a3b8; font-size: 12px; font-weight: 900; letter-spacing: 0.08em; text-transform: uppercase; }

  .ad-table-card { background: #0f172a; border: 1px solid #1e293b; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.5); }
  .ad-table-head { padding: 18px 24px; border-bottom: 1px solid #1e293b; display: flex; justify-content: space-between; align-items: center; gap: 12px; }
  .ad-table-head h3 { margin: 0; font-size: 18px; font-weight: 900; color: #f8fafc; }
  .ad-table-head p { margin: 4px 0 0; font-size: 12px; color: #94a3b8; font-weight: 700; }
  .ad-table { width: 100%; border-collapse: collapse; text-align: left; }
  .ad-table th { padding: 15px 20px; background: #1e293b; font-size: 11px; font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px; border-bottom: 1px solid #334155; }
  .ad-table td { padding: 14px 20px; border-bottom: 1px solid #1e293b; font-size: 13px; font-weight: 600; color: #cbd5e1; vertical-align: top; }
  .ad-table tr:hover td { background: #172033; color: #f8fafc; }
  .ad-table tr:last-child td { border-bottom: none; }

  .status-pill { display: inline-flex; align-items: center; padding: 4px 10px; border-radius: 999px; font-size: 10px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.08em; border: 1px solid transparent; }
  .status-valid { background: rgba(52, 211, 153, 0.12); color: #34d399; border-color: rgba(52, 211, 153, 0.3); }
  .status-invalid { background: rgba(248, 113, 113, 0.12); color: #f87171; border-color: rgba(248, 113, 113, 0.3); }
  .status-duplicate { background: rgba(250, 204, 21, 0.14); color: #facc15; border-color: rgba(250, 204, 21, 0.3); }
  .status-exists { background: rgba(59, 130, 246, 0.12); color: #60a5fa; border-color: rgba(59, 130, 246, 0.3); }

  .ad-empty { margin-top: 18px; padding: 18px; border-radius: 18px; border: 1px dashed #1e293b; color: #94a3b8; font-size: 13px; font-weight: 700; }

  .ad-result-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px; margin-top: 14px; }
  .ad-result-card { background: #111c33; border: 1px solid #1e293b; border-radius: 18px; padding: 14px; }
  .ad-result-card span { display: block; color: #94a3b8; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.08em; }
  .ad-result-card strong { display: block; margin-top: 8px; color: #f8fafc; font-size: 22px; font-weight: 900; }
  .ad-result-errors { margin-top: 12px; padding: 12px; border-radius: 12px; background: rgba(15, 23, 42, 0.8); border: 1px solid #1e293b; color: #e2e8f0; font-size: 12px; font-weight: 600; }

  .ad-file-input .styled-file-input-shell { background: #0b1121; border-color: #334155; }
  .ad-file-input .styled-file-input-name { color: #cbd5e1; }
  .ad-file-input .styled-file-input-name.is-placeholder { color: #64748b; }
  .ad-file-input .styled-file-input-button { background: #1e293b; border: 1px solid #334155; color: #f8fafc; }
  .ad-file-input .styled-file-input-shell:hover { border-color: #22d3ee; }

  .ad-select .styled-select-trigger { background: #0b1121; border-color: #334155; color: #f8fafc; }
  .ad-select .styled-select-trigger:hover { border-color: #22d3ee; }

  @media print {
    .sidebar-wrapper, .top-header, .ad-header-actions, .btn-upload { display: none !important; }
    .ad-import-container { background: white !important; color: black !important; padding: 0; min-height: auto; }
    .ad-header-box, .ad-card, .ad-table-card { background: white !important; border: 1px solid #ccc !important; box-shadow: none !important; color: black !important; }
    .ad-title, .ad-card-title, .ad-table td { color: black !important; }
    .ad-table th { background: #f1f5f9 !important; color: black !important; border-bottom: 2px solid #ccc !important;}
    body { background: white !important; -webkit-print-color-adjust: exact; }
  }
`;

const STATUS_META = {
  VALID: { label: 'Valid', className: 'status-valid' },
  INVALID: { label: 'Invalid', className: 'status-invalid' },
  DUPLICATE_IN_FILE: { label: 'Duplicate', className: 'status-duplicate' },
  ALREADY_EXISTS: { label: 'Already exists', className: 'status-exists' },
};

const ImportProjects = () => {
  const navigate = useNavigate();
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewData, setPreviewData] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState('');
  const [departmentOverride, setDepartmentOverride] = useState('');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [toast, setToast] = useState(null);

  const rows = previewData?.rows ?? [];

  const resolveDepartment = (row) => departmentOverride || row.department || previewData?.detectedDepartment || '';

  const effectiveRows = useMemo(() => rows.map((row) => {
    const department = resolveDepartment(row);
    const errors = [];

    if (!String(row.name || '').trim()) {
      errors.push('Name is required.');
    }
    if (!String(row.universityId || '').trim()) {
      errors.push('University ID is required.');
    }
    if (!department) {
      errors.push('Department is required.');
    }

    const originalErrors = Array.isArray(row.errors) ? row.errors : [];
    originalErrors
      .filter((error) => error !== 'Name is required.' && error !== 'University ID is required.' && error !== 'Department is required.')
      .forEach((error) => errors.push(error));

    let status = row.status;
    if (row.status === 'DUPLICATE_IN_FILE' || row.status === 'ALREADY_EXISTS') {
      status = row.status;
    } else {
      status = errors.length ? 'INVALID' : 'VALID';
    }

    return {
      ...row,
      department,
      status,
      errors,
    };
  }), [departmentOverride, previewData?.detectedDepartment, rows]);

  const summary = useMemo(() => ({
    total: effectiveRows.length || previewData?.totalRows || 0,
    valid: effectiveRows.filter((row) => row.status === 'VALID').length,
    invalid: effectiveRows.filter((row) => row.status === 'INVALID').length,
    existing: effectiveRows.filter((row) => row.status === 'ALREADY_EXISTS').length,
    duplicates: effectiveRows.filter((row) => row.status === 'DUPLICATE_IN_FILE').length,
  }), [effectiveRows, previewData?.totalRows]);

  const needsDepartmentOverride = Boolean(previewData && !previewData.detectedDepartment);

  const eligibleCount = useMemo(() => {
    if (!effectiveRows.length) return 0;
    return effectiveRows.filter((row) => row.status === 'VALID').length;
  }, [effectiveRows]);

  const handleFileChange = (event) => {
    const nextFile = event.target.files?.[0] ?? null;
    setSelectedFile(nextFile);
    setPreviewData(null);
    setPreviewError('');
    setResult(null);
    setDepartmentOverride('');
  };

  const handlePreview = async () => {
    if (!selectedFile) {
      setPreviewError('Please choose a PDF file to preview.');
      return;
    }

    setPreviewLoading(true);
    setPreviewError('');
    setResult(null);

    try {
      const response = await previewStudentPdfImport(selectedFile);
      setPreviewData(response);
      setToast({ message: 'Preview ready. Review the rows before confirming.' });
    } catch (error) {
      console.error('Preview import failed', error);
      setPreviewError(error?.message || 'Unable to preview the PDF.');
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleConfirm = async () => {
    if (!previewData) {
      return;
    }

    setConfirmOpen(false);
    setConfirmLoading(true);
    try {
      const payload = {
        rows: effectiveRows.map((row) => ({
          rowNumber: row.rowNumber,
          name: row.name,
          universityId: row.universityId,
          department: row.department,
          role: row.role,
        })),
        departmentOverride: departmentOverride || null,
        skipInvalid: true,
      };

      const response = await confirmStudentPdfImport(payload);
      setResult(response);

      if (response?.createdCount > 0) {
        setToast({ message: `Imported ${response.createdCount} students.`, type: 'success' });
      } else {
        setToast({ message: 'No new accounts were created.', type: 'warning' });
      }
    } catch (error) {
      console.error('Confirm import failed', error);
      setToast({ message: error?.message || 'Import failed. Please try again.', type: 'error' });
    } finally {
      setConfirmLoading(false);
    }
  };

  const detectedDepartmentLabel = previewData?.detectedDepartmentLabel
    || formatDepartmentLabel(previewData?.detectedDepartment, 'Not detected');

  const renderDepartment = (row) => formatDepartmentLabel(row.department, 'Not detected');

  return (
    <div className="ad-import-container">
      <style>{importStyles}</style>
      <FeedbackToast message={toast?.message} type={toast?.type} onClose={() => setToast(null)} />

      <ConfirmDialog
        open={confirmOpen}
        title="Confirm student import"
        message={`This will create ${eligibleCount} new student accounts from the previewed PDF.`}
        confirmLabel="Import students"
        loadingLabel="Importing..."
        isLoading={confirmLoading}
        onConfirm={handleConfirm}
        onCancel={() => setConfirmOpen(false)}
      />

      <div className="ad-header-box">
        <div>
          <p className="ad-kicker">Database Management</p>
          <h1 className="ad-title">Import & Export Data</h1>
        </div>
        <div className="ad-header-actions">
          <button className="btn-ad-outline" onClick={() => navigate('/admin/dashboard')}>Back</button>
          <button className="btn-ad-outline" onClick={() => window.print()}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
            Print Log
          </button>
        </div>
      </div>

      <div className="ad-grid">
        <div className="ad-card">
          <h3 className="ad-card-title">Import Students from BAU PDF</h3>
          <p className="ad-helper">
            Upload a BAU course PDF. The system will extract student names and IDs, generate emails,
            and let you review before creating accounts. Only text-based PDFs are supported.
          </p>

          <div className="ad-upload-actions">
            <StyledFileInput
              className="ad-file-input"
              accept="application/pdf"
              onChange={handleFileChange}
              disabled={previewLoading || confirmLoading}
              placeholder="Select a BAU course PDF"
              buttonLabel="Choose PDF"
            />

            <button
              type="button"
              className="btn-upload"
              onClick={handlePreview}
              disabled={!selectedFile || previewLoading || confirmLoading}
            >
              {previewLoading ? 'Extracting Students...' : 'Preview Students'}
            </button>
          </div>

          {previewError ? <div className="ad-alert">{previewError}</div> : null}

          <div className="ad-preview-meta">
            <span>Detected Department: {detectedDepartmentLabel}</span>
            <span>Eligible rows: {eligibleCount}</span>
          </div>
        </div>

        <div className="ad-card">
          <h3 className="ad-card-title">Preview Summary</h3>
          <div className="ad-summary-grid">
            <div className="ad-summary-card">
              <span>Total Rows</span>
              <strong>{summary.total}</strong>
              <div className="ad-summary-sub">Duplicates: {summary.duplicates}</div>
            </div>
            <div className="ad-summary-card">
              <span>Valid Rows</span>
              <strong>{summary.valid}</strong>
              <div className="ad-summary-sub">Eligible after override: {eligibleCount}</div>
            </div>
            <div className="ad-summary-card">
              <span>Already Exists</span>
              <strong>{summary.existing}</strong>
            </div>
            <div className="ad-summary-card">
              <span>Invalid Rows</span>
              <strong>{summary.invalid}</strong>
            </div>
          </div>

          <div className="ad-override">
            <label htmlFor="department-override">Department Override (Optional)</label>
            <StyledSelect
              id="department-override"
              className="ad-select"
              value={departmentOverride}
              onChange={(event) => setDepartmentOverride(event.target.value)}
              disabled={!previewData || previewLoading || confirmLoading}
            >
              <option value="">{previewData?.detectedDepartment ? 'Use detected department' : 'Select department'}</option>
              {DEPARTMENT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </StyledSelect>
          </div>

          <button
            type="button"
            className="btn-upload"
            style={{ marginTop: '18px' }}
            onClick={() => setConfirmOpen(true)}
            disabled={!previewData || eligibleCount === 0 || (needsDepartmentOverride && !departmentOverride) || confirmLoading}
          >
            {confirmLoading ? 'Importing...' : 'Confirm Import'}
          </button>
        </div>
      </div>

      {previewData ? (
        <div className="ad-table-card">
          <div className="ad-table-head">
            <div>
              <h3>Preview Students</h3>
              <p>Review extracted names and IDs before creating accounts.</p>
            </div>
            <div className="ad-preview-meta">
              <span>Total: {summary.total}</span>
              <span>Valid: {summary.valid}</span>
              <span>Invalid: {summary.invalid}</span>
            </div>
          </div>
          {effectiveRows.length === 0 ? (
            <div className="ad-empty">No rows were extracted from this PDF.</div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="ad-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>University ID</th>
                    <th>Generated Email</th>
                    <th>Department</th>
                    <th>Status</th>
                    <th>Errors</th>
                  </tr>
                </thead>
                <tbody>
                  {effectiveRows.map((row) => {
                    const statusMeta = STATUS_META[row.status] ?? { label: 'Unknown', className: 'status-invalid' };
                    return (
                      <tr key={`${row.rowNumber}-${row.universityId || row.name}`}>
                        <td style={{ fontWeight: 800, color: '#f8fafc' }}>{row.name || '-'}</td>
                        <td>{row.universityId || '-'}</td>
                        <td>{row.generatedEmail || '-'}</td>
                        <td>{renderDepartment(row)}</td>
                        <td><span className={`status-pill ${statusMeta.className}`}>{statusMeta.label}</span></td>
                        <td>{Array.isArray(row.errors) && row.errors.length ? row.errors.join('; ') : '-'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        <div className="ad-empty">Upload a PDF to generate a preview.</div>
      )}

      {result ? (
        <div className="ad-card" style={{ marginTop: '24px' }}>
          <h3 className="ad-card-title">Import Result</h3>
          <div className="ad-result-grid">
            <div className="ad-result-card">
              <span>Created</span>
              <strong>{result.createdCount ?? 0}</strong>
            </div>
            <div className="ad-result-card">
              <span>Skipped</span>
              <strong>{result.skippedCount ?? 0}</strong>
            </div>
            <div className="ad-result-card">
              <span>Failed</span>
              <strong>{result.failedCount ?? 0}</strong>
            </div>
          </div>
          {Array.isArray(result.errors) && result.errors.length ? (
            <div className="ad-result-errors">{result.errors.join(' | ')}</div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
};

export default ImportProjects;
