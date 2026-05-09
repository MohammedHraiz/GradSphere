import { useEffect, useMemo, useState } from 'react';
import FeedbackToast from '../../components/FeedbackToast';
import SearchBar from '../../components/SearchBar';
import { createAdminUser, getAdminUsers, updateAdminUser } from '../../api/userService';
import {
  DEPARTMENT_OPTIONS,
  ROLE_OPTIONS,
  formatDepartmentLabel,
  formatRoleLabel,
  getRoleTheme,
  getUserInitials,
  resolveProfilePhotoUrl,
  roleNeedsDepartment,
} from '../../utils/userMeta';
import './ManageUsers.css';

const emptyCreateForm = {
  name: '',
  email: '',
  universityId: '',
  role: 'ROLE_STUDENT',
  department: 'SOFTWARE_ENGINEERING',
};

const emptyEditExtras = {
  phoneNumber: '',
  specialty: '',
  officeHours: '',
};

const getErrorMessage = (error, fallback) => error?.message || error?.response?.data?.message || fallback;

const getUsersLoadError = (error) => {
  if (error?.status === 403) return 'You are not authorized to manage users.';
  if (error?.status >= 500) return getErrorMessage(error, 'Could not load users. Please try again.');
  return getErrorMessage(error, 'Could not load users. Please try again.');
};

const formatCreatedAt = (value) => {
  if (!value) return 'Recently added';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString();
};

const UserFormModal = ({
  mode,
  open,
  formState,
  submitting,
  error,
  onChange,
  onClose,
  onSubmit,
}) => {
  if (!open) return null;

  const isEdit = mode === 'edit';
  const needsDepartment = roleNeedsDepartment(formState.role);
  const canShowOfficeHours = formState.role === 'ROLE_SUPERVISOR';

  return (
    <div className="admin-users-modal" onClick={submitting ? undefined : onClose} role="presentation">
      <div className="admin-users-modal-card" onClick={(event) => event.stopPropagation()}>
        <div className="admin-users-modal-header">
          <div>
            <p className="admin-users-section-kicker">{isEdit ? 'Admin Update' : 'Admin Creation'}</p>
            <h2>{isEdit ? 'Edit User' : 'Create User'}</h2>
            <p>
              {isEdit
                ? 'Update the account identity fields the admin controls, along with optional contact details if needed.'
                : 'Create a new portal account and let the user finish access setup through the existing password or OTP flow.'}
            </p>
          </div>
          <button type="button" className="admin-users-btn-secondary" onClick={onClose} disabled={submitting}>Close</button>
        </div>

        <form onSubmit={onSubmit}>
          <div className="admin-users-modal-body">
            <div className="admin-users-modal-grid">
              <div className="admin-users-field full">
                <label htmlFor={`user-name-${mode}`}>Full Name</label>
                <input
                  id={`user-name-${mode}`}
                  className="admin-users-input"
                  name="name"
                  value={formState.name}
                  onChange={onChange}
                  required
                />
              </div>

              <div className="admin-users-field">
                <label htmlFor={`user-email-${mode}`}>Email Address</label>
                <input
                  id={`user-email-${mode}`}
                  className="admin-users-input"
                  type="email"
                  name="email"
                  value={formState.email}
                  onChange={onChange}
                  required
                />
              </div>

              <div className="admin-users-field">
                <label htmlFor={`user-id-${mode}`}>University ID</label>
                <input
                  id={`user-id-${mode}`}
                  className="admin-users-input"
                  name="universityId"
                  value={formState.universityId}
                  onChange={onChange}
                  placeholder={needsDepartment ? 'Required for students and supervisors' : 'Optional'}
                />
              </div>

              <div className="admin-users-field">
                <label htmlFor={`user-role-${mode}`}>Role</label>
                <select
                  id={`user-role-${mode}`}
                  className="admin-users-select"
                  name="role"
                  value={formState.role}
                  onChange={onChange}
                >
                  {ROLE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>

              {needsDepartment ? (
                <div className="admin-users-field">
                  <label htmlFor={`user-department-${mode}`}>Department</label>
                  <select
                    id={`user-department-${mode}`}
                    className="admin-users-select"
                    name="department"
                    value={formState.department}
                    onChange={onChange}
                    required={needsDepartment}
                  >
                    {DEPARTMENT_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </div>
              ) : null}

              {isEdit ? (
                <>
                  <div className="admin-users-field">
                    <label htmlFor="user-phone-edit">Phone Number</label>
                    <input
                      id="user-phone-edit"
                      className="admin-users-input"
                      name="phoneNumber"
                      value={formState.phoneNumber}
                      onChange={onChange}
                    />
                  </div>

                  <div className="admin-users-field">
                    <label htmlFor="user-specialty-edit">Specialty</label>
                    <input
                      id="user-specialty-edit"
                      className="admin-users-input"
                      name="specialty"
                      value={formState.specialty}
                      onChange={onChange}
                    />
                  </div>

                  {canShowOfficeHours ? (
                    <div className="admin-users-field full">
                      <label htmlFor="user-office-hours-edit">Office Hours</label>
                      <textarea
                        id="user-office-hours-edit"
                        className="admin-users-textarea"
                        name="officeHours"
                        value={formState.officeHours}
                        onChange={onChange}
                        rows={3}
                      />
                    </div>
                  ) : null}
                </>
              ) : null}
            </div>

            <p className="admin-users-helper">
              Students and supervisors must have a department. Dean Office and Admin accounts ignore department.
            </p>
            {error ? <p className="admin-users-error">{error}</p> : null}
          </div>

          <div className="admin-users-modal-footer">
            <button type="button" className="admin-users-btn-secondary" onClick={onClose} disabled={submitting}>Cancel</button>
            <button type="submit" className="admin-users-btn" disabled={submitting}>
              {submitting ? (isEdit ? 'Saving...' : 'Creating...') : (isEdit ? 'Save Changes' : 'Create User')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const ManageUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState('');
  const [toast, setToast] = useState(null);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [createForm, setCreateForm] = useState(emptyCreateForm);
  const [editForm, setEditForm] = useState({ ...emptyCreateForm, ...emptyEditExtras });
  const [submitting, setSubmitting] = useState(false);
  const [modalError, setModalError] = useState('');

  useEffect(() => {
    const timeoutId = window.setTimeout(async () => {
      setLoading(true);
      setPageError('');
      try {
        const data = await getAdminUsers({
          search: search || undefined,
          role: roleFilter || undefined,
          department: departmentFilter || undefined,
        });
        setUsers(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('Failed to load admin users', error);
        setPageError(getUsersLoadError(error));
        setUsers([]);
      } finally {
        setLoading(false);
      }
    }, 180);

    return () => window.clearTimeout(timeoutId);
  }, [search, roleFilter, departmentFilter]);

  useEffect(() => {
    if (!showCreateModal && !editingUser) {
      setModalError('');
      setSubmitting(false);
    }
  }, [showCreateModal, editingUser]);

  const stats = useMemo(() => ({
    total: users.length,
    students: users.filter((user) => user.role === 'ROLE_STUDENT').length,
    supervisors: users.filter((user) => user.role === 'ROLE_SUPERVISOR').length,
    admins: users.filter((user) => user.role === 'ROLE_ADMIN' || user.role === 'ROLE_DEAN_OFFICE').length,
  }), [users]);

  const statValue = (value) => {
    if (loading && users.length === 0) return '…';
    if (pageError && users.length === 0) return '—';
    return value;
  };

  const handleCreateChange = (event) => {
    const { name, value } = event.target;
    setCreateForm((current) => {
      const next = { ...current, [name]: value };
      if (name === 'role' && !roleNeedsDepartment(value)) {
        next.department = '';
        next.universityId = '';
      } else if (name === 'role' && roleNeedsDepartment(value) && !next.department) {
        next.department = DEPARTMENT_OPTIONS[0].value;
      }
      return next;
    });
  };

  const handleEditChange = (event) => {
    const { name, value } = event.target;
    setEditForm((current) => {
      const next = { ...current, [name]: value };
      if (name === 'role' && !roleNeedsDepartment(value)) {
        next.department = '';
        next.universityId = '';
        next.officeHours = '';
      } else if (name === 'role' && roleNeedsDepartment(value) && !next.department) {
        next.department = DEPARTMENT_OPTIONS[0].value;
      }
      if (name === 'role' && value !== 'ROLE_SUPERVISOR') {
        next.officeHours = '';
      }
      return next;
    });
  };

  const reloadUsers = async () => {
    const data = await getAdminUsers({
      search: search || undefined,
      role: roleFilter || undefined,
      department: departmentFilter || undefined,
    });
    setUsers(Array.isArray(data) ? data : []);
    setPageError('');
  };

  const handleCreateSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setModalError('');
    try {
      await createAdminUser({
        name: createForm.name.trim(),
        email: createForm.email.trim(),
        universityId: createForm.universityId.trim() || null,
        role: createForm.role,
        department: roleNeedsDepartment(createForm.role) ? createForm.department : null,
      });
      setShowCreateModal(false);
      setCreateForm(emptyCreateForm);
      await reloadUsers();
      setToast({ message: 'User created successfully.' });
    } catch (error) {
      console.error('Failed to create user', error);
      setModalError(getErrorMessage(error, 'Unable to create user.'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditSubmit = async (event) => {
    event.preventDefault();
    if (!editingUser?.id) return;

    setSubmitting(true);
    setModalError('');
    try {
      await updateAdminUser(editingUser.id, {
        name: editForm.name.trim(),
        email: editForm.email.trim(),
        universityId: editForm.universityId.trim() || null,
        role: editForm.role,
        department: roleNeedsDepartment(editForm.role) ? editForm.department : null,
        phoneNumber: editForm.phoneNumber.trim() || null,
        specialty: editForm.specialty.trim() || null,
        officeHours: editForm.role === 'ROLE_SUPERVISOR' ? editForm.officeHours.trim() || null : null,
      });
      setEditingUser(null);
      await reloadUsers();
      setToast({ message: 'User updated successfully.' });
    } catch (error) {
      console.error('Failed to update user', error);
      setModalError(getErrorMessage(error, 'Unable to update user.'));
    } finally {
      setSubmitting(false);
    }
  };

  const openEditModal = (user) => {
    setEditingUser(user);
    setEditForm({
      name: user.name ?? '',
      email: user.email ?? '',
      universityId: user.universityId ?? '',
      role: user.role ?? 'ROLE_STUDENT',
      department: user.department ?? (roleNeedsDepartment(user.role) ? DEPARTMENT_OPTIONS[0].value : ''),
      phoneNumber: user.phoneNumber ?? '',
      specialty: user.specialty ?? '',
      officeHours: user.officeHours ?? '',
    });
    setModalError('');
  };

  const renderRoleBadge = (role) => {
    const theme = getRoleTheme(role);
    return <span className={`admin-users-badge role-${theme.badge}`}>{formatRoleLabel(role)}</span>;
  };

  return (
    <div className="admin-users-page">
      <div className="admin-users-header">
        <div>
          <p className="admin-users-kicker">Root Access / User Management</p>
          <h1 className="admin-users-title">Manage Users</h1>
          <p className="admin-users-subtitle">
            Create portal accounts, update admin-controlled user identity fields, and keep role and department assignments consistent across the system.
          </p>
        </div>

        <div className="admin-users-actions">
          <button
            type="button"
            className="admin-users-btn"
            onClick={() => {
              setCreateForm(emptyCreateForm);
              setShowCreateModal(true);
            }}
          >
            Create User
          </button>
        </div>
      </div>

      <div className="admin-users-summary">
        <div className="admin-users-stat">
          <span>Total Users</span>
          <strong>{statValue(stats.total)}</strong>
        </div>
        <div className="admin-users-stat">
          <span>Students</span>
          <strong>{statValue(stats.students)}</strong>
        </div>
        <div className="admin-users-stat">
          <span>Supervisors</span>
          <strong>{statValue(stats.supervisors)}</strong>
        </div>
        <div className="admin-users-stat">
          <span>Admin & Dean</span>
          <strong>{statValue(stats.admins)}</strong>
        </div>
      </div>

      <div className="admin-users-toolbar">
        <div className="admin-users-field">
          <label htmlFor="admin-user-search">Search Users</label>
          <SearchBar
            id="admin-user-search"
            placeholder="Search by name, email, or university ID"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            onClear={() => setSearch('')}
            variant="dark"
          />
        </div>

        <div className="admin-users-field">
          <label htmlFor="admin-user-role-filter">Role Filter</label>
          <select
            id="admin-user-role-filter"
            className="admin-users-select"
            value={roleFilter}
            onChange={(event) => setRoleFilter(event.target.value)}
          >
            <option value="">All Roles</option>
            {ROLE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </div>

        <div className="admin-users-field">
          <label htmlFor="admin-user-department-filter">Department Filter</label>
          <select
            id="admin-user-department-filter"
            className="admin-users-select"
            value={departmentFilter}
            onChange={(event) => setDepartmentFilter(event.target.value)}
          >
            <option value="">All Departments</option>
            {DEPARTMENT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </div>
      </div>

      {pageError ? <div className="admin-users-empty">{pageError}</div> : null}

      {!pageError ? (
        <section className="admin-users-table-card">
          <div className="admin-users-table-head">
            <div>
              <p className="admin-users-section-kicker">Portal Accounts</p>
              <h2>Users Directory</h2>
              <p>Search, filter, and update the user accounts already stored in the system.</p>
            </div>
          </div>

          {loading ? (
            <div className="admin-users-empty">Loading users...</div>
          ) : users.length === 0 ? (
            <div className="admin-users-empty">No users found.</div>
          ) : (
            <div className="admin-users-table-wrap">
              <table className="admin-users-table">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Email</th>
                    <th>University ID</th>
                    <th>Role</th>
                    <th>Department</th>
                    <th>Specialty</th>
                    <th>Phone</th>
                    <th>Created</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => {
                    const theme = getRoleTheme(user.role);
                    return (
                      <tr key={user.id}>
                        <td>
                          <div className="admin-users-usercell">
                            <div className="admin-users-avatar" style={{ background: `linear-gradient(135deg, ${theme.accent}, #1d4ed8)` }}>
                              {user.profilePhotoUrl ? (
                                <img src={resolveProfilePhotoUrl(user.profilePhotoUrl)} alt={user.name} />
                              ) : (
                                getUserInitials(user.name)
                              )}
                            </div>
                            <div>
                              <span className="admin-users-username">{user.name}</span>
                              <span className="admin-users-usermeta">{user.id}</span>
                            </div>
                          </div>
                        </td>
                        <td>{user.email}</td>
                        <td>{user.universityId || 'Not assigned'}</td>
                        <td>{renderRoleBadge(user.role)}</td>
                        <td>{user.department ? formatDepartmentLabel(user.department) : 'Not assigned'}</td>
                        <td>{user.specialty || 'Not added yet'}</td>
                        <td>{user.phoneNumber || 'Not added yet'}</td>
                        <td>{formatCreatedAt(user.createdAt)}</td>
                        <td>
                          <div className="admin-users-actions-cell">
                            <button type="button" className="admin-users-icon-btn" onClick={() => openEditModal(user)} title="Edit user">
                              Edit
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      ) : null}

      <UserFormModal
        mode="create"
        open={showCreateModal}
        formState={createForm}
        submitting={submitting}
        error={modalError}
        onChange={handleCreateChange}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreateSubmit}
      />

      <UserFormModal
        mode="edit"
        open={Boolean(editingUser)}
        formState={editForm}
        submitting={submitting}
        error={modalError}
        onChange={handleEditChange}
        onClose={() => setEditingUser(null)}
        onSubmit={handleEditSubmit}
      />

      <FeedbackToast message={toast?.message} type={toast?.type} onClose={() => setToast(null)} />
    </div>
  );
};

export default ManageUsers;
