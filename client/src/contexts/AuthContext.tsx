import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authAPI, getApiErrorMessage } from '../services/api';
import type { User, ApiResponse } from '../types';

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<{ passwordExpired: boolean }>;
  logout: () => void;
  isLoading: boolean;
  isAuthenticated: boolean;
  passwordExpired: boolean;
}

interface LoginPayload {
  user: User;
  accessToken: string;
  refreshToken: string;
  passwordExpired?: boolean;
  requiresMFA?: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [passwordExpired, setPasswordExpired] = useState(false);

  const login = async (email: string, password: string): Promise<{ passwordExpired: boolean }> => {
    try {
      const response = await authAPI.login(email, password);
      const data = response.data as ApiResponse<LoginPayload>;
      const requiresMFA = data.requiresMFA || data.data?.requiresMFA;

      if (requiresMFA) {
        const mfaError = new Error('MFA Required');
        (mfaError as any).response = { data: { requireMfa: true } };
        throw mfaError;
      }

      const payload = data.data ?? data;
      const userData: User | undefined = (payload as LoginPayload).user;
      const accessToken = (payload as LoginPayload).accessToken;
      const refreshToken = (payload as LoginPayload).refreshToken;

      if (!userData || !accessToken || !refreshToken) {
        throw new Error('Invalid login response from server');
      }

      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      setUser(userData);
      setToken(accessToken);
      setPasswordExpired(!!(payload as LoginPayload).passwordExpired);
      return { passwordExpired: !!(payload as LoginPayload).passwordExpired };
    } catch (error: unknown) {
      if (error instanceof Error && (error as any).response && (error as any).response?.data) {
        const respData = (error as any).response.data as Record<string, unknown>;
        if (respData.requireMfa || respData.requiresMFA) {
          throw error;
        }
      }
      throw new Error(getApiErrorMessage(error, 'Login failed'));
    }
  };

  const loadUser = async () => {
    const storedToken = localStorage.getItem('accessToken');
    if (storedToken) {
      try {
        const response = await authAPI.profile();
        const data = response.data as ApiResponse<User>;
        const profile: User = data.data ?? data;
        setUser(profile);
        setToken(storedToken);
      } catch {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
      }
    }
    setIsLoading(false);
  };

  const logout = async () => {
    try {
      await authAPI.logout();
    } catch {
    } finally {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      setUser(null);
      setToken(null);
      setPasswordExpired(false);
    }
  };

  useEffect(() => {
    loadUser();
  }, []);

  const value: AuthContextType = {
    user,
    token,
    login,
    logout,
    isLoading,
    isAuthenticated: !!user,
    passwordExpired,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
