import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getAllSupervisorRequests } from '../../api/projectService';
import SearchBar from '../../components/SearchBar';

const supervisorRequestStyles = `
.dsr-container { padding: 20px 30px 60px 30px; font-family: 'Plus Jakarta Sans', -apple-system, sans-serif; color: #0f172a; text-align: left; background: #f8fafc; min-height: 100vh; }
.dsr-header-box { display: flex; justify-content: space-between; align-items: flex-end; gap: 18px; margin-bottom: 24px; background: white; padding: 25px 30px; border-radius: 20px; border: 1px solid #e2e8f0; box-shadow: 0 4px 15px -5px rgba(0,0,0,0.02); }
.dsr-kicker { color: #d97706; font-size: 13px; font-weight: 800; text-transform: uppercase; letter-spacing: 1.5px; margin: 0 0 5px 0; }
.dsr-title { font-size: 32px; font-weight: 900; margin: 0; color: #0f172a; letter-spacing: -1px; }
.dsr-header-actions { display: flex; gap: 12px; flex-wrap: wrap; }
.dsr-button { background: white; border: 1px solid #cbd5e1; color: #475569; padding: 12px 18px; border-radius: 12px; font-weight: 800; font-size: 13px; cursor: pointer; transition: 0.2s; font-family: inherit; }
.dsr-button:hover:not(:disabled) { background: #f8fafc; border-color: #94a3b8; color: #0f172a; transform: translateY(-1px); }
.dsr-button.dark { background: #0f172a; color: white; border-color: #0f172a; }
.dsr-button:disabled { opacity: .6; cursor: not-allowed; }
.dsr-alert { margin-bottom: 18px; border-radius: 14px; padding: 13px 15px; font-size: 14px; font-weight: 700; }
.dsr-alert.error { border: 1px solid #fecaca; background: #fff1f2; color: #be123c; }
.dsr-alert.success { border: 1px solid #bbf7d0; background: #f0fdf4; color: #047857; }
.dsr-toolbar { display: flex; gap: 15px; background: white; padding: 15px; border-radius: 16px; border: 1px solid #e2e8f0; margin-bottom: 22px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.02); }
.dsr-search { flex: 1; }
.dsr-filter { width: 100%; padding: 12px 14px; border: 1px solid #e2e8f0; border-radius: 10px; font-size: 14px; font-weight: 600; outline: none; box-sizing: border-box; font-family: inherit; background: white; }
.dsr-filter:focus { border-color: #0f172a; box-shadow: 0 0 0 3px rgba(15,23,42,.1); }
.dsr-filter { width: 190px; color: #475569; background: #f8fafc; cursor: pointer; }
.dsr-table-card { background: white; border: 1px solid #e2e8f0; border-radius: 20px; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.02); overflow-x: auto; }
.dsr-table { width: 100%; min-width: 1120px; border-collapse: collapse; }
.dsr-table th { padding: 16px 18px; background: #f8fafc; font-size: 11px; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 1px; border-bottom: 1px solid #e2e8f0; text-align: left; }
.dsr-table td { padding: 18px; border-bottom: 1px solid #f1f5f9; font-size: 14px; font-weight: 600; color: #1e293b; vertical-align: top; }
.dsr-table tr:last-child td { border-bottom: none; }
.dsr-main-text { font-size: 15px; font-weight: 900; color: #0f172a; margin-bottom: 4px; }
.dsr-sub-text { font-size: 12px; color: #94a3b8; font-weight: 700; overflow-wrap: anywhere; }
.dsr-message { max-width: 260px; white-space: normal; line-height: 1.45; color: #475569; }
.dsr-badge { display: inline-flex; padding: 7px 11px; border-radius: 9999px; font-size: 11px; font-weight: 900; text-transform: uppercase; letter-spacing: .04em; }
.dsr-badge.pending { background: #eef2ff; color: #4f46e5; }
.dsr-badge.accepted { background: #d1fae5; color: #047857; }
.dsr-badge.rejected { background: #fee2e2; color: #b91c1c; }
.dsr-badge.canceled { background: #e2e8f0; color: #334155; }
.dsr-empty { text-align: center; padding: 54px 20px; color: #64748b; font-weight: 700; }
@media (max-width: 900px) { .dsr-header-box { align-items: flex-start; flex-direction: column; } .dsr-toolbar { flex-direction: column; } .dsr-filter { width: 100%; } }
`;

const STATUS_OPTIONS = ['ALL', 'PENDING', 'ACCEPTED', 'REJECTED', 'CANCELED'];

const statusClass = (status) => {
  const value = String(status || 'PENDING').toUpperCase();
  if (value === 'ACCEPTED') return 'accepted';
  if (value === 'REJECTED') return 'rejected';
  if (value === 'CANCELED') return 'canceled';
  return 'pending';
};

const formatStatus = (status) => String(status || 'PENDING').replace(/_/g, ' ');

const formatDate = (value) => {
  if (!value) return 'Not available';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Not available';
  return date.toLocaleString();
};

const normalizeRequest = (request) => ({
  id: request?.id || '',
  projectTitle: request?.projectTitle || request?.project?.title || 'Untitled Project',
  projectId: request?.projectId || request?.project?.id || '',
  teamName: request?.teamName || request?.team?.name || 'Not linked',
  teamId: request?.teamId || request?.team?.id || '',
  supervisorName: request?.supervisorName || request?.supervisor?.name || 'Unknown Supervisor',
  supervisorEmail: request?.supervisorEmail || request?.supervisor?.email || '',
  requestedByName: request?.requestedByName || request?.requestedBy?.name || 'Unknown User',
  requestedByEmail: request?.requestedByEmail || request?.requestedBy?.email || '',
  status: request?.status || 'PENDING',
  message: request?.message || '',
  responseMessage: request?.responseMessage || '',
  createdAt: request?.createdAt || request?.createdDate || '',
});

const DeanSupervisorRequests = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isAdminPath = location.pathname.startsWith('/admin');
  const [requests, setRequests] = useState([]);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [alert, setAlert] = useState(null);

  const loadRequests = async ({ showSuccess = false } = {}) => {
    setIsLoading(true);
    setAlert(null);

    try {
      const response = await getAllSupervisorRequests();
      const payload = response?.data;
      const items = Array.isArray(payload) ? payload : Array.isArray(payload?.requests) ? payload.requests : [];
      setRequests(items.map(normalizeRequest));
      if (showSuccess) {
        setAlert({ type: 'success', message: 'Supervisor requests refreshed.' });
      }
    } catch (err) {
      setRequests([]);
      setAlert({ type: 'error', message: err?.response?.data?.message || err?.message || 'Unable to load supervisor requests.' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadRequests();
  }, []);

  const filteredRequests = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();
    return requests.filter((request) => {
      const matchesStatus = statusFilter === 'ALL' || String(request.status).toUpperCase() === statusFilter;
      const matchesSearch = !search || [
        request.projectTitle,
        request.teamName,
        request.supervisorName,
        request.supervisorEmail,
        request.requestedByName,
        request.requestedByEmail,
        request.message,
        request.responseMessage,
      ].filter(Boolean).some((value) => String(value).toLowerCase().includes(search));
      return matchesStatus && matchesSearch;
    });
  }, [requests, searchTerm, statusFilter]);

  return (
    <div className="dsr-container">
      <style>{supervisorRequestStyles}</style>

      <div className="dsr-header-box">
        <div>
          <p className="dsr-kicker">Supervisor Request Oversight</p>
          <h1 className="dsr-title">Supervisor Requests</h1>
        </div>
        <div className="dsr-header-actions">
          <button className="dsr-button" onClick={() => navigate(isAdminPath ? '/admin/projects' : '/dean/projects')}>Back to Projects</button>
          <button className="dsr-button dark" disabled={isLoading} onClick={() => void loadRequests({ showSuccess: true })}>Refresh</button>
        </div>
      </div>

      {alert ? <div className={`dsr-alert ${alert.type}`}>{alert.message}</div> : null}

      <div className="dsr-toolbar">
        <SearchBar className="dsr-search" placeholder="Search by project, team, supervisor, requester, or message..." value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} onClear={() => setSearchTerm('')} />
        <select className="dsr-filter" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
          {STATUS_OPTIONS.map((status) => (
            <option key={status} value={status}>{status === 'ALL' ? 'All Statuses' : formatStatus(status)}</option>
          ))}
        </select>
      </div>

      <div className="dsr-table-card">
        <table className="dsr-table">
          <thead>
            <tr>
              <th>Project</th>
              <th>Team</th>
              <th>Requested Supervisor</th>
              <th>Requested By</th>
              <th>Status</th>
              <th>Message</th>
              <th>Response Message</th>
              <th>Created Date</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan="8" className="dsr-empty">Loading supervisor requests...</td></tr>
            ) : filteredRequests.length === 0 ? (
              <tr><td colSpan="8" className="dsr-empty">No supervisor requests found.</td></tr>
            ) : filteredRequests.map((request) => (
              <tr key={request.id || `${request.projectId}-${request.supervisorName}-${request.createdAt}`}>
                <td>
                  <div className="dsr-main-text">{request.projectTitle}</div>
                  <div className="dsr-sub-text">{request.teamName || 'Not linked'}</div>
                </td>
                <td>
                  <div>{request.teamName}</div>
                  <div className="dsr-sub-text">{request.projectTitle}</div>
                </td>
                <td>
                  <div>{request.supervisorName}</div>
                  {request.supervisorEmail ? <div className="dsr-sub-text">{request.supervisorEmail}</div> : null}
                </td>
                <td>
                  <div>{request.requestedByName}</div>
                  {request.requestedByEmail ? <div className="dsr-sub-text">{request.requestedByEmail}</div> : null}
                </td>
                <td><span className={`dsr-badge ${statusClass(request.status)}`}>{formatStatus(request.status)}</span></td>
                <td><div className="dsr-message">{request.message || 'No message provided.'}</div></td>
                <td><div className="dsr-message">{request.responseMessage || 'No response yet.'}</div></td>
                <td>{formatDate(request.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DeanSupervisorRequests;
