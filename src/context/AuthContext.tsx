'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'BA' | 'REVIEWER' | 'ADMIN';
  realRole?: 'BA' | 'REVIEWER' | 'ADMIN';
  previewRole?: 'BA' | 'REVIEWER' | 'ADMIN' | null;
  isActive?: boolean;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email?: string, password?: string, demoRole?: string) => Promise<boolean>;
  logout: () => Promise<void>;
  switchRole: (role: 'BA' | 'REVIEWER' | 'ADMIN') => Promise<void>;
  setPreviewRole: (role: 'BA' | 'REVIEWER' | 'ADMIN' | null) => void;
  resetPreview: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  login: async () => false,
  logout: async () => {},
  switchRole: async () => {},
  setPreviewRole: () => {},
  resetPreview: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [previewRole, setPreviewRoleState] = useState<'BA' | 'REVIEWER' | 'ADMIN' | null>(null);
  const router = useRouter();

  const fetchUser = async () => {
    try {
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        const data = await res.json();
        if (data.authenticated && data.user) {
          setUser(data.user);
        } else {
          setUser(null);
        }
      } else {
        setUser(null);
      }
    } catch (e) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  const login = async (email?: string, password?: string, demoRole?: string) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, demoRole }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setUser(data.user);
        setPreviewRoleState(null);
        return true;
      }
      return false;
    } catch (e) {
      return false;
    }
  };

  const switchRole = async (role: 'BA' | 'REVIEWER' | 'ADMIN') => {
    // Only real System Admin can use previewRole or switch identity
    if (user?.role === 'ADMIN' || user?.realRole === 'ADMIN') {
      setPreviewRoleState(role === 'ADMIN' ? null : role);
      return;
    }
    // Non-admins cannot switch roles
    setLoading(true);
    await login(undefined, undefined, role);
    await fetchUser();
    router.refresh();
  };

  const setPreviewRole = (role: 'BA' | 'REVIEWER' | 'ADMIN' | null) => {
    // Only System Admin can set preview role
    if (user?.realRole === 'ADMIN' || user?.role === 'ADMIN') {
      setPreviewRoleState(role === 'ADMIN' ? null : role);
    }
  };

  const resetPreview = () => {
    setPreviewRoleState(null);
  };

  const logout = async () => {
    try {
      await fetch('/api/auth/me', { method: 'POST' });
    } catch (e) {
      console.error('Logout error:', e);
    }
    setUser(null);
    setPreviewRoleState(null);
    window.location.href = '/login';
  };

  // Determine effective user exposed to UI
  const realRole = user?.realRole || user?.role || 'BA';
  const effectiveRole = previewRole || realRole;

  const effectiveUser: User | null = user
    ? {
        ...user,
        realRole,
        previewRole,
        role: effectiveRole,
      }
    : null;

  return (
    <AuthContext.Provider
      value={{
        user: effectiveUser,
        loading,
        login,
        logout,
        switchRole,
        setPreviewRole,
        resetPreview,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
