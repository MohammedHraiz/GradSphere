import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { apiClient } from '../api/apiClient';

const AuthContext = createContext(null);

const USER_STORAGE_KEY = 'user';
const TOKEN_STORAGE_KEYS = ['accessToken', 'token', 'jwt'];

const ROLE_ALIASES = {
  student: 'ROLE_STUDENT',
  supervisor: 'ROLE_SUPERVISOR',
  dean: 'ROLE_DEAN_OFFICE',
  deanoffice: 'ROLE_DEAN_OFFICE',
  'dean-office': 'ROLE_DEAN_OFFICE',
  admin: 'ROLE_ADMIN',
};

const isPlainObject = (value) => Boolean(value) && typeof value === 'object' && !Array.isArray(value);

const safeParseJson = (value) => {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
};

const decodeJwtPayload = (token) => {
  if (!token || typeof token !== 'string' || token.split('.').length < 2) {
    return null;
  }

  try {
    const payload = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const normalizedPayload = payload.padEnd(Math.ceil(payload.length / 4) * 4, '=');
    return JSON.parse(atob(normalizedPayload));
  } catch {
    return null;
  }
};

const normalizeRole = (role) => {
  if (!role) {
    return null;
  }

  const rawRole = String(role).trim();
  if (!rawRole) {
    return null;
  }

  const lowerRole = rawRole.toLowerCase().replace(/^role_/, '').replace(/[^a-z]/g, '');
  return ROLE_ALIASES[lowerRole] || (rawRole.startsWith('ROLE_') ? rawRole.toUpperCase() : `ROLE_${lowerRole.toUpperCase()}`);
};

const readStoredToken = () => TOKEN_STORAGE_KEYS.map((key) => localStorage.getItem(key)).find(Boolean) ?? null;

const readStoredUser = () => {
  const rawUser = localStorage.getItem(USER_STORAGE_KEY);
  const parsedUser = rawUser ? safeParseJson(rawUser) : null;
  const token = readStoredToken();
  const tokenPayload = decodeJwtPayload(token);

  const resolvedRole = normalizeRole(
    tokenPayload?.role ||
      tokenPayload?.user?.role ||
      (Array.isArray(tokenPayload?.roles) ? tokenPayload.roles[0] : null) ||
      parsedUser?.role ||
      parsedUser?.user?.role ||
      (Array.isArray(parsedUser?.roles) ? parsedUser.roles[0] : null),
  );

  if (!resolvedRole && !token && !parsedUser) {
    return null;
  }

  const resolvedUser = {
    ...(isPlainObject(parsedUser) ? parsedUser : {}),
    ...(isPlainObject(parsedUser?.user) ? parsedUser.user : {}),
    ...(isPlainObject(tokenPayload) ? tokenPayload : {}),
    role: resolvedRole,
  };

  return {
    token,
    role: resolvedRole,
    user: resolvedUser,
    isAuthenticated: Boolean(token || parsedUser),
  };
};

const normalizeAllowedRoles = (roles) => roles.map(normalizeRole).filter(Boolean);

export const AuthProvider = ({ children }) => {
  const [authState, setAuthState] = useState(() => readStoredUser() ?? { token: null, role: null, user: null, isAuthenticated: false });

  useEffect(() => {
    const syncAuthState = () => {
      setAuthState(readStoredUser() ?? { token: null, role: null, user: null, isAuthenticated: false });
    };

    window.addEventListener('storage', syncAuthState);
    return () => window.removeEventListener('storage', syncAuthState);
  }, []);

  const login = useCallback((nextAuth) => {
    const nextToken = nextAuth?.token ?? null;
    const nextUser = nextAuth?.user ?? nextAuth ?? null;
    const nextRole = normalizeRole(nextAuth?.role || nextUser?.role || nextUser?.user?.role || nextUser?.claims?.role);
    const nextHasTeam = Boolean(nextUser?.hasTeam ?? nextUser?.team?.id ?? nextUser?.teamId ?? nextUser?.team);

    if (nextToken) {
      localStorage.setItem('token', nextToken);
    }

    if (nextUser) {
      const storedUser = { ...nextUser, role: nextRole, hasTeam: nextHasTeam };
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(storedUser));
    }

    setAuthState({
      token: nextToken,
      role: nextRole,
      user: nextUser ? { ...nextUser, role: nextRole, hasTeam: nextHasTeam } : null,
      isAuthenticated: Boolean(nextToken || nextUser),
    });
  }, []);

  const refreshUserProfile = useCallback(async () => {
    const response = await apiClient.get('/v1/users/me');
    const profile = response?.data?.data ?? response?.data ?? null;

    if (!profile) {
      return null;
    }

    login({
      token: readStoredToken(),
      user: profile,
      role: profile?.role ?? profile?.user?.role ?? profile?.claims?.role,
    });

    return profile;
  }, [login]);

  const logout = useCallback(() => {
    TOKEN_STORAGE_KEYS.forEach((key) => localStorage.removeItem(key));
    localStorage.removeItem(USER_STORAGE_KEY);
    setAuthState({ token: null, role: null, user: null, isAuthenticated: false });
  }, []);

  const hasRole = useCallback((allowedRoles = []) => {
    if (!allowedRoles.length) {
      return true;
    }

    const normalizedAllowedRoles = normalizeAllowedRoles(allowedRoles);
    return normalizedAllowedRoles.includes(authState.role);
  }, [authState.role]);

  const value = useMemo(() => ({
    token: authState.token,
    user: authState.user,
    currentUser: authState.user,
    role: authState.role,
    isAuthenticated: authState.isAuthenticated,
    login,
    logout,
    hasRole,
    refreshUserProfile,
  }), [authState, hasRole, refreshUserProfile]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
};

