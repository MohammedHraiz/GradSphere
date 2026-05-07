import { useMemo, useState } from 'react';
import { resubmitProjectProposal, submitProjectProposal } from '../api/projectService';

const styles = `
.proposal-form { display: grid; gap: 18px; }
.proposal-field { display: grid; gap: 8px; }
.proposal-form label { display: inline-flex; align-items: center; gap: 8px; color: #475569; font-size: 12px; font-weight: 900; text-transform: uppercase; letter-spacing: .08em; }
.proposal-form input, .proposal-form textarea, .proposal-form select { width: 100%; box-sizing: border-box; border: 1px solid #dbe2ea; border-radius: 16px; padding: 13px 15px; font: inherit; font-size: 14px; outline: none; background: white; color: #0f172a; transition: border-color 0.18s ease, box-shadow 0.18s ease, background 0.18s ease; }
.proposal-form input:focus, .proposal-form textarea:focus, .proposal-form select:focus { border-color: #4f46e5; box-shadow: 0 0 0 4px rgba(79,70,229,.10); }
.proposal-form input[readonly] { background: #f8fafc; color: #334155; font-weight: 800; }
.proposal-form textarea { min-height: 140px; resize: vertical; }
.proposal-form textarea::placeholder, .proposal-form input::placeholder { color: #94a3b8; }
.proposal-form-help { margin: 0; color: #64748b; font-size: 12px; font-weight: 600; line-height: 1.55; }
.proposal-form-error { margin: 0; color: #b91c1c; font-size: 12px; font-weight: 800; line-height: 1.5; }
.proposal-form-actions { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 4px; }
.proposal-form-btn { border: 0; border-radius: 14px; background: linear-gradient(135deg, #4f46e5, #4338ca); color: white; padding: 13px 16px; font-weight: 900; cursor: pointer; box-shadow: 0 12px 24px -18px rgba(79,70,229,.8); transition: transform 0.18s ease, box-shadow 0.18s ease, opacity 0.18s ease; }
.proposal-form-btn:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 18px 28px -20px rgba(79,70,229,.88); }
.proposal-form-btn:disabled { opacity: .68; cursor: not-allowed; box-shadow: none; transform: none; }
.proposal-form-btn.secondary { background: white; color: #0f172a; border: 1px solid #cbd5e1; box-shadow: none; }
.proposal-form-btn.secondary:hover:not(:disabled) { border-color: #94a3b8; }
`;

const initialFormState = {
  description: '',
  supervisorId: '',
  requestMessage: '',
  studentChangeNote: '',
};

const ProjectSubmissionForm = ({
  mode = 'submit',
  projectId,
  projectName,
  initialDescription = '',
  supervisors = [],
  requireSupervisor = true,
  requireFile = true,
  onSuccess,
}) => {
  const [formData, setFormData] = useState({
    ...initialFormState,
    description: initialDescription,
  });
  const [proposalFile, setProposalFile] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isResubmit = mode === 'resubmit';
  const canSubmit = useMemo(() => {
    if (!String(formData.description || '').trim()) return false;
    if (requireFile && !proposalFile) return false;
    if (requireSupervisor && !formData.supervisorId) return false;
    if (isResubmit && !String(formData.studentChangeNote || '').trim()) return false;
    return true;
  }, [formData.description, formData.studentChangeNote, formData.supervisorId, proposalFile, requireFile, requireSupervisor, isResubmit]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
    setFieldErrors((current) => ({ ...current, [name]: '' }));
  };

  const handleFileChange = (event) => {
    const nextFile = event.target.files?.[0] ?? null;
    setProposalFile(nextFile);
    setFieldErrors((current) => ({ ...current, file: '', proposalFile: '' }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!canSubmit) {
      setFieldErrors({
        description: !String(formData.description || '').trim() ? 'Proposal description is required.' : '',
        file: requireFile && !proposalFile ? 'Proposal file is required.' : '',
        supervisorId: requireSupervisor && !formData.supervisorId ? 'Please select a supervisor.' : '',
        studentChangeNote: isResubmit && !String(formData.studentChangeNote || '').trim() ? 'Please explain what changed in this resubmission.' : '',
      });
      return;
    }

    setIsSubmitting(true);
    setServerError('');
    setFieldErrors({});

    try {
      const payload = {
        description: formData.description,
        supervisorId: requireSupervisor ? formData.supervisorId : '',
        requestMessage: formData.requestMessage,
        studentChangeNote: formData.studentChangeNote,
      };
      const response = isResubmit
        ? await resubmitProjectProposal(projectId, payload, proposalFile)
        : await submitProjectProposal(payload, proposalFile);
      setFormData({ ...initialFormState, description: isResubmit ? formData.description : '' });
      setProposalFile(null);
      event.target.reset();
      onSuccess?.(response?.data);
    } catch (error) {
      if (error.isValidationError) {
        setFieldErrors(error.fieldErrors || {});
      } else {
        const apiMessage = error?.response?.data?.message;
        setServerError(apiMessage || 'Something went wrong while submitting the proposal.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const submitLabel = isResubmit ? 'Resubmit Proposal' : 'Submit Proposal';
  const submittingLabel = isResubmit ? 'Resubmitting...' : 'Submitting...';

  return (
    <form className="proposal-form" onSubmit={handleSubmit}>
      <style>{styles}</style>
      <div className="proposal-field">
        <label htmlFor={`${mode}-project-name`}>Project Name</label>
        <input
          id={`${mode}-project-name`}
          value={projectName || 'Current team name'}
          readOnly
          aria-readonly="true"
        />
        <p className="proposal-form-help">
          Team name is used as the project name.
        </p>
      </div>

      <div className="proposal-field">
        <label htmlFor={`${mode}-proposal-description`}>Description</label>
        <textarea
          id={`${mode}-proposal-description`}
          name="description"
          value={formData.description}
          onChange={handleChange}
          placeholder="Describe the graduation project scope, goals, and expected outcomes"
          required
          disabled={isSubmitting}
          aria-invalid={Boolean(fieldErrors.description)}
        />
        {fieldErrors.description ? <p className="proposal-form-error">{fieldErrors.description}</p> : null}
      </div>

      <div className="proposal-field">
        <label htmlFor={`${mode}-proposal-file`}>{isResubmit ? 'Replacement Proposal PDF' : 'Proposal PDF'}</label>
        <input
          id={`${mode}-proposal-file`}
          type="file"
          accept="application/pdf,.pdf"
          onChange={handleFileChange}
          required={requireFile}
          disabled={isSubmitting}
          aria-invalid={Boolean(fieldErrors.proposalFile || fieldErrors.file)}
        />
        {!requireFile ? (
          <p className="proposal-form-help">
            Optional. Leave empty to keep the existing proposal file.
          </p>
        ) : null}
        {fieldErrors.proposalFile || fieldErrors.file ? <p className="proposal-form-error">{fieldErrors.proposalFile || fieldErrors.file}</p> : null}
      </div>

      {requireSupervisor ? (
        <>
          <div className="proposal-field">
            <label htmlFor={`${mode}-supervisor`}>Supervisor</label>
            <select
              id={`${mode}-supervisor`}
              name="supervisorId"
              value={formData.supervisorId}
              onChange={handleChange}
              required
              disabled={isSubmitting || !supervisors.length}
              aria-invalid={Boolean(fieldErrors.supervisorId)}
            >
              <option value="">{supervisors.length ? 'Select a supervisor' : 'No supervisors available'}</option>
              {supervisors.map((supervisor) => (
                <option key={supervisor.id} value={supervisor.id}>{supervisor.name} ({supervisor.email})</option>
              ))}
            </select>
            {fieldErrors.supervisorId ? <p className="proposal-form-error">{fieldErrors.supervisorId}</p> : null}
          </div>

          <div className="proposal-field">
            <label htmlFor={`${mode}-request-message`}>Optional Supervisor Request Message</label>
            <textarea
              id={`${mode}-request-message`}
              name="requestMessage"
              value={formData.requestMessage}
              onChange={handleChange}
              placeholder="Optional message to the selected supervisor"
              rows={3}
              disabled={isSubmitting}
            />
          </div>
        </>
      ) : null}

      {isResubmit ? (
        <div className="proposal-field">
          <label htmlFor={`${mode}-change-note`}>What did you change?</label>
          <textarea
            id={`${mode}-change-note`}
            name="studentChangeNote"
            value={formData.studentChangeNote}
            onChange={handleChange}
            placeholder="Explain how you addressed the feedback..."
            rows={3}
            disabled={isSubmitting}
            aria-invalid={Boolean(fieldErrors.studentChangeNote)}
            required
          />
          {fieldErrors.studentChangeNote ? <p className="proposal-form-error">{fieldErrors.studentChangeNote}</p> : <p className="proposal-form-help">Required for resubmission.</p>}
        </div>
      ) : null}

      {serverError ? <p className="proposal-form-error">{serverError}</p> : null}
      <div className="proposal-form-actions">
        <button type="submit" className="proposal-form-btn" disabled={isSubmitting || !canSubmit}>
          {isSubmitting ? submittingLabel : submitLabel}
        </button>
      </div>
    </form>
  );
};

export default ProjectSubmissionForm;
