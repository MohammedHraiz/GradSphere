import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { clearAllNotifications, clearReadNotifications, getNotifications, markAllNotificationsAsRead, markNotificationAsRead } from '../../api/notificationService';
import ConfirmDialog from '../../components/ConfirmDialog';
import FeedbackToast from '../../components/FeedbackToast';
import { resolveNotificationLink } from '../../utils/appLinks';
import { useAuth } from '../../auth/AuthContext';

const styles = `
  .notifications-shell { padding: 28px; color: #0f172a; display: flex; flex-direction: column; gap: 18px; }
  .notifications-card { background: rgba(255,255,255,0.95); border: 1px solid rgba(226,232,240,0.95); border-radius: 24px; box-shadow: 0 22px 50px -38px rgba(15,23,42,.55); }
  .notifications-header { display: flex; justify-content: space-between; align-items: flex-end; gap: 16px; flex-wrap: wrap; }
  .notifications-kicker { margin: 0 0 6px; font-size: 12px; font-weight: 900; letter-spacing: .08em; text-transform: uppercase; color: #64748b; }
  .notifications-title { margin: 0; font-size: 32px; font-weight: 900; letter-spacing: -.03em; }
  .notifications-subtitle { margin: 8px 0 0; color: #475569; font-weight: 600; }
  .notifications-toolbar { display: flex; gap: 12px; flex-wrap: wrap; }
  .notifications-btn { border: none; border-radius: 14px; padding: 12px 16px; font-weight: 800; cursor: pointer; background: linear-gradient(135deg, #4f46e5, #2563eb); color: white; box-shadow: 0 16px 30px -22px rgba(79,70,229,.8); }
  .notifications-btn.secondary { background: #eef2ff; color: #312e81; box-shadow: none; }
  .notifications-btn.danger { background: #fff1f2; color: #be123c; box-shadow: none; }
  .notifications-list { overflow: hidden; overflow: clip; overscroll-behavior: auto; }
  .notification-row { padding: 20px 22px; display: flex; gap: 16px; align-items: flex-start; border-top: 1px solid rgba(226,232,240,0.9); }
  .notification-row:first-child { border-top: none; }
  .notification-row.unread { background: linear-gradient(90deg, rgba(238,242,255,0.75), rgba(255,255,255,0.95)); }
  .notification-dot { width: 12px; height: 12px; margin-top: 7px; border-radius: 999px; background: #4f46e5; flex: 0 0 auto; box-shadow: 0 0 0 6px rgba(79,70,229,.12); }
  .notification-dot.read { background: #cbd5e1; box-shadow: none; }
  .notification-body { min-width: 0; flex: 1; }
  .notification-title { margin: 0 0 6px; font-size: 16px; font-weight: 900; }
  .notification-message { margin: 0; color: #475569; font-weight: 600; line-height: 1.55; }
  .notification-meta { margin-top: 10px; font-size: 12px; font-weight: 800; color: #64748b; display: flex; gap: 12px; flex-wrap: wrap; }
  .notification-actions { display: flex; gap: 10px; flex-wrap: wrap; }
  .notification-btn { border: none; border-radius: 12px; padding: 10px 14px; font-weight: 800; cursor: pointer; background: #eef2ff; color: #3730a3; }
  .notifications-state { padding: 42px 28px; text-align: center; }
  .notifications-state h3 { margin: 0 0 10px; font-size: 22px; }
  .notifications-state p { margin: 0; color: #64748b; font-weight: 600; }
`;

const formatTimestamp = (value) => {
  if (!value) return 'Unknown time';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
};

const NotificationsPage = () => {
  const navigate = useNavigate();
  const { role } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyAction, setBusyAction] = useState('');
  const [confirmAction, setConfirmAction] = useState('');
  const [toast, setToast] = useState(null);

  const loadNotifications = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await getNotifications();
      setNotifications(response?.data ?? []);
    } catch (err) {
      setError(err?.message || 'Unable to load notifications.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  const openNotification = async (notification) => {
    try {
      if (!notification.read) {
        await markNotificationAsRead(notification.id);
        setNotifications((current) => current.map((item) => (
          item.id === notification.id ? { ...item, read: true, readAt: new Date().toISOString() } : item
        )));
      }

      const target = resolveNotificationLink(role, notification.link);
      if (target) navigate(target);
    } catch (err) {
      setToast({ message: err?.message || 'Unable to open notification.', type: 'error' });
    }
  };

  const handleMarkRead = async (event, notification) => {
    event.preventDefault();
    event.stopPropagation();

    if (notification.read) {
      return;
    }

    const optimisticReadAt = notification.readAt || new Date().toISOString();

    setNotifications((current) => current.map((item) => (
      item.id === notification.id ? { ...item, read: true, readAt: item.readAt || optimisticReadAt } : item
    )));

    try {
      await markNotificationAsRead(notification.id);
    } catch (err) {
      setNotifications((current) => current.map((item) => (
        item.id === notification.id ? notification : item
      )));
      setToast({ message: err?.message || 'Unable to mark notification as read.', type: 'error' });
    }
  };

  const handleMarkAll = async () => {
    setBusyAction('markAll');
    try {
      await markAllNotificationsAsRead();
      setNotifications((current) => current.map((item) => ({ ...item, read: true, readAt: item.readAt || new Date().toISOString() })));
      setToast({ message: 'All notifications marked as read.' });
    } catch (err) {
      setToast({ message: err?.message || 'Unable to mark all notifications as read.', type: 'error' });
    } finally {
      setBusyAction('');
    }
  };

  const handleClearRead = async () => {
    setBusyAction('clearRead');
    try {
      await clearReadNotifications();
      setNotifications((current) => current.filter((item) => !item.read));
      setToast({ message: 'Read notifications cleared.' });
    } catch (err) {
      setToast({ message: err?.message || 'Unable to clear read notifications.', type: 'error' });
    } finally {
      setConfirmAction('');
      setBusyAction('');
    }
  };

  const handleClearAll = async () => {
    setBusyAction('clearAll');
    try {
      await clearAllNotifications();
      setNotifications([]);
      setToast({ message: 'All notifications cleared.' });
    } catch (err) {
      setToast({ message: err?.message || 'Unable to clear notifications.', type: 'error' });
    } finally {
      setConfirmAction('');
      setBusyAction('');
    }
  };

  const confirmConfig = confirmAction === 'clearRead'
    ? {
        title: 'Clear Read Notifications',
        message: 'Clear all read notifications from your list?',
        confirmLabel: 'Clear Read',
      }
    : {
        title: 'Clear All Notifications',
        message: 'Clear all notifications from your account? This action cannot be undone.',
        confirmLabel: 'Clear All',
      };

  return (
    <div className="notifications-shell">
      <style>{styles}</style>

      <div className="notifications-header">
        <div>
          <p className="notifications-kicker">Notifications</p>
          <h1 className="notifications-title">Notifications</h1>
          <p className="notifications-subtitle">Real alerts from invitations, supervisor workflows, meetings, and project updates.</p>
        </div>
        <div className="notifications-toolbar">
          <button type="button" className="notifications-btn" onClick={handleMarkAll} disabled={busyAction || !notifications.some((item) => !item.read)}>
            {busyAction === 'markAll' ? 'Marking...' : 'Mark All Read'}
          </button>
          <button type="button" className="notifications-btn secondary" onClick={() => setConfirmAction('clearRead')} disabled={busyAction || !notifications.some((item) => item.read)}>
            {busyAction === 'clearRead' ? 'Clearing...' : 'Clear Read'}
          </button>
          <button type="button" className="notifications-btn danger" onClick={() => setConfirmAction('clearAll')} disabled={busyAction || notifications.length === 0}>
            {busyAction === 'clearAll' ? 'Clearing...' : 'Clear All'}
          </button>
        </div>
      </div>

      <section className="notifications-card notifications-list">
        {loading ? (
          <div className="notifications-state">
            <h3>Loading notifications...</h3>
            <p>Fetching your latest real activity.</p>
          </div>
        ) : null}

        {!loading && error ? (
          <div className="notifications-state">
            <h3>Could not load notifications</h3>
            <p>{error}</p>
          </div>
        ) : null}

        {!loading && !error && notifications.length === 0 ? (
          <div className="notifications-state">
            <h3>No notifications yet</h3>
            <p>New invitations, meetings, and workflow updates will appear here.</p>
          </div>
        ) : null}

        {!loading && !error && notifications.map((notification) => (
          <article key={notification.id} className={`notification-row ${notification.read ? '' : 'unread'}`}>
            <div className={`notification-dot ${notification.read ? 'read' : ''}`} />
            <div className="notification-body">
              <h2 className="notification-title">{notification.title}</h2>
              <p className="notification-message">{notification.message}</p>
              <div className="notification-meta">
                <span>{formatTimestamp(notification.createdAt)}</span>
                <span>{notification.read ? 'Read' : 'Unread'}</span>
                <span>{notification.type}</span>
              </div>
            </div>
            <div className="notification-actions">
              {!notification.read ? (
                <button type="button" className="notification-btn" onClick={(event) => handleMarkRead(event, notification)}>
                  Mark Read
                </button>
              ) : null}
              {notification.link ? (
                <button type="button" className="notification-btn" onClick={() => openNotification(notification)}>
                  Open
                </button>
              ) : null}
            </div>
          </article>
        ))}
      </section>

      <ConfirmDialog
        open={Boolean(confirmAction)}
        title={confirmConfig.title}
        message={confirmConfig.message}
        confirmLabel={confirmConfig.confirmLabel}
        cancelLabel="Cancel"
        tone="danger"
        isLoading={busyAction === confirmAction}
        loadingLabel="Clearing..."
        onCancel={() => {
          if (!busyAction) {
            setConfirmAction('');
          }
        }}
        onConfirm={confirmAction === 'clearRead' ? handleClearRead : handleClearAll}
      />

      <FeedbackToast message={toast?.message} type={toast?.type} onClose={() => setToast(null)} />
    </div>
  );
};

export default NotificationsPage;
