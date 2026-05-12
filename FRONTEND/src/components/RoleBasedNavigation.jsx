import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

const navigationItems = [
  { label: 'Overview', to: '/student/overview', roles: ['ROLE_STUDENT'] },
  { label: 'Projects', to: '/supervisor/projects', roles: ['ROLE_SUPERVISOR', 'ROLE_DEAN_OFFICE', 'ROLE_ADMIN'] },
  { label: 'Dean Reports', to: '/dean/reports', roles: ['ROLE_DEAN_OFFICE', 'ROLE_ADMIN'] },
  { label: 'User Management', to: '/admin/users', roles: ['ROLE_ADMIN'] },
];

const RoleBasedNavigation = ({ items = navigationItems, className = '' }) => {
  const { role } = useAuth();

  return (
    <nav className={className}>
      <ul>
        {items
          .filter((item) => !item.roles?.length || item.roles.includes(role))
          .map((item) => (
            <li key={item.to}>
              <Link to={item.to}>{item.label}</Link>
            </li>
          ))}
      </ul>
    </nav>
  );
};

export default RoleBasedNavigation;
