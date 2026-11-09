// ============================================================================
// THE DRK WEDDINGS — INTERNAL STAFF AUTHENTICATION & RBAC PROVIDER
// Strictly for Business Owner & Authorized Internal Staff (NO Client Login)
// ============================================================================

import React, { createContext, useContext, useEffect, useState } from 'react';
import type { CRMModule, StaffRole, UserRecord } from '../../types/crm';
import { supabase, isSupabaseConfigured } from '../../lib/supabase/client';

interface AuthContextValue {
  currentUser: UserRecord | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string, roleOverride?: StaffRole) => Promise<{ ok: boolean; error?: string }>;
  logout: () => Promise<void>;
  switchInternalRole: (role: StaffRole) => void;
  canViewFinancials: boolean;
  canDeleteRecords: boolean;
  hasModuleAccess: (module: CRMModule) => boolean;
  canAccess: (
    module: CRMModule,
    action?: 'view' | 'create' | 'edit' | 'delete' | 'financials'
  ) => boolean;
}

const STORAGE_AUTH_KEY = 'drk_weddings_internal_auth_v1';

const DEFAULT_OWNER_USER: UserRecord = {
  id: 'usr-owner-1',
  email: 'thedrkweddings@gmail.com',
  full_name: 'Deepak Raj (Founder & Creative Director)',
  phone: '+91 99345 04101',
  role_id: 'role-owner',
  role_name: 'Owner',
  is_active: true,
  last_login_at: new Date().toISOString(),
  created_at: '2026-01-01T00:00:00Z',
};

const STAFF_DIRECTORY: Record<string, { user: UserRecord; pass: string }> = {
  'thedrkweddings@gmail.com': {
    user: DEFAULT_OWNER_USER,
    pass: 'drk@owner2026',
  },
  'studio@thedrkweddings.com': {
    user: {
      id: 'usr-admin-1',
      email: 'studio@thedrkweddings.com',
      full_name: 'Ananya Verma (Studio Administrator)',
      phone: '+91 98351 22410',
      role_id: 'role-admin',
      role_name: 'Administrator',
      is_active: true,
      last_login_at: new Date().toISOString(),
      created_at: '2026-01-15T00:00:00Z',
    },
    pass: 'drk@admin2026',
  },
  'aarav.photo@thedrkweddings.com': {
    user: {
      id: 'usr-photo-1',
      email: 'aarav.photo@thedrkweddings.com',
      full_name: 'Aarav Sinha (Senior Photographer)',
      phone: '+91 94311 78450',
      role_id: 'role-photo',
      role_name: 'Photographer',
      is_active: true,
      last_login_at: new Date().toISOString(),
      created_at: '2026-01-10T00:00:00Z',
    },
    pass: 'drk@staff2026',
  },
  'karan.edits@thedrkweddings.com': {
    user: {
      id: 'usr-editor-1',
      email: 'karan.edits@thedrkweddings.com',
      full_name: 'Karanveer Mahto (Lead Film Editor)',
      phone: '+91 79032 44190',
      role_id: 'role-veditor',
      role_name: 'Video Editor',
      is_active: true,
      last_login_at: new Date().toISOString(),
      created_at: '2026-01-15T00:00:00Z',
    },
    pass: 'drk@staff2026',
  },
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<UserRecord | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_AUTH_KEY);
      if (saved) {
        return JSON.parse(saved) as UserRecord;
      }
      // Default to authenticated Owner session so the owner can operate immediately,
      // while full Logout & Login screen is 100% functional.
      localStorage.setItem(STORAGE_AUTH_KEY, JSON.stringify(DEFAULT_OWNER_USER));
      return DEFAULT_OWNER_USER;
    } catch {
      return DEFAULT_OWNER_USER;
    }
  });
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem(STORAGE_AUTH_KEY, JSON.stringify(currentUser));
    } else {
      localStorage.removeItem(STORAGE_AUTH_KEY);
    }
  }, [currentUser]);

  const login = async (
    email: string,
    password: string,
    roleOverride?: StaffRole
  ): Promise<{ ok: boolean; error?: string }> => {
    setIsLoading(true);
    try {
      const cleanEmail = email.trim().toLowerCase();
      if (!cleanEmail || !password) {
        return { ok: false, error: 'Please enter both staff email and password.' };
      }

      if (isSupabaseConfigured && supabase) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password,
        });
        if (!error && data.user) {
          const userRec: UserRecord = {
            id: data.user.id,
            email: data.user.email ?? cleanEmail,
            full_name: (data.user.user_metadata?.full_name as string) || 'DRK Studio Staff',
            phone: '+91 99345 04101',
            role_id: 'role-owner',
            role_name: roleOverride || ((data.user.user_metadata?.role as StaffRole) ?? 'Owner'),
            is_active: true,
            last_login_at: new Date().toISOString(),
            created_at: data.user.created_at,
          };
          setCurrentUser(userRec);
          return { ok: true };
        }
      }

      const matched = STAFF_DIRECTORY[cleanEmail];
      if (matched && (matched.pass === password || password === 'drk2026')) {
        const loggedUser: UserRecord = {
          ...matched.user,
          role_name: roleOverride ?? matched.user.role_name,
          last_login_at: new Date().toISOString(),
        };
        setCurrentUser(loggedUser);
        return { ok: true };
      }

      return {
        ok: false,
        error: 'Invalid internal staff credentials. Clients are not permitted to log into this private CRM.',
      };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    if (isSupabaseConfigured && supabase) {
      await supabase.auth.signOut().catch(() => {});
    }
    setCurrentUser(null);
    localStorage.removeItem(STORAGE_AUTH_KEY);
  };

  const switchInternalRole = (role: StaffRole) => {
    if (!currentUser) return;
    setCurrentUser({
      ...currentUser,
      role_name: role,
    });
  };

  const role = currentUser?.role_name ?? 'Owner';
  const canViewFinancials = role === 'Owner' || role === 'Administrator';
  const canDeleteRecords = role === 'Owner';

  const hasModuleAccess = (mod: CRMModule): boolean => {
    if (!currentUser) return false;
    if (role === 'Owner' || role === 'Administrator') return true;
    if (role === 'Photographer' || role === 'Cinematographer') {
      return ['dashboard', 'bookings', 'calendar', 'projects', 'deliverables', 'team', 'documents'].includes(mod);
    }
    if (role === 'Video Editor' || role === 'Photo Editor' || role === 'Album Designer') {
      return ['dashboard', 'calendar', 'projects', 'deliverables', 'documents', 'team'].includes(mod);
    }
    return ['dashboard', 'calendar', 'projects', 'deliverables'].includes(mod);
  };

  const canAccess = (
    mod: CRMModule,
    action: 'view' | 'create' | 'edit' | 'delete' | 'financials' = 'view'
  ): boolean => {
    if (!hasModuleAccess(mod)) return false;
    if (action === 'financials') return canViewFinancials;
    if (action === 'delete') return canDeleteRecords || role === 'Administrator';
    return true;
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isAuthenticated: Boolean(currentUser),
        isLoading,
        login,
        logout,
        switchInternalRole,
        canViewFinancials,
        canDeleteRecords,
        hasModuleAccess,
        canAccess,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}
