import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import App from '../App';

const mockUseAuth = vi.fn();

vi.mock('../contexts/AuthContext', () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useAuth: () => mockUseAuth(),
}));

vi.mock('../contexts/NotificationContext', () => ({
  NotificationProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useNotification: () => ({
    showSuccess: vi.fn(),
    showError: vi.fn(),
    showWarning: vi.fn(),
    showInfo: vi.fn(),
  }),
}));

describe('App', () => {
  beforeEach(() => {
    mockUseAuth.mockReturnValue({
      user: null,
      isLoading: false,
      isAuthenticated: false,
      login: vi.fn(),
      logout: vi.fn(),
      passwordExpired: false,
    });
  });

  it('renders without crashing', () => {
    render(<App />);
    expect(document.querySelector('div')).toBeInTheDocument();
  });

  it('renders login page on /login route', async () => {
    window.history.pushState({}, '', '/login');
    render(<App />);
    expect(await screen.findByText('ESSMS')).toBeInTheDocument();
  });
});
