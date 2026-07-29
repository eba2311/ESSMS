import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi } from 'vitest';
import { DashboardPage } from '../DashboardPage';

const mockUseAuth = vi.fn();

vi.mock('../../../contexts/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

describe('DashboardPage', () => {
  it('renders dashboard title', () => {
    mockUseAuth.mockReturnValue({
      user: { firstName: 'Admin', lastName: 'User', role: 'system_admin' },
    });

    render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>
    );

    expect(screen.getByText(/dashboard/i)).toBeInTheDocument();
  });
});
