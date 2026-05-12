import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';

const normalizeRole = (role) => {
  if (!role) {
    return null;
  }

  const value = String(role).trim();
  if (!value) {
    return null;
  }

  if (value.startsWith('ROLE_')) {
    return value.toUpperCase();
  }

  return `ROLE_${value.toLowerCase().replace(/^role_/, '').replace(/[^a-z]/g, '').toUpperCase()}`;
};

const ProtectedRoute = ({ allowedRoles = [], redirectTo = '/login', forbiddenTo = '/login', children }) => {
  const location = useLocation();
  const { isAuthenticated, role } = useAuth();

  // Safety: if there's a token in storage treat as authenticated fallback
  const storedToken = (typeof window !== 'undefined' && window.localStorage) ? window.localStorage.getItem('token') : null;

  // If there's no auth at all, redirect to login — but avoid redirecting to the same pathname
  if (!isAuthenticated && !storedToken) {
    if (location?.pathname === redirectTo) return null;
    return <Navigate to={redirectTo} replace state={{ from: location }} />;
  }

  if (allowedRoles.length > 0) {
    const normalizedRole = normalizeRole(role);
    const normalizedAllowedRoles = allowedRoles.map(normalizeRole).filter(Boolean);

    if (!normalizedAllowedRoles.includes(normalizedRole)) {
      if (location?.pathname === forbiddenTo) return null;
      return <Navigate to={forbiddenTo} replace state={{ from: location }} />;
    }
  }

  return children ?? <Outlet />;
};

export default ProtectedRoute;
