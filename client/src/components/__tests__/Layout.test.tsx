import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi } from 'vitest';
import { Layout } from '../Layout';

const mockUseAuth = vi.fn();
let mockLocationPathname = '/dashboard';

vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useLocation: () => ({ pathname: mockLocationPathname }),
  };
});

describe('Layout', () => {
  it('renders without crashing', () => {
    mockUseAuth.mockReturnValue({
      user: { firstName: 'Test', lastName: 'User', role: 'system_admin' },
      logout: vi.fn(),
    });

    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <Layout />
      </MemoryRouter>
    );

    expect(screen.getByText('ESSMS')).toBeInTheDocument();
  });

  it('shows user name in header', () => {
    mockUseAuth.mockReturnValue({
      user: { firstName: 'John', lastName: 'Doe', role: 'system_admin' },
      logout: vi.fn(),
    });

    render(
      <MemoryRouter>
        <Layout />
      </MemoryRouter>
    );

    expect(screen.getByText(/John/i)).toBeInTheDocument();
  });

  it('shows navigation items for admin user', () => {
    mockUseAuth.mockReturnValue({
      user: { firstName: 'Admin', lastName: 'User', role: 'system_admin' },
      logout: vi.fn(),
    });

    render(
      <MemoryRouter>
        <Layout />
      </MemoryRouter>
    );

    expect(screen.getByText(/dashboard/i)).toBeInTheDocument();
  });

  it('renders outlet for child routes', () => {
    mockUseAuth.mockReturnValue({
      user: { firstName: 'Test', lastName: 'User', role: 'system_admin' },
      logout: vi.fn(),
    });

    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <Layout />
      </MemoryRouter>
    );

    expect(document.querySelector('main')).toBeInTheDocument();
  });
});
