import React from 'react';
import { render, screen, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuthProvider, useAuth } from '../AuthContext';

const mockLogin = vi.fn();
const mockLogout = vi.fn();
const mockProfile = vi.fn();

vi.mock('../../services/api', () => ({
  authAPI: {
    login: (...args: any[]) => mockLogin(...args),
    logout: (...args: any[]) => mockLogout(...args),
    profile: (...args: any[]) => mockProfile(...args),
  },
  getApiErrorMessage: (error: any) => error?.message || 'API Error',
}));

const TestComponent: React.FC = () => {
  const { isAuthenticated, isLoading, user, login, logout } = useAuth();
  return (
    <div>
      <span data-testid="auth-status">
        {isLoading ? 'loading' : isAuthenticated ? 'authenticated' : 'unauthenticated'}
      </span>
      {user && <span data-testid="user-role">{user.role}</span>}
      <button onClick={() => login('test@test.com', 'password')}>Login</button>
      <button onClick={() => logout()}>Logout</button>
    </div>
  );
};

describe('AuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    mockProfile.mockRejectedValue(new Error('No token'));
  });

  it('should show loading state initially', () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );
    expect(screen.getByTestId('auth-status').textContent).toBe('loading');
  });

  it('should show unauthenticated when no token', async () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('auth-status').textContent).toBe('unauthenticated');
    });
  });

  it('should attempt to restore session from stored token', async () => {
    localStorage.setItem('accessToken', 'stored-token');
    mockProfile.mockResolvedValue({
      data: {
        data: {
          id: '1',
          userId: 'U001',
          firstName: 'Test',
          lastName: 'User',
          email: 'test@test.com',
          role: 'teacher',
          isActive: true,
        },
      },
    });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('auth-status').textContent).toBe('authenticated');
    });
    expect(screen.getByTestId('user-role').textContent).toBe('teacher');
  });

  it('should login successfully', async () => {
    mockLogin.mockResolvedValue({
      data: {
        data: {
          user: { id: '1', userId: 'U001', firstName: 'Test', lastName: 'User', email: 'test@test.com', role: 'admin', isActive: true },
          accessToken: 'new-token',
          refreshToken: 'refresh-token',
        },
      },
    });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('auth-status').textContent).toBe('unauthenticated');
    });

    await act(async () => {
      screen.getByText('Login').click();
    });

    expect(localStorage.getItem('accessToken')).toBe('new-token');
  });

  it('should handle MFA requirement during login', async () => {
    mockLogin.mockRejectedValue(
      Object.assign(new Error('MFA Required'), {
        response: { data: { requireMfa: true } },
      })
    );

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => screen.getByText('Login'));

    await expect(
      act(async () => {
        await screen.getByText('Login').click();
      })
    ).rejects.toThrow('MFA Required');
  });

  it('should logout and clear tokens', async () => {
    localStorage.setItem('accessToken', 'test-token');
    localStorage.setItem('refreshToken', 'test-refresh');
    mockProfile.mockResolvedValue({
      data: {
        data: {
          id: '1',
          userId: 'U001',
          firstName: 'Test',
          lastName: 'User',
          email: 'test@test.com',
          role: 'teacher',
          isActive: true,
        },
      },
    });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('auth-status').textContent).toBe('authenticated');
    });

    await act(async () => {
      screen.getByText('Logout').click();
    });

    expect(localStorage.getItem('accessToken')).toBeNull();
    expect(screen.getByTestId('auth-status').textContent).toBe('unauthenticated');
  });
});
