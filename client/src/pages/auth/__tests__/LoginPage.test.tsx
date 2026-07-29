import React from 'react';
import { render, screen, act, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LoginPage } from '../LoginPage';

const mockLogin = vi.fn();
const mockShowSuccess = vi.fn();
const mockNavigate = vi.fn();

vi.mock('../../../contexts/AuthContext', () => ({
  useAuth: () => ({
    login: mockLogin,
    isAuthenticated: false,
  }),
}));

vi.mock('../../../contexts/NotificationContext', () => ({
  useNotification: () => ({
    showSuccess: mockShowSuccess,
  }),
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('renders the login form', () => {
    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    );

    expect(screen.getByText('ESSMS')).toBeInTheDocument();
    expect(screen.getByText('Welcome Back')).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  it('shows demo account info', () => {
    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    );

    expect(screen.getByText('Demo Accounts')).toBeInTheDocument();
    expect(screen.getByText(/admin/i)).toBeInTheDocument();
  });

  it('calls login on form submission', async () => {
    mockLogin.mockResolvedValue({ passwordExpired: false });

    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    );

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);

    await userEvent.type(emailInput, 'admin@test.com');
    await userEvent.type(passwordInput, 'Admin123!');

    await act(async () => {
      screen.getByRole('button', { name: /sign in/i }).click();
    });

    expect(mockLogin).toHaveBeenCalledWith('admin@test.com', 'Admin123!');
  });

  it('navigates to change-password when password expired', async () => {
    mockLogin.mockResolvedValue({ passwordExpired: true });

    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    );

    await userEvent.type(screen.getByLabelText(/email/i), 'admin@test.com');
    await userEvent.type(screen.getByLabelText(/password/i), 'Admin123!');

    await act(async () => {
      screen.getByRole('button', { name: /sign in/i }).click();
    });

    expect(mockNavigate).toHaveBeenCalledWith('/change-password');
  });

  it('navigates to MFA when required', async () => {
    mockLogin.mockRejectedValue(
      Object.assign(new Error('MFA Required'), {
        response: { data: { requireMfa: true } },
      })
    );

    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    );

    await userEvent.type(screen.getByLabelText(/email/i), 'admin@test.com');
    await userEvent.type(screen.getByLabelText(/password/i), 'Admin123!');

    await act(async () => {
      screen.getByRole('button', { name: /sign in/i }).click();
    });

    expect(localStorage.getItem('mfaEmail')).toBe('admin@test.com');
    expect(mockNavigate).toHaveBeenCalledWith('/mfa');
  });

  it('shows error message on login failure', async () => {
    mockLogin.mockRejectedValue(new Error('Invalid credentials'));

    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    );

    await userEvent.type(screen.getByLabelText(/email/i), 'admin@test.com');
    await userEvent.type(screen.getByLabelText(/password/i), 'wrong');

    await act(async () => {
      screen.getByRole('button', { name: /sign in/i }).click();
    });

    expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
  });
});
