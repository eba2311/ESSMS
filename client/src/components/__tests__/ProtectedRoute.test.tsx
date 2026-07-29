import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi } from 'vitest';
import { ProtectedRoute } from '../ProtectedRoute';

const mockUseAuth = vi.fn();

vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

describe('ProtectedRoute', () => {
  it('shows loading spinner when auth is loading', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      isLoading: true,
      user: null,
    });

    render(
      <MemoryRouter>
        <ProtectedRoute roles={['system_admin']}>
          <div>Protected Content</div>
        </ProtectedRoute>
      </MemoryRouter>
    );

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });

  it('redirects to /login when not authenticated', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      isLoading: false,
      user: null,
    });

    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <ProtectedRoute roles={['system_admin']}>
          <div>Protected Content</div>
        </ProtectedRoute>
      </MemoryRouter>
    );

    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });

  it('renders children when authenticated and no roles specified', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      user: { role: 'teacher' },
    });

    render(
      <MemoryRouter>
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>
      </MemoryRouter>
    );

    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });

  it('renders children when user has required role', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      user: { role: 'system_admin' },
    });

    render(
      <MemoryRouter>
        <ProtectedRoute roles={['system_admin', 'academic_head']}>
          <div>Admin Content</div>
        </ProtectedRoute>
      </MemoryRouter>
    );

    expect(screen.getByText('Admin Content')).toBeInTheDocument();
  });

  it('redirects when user lacks required role', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      user: { role: 'student' },
    });

    render(
      <MemoryRouter initialEntries={['/admin']}>
        <ProtectedRoute roles={['system_admin']}>
          <div>Admin Content</div>
        </ProtectedRoute>
      </MemoryRouter>
    );

    expect(screen.queryByText('Admin Content')).not.toBeInTheDocument();
  });
});
